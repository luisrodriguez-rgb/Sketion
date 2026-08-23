import {
  compressData,
  decompressData,
} from "@excalidraw/excalidraw/data/encode";
import { generateEncryptionKey } from "@excalidraw/excalidraw/data/encryption";
import { serializeAsJSON } from "@excalidraw/excalidraw/data/json";
import { isInvisiblySmallElement } from "@excalidraw/element";
import { t } from "@excalidraw/excalidraw/i18n";
import { bytesToHexString } from "@excalidraw/common";

import type { UserIdleState } from "@excalidraw/common";
import type { ImportedDataState } from "@excalidraw/excalidraw/data/types";
import type { SceneBounds } from "@excalidraw/element";
import type {
  ExcalidrawElement,
  OrderedExcalidrawElement,
} from "@excalidraw/element/types";
import type {
  AppState,
  BinaryFiles,
  SocketId,
} from "@excalidraw/excalidraw/types";
import type { MakeBrand } from "@excalidraw/common/utility-types";

import { DELETED_ELEMENT_TIMEOUT, ROOM_ID_BYTES } from "../app_constants";
import { supabase } from "./supabaseClient";

import type { WS_SUBTYPES } from "../app_constants";

export type SyncableExcalidrawElement = OrderedExcalidrawElement &
  MakeBrand<"SyncableExcalidrawElement">;

export const isSyncableElement = (
  element: OrderedExcalidrawElement,
): element is SyncableExcalidrawElement => {
  if (element.isDeleted) {
    if (element.updated > Date.now() - DELETED_ELEMENT_TIMEOUT) {
      return true;
    }
    return false;
  }
  return !isInvisiblySmallElement(element);
};

export const getSyncableElements = (
  elements: readonly OrderedExcalidrawElement[],
) =>
  elements.filter((element) =>
    isSyncableElement(element),
  ) as SyncableExcalidrawElement[];

const generateRoomId = async () => {
  const buffer = new Uint8Array(ROOM_ID_BYTES);
  window.crypto.getRandomValues(buffer);
  return bytesToHexString(buffer);
};

export type EncryptedData = {
  data: ArrayBuffer;
  iv: Uint8Array;
};

export type SocketUpdateDataSource = {
  INVALID_RESPONSE: {
    type: WS_SUBTYPES.INVALID_RESPONSE;
  };
  SCENE_INIT: {
    type: WS_SUBTYPES.INIT;
    payload: {
      elements: readonly OrderedExcalidrawElement[];
    };
  };
  SCENE_UPDATE: {
    type: WS_SUBTYPES.UPDATE;
    payload: {
      elements: readonly OrderedExcalidrawElement[];
    };
  };
  MOUSE_LOCATION: {
    type: WS_SUBTYPES.MOUSE_LOCATION;
    payload: {
      socketId: SocketId;
      pointer: { x: number; y: number; tool: "pointer" | "laser" };
      button: "down" | "up";
      selectedElementIds: AppState["selectedElementIds"];
      username: string;
    };
  };
  USER_VISIBLE_SCENE_BOUNDS: {
    type: WS_SUBTYPES.USER_VISIBLE_SCENE_BOUNDS;
    payload: {
      socketId: SocketId;
      username: string;
      sceneBounds: SceneBounds;
    };
  };
  IDLE_STATUS: {
    type: WS_SUBTYPES.IDLE_STATUS;
    payload: {
      socketId: SocketId;
      userState: UserIdleState;
      username: string;
    };
  };
};

export type SocketUpdateDataIncoming =
  SocketUpdateDataSource[keyof SocketUpdateDataSource];

export type SocketUpdateData =
  SocketUpdateDataSource[keyof SocketUpdateDataSource] & {
    _brand: "socketUpdateData";
  };

const RE_COLLAB_LINK = /^#room=([a-zA-Z0-9_-]+),([a-zA-Z0-9_-]+)$/;

export const isCollaborationLink = (link: string) => {
  const hash = new URL(link).hash;
  return RE_COLLAB_LINK.test(hash);
};

export const getCollaborationLinkData = (link: string) => {
  const hash = new URL(link).hash;
  const match = hash.match(RE_COLLAB_LINK);
  if (match && match[2].length !== 22) {
    window.alert(t("alerts.invalidEncryptionKey"));
    return null;
  }
  return match ? { roomId: match[1], roomKey: match[2] } : null;
};

export const generateCollaborationLinkData = async () => {
  const roomId = await generateRoomId();
  const roomKey = await generateEncryptionKey();

  if (!roomKey) {
    throw new Error("Couldn't generate room key");
  }

  return { roomId, roomKey };
};

export const getCollaborationLink = (data: {
  roomId: string;
  roomKey: string;
}) => {
  return `${window.location.origin}${window.location.pathname}#room=${data.roomId},${data.roomKey}`;
};

type ExportToBackendResult =
  | { url: null; errorMessage: string }
  | { url: string; errorMessage: null };

export const exportToBackend = async (
  elements: readonly ExcalidrawElement[],
  appState: Partial<AppState>,
  files: BinaryFiles,
): Promise<ExportToBackendResult> => {
  try {
    const { supabase } = await import("./supabaseClient");

    // Generate a unique ID and encryption key
    const encryptionKey = await generateEncryptionKey("string");
    const id = Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Serialize and compress
    const serialized = serializeAsJSON(elements, appState, {}, "database");
    const compressed = await compressData(new TextEncoder().encode(serialized), {
      encryptionKey,
    });

    // Chunked Base64 encoding to avoid stack overflow on large drawings
    const bytes = new Uint8Array(compressed.buffer, compressed.byteOffset, compressed.byteLength);
    let binary = "";
    const len = bytes.byteLength;
    const CHUNK_SIZE = 0x8000;
    for (let i = 0; i < len; i += CHUNK_SIZE) {
      binary += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, Math.min(i + CHUNK_SIZE, len))),
      );
    }
    const payloadBase64 = btoa(binary);

    // CN-003: Store only encrypted payload in Supabase (Zero-Knowledge E2E encryption).
    // The encryption key remains exclusively in the client-side URL hash.
    const { error } = await supabase.from("shared_links").insert({
      id,
      data: payloadBase64,
    });

    if (error) {
      console.error("Supabase shared link error:", error);
      return {
        url: null,
        errorMessage: t("alerts.couldNotCreateShareableLink"),
      };
    }

    // Build the shareable URL using only the origin to avoid conflicts
    // with any active board hash/session
    const url = new URL(window.location.origin);
    url.hash = `json=${id},${encryptionKey}`;
    const urlString = url.toString();

    return { url: urlString, errorMessage: null };
  } catch (error: any) {
    console.error("exportToBackend error:", error);
    return {
      url: null,
      errorMessage: t("alerts.couldNotCreateShareableLink"),
    };
  }
};

export const importFromBackend = async (
  id: string,
  decryptionKey: string,
): Promise<ImportedDataState> => {
  try {
    const { supabase } = await import("./supabaseClient");

    const { data: row, error } = await supabase
      .from("shared_links")
      .select("data")
      .eq("id", id)
      .single();

    if (error || !row?.data) {
      throw new Error("Could not load shared link data");
    }

    const binaryStr = atob(row.data);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const { data: decompressed } = await decompressData(bytes, {
      decryptionKey,
    });

    const decoded = new TextDecoder().decode(decompressed);
    const parsed = JSON.parse(decoded);
    return {
      elements: parsed.elements || [],
      appState: parsed.appState,
      files: parsed.files || {},
    };
  } catch (error: any) {
    console.error("importFromBackend error:", error);
    window.alert(t("alerts.importBackendFailed"));
    return {};
  }
};

/**
 * Guarda una instantánea cifrada E2E de la sala colaborativa en Supabase (shared_links).
 * La clave de cifrado nunca toca el servidor (Zero-Knowledge).
 */
export const saveRoomToSupabase = async (
  roomId: string,
  roomKey: string,
  elements: readonly SyncableExcalidrawElement[],
  appState: any,
) => {
  try {
    const json = JSON.stringify({
      elements,
      appState: {
        viewBackgroundColor: appState?.viewBackgroundColor || "#F8FAFC",
      },
    });

    const compressed = await compressData(
      new TextEncoder().encode(json),
      {
        encryptionKey: roomKey,
      },
    );

    const bytes = new Uint8Array(compressed.buffer, compressed.byteOffset, compressed.byteLength);
    let binary = "";
    const len = bytes.byteLength;
    const CHUNK_SIZE = 0x8000;
    for (let i = 0; i < len; i += CHUNK_SIZE) {
      binary += String.fromCharCode.apply(
        null,
        Array.from(bytes.subarray(i, Math.min(i + CHUNK_SIZE, len))),
      );
    }
    const payloadBase64 = btoa(binary);

    await supabase.from("shared_links").upsert({
      id: `room_${roomId}`,
      data: payloadBase64,
    });
  } catch (err) {
    console.warn("Could not save collab room snapshot to Supabase:", err);
  }
};

/**
 * Carga y descifra la instantánea de la sala colaborativa desde Supabase.
 */
export const loadRoomFromSupabase = async (
  roomId: string,
  roomKey: string,
): Promise<readonly SyncableExcalidrawElement[] | null> => {
  try {
    const { data: row, error } = await supabase
      .from("shared_links")
      .select("data")
      .eq("id", `room_${roomId}`)
      .single();

    if (error || !row?.data) {
      return null;
    }

    const binaryStr = atob(row.data);
    const len = binaryStr.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryStr.charCodeAt(i);
    }

    const { data: decompressed } = await decompressData(bytes, {
      decryptionKey: roomKey,
    });

    const decoded = new TextDecoder().decode(decompressed);
    const parsed = JSON.parse(decoded);
    return parsed.elements || [];
  } catch (err) {
    console.warn("Could not load collab room from Supabase:", err);
    return null;
  }
};

