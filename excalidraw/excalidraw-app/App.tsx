import {
  Excalidraw,
  TTDDialogTrigger,
  CaptureUpdateAction,
  reconcileElements,
  useEditorInterface,
  ExcalidrawAPIProvider,
  useExcalidrawAPI,
  exportToCanvas,
} from "@excalidraw/excalidraw";
import { trackEvent } from "@excalidraw/excalidraw/analytics";
import { getDefaultAppState } from "@excalidraw/excalidraw/appState";
import {
  CommandPalette,
  DEFAULT_CATEGORIES,
} from "@excalidraw/excalidraw/components/CommandPalette/CommandPalette";
import { ErrorDialog } from "@excalidraw/excalidraw/components/ErrorDialog";
import { OverwriteConfirmDialog } from "@excalidraw/excalidraw/components/OverwriteConfirm/OverwriteConfirm";
import { openConfirmModal } from "@excalidraw/excalidraw/components/OverwriteConfirm/OverwriteConfirmState";
import { ShareableLinkDialog } from "@excalidraw/excalidraw/components/ShareableLinkDialog";
import Trans from "@excalidraw/excalidraw/components/Trans";
import {
  APP_NAME,
  EVENT,
  VERSION_TIMEOUT,
  debounce,
  getVersion,
  getFrame,
  isTestEnv,
  preventUnload,
  resolvablePromise,
  isRunningInIframe,
  isDevEnv,
} from "@excalidraw/common";
import polyfill from "@excalidraw/excalidraw/polyfill";
import { useCallback, useEffect, useRef, useState } from "react";
import { loadFromBlob } from "@excalidraw/excalidraw/data/blob";
import { t } from "@excalidraw/excalidraw/i18n";
import throttle from "lodash.throttle";

import {
  GithubIcon,
  XBrandIcon,
  DiscordIcon,
  usersIcon,
  exportToPlus,
  share,
  youtubeIcon,
} from "@excalidraw/excalidraw/components/icons";
import { isElementLink } from "@excalidraw/element";
import {
  bumpElementVersions,
  restoreAppState,
  restoreElements,
} from "@excalidraw/excalidraw/data/restore";
import { newElementWith } from "@excalidraw/element";
import { isInitializedImageElement } from "@excalidraw/element";
import clsx from "clsx";
import {
  parseLibraryTokensFromUrl,
  useHandleLibrary,
} from "@excalidraw/excalidraw/data/library";

import type { RemoteExcalidrawElement } from "@excalidraw/excalidraw/data/reconcile";
import type { RestoredDataState } from "@excalidraw/excalidraw/data/restore";
import type {
  FileId,
  NonDeletedExcalidrawElement,
  OrderedExcalidrawElement,
} from "@excalidraw/element/types";
import type {
  AppState,
  ExcalidrawImperativeAPI,
  BinaryFiles,
  ExcalidrawInitialDataState,
  UIAppState,
  ExcalidrawProps,
} from "@excalidraw/excalidraw/types";
import type { ResolutionType } from "@excalidraw/common/utility-types";
import type { ResolvablePromise } from "@excalidraw/common/utils";

import CustomStats from "./CustomStats";
import {
  Provider,
  useAtom,
  useAtomValue,
  useAtomWithInitialValue,
  appJotaiStore,
} from "./app-jotai";
import {
  FIREBASE_STORAGE_PREFIXES,
  isExcalidrawPlusSignedUser,
  STORAGE_KEYS,
  SYNC_BROWSER_TABS_TIMEOUT,
} from "./app_constants";
import Collab, {
  collabAPIAtom,
  isCollaboratingAtom,
  isOfflineAtom,
} from "./collab/Collab";
import { AppFooter } from "./components/AppFooter";
import { AppMainMenu } from "./components/AppMainMenu";
import { AppWelcomeScreen } from "./components/AppWelcomeScreen";
import { TopErrorBoundary } from "./components/TopErrorBoundary";

import {
  exportToBackend,
  getCollaborationLinkData,
  importFromBackend,
  isCollaborationLink,
} from "./data";

import { updateStaleImageStatuses } from "./data/FileManager";
import { FileStatusStore } from "./data/fileStatusStore";
import {
  importFromLocalStorage,
  importUsernameFromLocalStorage,
} from "./data/localStorage";

import { loadFilesFromFirebase } from "./data/firebase";
import {
  LibraryIndexedDBAdapter,
  LibraryLocalStorageMigrationAdapter,
  LocalData,
  localStorageQuotaExceededAtom,
} from "./data/LocalData";
import { supabase } from "./data/supabaseClient";
import { isBrowserStorageStateNewer } from "./data/tabSync";
import { ShareDialog, shareDialogStateAtom } from "./share/ShareDialog";
import { collabErrorIndicatorAtom } from "./collab/CollabError";
import { useHandleAppTheme } from "./useHandleAppTheme";
import { getPreferredLanguage } from "./app-language/language-detector";
import { useAppLangCode } from "./app-language/language-state";
import { AIComponents } from "./components/AI";

import "./index.scss";

import { AppSidebar } from "./components/AppSidebar";
import { Dashboard } from "./components/Dashboard";
import { CollabChat } from "./components/CollabChat";
import { NotificationManager } from "./components/NotificationManager";
import { Minimap } from "./components/Minimap";
import { PDFTextLayersOverlay } from "./components/PDFTextLayersOverlay";
import { PresenceBar } from "./components/PresenceBar";
import { AuthModal } from "./components/AuthModal";
import { PresentationMode } from "./components/PresentationMode";
import { StudyMode } from "./components/StudyMode";
import { importPDFToCanvas } from "./data/pdfImporter";
import { insertLaTeXSVGToCanvas, LATEX_PRESETS } from "./data/katexEngine";
import { parseGoogleDriveUrl, createGoogleDriveCard, openGooglePicker } from "./data/googleDriveSuite";
import { parseCSVData, renderBarChart } from "./data/dataPipelines";
import { convertMermaidToCanvas } from "./data/mermaidConverter";
import { parseSheetDataToExcalidraw } from "./data/sheetsImporter";
import DOMPurify from "dompurify";


import {
  getBoard,
  saveBoard,
  getBoardComments,
  saveBoardComments,
  syncBoardsWithSupabase,
  getBoardsMetadata,
} from "./data/boardsDb";
import { WorkspaceCommandPalette } from "./components/WorkspaceCommandPalette";
import { TEMPLATES } from "./data/templates";

import type { BoardComment } from "./data/boardsDb";

import type { CollabAPI } from "./collab/Collab";

polyfill();

window.EXCALIDRAW_THROTTLE_RENDER = true;

declare global {
  interface BeforeInstallPromptEventChoiceResult {
    outcome: "accepted" | "dismissed";
  }

  interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<void>;
    userChoice: Promise<BeforeInstallPromptEventChoiceResult>;
  }

  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent;
  }
}

let pwaEvent: BeforeInstallPromptEvent | null = null;

// Adding a listener outside of the component as it may (?) need to be
// subscribed early to catch the event.
//
// Also note that it will fire only if certain heuristics are met (user has
// used the app for some time, etc.)
window.addEventListener(
  "beforeinstallprompt",
  (event: BeforeInstallPromptEvent) => {
    // prevent Chrome <= 67 from automatically showing the prompt
    event.preventDefault();
    // cache for later use
    pwaEvent = event;
  },
);

let isSelfEmbedding = false;

if (window.self !== window.top) {
  try {
    const parentUrl = new URL(document.referrer);
    const currentUrl = new URL(window.location.href);
    if (parentUrl.origin === currentUrl.origin) {
      isSelfEmbedding = true;
    }
  } catch (error) {
    // ignore
  }
}

const shareableLinkConfirmDialog = {
  title: t("overwriteConfirm.modal.shareableLink.title"),
  description: (
    <Trans
      i18nKey="overwriteConfirm.modal.shareableLink.description"
      bold={(text) => <strong>{text}</strong>}
      br={() => <br />}
    />
  ),
  actionLabel: t("overwriteConfirm.modal.shareableLink.button"),
  color: "danger",
} as const;

const initializeScene = async (opts: {
  collabAPI: CollabAPI | null;
  excalidrawAPI: ExcalidrawImperativeAPI;
  activeBoardId: string | null;
}): Promise<
  { scene: ExcalidrawInitialDataState | null } & (
    | { isExternalScene: true; id: string; key: string }
    | { isExternalScene: false; id?: null; key?: null }
  )
> => {
  const searchParams = new URLSearchParams(window.location.search);
  const id = searchParams.get("id");
  const jsonBackendMatch = window.location.hash.match(
    /^#json=([a-zA-Z0-9_-]+),([a-zA-Z0-9_-]+)$/,
  );
  const externalUrlMatch = window.location.hash.match(/^#url=(.*)$/);

  let localDataState = null;
  if (opts.activeBoardId && opts.activeBoardId !== "collab_room") {
    const board = await getBoard(opts.activeBoardId);
    if (board) {
      localDataState = {
        elements: board.elements,
        appState: {
          ...(board.appState || {}),
          name: board.name,
        },
      };
    }
  }

  if (!localDataState) {
    localDataState = importFromLocalStorage();
  }

  let scene: Omit<
    RestoredDataState,
    // we're not storing files in the scene database/localStorage, and instead
    // fetch them async from a different store
    "files"
  > & {
    scrollToContent?: boolean;
  } = {
    elements: restoreElements(localDataState?.elements, null, {
      repairBindings: true,
      deleteInvisibleElements: true,
    }),
    appState: restoreAppState(localDataState?.appState, null),
  };

  let roomLinkData = getCollaborationLinkData(window.location.href);
  const isExternalScene = !!(id || jsonBackendMatch || roomLinkData);
  if (isExternalScene) {
    if (
      // don't prompt if scene is empty
      !scene.elements.length ||
      // don't prompt for collab scenes or shared json links because we don't override local storage
      roomLinkData ||
      jsonBackendMatch ||
      // otherwise, prompt whether user wants to override current scene
      (await openConfirmModal(shareableLinkConfirmDialog))
    ) {
      if (jsonBackendMatch) {
        const imported = await importFromBackend(
          jsonBackendMatch[1],
          jsonBackendMatch[2],
        );

        if (imported && imported.elements && imported.elements.length > 0) {
          scene = {
            elements: bumpElementVersions(
              restoreElements(imported.elements, null, {
                repairBindings: true,
                deleteInvisibleElements: true,
              }),
              localDataState?.elements,
            ),
            appState: restoreAppState(
              imported.appState,
              localDataState?.appState,
            ),
          };
        } else {
          console.warn("Shared link returned empty or invalid elements. Preserving local scene.");
        }
      }
      scene.scrollToContent = true;
      
      // Enforce Role Security: Lock canvas if shared as viewer or commenter
      const urlParams = new URLSearchParams(window.location.search);
      const urlRole = urlParams.get("role");
      if (urlRole === "viewer" || urlRole === "commenter") {
        scene.appState = {
          ...scene.appState,
          viewModeEnabled: true,
        };
      }

      if (!roomLinkData) {
        window.history.replaceState({}, APP_NAME, window.location.origin);
      }

    } else {
      // https://github.com/excalidraw/excalidraw/issues/1919
      if (document.hidden) {
        return new Promise((resolve, reject) => {
          window.addEventListener(
            "focus",
            () => initializeScene(opts).then(resolve).catch(reject),
            {
              once: true,
            },
          );
        });
      }

      roomLinkData = null;
      window.history.replaceState({}, APP_NAME, window.location.origin);
    }
  } else if (externalUrlMatch) {
    window.history.replaceState({}, APP_NAME, window.location.origin);

    const url = externalUrlMatch[1];
    try {
      const request = await fetch(window.decodeURIComponent(url));
      const data = await loadFromBlob(await request.blob(), null, null);
      if (
        !scene.elements.length ||
        (await openConfirmModal(shareableLinkConfirmDialog))
      ) {
        return { scene: data, isExternalScene };
      }
    } catch (error: any) {
      return {
        scene: {
          appState: {
            errorMessage: t("alerts.invalidSceneUrl"),
          },
        },
        isExternalScene,
      };
    }
  }

  if (roomLinkData && opts.collabAPI) {
    const { excalidrawAPI } = opts;

    const scene = await opts.collabAPI.startCollaboration(roomLinkData);

    return {
      // when collaborating, the state may have already been updated at this
      // point (we may have received updates from other clients), so reconcile
      // elements and appState with existing state
      scene: {
        ...scene,
        appState: {
          ...restoreAppState(
            {
              ...scene?.appState,
              theme: localDataState?.appState?.theme || scene?.appState?.theme,
            },
            excalidrawAPI.getAppState(),
          ),
          // necessary if we're invoking from a hashchange handler which doesn't
          // go through App.initializeScene() that resets this flag
          isLoading: false,
        },
        elements: reconcileElements(
          scene?.elements || [],
          excalidrawAPI.getSceneElementsIncludingDeleted() as RemoteExcalidrawElement[],
          excalidrawAPI.getAppState(),
        ),
      },
      isExternalScene: true,
      id: roomLinkData.roomId,
      key: roomLinkData.roomKey,
    };
  } else if (scene) {
    return isExternalScene && jsonBackendMatch
      ? {
          scene,
          isExternalScene,
          id: jsonBackendMatch[1],
          key: jsonBackendMatch[2],
        }
      : { scene, isExternalScene: false };
  }
  return { scene: null, isExternalScene: false };
};

/** Generates a stable, visually-distinct color from a username string */
const usernameToColor = (username: string): string => {
  const PALETTE = [
    "#e03131", "#c2255c", "#9c36b5", "#3b5bdb", "#1971c2",
    "#0c8599", "#2f9e44", "#e67700", "#d9480f", "#5c7cfa",
    "#f03e3e", "#ae3ec9", "#4c6ef5", "#1c7ed6", "#12b886",
    "#40c057", "#fab005", "#fd7e14", "#7950f2", "#e64980",
  ];
  let hash = 0;
  for (let i = 0; i < username.length; i++) {
    hash = username.charCodeAt(i) + ((hash << 5) - hash);
    hash = hash & hash;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
};

const WorkspaceHeader: React.FC<{
  boardName: string;
  userEmail: string | null;
  onBack: () => void;
  onShare: () => void;
  onRename: (newName: string) => void;
}> = ({ boardName, userEmail, onBack, onShare, onRename }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempName, setTempName] = useState(boardName);

  useEffect(() => {
    setTempName(boardName);
  }, [boardName]);

  const handleRenameSubmit = () => {
    setIsEditing(false);
    if (tempName.trim()) {
      onRename(tempName.trim());
    }
  };

  const userInitial = userEmail ? userEmail.charAt(0).toUpperCase() : "U";
  const userDisplayName = userEmail ? userEmail.split("@")[0] : "Invitado";

  return (
    <div className="workspace-header">
      <div className="workspace-header__left">
        <button className="workspace-header__btn-back" onClick={onBack} title="Volver a Workspaces">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
        </button>
        
        <div className="workspace-header__title-container">
          {isEditing ? (
            <input
              type="text"
              className="workspace-header__title-input"
              value={tempName}
              onChange={(e) => setTempName(e.target.value)}
              onBlur={handleRenameSubmit}
              onKeyDown={(e) => e.key === "Enter" && handleRenameSubmit()}
              autoFocus
            />
          ) : (
            <div 
              className="workspace-header__title" 
              onClick={() => setIsEditing(true)}
              title="Haz clic para renombrar"
            >
              <span>{boardName}</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="6 9 12 15 18 9"></polyline>
              </svg>
            </div>
          )}
        </div>

        <div className="workspace-header__status">
          <svg className="cloud-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px", display: "inline-block", verticalAlign: "middle" }}>
            <path d="M17.5 19A3.5 3.5 0 0 0 21 15.5c0-2.79-2.54-4.5-5-4.5-.42 0-.83.07-1.22.2A6.5 6.5 0 0 0 2.5 12.5C2.5 16.09 5.41 19 9 19H17.5z"></path>
            <polyline points="9 13 11 15 15 11"></polyline>
          </svg>
          <span className="status-text">Guardado en la nube</span>
        </div>
      </div>

      <div className="workspace-header__right">
        <button className="workspace-header__icon-btn" title="Ayuda" onClick={() => {
          // Open help dialog in Excalidraw
          document.querySelector<HTMLButtonElement>('.excalidraw [data-testid="help-icon"]')?.click();
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
        </button>

        <button className="workspace-header__icon-btn notification-btn" title="Notificaciones">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
          </svg>
          <span className="notification-badge">3</span>
        </button>

        <div className="workspace-header__profile" title={userEmail || ""}>
          <div className="profile-avatar">{userInitial}</div>
          <div className="profile-info">
            <span className="profile-name">{userDisplayName}</span>
            <span className="profile-email">{userEmail || "Invitado"}</span>
          </div>
        </div>

        <button className="workspace-header__btn-share" onClick={onShare}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px" }}>
            <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="8.5" cy="7" r="4"></circle>
            <line x1="20" y1="8" x2="20" y2="14"></line>
            <line x1="23" y1="11" x2="17" y2="11"></line>
          </svg>
          Compartir
        </button>
      </div>
    </div>
  );
};

const ExcalidrawWrapper = () => {


  const excalidrawAPI = useExcalidrawAPI();

  const [errorMessage, setErrorMessage] = useState("");
  const isCollabDisabled = isRunningInIframe();

  const { editorTheme, appTheme, setAppTheme } = useHandleAppTheme();

  const [langCode, setLangCode] = useAppLangCode();

  const editorInterface = useEditorInterface();

  // Workspace Dashboard states
  const [activeBoardId, setActiveBoardId] = useState<string | null>(() => {
    if (isCollaborationLink(window.location.href)) {
      return "collab_room";
    }
    const params = new URLSearchParams(window.location.search);
    const urlBoardId = params.get("boardId");
    if (urlBoardId) {
      return urlBoardId;
    }

    // Check if we are loading with a library import
    const isAddingLib = window.location.hash.includes("addLibrary") || params.has("addLibrary");
    if (isAddingLib) {
      const lastBoard = localStorage.getItem("my-excalidraw-last-board-id");
      if (lastBoard && lastBoard !== "collab_room") {
        return lastBoard;
      }
      return "board_default";
    }
    return null;
  });
  const [activeBoardName, setActiveBoardName] = useState("");
  const [boardsList, setBoardsList] = useState<any[]>([]);
  const loadBoardsList = useCallback(async () => {
    try {
      const list = await getBoardsMetadata();
      setBoardsList(list || []);
    } catch (e) {
      console.warn("Failed to load boards metadata:", e);
    }
  }, []);

  useEffect(() => {
    loadBoardsList();
  }, [activeBoardId, loadBoardsList]);
  const presenceChannelRef = useRef<any>(null);
  const broadcastChannelRef = useRef<any>(null);
  const lastUsernameRef = useRef<string>("Usuario");
  const lastBroadcastElementsRef = useRef<string>("");
  const [presenceUsers, setPresenceUsers] = useState<
    Array<{ username: string; color: string }>
  >([]);
  const [userSession, setUserSession] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const [showNotesSidebar, setShowNotesSidebar] = useState(false);
  const [isImportingPDF, setIsImportingPDF] = useState(false);
  const [showLaTeXModal, setShowLaTeXModal] = useState(false);
  const [isRenderingLaTeX, setIsRenderingLaTeX] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showMermaidModal, setShowMermaidModal] = useState(false);
  const [technicalInputText, setTechnicalInputText] = useState("");
  const [showSheetsModal, setShowSheetsModal] = useState(false);
  const [showStudyMode, setShowStudyMode] = useState(false);
  const [sheetInputText, setSheetInputText] = useState("");
  const [sidebarTab, setSidebarTab] = useState<"notes" | "comments">("notes");
  const [notesEditMode, setNotesEditMode] = useState<"edit" | "preview">("preview");
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  const getAvatarColor = (name: string) => {
    const colors = ["#a855f7", "#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#ec4899"];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  // Markdown parser helper for rich shape notes
  const parseMarkdownToHTML = (markdown: string): string => {
    if (!markdown) return "<p style='color: #64748b; font-style: italic;'>Sin notas...</p>";
    let html = markdown
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/^### (.*$)/gim, "<h3>$1</h3>")
      .replace(/^## (.*$)/gim, "<h2>$1</h2>")
      .replace(/^# (.*$)/gim, "<h1>$1</h1>")
      .replace(/\*\*(.*)\*\*/gim, "<strong>$1</strong>")
      .replace(/\*(.*)\*/gim, "<em>$1</em>")
      .replace(/`(.*?)`/gim, "<code style='background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-family: monospace; font-size: 12px;'>$1</code>")
      .replace(/^\s*-\s+(.*$)/gim, "<li>$1</li>");
      
    // Parse Wiki-style links [[elementId]] or [[elementId|Label]]
    html = html.replace(/\[\[([a-zA-Z0-9_-]+)(?:\|([^\]]+))?\]\]/g, (match, id, label) => {
      const displayLabel = label ? label.trim() : id;
      return `<span class="wiki-link" data-element-id="${id}" style="color: #ef4444; font-weight: 600; text-decoration: underline; cursor: pointer;">🔗 ${displayLabel}</span>`;
    });

    html = html.replace(/(<li>.*<\/li>)/gim, "<ul>$1</ul>");
    const rawHtml = html.split(/\n\n+/).map(p => {
      if (p.trim().startsWith("<h") || p.trim().startsWith("<ul") || p.trim().startsWith("<li")) {
        return p;
      }
      return `<p style='margin-bottom: 12px; line-height: 1.5; color: #334155;'>${p.replace(/\n/g, "<br>")}</p>`;
    }).join("\n");
    // Sanitize to prevent XSS from stored notes (CN-002)
    return DOMPurify.sanitize(rawHtml, {
      ALLOWED_TAGS: ["h1", "h2", "h3", "strong", "em", "code", "ul", "li", "p", "br", "span"],
      ALLOWED_ATTR: ["style", "class", "data-element-id"],
    });
  };

  // Intercept PDF and .excalidraw / .json Drag & Drop files natively before Excalidraw throws errors
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => {
      if (e.dataTransfer?.types?.includes("Files")) {
        e.preventDefault();
      }
    };

    const handleDrop = async (e: DragEvent) => {
      const files = Array.from(e.dataTransfer?.files || []);
      if (!files.length || !excalidrawAPI) return;

      const pdfFile = files.find(
        (f) => f.type === "application/pdf" || f.name.toLowerCase().endsWith(".pdf"),
      );

      const excalidrawFile = files.find(
        (f) =>
          f.name.toLowerCase().endsWith(".excalidraw") ||
          f.name.toLowerCase().endsWith(".json") ||
          f.type === "application/json",
      );

      if (pdfFile) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        if (isImportingPDF) return;
        setIsImportingPDF(true);

        try {
          const { images, elements } = await importPDFToCanvas(pdfFile);
          const binaryFiles = images.map((img: any) => ({
            id: img.id as any,
            dataURL: img.dataURL as any,
            mimeType: (img.mimeType || "image/jpeg") as any,
            created: Date.now(),
          }));

          excalidrawAPI.addFiles(binaryFiles);

          const currentFiles = { ...(excalidrawAPI.getFiles() || {}) };
          binaryFiles.forEach((f: any) => {
            currentFiles[f.id] = f;
          });

          (excalidrawAPI as any).updateScene({
            elements: [
              ...(excalidrawAPI.getSceneElements() || []),
              ...elements,
            ],
            files: currentFiles,
          });
          (excalidrawAPI as any).scrollToContent?.(elements, { fitToViewport: true });
        } catch (err) {
          console.error("PDF Drag & Drop import error:", err);
          alert("Ocurrió un error al importar el archivo PDF.");
        } finally {
          setIsImportingPDF(false);
        }
      } else if (excalidrawFile) {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();

        try {
          let loadedData: any = null;
          try {
            const blobResult = await loadFromBlob(excalidrawFile, null, null);
            if (blobResult?.elements) {
              loadedData = blobResult;
            }
          } catch (_e) {
            // Fallback: parse JSON directly if type tag is missing
            const text = await excalidrawFile.text();
            const parsed = JSON.parse(text);
            const rawElements = Array.isArray(parsed)
              ? parsed
              : parsed.elements || [];
            if (rawElements.length) {
              loadedData = {
                elements: rawElements,
                files: parsed.files || {},
              };
            }
          }

          if (loadedData && loadedData.elements?.length) {
            if (loadedData.files && Object.keys(loadedData.files).length > 0) {
              const fileList = Object.values(loadedData.files);
              excalidrawAPI.addFiles(fileList as any);
            }

            const currentFiles = {
              ...(excalidrawAPI.getFiles() || {}),
              ...(loadedData.files || {}),
            };

            (excalidrawAPI as any).updateScene({
              elements: [
                ...(excalidrawAPI.getSceneElements() || []),
                ...loadedData.elements,
              ],
              files: currentFiles,
            });

            (excalidrawAPI as any).scrollToContent?.(loadedData.elements, {
              fitToViewport: true,
            });
          } else {
            alert("El archivo no contiene elementos válidos de Excalidraw.");
          }
        } catch (err) {
          console.error("Excalidraw Drag & Drop import error:", err);
          alert("No se pudo cargar el archivo .excalidraw.");
        }
      }
    };

    window.addEventListener("dragover", handleDragOver, { capture: true });
    window.addEventListener("drop", handleDrop, { capture: true });

    return () => {
      window.removeEventListener("dragover", handleDragOver, { capture: true });
      window.removeEventListener("drop", handleDrop, { capture: true });
    };
  }, [excalidrawAPI, isImportingPDF]);


  const selectedElement = activeBoardId && selectedElementId && excalidrawAPI
    ? excalidrawAPI.getSceneElements().find(el => el.id === selectedElementId && !el.isDeleted)
    : null;

  const [localNotes, setLocalNotes] = useState("");

  useEffect(() => {
    setLocalNotes(selectedElement?.customData?.notes || "");
  }, [selectedElementId, selectedElement?.id]);

  const debouncedUpdateNotes = useRef(
    debounce((elementId: string, notesText: string, api: any) => {
      if (!api) return;
      const updatedElements = api.getSceneElements().map((el: any) => {
        if (el.id === elementId) {
          return newElementWith(el, {
            customData: {
              ...el.customData,
              notes: notesText,
            },
          });
        }
        return el;
      });
      api.updateScene({ elements: updatedElements });
    }, 150)
  ).current;

  const handleUpdateNotes = (notesText: string) => {
    setLocalNotes(notesText);
    if (selectedElementId) {
      debouncedUpdateNotes(selectedElementId, notesText, excalidrawAPI);
    }
  };

  const getFlashcardsFromScene = useCallback((): any[] => {
    if (!excalidrawAPI) return [];
    const elements = excalidrawAPI.getSceneElements().filter((el: any) => !el.isDeleted);
    const sceneCards: any[] = [];

    elements.forEach((el: any) => {
      const notes = el.customData?.notes;
      if (!notes) return;

      const regex = /(?:Pregunta|Q):\s*(.+?)\n(?:Respuesta|A):\s*(.+?)(?=\n(?:Pregunta|Q):|$)/gis;
      let match;
      let count = 1;
      
      let topic = "General";
      if (el.customData?.pdfName) {
        topic = `PDF pág. ${el.customData.pageIndex}`;
      } else if (el.text) {
        topic = el.text.length > 20 ? el.text.slice(0, 20) + "..." : el.text;
      } else if (el.type !== "rectangle" && el.type !== "ellipse" && el.type !== "image") {
        topic = el.type.charAt(0).toUpperCase() + el.type.slice(1);
      } else if (el.type === "image") {
        topic = "Imagen del Canvas";
      }

      while ((match = regex.exec(notes)) !== null) {
        const question = match[1].trim();
        const answer = match[2].trim();
        if (question && answer) {
          sceneCards.push({
            id: `card-${el.id}-${count++}`,
            question,
            answer,
            topic,
            elementId: el.id,
          });
        }
      }
    });

    return sceneCards;
  }, [excalidrawAPI]);

  const handleFocusElement = (elementId: string) => {
    if (!excalidrawAPI) return;
    const elements = excalidrawAPI.getSceneElements();
    const el = elements.find((item: any) => item.id === elementId && !item.isDeleted);
    if (el) {
      setShowStudyMode(false);
      excalidrawAPI.updateScene({
        appState: { selectedElementIds: { [elementId]: true } }
      });
      (excalidrawAPI as any).scrollToContent([el], {
        fitToViewport: false,
        viewportZoomFactor: 1.2,
        animate: true,
      });
    }
  };

  const handleBackToWorkspaces = useCallback(() => {
    if (
      activeBoardId &&
      activeBoardId !== "collab_room" &&
      excalidrawAPI
    ) {
      const elements = excalidrawAPI.getSceneElementsIncludingDeleted();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();
      saveBoard(
        activeBoardId,
        { name: appState.name || activeBoardName || "Workspace" },
        elements,
        appState,
        files,
      ).then(() => {
        window.history.replaceState(
          {},
          APP_NAME,
          window.location.origin,
        );
        setActiveBoardId(null);
      });
    } else {
      window.history.replaceState({}, APP_NAME, window.location.origin);
      setActiveBoardId(null);
    }
  }, [activeBoardId, activeBoardName, excalidrawAPI]);


  // initial state
  // ---------------------------------------------------------------------------

  const initialStatePromiseRef = useRef<{
    promise: ResolvablePromise<ExcalidrawInitialDataState | null>;
  }>({ promise: null! });
  if (!initialStatePromiseRef.current.promise) {
    initialStatePromiseRef.current.promise =
      resolvablePromise<ExcalidrawInitialDataState | null>();
  }

  const prevActiveBoardIdRef = useRef<string | null>(activeBoardId);
  if (prevActiveBoardIdRef.current !== activeBoardId) {
    prevActiveBoardIdRef.current = activeBoardId;
    initialStatePromiseRef.current.promise =
      resolvablePromise<ExcalidrawInitialDataState | null>();
  }

  const debugCanvasRef = useRef<HTMLCanvasElement>(null);

  // Load initial board name if activeBoardId is set but name is empty
  useEffect(() => {
    if (activeBoardId && activeBoardId !== "collab_room" && !activeBoardName) {
      getBoard(activeBoardId).then((board) => {
        setActiveBoardName(board?.name || "Mi Pizarra");
      });
    }
  }, [activeBoardId, activeBoardName]);

  // Update URL search parameters based on activeBoardId
  useEffect(() => {
    if (
      activeBoardId === null &&
      (window.location.hash.includes("addLibrary") ||
        window.location.search.includes("addLibrary"))
    ) {
      const lastBoard = localStorage.getItem("my-excalidraw-last-board-id");
      if (lastBoard && lastBoard !== "collab_room") {
        setActiveBoardId(lastBoard);
        getBoard(lastBoard).then((b) => {
          setActiveBoardName(b?.name || "Mi Pizarra");
        });
        return;
      }
      setActiveBoardId("board_default");
      setActiveBoardName("Mi Pizarra");
      return;
    }

    if (activeBoardId) {
      if (activeBoardId === "collab_room") {
        // Keep hash for collab rooms
      } else {
        localStorage.setItem("my-excalidraw-last-board-id", activeBoardId);
        const url = new URL(window.location.href);
        url.searchParams.set("boardId", activeBoardId);
        if (!window.location.hash.includes("addLibrary")) {
          url.hash = "";
        }
        window.history.pushState({}, "", url.toString());
      }
    } else {
      const url = new URL(window.location.href);
      url.searchParams.delete("boardId");
      if (!window.location.hash.includes("addLibrary")) {
        url.hash = "";
      }
      window.history.pushState({}, "", url.pathname + url.search + url.hash);
    }
  }, [activeBoardId]);

  // Intercept element link clicks for bi-directional linking
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest("a");
      if (anchor && anchor.href) {
        try {
          const url = new URL(anchor.href);
          if (url.origin === window.location.origin) {
            const boardId = url.searchParams.get("boardId") || url.hash.match(/boardId=([^&]+)/)?.[1];
            if (boardId) {
              e.preventDefault();
              e.stopPropagation();
              getBoard(boardId).then((board) => {
                setActiveBoardName(board?.name || "Workspace");
                setActiveBoardId(boardId);
              });
            }
          }
        } catch (err) {
          console.error("Error processing link intercept:", err);
        }
      }
    };

    window.addEventListener("click", handleGlobalClick, true);
    return () => window.removeEventListener("click", handleGlobalClick, true);
  }, []);

  useEffect(() => {
    trackEvent("load", "frame", getFrame());
    // Delayed so that the app has a time to load the latest SW
    setTimeout(() => {
      trackEvent("load", "version", getVersion());
    }, VERSION_TIMEOUT);
  }, []);

  const [, setShareDialogState] = useAtom(shareDialogStateAtom);
  const [collabAPI] = useAtom(collabAPIAtom);
  const [isCollaborating] = useAtomWithInitialValue(isCollaboratingAtom, () => {
    return isCollaborationLink(window.location.href);
  });
  const collabError = useAtomValue(collabErrorIndicatorAtom);

  useHandleLibrary({
    excalidrawAPI,
    adapter: LibraryIndexedDBAdapter,
    // TODO maybe remove this in several months (shipped: 24-03-11)
    migrationAdapter: LibraryLocalStorageMigrationAdapter,
  });

  const [, forceRefresh] = useState(false);

  const [comments, setComments] = useState<BoardComment[]>([]);
  const commentsRef = useRef<BoardComment[]>([]);
  useEffect(() => {
    commentsRef.current = comments;
  }, [comments]);
  const [commentModeActive, setCommentModeActive] = useState(false);
  const [activeCommentPopupId, setActiveCommentPopupId] = useState<
    string | null
  >(null);
  const [showAddCommentModal, setShowAddCommentModal] = useState(false);
  const [newCommentCoords, setNewCommentCoords] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [newCommentText, setNewCommentText] = useState("");
  const [newCommentAuthor, setNewCommentAuthor] = useState("");
  const [replyText, setReplyText] = useState("");
  const minimapElementsRef = useRef<readonly any[]>([]);
  const minimapAppStateRef = useRef<any>(null);
  const [minimapTick, setMinimapTick] = useState(0);
  const [minimapVisible, setMinimapVisible] = useState(true);
  const minimapUpdateRef = useRef<((appState: any) => void) | null>(null);
  const textLayersOverlayUpdateRef = useRef<((appState: any) => void) | null>(null);
  // Throttle minimap updates to at most once per 200ms to avoid re-renders every frame
  const throttledMinimapRefresh = useRef(
    debounce(() => setMinimapTick((t) => t + 1), 200),
  ).current;

  useEffect(() => {
    if (!excalidrawAPI) {
      return;
    }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUserSession(session);
      if (session?.user?.email) {
        const namePart = session.user.email.split("@")[0];
        const displayName =
          namePart.charAt(0).toUpperCase() + namePart.slice(1);
        localStorage.setItem("comment-author", displayName);
        setNewCommentAuthor(displayName);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setUserSession(session);
      if (session?.user) {
        if (session.user.email) {
          const namePart = session.user.email.split("@")[0];
          const displayName =
            namePart.charAt(0).toUpperCase() + namePart.slice(1);
          localStorage.setItem("comment-author", displayName);
          setNewCommentAuthor(displayName);
        }
        try {
          const { data: remoteLib, error } = await supabase
            .from("libraries")
            .select("items")
            .maybeSingle();

          if (!error && remoteLib?.items?.libraryItems?.length) {
            await LibraryIndexedDBAdapter.save(remoteLib.items);
            excalidrawAPI.updateLibrary({
              libraryItems: remoteLib.items.libraryItems,
              merge: true,
            });
          }
        } catch (err) {
          console.warn("Supabase library sync skipped (using local storage):", err);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, [excalidrawAPI]);

  const lastLocalSaveTimeRef = useRef<number>(0);

  // ---------------------------------------------------------------------------
  // Supabase Realtime: sync canvas & live cursors in real time for workspaces
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!excalidrawAPI || !activeBoardId || activeBoardId === "collab_room") {
      return;
    }

    const socketId = `user_${Math.random().toString(36).substring(2, 9)}`;
    const currentUser =
      localStorage.getItem("comment-author") || newCommentAuthor || "Usuario";
    const collaboratorsMap = new Map();
    let isSubscribed = false;

    // Generate a deterministic color for this user (same color every session)
    const userColor = usernameToColor(currentUser);
    let isBroadcastSubscribed = false;

    // 1. Broadcast channel — receives canvas changes from other users instantly
    //    (replaces postgres_changes which is blocked by RLS for non-owners)
    const broadcastChannel = supabase.channel(
      `board-canvas-${activeBoardId}`,
    );
    broadcastChannelRef.current = broadcastChannel;

    broadcastChannel
      .on("broadcast", { event: "canvas" }, ({ payload }) => {
        if (payload && payload.senderId !== socketId) {
          const now = Date.now();
          // Skip if we ourselves just saved (avoid echo)
          if (now - lastLocalSaveTimeRef.current > 500) {
            const elements = restoreElements(payload.elements, null);
            excalidrawAPI.updateScene({
              elements,
              captureUpdate: CaptureUpdateAction.NEVER,
            });
            if (payload.files && Object.keys(payload.files).length > 0) {
              excalidrawAPI.addFiles(Object.values(payload.files));
            }
          }
        }
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          isBroadcastSubscribed = true;
        }
      });

    // Expose subscription state and socketId so onChange can check it
    (broadcastChannelRef.current as any).__subscribed = () => isBroadcastSubscribed;
    (broadcastChannelRef.current as any).__socketId = socketId;

    // 2. Presence & Live Cursor Broadcast Channel
    const presenceChannel = supabase.channel(
      `board-presence-${activeBoardId}`,
      {
        config: {
          presence: {
            key: socketId,
          },
        },
      },
    );
    presenceChannelRef.current = presenceChannel;


    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const collaborators = new Map();
        // Build online users list for PresenceBar
        const online: Array<{ username: string; color: string }> = [];
        Object.keys(state).forEach((key) => {
          const presences = state[key] as any[];
          if (presences.length > 0) {
            const p = presences[0];
            const uColor = usernameToColor(p.username || "Usuario");
            online.push({ username: p.username || "Usuario", color: uColor });
            if (key !== socketId) {
              collaborators.set(key, {
                username: p.username || "Usuario",
                isCurrentUser: false,
                pointer: p.pointer || { x: 0, y: 0 },
                color: { background: uColor, stroke: uColor },
              });
            }
          }
        });
        setPresenceUsers(online);
        excalidrawAPI.updateScene({ collaborators });
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        if (key !== socketId && newPresences.length > 0) {
          const user = newPresences[0].username || "Alguien";
          excalidrawAPI.setToast({ message: `👋 ${user} se unió a la sala`, duration: 3000 });
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Nueva conexión", { body: `${user} se unió a la sala colaborativa.` });
          }
        }
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        if (key !== socketId && leftPresences.length > 0) {
          const user = leftPresences[0].username || "Alguien";
          excalidrawAPI.setToast({ message: `${user} abandonó la sala`, duration: 3000 });
          if ("Notification" in window && Notification.permission === "granted") {
            new Notification("Desconexión", { body: `${user} abandonó la sala colaborativa.` });
          }
        }
      })
      .on("broadcast", { event: "pointer" }, ({ payload }) => {
        if (payload && payload.socketId !== socketId) {
          const uColor = usernameToColor(payload.username || "Usuario");
          collaboratorsMap.set(payload.socketId, {
            username: payload.username || "Usuario",
            isCurrentUser: false,
            pointer: payload.pointer,
            button: "up" as const,
            selectedElementIds: {},
            color: { background: uColor, stroke: uColor },
          });
          excalidrawAPI.updateScene({
            collaborators: new Map(collaboratorsMap),
          });
        }
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          isSubscribed = true;
          await presenceChannel.track({
            username: currentUser,
            onlineAt: new Date().toISOString(),
          });
        }
      });

    const handlePointerMove = throttle((e: MouseEvent) => {
      if (!isSubscribed) return;
      const appState = excalidrawAPI.getAppState();
      const sceneX =
        (e.clientX - appState.offsetLeft) / appState.zoom.value -
        appState.scrollX;
      const sceneY =
        (e.clientY - appState.offsetTop) / appState.zoom.value -
        appState.scrollY;

      presenceChannel.send({
        type: "broadcast",
        event: "pointer",
        payload: {
          socketId,
          username: currentUser,
          pointer: { x: sceneX, y: sceneY },
        },
      });
    }, 120);

    window.addEventListener("pointermove", handlePointerMove);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      supabase.removeChannel(broadcastChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [excalidrawAPI, activeBoardId, newCommentAuthor]);



  // ---------------------------------------------------------------------------
  // Sync Comment Pins position without React re-render lag
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!excalidrawAPI) return;

    const unsub = excalidrawAPI.onScrollChange(() => {
      const appState = excalidrawAPI.getAppState();
      const pins = document.querySelectorAll(".comment-pin, .comment-popup");
      pins.forEach((pin: any) => {
        const originalX = parseFloat(pin.dataset.x);
        const originalY = parseFloat(pin.dataset.y);
        if (!isNaN(originalX) && !isNaN(originalY)) {
          const viewportX = (originalX + appState.scrollX) * appState.zoom.value + appState.offsetLeft;
          const viewportY = (originalY + appState.scrollY) * appState.zoom.value + appState.offsetTop;
          pin.style.left = `${viewportX}px`;
          
          if (pin.classList.contains("comment-popup")) {
            pin.style.top = `${viewportY - 10}px`;
          } else {
            pin.style.top = `${viewportY}px`;
          }
        }
      });
    });

    return () => unsub();
  }, [excalidrawAPI]);

  // ---------------------------------------------------------------------------
  // Hoisted loadImages
  // ---------------------------------------------------------------------------
  const loadImages = useCallback(
    (data: ResolutionType<typeof initializeScene>, isInitialLoad = false) => {
      if (!data.scene || !excalidrawAPI) {
        return;
      }

      if (collabAPI?.isCollaborating()) {
        if (data.scene.elements) {
          collabAPI
            .fetchImageFilesFromFirebase({
              elements: data.scene.elements,
              forceFetchFiles: true,
            })
            .then(({ loadedFiles, erroredFiles }) => {
              excalidrawAPI.addFiles(loadedFiles);
              updateStaleImageStatuses({
                excalidrawAPI,
                erroredFiles,
                elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
              });
            });
        }
      } else {
        const fileIds =
          data.scene.elements?.reduce((acc, element) => {
            if (isInitializedImageElement(element)) {
              return acc.concat(element.fileId);
            }
            return acc;
          }, [] as FileId[]) || [];

        if (data.isExternalScene) {
          if (fileIds.length) {
            // Direct Firebase call (not through FileManager), so track manually
            FileStatusStore.updateStatuses(
              fileIds.map((id) => [id, "loading"]),
            );
          }
          loadFilesFromFirebase(
            `${FIREBASE_STORAGE_PREFIXES.shareLinkFiles}/${data.id}`,
            data.key,
            fileIds,
          ).then(({ loadedFiles, erroredFiles }) => {
            excalidrawAPI.addFiles(loadedFiles);
            updateStaleImageStatuses({
              excalidrawAPI,
              erroredFiles,
              elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
            });
            FileStatusStore.updateStatuses([
              ...loadedFiles.map((f) => [f.id, "loaded"] as [FileId, "loaded"]),
              ...[...erroredFiles.keys()].map(
                (id) => [id, "error"] as [FileId, "error"],
              ),
            ]);
          });
        } else if (isInitialLoad) {
          if (fileIds.length) {
            LocalData.fileStorage
              .getFiles(fileIds)
              .then(async ({ loadedFiles, erroredFiles }) => {
                if (loadedFiles.length) {
                  excalidrawAPI.addFiles(loadedFiles);
                }
                updateStaleImageStatuses({
                  excalidrawAPI,
                  erroredFiles,
                  elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
                });
              });
          }
          // on fresh load, clear unused files from IDB (from previous
          // session)
          LocalData.fileStorage.clearObsoleteFiles({
            currentFileIds: fileIds,
          });
        }
      }
    },
    [collabAPI, excalidrawAPI],
  );

  useEffect(() => {
    if (activeBoardId) {
      getBoardComments(activeBoardId).then((list) => {
        setComments(list);
      });
    } else {
      setComments([]);
    }
    setCommentModeActive(false);
    setActiveCommentPopupId(null);
  }, [activeBoardId]);

  useEffect(() => {
    const handleCollabCreate = (e: any) => {
      const newComment = e.detail;
      setComments((prev) => {
        const index = prev.findIndex((c) => c.id === newComment.id);
        if (index > -1) {
          const updated = [...prev];
          updated[index] = newComment;
          return updated;
        }
        return [...prev, newComment];
      });
    };

    const handleCollabResolve = (e: any) => {
      const id = e.detail;
      setComments((prev) => prev.filter((c) => c.id !== id));
    };

    window.addEventListener("collab-comment-create" as any, handleCollabCreate);
    window.addEventListener(
      "collab-comment-resolve" as any,
      handleCollabResolve,
    );

    return () => {
      window.removeEventListener(
        "collab-comment-create" as any,
        handleCollabCreate,
      );
      window.removeEventListener(
        "collab-comment-resolve" as any,
        handleCollabResolve,
      );
    };
  }, [collabAPI]);

  const handleResolveComment = async (commentId: string) => {
    const updated = comments.filter((c) => c.id !== commentId);
    setComments(updated);
    setActiveCommentPopupId(null);
    if (activeBoardId) {
      saveBoardComments(activeBoardId, updated).catch((err) => {
        console.error("Failed to save resolved comments:", err);
      });
    }
    if (collabAPI && collabAPI.sendCommentResolve) {
      collabAPI.sendCommentResolve(commentId);
    }
  };

  const handleReplyComment = async (commentId: string) => {
    if (!replyText.trim() || !activeBoardId) {
      return;
    }
    const author =
      collabAPI?.getUsername() ||
      localStorage.getItem("comment-author") ||
      "Anónimo";

    const newReply = {
      id: `reply_${crypto.randomUUID().replace(/-/g, "").substring(0, 12)}`,
      author,
      text: replyText.trim(),
      createdAt: Date.now(),
    };

    const targetComment = comments.find((c) => c.id === commentId);
    if (!targetComment) {
      return;
    }

    const updatedComment = {
      ...targetComment,
      replies: [...(targetComment.replies || []), newReply],
    };

    const updated = comments.map((c) => {
      if (c.id === commentId) {
        return updatedComment;
      }
      return c;
    });

    setComments(updated);
    setReplyText("");

    saveBoardComments(activeBoardId, updated).catch((err) => {
      console.error("Failed to save replied comment:", err);
    });

    if (collabAPI && collabAPI.sendCommentCreate) {
      collabAPI.sendCommentCreate(updatedComment);
    }
  };

  const handleCreateCommentConfirm = async () => {
    if (newCommentText.trim() && newCommentCoords && activeBoardId) {
      const author = newCommentAuthor.trim() || "Anónimo";
      localStorage.setItem("comment-author", author);

      const newComment: BoardComment = {
        id: `comment_${crypto.randomUUID().replace(/-/g, "").substring(0, 12)}`,
        text: newCommentText.trim(),
        author,
        x: newCommentCoords.x,
        y: newCommentCoords.y,
        createdAt: Date.now(),
        resolved: false,
      };

      const updated = [...comments, newComment];
      setComments(updated);
      
      // Close UI instantly!
      setShowAddCommentModal(false);
      setNewCommentCoords(null);
      setNewCommentText("");

      saveBoardComments(activeBoardId, updated).catch((err) => {
        console.error("Failed to save created comment:", err);
      });

      if (collabAPI && collabAPI.sendCommentCreate) {
        collabAPI.sendCommentCreate(newComment);
      }
    }
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (!excalidrawAPI) {
      return;
    }

    const clientX = e.clientX;
    const clientY = e.clientY;

    const appState = excalidrawAPI.getAppState();
    const zoom = appState.zoom.value;
    const scrollX = appState.scrollX;
    const scrollY = appState.scrollY;

    const x = clientX / zoom - scrollX;
    const y = clientY / zoom - scrollY;

    setNewCommentCoords({ x, y });
    setNewCommentText("");
    setNewCommentAuthor(
      collabAPI?.getUsername() || localStorage.getItem("comment-author") || "",
    );
    setShowAddCommentModal(true);
    setCommentModeActive(false);
  };

  useEffect(() => {
    if (!excalidrawAPI || (!isCollabDisabled && !collabAPI)) {
      return;
    }

    initializeScene({ collabAPI, excalidrawAPI, activeBoardId }).then(
      async (data) => {
        loadImages(data, /* isInitialLoad */ true);
        if (activeBoardId && activeBoardId !== "collab_room") {
          getBoard(activeBoardId).then((board) => {
            if (board?.files) {
              excalidrawAPI.addFiles(Object.values(board.files));
            }
          });
        }
        initialStatePromiseRef.current.promise.resolve(data.scene);
      },
    );

    const onHashChange = async (event: HashChangeEvent) => {
      event.preventDefault();
      const libraryUrlTokens = parseLibraryTokensFromUrl();
      if (!libraryUrlTokens) {
        if (
          collabAPI?.isCollaborating() &&
          !isCollaborationLink(window.location.href)
        ) {
          collabAPI.stopCollaboration(false);
        }
        excalidrawAPI.updateScene({ appState: { isLoading: true } });

        initializeScene({ collabAPI, excalidrawAPI, activeBoardId }).then(
          async (data) => {
            loadImages(data);
            if (activeBoardId && activeBoardId !== "collab_room") {
              const board = await getBoard(activeBoardId);
              if (board?.files) {
                excalidrawAPI.addFiles(Object.values(board.files));
              }
            }
            if (data.scene) {
              excalidrawAPI.updateScene({
                elements: restoreElements(data.scene.elements, null, {
                  repairBindings: true,
                }),
                appState: restoreAppState(data.scene.appState, null),
                captureUpdate: CaptureUpdateAction.IMMEDIATELY,
              });
            }
          },
        );
      }
    };

    const syncData = debounce(() => {
      if (isTestEnv()) {
        return;
      }
      if (
        !document.hidden &&
        ((collabAPI && !collabAPI.isCollaborating()) || isCollabDisabled)
      ) {
        // don't sync if local state is newer or identical to browser state
        if (isBrowserStorageStateNewer(STORAGE_KEYS.VERSION_DATA_STATE)) {
          const localDataState = importFromLocalStorage();
          const username = importUsernameFromLocalStorage();
          setLangCode(getPreferredLanguage());
          excalidrawAPI.updateScene({
            ...localDataState,
            captureUpdate: CaptureUpdateAction.NEVER,
          });
          LibraryIndexedDBAdapter.load().then((data) => {
            if (data) {
              excalidrawAPI.updateLibrary({
                libraryItems: data.libraryItems,
              });
            }
          });
          collabAPI?.setUsername(username || "");
        }

        if (isBrowserStorageStateNewer(STORAGE_KEYS.VERSION_FILES)) {
          const elements = excalidrawAPI.getSceneElementsIncludingDeleted();
          const currFiles = excalidrawAPI.getFiles();
          const fileIds =
            elements?.reduce((acc, element) => {
              if (
                isInitializedImageElement(element) &&
                // only load and update images that aren't already loaded
                !currFiles[element.fileId]
              ) {
                return acc.concat(element.fileId);
              }
              return acc;
            }, [] as FileId[]) || [];
          if (fileIds.length) {
            LocalData.fileStorage
              .getFiles(fileIds)
              .then(({ loadedFiles, erroredFiles }) => {
                if (loadedFiles.length) {
                  excalidrawAPI.addFiles(loadedFiles);
                }
                updateStaleImageStatuses({
                  excalidrawAPI,
                  erroredFiles,
                  elements: excalidrawAPI.getSceneElementsIncludingDeleted(),
                });
              });
          }
        }
      }
    }, SYNC_BROWSER_TABS_TIMEOUT);

    const onUnload = () => {
      LocalData.flushSave();
    };

    const visibilityChange = (event: FocusEvent | Event) => {
      if (event.type === EVENT.BLUR || document.hidden) {
        LocalData.flushSave();
      }
      if (
        event.type === EVENT.VISIBILITY_CHANGE ||
        event.type === EVENT.FOCUS
      ) {
        syncData();
      }
    };

    window.addEventListener(EVENT.HASHCHANGE, onHashChange, false);
    window.addEventListener(EVENT.UNLOAD, onUnload, false);
    window.addEventListener(EVENT.BLUR, visibilityChange, false);
    document.addEventListener(EVENT.VISIBILITY_CHANGE, visibilityChange, false);
    window.addEventListener(EVENT.FOCUS, visibilityChange, false);
    return () => {
      window.removeEventListener(EVENT.HASHCHANGE, onHashChange, false);
      window.removeEventListener(EVENT.UNLOAD, onUnload, false);
      window.removeEventListener(EVENT.BLUR, visibilityChange, false);
      window.removeEventListener(EVENT.FOCUS, visibilityChange, false);
      document.removeEventListener(
        EVENT.VISIBILITY_CHANGE,
        visibilityChange,
        false,
      );
    };
  }, [
    isCollabDisabled,
    collabAPI,
    excalidrawAPI,
    setLangCode,
    loadImages,
    activeBoardId,
  ]);

  useEffect(() => {
    const unloadHandler = (event: BeforeUnloadEvent) => {
      LocalData.flushSave();

      if (
        excalidrawAPI &&
        LocalData.fileStorage.shouldPreventUnload(
          excalidrawAPI.getSceneElements(),
        )
      ) {
        if (import.meta.env.VITE_APP_DISABLE_PREVENT_UNLOAD !== "true") {
          preventUnload(event);
        } else {
          console.warn(
            "preventing unload disabled (VITE_APP_DISABLE_PREVENT_UNLOAD)",
          );
        }
      }
    };
    window.addEventListener(EVENT.BEFORE_UNLOAD, unloadHandler);
    return () => {
      window.removeEventListener(EVENT.BEFORE_UNLOAD, unloadHandler);
    };
  }, [excalidrawAPI]);

  // Debounced board save - only writes to DB after 1.5s of inactivity
  const debouncedSaveBoard = useRef(
    debounce(
      async (
        boardId: string,
        boardName: string,
        els: readonly OrderedExcalidrawElement[],
        state: AppState,
        fs: BinaryFiles,
      ) => {
        lastLocalSaveTimeRef.current = Date.now();

        let preview = "";
        try {
          const visibleElements = els.filter((el) => !el.isDeleted);
          if (visibleElements.length > 0) {
            const canvas = await exportToCanvas({
              elements: visibleElements as any,
              appState: {
                ...state,
                exportBackground: true,
                viewBackgroundColor: state.viewBackgroundColor || "#ffffff",
              },
              files: fs,
              getDimensions: () => ({ width: 320, height: 200 }),
            });
            preview = canvas.toDataURL("image/jpeg", 0.3); // 30% quality JPEG is extremely lightweight (~3-4KB)
          }
        } catch (err) {
          console.warn("Failed to generate board preview:", err);
        }

        const notesCount = els.filter((el) => el.customData?.notes).length;
        const commentsCount = commentsRef.current.length;

        saveBoard(
          boardId,
          {
            name: boardName,
            preview,
            notesCount,
            commentsCount,
          },
          els,
          state,
          fs,
        );
      },
      1500,
    ),
  ).current;

  const onChange = (
    elements: readonly OrderedExcalidrawElement[],
    appState: AppState,
    files: BinaryFiles,
  ) => {
    // Update refs without triggering React re-renders on every frame
    minimapElementsRef.current = elements;
    minimapAppStateRef.current = appState;
    minimapUpdateRef.current?.(appState);
    textLayersOverlayUpdateRef.current?.(appState);
    throttledMinimapRefresh();

    // Sync username changes to realtime presence
    const currentUsername = collabAPI?.getUsername();
    if (currentUsername && currentUsername !== lastUsernameRef.current) {
      lastUsernameRef.current = currentUsername;
      localStorage.setItem("comment-author", currentUsername); // Fallback memory
      if (presenceChannelRef.current) {
        presenceChannelRef.current.track({
          username: currentUsername,
          onlineAt: new Date().toISOString(),
        });
      }
    }

    if (collabAPI?.isCollaborating()) {
      collabAPI.syncElements(elements);
    }

    if (activeBoardId && activeBoardId !== "collab_room") {
      const boardName = activeBoardName || appState.name || "Workspace";
      // Debounced: write to IndexedDB/Supabase only after user pauses 1.5s
      debouncedSaveBoard(activeBoardId, boardName, elements, appState, files);

      // Instant broadcast for real-time collaboration (bypasses RLS)
      if (
        broadcastChannelRef.current &&
        typeof broadcastChannelRef.current.__subscribed === "function" &&
        broadcastChannelRef.current.__subscribed()
      ) {
        const elementsJson = JSON.stringify(elements.map((el) => el.id));
        if (elementsJson !== lastBroadcastElementsRef.current) {
          lastBroadcastElementsRef.current = elementsJson;
          // Use httpSend to avoid REST fallback warnings
          broadcastChannelRef.current.send({
            type: "broadcast",
            event: "canvas",
            payload: {
              senderId: (broadcastChannelRef.current as any).__socketId ?? "anon",
              elements,
              files,
            },
          });
        }
      }
    }

    // this check is redundant, but since this is a hot path, it's best
    // not to evaludate the nested expression every time
    if (!LocalData.isSavePaused()) {
      LocalData.save(elements, appState, files, () => {
        if (excalidrawAPI) {
          let didChange = false;

          const elements = excalidrawAPI
            .getSceneElementsIncludingDeleted()
            .map((element) => {
              if (
                LocalData.fileStorage.shouldUpdateImageElementStatus(element)
              ) {
                const newElement = newElementWith(element, { status: "saved" });
                if (newElement !== element) {
                  didChange = true;
                }
                return newElement;
              }
              return element;
            });

          if (didChange) {
            excalidrawAPI.updateScene({
              elements,
              captureUpdate: CaptureUpdateAction.NEVER,
            });
          }
        }
      });
    }

    // Track selected element changes
    const selectedIds = Object.keys(appState.selectedElementIds);
    const newSelectedId = selectedIds.length >= 1 ? selectedIds[0] : null;
    if (newSelectedId !== selectedElementId) {
      setSelectedElementId(newSelectedId);
    }
  };

  const [latestShareableLink, setLatestShareableLink] = useState<string | null>(
    null,
  );

  const onExportToBackend = async (
    exportedElements: readonly NonDeletedExcalidrawElement[],
    appState: Partial<AppState>,
    files: BinaryFiles,
  ) => {
    if (exportedElements.length === 0) {
      throw new Error(t("alerts.cannotExportEmptyCanvas"));
    }
    try {
      const { url, errorMessage } = await exportToBackend(
        exportedElements,
        {
          ...appState,
          viewBackgroundColor: appState.exportBackground
            ? appState.viewBackgroundColor
            : getDefaultAppState().viewBackgroundColor,
        },
        files,
      );

      if (errorMessage) {
        throw new Error(errorMessage);
      }

      if (url) {
        setLatestShareableLink(url);
      }
    } catch (error: any) {
      if (error.name !== "AbortError") {
        const { width, height } = appState;
        console.error(error, {
          width,
          height,
          devicePixelRatio: window.devicePixelRatio,
        });
        throw new Error(error.message);
      }
    }
  };

  const renderCustomStats = (
    elements: readonly NonDeletedExcalidrawElement[],
    appState: UIAppState,
  ) => {
    return (
      <CustomStats
        setToast={(message) => excalidrawAPI!.setToast({ message })}
        appState={appState}
        elements={elements}
      />
    );
  };

  const isOffline = useAtomValue(isOfflineAtom);

  const handleAITextSubmit = useCallback(
    async (props: {
      messages: { role: string; content: string }[];
      onStreamCreated: () => void;
      onChunk: (chunk: string) => void;
      signal?: AbortController["signal"];
    }) => {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY;
      if (!apiKey) {
        return {
          error: new Error(
            "API Key de Gemini no configurada. Por favor, añade VITE_GEMINI_API_KEY en tu archivo .env.",
          ),
        };
      }

      try {
        const systemInstruction =
          "Eres un experto en diagramación. Tu tarea es generar código Mermaid válido basado en la descripción del usuario. " +
          "Reglas importantes:\n" +
          "1. Retorna SOLAMENTE código Mermaid válido.\n" +
          "2. NO envuelvas tu respuesta con explicaciones, textos de introducción/conclusión ni marcas de bloque de código como ```mermaid. Retorna el texto plano directo de Mermaid.\n" +
          "3. Si el usuario te pide modificaciones, adapta el diagrama Mermaid existente.";

        const formattedPrompt = `${systemInstruction}\n\nHistorial y petición:\n${props.messages
          .map(
            (m) =>
              `${m.role === "user" ? "Usuario" : "Asistente"}: ${m.content}`,
          )
          .join("\n")}\n\nAsistente:`;

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:streamGenerateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [{ text: formattedPrompt }],
                },
              ],
            }),
            signal: props.signal,
          },
        );

        if (!response.ok) {
          const errData = await response.json().catch(() => ({}));
          throw new Error(
            errData.error?.message || `HTTP error! status: ${response.status}`,
          );
        }

        props.onStreamCreated();

        const reader = response.body?.getReader();
        const decoder = new TextDecoder("utf-8");
        let done = false;
        let buffer = "";
        let fullResponse = "";
        let accumulatedText = "";

        while (!done && reader) {
          const { value, done: readerDone } = await reader.read();
          done = readerDone;
          if (value) {
            buffer += decoder.decode(value, { stream: true });

            let currentText = "";
            let match;
            const regex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
            while ((match = regex.exec(buffer)) !== null) {
              try {
                currentText += JSON.parse(`"${match[1]}"`);
              } catch (e) {}
            }

            if (currentText.length > accumulatedText.length) {
              const delta = currentText.substring(accumulatedText.length);
              accumulatedText = currentText;
              props.onChunk(delta);
              fullResponse = currentText;
            }
          }
        }

        let cleaned = fullResponse.trim();
        if (cleaned.startsWith("```")) {
          cleaned = cleaned.replace(/^```[a-zA-Z]*\n/, "");
        }
        if (cleaned.endsWith("```")) {
          cleaned = cleaned.substring(0, cleaned.length - 3);
        }
        cleaned = cleaned.trim();

        return {
          generatedResponse: cleaned,
          rateLimit: 100,
          rateLimitRemaining: 99,
        };
      } catch (err: any) {
        return {
          error: err,
        };
      }
    },
    [],
  );

  const handleExportToPPTX = useCallback(async () => {
    if (!excalidrawAPI) {
      return;
    }

    try {
      excalidrawAPI.setToast({ message: "Preparando exportación a PPTX..." });

      const { default: pptxgen } = await import("pptxgenjs");
      const pres = new pptxgen();
      pres.layout = "LAYOUT_16x9";

      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();

      const frames = elements.filter(
        (el) => el.type === "frame" && !el.isDeleted,
      );

      if (frames.length > 0) {
        const sortedFrames = [...frames].sort((a, b) => a.x - b.x);

        for (const frame of sortedFrames) {
          const frameElements = elements.filter(
            (el) =>
              (el.frameId === frame.id || el.id === frame.id) && !el.isDeleted,
          );

          const canvas = await exportToCanvas({
            elements: frameElements,
            appState: { ...appState, exportBackground: true },
            files,
          });

          const slide = pres.addSlide();

          if ((frame as any).name) {
            slide.addText((frame as any).name, {
              x: 0.5,
              y: 0.2,
              w: "90%",
              h: 0.5,
              fontSize: 20,
              bold: true,
              color: appState.theme === "dark" ? "FFFFFF" : "333333",
            });
          }

          const dataUrl = canvas.toDataURL("image/png");
          slide.addImage({
            data: dataUrl,
            x: 0.5,
            y: 0.8,
            w: 9.0,
            h: 5.0,
            sizing: { type: "contain", w: 9.0, h: 5.0 },
          });
        }
      } else {
        const canvas = await exportToCanvas({
          elements: elements.filter((el) => !el.isDeleted),
          appState: { ...appState, exportBackground: true },
          files,
        });

        const slide = pres.addSlide();
        const dataUrl = canvas.toDataURL("image/png");
        slide.addImage({
          data: dataUrl,
          x: 0.5,
          y: 0.5,
          w: 9.0,
          h: 4.625,
          sizing: { type: "contain", w: 9.0, h: 4.625 },
        });
      }

      const boardName = excalidrawAPI.getName() || "presentacion";
      await pres.writeFile({ fileName: `${boardName}.pptx` });
      excalidrawAPI.setToast({ message: "Exportación a PPTX completada!" });
    } catch (error: any) {
      console.error("Error exporting to PPTX:", error);
      excalidrawAPI.setToast({
        message: `Error al exportar a PPTX: ${error.message}`,
      });
    }
  }, [excalidrawAPI]);

  const localStorageQuotaExceeded = useAtomValue(localStorageQuotaExceededAtom);

  const onCollabDialogOpen = useCallback(
    () => setShareDialogState({ isOpen: true, type: "collaborationOnly" }),
    [setShareDialogState],
  );

  // ---------------------------------------------------------------------------
  // onExport — intercepts file save to wait for pending image loads
  // ---------------------------------------------------------------------------
  const onExport: Required<ExcalidrawProps>["onExport"] = useCallback(
    async function* () {
      let snapshot = FileStatusStore.getSnapshot();
      const { pending, total } = FileStatusStore.getPendingCount(
        snapshot.value,
      );
      if (pending === 0) {
        return;
      }

      // Yield initial progress
      yield {
        type: "progress",
        progress: (total - pending) / total,
        message: `Loading images (${total - pending}/${total})...`,
      };

      // Wait for all pending images to finish
      while (true) {
        snapshot = await FileStatusStore.pull(snapshot.version);
        const { pending: nowPending, total: nowTotal } =
          FileStatusStore.getPendingCount(snapshot.value);

        yield {
          type: "progress",
          progress: (nowTotal - nowPending) / nowTotal,
          message: `Loading images (${nowTotal - nowPending}/${nowTotal})...`,
        };

        if (nowPending === 0) {
          await new Promise((r) => setTimeout(r, 500));
          yield {
            type: "progress",
            message: `Preparing export...`,
          };
          return;
        }
      }
    },
    [],
  );

  // const onExport = () => {
  //   return new Promise((r) => setTimeout(r, 2500));
  //   // console.log("onExport");
  // };

  // browsers generally prevent infinite self-embedding, there are
  // cases where it still happens, and while we disallow self-embedding
  // by not whitelisting our own origin, this serves as an additional guard
  if (isSelfEmbedding) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          textAlign: "center",
          height: "100%",
        }}
      >
        <h1>I'm not a pretzel!</h1>
      </div>
    );
  }

  const ExcalidrawPlusCommand = {
    label: "Excalidraw+",
    category: DEFAULT_CATEGORIES.links,
    predicate: true,
    icon: (
      <img
        src="/logo-custom-small.png"
        alt="Logo"
        style={{ width: 14, height: 14, borderRadius: "2px" }}
      />
    ),
    keywords: ["plus", "cloud", "server"],
    perform: () => {
      window.open(
        `${
          import.meta.env.VITE_APP_PLUS_LP
        }/plus?utm_source=excalidraw&utm_medium=app&utm_content=command_palette`,
        "_blank",
      );
    },
  };
  const ExcalidrawPlusAppCommand = {
    label: "Sign up",
    category: DEFAULT_CATEGORIES.links,
    predicate: true,
    icon: (
      <img
        src="/logo-custom-small.png"
        alt="Logo"
        style={{ width: 14, height: 14, borderRadius: "2px" }}
      />
    ),
    keywords: [
      "excalidraw",
      "plus",
      "cloud",
      "server",
      "signin",
      "login",
      "signup",
    ],
    perform: () => {
      window.open(
        `${
          import.meta.env.VITE_APP_PLUS_APP
        }?utm_source=excalidraw&utm_medium=app&utm_content=command_palette`,
        "_blank",
      );
    },
  };

  if (activeBoardId === null) {
    return (
      <>
        <Dashboard
          onSelectBoard={async (id) => {
            const board = await getBoard(id);
            setActiveBoardName(board?.name || "Workspace");
            setActiveBoardId(id);
          }}
          onJoinRoom={(roomUrl) => {
            let hash = roomUrl;
            if (roomUrl.includes("#")) {
              hash = roomUrl.substring(roomUrl.indexOf("#"));
            }
            window.location.hash = hash;
            setActiveBoardName("Sala Colaborativa");
            setActiveBoardId("collab_room");
          }}
        />
        <WorkspaceCommandPalette
          activeBoardId={null}
          boards={boardsList}
          onSelectBoard={async (id: string) => {
            const board = await getBoard(id);
            setActiveBoardName(board?.name || "Workspace");
            setActiveBoardId(id);
          }}
          onNavigateTab={(tab: "recientes" | "favoritos" | "compartidos" | "papelera" | "plantillas") => {
            localStorage.setItem("my-excalidraw-active-tab", tab);
            window.dispatchEvent(new CustomEvent("dashboard-navigate-tab", { detail: tab }));
          }}
          onCreateBoard={(templateId: string | null) => {
            window.dispatchEvent(new CustomEvent("dashboard-create-board", { detail: templateId }));
          }}
          theme={appTheme}
          setTheme={setAppTheme}
        />
      </>
    );
  }

  const handleCreateBoardFromPalette = async (templateId: string | null) => {
    const id = `board_${crypto.randomUUID().replace(/-/g, "").substring(0, 12)}`;
    let name = "Nueva Pizarra";
    let elements: any[] = [];
    if (templateId) {
      const template = TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        name = template.name;
        elements = template.getElements();
      } else {
        const { processAIPromptToCanvas } = await import("./data/aiSkillEngine");
        const aiResult = processAIPromptToCanvas(templateId);
        name = aiResult.title;
        elements = aiResult.elements;
      }
    }
    await saveBoard(id, { name }, elements, {}, {});
    setActiveBoardName(name);
    setActiveBoardId(id);
  };

  return (
    <div
      style={{ height: "100%" }}
      className={clsx("excalidraw-app", {
        "is-collaborating": isCollaborating,
        "notes-sidebar-open": showNotesSidebar,
      })}
    >
      {activeBoardId && (
        <WorkspaceHeader
          boardName={activeBoardName || "Mi Pizarra"}
          userEmail={userSession?.user?.email || null}
          onBack={handleBackToWorkspaces}
          onShare={() => setShareDialogState({ isOpen: true, type: "share" })}
          onRename={(newName) => {
            setActiveBoardName(newName);
            if (activeBoardId) {
              saveBoard(activeBoardId, { name: newName });
            }
          }}
        />
      )}
      <Excalidraw
        onChange={onChange}
        onExport={onExport}
        initialData={initialStatePromiseRef.current.promise}
        isCollaborating={isCollaborating}
        onPointerUpdate={collabAPI?.onPointerUpdate}
        aiEnabled={true}
        onTextSubmit={handleAITextSubmit}
        UIOptions={{
          canvasActions: {
            toggleTheme: true,
            export: {
              onExportToBackend,
              renderCustomUI: excalidrawAPI
                ? () => {
                    return (
                      <div
                        className="Card"
                        style={{
                          background: "var(--color-primary)",
                          color: "white",
                          borderRadius: "8px",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "8px",
                          cursor: "pointer",
                          minWidth: "160px",
                          textAlign: "center",
                        }}
                        onClick={handleExportToPPTX}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            handleExportToPPTX();
                          }
                        }}
                      >
                        <div
                          style={{
                            width: "3.2rem",
                            height: "3.2rem",
                            borderRadius: "50%",
                            backgroundColor: "rgba(255,255,255,0.2)",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          <svg
                            width="28"
                            height="28"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="white"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <rect
                              x="2"
                              y="3"
                              width="20"
                              height="14"
                              rx="2"
                              ry="2"
                            />
                            <line x1="8" y1="21" x2="16" y2="21" />
                            <line x1="12" y1="17" x2="12" y2="21" />
                          </svg>
                        </div>
                        <h2 style={{ margin: 0, fontSize: "1rem" }}>
                          PowerPoint
                        </h2>
                        <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>
                          Exporta como presentación .pptx
                        </div>
                        <button
                          className="Card-button"
                          style={{
                            marginTop: "4px",
                            background: "white",
                            color: "var(--color-primary)",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px 16px",
                            fontWeight: 600,
                            cursor: "pointer",
                          }}
                        >
                          Exportar
                        </button>
                      </div>
                    );
                  }
                : undefined,
            },
          },
        }}
        langCode={langCode}
        renderCustomStats={renderCustomStats}
        detectScroll={false}
        handleKeyboardGlobally={true}
        autoFocus={true}
        theme={editorTheme}
        onThemeChange={setAppTheme}

        onLinkOpen={(element, event) => {
          if (element.link && isElementLink(element.link)) {
            event.preventDefault();
            excalidrawAPI?.setViewport({
              target: element.link,
              fit: "scale-down",
              animation: true,
            });
          }
        }}
      >
        <AppMainMenu
          onCollabDialogOpen={onCollabDialogOpen}
          isCollaborating={isCollaborating}
          isCollabEnabled={!isCollabDisabled}
          theme={appTheme}
          refresh={() => forceRefresh((prev) => !prev)}
          onBackToWorkspaces={handleBackToWorkspaces}
        />
        <AppWelcomeScreen
          onCollabDialogOpen={onCollabDialogOpen}
          isCollabEnabled={!isCollabDisabled}
        />
        <OverwriteConfirmDialog>
          <OverwriteConfirmDialog.Actions.ExportToImage />
          <OverwriteConfirmDialog.Actions.SaveToDisk />

        </OverwriteConfirmDialog>
        <AppFooter onChange={() => excalidrawAPI?.refresh()} />
        {excalidrawAPI && <AIComponents excalidrawAPI={excalidrawAPI} />}

        <TTDDialogTrigger />
        {isCollaborating && isOffline && (
          <div className="alertalert--warning">
            {t("alerts.collabOfflineWarning")}
          </div>
        )}
        {localStorageQuotaExceeded && (
          <div className="alert alert--danger">
            {t("alerts.localStorageQuotaExceeded")}
          </div>
        )}
        {latestShareableLink && (
          <ShareableLinkDialog
            link={latestShareableLink}
            onCloseRequest={() => setLatestShareableLink(null)}
            setErrorMessage={setErrorMessage}
          />
        )}
        {excalidrawAPI && !isCollabDisabled && (
          <Collab excalidrawAPI={excalidrawAPI} />
        )}

        <ShareDialog
          collabAPI={collabAPI}
          onExportToBackend={async () => {
            if (excalidrawAPI) {
              try {
                await onExportToBackend(
                  excalidrawAPI.getSceneElements(),
                  excalidrawAPI.getAppState(),
                  excalidrawAPI.getFiles(),
                );
              } catch (error: any) {
                setErrorMessage(error.message);
              }
            }
          }}
        />

        <AppSidebar
          comments={comments}
          setComments={setComments}
          activeBoardId={activeBoardId}
          excalidrawAPI={excalidrawAPI}
          onResolveComment={handleResolveComment}
        />

        {errorMessage && (
          <ErrorDialog onClose={() => setErrorMessage("")}>
            {errorMessage}
          </ErrorDialog>
        )}

        <CommandPalette
          customCommandPaletteItems={[
            {
              label: t("labels.liveCollaboration"),
              category: DEFAULT_CATEGORIES.app,
              keywords: [
                "team",
                "multiplayer",
                "share",
                "public",
                "session",
                "invite",
              ],
              icon: usersIcon,
              perform: () => {
                setShareDialogState({
                  isOpen: true,
                  type: "collaborationOnly",
                });
              },
            },
            {
              label: t("roomDialog.button_stopSession"),
              category: DEFAULT_CATEGORIES.app,
              predicate: () => !!collabAPI?.isCollaborating(),
              keywords: [
                "stop",
                "session",
                "end",
                "leave",
                "close",
                "exit",
                "collaboration",
              ],
              perform: () => {
                if (collabAPI) {
                  collabAPI.stopCollaboration();
                  if (!collabAPI.isCollaborating()) {
                    setShareDialogState({ isOpen: false });
                  }
                }
              },
            },
            {
              label: t("labels.share"),
              category: DEFAULT_CATEGORIES.app,
              predicate: true,
              icon: share,
              keywords: [
                "link",
                "shareable",
                "readonly",
                "export",
                "publish",
                "snapshot",
                "url",
                "collaborate",
                "invite",
              ],
              perform: async () => {
                setShareDialogState({ isOpen: true, type: "share" });
              },
            },
            {
              label: "GitHub",
              icon: GithubIcon,
              category: DEFAULT_CATEGORIES.links,
              predicate: true,
              keywords: [
                "issues",
                "bugs",
                "requests",
                "report",
                "features",
                "social",
                "community",
              ],
              perform: () => {
                window.open(
                  "https://github.com/excalidraw/excalidraw",
                  "_blank",
                  "noopener noreferrer",
                );
              },
            },
            {
              label: t("labels.followUs"),
              icon: XBrandIcon,
              category: DEFAULT_CATEGORIES.links,
              predicate: true,
              keywords: ["twitter", "contact", "social", "community"],
              perform: () => {
                window.open(
                  "https://x.com/excalidraw",
                  "_blank",
                  "noopener noreferrer",
                );
              },
            },
            {
              label: t("labels.discordChat"),
              category: DEFAULT_CATEGORIES.links,
              predicate: true,
              icon: DiscordIcon,
              keywords: [
                "chat",
                "talk",
                "contact",
                "bugs",
                "requests",
                "report",
                "feedback",
                "suggestions",
                "social",
                "community",
              ],
              perform: () => {
                window.open(
                  "https://discord.gg/UexuTaE",
                  "_blank",
                  "noopener noreferrer",
                );
              },
            },
            {
              label: "YouTube",
              icon: youtubeIcon,
              category: DEFAULT_CATEGORIES.links,
              predicate: true,
              keywords: ["features", "tutorials", "howto", "help", "community"],
              perform: () => {
                window.open(
                  "https://youtube.com/@excalidraw",
                  "_blank",
                  "noopener noreferrer",
                );
              },
            },



            {
              label: t("labels.installPWA"),
              category: DEFAULT_CATEGORIES.app,
              predicate: () => !!pwaEvent,
              perform: () => {
                if (pwaEvent) {
                  pwaEvent.prompt();
                  pwaEvent.userChoice.then(() => {
                    // event cannot be reused, but we'll hopefully
                    // grab new one as the event should be fired again
                    pwaEvent = null;
                  });
                }
              },
            },
          ]}
        />
      </Excalidraw>
      {isCollaborating && (
        <CollabChat
          sendChatMessage={collabAPI?.sendChatMessage}
          username={collabAPI?.getUsername() || "Invitado"}
        />
      )}
      <NotificationManager isCollaborating={isCollaborating} />

      {activeBoardId && excalidrawAPI && minimapAppStateRef.current && (
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        <Minimap
          key="minimap"
          elements={minimapElementsRef.current}
          appState={minimapAppStateRef.current}
          excalidrawAPI={excalidrawAPI}
          tick={minimapTick}
          visible={minimapVisible}
          onClose={() => setMinimapVisible(false)}
          updateRef={minimapUpdateRef}
        />
      )}

      {activeBoardId && excalidrawAPI && minimapAppStateRef.current && (
        <PDFTextLayersOverlay
          elements={minimapElementsRef.current}
          appState={minimapAppStateRef.current}
          updateRef={textLayersOverlayUpdateRef}
        />
      )}

      {activeBoardId && activeBoardId !== "collab_room" && presenceUsers.length > 0 && !isPresenting && (
        <PresenceBar users={presenceUsers} />
      )}

      {/* Guest Mode Banner: Local Board & Save to Cloud Call to Action */}
      {activeBoardId && activeBoardId !== "collab_room" && !userSession && (
        <div
          className="guest-mode-banner"
          style={{
            position: "fixed",
            top: "12px",
            left: "50%",
            transform: "translateX(-50%)",
            backgroundColor: "rgba(30, 41, 59, 0.92)",
            backdropFilter: "blur(8px)",
            color: "#f8fafc",
            padding: "6px 14px",
            borderRadius: "20px",
            fontSize: "12px",
            fontWeight: "500",
            boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
            zIndex: 9999,
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <span>Pizarra local guardada en navegador</span>
          <button
            onClick={() => handleBackToWorkspaces()}
            style={{
              backgroundColor: "#ef4444",
              color: "#fff",
              border: "none",
              borderRadius: "12px",
              padding: "4px 10px",
              fontSize: "11px",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Guardar en la Nube
          </button>
        </div>
      )}

      {/* Grupo Unificado de Botones Flotantes — oculto durante presentación */}
      {excalidrawAPI && activeBoardId && !isPresenting && (
        <div
          className="floating-action-buttons-group"
          style={{
            position: "fixed",
            top: "140px",
            right: showNotesSidebar || Boolean(excalidrawAPI?.getAppState()?.openSidebar) ? "370px" : "18px",
            display: "flex",
            flexDirection: "column",
            gap: "6px",
            zIndex: 9999999,
            transition: "right 0.25s cubic-bezier(0.4, 0, 0.2, 1)",
            pointerEvents: "auto",
          }}
          onPointerDown={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
        >
          {/* 1. Modo Estudio */}
          <button
            className="floating-action-btn floating-study-btn"
            onPointerDown={(e) => { e.stopPropagation(); setShowStudyMode(true); }}
            title="Modo Estudio"
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              backgroundColor: "#ffffff", color: "#ef4444",
              border: "1.5px solid #fecaca",
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "auto",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
            </svg>
          </button>

          {/* 2. LaTeX */}
          <button
            className="floating-action-btn"
            onPointerDown={(e) => { e.stopPropagation(); setShowLaTeXModal(true); setTechnicalInputText(""); }}
            title="Insertar Ecuación LaTeX"
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              backgroundColor: "#ffffff", color: "#ef4444",
              border: "1.5px solid #fecaca",
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: "bold", fontSize: "15px", pointerEvents: "auto",
            }}
          >
            Σ
          </button>

          {/* 3. Google Drive */}
          <button
            className="floating-action-btn"
            onPointerDown={(e) => {
              e.stopPropagation();
              openGooglePicker((info) => {
                if (!excalidrawAPI) return;
                const x = (-excalidrawAPI.getAppState().scrollX + 150);
                const y = (-excalidrawAPI.getAppState().scrollY + 150);
                const elements = createGoogleDriveCard(info, x, y);
                if (elements && elements.length > 0) {
                  (excalidrawAPI as any).updateScene({
                    elements: [...(excalidrawAPI.getSceneElements() || []), ...elements],
                  });
                  (excalidrawAPI as any).scrollToContent?.(elements, { fitToViewport: true });
                }
              });
            }}
            title="Abrir selector de Google Drive"
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              backgroundColor: "#ffffff", color: "#4285F4",
              border: "1.5px solid #dbeafe",
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "auto",
            }}
          >
            {/* Google Drive icon */}
            <svg width="16" height="16" viewBox="0 0 87.3 78" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
              <path d="m6.6 66.85 3.85 6.65c.8 1.4 1.95 2.5 3.3 3.3l13.75-23.8h-27.5c0 1.55.4 3.1 1.2 4.5z" fill="#0066da"/>
              <path d="m43.65 25-13.75-23.8c-1.35.8-2.5 1.9-3.3 3.3l-25.4 44a9.06 9.06 0 0 0 -1.2 4.5h27.5z" fill="#00ac47"/>
              <path d="m73.55 76.8c1.35-.8 2.5-1.9 3.3-3.3l1.6-2.75 7.65-13.25c.8-1.4 1.2-2.95 1.2-4.5h-27.502l5.852 11.5z" fill="#ea4335"/>
              <path d="m43.65 25 13.75-23.8c-1.35-.8-2.9-1.2-4.5-1.2h-18.5c-1.6 0-3.15.45-4.5 1.2z" fill="#00832d"/>
              <path d="m59.8 53h-32.3l-13.75 23.8c1.35.8 2.9 1.2 4.5 1.2h50.8c1.6 0 3.15-.45 4.5-1.2z" fill="#2684fc"/>
              <path d="m73.4 26.5-12.7-22c-.8-1.4-1.95-2.5-3.3-3.3l-13.75 23.8 16.15 28h27.45c0-1.55-.4-3.1-1.2-4.5z" fill="#ffba00"/>
            </svg>
          </button>

          {/* 4. Mermaid */}
          <button
            className="floating-action-btn"
            onPointerDown={(e) => { e.stopPropagation(); setShowMermaidModal(true); setTechnicalInputText(""); }}
            title="Diagrama Mermaid — convierte código a nodos y flechas"
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              backgroundColor: "#ffffff", color: "#d97706",
              border: "1.5px solid #fde68a",
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "auto",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="5" r="2"/>
              <circle cx="5" cy="19" r="2"/>
              <circle cx="19" cy="19" r="2"/>
              <line x1="12" y1="7" x2="5" y2="17"/>
              <line x1="12" y1="7" x2="19" y2="17"/>
            </svg>
          </button>

          {/* 5. Sheets — tabla vectorial desde datos pegados */}
          <button
            className="floating-action-btn floating-sheets-btn"
            onPointerDown={(e) => { e.stopPropagation(); setShowSheetsModal(true); setSheetInputText(""); }}
            title="Importar tabla desde Google Sheets o CSV"
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              backgroundColor: "#ffffff", color: "#0f9d58",
              border: "1.5px solid #bbf7d0",
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "auto",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19.002 3h-14c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 3h5v2h-5V6zm0 3h5v2h-5V9zm0 3h5v2h-5v-2zM7 6h3v2H7V6zm0 3h3v2H7V9zm0 3h3v2H7v-2zm0 3h10v2H7v-2z"/>
            </svg>
          </button>

          {/* 6. Importar PDF */}
          <button
            className="floating-action-btn floating-pdf-btn"
            disabled={isImportingPDF}
            onPointerDown={(e) => {
              e.stopPropagation();
              if (isImportingPDF) return;
              const input = document.createElement("input");
              input.type = "file";
              input.accept = "application/pdf";
              input.onchange = async (evt: any) => {
                const file = evt.target.files?.[0];
                if (!file || !excalidrawAPI) return;
                setIsImportingPDF(true);
                try {
                  const { images, elements } = await importPDFToCanvas(file);
                  const binaryFiles = images.map((img: any) => ({
                    id: img.id as any,
                    dataURL: img.dataURL as any,
                    mimeType: (img.mimeType || "image/jpeg") as any,
                    created: Date.now(),
                  }));
                  excalidrawAPI.addFiles(binaryFiles);
                  const currentFiles = { ...(excalidrawAPI.getFiles() || {}) };
                  binaryFiles.forEach((f: any) => { currentFiles[f.id] = f; });
                  (excalidrawAPI as any).updateScene({
                    elements: [...(excalidrawAPI.getSceneElements() || []), ...elements],
                    files: currentFiles,
                  });
                  (excalidrawAPI as any).scrollToContent?.(elements, { fitToViewport: true });

                  // Subida asíncrona a Supabase Storage en segundo plano
                  const boardFolder = activeBoardId || "local_board";
                  images.forEach(async (img: any) => {
                    try {
                      const bucketName = "excalidraw-files";
                      const filePath = `${boardFolder}/${img.id}.jpg`;
                      
                      const { error } = await supabase.storage
                        .from(bucketName)
                        .upload(filePath, img.blob, {
                          contentType: "image/jpeg",
                          upsert: true,
                        });
                      
                      if (error) {
                        console.warn(`[Background Storage] Error al subir ${img.id}:`, error.message);
                        return;
                      }

                      const { data } = supabase.storage
                        .from(bucketName)
                        .getPublicUrl(filePath);
                      
                      const publicUrl = data.publicUrl;

                      if (excalidrawAPI) {
                        const filesStore = excalidrawAPI.getFiles();
                        const updatedFiles = {
                          ...filesStore,
                          [img.id]: {
                            ...filesStore[img.id],
                            dataURL: publicUrl as any,
                          },
                        };

                        excalidrawAPI.addFiles([{
                          id: img.id,
                          dataURL: publicUrl as any,
                          mimeType: "image/jpeg",
                          created: Date.now(),
                        }]);

                        (excalidrawAPI as any).updateScene({
                          files: updatedFiles,
                        });
                      }
                    } catch (uploadErr) {
                      console.error(`[Background Storage] Fallo en carga para ${img.id}:`, uploadErr);
                    }
                  });
                } catch (err) {
                  console.error("PDF import error:", err);
                  alert("Error al importar el PDF.");
                } finally {
                  setIsImportingPDF(false);
                  input.remove();
                }
              };
              document.body.appendChild(input);
              input.click();
            }}
            title={isImportingPDF ? "Importando PDF..." : "Importar PDF al canvas"}
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              backgroundColor: isImportingPDF ? "#ef4444" : "#ffffff",
              color: isImportingPDF ? "#ffffff" : "#ef4444",
              border: "1.5px solid #fecaca",
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              cursor: isImportingPDF ? "wait" : "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
              pointerEvents: "auto",
            }}
          >
            {isImportingPDF ? (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ animation: "spin 1s linear infinite" }}>
                <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
              </svg>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <span style={{ position: "absolute", bottom: "2px", right: "2px", fontSize: "6px", fontWeight: 800, color: "#ef4444", letterSpacing: "-0.5px", lineHeight: 1 }}>PDF</span>
              </>
            )}
          </button>

          {/* 8. Notas del Elemento */}
          <button
            className="floating-action-btn floating-notes-btn"
            onPointerDown={(e) => { e.stopPropagation(); setShowNotesSidebar(!showNotesSidebar); }}
            title={showNotesSidebar ? "Cerrar notas" : "Notas del elemento"}
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              backgroundColor: showNotesSidebar ? "#ef4444" : "#ffffff",
              color: showNotesSidebar ? "#ffffff" : "#ef4444",
              border: `1.5px solid ${showNotesSidebar ? "#ef4444" : "#fecaca"}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "auto",
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/>
            </svg>
          </button>

          {/* 9. Modo Presentación */}
          <button
            className="floating-action-btn floating-presentation-btn"
            onPointerDown={(e) => { e.stopPropagation(); setIsPresenting(!isPresenting); }}
            title="Iniciar modo presentación"
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              backgroundColor: "#ffffff", color: "#ef4444",
              border: "1.5px solid #fecaca",
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "auto",
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          </button>

          {/* 10. Modo Comentarios */}
          {activeBoardId !== "collab_room" && (
            <button
              className={`floating-action-btn floating-comment-mode-btn ${commentModeActive ? "active" : ""}`}
              onPointerDown={(e) => { e.stopPropagation(); setCommentModeActive(!commentModeActive); }}
              title={commentModeActive ? "Desactivar comentarios" : "Activar modo comentarios"}
              style={{
                width: "36px", height: "36px", borderRadius: "50%",
                backgroundColor: commentModeActive ? "#ef4444" : "#ffffff",
                color: commentModeActive ? "#ffffff" : "#64748b",
                border: `1.5px solid ${commentModeActive ? "#ef4444" : "#e2e8f0"}`,
                boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
                cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center",
                pointerEvents: "auto",
              }}
            >
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
            </button>
          )}

          {/* 11. Alternar Mapa del Canvas */}
          <button
            className={`floating-action-btn floating-minimap-btn ${minimapVisible ? "active" : ""}`}
            onPointerDown={(e) => {
              e.stopPropagation();
              setMinimapVisible(!minimapVisible);
            }}
            title={minimapVisible ? "Ocultar mapa del canvas" : "Mostrar mapa del canvas"}
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "50%",
              backgroundColor: minimapVisible ? "#ef4444" : "#ffffff",
              color: minimapVisible ? "#ffffff" : "#ef4444",
              border: `1.5px solid ${minimapVisible ? "#ef4444" : "#fecaca"}`,
              boxShadow: "0 2px 8px rgba(0,0,0,0.10)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "auto",
            }}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21" />
              <line x1="9" y1="3" x2="9" y2="18" />
              <line x1="15" y1="6" x2="15" y2="21" />
            </svg>
          </button>
        </div>
      )}
      {showLaTeXModal && (
        <div onPointerDown={(e) => e.stopPropagation()} style={{ position: "fixed", inset: 0, zIndex: 99999999, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "28px", width: "480px", maxWidth: "90vw", boxShadow: "0 25px 60px rgba(0,0,0,0.2)", fontFamily: "'Outfit','Inter',sans-serif" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700, color: "#1e293b" }}>Insertar Ecuación LaTeX (SVG)</h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>Escribe tu expresión en sintaxis LaTeX. Se compilará localmente a una imagen vectorial SVG nítida con renderizado matemático real.</p>
            <textarea
              autoFocus
              value={technicalInputText}
              onChange={(e) => setTechnicalInputText(e.target.value)}
              placeholder="Ejemplo: \int_{a}^{b} x^2 \, dx = \frac{b^3 - a^3}{3}"
              rows={4}
              disabled={isRenderingLaTeX}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "14px", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
              <button 
                onClick={() => { setShowLaTeXModal(false); setTechnicalInputText(""); }} 
                disabled={isRenderingLaTeX}
                style={{ padding: "9px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#fff", fontSize: "13px", fontWeight: 600, color: "#475569", cursor: isRenderingLaTeX ? "not-allowed" : "pointer" }}
              >
                Cancelar
              </button>
              <button
                onClick={async () => {
                  if (!technicalInputText.trim() || !excalidrawAPI || isRenderingLaTeX) return;
                  setIsRenderingLaTeX(true);
                  try {
                    const x = (-excalidrawAPI.getAppState().scrollX + 200);
                    const y = (-excalidrawAPI.getAppState().scrollY + 200);
                    await insertLaTeXSVGToCanvas(technicalInputText.trim(), excalidrawAPI, x, y);
                    setShowLaTeXModal(false);
                    setTechnicalInputText("");
                  } catch (err) {
                    alert("No se pudo compilar la expresión LaTeX. Por favor, verifica la sintaxis.");
                  } finally {
                    setIsRenderingLaTeX(false);
                  }
                }}
                disabled={isRenderingLaTeX}
                style={{ 
                  padding: "9px 18px", 
                  borderRadius: "8px", 
                  border: "none", 
                  backgroundColor: isRenderingLaTeX ? "#fca5a5" : "#ef4444", 
                  color: "#fff", 
                  fontSize: "13px", 
                  fontWeight: 600, 
                  cursor: isRenderingLaTeX ? "wait" : "pointer" 
                }}
              >
                {isRenderingLaTeX ? "Compilando..." : "Insertar en Canvas"}
              </button>
            </div>
          </div>
        </div>
      )}



      {/* Modal CSV / Datos */}
      {showDataModal && (
        <div onPointerDown={(e) => e.stopPropagation()} style={{ position: "fixed", inset: 0, zIndex: 99999999, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "28px", width: "520px", maxWidth: "90vw", boxShadow: "0 25px 60px rgba(0,0,0,0.2)", fontFamily: "'Outfit','Inter',sans-serif" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700, color: "#1e293b" }}>Importar Datos CSV</h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>Pega tus datos CSV (separados por coma o tabulación). Se generará una tabla vectorial en el canvas.</p>
            <textarea
              autoFocus
              value={technicalInputText}
              onChange={(e) => setTechnicalInputText(e.target.value)}
              placeholder={"Nombre,Valor,Categoría\nProducto A,120,Cat1\nProducto B,85,Cat2"}
              rows={6}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
              <button onClick={() => { setShowDataModal(false); setTechnicalInputText(""); }} style={{ padding: "9px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#fff", fontSize: "13px", fontWeight: 600, color: "#475569", cursor: "pointer" }}>Cancelar</button>
              <button
                onClick={() => {
                  if (!technicalInputText.trim() || !excalidrawAPI) return;
                  const { elements } = parseSheetDataToExcalidraw(technicalInputText, 150, 150);
                  if (elements.length > 0) {
                    excalidrawAPI.updateScene({
                      elements: [...(excalidrawAPI.getSceneElements() || []), ...elements],
                    });
                    (excalidrawAPI as any).scrollToContent?.(elements, { fitToViewport: true });
                    setShowDataModal(false);
                    setTechnicalInputText("");
                  } else {
                    alert("No se detectaron datos válidos. Verifica el formato CSV.");
                  }
                }}
                style={{ padding: "9px 18px", borderRadius: "8px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                Generar Tabla en Canvas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Mermaid */}
      {showMermaidModal && (
        <div onPointerDown={(e) => e.stopPropagation()} style={{ position: "fixed", inset: 0, zIndex: 99999999, display: "flex", alignItems: "center", justifyContent: "center", backgroundColor: "rgba(0,0,0,0.5)" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "16px", padding: "28px", width: "520px", maxWidth: "90vw", boxShadow: "0 25px 60px rgba(0,0,0,0.2)", fontFamily: "'Outfit','Inter',sans-serif" }}>
            <h3 style={{ margin: "0 0 6px", fontSize: "17px", fontWeight: 700, color: "#1e293b" }}>Convertir Código Mermaid</h3>
            <p style={{ margin: "0 0 16px", fontSize: "13px", color: "#64748b" }}>Pega tu bloque de código Mermaid (flowchart, sequenceDiagram, etc.) para convertirlo a elementos vectoriales.</p>
            <textarea
              autoFocus
              value={technicalInputText}
              onChange={(e) => setTechnicalInputText(e.target.value)}
              placeholder={"flowchart TD\n  A[Inicio] --> B{Condición}\n  B -->|Sí| C[Proceso]\n  B -->|No| D[Fin]"}
              rows={7}
              style={{ width: "100%", padding: "12px", borderRadius: "10px", border: "1px solid #e2e8f0", fontSize: "13px", fontFamily: "monospace", resize: "vertical", outline: "none", boxSizing: "border-box" }}
            />
            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end", marginTop: "16px" }}>
              <button onClick={() => { setShowMermaidModal(false); setTechnicalInputText(""); }} style={{ padding: "9px 16px", borderRadius: "8px", border: "1px solid #e2e8f0", backgroundColor: "#fff", fontSize: "13px", fontWeight: 600, color: "#475569", cursor: "pointer" }}>Cancelar</button>
              <button
                onClick={() => {
                  if (!technicalInputText.trim() || !excalidrawAPI) return;
                  const x = (-excalidrawAPI.getAppState().scrollX + 150);
                  const y = (-excalidrawAPI.getAppState().scrollY + 150);
                  const { elements } = convertMermaidToCanvas(technicalInputText.trim(), x, y);
                  if (elements && elements.length > 0) {
                    (excalidrawAPI as any).updateScene({
                      elements: [...(excalidrawAPI.getSceneElements() || []), ...elements],
                    });
                    (excalidrawAPI as any).scrollToContent?.(elements, { fitToViewport: true });
                  } else {
                    alert("No se pudieron generar elementos válidos del código Mermaid. Verifica la sintaxis.");
                  }
                  setShowMermaidModal(false);
                  setTechnicalInputText("");
                }}
                style={{ padding: "9px 18px", borderRadius: "8px", border: "none", backgroundColor: "#ef4444", color: "#fff", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                Insertar en Canvas
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comment Overlay to Capture Click */}
      {commentModeActive && (
        <>
          <div
            className="comment-mode-overlay"
            onClick={handleOverlayClick}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100vw",
              height: "100vh",
              zIndex: 9999,
              cursor: "crosshair",
              backgroundColor: "transparent",
            }}
          />
          <div
            style={{
              position: "fixed",
              top: "20px",
              left: "50%",
              transform: "translateX(-50%)",
              backgroundColor: "rgba(239, 68, 68, 0.95)",
              color: "white",
              padding: "8px 16px",
              borderRadius: "20px",
              fontSize: "13px",
              fontWeight: "600",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              zIndex: 999999,
              pointerEvents: "none",
              fontFamily: "'Outfit', 'Inter', -apple-system, sans-serif",
            }}
          >
            Modo Comentarios: Haz clic en el lienzo para anclar una nota
          </div>
        </>
      )}

      {/* Render Comment Pins */}
      {activeBoardId &&
        comments.map((comment) => {
          if (comment.resolved || !excalidrawAPI) {
            return null;
          }

          const appState = excalidrawAPI.getAppState();
          const viewportX =
            (comment.x + appState.scrollX) * appState.zoom.value + appState.offsetLeft;
          const viewportY =
            (comment.y + appState.scrollY) * appState.zoom.value + appState.offsetTop;

          return (
            <div
              key={comment.id}
              className="comment-pin"
              data-x={comment.x}
              data-y={comment.y}
              onClick={(e) => {
                e.stopPropagation();
                setActiveCommentPopupId(comment.id);
              }}
              style={{
                position: "fixed",
                left: `${viewportX}px`,
                top: `${viewportY}px`,
                width: "28px",
                height: "28px",
                transform: "translate(-50%, -100%)",
                backgroundColor: "#a855f7",
                border: "2px solid white",
                borderRadius: "50% 50% 50% 0",
                boxShadow: "0 4px 10px rgba(0,0,0,0.25)",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "14px",
                fontWeight: "bold",
                cursor: "pointer",
                zIndex: 4,
                transition: "background-color 0.1s ease, box-shadow 0.1s ease, transform 0.1s ease",
              }}
              title={`Comentario de ${comment.author}`}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
          );
        })}

      {/* Render Comment Popup */}
      {activeCommentPopupId &&
        (() => {
          const comment = comments.find((c) => c.id === activeCommentPopupId);
          if (!comment || !excalidrawAPI) {
            return null;
          }

          const appState = excalidrawAPI.getAppState();
          const viewportX =
            (comment.x + appState.scrollX) * appState.zoom.value + appState.offsetLeft;
          const viewportY =
            (comment.y + appState.scrollY) * appState.zoom.value + appState.offsetTop;

          return (
            <div
              className="comment-popup"
              data-x={comment.x}
              data-y={comment.y}
              style={{
                position: "fixed",
                left: `${viewportX}px`,
                top: `${viewportY - 10}px`,
                transform: "translate(-50%, -100%)",
                backgroundColor: "var(--bg-primary, white)",
                border: "1px solid var(--border-color, #e2e8f0)",
                borderRadius: "14px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.15)",
                padding: "16px",
                width: "280px",
                zIndex: 100,
                color: "var(--text-primary, black)",
                fontFamily: "var(--font-family, sans-serif)",
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >
              {/* Chat Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-color, #eee)", paddingBottom: "6px" }}>
                <span style={{ fontWeight: 700, fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-secondary, #64748b)" }}>
                  Discusión
                </span>
                <span style={{ fontSize: "9px", color: "var(--text-secondary, #94a3b8)" }}>
                  {new Date(comment.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                </span>
              </div>

              {/* Chat Message Thread */}
              <div
                style={{
                  maxHeight: "180px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px",
                  paddingRight: "4px",
                }}
              >
                {/* Main Comment */}
                <div style={{ display: "flex", gap: "8px" }}>
                  <div style={{
                    width: "24px",
                    height: "24px",
                    borderRadius: "50%",
                    backgroundColor: getAvatarColor(comment.author),
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "11px",
                    fontWeight: "bold",
                    flexShrink: 0
                  }}>
                    {comment.author.charAt(0).toUpperCase()}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                      <span style={{ fontWeight: 600, fontSize: "11.5px", color: "var(--text-primary)" }}>{comment.author}</span>
                      <span style={{ fontSize: "8.5px", color: "#888" }}>
                        {new Date(comment.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                    <div style={{
                      backgroundColor: "rgba(168, 85, 247, 0.08)",
                      color: "var(--text-primary)",
                      padding: "8px 12px",
                      borderRadius: "0 12px 12px 12px",
                      fontSize: "12px",
                      lineHeight: "1.4",
                      whiteSpace: "pre-wrap",
                    }}>
                      {comment.text}
                    </div>
                  </div>
                </div>

                {/* Replies */}
                {(comment.replies || []).map((reply: any) => (
                  <div key={reply.id} style={{ display: "flex", gap: "8px" }}>
                    <div style={{
                      width: "20px",
                      height: "20px",
                      borderRadius: "50%",
                      backgroundColor: getAvatarColor(reply.author),
                      color: "white",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "10px",
                      fontWeight: "bold",
                      flexShrink: 0
                    }}>
                      {reply.author.charAt(0).toUpperCase()}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "2px" }}>
                        <span style={{ fontWeight: 600, fontSize: "11px", color: "var(--text-primary)" }}>{reply.author}</span>
                        <span style={{ fontSize: "8px", color: "#999" }}>
                          {new Date(reply.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </span>
                      </div>
                      <div style={{
                        backgroundColor: "var(--bg-secondary, #f1f5f9)",
                        color: "var(--text-primary)",
                        padding: "6px 10px",
                        borderRadius: "0 12px 12px 12px",
                        fontSize: "11px",
                        lineHeight: "1.3",
                        whiteSpace: "pre-wrap",
                      }}>
                        {reply.text}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Chat Input Area */}
              <div
                style={{
                  display: "flex",
                  gap: "6px",
                  borderTop: "1px solid var(--border-color, #eee)",
                  paddingTop: "10px",
                  marginTop: "2px",
                }}
              >
                <input
                  type="text"
                  placeholder="Escribe una respuesta..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleReplyComment(comment.id);
                    }
                  }}
                  style={{
                    flex: 1,
                    fontSize: "11.5px",
                    padding: "6px 10px",
                    borderRadius: "20px",
                    border: "1px solid var(--border-color, #ccc)",
                    outline: "none",
                    backgroundColor: "var(--bg-primary, white)",
                    color: "var(--text-primary, black)",
                  }}
                />
                <button
                  onClick={() => handleReplyComment(comment.id)}
                  style={{
                    width: "26px",
                    height: "26px",
                    borderRadius: "50%",
                    backgroundColor: "#a855f7",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "12px",
                    flexShrink: 0,
                  }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="12" y1="19" x2="12" y2="5"></line>
                    <polyline points="5 12 12 5 19 12"></polyline>
                  </svg>
                </button>
              </div>

              {/* Footer Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginTop: "2px",
                }}
              >
                <button
                  onClick={() => setActiveCommentPopupId(null)}
                  style={{
                    background: "none",
                    border: "none",
                    fontSize: "11px",
                    color: "var(--text-secondary, #64748b)",
                    cursor: "pointer",
                    fontWeight: 600,
                  }}
                >
                  Cerrar
                </button>
                <button
                  onClick={() => handleResolveComment(comment.id)}
                  style={{
                    padding: "4px 10px",
                    fontSize: "11px",
                    backgroundColor: "#ef4444",
                    color: "white",
                    border: "none",
                    borderRadius: "20px",
                    cursor: "pointer",
                    fontWeight: 600,
                    boxShadow: "0 2px 4px rgba(239, 68, 68, 0.15)",
                  }}
                >
                  Resolver
                </button>
              </div>
            </div>
          );
        })()}

      {/* Add Comment Dialog Modal */}
      {showAddCommentModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(15, 23, 42, 0.4)",
            backdropFilter: "blur(6px)",
            WebkitBackdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999999,
          }}
        >
          <div
            style={{
              backgroundColor: "var(--bg-primary, white)",
              padding: "24px",
              borderRadius: "14px",
              width: "360px",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
              border: "1px solid var(--border-color, #e2e8f0)",
              color: "var(--text-primary, black)",
              fontFamily: "var(--font-family, sans-serif)",
            }}
          >
            <h3
              style={{
                margin: "0 0 16px 0",
                fontSize: "16px",
                fontWeight: "700",
              }}
            >
              Dejar un Comentario
            </h3>

            <div style={{ marginBottom: "14px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-secondary, #64748b)",
                  marginBottom: "6px",
                }}
              >
                Tu Nombre:
              </label>
              <input
                type="text"
                placeholder="Escribe tu nombre..."
                value={newCommentAuthor}
                onChange={(e) => setNewCommentAuthor(e.target.value)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid var(--border-color, #cbd5e1)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  outline: "none",
                  backgroundColor: "var(--bg-primary, white)",
                  color: "var(--text-primary, black)",
                  boxSizing: "border-box",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label
                style={{
                  display: "block",
                  fontSize: "12px",
                  fontWeight: 600,
                  color: "var(--text-secondary, #64748b)",
                  marginBottom: "6px",
                }}
              >
                Comentario:
              </label>
              <textarea
                placeholder="Escribe tu comentario aquí..."
                value={newCommentText}
                onChange={(e) => setNewCommentText(e.target.value)}
                rows={4}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  border: "1px solid var(--border-color, #cbd5e1)",
                  borderRadius: "8px",
                  fontSize: "13px",
                  outline: "none",
                  resize: "none",
                  backgroundColor: "var(--bg-primary, white)",
                  color: "var(--text-primary, black)",
                  boxSizing: "border-box",
                }}
                autoFocus
              />
            </div>

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: "10px",
              }}
            >
              <button
                onClick={() => {
                  setShowAddCommentModal(false);
                  setNewCommentCoords(null);
                }}
                style={{
                  padding: "8px 16px",
                  fontSize: "13px",
                  backgroundColor: "rgba(0,0,0,0.05)",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  color: "var(--text-secondary, #64748b)",
                  transition: "all 0.15s ease",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={handleCreateCommentConfirm}
                style={{
                  padding: "8px 18px",
                  fontSize: "13px",
                  backgroundColor: "#a855f7",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  cursor: "pointer",
                  fontWeight: "600",
                  boxShadow: "0 4px 6px -1px rgba(168, 85, 247, 0.2)",
                  transition: "all 0.15s ease",
                }}
              >
                Comentar
              </button>
            </div>
          </div>
        </div>
      )}

      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => {
            setShowAuthModal(false);
            syncBoardsWithSupabase();
          }}
        />
      )}

      {isPresenting && excalidrawAPI && (
        <PresentationMode
          excalidrawAPI={excalidrawAPI}
          onClose={() => setIsPresenting(false)}
          notesSidebarOpen={showNotesSidebar}
          activeBoardId={activeBoardId}
        />
      )}

      {/* Markdown Notes Sidebar */}
      {showNotesSidebar && activeBoardId && (
        <div
          className="notes-sidebar"
          style={{
            position: "fixed",
            right: 0,
            top: 0,
            width: "340px",
            height: "100vh",
            backgroundColor: "var(--bg-primary, white)",
            borderLeft: "1px solid var(--border-color, #e2e8f0)",
            boxShadow: "-4px 0 20px rgba(0,0,0,0.1)",
            zIndex: 9999,
            display: "flex",
            flexDirection: "column",
            color: "var(--text-primary, #0f172a)",
            fontFamily: "var(--font-family, sans-serif)",
          }}
        >
          {/* Header Tabs */}
          <div style={{ display: "flex", width: "100%", padding: "12px 16px 0 16px", backgroundColor: "var(--bg-secondary, #f8fafc)", borderBottom: "1px solid var(--border-color, #e2e8f0)", gap: "16px", boxSizing: "border-box" }}>
            <button
              onClick={() => setSidebarTab("notes")}
              style={{
                padding: "8px 4px",
                background: "none",
                border: "none",
                borderBottom: sidebarTab === "notes" ? "2px solid #ef4444" : "2px solid transparent",
                color: sidebarTab === "notes" ? "var(--text-primary)" : "var(--text-secondary, #64748b)",
                fontWeight: sidebarTab === "notes" ? 700 : 500,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Notas del Elemento
            </button>
            <button
              onClick={() => setSidebarTab("comments")}
              style={{
                padding: "8px 4px",
                background: "none",
                border: "none",
                borderBottom: sidebarTab === "comments" ? "2px solid #ef4444" : "2px solid transparent",
                color: sidebarTab === "comments" ? "var(--text-primary)" : "var(--text-secondary, #64748b)",
                fontWeight: sidebarTab === "comments" ? 700 : 500,
                fontSize: "13px",
                cursor: "pointer",
                transition: "all 0.15s ease",
              }}
            >
              Comentarios ({comments.filter(c => !c.resolved).length})
            </button>
            <div style={{ flex: 1 }} />
            <button
              onClick={() => setShowNotesSidebar(false)}
              style={{
                background: "none",
                border: "none",
                fontSize: "18px",
                cursor: "pointer",
                color: "var(--text-secondary, #64748b)",
                alignSelf: "center",
                paddingBottom: "8px"
              }}
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", padding: "16px", overflowY: "auto", boxSizing: "border-box" }}>
            {sidebarTab === "notes" ? (
              selectedElement ? (
                <>
                  {/* Segmented Control for Edit/Preview */}
                  <div style={{
                    display: "flex",
                    backgroundColor: "rgba(0,0,0,0.04)",
                    padding: "4px",
                    borderRadius: "8px",
                    marginBottom: "16px",
                    gap: "2px"
                  }}>
                    <button
                      onClick={() => setNotesEditMode("preview")}
                      style={{
                        flex: 1,
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        backgroundColor: notesEditMode === "preview" ? "white" : "transparent",
                        color: notesEditMode === "preview" ? "#a855f7" : "#64748b",
                        boxShadow: notesEditMode === "preview" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        transition: "all 0.15s ease"
                      }}
                    >
                      Vista Previa
                    </button>
                    <button
                      onClick={() => setNotesEditMode("edit")}
                      style={{
                        flex: 1,
                        padding: "6px 12px",
                        borderRadius: "6px",
                        border: "none",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                        backgroundColor: notesEditMode === "edit" ? "white" : "transparent",
                        color: notesEditMode === "edit" ? "#a855f7" : "#64748b",
                        boxShadow: notesEditMode === "edit" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                        transition: "all 0.15s ease"
                      }}
                    >
                      Editar Notas
                    </button>
                  </div>

                  {/* PDF Meta Header info */}
                  {selectedElement.customData?.pdfName && (
                    <div style={{
                      backgroundColor: "rgba(239, 68, 68, 0.05)",
                      border: "1.5px solid rgba(239, 68, 68, 0.15)",
                      borderRadius: "8px",
                      padding: "8px 12px",
                      marginBottom: "12px",
                      fontSize: "12px",
                      fontWeight: 600,
                      color: "#b91c1c",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                    }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      <span>📄 PDF: {selectedElement.customData.pdfName} (Pág. {selectedElement.customData.pageIndex} de {selectedElement.customData.totalPages})</span>
                    </div>
                  )}

                  {/* Content Area */}
                  {notesEditMode === "edit" ? (
                    <textarea
                      value={localNotes}
                      onChange={(e) => handleUpdateNotes(e.target.value)}
                      placeholder="Escribe tus especificaciones o notas aquí usando Markdown (ej. # Título, **negrita**, - listas)..."
                      style={{
                        flex: 1,
                        width: "100%",
                        padding: "10px",
                        borderRadius: "8px",
                        border: "1px solid var(--border-color, #ccc)",
                        fontSize: "13px",
                        lineHeight: "1.4",
                        fontFamily: "inherit",
                        resize: "none",
                        outline: "none",
                        backgroundColor: "var(--bg-primary, white)",
                        color: "var(--text-primary, black)",
                        boxSizing: "border-box",
                      }}
                    />
                  ) : (
                    !(selectedElement.customData?.notes || "").trim() ? (
                      <div style={{
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        padding: "40px 20px",
                        textAlign: "center",
                        color: "var(--text-secondary, #64748b)",
                        marginTop: "20px"
                      }}>
                        <div style={{ width: "40px", height: "40px", borderRadius: "50%", backgroundColor: "#f1f5f9", display: "flex", alignItems: "center", justifyContent: "center", color: "#64748b", marginBottom: "12px" }}>
                          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                            <polyline points="14 2 14 8 20 8"/>
                            <line x1="16" y1="13" x2="8" y2="13"/>
                            <line x1="16" y1="17" x2="8" y2="17"/>
                          </svg>
                        </div>
                        <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                          Sin especificaciones
                        </h4>
                        <p style={{ margin: "0 0 16px 0", fontSize: "12px", lineHeight: "1.4" }}>
                          Este elemento no tiene notas asignadas. Agrega especificaciones técnicas o guías de diseño en Markdown.
                        </p>
                        <button
                          onClick={() => setNotesEditMode("edit")}
                          style={{
                            padding: "8px 20px",
                            fontSize: "12.5px",
                            fontWeight: 600,
                            backgroundColor: "#a855f7",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            cursor: "pointer",
                            boxShadow: "0 2px 5px rgba(168,85,247,0.2)"
                          }}
                        >
                          Agregar Notas
                        </button>
                      </div>
                    ) : (
                      <div
                        className="markdown-preview"
                        onClick={(e) => {
                          const target = e.target as HTMLElement;
                          const elementId = target.getAttribute("data-element-id");
                          if (elementId && excalidrawAPI) {
                            const sceneElements = excalidrawAPI.getSceneElements();
                            const el = sceneElements.find((item: any) => item.id === elementId && !item.isDeleted);
                            if (el) {
                              excalidrawAPI.updateScene({
                                appState: { selectedElementIds: { [elementId]: true } }
                              });
                              (excalidrawAPI as any).scrollToContent([el], {
                                fitToViewport: false,
                                viewportZoomFactor: 1.0,
                                animate: true,
                              });
                            } else {
                              alert("El elemento enlazado no se encuentra en esta pizarra.");
                            }
                          }
                        }}
                        dangerouslySetInnerHTML={{
                          __html: parseMarkdownToHTML(selectedElement.customData?.notes || ""),
                        }}
                        style={{
                          flex: 1,
                          overflowY: "auto",
                          fontSize: "13px",
                          lineHeight: "1.6",
                        }}
                      />
                    )
                  )}
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    height: "80%",
                    textAlign: "center",
                    color: "var(--text-secondary, #64748b)",
                    padding: "0 20px",
                  }}
                >
                  <div style={{ fontSize: "28px", marginBottom: "12px" }}>ℹ️</div>
                  <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                    Ningún elemento seleccionado
                  </h4>
                  <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.4" }}>
                    Selecciona cualquier figura, texto o conector en el lienzo para escribir notas detalladas asociadas a ella.
                  </p>
                </div>
              )
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {comments.filter(c => !c.resolved).length === 0 ? (
                  <div style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "60px 20px",
                    textAlign: "center",
                    color: "var(--text-secondary, #64748b)"
                  }}>
                    <span style={{ fontSize: "36px", marginBottom: "12px" }}>💬</span>
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 600, color: "var(--text-primary)" }}>
                      No hay comentarios
                    </h4>
                    <p style={{ margin: 0, fontSize: "12px", lineHeight: "1.4" }}>
                      Activa el Modo Comentarios (icono de burbuja en el menú flotante) y haz clic en cualquier parte del lienzo para abrir una discusión.
                    </p>
                  </div>
                ) : (
                  comments.filter(c => !c.resolved).map((c) => (
                    <div
                      key={c.id}
                      onClick={() => {
                        if (excalidrawAPI) {
                          const zoom = excalidrawAPI.getAppState().zoom.value;
                          excalidrawAPI.updateScene({
                            appState: {
                              scrollX: -c.x + window.innerWidth / zoom / 2,
                              scrollY: -c.y + window.innerHeight / zoom / 2,
                            }
                          });
                          setActiveCommentPopupId(c.id);
                        }
                      }}
                      style={{
                        padding: "12px",
                        borderRadius: "10px",
                        border: "1px solid var(--border-color, #e2e8f0)",
                        backgroundColor: "var(--bg-primary, white)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: "0 1px 3px rgba(0,0,0,0.02)",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                        <div style={{
                          width: "20px",
                          height: "20px",
                          borderRadius: "50%",
                          backgroundColor: getAvatarColor(c.author),
                          color: "white",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "10px",
                          fontWeight: "bold"
                        }}>
                          {c.author.charAt(0).toUpperCase()}
                        </div>
                        <span style={{ fontWeight: 700, fontSize: "12px", color: "var(--text-primary)" }}>{c.author}</span>
                        <span style={{ fontSize: "9px", color: "#999", marginLeft: "auto" }}>
                          {new Date(c.createdAt).toLocaleDateString([], { month: "short", day: "numeric" })}
                        </span>
                      </div>
                      <p style={{
                        margin: 0,
                        fontSize: "12px",
                        color: "var(--text-secondary, #475569)",
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                        whiteSpace: "nowrap"
                      }}>
                        {c.text}
                      </p>
                      {(c.replies || []).length > 0 && (
                        <div style={{ fontSize: "10px", color: "#a855f7", marginTop: "6px", display: "flex", alignItems: "center", gap: "3px" }}>
                          <span>↳</span> {(c.replies || []).length} {(c.replies || []).length === 1 ? "respuesta" : "respuestas"}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      )}
      {showSheetsModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 9999999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "'Outfit', 'Inter', sans-serif",
          }}
          onClick={() => setShowSheetsModal(false)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "24px",
              width: "100%",
              maxWidth: "520px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2)",
              border: "1px solid #e2e8f0",
              display: "flex",
              flexDirection: "column",
              gap: "16px",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ padding: "8px", borderRadius: "8px", backgroundColor: "#fef2f2", color: "#ef4444" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <line x1="3" y1="9" x2="21" y2="9"/>
                    <line x1="3" y1="15" x2="21" y2="15"/>
                    <line x1="9" y1="3" x2="9" y2="21"/>
                    <line x1="15" y1="3" x2="15" y2="21"/>
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>Importar Google Sheets / CSV</h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>Convierte celdas de Excel o Google Sheets en tablas nativas editables</p>
                </div>
              </div>
              <button
                onClick={() => setShowSheetsModal(false)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "#94a3b8" }}
              >
                ✕
              </button>
            </div>

            <div style={{ backgroundColor: "#f8fafc", borderRadius: "8px", padding: "10px 14px", border: "1px solid #e2e8f0", fontSize: "12px", color: "#475569", lineHeight: 1.4 }}>
              <strong>Capacidad y Soporte:</strong> Copia cualquier rango de celdas (hasta 500 celdas) en Google Sheets/Excel (`Cmd+C` / `Ctrl+C`) y pégalas abajo (`Cmd+V` / `Ctrl+V`). La primera fila se asignará automáticamente como encabezado destacado.
            </div>

            <textarea
              value={sheetInputText}
              onChange={(e) => setSheetInputText(e.target.value)}
              placeholder={"Pega las celdas aquí (ejemplo):\nNombre\tRol\tEstado\nJuan\tIngeniero\tActivo\nMaria\tDiseñadora\tEn revisión"}
              rows={8}
              style={{
                width: "100%",
                padding: "12px",
                borderRadius: "10px",
                border: "1px solid #cbd5e1",
                fontSize: "13px",
                fontFamily: "monospace",
                outline: "none",
                resize: "vertical",
                boxSizing: "border-box",
              }}
            />

            <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowSheetsModal(false)}
                style={{
                  padding: "9px 16px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  backgroundColor: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#475569",
                  cursor: "pointer",
                }}
              >
                Cancelar
              </button>
              <button
                onClick={() => {
                  if (!sheetInputText.trim() || !excalidrawAPI) return;
                  const { elements } = parseSheetDataToExcalidraw(sheetInputText, 150, 150);
                  if (elements.length > 0) {
                    excalidrawAPI.updateScene({
                      elements: [
                        ...(excalidrawAPI.getSceneElements() || []),
                        ...elements,
                      ],
                    });
                    (excalidrawAPI as any).scrollToContent?.(elements, { fitToViewport: true });
                    setSheetInputText("");
                    setShowSheetsModal(false);
                  } else {
                    alert("No se pudieron detectar celdas válidas en el texto pegado.");
                  }
                }}
                style={{
                  padding: "9px 18px",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  boxShadow: "0 2px 8px rgba(239, 68, 68, 0.3)",
                }}
              >
                Generar Tabla en Canvas
              </button>
            </div>
          </div>
        </div>
      )}

      <StudyMode
        isOpen={showStudyMode}
        onClose={() => setShowStudyMode(false)}
        cards={getFlashcardsFromScene()}
        onFocusElement={handleFocusElement}
      />

      <WorkspaceCommandPalette
        activeBoardId={activeBoardId}
        boards={boardsList}
        onSelectBoard={async (id: string) => {
          const board = await getBoard(id);
          setActiveBoardName(board?.name || "Workspace");
          setActiveBoardId(id);
        }}
        onNavigateTab={(tab: "recientes" | "favoritos" | "compartidos" | "papelera" | "plantillas") => {
          localStorage.setItem("my-excalidraw-active-tab", tab);
          setActiveBoardId(null);
        }}
        onCreateBoard={handleCreateBoardFromPalette}
        theme={appTheme}
        setTheme={setAppTheme}
        onPresent={() => {
          setIsPresenting(true);
        }}
        onExportPNG={() => {
          const event = new KeyboardEvent("keydown", {
            key: "s",
            ctrlKey: true,
            metaKey: !navigator.userAgent.includes("Windows"),
            shiftKey: true,
          });
          window.dispatchEvent(event);
        }}
      />
    </div>
  );
};

const ExcalidrawApp = () => {
  useEffect(() => {
    // Dynamic import to prevent build and IDE type errors
    // @ts-ignore
    import("@vercel/analytics")
      .then((m) => m?.inject?.())
      .catch(() => {});
  }, []);

  const isCloudExportWindow =
    window.location.pathname === "/excalidraw-plus-export";
  if (isCloudExportWindow) {
    return null;
  }

  return (
    <TopErrorBoundary>
      <Provider store={appJotaiStore}>
        <ExcalidrawAPIProvider>
          <ExcalidrawWrapper />
        </ExcalidrawAPIProvider>
      </Provider>
    </TopErrorBoundary>
  );
};

export default ExcalidrawApp;
