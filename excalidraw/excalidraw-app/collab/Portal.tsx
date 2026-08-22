import { CaptureUpdateAction } from "@excalidraw/excalidraw";
import { trackEvent } from "@excalidraw/excalidraw/analytics";
import { encryptData, decryptData } from "@excalidraw/excalidraw/data/encryption";
import { newElementWith } from "@excalidraw/element";
import throttle from "lodash.throttle";

import type { UserIdleState } from "@excalidraw/common";
import type { OrderedExcalidrawElement } from "@excalidraw/element/types";
import type {
  OnUserFollowedPayload,
  SocketId,
} from "@excalidraw/excalidraw/types";

import { WS_EVENTS, FILE_UPLOAD_TIMEOUT, WS_SUBTYPES } from "../app_constants";
import { isSyncableElement } from "../data";
import { supabase } from "../data/supabaseClient";

import type {
  SocketUpdateData,
  SocketUpdateDataSource,
  SyncableExcalidrawElement,
} from "../data";
import type { TCollabClass } from "./Collab";
import type { Socket } from "socket.io-client";

class Portal {
  collab: TCollabClass;
  socket: Socket | null = null;
  socketInitialized: boolean = false;
  roomId: string | null = null;
  roomKey: string | null = null;
  broadcastedElementVersions: Map<string, number> = new Map();
  supabaseChannel: any = null;
  clientId: string = "client_" + Math.random().toString(36).substring(2, 11);

  constructor(collab: TCollabClass) {
    this.collab = collab;
  }

  open(socket: Socket | null, id: string, key: string) {
    this.socket = socket;
    this.roomId = id;
    this.roomKey = key;

    // Initialize Supabase Realtime channel for instant E2EE room collaboration
    this.supabaseChannel = supabase.channel(`collab-room-${id}`, {
      config: {
        presence: {
          key: this.clientId,
        },
      },
    });

    this.supabaseChannel
      .on("broadcast", { event: "collab" }, async ({ payload }: any) => {
        if (
          payload &&
          payload.senderId !== this.clientId &&
          payload.senderId !== this.socket?.id
        ) {
          try {
            const encryptedBuffer = new Uint8Array(payload.encryptedBuffer).buffer;
            const iv = new Uint8Array(payload.iv);
            await this.collab.handleIncomingEncryptedPayload(
              encryptedBuffer,
              iv,
              this.collab.scenePromise,
            );
          } catch (err) {
            console.error("Error handling broadcast collab message:", err);
          }
        }
      })
      .on("broadcast", { event: "request-scene" }, async ({ payload }: any) => {
        if (payload && payload.senderId !== this.clientId) {
          const elements = this.collab.getSceneElementsIncludingDeleted();
          if (elements && elements.length > 0) {
            await this.broadcastScene(WS_SUBTYPES.INIT, elements, true);
          }
        }
      })
      .on("broadcast", { event: "collab-chat" }, ({ payload }: any) => {
        if (payload && payload.senderId !== this.clientId) {
          window.dispatchEvent(
            new CustomEvent("collab-chat-message", { detail: payload.data }),
          );
        }
      })
      .on("broadcast", { event: "collab-comment-create" }, async ({ payload }: any) => {
        if (payload && payload.senderId !== this.clientId) {
          if (payload.encryptedBuffer && payload.iv && this.roomKey) {
            try {
              const iv = new Uint8Array(payload.iv);
              const buffer = new Uint8Array(payload.encryptedBuffer).buffer;
              const decrypted = await decryptData(iv, buffer, this.roomKey);
              const decoded = new TextDecoder("utf-8").decode(
                new Uint8Array(decrypted),
              );
              const comment = JSON.parse(decoded);
              window.dispatchEvent(
                new CustomEvent("collab-comment-create", { detail: comment }),
              );
            } catch (err) {
              console.error("Error decrypting Supabase comment broadcast:", err);
            }
          } else if (payload.comment) {
            window.dispatchEvent(
              new CustomEvent("collab-comment-create", {
                detail: payload.comment,
              }),
            );
          }
        }
      })
      .on("broadcast", { event: "collab-comment-resolve" }, async ({ payload }: any) => {
        if (payload && payload.senderId !== this.clientId) {
          if (payload.encryptedBuffer && payload.iv && this.roomKey) {
            try {
              const iv = new Uint8Array(payload.iv);
              const buffer = new Uint8Array(payload.encryptedBuffer).buffer;
              const decrypted = await decryptData(iv, buffer, this.roomKey);
              const decoded = new TextDecoder("utf-8").decode(
                new Uint8Array(decrypted),
              );
              const data = JSON.parse(decoded);
              window.dispatchEvent(
                new CustomEvent("collab-comment-resolve", {
                  detail: data.commentId || data,
                }),
              );
            } catch (err) {
              console.error("Error decrypting Supabase comment resolve broadcast:", err);
            }
          } else if (payload.commentId) {
            window.dispatchEvent(
              new CustomEvent("collab-comment-resolve", {
                detail: payload.commentId,
              }),
            );
          }
        }
      })
      .on("presence", { event: "sync" }, () => {
        const state = this.supabaseChannel.presenceState();
        const userIds = Object.keys(state) as SocketId[];
        this.collab.setCollaborators(userIds);
      })
      .on("presence", { event: "join" }, async ({ key, newPresences }: any) => {
        if (key !== this.clientId && newPresences?.length > 0) {
          window.dispatchEvent(
            new CustomEvent("collab-user-join", { detail: { socketId: key } }),
          );
          // Emitir inmediatamente el lienzo completo al nuevo colaborador que se conecta
          const elements = this.collab.getSceneElementsIncludingDeleted();
          if (elements && elements.length > 0) {
            await this.broadcastScene(WS_SUBTYPES.INIT, elements, true);
          }
        }
      })
      .on("presence", { event: "leave" }, ({ key }: any) => {
        if (key !== this.clientId) {
          window.dispatchEvent(
            new CustomEvent("collab-user-leave", { detail: { socketId: key } }),
          );
        }
      })
      .subscribe(async (status: string) => {
        if (status === "SUBSCRIBED") {
          this.socketInitialized = true;
          trackEvent("share", "room joined");
          try {
            await this.supabaseChannel.track({
              username: this.collab.state.username || "Colaborador",
              onlineAt: Date.now(),
            });
            // Solicitar el lienzo existente al anfitrión con reintentos para asegurar recepción
            const sendSceneRequest = () => {
              if (this.supabaseChannel) {
                this.supabaseChannel.send({
                  type: "broadcast",
                  event: "request-scene",
                  payload: { senderId: this.clientId },
                });
              }
            };
            sendSceneRequest();
            setTimeout(sendSceneRequest, 400);
            setTimeout(sendSceneRequest, 1200);
          } catch (e) {
            console.error("Error tracking presence in collab room:", e);
          }
        }
      });

    // Optional: Socket.IO listeners if custom socket is available
    if (this.socket) {
      this.socket.on("init-room", () => {
        if (this.socket) {
          const urlRole = new URLSearchParams(window.location.search).get("role") || "editor";
          this.socket.emit("join-room", this.roomId, urlRole, this.roomKey);
        }
      });
      this.socket.on("new-user", async (_socketId: string) => {
        this.broadcastScene(
          WS_SUBTYPES.INIT,
          this.collab.getSceneElementsIncludingDeleted(),
          true,
        );
      });
      this.socket.on("room-user-change", (clients: SocketId[]) => {
        this.collab.setCollaborators(clients);
      });
    }

    return socket;
  }

  close() {
    if (this.supabaseChannel) {
      try {
        supabase.removeChannel(this.supabaseChannel);
      } catch (err) {
        console.warn("Error closing supabase collab channel:", err);
      }
      this.supabaseChannel = null;
    }
    this.queueFileUpload.flush();
    if (this.socket) {
      try {
        this.socket.close();
      } catch (err) {
        console.warn("Error closing socket client:", err);
      }
      this.socket = null;
    }
    this.roomId = null;
    this.roomKey = null;
    this.socketInitialized = false;
    this.broadcastedElementVersions = new Map();
  }

  isOpen() {
    return !!(
      this.socketInitialized &&
      this.roomId &&
      this.roomKey
    );
  }

  async _broadcastSocketData(
    data: SocketUpdateData,
    volatile: boolean = false,
    roomId?: string,
  ) {
    if (this.isOpen()) {
      const json = JSON.stringify(data);
      const encoded = new TextEncoder().encode(json);
      const { encryptedBuffer, iv } = await encryptData(this.roomKey!, encoded);

      if (this.socket && this.socket.connected) {
        this.socket.emit(
          volatile ? WS_EVENTS.SERVER_VOLATILE : WS_EVENTS.SERVER,
          roomId ?? this.roomId,
          encryptedBuffer,
          iv,
        );
      }

      // Broadcast over Supabase Realtime channel (instant E2EE)
      if (this.supabaseChannel && this.socketInitialized) {
        this.supabaseChannel.send({
          type: "broadcast",
          event: "collab",
          payload: {
            senderId: this.clientId,
            encryptedBuffer: Array.from(new Uint8Array(encryptedBuffer)),
            iv: Array.from(iv),
          },
        });
      }
    }
  }

  queueFileUpload = throttle(async () => {
    try {
      await this.collab.fileManager.saveFiles({
        elements: this.collab.excalidrawAPI.getSceneElementsIncludingDeleted(),
        files: this.collab.excalidrawAPI.getFiles(),
      });
    } catch (error: any) {
      if (error.name !== "AbortError") {
        this.collab.excalidrawAPI.updateScene({
          appState: {
            errorMessage: error.message,
          },
        });
      }
    }

    let isChanged = false;
    const newElements = this.collab.excalidrawAPI
      .getSceneElementsIncludingDeleted()
      .map((element) => {
        if (this.collab.fileManager.shouldUpdateImageElementStatus(element)) {
          isChanged = true;
          return newElementWith(element, { status: "saved" });
        }
        return element;
      });

    if (isChanged) {
      this.collab.excalidrawAPI.updateScene({
        elements: newElements,
        captureUpdate: CaptureUpdateAction.NEVER,
      });
    }
  }, FILE_UPLOAD_TIMEOUT);

  broadcastScene = async (
    updateType: WS_SUBTYPES.INIT | WS_SUBTYPES.UPDATE,
    elements: readonly OrderedExcalidrawElement[],
    syncAll: boolean,
  ) => {
    if (updateType === WS_SUBTYPES.INIT && !syncAll) {
      throw new Error("syncAll must be true when sending SCENE.INIT");
    }

    const syncableElements = elements.reduce((acc, element) => {
      if (
        (syncAll ||
          !this.broadcastedElementVersions.has(element.id) ||
          element.version > this.broadcastedElementVersions.get(element.id)!) &&
        isSyncableElement(element)
      ) {
        acc.push(element);
      }
      return acc;
    }, [] as SyncableExcalidrawElement[]);

    const data: SocketUpdateDataSource[typeof updateType] = {
      type: updateType,
      payload: {
        elements: syncableElements,
      },
    };

    for (const syncableElement of syncableElements) {
      this.broadcastedElementVersions.set(
        syncableElement.id,
        syncableElement.version,
      );
    }

    this.queueFileUpload();

    await this._broadcastSocketData(data as SocketUpdateData);
  };

  broadcastIdleChange = (userState: UserIdleState) => {
    const senderId = (this.socket?.id || this.clientId) as SocketId;
    const data: SocketUpdateDataSource["IDLE_STATUS"] = {
      type: WS_SUBTYPES.IDLE_STATUS,
      payload: {
        socketId: senderId,
        userState,
        username: this.collab.state.username,
      },
    };
    return this._broadcastSocketData(
      data as SocketUpdateData,
      true, // volatile
    );
  };

  broadcastMouseLocation = (payload: {
    pointer: SocketUpdateDataSource["MOUSE_LOCATION"]["payload"]["pointer"];
    button: SocketUpdateDataSource["MOUSE_LOCATION"]["payload"]["button"];
  }) => {
    const senderId = (this.socket?.id || this.clientId) as SocketId;
    const data: SocketUpdateDataSource["MOUSE_LOCATION"] = {
      type: WS_SUBTYPES.MOUSE_LOCATION,
      payload: {
        socketId: senderId,
        pointer: payload.pointer,
        button: payload.button || "up",
        selectedElementIds:
          this.collab.excalidrawAPI.getAppState().selectedElementIds,
        username: this.collab.state.username,
      },
    };

    return this._broadcastSocketData(
      data as SocketUpdateData,
      true, // volatile
    );
  };

  broadcastVisibleSceneBounds = (
    payload: {
      sceneBounds: SocketUpdateDataSource["USER_VISIBLE_SCENE_BOUNDS"]["payload"]["sceneBounds"];
    },
    roomId: string,
  ) => {
    const senderId = (this.socket?.id || this.clientId) as SocketId;
    const data: SocketUpdateDataSource["USER_VISIBLE_SCENE_BOUNDS"] = {
      type: WS_SUBTYPES.USER_VISIBLE_SCENE_BOUNDS,
      payload: {
        socketId: senderId,
        username: this.collab.state.username,
        sceneBounds: payload.sceneBounds,
      },
    };

    return this._broadcastSocketData(
      data as SocketUpdateData,
      true, // volatile
      roomId,
    );
  };

  broadcastUserFollowed = (payload: OnUserFollowedPayload) => {
    if (this.socket && this.socket.connected) {
      this.socket.emit(WS_EVENTS.USER_FOLLOW_CHANGE, payload);
    }
  };
}

export default Portal;
