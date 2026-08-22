import React, { useState, useEffect, useCallback, useRef } from "react";

import {
  getBoardsMetadata,
  getBoard,
  saveBoard,
  deleteBoard,
  deleteBoardPermanently,
  restoreBoard,
  duplicateBoard,
  getFolders,
  createFolder,
  deleteFolder,
  getBoardVersions,
  restoreBoardVersion,
  syncBoardsWithSupabase,
  TemplateMetadata,
  syncAndLoadTemplates,
  getTemplate,
  saveTemplate,
  deleteTemplate,
} from "../data/boardsDb";
import {
  TEMPLATES,
  CATEGORIES,
  TemplateCategorySlug,
  TemplateTier,
  getFeaturedTemplates,
  getTemplatesByCategory,
  getTemplatesByTier,
  searchTemplates,
} from "../data/templates";
import { supabase } from "../data/supabaseClient";
import { exportToSvg } from "@excalidraw/excalidraw";

import { AuthModal } from "./AuthModal";

import "./Dashboard.scss";

import type { BoardMetadata, BoardVersion, Folder } from "../data/boardsDb";

interface DashboardProps {
  onSelectBoard: (boardId: string) => void;
  onJoinRoom: (roomUrl: string) => void;
}

// Vector SVG Icons replacing all emojis for professional workspace UI
const HomeIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);

const TemplateIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="9" rx="1" />
    <rect x="14" y="3" width="7" height="5" rx="1" />
    <rect x="14" y="12" width="7" height="9" rx="1" />
    <rect x="3" y="16" width="7" height="5" rx="1" />
  </svg>
);

const FolderIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
  </svg>
);

const StarIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const GroupIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);

const TrashIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    <line x1="10" y1="11" x2="10" y2="17" />
    <line x1="14" y1="11" x2="14" y2="17" />
  </svg>
);

const SearchIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const HelpIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3" />
    <line x1="12" y1="17" x2="12.01" y2="17" />
  </svg>
);

const BellIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
    <path d="M13.73 21a2 2 0 0 1-3.46 0" />
  </svg>
);

const SunIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

const SyncIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

const DocumentIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
  </svg>
);

const KanbanIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
    <line x1="3" y1="9" x2="21" y2="9" />
  </svg>
);

const RetroIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
  </svg>
);

const MatrixIcon = () => (
  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <polyline points="18.7 8 13.6 13.1 10.8 10.4 7 14.3" />
  </svg>
);

const ImportIcon = () => (
  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

const LockIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);

const CloudIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 10h-1.26A8 8 0 1 0 9 20h9a5 5 0 0 0 0-10z" />
  </svg>
);

const LaptopIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
    <line x1="2" y1="20" x2="22" y2="20" />
    <line x1="12" y1="17" x2="12" y2="20" />
  </svg>
);

const NotesIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
    <polyline points="10 9 9 9 8 9" />
  </svg>
);

const ChatIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </svg>
);

const GridIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const ListIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);

const CanvasIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="18" height="18" rx="2" />
    <line x1="9" y1="3" x2="9" y2="21" />
    <line x1="15" y1="3" x2="15" y2="21" />
    <line x1="3" y1="9" x2="21" y2="9" />
    <line x1="3" y1="15" x2="21" y2="15" />
  </svg>
);

const PenIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 20h9" />
    <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z" />
  </svg>
);

const EyeIcon = () => (
  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SparkleIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
  </svg>
);

const StudyCategoryIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);

const EngineeringCategoryIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SoftwareCategoryIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 18 22 12 16 6" />
    <polyline points="8 6 2 12 8 18" />
  </svg>
);

const BusinessCategoryIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="7" width="20" height="14" rx="2" ry="2" />
    <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
  </svg>
);

const DesignCategoryIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="13.5" cy="6.5" r=".5" fill="currentColor" />
    <circle cx="17.5" cy="10.5" r=".5" fill="currentColor" />
    <circle cx="8.5" cy="7.5" r=".5" fill="currentColor" />
    <circle cx="6.5" cy="12.5" r=".5" fill="currentColor" />
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.563-2.512 5.563-5.563C22 6.5 17.5 2 12 2z" />
  </svg>
);

const ProductivityCategoryIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 3v18h18" />
    <path d="m19 9-5 5-4-4-3 3" />
  </svg>
);

const AllCategoryIcon = () => (
  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="14" y="14" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" />
  </svg>
);

const getCategoryIcon = (slug: string) => {
  switch (slug) {
    case "estudio":
      return <StudyCategoryIcon />;
    case "ingenieria":
      return <EngineeringCategoryIcon />;
    case "software_ia":
      return <SoftwareCategoryIcon />;
    case "negocios":
      return <BusinessCategoryIcon />;
    case "diseno_ux":
      return <DesignCategoryIcon />;
    case "productividad":
      return <ProductivityCategoryIcon />;
    default:
      return <AllCategoryIcon />;
  }
};

export const Dashboard: React.FC<DashboardProps> = ({
  onSelectBoard,
  onJoinRoom,
}) => {
  const [boards, setBoards] = useState<BoardMetadata[]>([]);
  const [folders, setFolders] = useState<Folder[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [theme, setTheme] = useState<"light" | "dark">(() => {
    const savedTheme = localStorage.getItem("excalidraw-theme");
    return savedTheme === "light" ? "light" : "dark";
  });

  // Navigation and Tab States
  const [activeTab, setActiveTab] = useState<"recientes" | "favoritos" | "compartidos" | "papelera" | "plantillas" >(() => {
    const saved = localStorage.getItem("my-excalidraw-active-tab");
    return (saved as any) || "recientes";
  });
  const [activeFolderId, setActiveFolderId] = useState<string | null>(null);
  const [showOnlyTemplates, setShowOnlyTemplates] = useState(false);
  const [sortOption, setSortOption] = useState<"updated" | "created" | "name">("updated");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  // Premium Templates Hub States
  const [selectedTemplateCategory, setSelectedTemplateCategory] = useState<TemplateCategorySlug>("todos");
  const [templateTierFilter, setTemplateTierFilter] = useState<TemplateTier | "all">("all");
  const [templateSource, setTemplateSource] = useState<"oficiales" | "equipo">("oficiales");
  const [showAllTemplates, setShowAllTemplates] = useState(false);
  const [showAiBuilderModal, setShowAiBuilderModal] = useState(false);
  const [templateSearchQuery, setTemplateSearchQuery] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [isGeneratingTemplate, setIsGeneratingTemplate] = useState(false);
  const [workspaceTemplates, setWorkspaceTemplates] = useState<TemplateMetadata[]>([]);

  // Dropdown States
  const [showQuickAddMenu, setShowQuickAddMenu] = useState(false);
  const [activeCardMenuId, setActiveCardMenuId] = useState<string | null>(null);
  const [showUserMenu, setShowUserMenu] = useState(false);

  // Modal States
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [selectedBoardId, setSelectedBoardId] = useState<string | null>(null);
  const [newBoardName, setNewBoardName] = useState("");

  const [showJoinModal, setShowJoinModal] = useState(false);
  const [roomUrlInput, setRoomUrlInput] = useState("");

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [boardIdToDelete, setBoardIdToDelete] = useState<string | null>(null);
  const [boardNameToDelete, setBoardNameToDelete] = useState("");

  // Multi-select state
  const [selectedBoardIds, setSelectedBoardIds] = useState<Set<string>>(new Set());

  const [showTagsModal, setShowTagsModal] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [showTemplatesModal, setShowTemplatesModal] = useState(false);
  const quickImportFileRef = useRef<HTMLInputElement>(null);

  const [session, setSession] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [syncing, setSyncing] = useState(false);

  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [showMoveModal, setShowMoveModal] = useState(false);
  const [selectedFolderForMove, setSelectedFolderForMove] = useState<string | null>(null);

  const [showPasswordPromptModal, setShowPasswordPromptModal] = useState(false);
  const [passwordPromptInput, setPasswordPromptInput] = useState("");
  const [passwordPromptError, setPasswordPromptError] = useState("");
  const [boardIdToPrompt, setBoardIdToPrompt] = useState<string | null>(null);
  const [correctPassword, setCorrectPassword] = useState("");

  const [showPasswordSetModal, setShowPasswordSetModal] = useState(false);
  const [passwordSetInput, setPasswordSetInput] = useState("");

  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [boardVersions, setBoardVersions] = useState<BoardVersion[]>([]);
  const [boardIdForHistory, setBoardIdForHistory] = useState<string | null>(null);

  // Help & Notification States
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showNotificationMenu, setShowNotificationMenu] = useState(false);
  const notificationMenuRef = useRef<HTMLDivElement>(null);

  // Storage & Plan States
  const [activePlan, setActivePlan] = useState<"free" | "pro" | "enterprise">(() => {
    try {
      const saved = localStorage.getItem("my-excalidraw-plan");
      if (saved === "pro" || saved === "enterprise" || saved === "free") {
        return saved;
      }
    } catch (e) {}
    return "free";
  });
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [storageUsed, setStorageUsed] = useState(0);

  // Folders list length management
  const [showAllFolders, setShowAllFolders] = useState(false);

  // Refs for clicking outside menus
  const quickAddRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const cardMenuRef = useRef<HTMLDivElement>(null);

  const handleTriggerSync = useCallback(async () => {
    setSyncing(true);
    await syncBoardsWithSupabase();
    await loadBoards();
    setSyncing(false);
  }, []);

  useEffect(() => {
    loadBoards();

    // Initialize Supabase Auth listener
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        handleTriggerSync();
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        handleTriggerSync();
      } else {
        loadBoards();
      }
    });

    return () => subscription.unsubscribe();
  }, [handleTriggerSync]);

  // Listen for navigation and board creation events from the Command Palette
  useEffect(() => {
    const handleNavigate = (e: Event) => {
      const tab = (e as CustomEvent).detail;
      if (tab) {
        setActiveTab(tab);
      }
    };

    const handleCreate = (e: Event) => {
      const templateId = (e as CustomEvent).detail;
      handleCreateBoard(templateId);
    };

    window.addEventListener("dashboard-navigate-tab", handleNavigate);
    window.addEventListener("dashboard-create-board", handleCreate);

    return () => {
      window.removeEventListener("dashboard-navigate-tab", handleNavigate);
      window.removeEventListener("dashboard-create-board", handleCreate);
    };
  }, [boards, activeFolderId]);

  // Click outside menus to close them
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setShowQuickAddMenu(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setShowUserMenu(false);
      }
      if (cardMenuRef.current && !cardMenuRef.current.contains(e.target as Node)) {
        setActiveCardMenuId(null);
      }
      if (notificationMenuRef.current && !notificationMenuRef.current.contains(e.target as Node)) {
        setShowNotificationMenu(false);
      }
    };
    window.addEventListener("mousedown", handleOutsideClick);
    return () => window.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  // One-time storage optimization migration for existing boards
  useEffect(() => {
    const runMigration = async () => {
      const isOptimized = localStorage.getItem("my-excalidraw-optimized-v1");
      if (isOptimized === "true") return;

      try {
        const list = await getBoardsMetadata();
        for (const meta of list) {
          const board = await getBoard(meta.id);
          if (board) {
            // Re-saving the board automatically triggers compressBinaryFiles and optimizeElements!
            await saveBoard(
              board.id,
              { name: board.name },
              board.elements,
              board.appState,
              board.files,
            );
          }
        }
        localStorage.setItem("my-excalidraw-optimized-v1", "true");
        loadBoards();
      } catch (err) {
        console.warn("Failed to run one-time storage optimization migration:", err);
      }
    };

    runMigration();
  }, []);

  // Supabase Realtime: auto-refresh board list when any board changes remotely
  useEffect(() => {
    const channel = supabase
      .channel("dashboard-boards-realtime")
      .on(
        "postgres_changes" as any,
        { event: "*", schema: "public", table: "boards" },
        () => {
          syncBoardsWithSupabase().then(() => loadBoards());
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const PLAN_LIMITS = {
    free: 10 * 1024 * 1024,        // 10 MB in bytes
    pro: 100 * 1024 * 1024,       // 100 MB in bytes
    enterprise: 1024 * 1024 * 1024 // 1 GB in bytes
  };

  const calculateStorageUsed = async (list: BoardMetadata[]) => {
    try {
      let total = 0;
      for (const item of list) {
        const board = await getBoard(item.id);
        if (board) {
          total += JSON.stringify(board).length;
        }
      }
      setStorageUsed(total);
    } catch (e) {
      console.warn("Failed to calculate storage used:", e);
    }
  };

  const loadBoards = async () => {
    const list = await getBoardsMetadata();
    setBoards(list);
    const folderList = await getFolders();
    setFolders(folderList);
    calculateStorageUsed(list);
    try {
      const templatesList = await syncAndLoadTemplates();
      setWorkspaceTemplates(templatesList);
    } catch (e) {
      console.warn("Error loading workspace templates:", e);
    }
  };

  const handleCreateBoard = async (templateId: string | null = null) => {
    if (storageUsed >= PLAN_LIMITS[activePlan]) {
      alert("Límite de almacenamiento alcanzado. Por favor, actualiza tu plan en la barra lateral para continuar creando tableros.");
      return;
    }
    const id = `board_${crypto.randomUUID().replace(/-/g, "").substring(0, 12)}`;
    let name = `Sketion ${boards.filter(b => !b.isDeleted).length + 1}`;
    let elements: any[] = [];
    let appState: any = { viewBackgroundColor: "#F8FAFC" };

    if (templateId) {
      const template = TEMPLATES.find((t) => t.id === templateId);
      if (template) {
        name = template.name;
        elements = template.getElements();
        if (template.getAppState) {
          appState = template.getAppState();
        }
      }
    }

    await saveBoard(id, { name, folderId: activeFolderId || undefined }, elements, appState, {});
    onSelectBoard(id);
  };

  const handleDelete = (id: string, name: string) => {
    setBoardIdToDelete(id);
    setBoardNameToDelete(name);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (boardIdToDelete) {
      if (activeTab === "papelera") {
        await deleteBoardPermanently(boardIdToDelete);
      } else {
        await deleteBoard(boardIdToDelete);
      }
      setShowDeleteModal(false);
      setBoardIdToDelete(null);
      loadBoards();
    }
  };

  const handleRestore = async (id: string) => {
    await restoreBoard(id);
    loadBoards();
  };

  const toggleSelectBoard = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedBoardIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleBulkDelete = async () => {
    if (selectedBoardIds.size === 0) return;
    const isTrash = activeTab === "papelera";
    const label = isTrash ? "eliminar permanentemente" : "mover a la papelera";
    if (!window.confirm(`¿Seguro que quieres ${label} los ${selectedBoardIds.size} tablero(s) seleccionados?`)) return;
    for (const id of selectedBoardIds) {
      if (isTrash) {
        await deleteBoardPermanently(id);
      } else {
        await deleteBoard(id);
      }
    }
    setSelectedBoardIds(new Set());
    loadBoards();
  };

  const handleBulkRestore = async () => {
    if (selectedBoardIds.size === 0) return;
    for (const id of selectedBoardIds) {
      await restoreBoard(id);
    }
    setSelectedBoardIds(new Set());
    loadBoards();
  };

  const handleDuplicate = async (id: string, name: string) => {
    await duplicateBoard(id, `${name} (Copia)`);
    loadBoards();
  };

  const openRenameModal = (id: string, currentName: string) => {
    setSelectedBoardId(id);
    setNewBoardName(currentName);
    setShowRenameModal(true);
  };

  const handleRenameConfirm = async () => {
    if (selectedBoardId && newBoardName.trim()) {
      await saveBoard(selectedBoardId, { name: newBoardName.trim() });
      setShowRenameModal(false);
      setSelectedBoardId(null);
      loadBoards();
    }
  };

  const handleExport = async (id: string, name: string) => {
    const fullBoard = await get(`board_content_${id}`);
    if (fullBoard) {
      const dataStr = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(fullBoard),
      )}`;
      const downloadAnchor = document.createElement("a");
      downloadAnchor.setAttribute("href", dataStr);
      downloadAnchor.setAttribute("download", `${name}.excalidraw`);
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();
    } else {
      alert("No se pudo exportar el tablero");
    }
  };

  const get = async (key: string): Promise<any> => {
    const { get: idbGet, createStore } = await import("idb-keyval");
    const boardsStore = createStore("excalidraw-boards-db", "boards-store");
    return idbGet(key, boardsStore);
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = event.target.files;
    if (!fileList || fileList.length === 0) return;

    const file = fileList[0];
    try {
      const text = await file.text();
      const importedData = JSON.parse(text);

      const name = file.name.replace(/\.excalidraw$|\.json$/, "") || "Tablero Importado";
      const id = `board_${crypto.randomUUID().replace(/-/g, "").substring(0, 12)}`;

      const elements = importedData.elements || [];
      const appState = importedData.appState || {};
      const files = importedData.files || {};

      await saveBoard(id, { name }, elements, appState, files);
      await loadBoards();
      onSelectBoard(id);
    } catch (error) {
      console.error("Error al importar el archivo:", error);
      alert("El archivo no es válido o está corrupto.");
    } finally {
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleJoinRoomConfirm = () => {
    if (roomUrlInput.trim()) {
      onJoinRoom(roomUrlInput.trim());
      setShowJoinModal(false);
      setRoomUrlInput("");
    }
  };

  const toggleTheme = () => {
    const nextTheme = theme === "light" ? "dark" : "light";
    setTheme(nextTheme);
    localStorage.setItem("excalidraw-theme", nextTheme);
    document.documentElement.setAttribute("data-theme", nextTheme);
  };

  const toggleFavorite = async (boardId: string, currentVal?: boolean) => {
    await saveBoard(boardId, { isFavorite: !currentVal });
    loadBoards();
  };

  const openTagsModal = (id: string, currentTags: string[]) => {
    setSelectedBoardId(id);
    setSelectedTags(currentTags || []);
    setShowTagsModal(true);
  };

  const handleTagsConfirm = async () => {
    if (selectedBoardId) {
      await saveBoard(selectedBoardId, { tags: selectedTags });
      setShowTagsModal(false);
      setSelectedBoardId(null);
      loadBoards();
    }
  };

  const toggleTagSelection = (tagLabel: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagLabel)
        ? prev.filter((t) => t !== tagLabel)
        : [...prev, tagLabel],
    );
  };

  const handleCreateFolderConfirm = async () => {
    if (newFolderName.trim()) {
      await createFolder(newFolderName.trim());
      setShowCreateFolderModal(false);
      setNewFolderName("");
      loadBoards();
    }
  };

  const handleMoveBoardConfirm = async () => {
    if (selectedBoardId) {
      await saveBoard(selectedBoardId, {
        folderId: selectedFolderForMove || undefined,
      });
      setShowMoveModal(false);
      setSelectedBoardId(null);
      loadBoards();
    }
  };

  const handleToggleTemplate = async (id: string, isTemplate: boolean) => {
    if (isTemplate) {
      const boardContent = await getBoard(id);
      if (!boardContent) return;

      const name = prompt("Nombre de la plantilla:", boardContent.name) || boardContent.name;
      const description = prompt("Descripción de la plantilla:", "Plantilla personalizada del equipo") || "";
      const catInput = prompt("Categoría (1: Negocios, 2: Ingeniería, 3: Diseño):", "1");
      
      const category = 
        catInput === "2" 
          ? "Product & Engineering" 
          : catInput === "3" 
          ? "Design & UI" 
          : "Business & Strategy";

      await saveTemplate(
        id,
        name,
        category,
        boardContent.elements || [],
        description,
        boardContent.preview,
        false
      );
      alert("¡Tablero guardado con éxito en las plantillas del equipo!");
    } else {
      await deleteTemplate(id);
    }
    loadBoards();
  };

  const handleCreateFromTemplate = async (id: string, name: string) => {
    const newId = await duplicateBoard(id, `${name}`);
    await saveBoard(newId, { isTemplate: false });
    onSelectBoard(newId);
  };

  const handleOpenBoard = async (board: BoardMetadata) => {
    if (board.isDeleted) return;

    if (board.isTemplate) {
      const useTemplate = window.confirm(
        `¿Deseas crear un nuevo tablero basado en la plantilla "${board.name}"?\n\n(Haz clic en "Cancelar" si prefieres editar el diseño original de la plantilla directamente).`
      );
      if (useTemplate) {
        await handleCreateFromTemplate(board.id, board.name);
        return;
      }
    }

    if (board.password) {
      setBoardIdToPrompt(board.id);
      setCorrectPassword(board.password);
      setPasswordPromptInput("");
      setPasswordPromptError("");
      setShowPasswordPromptModal(true);
    } else {
      onSelectBoard(board.id);
    }
  };

  const handlePasswordPromptConfirm = () => {
    if (passwordPromptInput === correctPassword) {
      setShowPasswordPromptModal(false);
      if (boardIdToPrompt) {
        onSelectBoard(boardIdToPrompt);
      }
    } else {
      setPasswordPromptError("Contraseña incorrecta. Inténtalo de nuevo.");
    }
  };

  const openHistoryModal = async (id: string) => {
    setBoardIdForHistory(id);
    const list = await getBoardVersions(id);
    const sorted = [...list].sort((a, b) => b.timestamp - a.timestamp);
    setBoardVersions(sorted);
    setShowHistoryModal(true);
  };

  const handleRestoreVersion = async (versionId: string) => {
    if (
      boardIdForHistory &&
      window.confirm(
        "¿Seguro que quieres restaurar esta versión? Se sobreescribirá el lienzo actual.",
      )
    ) {
      await restoreBoardVersion(boardIdForHistory, versionId);
      setShowHistoryModal(false);
      setBoardIdForHistory(null);
      loadBoards();
    }
  };

  const handlePasswordSetConfirm = async () => {
    if (selectedBoardId) {
      await saveBoard(selectedBoardId, {
        password: passwordSetInput.trim() || undefined,
      });
      setShowPasswordSetModal(false);
      setSelectedBoardId(null);
      loadBoards();
    }
  };

  // Filtering & Sorting logic
  const filteredBoards = boards.filter((b) => {
    // 1. Search Query Match
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());

    // 2. Folder Match (when not showing templates/trash/favorites)
    if (showOnlyTemplates) {
      return matchesSearch && !!b.isTemplate && !b.isDeleted;
    }

    if (activeTab === "papelera") {
      return matchesSearch && !!b.isDeleted;
    }

    // Boards in active workspace
    const isDeleted = !!b.isDeleted;
    if (isDeleted) return false;

    // Tab checks
    if (activeTab === "favoritos" && !b.isFavorite) return false;
    if (activeTab === "compartidos" && !b.isCollaboration) return false;

    // Folder check
    const matchesFolder = activeFolderId ? b.folderId === activeFolderId : true;
    return matchesSearch && matchesFolder && !b.isTemplate;
  });

  // Sorting
  const sortedBoards = [...filteredBoards].sort((a, b) => {
    if (sortOption === "name") {
      return a.name.localeCompare(b.name);
    }
    if (sortOption === "created") {
      return b.createdAt - a.createdAt;
    }
    return b.updatedAt - a.updatedAt;
  });

  // Dynamic statistics
  const countBoards = boards.filter((b) => !b.isDeleted && !b.isTemplate).length;
  const countFolders = folders.length;
  const countNotes = boards.reduce((acc, b) => acc + (b.notesCount || 0), 0);
  const countCollabs = boards.filter((b) => b.isCollaboration && !b.isDeleted).length > 0
    ? boards.filter((b) => b.isCollaboration && !b.isDeleted).length * 2 + 1
    : 0;

  // User avatar display
  const userDisplayName = session?.user?.email
    ? session.user.email.split("@")[0].charAt(0).toUpperCase() + session.user.email.split("@")[0].slice(1)
    : "Invitado";
  const userInitials = userDisplayName.charAt(0).toUpperCase();

  const activeFolder = folders.find((f) => f.id === activeFolderId);
  const visibleFolders = showAllFolders ? folders : folders.slice(0, 4);
  const favoriteBoards = boards.filter((b) => b.isFavorite && !b.isDeleted && !b.isTemplate).slice(0, 3);
  const recentBoards = boards
    .filter((b) => !b.isDeleted && !b.isTemplate)
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 3);

  return (
    <div className={`workspace-dashboard theme-${theme}`}>
      {/* 1. Sidebar Notion-Style */}
      <aside className="dashboard-sidebar">
        <div className="logo-section">
          <img 
            src="/Sketion_principal.svg" 
            alt="Sketion" 
            className="logo-img" 
            onError={(e) => { (e.target as HTMLImageElement).src = '/sketion-logo.svg'; }}
          />
          <div className="logo-text">
            <h2>Sketion</h2>
            <span>Workspace</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <button
            className={`nav-link ${activeTab === "recientes" && activeFolderId === null && !showOnlyTemplates ? "active" : ""}`}
            onClick={() => {
              setActiveTab("recientes");
              setActiveFolderId(null);
              setShowOnlyTemplates(false);
            }}
          >
            <span className="nav-icon"><HomeIcon /></span>
            <span className="nav-text">Inicio</span>
          </button>

          <button
            className={`nav-link ${activeTab === "plantillas" ? "active" : ""}`}
            onClick={() => {
              setActiveTab("plantillas");
              setActiveFolderId(null);
              setShowOnlyTemplates(false);
            }}
          >
            <span className="nav-icon"><TemplateIcon /></span>
            <span className="nav-text">Plantillas</span>
          </button>
        </nav>

        <div className="sidebar-divider" />

        {/* 1. Starred/Favorite Boards */}
        <div className="sidebar-section">
          <div className="section-header">
            <span>FAVORITOS</span>
          </div>
          <div className="sidebar-boards-list">
            {favoriteBoards.length > 0 ? (
              favoriteBoards.map((b) => (
                <button
                  key={b.id}
                  className="sidebar-board-link"
                  onClick={() => handleOpenBoard(b)}
                  title={`Abrir ${b.name}`}
                >
                  <span className="star-icon-sidebar"><StarIcon /></span>
                  <span className="sidebar-board-name">{b.name}</span>
                </button>
              ))
            ) : (
              <span className="sidebar-empty-hint">Sin favoritos</span>
            )}
          </div>
        </div>

        <div className="sidebar-divider" />

        {/* 2. Folders/Carpetas List */}
        <div className="sidebar-section">
          <div className="section-header">
            <span>CARPETAS</span>
            <button
              className="btn-add-section"
              onClick={() => setShowCreateFolderModal(true)}
              title="Crear carpeta"
            >
              +
            </button>
          </div>

          <div className="folders-list">
            {visibleFolders.map((folder) => (
              <button
                key={folder.id}
                className={`folder-link ${activeFolderId === folder.id ? "active" : ""}`}
                onClick={() => {
                  setActiveFolderId(folder.id);
                  setShowOnlyTemplates(false);
                  setActiveTab("recientes");
                }}
              >
                <span className="folder-icon"><FolderIcon /></span>
                <span className="folder-name-text">{folder.name}</span>
                <span
                  className="folder-delete-action"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      window.confirm(
                        `¿Estás seguro de que quieres eliminar la carpeta "${folder.name}"? Los tableros no se eliminarán.`,
                      )
                    ) {
                      deleteFolder(folder.id).then(() => {
                        if (activeFolderId === folder.id) {
                          setActiveFolderId(null);
                        }
                        loadBoards();
                      });
                    }
                  }}
                  title="Eliminar carpeta"
                >
                  ✕
                </span>
              </button>
            ))}

            {folders.length > 4 && (
              <button
                className="show-more-link"
                onClick={() => setShowAllFolders(!showAllFolders)}
              >
                {showAllFolders ? "Mostrar menos" : "Mostrar más"}
              </button>
            )}
          </div>
        </div>

        <div className="sidebar-divider" />

        {/* 3. Recent Boards list */}
        <div className="sidebar-section">
          <div className="section-header">
            <span>RECIENTES</span>
          </div>
          <div className="sidebar-boards-list">
            {recentBoards.length > 0 ? (
              recentBoards.map((b) => (
                <button
                  key={b.id}
                  className="sidebar-board-link"
                  onClick={() => handleOpenBoard(b)}
                  title={`Abrir ${b.name}`}
                >
                  <span className="board-icon-sidebar"><CanvasIcon /></span>
                  <span className="sidebar-board-name">{b.name}</span>
                </button>
              ))
            ) : (
              <span className="sidebar-empty-hint">Sin tableros</span>
            )}
          </div>
        </div>

        <div className="sidebar-divider" />

        {/* 4. Bottom Navigations */}
        <div className="sidebar-bottom-nav">
          <button
            className={`nav-link ${activeTab === "compartidos" && activeFolderId === null && !showOnlyTemplates ? "active" : ""}`}
            onClick={() => {
              setActiveTab("compartidos");
              setActiveFolderId(null);
              setShowOnlyTemplates(false);
            }}
          >
            <span className="nav-icon"><GroupIcon /></span>
            <span className="nav-text">Compartidos conmigo</span>
          </button>

          <button
            className={`nav-link ${activeTab === "papelera" && activeFolderId === null && !showOnlyTemplates ? "active" : ""}`}
            onClick={() => {
              setActiveTab("papelera");
              setActiveFolderId(null);
              setShowOnlyTemplates(false);
            }}
          >
            <span className="nav-icon"><TrashIcon /></span>
            <span className="nav-text">Papelera</span>
          </button>
        </div>

        {/* 5. Compact Storage widget */}
        <div 
          className="storage-widget-compact" 
          onClick={() => setShowPlanModal(true)} 
          title={`Gestionar plan: ${storageUsed < 1024 * 1024 ? (storageUsed / 1024).toFixed(1) + " KB" : (storageUsed / (1024 * 1024)).toFixed(2) + " MB"} de ${PLAN_LIMITS[activePlan] / (1024 * 1024)} MB utilizados`}
        >
          <div className="storage-info">
            <span className="storage-percent">
              {Math.min(Math.round((storageUsed / PLAN_LIMITS[activePlan]) * 100), 100)}% usado
            </span>
            <span className="storage-badge">{activePlan === "free" ? "Gratuito" : activePlan === "pro" ? "Pro" : "Enterprise"}</span>
          </div>
          <div className="progress-container-compact">
            <div 
              className={`progress-bar-compact ${storageUsed >= PLAN_LIMITS[activePlan] ? "danger" : ""}`} 
              style={{ width: `${Math.min((storageUsed / PLAN_LIMITS[activePlan]) * 100, 100)}%` }} 
            />
          </div>
        </div>
      </aside>

      {/* 2. Main Area Panel */}
      <div className="dashboard-main-area">
        {/* Top Header widgets & User Profile */}
        <div className="top-widgets-bar">
          <div className="top-search-field">
            <span className="search-field-icon"><SearchIcon /></span>
            <input
              type="text"
              placeholder="Buscar en todo el espacio..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="header-actions">
            <button className="widget-icon-btn" title="Ayuda y atajos" onClick={() => setShowHelpModal(true)}>
              <HelpIcon />
            </button>
            
            <div className="notification-menu-container" ref={notificationMenuRef}>
              <button 
                className="widget-icon-btn notifications-btn" 
                title="Notificaciones"
                onClick={() => setShowNotificationMenu(!showNotificationMenu)}
              >
                <span><BellIcon /></span>
                <span className="notification-badge">3</span>
              </button>

              {showNotificationMenu && (
                <div className="notification-dropdown-menu">
                  <div className="notification-dropdown-header">Notificaciones</div>
                  <div className="notification-list">
                    <div className="notification-item">
                      <div className="notif-title">Conexión a la Nube Exitosa</div>
                      <div className="notif-desc">Se ha establecido una conexión segura con la base de datos de Supabase.</div>
                      <div className="notif-time">Hace un momento</div>
                    </div>
                    <div className="notification-item">
                      <div className="notif-title">Sincronización Completada</div>
                      <div className="notif-desc">Tus tableros locales se han sincronizado con la nube de forma segura.</div>
                      <div className="notif-time">Hace 5 min</div>
                    </div>
                    <div className="notification-item">
                      <div className="notif-title">Nueva Plantilla Disponible</div>
                      <div className="notif-desc">Usa el nuevo template Kanban de Retrospectiva para organizar tus tareas.</div>
                      <div className="notif-time">Hace 1 hora</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <button className="widget-icon-btn" onClick={toggleTheme} title="Cambiar tema">
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </button>

            {session && (
              <button
                className="widget-icon-btn sync-boards-btn"
                onClick={handleTriggerSync}
                disabled={syncing}
                title="Sincronizar con la nube"
              >
                <span className={syncing ? "spin-animation" : ""}><SyncIcon /></span>
              </button>
            )}

            {/* User Profile menu */}
            <div className="user-profile-menu-container" ref={userMenuRef}>
              <div className="user-profile-trigger" onClick={() => setShowUserMenu(!showUserMenu)}>
                <div className="user-avatar-circle">{userInitials}</div>
                <div className="user-details">
                  <span className="username">{userDisplayName}</span>
                  <span className="user-email">{session?.user?.email || "Invitado"}</span>
                </div>
              </div>

              {showUserMenu && (
                <div className="user-dropdown-menu">
                  {session ? (
                    <>
                      <div className="dropdown-info">Conectado a la Nube <CloudIcon /></div>
                      <button className="dropdown-item" onClick={() => supabase.auth.signOut()}>
                        Cerrar Sesión
                      </button>
                    </>
                  ) : (
                    <>
                      <div className="dropdown-info">Modo Local (Invitado)</div>
                      <button className="dropdown-item primary" onClick={() => setShowAuthModal(true)}>
                        Iniciar Sesión / Registrarse
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Create Actions */}
            <div className="create-actions-group" ref={quickAddRef}>
              <button className="btn-create-board" onClick={() => handleCreateBoard()}>
                + Nuevo tablero
              </button>
              <button
                className="btn-create-dropdown-trigger"
                onClick={() => setShowQuickAddMenu(!showQuickAddMenu)}
                title="Más opciones de creación"
              >
                <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>

              {showQuickAddMenu && (
                <div className="quick-add-dropdown-menu">
                  <button
                    className="quick-item"
                    onClick={() => {
                      handleCreateBoard();
                      setShowQuickAddMenu(false);
                    }}
                  >
                    <span><DocumentIcon /></span> Nuevo tablero
                  </button>
                  <button
                    className="quick-item"
                    onClick={() => {
                      setShowQuickAddMenu(false);
                      setTimeout(() => {
                        quickImportFileRef.current?.click();
                      }, 50);
                    }}
                  >
                    <span><ImportIcon /></span> Importar .excalidraw
                  </button>
                  <button
                    className="quick-item"
                    onClick={() => {
                      setShowCreateFolderModal(true);
                      setShowQuickAddMenu(false);
                    }}
                  >
                    <span><FolderIcon /></span> Crear carpeta
                  </button>
                  <button
                    className="quick-item"
                    onClick={() => {
                      setShowTemplatesModal(true);
                      setShowQuickAddMenu(false);
                    }}
                  >
                    <span><TemplateIcon /></span> Crear desde plantilla
                  </button>
                  <button
                    className="quick-item"
                    onClick={() => {
                      setShowJoinModal(true);
                      setShowQuickAddMenu(false);
                    }}
                  >
                    <span><GroupIcon /></span> Unirse a sala colaborativa
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {storageUsed >= PLAN_LIMITS[activePlan] && (
          <div className="quota-alert-banner">
            <span className="alert-icon">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </span>
            <div className="alert-content">
              <strong>Límite de Almacenamiento Excedido:</strong> Estás utilizando {storageUsed < 1024 * 1024 ? (storageUsed / 1024).toFixed(1) + " KB" : (storageUsed / (1024 * 1024)).toFixed(2) + " MB"} de tu plan actual ({PLAN_LIMITS[activePlan] / (1024 * 1024)} MB). La creación de tableros y la sincronización con la nube están bloqueadas.
            </div>
            <button className="btn-upgrade-banner" onClick={() => setShowPlanModal(true)}>
              Actualizar Plan
            </button>
          </div>
        )}

        {/* Welcome Section */}
        <div className="welcome-banner-premium">
          <h2>¡Buenos días, {userDisplayName}!</h2>
        </div>

        {/* Compact Stats Cards Grid */}
        <div className="stats-dashboard-grid-compact">
          <div className="stat-card-compact board-count-card">
            <div className="stat-icon-compact"><CanvasIcon /></div>
            <div className="stat-details-compact">
              <span className="stat-num-compact">{countBoards}</span>
              <span className="stat-label-compact">{countBoards === 1 ? "Tablero" : "Tableros"}</span>
            </div>
          </div>

          <div className="stat-card-compact folder-count-card">
            <div className="stat-icon-compact"><FolderIcon /></div>
            <div className="stat-details-compact">
              <span className="stat-num-compact">{countFolders}</span>
              <span className="stat-label-compact">{countFolders === 1 ? "Carpeta" : "Carpetas"}</span>
            </div>
          </div>

          <div className="stat-card-compact notes-count-card">
            <div className="stat-icon-compact"><NotesIcon /></div>
            <div className="stat-details-compact">
              <span className="stat-num-compact">{countNotes}</span>
              <span className="stat-label-compact">{countNotes === 1 ? "Nota" : "Notas"}</span>
            </div>
          </div>

          <div className="stat-card-compact collabs-count-card">
            <div className="stat-icon-compact"><GroupIcon /></div>
            <div className="stat-details-compact">
              <span className="stat-num-compact">{countCollabs}</span>
              <span className="stat-label-compact">{countCollabs === 1 ? "Colaborador" : "Colaboradores"}</span>
            </div>
          </div>
        </div>

        {/* Subnavigation Tabs */}
        <div className="subnav-tabs-bar">
          <div className="tab-items">
            <button
              className={`tab-btn ${activeTab === "recientes" && activeFolderId === null && !showOnlyTemplates ? "active" : ""}`}
              onClick={() => {
                setActiveTab("recientes");
                setActiveFolderId(null);
                setShowOnlyTemplates(false);
              }}
            >
              Recientes
            </button>
            <button
              className={`tab-btn ${activeTab === "favoritos" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("favoritos");
                setActiveFolderId(null);
                setShowOnlyTemplates(false);
              }}
            >
              Favoritos
            </button>
            <button
              className={`tab-btn ${activeTab === "compartidos" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("compartidos");
                setActiveFolderId(null);
                setShowOnlyTemplates(false);
              }}
            >
              Compartidos conmigo
            </button>
            <button
              className={`tab-btn ${activeTab === "papelera" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("papelera");
                setActiveFolderId(null);
                setShowOnlyTemplates(false);
              }}
            >
              Papelera
            </button>
            <button
              className={`tab-btn ${activeTab === "plantillas" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("plantillas");
                setActiveFolderId(null);
                setShowOnlyTemplates(false);
              }}
            >
              Plantillas
            </button>
          </div>
        </div>

        {activeTab === "plantillas" ? (
          <div className="templates-hub-container">
            <div className="templates-hub-header">
              <div className="templates-header-text">
                <h3>Biblioteca de Plantillas</h3>
                <p>Catálogo universal de 212 plantillas estructuradas de precisión y tipografía Inter.</p>
              </div>
              <div className="ai-upcoming-badge">
                <SparkleIcon />
                <span>AI Blueprint Generator · Próximamente</span>
              </div>
            </div>

            {/* Selector de Origen: Biblioteca Oficial vs Plantillas del Equipo */}
            <div className="templates-source-bar">
              <button
                className={`source-tab-btn ${templateSource === "oficiales" ? "active" : ""}`}
                onClick={() => {
                  setTemplateSource("oficiales");
                  setSelectedTemplateCategory("todos");
                  setTemplateTierFilter("all");
                }}
              >
                <TemplateIcon />
                <span>Biblioteca Oficial ({TEMPLATES.length})</span>
              </button>
              <button
                className={`source-tab-btn ${templateSource === "equipo" ? "active" : ""}`}
                onClick={() => setTemplateSource("equipo")}
              >
                <FolderIcon />
                <span>Plantillas del Equipo ({workspaceTemplates.length})</span>
              </button>
            </div>

            {templateSource === "oficiales" ? (
              <>
                <div className="templates-hub-filters">
                  <div className="category-tabs">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat.slug}
                        className={`category-tab-btn ${selectedTemplateCategory === cat.slug ? "active" : ""}`}
                        onClick={() => {
                          setSelectedTemplateCategory(cat.slug);
                          setShowAllTemplates(cat.slug !== "todos");
                        }}
                      >
                        <span className="cat-icon">{getCategoryIcon(cat.slug)}</span>
                        <span>{cat.name}</span>
                        {cat.count !== undefined && (
                          <span className="cat-count">({cat.count})</span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="template-search-box">
                    <span className="search-icon"><SearchIcon /></span>
                    <input
                      type="text"
                      placeholder="Buscar plantilla por nombre, tema o etiqueta..."
                      value={templateSearchQuery}
                      onChange={(e) => setTemplateSearchQuery(e.target.value)}
                    />
                  </div>
                </div>

                {/* Level 2: Tier Filter Chips */}
                <div className="tier-filter-bar">
                  <span className="tier-filter-label">Nivel:</span>
                  <div className="tier-filter-chips">
                    <button
                      className={`tier-chip ${templateTierFilter === "all" ? "active" : ""}`}
                      onClick={() => setTemplateTierFilter("all")}
                    >
                      Todos ({getTemplatesByCategory(selectedTemplateCategory).length})
                    </button>
                    <button
                      className={`tier-chip ${templateTierFilter === "core" ? "active" : ""}`}
                      onClick={() => setTemplateTierFilter("core")}
                    >
                      Core / Destacadas ({getTemplatesByTier("core", selectedTemplateCategory).length})
                    </button>
                    <button
                      className={`tier-chip ${templateTierFilter === "specialized" ? "active" : ""}`}
                      onClick={() => setTemplateTierFilter("specialized")}
                    >
                      Especializadas ({getTemplatesByTier("specialized", selectedTemplateCategory).length})
                    </button>
                    <button
                      className={`tier-chip ${templateTierFilter === "expert" ? "active" : ""}`}
                      onClick={() => setTemplateTierFilter("expert")}
                    >
                      Expertas ({getTemplatesByTier("expert", selectedTemplateCategory).length})
                    </button>
                  </div>
                </div>

                {/* Grid de Plantillas Oficiales */}
                {selectedTemplateCategory === "todos" && !templateSearchQuery && !showAllTemplates && templateTierFilter === "all" ? (
                  <div className="featured-templates-section">
                    <div className="featured-section-banner">
                      <div className="featured-badge">
                        <StarIcon />
                        <span>COLECCIÓN DESTACADA (TIER A)</span>
                      </div>
                      <h4>Plantillas Esenciales de Mayor Impacto</h4>
                      <p>Selección curada de plantillas fundamentales recomendadas para arrancar cualquier proyecto en segundos.</p>
                    </div>

                    <div className="templates-gallery-grid">
                      {getFeaturedTemplates().map((tmpl) => (
                        <div key={tmpl.id} className="template-card-minimal">
                          <div
                            className="template-thumbnail-box"
                            dangerouslySetInnerHTML={{ __html: tmpl.thumbnailSvg }}
                          />
                          <div className="template-card-body">
                            <div className="template-card-heading">
                              <h4 title={tmpl.name}>{tmpl.name}</h4>
                              <div className="template-card-subheading">
                                <span className="cat-pill">{tmpl.category}</span>
                                {tmpl.subcategory && (
                                  <>
                                    <span className="dot-sep">·</span>
                                    <span className="subcat-pill">{tmpl.subcategory}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="template-card-desc">{tmpl.description}</p>
                            <div className="template-card-footer">
                              <span className={`tmpl-tier-tag tmpl-tier-${tmpl.tier}`}>
                                {tmpl.tier === "core" ? "Core" : tmpl.tier === "expert" ? "Experto" : "Especializado"}
                              </span>
                              <button
                                className="btn-open-template"
                                onClick={() => handleCreateBoard(tmpl.id)}
                              >
                                Abrir plantilla
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="view-all-templates-cta">
                      <button
                        className="btn-view-all-templates"
                        onClick={() => setShowAllTemplates(true)}
                      >
                        Ver catálogo completo ({TEMPLATES.length} plantillas) →
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="all-templates-section">
                    {selectedTemplateCategory === "todos" && !templateSearchQuery && (
                      <div className="all-templates-header-actions">
                        <span className="all-templates-count">
                          Mostrando {searchTemplates(templateSearchQuery, selectedTemplateCategory, templateTierFilter).length} de {TEMPLATES.length} plantillas
                        </span>
                        <button
                          className="btn-back-to-featured"
                          onClick={() => {
                            setShowAllTemplates(false);
                            setTemplateTierFilter("all");
                          }}
                        >
                          <StarIcon />
                          <span>Ver solo destacadas</span>
                        </button>
                      </div>
                    )}

                    <div className="templates-gallery-grid">
                      {searchTemplates(templateSearchQuery, selectedTemplateCategory, templateTierFilter).map((tmpl) => (
                        <div key={tmpl.id} className="template-card-minimal">
                          <div
                            className="template-thumbnail-box"
                            dangerouslySetInnerHTML={{ __html: tmpl.thumbnailSvg }}
                          />
                          <div className="template-card-body">
                            <div className="template-card-heading">
                              <h4 title={tmpl.name}>{tmpl.name}</h4>
                              <div className="template-card-subheading">
                                <span className="cat-pill">{tmpl.category}</span>
                                {tmpl.subcategory && (
                                  <>
                                    <span className="dot-sep">·</span>
                                    <span className="subcat-pill">{tmpl.subcategory}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <p className="template-card-desc">{tmpl.description}</p>
                            <div className="template-card-footer">
                              <span className={`tmpl-tier-tag tmpl-tier-${tmpl.tier}`}>
                                {tmpl.tier === "core" ? "Core" : tmpl.tier === "expert" ? "Experto" : "Especializado"}
                              </span>
                              <button
                                className="btn-open-template"
                                onClick={() => handleCreateBoard(tmpl.id)}
                              >
                                Abrir plantilla
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {searchTemplates(templateSearchQuery, selectedTemplateCategory, templateTierFilter).length === 0 && (
                      <div className="templates-empty-search">
                        <p>No se encontraron plantillas que coincidan con "<strong>{templateSearchQuery}</strong>" en este nivel o categoría.</p>
                        <button
                          className="btn-clear-search"
                          onClick={() => {
                            setTemplateSearchQuery("");
                            setTemplateTierFilter("all");
                          }}
                        >
                          Limpiar filtros
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : (
              /* Plantillas del Equipo */
              <div className="templates-gallery-grid team-templates-grid">
                {workspaceTemplates.filter((tmpl) => {
                  if (templateSearchQuery && !tmpl.name.toLowerCase().includes(templateSearchQuery.toLowerCase()) && !tmpl.description?.toLowerCase().includes(templateSearchQuery.toLowerCase())) return false;
                  return true;
                }).map((tmpl) => (
                  <div key={tmpl.id} className="template-card-premium">
                    <div className="template-card-header">
                      <span className="tmpl-badge tmpl-badge-equipo">EQUIPO</span>
                      <h4>{tmpl.name}</h4>
                    </div>

                    {tmpl.thumbnail ? (
                      <div className="template-thumbnail-container">
                        <img src={tmpl.thumbnail} className="template-thumbnail-img" alt={tmpl.name} />
                      </div>
                    ) : (
                      <div className="template-thumbnail-placeholder">
                        <FolderIcon />
                      </div>
                    )}

                    <p>{tmpl.description || "Plantilla personalizada creada por tu equipo."}</p>
                    <div className="template-card-actions">
                      <button
                        className="btn-use-template"
                        onClick={async () => {
                          const fullTmpl = await getTemplate(tmpl.id);
                          const id = `board_${crypto.randomUUID().replace(/-/g, "").substring(0, 12)}`;
                          await saveBoard(id, { name: tmpl.name }, fullTmpl?.elements || [], {}, {});
                          onSelectBoard(id);
                        }}
                      >
                        Usar plantilla
                      </button>
                      <button
                        className="btn-delete-template-danger"
                        onClick={async (e) => {
                          e.stopPropagation();
                          if (confirm(`¿Estás seguro de que deseas eliminar la plantilla "${tmpl.name}"?`)) {
                            await deleteTemplate(tmpl.id);
                            loadBoards();
                          }
                        }}
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ))}

                {workspaceTemplates.length === 0 && (
                  <div className="templates-empty-team">
                    <div className="empty-team-icon"><FolderIcon /></div>
                    <h4>Aún no hay plantillas compartidas en tu equipo</h4>
                    <p>Puedes guardar cualquier tablero como plantilla desde el menú del tablero para reutilizar tus diagramas y estructuras con el equipo.</p>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <>
            {/* Bulk-action toolbar — shows when 1+ boards are selected */}
            {selectedBoardIds.size > 0 && (
              <div className="bulk-action-bar">
                <span className="bulk-action-count">
                  {selectedBoardIds.size} tablero{selectedBoardIds.size !== 1 ? "s" : ""} seleccionado{selectedBoardIds.size !== 1 ? "s" : ""}
                </span>
                <div className="bulk-action-buttons">
                  {activeTab === "papelera" ? (
                    <button className="bulk-btn bulk-btn-restore" onClick={handleBulkRestore}>
                      Restaurar seleccionados
                    </button>
                  ) : null}
                  <button className="bulk-btn bulk-btn-delete" onClick={handleBulkDelete}>
                    {activeTab === "papelera" ? "Eliminar permanentemente" : "Mover a papelera"}
                  </button>
                  <button className="bulk-btn bulk-btn-cancel" onClick={() => setSelectedBoardIds(new Set())}>
                    Cancelar selección
                  </button>
                </div>
              </div>
            )}

            {/* Search, Sort and Grid Toggles */}
            <div className="filters-controls-row">
              <div className="search-box-input">
                <span className="search-icon"><SearchIcon /></span>
                <input
                  type="text"
                  placeholder="Buscar tableros..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="controls-right-side">
                <div className="filter-dropdown-select">
                  <select
                    value={activeFolderId || ""}
                    onChange={(e) => {
                      setActiveFolderId(e.target.value || null);
                      setShowOnlyTemplates(false);
                    }}
                  >
                    <option value="">Todos los tableros</option>
                    {folders.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="filter-dropdown-select">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                  >
                    <option value="updated">Última modificación</option>
                    <option value="created">Fecha de creación</option>
                    <option value="name">Alfabético</option>
                  </select>
                </div>

                <div className="view-mode-toggles">
                  <button
                    className={`toggle-btn ${viewMode === "grid" ? "active" : ""}`}
                    onClick={() => setViewMode("grid")}
                    title="Vista Cuadrícula"
                  >
                    <GridIcon />
                  </button>
                  <button
                    className={`toggle-btn ${viewMode === "list" ? "active" : ""}`}
                    onClick={() => setViewMode("list")}
                    title="Vista Lista"
                  >
                    <ListIcon />
                  </button>
                </div>
              </div>
            </div>

            {/* Boards Grid or List View */}
            {sortedBoards.length > 0 ? (
              <div className={`boards-${viewMode}-layout`}>
                {sortedBoards.map((board) => {
                  const dateText = `Actualizado ${
                    Date.now() - board.updatedAt < 60000
                      ? "hace un momento"
                      : Date.now() - board.updatedAt < 3600000
                      ? `hace ${Math.floor((Date.now() - board.updatedAt) / 60000)} min`
                      : `hace ${Math.floor((Date.now() - board.updatedAt) / 3600000)} horas`
                  }`;

                  const boardFolder = folders.find((f) => f.id === board.folderId);

                  // Render active collaborator bubbles
                  const collabInitials = ["A", "J", "M", "L", "S"];
                  const boardCollabBubbles = collabInitials.slice(
                    0,
                    Math.max(1, board.id.charCodeAt(0) % 4)
                  );

                  const isSelected = selectedBoardIds.has(board.id);

                  return (
                    <div
                      key={board.id}
                      className={`board-card-premium${isSelected ? " board-card-selected" : ""}${activeCardMenuId === board.id ? " menu-active" : ""}`}
                    >
                      {/* Multi-select checkbox */}
                      <div
                        className={`board-select-checkbox${isSelected || selectedBoardIds.size > 0 ? " visible" : ""}`}
                        onClick={(e) => toggleSelectBoard(board.id, e)}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}}
                          onClick={(e) => { e.stopPropagation(); toggleSelectBoard(board.id, e as any); }}
                        />
                      </div>
                      {/* Card Header (Preview Area) */}
                      <div
                        className="card-preview-container"
                        onClick={() => handleOpenBoard(board)}
                      >
                        {board.preview ? (
                          <img src={board.preview} alt={board.name} className="board-preview-img" />
                        ) : (
                          <div className="board-preview-placeholder">
                            <div className="grid-bg" />
                            <span>Pizarra</span>
                          </div>
                        )}

                    {/* Star toggle action overlay */}
                    <button
                      className={`floating-star-overlay-btn ${board.isFavorite ? "favorite" : ""}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(board.id, board.isFavorite);
                      }}
                      title={board.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                    >
                      <StarIcon />
                    </button>

                    {/* Quick hover action bar */}
                    {!board.isDeleted && (
                      <div className="card-quick-actions-bar">
                        <button
                          className="btn-quick-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenBoard(board);
                          }}
                        >
                          Abrir
                        </button>
                        <button
                          className="btn-quick-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(board.id, board.isFavorite);
                          }}
                        >
                          {board.isFavorite ? "Quitar" : "Favorito"}
                        </button>
                        <button
                          className="btn-quick-action"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDuplicate(board.id, board.name);
                          }}
                        >
                          Duplicar
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Card Body Info */}
                  <div className="card-info-container">
                    <div className="title-row" onClick={() => handleOpenBoard(board)}>
                      {viewMode === "list" && (
                        <button
                          className={`list-star-btn ${board.isFavorite ? "favorite" : ""}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(board.id, board.isFavorite);
                          }}
                          title={board.isFavorite ? "Quitar de favoritos" : "Añadir a favoritos"}
                        >
                          <StarIcon />
                        </button>
                      )}
                      <h4 className="board-card-title">
                        {board.password && <span className="lock-icon"><LockIcon /></span>}
                        {board.name}
                      </h4>

                      {/* Dropdown Options Trigger */}
                      <div className="card-menu-trigger-wrapper" ref={activeCardMenuId === board.id ? cardMenuRef : null}>
                        <button
                          className="card-menu-dots-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveCardMenuId(activeCardMenuId === board.id ? null : board.id);
                          }}
                        >
                          ⋮
                        </button>

                        {activeCardMenuId === board.id && (
                          <div className="board-context-dropdown-menu" onClick={(e) => e.stopPropagation()}>
                            {board.isDeleted ? (
                              <>
                                <button
                                  className="menu-item"
                                  onClick={() => {
                                    handleRestore(board.id);
                                    setActiveCardMenuId(null);
                                  }}
                                >
                                  Restaurar tablero
                                </button>
                                <button
                                  className="menu-item danger"
                                  onClick={() => {
                                    handleDelete(board.id, board.name);
                                    setActiveCardMenuId(null);
                                  }}
                                >
                                  Eliminar permanentemente
                                </button>
                              </>
                            ) : (
                              <>
                                <button
                                  className="menu-item"
                                  onClick={() => {
                                    openRenameModal(board.id, board.name);
                                    setActiveCardMenuId(null);
                                  }}
                                >
                                  Renombrar
                                </button>
                                <button
                                  className="menu-item"
                                  onClick={() => {
                                    setSelectedBoardId(board.id);
                                    setSelectedFolderForMove(board.folderId || null);
                                    setShowMoveModal(true);
                                    setActiveCardMenuId(null);
                                  }}
                                >
                                  Mover a carpeta
                                </button>
                                <button
                                  className="menu-item"
                                  onClick={() => {
                                    openTagsModal(board.id, board.tags || []);
                                    setActiveCardMenuId(null);
                                  }}
                                >
                                  Etiquetas
                                </button>
                                <button
                                  className="menu-item"
                                  onClick={() => {
                                    handleDuplicate(board.id, board.name);
                                    setActiveCardMenuId(null);
                                  }}
                                >
                                  Duplicar
                                </button>
                                <button
                                  className="menu-item"
                                  onClick={() => {
                                    openHistoryModal(board.id);
                                    setActiveCardMenuId(null);
                                  }}
                                >
                                  Historial de versiones
                                </button>
                                <button
                                  className="menu-item"
                                  onClick={() => {
                                    handleExport(board.id, board.name);
                                    setActiveCardMenuId(null);
                                  }}
                                >
                                  Exportar .excalidraw
                                </button>
                                <button
                                  className="menu-item"
                                  onClick={() => {
                                    setSelectedBoardId(board.id);
                                    setPasswordSetInput(board.password || "");
                                    setShowPasswordSetModal(true);
                                    setActiveCardMenuId(null);
                                  }}
                                >
                                  <LockIcon /> {board.password ? "Cambiar contraseña" : "Proteger con contraseña"}
                                </button>
                                <button
                                  className="menu-item"
                                  onClick={() => {
                                    handleToggleTemplate(board.id, !board.isTemplate);
                                    setActiveCardMenuId(null);
                                  }}
                                >
                                  {board.isTemplate ? "Quitar de plantillas" : "Convertir en plantilla"}
                                </button>
                                <button
                                  className="menu-item danger"
                                  onClick={() => {
                                    handleDelete(board.id, board.name);
                                    setActiveCardMenuId(null);
                                  }}
                                >
                                  Mover a la Papelera
                                </button>
                              </>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <span className="card-updated-date">{dateText}</span>

                    <div className="card-badges-row">
                      {session ? (
                        <span className="badge-cloud"><CloudIcon /> En la nube</span>
                      ) : (
                        <span className="badge-local"><LaptopIcon /> Local</span>
                      )}
                      {boardFolder && (
                        <span className="badge-folder"><FolderIcon /> {boardFolder.name}</span>
                      )}
                      {board.isTemplate && (
                        <span className="badge-template"><TemplateIcon /> Plantilla</span>
                      )}
                    </div>

                    {/* Metadata Counts Row */}
                    <div className="card-metadata-counts-footer">
                      <div className="counts-list">
                        <span className="count-item" title="Notas en Markdown">
                          <NotesIcon /> {board.notesCount || 0}
                        </span>
                        <span className="count-item" title="Comentarios">
                          <ChatIcon /> {board.commentsCount || 0}
                        </span>
                        <span className="count-item" title="Colaboradores">
                          <GroupIcon /> {board.isCollaboration ? countCollabs - 2 : 1}
                        </span>
                      </div>

                      {/* Overlapping collaborator circles */}
                      {board.isCollaboration && (
                        <div className="overlapping-avatars-group">
                          {boardCollabBubbles.map((init, i) => (
                            <div
                              key={i}
                              className="collab-mini-bubble"
                              style={{
                                zIndex: 10 - i,
                                backgroundColor:
                                  i === 0
                                    ? "#6366f1"
                                    : i === 1
                                    ? "#f59e0b"
                                    : i === 2
                                    ? "#10b981"
                                    : "#ef4444",
                              }}
                            >
                              {init}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}

            {/* Dotted create dashboard placeholder card */}
            {activeTab !== "papelera" && !showOnlyTemplates && (
              <div
                className="board-card-premium dashed-placeholder"
                onClick={() => handleCreateBoard()}
              >
                <div className="placeholder-content">
                  <div className="plus-dashed-icon">＋</div>
                  <div className="placeholder-title">Crear tablero</div>
                  <div className="placeholder-subtitle">Empieza desde cero o usa una plantilla</div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state-premium">
            <span className="empty-icon"><CanvasIcon /></span>
            <h3>No se encontraron tableros</h3>
            <p>Comienza creando un tablero limpio o importa uno existente.</p>
            <button className="btn-primary" onClick={() => handleCreateBoard()}>
              Crear tablero
            </button>
          </div>
        )}

        {/* 3. Bottom Educational/Marketing Banner */}
        <div className="premium-bottom-education-banner">
          <div className="left-pink-hero-section">
            <div className="pink-icon-box"><PenIcon /></div>
            <div className="pink-hero-content">
              <h4>Escribe, planifica, crea</h4>
              <p>Usa notas en Markdown, comenta ideas y colabora en tiempo real.</p>
              <button className="pink-link-btn" onClick={() => setShowTemplatesModal(true)}>
                Descubre todas las funcionalidades →
              </button>
            </div>
          </div>

          <div className="right-details-columns">
            <div className="education-column">
              <span className="col-icon"><NotesIcon /></span>
              <h5>Notas en Markdown</h5>
              <p>Documenta tus ideas y especificaciones sin salir del tablero.</p>
            </div>

            <div className="education-column">
              <span className="col-icon"><ChatIcon /></span>
              <h5>Comentarios</h5>
              <p>Comunícate y da feedback directamente sobre el lienzo.</p>
            </div>

            <div className="education-column">
              <span className="col-icon"><GroupIcon /></span>
              <h5>Colaboración en tiempo real</h5>
              <p>Trabajen juntos de manera simultánea desde cualquier lugar.</p>
            </div>
          </div>
        </div>
        </>
        )}
      </div>

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h3>Renombrar Tablero</h3>
            <div className="form-group">
              <label>Nuevo Nombre:</label>
              <input
                type="text"
                value={newBoardName}
                onChange={(e) => setNewBoardName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRenameConfirm()}
                autoFocus
              />
            </div>
            <div className="dialog-buttons">
              <button className="btn-cancel" onClick={() => setShowRenameModal(false)}>
                Cancelar
              </button>
              <button className="btn-confirm" onClick={handleRenameConfirm}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Hidden file input for dashboard import */}
      <input
        type="file"
        ref={quickImportFileRef}
        accept=".excalidraw,.json"
        style={{ display: "none" }}
        onChange={handleImport}
      />

      {/* Join Room Modal */}
      {showJoinModal && (
        <div className="dialog-overlay" onClick={() => setShowJoinModal(false)}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <h3>Unirse a Sala Colaborativa</h3>
            <p className="dialog-desc">Pega el enlace o código de la sesión para colaborar en tiempo real:</p>
            <div className="form-group">
              <label>Enlace o Hash de la Sala:</label>
              <input
                type="text"
                placeholder="https://sketion.vercel.app/#room=... o código de sala"
                value={roomUrlInput}
                onChange={(e) => setRoomUrlInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleJoinRoomConfirm()}
                autoFocus
              />
            </div>
            <div className="dialog-buttons">
              <button className="btn-cancel" onClick={() => setShowJoinModal(false)}>
                Cancelar
              </button>
              <button className="btn-confirm" onClick={handleJoinRoomConfirm}>
                Unirse
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="dialog-overlay" onClick={() => setShowDeleteModal(false)}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <h3>{activeTab === "papelera" ? "Eliminar Permanentemente" : "Mover a la Papelera"}</h3>
            <p className="dialog-warning-text">
              {activeTab === "papelera"
                ? `¿Estás completamente seguro de que deseas eliminar de forma permanente "${boardNameToDelete}"? Esta acción no se puede deshacer y se borrará de IndexedDB y Supabase.`
                : `¿Estás seguro de que deseas mover "${boardNameToDelete}" a la Papelera? Podrás recuperarlo en cualquier momento desde la sección correspondiente.`}
            </p>
            <div className="dialog-buttons">
              <button className="btn-cancel" onClick={() => setShowDeleteModal(false)}>
                Cancelar
              </button>
              <button
                className="btn-confirm"
                style={{ backgroundColor: "var(--danger-color, #ef4444)" }}
                onClick={handleDeleteConfirm}
              >
                {activeTab === "papelera" ? "Eliminar Permanentemente" : "Mover a la Papelera"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tags Selection Modal */}
      {showTagsModal && (
        <div className="dialog-overlay" onClick={() => setShowTagsModal(false)}>
          <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
            <h3>Editar Etiquetas</h3>
            <p className="dialog-desc">Selecciona las etiquetas para organizar este tablero:</p>
            <div className="tags-selection-list">
              {TEMPLATES.map((tmpl) => (
                <label key={tmpl.id} className="tag-checkbox-label">
                  <input
                    type="checkbox"
                    checked={selectedTags.includes(tmpl.name)}
                    onChange={() => toggleTagSelection(tmpl.name)}
                  />
                  <span className="tag-pill">{tmpl.name}</span>
                </label>
              ))}
            </div>
            <div className="dialog-buttons">
              <button className="btn-cancel" onClick={() => setShowTagsModal(false)}>
                Cancelar
              </button>
              <button className="btn-confirm" onClick={handleTagsConfirm}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Modal */}
      {showTemplatesModal && (
        <div className="dialog-overlay" onClick={() => setShowTemplatesModal(false)}>
          <div
            className="dialog-box templates-dialog"
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "760px",
              width: "92%",
              maxHeight: "85vh",
              display: "flex",
              flexDirection: "column",
            }}
          >
            <div className="dialog-header-with-action">
              <h3>Crear Nuevo Tablero</h3>
              <button
                className="btn-create-with-ai-small"
                onClick={() => {
                  setShowTemplatesModal(false);
                  setShowAiBuilderModal(true);
                }}
              >
                <SparkleIcon />
                <span>Crear con IA</span>
              </button>
            </div>
            <p className="dialog-desc">Selecciona un punto de partida para tu tablero:</p>
            <div
              className="templates-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
                gap: "14px",
                maxHeight: "420px",
                overflowY: "auto",
                paddingRight: "6px",
                marginBottom: "20px",
              }}
            >
              <div
                className="template-card blank"
                onClick={() => {
                  handleCreateBoard(null);
                  setShowTemplatesModal(false);
                }}
              >
                <span className="tmpl-icon"><DocumentIcon /></span>
                <h4>Lienzo Vacío</h4>
                <p>Comienza desde cero con un lienzo limpio.</p>
              </div>
              {getFeaturedTemplates().map((tmpl) => (
                <div
                  key={tmpl.id}
                  className="template-card"
                  onClick={() => {
                    handleCreateBoard(tmpl.id);
                    setShowTemplatesModal(false);
                  }}
                >
                  <span className="tmpl-icon">
                    <TemplateIcon />
                  </span>
                  <h4>{tmpl.name}</h4>
                  <p>{tmpl.description}</p>
                </div>
              ))}
            </div>
            <div className="dialog-buttons">
              <button
                className="btn-cancel"
                onClick={() => {
                  setShowTemplatesModal(false);
                  setActiveTab("plantillas");
                }}
              >
                Explorar biblioteca completa ({TEMPLATES.length}) →
              </button>
              <button className="btn-cancel" onClick={() => setShowTemplatesModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gemini AI Blueprint Generator Modal */}
      {showAiBuilderModal && (
        <div className="dialog-overlay" onClick={() => !isGeneratingTemplate && setShowAiBuilderModal(false)}>
          <div className="dialog-box ai-generator-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "680px" }}>
            <div className="ai-modal-header">
              <div className="ai-modal-badge">
                <SparkleIcon />
                <span>GEMINI 1.5 FLASH</span>
              </div>
              <h3>Creador Inteligente de Diagramas & Blueprints</h3>
              <p>Describe el flujo, arquitectura o estructura que necesitas y Sketion construirá los bloques, relaciones y textos al instante.</p>
            </div>

            <div className="ai-prompt-input-group">
              <label>Describe tu idea:</label>
              <textarea
                placeholder="Ej: Diagrama de arquitectura AWS con CloudFront, S3 y Lambda; o Customer Journey de una app de entrega de comida..."
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                disabled={isGeneratingTemplate}
                rows={4}
              />
            </div>

            <div className="ai-prompt-examples">
              <span className="examples-label">Ejemplos rápidos:</span>
              <div className="examples-list">
                <button
                  type="button"
                  onClick={() => setAiPrompt("Arquitectura RAG con Embeddings, Vector DB y LLM")}
                  disabled={isGeneratingTemplate}
                >
                  Arquitectura RAG
                </button>
                <button
                  type="button"
                  onClick={() => setAiPrompt("Mapa mental sobre estrategias de retención y monetización")}
                  disabled={isGeneratingTemplate}
                >
                  Mapa Mental
                </button>
                <button
                  type="button"
                  onClick={() => setAiPrompt("Diagrama SIPOC para proceso de onboarding de clientes")}
                  disabled={isGeneratingTemplate}
                >
                  Diagrama SIPOC
                </button>
              </div>
            </div>

            <div className="dialog-buttons">
              <button
                type="button"
                className="btn-cancel"
                onClick={() => setShowAiBuilderModal(false)}
                disabled={isGeneratingTemplate}
              >
                Cancelar
              </button>
              <button
                type="button"
                className="btn-confirm btn-ai-generate-confirm"
                onClick={async () => {
                  if (!aiPrompt.trim()) return;
                  setIsGeneratingTemplate(true);
                  try {
                    const { processAIPromptToCanvas } = await import("../data/aiSkillEngine");
                    const result = processAIPromptToCanvas(aiPrompt);
                    const id = `board_${crypto.randomUUID().replace(/-/g, "").substring(0, 12)}`;
                    await saveBoard(id, { name: result.title || aiPrompt }, result.elements, {}, {});
                    setShowAiBuilderModal(false);
                    onSelectBoard(id);
                  } catch (err: any) {
                    console.error("AI Generation failed:", err);
                    alert(`No se pudo generar el diagrama asistido.\n\nDetalles: ${err?.message || err}`);
                  } finally {
                    setIsGeneratingTemplate(false);
                  }
                }}
                disabled={isGeneratingTemplate || !aiPrompt.trim()}
              >
                {isGeneratingTemplate ? "Generando diagrama..." : "Generar en Canvas"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Move Board Modal */}
      {showMoveModal && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h3>Mover Tablero</h3>
            <p className="dialog-desc">Selecciona la carpeta de destino para este tablero:</p>
            <div className="form-group">
              <label>Carpeta de Destino:</label>
              <select
                value={selectedFolderForMove || ""}
                onChange={(e) => setSelectedFolderForMove(e.target.value || null)}
              >
                <option value="">(Sin carpeta / Raíz)</option>
                {folders.map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="dialog-buttons">
              <button className="btn-cancel" onClick={() => setShowMoveModal(false)}>
                Cancelar
              </button>
              <button className="btn-confirm" onClick={handleMoveBoardConfirm}>
                Mover
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Folder Modal */}
      {showCreateFolderModal && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h3>Nueva Carpeta</h3>
            <div className="form-group">
              <label>Nombre de la Carpeta:</label>
              <input
                type="text"
                placeholder="Escribe el nombre aquí..."
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreateFolderConfirm()}
                autoFocus
              />
            </div>
            <div className="dialog-buttons">
              <button className="btn-cancel" onClick={() => setShowCreateFolderModal(false)}>
                Cancelar
              </button>
              <button className="btn-confirm" onClick={handleCreateFolderConfirm}>
                Crear
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Prompt Modal */}
      {showPasswordPromptModal && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h3>Tablero Protegido</h3>
            <p className="dialog-desc">Por favor, introduce la contraseña para abrirlo:</p>
            <div className="form-group">
              <label>Contraseña:</label>
              <input
                type="password"
                placeholder="Contraseña..."
                value={passwordPromptInput}
                onChange={(e) => setPasswordPromptInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordPromptConfirm()}
                autoFocus
              />
              {passwordPromptError && <div className="error-text">{passwordPromptError}</div>}
            </div>
            <div className="dialog-buttons">
              <button className="btn-cancel" onClick={() => setShowPasswordPromptModal(false)}>
                Cancelar
              </button>
              <button className="btn-confirm" onClick={handlePasswordPromptConfirm}>
                Entrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Password Set Modal */}
      {showPasswordSetModal && (
        <div className="dialog-overlay">
          <div className="dialog-box">
            <h3>Proteger Tablero</h3>
            <p className="dialog-desc">Introduce una contraseña para proteger este tablero. Déjalo vacío para quitar la protección:</p>
            <div className="form-group">
              <label>Contraseña:</label>
              <input
                type="password"
                placeholder="Escribe la contraseña aquí..."
                value={passwordSetInput}
                onChange={(e) => setPasswordSetInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePasswordSetConfirm()}
                autoFocus
              />
            </div>
            <div className="dialog-buttons">
              <button className="btn-cancel" onClick={() => setShowPasswordSetModal(false)}>
                Cancelar
              </button>
              <button className="btn-confirm" onClick={handlePasswordSetConfirm}>
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version History Modal */}
      {showHistoryModal && (
        <div className="dialog-overlay" onClick={() => setShowHistoryModal(false)}>
          <div className="dialog-box history-modal-box" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
            <div className="dialog-header-with-close">
              <h3>Historial de Versiones</h3>
              <button
                className="dialog-close-icon"
                onClick={() => setShowHistoryModal(false)}
                title="Cerrar"
              >
                ✕
              </button>
            </div>
            <p className="dialog-desc">Restaura este tablero a una versión previa. La versión actual se resguardará automáticamente.</p>
            <div className="versions-list">
              {boardVersions.length === 0 ? (
                <div className="no-versions-msg">No hay versiones guardadas para este tablero todavía.</div>
              ) : (
                boardVersions.map((version, index) => (
                  <div key={version.id} className="version-item">
                    <div className="version-info">
                      <div className="version-name-tag">Versión {boardVersions.length - index}</div>
                      <div className="version-time">
                        {new Date(version.timestamp).toLocaleString()} • <span className="elements-count-badge">{version.elementsCount} elementos</span>
                      </div>
                    </div>
                    <button className="btn-confirm version-restore-btn" onClick={() => handleRestoreVersion(version.id)}>
                      Restaurar
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="dialog-buttons">
              <button className="btn-cancel" onClick={() => setShowHistoryModal(false)}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Help Modal */}
      {showHelpModal && (
        <div className="dialog-overlay">
          <div className="dialog-box" style={{ maxWidth: "480px" }}>
            <h3>Centro de Ayuda y Atajos</h3>
            <p className="dialog-desc">Guía rápida de uso del Espacio de Trabajo:</p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13px", maxHeight: "300px", overflowY: "auto", paddingRight: "4px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border-color)", paddingBottom: "6px" }}>
                <strong>Acción</strong>
                <strong>Atajo</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Activar Modo Presentación</span>
                <kbd style={{ background: "#eee", padding: "2px 6px", borderRadius: "4px", border: "1px solid #ccc", color: "#333", fontSize: "11px" }}>Ctrl + P</kbd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Abrir / Buscar Librería</span>
                <kbd style={{ background: "#eee", padding: "2px 6px", borderRadius: "4px", border: "1px solid #ccc", color: "#333", fontSize: "11px" }}>Ctrl + Shift + L</kbd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Herramienta Mano (Arrastrar Canvas)</span>
                <kbd style={{ background: "#eee", padding: "2px 6px", borderRadius: "4px", border: "1px solid #ccc", color: "#333", fontSize: "11px" }}>Espacio</kbd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Duplicar Elemento</span>
                <kbd style={{ background: "#eee", padding: "2px 6px", borderRadius: "4px", border: "1px solid #ccc", color: "#333", fontSize: "11px" }}>Alt + Arrastrar / Ctrl + D</kbd>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span>Zoom Acercar / Alejar</span>
                <kbd style={{ background: "#eee", padding: "2px 6px", borderRadius: "4px", border: "1px solid #ccc", color: "#333", fontSize: "11px" }}>Rueda ratón / Ctrl + +/-</kbd>
              </div>
            </div>
            <div className="dialog-buttons">
              <button className="btn-cancel" onClick={() => setShowHelpModal(false)}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Plan Selector Modal */}
      {showPlanModal && (
        <div className="dialog-overlay">
          <div className="dialog-box" style={{ maxWidth: "540px", borderRadius: "16px", padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "10px", backgroundColor: "#fef2f2", color: "#ef4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "17px", fontWeight: 700, color: "var(--text-primary)" }}>Gestión de Planes de Almacenamiento</h3>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--text-secondary)" }}>Elige tu plan para aumentar la capacidad de tus proyectos y sincronización</p>
                </div>
              </div>
              <button
                onClick={() => setShowPlanModal(false)}
                style={{ background: "none", border: "none", fontSize: "18px", cursor: "pointer", color: "var(--text-secondary)" }}
              >
                ✕
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", margin: "20px 0" }}>
              {/* Plan Gratuito */}
              <div 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: "14px 16px", 
                  borderRadius: "12px", 
                  border: activePlan === "free" ? "2px solid #ef4444" : "1px solid var(--border-color)",
                  backgroundColor: activePlan === "free" ? "rgba(239, 68, 68, 0.05)" : "var(--bg-card)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={() => {
                  setActivePlan("free");
                  localStorage.setItem("my-excalidraw-plan", "free");
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14.5px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                    Plan Gratuito
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>Capacidad de 10 MB. Almacenamiento local básico.</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>$0 / mes</div>
                  {activePlan === "free" && <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 700 }}>● Activo</span>}
                </div>
              </div>

              {/* Plan Pro */}
              <div 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: "14px 16px", 
                  borderRadius: "12px", 
                  border: activePlan === "pro" ? "2px solid #ef4444" : "1px solid var(--border-color)",
                  backgroundColor: activePlan === "pro" ? "rgba(239, 68, 68, 0.05)" : "var(--bg-card)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={() => {
                  setActivePlan("pro");
                  localStorage.setItem("my-excalidraw-plan", "pro");
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14.5px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                    Plan Pro
                    <span style={{ backgroundColor: "#ef4444", color: "#ffffff", fontSize: "10px", padding: "2px 6px", borderRadius: "6px", fontWeight: 700 }}>RECOMENDADO</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>Capacidad de 100 MB. Nube ilimitada, PDFs y analíticas.</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: "#ef4444" }}>$9 / mes</div>
                  {activePlan === "pro" && <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 700 }}>● Activo</span>}
                </div>
              </div>

              {/* Plan Empresarial */}
              <div 
                style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center", 
                  padding: "14px 16px", 
                  borderRadius: "12px", 
                  border: activePlan === "enterprise" ? "2px solid #ef4444" : "1px solid var(--border-color)",
                  backgroundColor: activePlan === "enterprise" ? "rgba(239, 68, 68, 0.05)" : "var(--bg-card)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
                onClick={() => {
                  setActivePlan("enterprise");
                  localStorage.setItem("my-excalidraw-plan", "enterprise");
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, fontSize: "14.5px", color: "var(--text-primary)", display: "flex", alignItems: "center", gap: "6px" }}>
                    Plan Empresarial
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--text-secondary)", marginTop: "2px" }}>Capacidad de 1 GB. Roles avanzados y soporte 24/7.</div>
                </div>
                <div style={{ textAlign: "right" }}>
                  <div style={{ fontWeight: 700, fontSize: "15px", color: "var(--text-primary)" }}>$29 / mes</div>
                  {activePlan === "enterprise" && <span style={{ fontSize: "11px", color: "#ef4444", fontWeight: 700 }}>● Activo</span>}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setShowPlanModal(false)}
                style={{
                  padding: "10px 24px",
                  borderRadius: "10px",
                  border: "none",
                  backgroundColor: "#ef4444",
                  color: "#ffffff",
                  fontSize: "13.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(239, 68, 68, 0.25)",
                }}
              >
                Guardar y Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      {showAuthModal && (
        <AuthModal
          onClose={() => setShowAuthModal(false)}
          onSuccess={handleTriggerSync}
        />
      )}
    </div>
  );
};
