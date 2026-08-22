import { createStore, get, set, del } from "idb-keyval";

import { supabase } from "./supabaseClient";
import { compressBinaryFiles } from "./imageOptimizer";

export interface BoardMetadata {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  isCollaboration?: boolean;
  roomId?: string;
  roomKey?: string;
  tags?: string[];
  folderId?: string;
  password?: string;
  isTemplate?: boolean;
  preview?: string;
  notesCount?: number;
  commentsCount?: number;
  collaboratorsCount?: number;
  isFavorite?: boolean;
  isDeleted?: boolean;
}

export interface Board {
  id: string;
  name: string;
  createdAt: number;
  updatedAt: number;
  elements: readonly any[];
  appState: any;
  files: Record<string, any>;
  isCollaboration?: boolean;
  roomId?: string;
  roomKey?: string;
  tags?: string[];
  folderId?: string;
  password?: string;
  isTemplate?: boolean;
  preview?: string;
  notesCount?: number;
  commentsCount?: number;
  collaboratorsCount?: number;
  isFavorite?: boolean;
  isDeleted?: boolean;
}

const boardsStore = createStore("excalidraw-boards-db", "boards-store");
const METADATA_KEY = "boards_metadata_list";

export async function getBoardsMetadata(): Promise<BoardMetadata[]> {
  try {
    const list = await get<BoardMetadata[]>(METADATA_KEY, boardsStore);
    return list || [];
  } catch (error) {
    console.error("Error reading boards metadata:", error);
    return [];
  }
}

export async function saveBoardsMetadata(
  metadata: BoardMetadata[],
): Promise<void> {
  try {
    await set(METADATA_KEY, metadata, boardsStore);
  } catch (error: any) {
    if (error?.name === "QuotaExceededError") {
      console.warn(
        "[IndexedDB Quota] Límite de almacenamiento excedido al guardar metadatos de tableros.",
      );
    } else {
      console.error("Error saving boards metadata:", error);
    }
  }
}

export async function getBoard(id: string): Promise<Board | null> {
  try {
    const board = await get<Board>(`board_content_${id}`, boardsStore);
    if (board) {
      return board;
    }

    if (id && id !== "collab_room" && id !== "board_default") {
      try {
        const { data: remoteBoard, error } = await supabase
          .from("boards")
          .select("*")
          .eq("id", id)
          .single();

        if (remoteBoard && !error) {
          const loadedBoard: Board = {
            id: remoteBoard.id,
            name: remoteBoard.name || "Untitled Board",
            createdAt: new Date(remoteBoard.created_at).getTime(),
            updatedAt: new Date(remoteBoard.updated_at).getTime(),
            elements: remoteBoard.elements || [],
            appState: remoteBoard.app_state || {},
            files: remoteBoard.files || {},
            tags: remoteBoard.tags || [],
            folderId: remoteBoard.folder_id,
            password: remoteBoard.password,
            isTemplate: remoteBoard.is_template,
            isDeleted: remoteBoard.is_deleted,
            isFavorite: remoteBoard.is_favorite || false,
            notesCount: remoteBoard.notes_count || 0,
            commentsCount: remoteBoard.comments_count || 0,
            collaboratorsCount: remoteBoard.collaborators_count || 0,
            isCollaboration: remoteBoard.is_collaboration || false,
            roomId: remoteBoard.room_id || undefined,
            roomKey: remoteBoard.room_key || undefined,
          };
          await set(`board_content_${id}`, loadedBoard, boardsStore);
          return loadedBoard;
        }
      } catch (remoteErr) {
        console.warn(`Could not fetch remote board ${id} from Supabase:`, remoteErr);
      }
    }

    return null;
  } catch (error) {
    console.error(`Error reading board ${id}:`, error);
    return null;
  }
}

// Debounce map to handle remote Supabase synchronization
const pendingSyncs = new Map<string, { timer: NodeJS.Timeout; callback: () => Promise<void> }>();

function debounceSupabaseSync(
  id: string,
  callback: () => Promise<void>,
  delay: number,
) {
  if (pendingSyncs.has(id)) {
    clearTimeout(pendingSyncs.get(id)!.timer);
  }
  const timer = setTimeout(() => {
    pendingSyncs.delete(id);
    callback().catch((err) =>
      console.error("Error in debounced Supabase sync:", err),
    );
  }, delay);
  pendingSyncs.set(id, { timer, callback });
}

/**
 * Fuerza el guardado inmediato a Supabase de sincronizaciones pendientes sin esperar el debounce
 */
export async function flushPendingSupabaseSync(id?: string): Promise<void> {
  if (id) {
    const pending = pendingSyncs.get(id);
    if (pending) {
      clearTimeout(pending.timer);
      pendingSyncs.delete(id);
      try {
        await pending.callback();
      } catch (err) {
        console.error("Error flushing pending Supabase sync for board", id, err);
      }
    }
  } else {
    const entries = Array.from(pendingSyncs.entries());
    pendingSyncs.clear();
    await Promise.all(
      entries.map(async ([boardId, pending]) => {
        clearTimeout(pending.timer);
        try {
          await pending.callback();
        } catch (err) {
          console.error("Error flushing pending Supabase sync for board", boardId, err);
        }
      }),
    );
  }
}

/**
 * Reconciliación elemento a elemento para evitar pérdida de datos en sincronizaciones concurrentes
 */
export function mergeElements(
  localEls: readonly any[] = [],
  remoteEls: readonly any[] = [],
): any[] {
  const elementMap = new Map<string, any>();
  for (const el of localEls) {
    if (el && el.id) {
      elementMap.set(el.id, el);
    }
  }
  for (const remoteEl of remoteEls) {
    if (!remoteEl || !remoteEl.id) continue;
    const localEl = elementMap.get(remoteEl.id);
    if (!localEl) {
      elementMap.set(remoteEl.id, remoteEl);
    } else {
      const localVersion = localEl.version || 0;
      const remoteVersion = remoteEl.version || 0;
      const localUpdated = localEl.updated || 0;
      const remoteUpdated = remoteEl.updated || 0;
      if (
        remoteVersion > localVersion ||
        (remoteVersion === localVersion && remoteUpdated >= localUpdated)
      ) {
        elementMap.set(remoteEl.id, remoteEl);
      }
    }
  }
  return Array.from(elementMap.values());
}

export function optimizeElements(elements: readonly any[]): any[] {
  if (!elements) return [];
  return elements.map((el) => {
    if (!el) return el;
    const pruned: any = { ...el };

    // 1. Round coordinate arrays (points) to 1 decimal place (crucial for drawings/freehand)
    if (Array.isArray(pruned.points)) {
      pruned.points = pruned.points.map((pt: any) => {
        if (Array.isArray(pt)) {
          return pt.map((val) => typeof val === "number" ? Math.round(val * 10) / 10 : val);
        }
        return pt;
      });
    }

    // 2. Round positions and dimensions to 1 decimal place
    if (typeof pruned.x === "number") pruned.x = Math.round(pruned.x * 10) / 10;
    if (typeof pruned.y === "number") pruned.y = Math.round(pruned.y * 10) / 10;
    if (typeof pruned.width === "number") pruned.width = Math.round(pruned.width * 10) / 10;
    if (typeof pruned.height === "number") pruned.height = Math.round(pruned.height * 10) / 10;

    // 3. Remove transient/editor-only attributes that shouldn't persist
    delete pruned.customData;

    return pruned;
  });
}

export async function saveBoard(
  id: string,
  data: Partial<Omit<Board, "id">> & { name?: string },
  elements?: readonly any[],
  appState?: any,
  files?: any,
): Promise<void> {
  const now = Date.now();
  const currentBoard = await getBoard(id);

  const rawFiles = files !== undefined ? files : currentBoard?.files || {};
  const optimizedFiles = await compressBinaryFiles(rawFiles);
  const optimizedElements = elements !== undefined ? optimizeElements(elements) : currentBoard?.elements || [];

  const updatedBoard: Board = {
    id,
    name:
      data.name !== undefined
        ? data.name
        : currentBoard?.name || "Untitled Board",
    createdAt: currentBoard?.createdAt || now,
    updatedAt: now,
    elements: optimizedElements,
    appState: appState !== undefined ? appState : currentBoard?.appState || {},
    files: optimizedFiles,
    isCollaboration:
      data.isCollaboration !== undefined
        ? data.isCollaboration
        : currentBoard?.isCollaboration,
    roomId: data.roomId !== undefined ? data.roomId : currentBoard?.roomId,
    roomKey: data.roomKey !== undefined ? data.roomKey : currentBoard?.roomKey,
    tags: data.tags !== undefined ? data.tags : currentBoard?.tags || [],
    folderId:
      data.folderId !== undefined ? data.folderId : currentBoard?.folderId,
    password:
      data.password !== undefined ? data.password : currentBoard?.password,
    isTemplate:
      data.isTemplate !== undefined ? data.isTemplate : currentBoard?.isTemplate || false,
    preview:
      data.preview !== undefined ? data.preview : currentBoard?.preview,
    notesCount:
      data.notesCount !== undefined ? data.notesCount : currentBoard?.notesCount || 0,
    commentsCount:
      data.commentsCount !== undefined ? data.commentsCount : currentBoard?.commentsCount || 0,
    collaboratorsCount:
      data.collaboratorsCount !== undefined ? data.collaboratorsCount : currentBoard?.collaboratorsCount || 0,
    isFavorite:
      data.isFavorite !== undefined ? data.isFavorite : currentBoard?.isFavorite || false,
    isDeleted:
      data.isDeleted !== undefined ? data.isDeleted : currentBoard?.isDeleted || false,
  };

  try {
    await set(`board_content_${id}`, updatedBoard, boardsStore);
  } catch (err: any) {
    if (err?.name === "QuotaExceededError") {
      console.warn(
        `[IndexedDB Quota] Cuota de almacenamiento excedida para el tablero ${id}.`,
      );
    } else {
      console.error(`Error saving board ${id} to IndexedDB:`, err);
    }
  }

  if (elements !== undefined) {
    saveBoardVersion(id, optimizedElements, appState, files).catch((err) =>
      console.error("Error saving board version history:", err),
    );
  }

  // Trigger remote save to Supabase asynchronously with debounce to prevent database write timeouts
  debounceSupabaseSync(id, async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      try {
        // Only persist lightweight subset of app_state to avoid 500/payload-too-large errors
        const minimalAppState = updatedBoard.appState
          ? {
              viewBackgroundColor:
                (updatedBoard.appState as any).viewBackgroundColor ??
                "#ffffff",
              theme: (updatedBoard.appState as any).theme ?? "light",
              preview: updatedBoard.preview, // Keep thumbnail synchronized
            }
          : { viewBackgroundColor: "#ffffff", theme: "light" };

        const { error } = await supabase.from("boards").upsert({
          id,
          user_id: session.user.id,
          name: updatedBoard.name,
          elements: updatedBoard.elements,
          app_state: minimalAppState,
          files: updatedBoard.files,
          tags: updatedBoard.tags || [],
          folder_id: updatedBoard.folderId || null,
          password: updatedBoard.password || null,
          is_template: updatedBoard.isTemplate || false,
          is_deleted: updatedBoard.isDeleted || false,
          is_favorite: updatedBoard.isFavorite || false,
          notes_count: updatedBoard.notesCount || 0,
          comments_count: updatedBoard.commentsCount || 0,
          collaborators_count: updatedBoard.collaboratorsCount || 0,
          is_collaboration: updatedBoard.isCollaboration || false,
          room_id: updatedBoard.roomId || null,
          room_key: updatedBoard.roomKey || null,
          updated_at: new Date(updatedBoard.updatedAt).toISOString(),
        });
        if (error) {
          console.error("Supabase boards upsert error:", error.message, error.code);
        }
      } catch (err) {
        console.error("Error upserting remote board to Supabase:", err);
      }
    }
  }, 3000);

  // Update metadata list
  const metadataList = await getBoardsMetadata();
  const index = metadataList.findIndex((item) => item.id === id);
  const newMetadata: BoardMetadata = {
    id,
    name: updatedBoard.name,
    createdAt: updatedBoard.createdAt,
    updatedAt: updatedBoard.updatedAt,
    isCollaboration: updatedBoard.isCollaboration,
    roomId: updatedBoard.roomId,
    roomKey: updatedBoard.roomKey,
    tags: updatedBoard.tags,
    folderId: updatedBoard.folderId,
    password: updatedBoard.password,
    isTemplate: updatedBoard.isTemplate,
    preview: updatedBoard.preview,
    notesCount: updatedBoard.notesCount,
    commentsCount: updatedBoard.commentsCount,
    collaboratorsCount: updatedBoard.collaboratorsCount,
    isFavorite: updatedBoard.isFavorite,
    isDeleted: updatedBoard.isDeleted,
  };

  if (index > -1) {
    metadataList[index] = newMetadata;
  } else {
    metadataList.push(newMetadata);
  }

  // Sort by updatedAt descending
  metadataList.sort((a, b) => b.updatedAt - a.updatedAt);
  await saveBoardsMetadata(metadataList);
}

export async function deleteBoard(id: string): Promise<void> {
  // Soft delete: set isDeleted = true locally and in Supabase
  const board = await getBoard(id);
  if (board) {
    board.isDeleted = true;
    await set(`board_content_${id}`, board, boardsStore);
  }

  const metadataList = await getBoardsMetadata();
  const index = metadataList.findIndex((item) => item.id === id);
  if (index > -1) {
    metadataList[index].isDeleted = true;
    await saveBoardsMetadata(metadataList);
  }

  // Trigger remote soft delete asynchronously
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) {
      try {
        await supabase.from("boards").update({
          is_deleted: true,
          updated_at: new Date().toISOString(),
        }).eq("id", id);
      } catch (err) {
        console.error("Error soft-deleting remote board from Supabase:", err);
      }
    }
  });
}

export async function deleteBoardPermanently(id: string): Promise<void> {
  await del(`board_content_${id}`, boardsStore);
  const metadataList = await getBoardsMetadata();
  const filtered = metadataList.filter((item) => item.id !== id);
  await saveBoardsMetadata(filtered);

  // Trigger remote hard delete asynchronously
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) {
      try {
        await supabase.from("boards").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting remote board permanently from Supabase:", err);
      }
    }
  });
}

export async function restoreBoard(id: string): Promise<void> {
  const board = await getBoard(id);
  if (board) {
    board.isDeleted = false;
    await set(`board_content_${id}`, board, boardsStore);
  }

  const metadataList = await getBoardsMetadata();
  const index = metadataList.findIndex((item) => item.id === id);
  if (index > -1) {
    metadataList[index].isDeleted = false;
    await saveBoardsMetadata(metadataList);
  }

  // Trigger remote restore asynchronously
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) {
      try {
        await supabase.from("boards").update({
          is_deleted: false,
          updated_at: new Date().toISOString(),
        }).eq("id", id);
      } catch (err) {
        console.error("Error restoring remote board in Supabase:", err);
      }
    }
  });
}

export async function duplicateBoard(
  id: string,
  newName: string,
): Promise<string> {
  const source = await getBoard(id);
  if (!source) {
    throw new Error("Source board not found");
  }
  const newId = `board_${crypto.randomUUID().replace(/-/g, "").substring(0, 12)}`;

  await saveBoard(
    newId,
    {
      name: newName,
      isCollaboration: false,
    },
    source.elements,
    source.appState,
    source.files,
  );
  return newId;
}

export interface Folder {
  id: string;
  name: string;
  createdAt: number;
}

const FOLDERS_KEY = "boards_folders_list";

export async function getFolders(): Promise<Folder[]> {
  try {
    const list = await get<Folder[]>(FOLDERS_KEY, boardsStore);
    return list || [];
  } catch (error) {
    console.error("Error reading folders:", error);
    return [];
  }
}

export async function saveFolders(folders: Folder[]): Promise<void> {
  await set(FOLDERS_KEY, folders, boardsStore);
}

export async function createFolder(name: string): Promise<Folder> {
  const id = `folder_${crypto.randomUUID().replace(/-/g, "").substring(0, 12)}`;

  const folder: Folder = {
    id,
    name,
    createdAt: Date.now(),
  };
  const folders = await getFolders();
  folders.push(folder);
  await saveFolders(folders);

  // Sync to remote
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) {
      try {
        await supabase.from("folders").insert({
          id,
          user_id: session.user.id,
          name,
          created_at: new Date(folder.createdAt).toISOString(),
        });
      } catch (err) {
        console.error("Error creating remote folder:", err);
      }
    }
  });

  return folder;
}

export async function deleteFolder(id: string): Promise<void> {
  const folders = await getFolders();
  const filtered = folders.filter((f) => f.id !== id);
  await saveFolders(filtered);

  // Sync to remote
  supabase.auth.getSession().then(async ({ data: { session } }) => {
    if (session?.user) {
      try {
        await supabase.from("folders").delete().eq("id", id);
      } catch (err) {
        console.error("Error deleting remote folder:", err);
      }
    }
  });

  // Also remove folderId from any board metadata that had it
  const metadataList = await getBoardsMetadata();
  let changed = false;
  metadataList.forEach((m) => {
    if (m.folderId === id) {
      m.folderId = undefined;
      changed = true;
    }
  });
  if (changed) {
    await saveBoardsMetadata(metadataList);
  }
}

export interface BoardVersion {
  id: string;
  timestamp: number;
  elementsCount: number;
}

export async function getBoardVersions(
  boardId: string,
): Promise<BoardVersion[]> {
  try {
    const list = await get<BoardVersion[]>(
      `board_history_${boardId}`,
      boardsStore,
    );
    return list || [];
  } catch (error) {
    console.error(`Error reading history for board ${boardId}:`, error);
    return [];
  }
}

export async function saveBoardVersion(
  boardId: string,
  elements: readonly any[],
  appState: any,
  files: any,
): Promise<void> {
  const versions = await getBoardVersions(boardId);
  const now = Date.now();

  // Rate limit snapshots to at least 15 seconds to prevent performance bottlenecks
  if (versions.length > 0) {
    const lastVersion = versions[versions.length - 1];
    if (now - lastVersion.timestamp < 15000) {
      return;
    }
  }

  const versionId = `ver_${now}`;
  const newVersion: BoardVersion = {
    id: versionId,
    timestamp: now,
    elementsCount: elements.length,
  };

  versions.push(newVersion);

  // Keep last 15 versions to save storage space
  if (versions.length > 15) {
    const removed = versions.shift();
    if (removed) {
      await del(`board_version_content_${boardId}_${removed.id}`, boardsStore);
    }
  }

  await set(`board_history_${boardId}`, versions, boardsStore);

  // Save elements and state, omitting files to save significant storage space
  await set(
    `board_version_content_${boardId}_${versionId}`,
    { elements, appState },
    boardsStore,
  );
}

export async function restoreBoardVersion(
  boardId: string,
  versionId: string,
): Promise<void> {
  try {
    const content = await get<{ elements: any[]; appState: any; files?: any }>(
      `board_version_content_${boardId}_${versionId}`,
      boardsStore,
    );
    if (content) {
      const currentBoard = await getBoard(boardId);
      if (currentBoard) {
        // Preservar y fusionar archivos binarios para evitar imágenes rotas
        const mergedFiles = {
          ...(currentBoard.files || {}),
          ...(content.files || {}),
        };
        await saveBoard(
          boardId,
          { name: currentBoard.name },
          content.elements,
          content.appState,
          mergedFiles,
        );
      }
    }
  } catch (err) {
    console.error("Error restoring board version:", err);
  }
}

export interface BoardCommentReply {
  id: string;
  author: string;
  text: string;
  createdAt: number;
}

export interface BoardComment {
  id: string;
  text: string;
  author: string;
  x: number;
  y: number;
  createdAt: number;
  resolved: boolean;
  replies?: BoardCommentReply[];
}

/**
 * Fusión atómica de comentarios y respuestas para evitar condiciones de carrera
 */
export function mergeComments(
  localComments: BoardComment[] = [],
  remoteComments: BoardComment[] = [],
): BoardComment[] {
  const commentMap = new Map<string, BoardComment>();

  // 1. Registrar comentarios locales
  localComments.forEach((c) => {
    if (c && c.id) {
      commentMap.set(c.id, { ...c });
    }
  });

  // 2. Fusionar comentarios remotos y sus respuestas internas
  remoteComments.forEach((rc) => {
    if (!rc || !rc.id) return;
    const existing = commentMap.get(rc.id);
    if (!existing) {
      commentMap.set(rc.id, rc);
    } else {
      const replyMap = new Map<string, BoardCommentReply>();
      (existing.replies || []).forEach((r) => replyMap.set(r.id, r));
      (rc.replies || []).forEach((r) => replyMap.set(r.id, r));
      existing.replies = Array.from(replyMap.values()).sort(
        (a, b) => a.createdAt - b.createdAt,
      );
      existing.resolved = rc.resolved !== undefined ? rc.resolved : existing.resolved;
      existing.text = rc.text || existing.text;
    }
  });

  return Array.from(commentMap.values());
}

export async function getBoardComments(
  boardId: string,
): Promise<BoardComment[]> {
  try {
    const list = await get<BoardComment[]>(
      `board_comments_${boardId}`,
      boardsStore,
    );
    return list || [];
  } catch (error) {
    console.error(`Error reading comments for board ${boardId}:`, error);
    return [];
  }
}

export async function saveBoardComments(
  boardId: string,
  comments: BoardComment[],
): Promise<void> {
  try {
    const existingComments = await getBoardComments(boardId);
    const merged = mergeComments(existingComments, comments);
    await set(`board_comments_${boardId}`, merged, boardsStore);

    const currentBoard = await getBoard(boardId);
    if (currentBoard) {
      currentBoard.appState = {
        ...(currentBoard.appState || {}),
        comments: merged,
      };
      currentBoard.updatedAt = Date.now();
      currentBoard.commentsCount = merged.filter((c) => !c.resolved).length;
      await set(`board_content_${boardId}`, currentBoard, boardsStore);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        try {
          await supabase.from("boards").upsert({
            id: boardId,
            user_id: session.user.id,
            name: currentBoard.name,
            elements: currentBoard.elements,
            app_state: currentBoard.appState,
            files: currentBoard.files,
            tags: currentBoard.tags || [],
            folder_id: currentBoard.folderId || null,
            password: currentBoard.password || null,
            comments_count: currentBoard.commentsCount,
            updated_at: new Date(currentBoard.updatedAt).toISOString(),
          });
        } catch (err) {
          console.error("Error syncing board comments to Supabase:", err);
        }
      }
    }
  } catch (err: any) {
    if (err?.name === "QuotaExceededError") {
      console.warn(
        "[IndexedDB Quota] Límite de almacenamiento alcanzado al guardar comentarios.",
      );
    } else {
      console.error("Error saving board comments:", err);
    }
  }
}

export async function syncBoardsWithSupabase(): Promise<void> {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session?.user) {
      return;
    }

    // 1. Fetch remote folders
    const { data: remoteFolders } = await supabase.from("folders").select("*");
    if (remoteFolders) {
      const localFolders = await getFolders();
      const mergedFolders = [...localFolders];
      let foldersChanged = false;

      remoteFolders.forEach((rf) => {
        if (!mergedFolders.some((lf) => lf.id === rf.id)) {
          mergedFolders.push({
            id: rf.id,
            name: rf.name,
            createdAt: new Date(rf.created_at).getTime(),
          });
          foldersChanged = true;
        }
      });
      if (foldersChanged) {
        await saveFolders(mergedFolders);
      }
    }

    const { data: remoteBoards } = await supabase
      .from("boards")
      .select("id, name, created_at, updated_at, tags, folder_id, password, is_template, is_deleted, is_favorite, notes_count, comments_count, collaborators_count, is_collaboration, room_id, room_key");
    if (remoteBoards) {
      const localMetadata = await getBoardsMetadata();
      let changed = false;
      const mergedMetadata = [...localMetadata];
 
      for (const rb of remoteBoards) {
        const index = mergedMetadata.findIndex((m) => m.id === rb.id);
        const remoteUpdated = new Date(rb.updated_at).getTime();
        const remoteMeta: BoardMetadata = {
          id: rb.id,
          name: rb.name,
          createdAt: new Date(rb.created_at).getTime(),
          updatedAt: remoteUpdated,
          tags: rb.tags || [],
          folderId: rb.folder_id || undefined,
          password: rb.password || undefined,
          isTemplate: rb.is_template || false,
          isDeleted: rb.is_deleted || false,
          isFavorite: rb.is_favorite || false,
          notesCount: rb.notes_count || 0,
          commentsCount: rb.comments_count || 0,
          collaboratorsCount: rb.collaborators_count || 0,
          isCollaboration: rb.is_collaboration || false,
          roomId: rb.room_id || undefined,
          roomKey: rb.room_key || undefined,
        };

        if (index === -1) {
          mergedMetadata.push(remoteMeta);
          changed = true;

          // Download board content
          const { data: boardContent } = await supabase
            .from("boards")
            .select("elements, app_state, files")
            .eq("id", rb.id)
            .single();
          if (boardContent) {
            await set(
              `board_content_${rb.id}`,
              {
                id: rb.id,
                name: rb.name,
                createdAt: remoteMeta.createdAt,
                updatedAt: remoteMeta.updatedAt,
                elements: boardContent.elements || [],
                appState: boardContent.app_state || {},
                files: boardContent.files || {},
                tags: remoteMeta.tags,
                folderId: remoteMeta.folderId,
                password: remoteMeta.password,
                isTemplate: remoteMeta.isTemplate,
                isDeleted: remoteMeta.isDeleted,
                isFavorite: remoteMeta.isFavorite,
                notesCount: remoteMeta.notesCount,
                commentsCount: remoteMeta.commentsCount,
                collaboratorsCount: remoteMeta.collaboratorsCount,
                isCollaboration: remoteMeta.isCollaboration,
                roomId: remoteMeta.roomId,
                roomKey: remoteMeta.roomKey,
                preview: (boardContent.app_state as any)?.preview || undefined,
              },
              boardsStore,
            );
            if ((boardContent.app_state as any)?.comments) {
              await set(
                `board_comments_${rb.id}`,
                (boardContent.app_state as any).comments,
                boardsStore,
              );
            }
          }
        } else {
          const localMeta = mergedMetadata[index];
          if (remoteUpdated > localMeta.updatedAt) {
            mergedMetadata[index] = remoteMeta;
            changed = true;

            // Redownload content y reconciliar elementos en lugar de sobreescritura destructiva
            const { data: boardContent } = await supabase
              .from("boards")
              .select("elements, app_state, files")
              .eq("id", rb.id)
              .single();
            if (boardContent) {
              const localBoard = await get<Board>(`board_content_${rb.id}`, boardsStore);
              const reconciledElements = mergeElements(localBoard?.elements || [], boardContent.elements || []);
              const mergedFiles = { ...(localBoard?.files || {}), ...(boardContent.files || {}) };

              await set(
                `board_content_${rb.id}`,
                {
                  id: rb.id,
                  name: rb.name,
                  createdAt: remoteMeta.createdAt,
                  updatedAt: Math.max(remoteMeta.updatedAt, localMeta.updatedAt),
                  elements: reconciledElements,
                  appState: boardContent.app_state || localBoard?.appState || {},
                  files: mergedFiles,
                  tags: remoteMeta.tags,
                  folderId: remoteMeta.folderId,
                  password: remoteMeta.password,
                  isTemplate: remoteMeta.isTemplate,
                  isDeleted: remoteMeta.isDeleted,
                  isFavorite: remoteMeta.isFavorite,
                  notesCount: remoteMeta.notesCount,
                  commentsCount: remoteMeta.commentsCount,
                  collaboratorsCount: remoteMeta.collaboratorsCount,
                  isCollaboration: remoteMeta.isCollaboration,
                  roomId: remoteMeta.roomId,
                  roomKey: remoteMeta.roomKey,
                  preview: (boardContent.app_state as any)?.preview || localBoard?.preview || undefined,
                },
                boardsStore,
              );
              if ((boardContent.app_state as any)?.comments) {
                await set(
                  `board_comments_${rb.id}`,
                  (boardContent.app_state as any).comments,
                  boardsStore,
                );
              }
            }
          } else if (localMeta.updatedAt > remoteUpdated) {
            // Local is newer, upload local to Supabase
            const content = await getBoard(rb.id);
            if (content) {
              await supabase.from("boards").upsert({
                id: rb.id,
                user_id: session.user.id,
                name: localMeta.name,
                elements: content.elements,
                app_state: content.appState,
                files: content.files,
                tags: localMeta.tags || [],
                folder_id: localMeta.folderId || null,
                password: localMeta.password || null,
                is_template: localMeta.isTemplate || false,
                is_deleted: localMeta.isDeleted || false,
                is_favorite: localMeta.isFavorite || false,
                notes_count: localMeta.notesCount || 0,
                comments_count: localMeta.commentsCount || 0,
                collaborators_count: localMeta.collaboratorsCount || 0,
                is_collaboration: localMeta.isCollaboration || false,
                room_id: localMeta.roomId || null,
                room_key: localMeta.roomKey || null,
                updated_at: new Date(localMeta.updatedAt).toISOString(),
              });
            }
          }
        }
      }

      if (changed) {
        mergedMetadata.sort((a, b) => b.updatedAt - a.updatedAt);
        await saveBoardsMetadata(mergedMetadata);
      }
    }
  } catch (error) {
    console.error("Error during Supabase synchronization:", error);
  }
}

// ==========================================
// Workspace Templates Database Module
// ==========================================

export interface TemplateMetadata {
  id: string;
  name: string;
  description?: string;
  category: "Business & Strategy" | "Product & Engineering" | "Design & UI";
  thumbnail?: string; // base64 representation of preview
  isPublic?: boolean;
  createdAt: number;
}

export interface WorkspaceTemplate extends TemplateMetadata {
  elements: readonly any[];
}

const TEMPLATES_METADATA_KEY = "workspace_templates_metadata_list";
const templatesStore = createStore("excalidraw-templates-db", "templates-store");

export async function getTemplatesMetadata(): Promise<TemplateMetadata[]> {
  try {
    const list = await get<TemplateMetadata[]>(TEMPLATES_METADATA_KEY, templatesStore);
    return list || [];
  } catch (error) {
    console.error("Error reading templates metadata:", error);
    return [];
  }
}

export async function saveTemplatesMetadata(metadataList: TemplateMetadata[]): Promise<void> {
  await set(TEMPLATES_METADATA_KEY, metadataList, templatesStore);
}

export async function getTemplate(id: string): Promise<WorkspaceTemplate | null> {
  try {
    const template = await get<WorkspaceTemplate>(`template_content_${id}`, templatesStore);
    return template || null;
  } catch (error) {
    console.error(`Error reading template ${id}:`, error);
    return null;
  }
}

export async function saveTemplate(
  id: string,
  name: string,
  category: "Business & Strategy" | "Product & Engineering" | "Design & UI",
  elements: readonly any[],
  description?: string,
  thumbnail?: string,
  isPublic?: boolean,
): Promise<void> {
  const now = Date.now();
  const currentTemplate = await getTemplate(id);

  const updatedTemplate: WorkspaceTemplate = {
    id,
    name,
    category,
    description: description !== undefined ? description : currentTemplate?.description,
    thumbnail: thumbnail !== undefined ? thumbnail : currentTemplate?.thumbnail,
    isPublic: isPublic !== undefined ? isPublic : currentTemplate?.isPublic ?? false,
    createdAt: currentTemplate?.createdAt || now,
    elements,
  };

  await set(`template_content_${id}`, updatedTemplate, templatesStore);

  // Sync to Supabase
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    try {
      await supabase.from("templates").upsert({
        id,
        user_id: session.user.id,
        name,
        description: updatedTemplate.description || null,
        category,
        elements,
        thumbnail: updatedTemplate.thumbnail || null,
        is_public: updatedTemplate.isPublic,
      });
    } catch (err) {
      console.error("Error saving template to Supabase:", err);
    }
  }

  // Update metadata list
  const metadataList = await getTemplatesMetadata();
  const index = metadataList.findIndex((item) => item.id === id);
  const newMetadata: TemplateMetadata = {
    id,
    name,
    description: updatedTemplate.description,
    category,
    thumbnail: updatedTemplate.thumbnail,
    isPublic: updatedTemplate.isPublic,
    createdAt: updatedTemplate.createdAt,
  };

  if (index >= 0) {
    metadataList[index] = newMetadata;
  } else {
    metadataList.push(newMetadata);
  }
  await saveTemplatesMetadata(metadataList);
}

export async function deleteTemplate(id: string): Promise<void> {
  await del(`template_content_${id}`, templatesStore);

  // Sync to Supabase
  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    try {
      await supabase.from("templates").delete().eq("id", id);
    } catch (err) {
      console.error("Error deleting template from Supabase:", err);
    }
  }

  // Update metadata list
  const metadataList = await getTemplatesMetadata();
  const filtered = metadataList.filter((item) => item.id !== id);
  await saveTemplatesMetadata(filtered);
}

// Fetch all templates (Local + Remote)
export async function syncAndLoadTemplates(): Promise<WorkspaceTemplate[]> {
  const localMeta = await getTemplatesMetadata();
  const localTemplates: WorkspaceTemplate[] = [];
  for (const meta of localMeta) {
    const content = await getTemplate(meta.id);
    if (content) {
      localTemplates.push(content);
    }
  }

  const { data: { session } } = await supabase.auth.getSession();
  if (session?.user) {
    try {
      const { data, error } = await supabase.from("templates").select("*");
      if (data && !error) {
        const remoteMetaList: TemplateMetadata[] = [];
        for (const item of data) {
          const remoteMeta: TemplateMetadata = {
            id: item.id,
            name: item.name,
            description: item.description || undefined,
            category: item.category,
            thumbnail: item.thumbnail || undefined,
            isPublic: item.is_public,
            createdAt: new Date(item.created_at).getTime(),
          };
          remoteMetaList.push(remoteMeta);

          const remoteTemplate: WorkspaceTemplate = {
            ...remoteMeta,
            elements: item.elements || [],
          };

          // Save to local cache
          await set(`template_content_${item.id}`, remoteTemplate, templatesStore);
        }
        await saveTemplatesMetadata(remoteMetaList);
        return data.map((item) => ({
          id: item.id,
          name: item.name,
          description: item.description || undefined,
          category: item.category,
          thumbnail: item.thumbnail || undefined,
          isPublic: item.is_public,
          createdAt: new Date(item.created_at).getTime(),
          elements: item.elements || [],
        }));
      }
    } catch (err) {
      console.error("Error fetching templates from Supabase:", err);
    }
  }

  return localTemplates;
}
