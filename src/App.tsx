import React, { useState, useEffect, useRef } from "react";
import { 
  Lock, 
  Unlock, 
  Shield,
  FileSpreadsheet, 
  PlusCircle, 
  Trash2, 
  Search, 
  Calendar, 
  MapPin, 
  User, 
  Users,
  Wrench,
  Clock,
  HardHat, 
  ClipboardCheck, 
  LogOut, 
  Download, 
  RefreshCw, 
  AlertCircle, 
  CheckCircle2, 
  Info,
  Server,
  CloudLightning,
  Layers,
  Database,
  FileText,
  Key,
  Palette,
  Briefcase,
  UserCheck,
  Check,
  X,
  Plus,
  Edit,
  Eye,
  Heart,
  Printer,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Submission } from "./types";

// Dynamic Minimalist Logo Presets
const LOGO_BG_PRESETS: {
  [key: string]: {
    containerClass: string;
    titleClass: string;
    subClass: string;
    lineClass: string;
    name: string;
    colorHex: string;
    textClass: string;
  }
} = {
  slate: {
    containerClass: "bg-slate-50 border-slate-200/80 text-slate-800",
    titleClass: "text-slate-900",
    subClass: "text-slate-500",
    lineClass: "bg-slate-300",
    name: "Slate Classic",
    colorHex: "#f8fafc",
    textClass: "text-slate-700"
  },
  dark: {
    containerClass: "bg-[#0F172A] border-slate-800 text-slate-100",
    titleClass: "text-white",
    subClass: "text-slate-400",
    lineClass: "bg-slate-700",
    name: "Midnight Obsidian",
    colorHex: "#0F172A",
    textClass: "text-slate-400"
  },
  amber: {
    containerClass: "bg-[#FDFBF7] border-amber-200/70 text-amber-900",
    titleClass: "text-amber-950",
    subClass: "text-amber-700/80",
    lineClass: "bg-amber-200",
    name: "Desert Gold",
    colorHex: "#FDFBF7",
    textClass: "text-amber-800"
  },
  cream: {
    containerClass: "bg-stone-50 border-stone-200/85 text-stone-800",
    titleClass: "text-stone-900",
    subClass: "text-stone-500",
    lineClass: "bg-stone-200",
    name: "Nordic Warmth",
    colorHex: "#faf9f6",
    textClass: "text-stone-700"
  },
  emerald: {
    containerClass: "bg-emerald-50/70 border-emerald-200/60 text-emerald-950",
    titleClass: "text-emerald-900",
    subClass: "text-emerald-600/85",
    lineClass: "bg-emerald-200",
    name: "Forest Mint",
    colorHex: "#f0fdf4",
    textClass: "text-emerald-800"
  },
  blue: {
    containerClass: "bg-[#F0F9FF] border-sky-100/85 text-sky-950",
    titleClass: "text-sky-900",
    subClass: "text-sky-600/85",
    lineClass: "bg-sky-200",
    name: "Corporate Ice",
    colorHex: "#F0F9FF",
    textClass: "text-sky-800"
  }
};

// Safe localStorage wrapper to prevent iframe SecurityError DOMExceptions
const safeStorage = {
  getItem: (key: string): string | null => {
    try {
      return localStorage.getItem(key);
    } catch (e) {
      console.warn("Storage access denied:", e);
      return null;
    }
  },
  setItem: (key: string, value: string): void => {
    try {
      localStorage.setItem(key, value);
    } catch (e) {
      console.warn("Storage access denied:", e);
    }
  },
  removeItem: (key: string): void => {
    try {
      localStorage.removeItem(key);
    } catch (e) {
      console.warn("Storage access denied:", e);
    }
  }
};

// Suggested fields to accelerate field logging without repetitive typing
const COMMON_PROJECTS = ["HASSAN VILLA PROJECT", "MOSQUE PROJECT", "PROPOSED RESIDENTIAL BUILDING",];
const COMMON_LOCATIONS = ["AL WARQA'A 1ST", "AL YALAYIS 5TH", "AL BARSHA 2ND", "AL JADAF"];
const COMMON_ENGINEERS = ["ENGR. SHAMJAS", "ENGR. DAWIT", "ENGR. YONAS", "ENGR. ALI"];
const DESIGNATIONS = ["CARPENTER", "HELPER", "STEEL FIXER", "MASON", "FOREMAN", "ELECTRICIAN", "PLUMBER", "TILE FIXER"];
const COMMON_TASKS = ["HOUSEKEEPING", "STEEL FIXER", "CONCRETING", "EXCAVATION", "WALL MASONRY", "SCAFFOLDING", "CLEANING"];

const DEFAULT_LABOR_CODES = [
  { code: "BL001", name: "MUHAMMAD RAMZAN" },
  { code: "BL002", name: "KARTAR SINGH" },
  { code: "BL003", name: "ALEXIS SÁNCHEZ" },
  { code: "BL004", name: "AHMED MANSUR" }
];

const DEFAULT_PROJECT_CODES = [
  { code: "P001", name: "HASSAN VILLA PROJECT", location: "AL WARQA'A 1ST" },
  { code: "P002", name: "MOSQUE PROJECT", location: "AL YALAYIS 5TH" },
  { code: "P003", name: "PROPOSED RESIDENTIAL BUILDING", location: "AL BARSHA 2ND" }
];

// Beautiful, robust custom Searchable Dropdown with keyboard-friendly instant code/text matching
interface SearchableDropdownProps {
  id: string;
  label: string;
  icon: React.ReactNode;
  placeholder: string;
  options: { value: string; label: string; sublabel?: string; data?: any }[];
  value: string;
  onChange: (value: string, data?: any) => void;
  required?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  allowCustom?: boolean;
  containerId?: string;
  onlyDisplayValue?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  id,
  label,
  icon,
  placeholder,
  options,
  value,
  onChange,
  required = false,
  readOnly = false,
  disabled = false,
  allowCustom = false,
  containerId,
  onlyDisplayValue = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"search" | "custom">("search");
  const [searchQuery, setSearchQuery] = useState("");
  const [customInput, setCustomInput] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Auto-set the appropriate tab and pre-fill inputs when dropdown opens
  const handleToggleDropdown = () => {
    if (readOnly || disabled) return;
    
    if (!isOpen) {
      // Check if current value exists and matches a standard option
      const matched = options.find((o) => o.value.toUpperCase() === value.toUpperCase());
      
      if (value && !matched && allowCustom) {
        // It's a custom value
        setActiveTab("custom");
        setCustomInput(value);
        setSearchQuery("");
      } else {
        // Predefined option or empty
        setActiveTab("search");
        setSearchQuery("");
        setCustomInput("");
      }
    }
    setIsOpen(!isOpen);
  };

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  // Handle escape key to close
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Filter options based on search query inside the popover
  const filteredOptions = options.filter((o) => {
    const term = searchQuery.toLowerCase().trim();
    if (!term) return true;
    return (
      o.value.toLowerCase().includes(term) ||
      o.label.toLowerCase().includes(term) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(term))
    );
  });

  const handleSelectOption = (opt: { value: string; label: string; data?: any }) => {
    onChange(opt.value, opt.data);
    setIsOpen(false);
  };

  const handleApplyCustom = () => {
    const trimmed = customInput.trim();
    if (trimmed) {
      // Check if it matches an existing option (case-insensitive)
      const matched = options.find(
        (o) => o.value.toUpperCase() === trimmed.toUpperCase() || o.label.toUpperCase() === trimmed.toUpperCase()
      );
      if (matched) {
        onChange(matched.value, matched.data);
      } else {
        onChange(trimmed.toUpperCase()); // default upper-cased for database consistency
      }
    } else {
      onChange("");
    }
    setIsOpen(false);
  };

  // Find if there is a match to display its description beautifully
  const matchedOpt = options.find((o) => o.value.toUpperCase() === value.toUpperCase());
  const showLabelDescription = matchedOpt && matchedOpt.label !== matchedOpt.value && !onlyDisplayValue;

  // Render the label to show in the closed state trigger field
  const displayValue = value
    ? matchedOpt
      ? matchedOpt.label !== matchedOpt.value && !onlyDisplayValue
        ? `${value} - ${matchedOpt.label}`
        : value
      : value
    : "";

  return (
    <div id={containerId} className="flex flex-col relative" ref={containerRef}>
      <div className="flex justify-between items-center mb-1.5">
        <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase flex items-center gap-1.5">
          {icon} {label}
        </label>
        {showLabelDescription && (
          <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md max-w-[200px] truncate uppercase font-sans">
            {matchedOpt.label}
          </span>
        )}
      </div>
      
      {/* Trigger Button - styled exactly like a text input but operates as a secure click target */}
      <div className="relative">
        <button
          type="button"
          onClick={handleToggleDropdown}
          disabled={disabled || readOnly}
          className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-10 text-left text-sm font-semibold text-slate-800 transition-all flex items-center justify-between ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:bg-slate-100/30"
          } ${readOnly ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}`}
        >
          {displayValue ? (
            <span className="truncate uppercase text-slate-800 font-bold">{displayValue}</span>
          ) : (
            <span className="text-slate-400 font-medium font-sans">{placeholder}</span>
          )}
          
          {!readOnly && !disabled && (
            <span className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 pointer-events-none">
              <svg
                className={`h-4 w-4 transform transition-transform duration-200 text-slate-400 ${isOpen ? "rotate-180" : ""}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </span>
          )}
        </button>
      </div>

      {isOpen && !readOnly && !disabled && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200/90 rounded-2xl shadow-xl overflow-hidden font-sans text-sm animate-fadeIn flex flex-col max-h-[350px]">
          
          {/* Custom interactive Tab switcher */}
          <div className="flex border-b border-slate-100 bg-slate-50/70 p-1 flex-shrink-0">
            <button
              type="button"
              onClick={() => setActiveTab("search")}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                activeTab === "search"
                  ? "bg-white text-slate-900 shadow-xs border border-slate-200/40"
                  : "text-slate-400 hover:text-slate-700 hover:bg-slate-100/50"
              }`}
            >
              <Search className="h-3.5 w-3.5" /> Search & Select
            </button>
            {allowCustom && (
              <button
                type="button"
                onClick={() => setActiveTab("custom")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                  activeTab === "custom"
                    ? "bg-white text-slate-900 shadow-xs border border-slate-200/40"
                    : "text-slate-400 hover:text-slate-700 hover:bg-slate-100/50"
                }`}
              >
                <PlusCircle className="h-3.5 w-3.5" /> Enter Custom
              </button>
            )}
          </div>

          {/* Tab contents */}
          <div className="flex-1 overflow-hidden flex flex-col">
            {activeTab === "search" ? (
              <>
                {/* Search query input box inside the dropdown list */}
                <div className="p-2 border-b border-slate-100 bg-white flex-shrink-0">
                  <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                    <input
                      type="text"
                      placeholder={`Search options...`}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-lg py-1.5 pl-9 pr-3 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-500 transition-all"
                      autoFocus
                    />
                  </div>
                </div>

                {/* Filtered options scrolling list */}
                <div className="overflow-y-auto py-1 max-h-48 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((opt) => {
                      const isSelected = opt.value.toUpperCase() === value.toUpperCase();
                      return (
                        <button
                          key={opt.value}
                          type="button"
                          onClick={() => handleSelectOption(opt)}
                          className={`w-full text-left px-4 py-2.5 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 border-b border-slate-50/50 cursor-pointer ${
                            isSelected ? "bg-slate-50 text-slate-900 font-bold" : "text-slate-700"
                          }`}
                        >
                          <span className="font-mono text-xs font-bold text-slate-900">
                            {opt.value} {opt.label !== opt.value ? `- ${opt.label}` : ""}
                          </span>
                          {opt.sublabel && (
                            <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1 mt-0.5">
                              <MapPin className="h-2.5 w-2.5 text-slate-400" /> {opt.sublabel}
                            </span>
                          )}
                        </button>
                      );
                    })
                  ) : (
                    <div className="px-4 py-8 text-xs text-slate-400 text-center font-medium font-sans">
                      No matching records found
                    </div>
                  )}
                </div>
              </>
            ) : (
              /* Custom entry tab content */
              <div className="p-4 bg-white flex flex-col gap-3 flex-shrink-0 animate-fadeIn">
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest font-mono">
                    Type Custom {label}
                  </span>
                  <input
                    type="text"
                    placeholder={`Type information...`}
                    value={customInput}
                    onChange={(e) => setCustomInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleApplyCustom();
                      }
                    }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-500 transition-all uppercase"
                    autoFocus
                  />
                </div>
                <button
                  type="button"
                  onClick={handleApplyCustom}
                  className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold uppercase tracking-widest transition-colors cursor-pointer"
                >
                  Apply Selection
                </button>
                <p className="text-[9px] text-slate-400 font-mono text-center">
                  Press Enter or click the button above to secure your custom input.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  // Navigation & authentication state
  const [currentView, setCurrentView] = useState<"form" | "admin">("form");
  const [adminTab, setAdminTab] = useState<"ledger" | "monitoring" | "labor_codes" | "security">("ledger");
  const [passcode, setPasscode] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string>("");
  const [checkingAuth, setCheckingAuth] = useState<boolean>(false);

  // Passcode setup/change states
  const [isPasscodeConfigured, setIsPasscodeConfigured] = useState<boolean | null>(null);
  
  // Create setup states
  const [newSetupPasscode, setNewSetupPasscode] = useState<string>("");
  const [confirmSetupPasscode, setConfirmSetupPasscode] = useState<string>("");
  const [setupError, setSetupError] = useState<string>("");
  const [setupSuccess, setSetupSuccess] = useState<string>("");
  const [settingUp, setSettingUp] = useState<boolean>(false);

  // Change states
  const [currentChangePasscode, setCurrentChangePasscode] = useState<string>("");
  const [newChangePasscode, setNewChangePasscode] = useState<string>("");
  const [confirmChangePasscode, setConfirmChangePasscode] = useState<string>("");
  const [changePasscodeError, setChangePasscodeError] = useState<string>("");
  const [changePasscodeSuccess, setChangePasscodeSuccess] = useState<string>("");
  const [changingPasscode, setChangingPasscode] = useState<boolean>(false);

  // Form input state
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split("T")[0],
    project: "",
    laborsName: "",
    designation: "",
    projectLocation: "",
    siteEngineer: "",
    reassignedTask: "",
    customDesignation: "",
    customReassignedTask: "",
    laborCode: "",
    attendanceStatus: "Present",
    activityName: "",
    workCompletedPercent: "",
    targetDate: "",
    workCompletedTodayPercent: "",
    noOfLaborSubcontractor: "",
    equipment: "",
    remarks: "",
  });

  // Submission UX state
  const [activeFormTab, setActiveFormTab] = useState<"attendance" | "monitoring">("attendance");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitSuccess, setSubmitSuccess] = useState<boolean>(false);
  const [submitError, setSubmitError] = useState<string>("");
  const [lastSubmittedName, setLastSubmittedName] = useState<string>("");

  // Admin logs state
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);
  const [logsError, setLogsError] = useState<string>("");

  // Separate Daily & Monthly files state
  const [ledgerFiles, setLedgerFiles] = useState<{ daily: any[]; monthly: any[] }>({ daily: [], monthly: [] });
  const [isLoadingLedgerFiles, setIsLoadingLedgerFiles] = useState<boolean>(false);
  const [ledgerFilesError, setLedgerFilesError] = useState<string>("");

  // State for viewing/inspecting a specific daily/monthly ledger file
  const [activeViewFile, setActiveViewFile] = useState<{
    isOpen: boolean;
    type: "daily" | "monthly";
    filename: string;
    date: string;
    records: Submission[];
    isLoading: boolean;
    error: string;
    searchTerm: string;
  }>({
    isOpen: false,
    type: "daily",
    filename: "",
    date: "",
    records: [],
    isLoading: false,
    error: "",
    searchTerm: "",
  });

  // Labor Codes system state
  const [laborCodes, setLaborCodes] = useState<any[]>([]);
  const [isLoadingLaborCodes, setIsLoadingLaborCodes] = useState<boolean>(false);
  const [laborCodesError, setLaborCodesError] = useState<string>("");
  const [matchedLaborName, setMatchedLaborName] = useState<string>("");

  // New labor code inputs
  const [newLaborCode, setNewLaborCode] = useState("");
  const [newLaborName, setNewLaborName] = useState("");
  const [newLaborDesignation, setNewLaborDesignation] = useState("HELPER");
  const [isSavingLaborCode, setIsSavingLaborCode] = useState(false);
  const [saveLaborCodeError, setSaveLaborCodeError] = useState("");
  const [laborCodeSearch, setLaborCodeSearch] = useState("");

  // Editing state for Labor Mapping Ledger
  const [editingLaborId, setEditingLaborId] = useState<string | null>(null);
  const [editLaborCode, setEditLaborCode] = useState("");
  const [editLaborName, setEditLaborName] = useState("");
  const [editLaborDesignation, setEditLaborDesignation] = useState("HELPER");

  // Project Codes system state
  const [projectCodes, setProjectCodes] = useState<any[]>([]);
  const [isLoadingProjectCodes, setIsLoadingProjectCodes] = useState<boolean>(false);
  const [projectCodesError, setProjectCodesError] = useState<string>("");

  // New project code inputs
  const [newProjectCode, setNewProjectCode] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectLocation, setNewProjectLocation] = useState("");
  const [isSavingProjectCode, setIsSavingProjectCode] = useState(false);
  const [saveProjectCodeError, setSaveProjectCodeError] = useState("");
  const [projectCodeSearch, setProjectCodeSearch] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<string>("");

  // Editing state for Project Mapping Ledger
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectCode, setEditProjectCode] = useState("");
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectLocation, setEditProjectLocation] = useState("");
  const [laborCodesSubTab, setLaborCodesSubTab] = useState<"labor_codes" | "project_codes">("labor_codes");
  
  // New States for Progress Monitoring row editing and single sheet viewing
  const [editingProgressId, setEditingProgressId] = useState<string | null>(null);
  const [selectedProgressRowIds, setSelectedProgressRowIds] = useState<string[]>([]);
  const [editProgressForm, setEditProgressForm] = useState({
    activityName: "",
    workCompletedPercent: "",
    targetDate: "",
    workCompletedTodayPercent: "",
    noOfLaborSubcontractor: "",
    equipment: "",
    remarks: "",
    images: [] as string[]
  });

  const [viewingProgressSheet, setViewingProgressSheet] = useState<{
    isOpen: boolean;
    projectCode: string;
    projectName: string;
    projectLocation: string;
    date: string;
    records: Submission[];
  } | null>(null);
  
  // Engineer Portal States
  const [isEngineerPortalOpen, setIsEngineerPortalOpen] = useState(false);
  const [portalSelectedEngineer, setPortalSelectedEngineer] = useState<string | null>(null);
  const [engineerSearchQuery, setEngineerSearchQuery] = useState("");
  const [editingEngineerRecordId, setEditingEngineerRecordId] = useState<string | null>(null);
  const [engineerPortalActiveProject, setEngineerPortalActiveProject] = useState<string>("ALL");
  const [engineerPortalMobileView, setEngineerPortalMobileView] = useState<"projects" | "logs">("projects");
  const [isAddingActivity, setIsAddingActivity] = useState<boolean>(false);
  const [addActivityError, setAddActivityError] = useState<string>("");
  const [isAddingActivitySubmitting, setIsAddingActivitySubmitting] = useState<boolean>(false);
  const [newActivityForm, setNewActivityForm] = useState({
    project: "",
    projectLocation: "",
    date: new Date().toISOString().split("T")[0],
    activityName: "",
    workCompletedPercent: "",
    targetDate: "",
    workCompletedTodayPercent: "",
    noOfLaborSubcontractor: "",
    equipment: "",
    remarks: ""
  });
  const [editEngineerForm, setEditEngineerForm] = useState({
    activityName: "",
    workCompletedPercent: "",
    targetDate: "",
    workCompletedTodayPercent: "",
    noOfLaborSubcontractor: "",
    equipment: "",
    remarks: "",
    project: "",
    date: "",
    projectLocation: "",
    images: [] as string[]
  });

  // Dynamic Image Upload States for Daily Progress Monitoring Forms
  const [formImages, setFormImages] = useState<string[]>([]);
  const [engineerFormImages, setEngineerFormImages] = useState<string[]>([]);

  // Lightbox Modal for displaying full-sized images
  const [lightbox, setLightbox] = useState<{
    isOpen: boolean;
    images: string[];
    activeIndex: number;
    title?: string;
  }>({
    isOpen: false,
    images: [],
    activeIndex: 0,
    title: ""
  });

  const handleDownloadLightboxImage = () => {
    const currentImg = lightbox.images[lightbox.activeIndex];
    if (!currentImg) return;
    try {
      const link = document.createElement("a");
      link.href = currentImg;
      const cleanTitle = (lightbox.title || "activity_photo")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_");
      link.download = `${cleanTitle}_${lightbox.activeIndex + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error("Failed to download image", err);
    }
  };
  
  // Table search and filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("ALL");
  const [selectedDesignationFilter, setSelectedDesignationFilter] = useState<string>("ALL");
  const [monitoringSearchTerm, setMonitoringSearchTerm] = useState<string>("");
  const [monitoringProjectFilter, setMonitoringProjectFilter] = useState<string>("ALL");
  const [selectedMonitoringDate, setSelectedMonitoringDate] = useState<string>("");

  // Custom dialog and notification states to bypass sandboxed iframe issues with confirm/alert
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void | Promise<void>;
  }>({
    isOpen: false,
    title: "",
    message: "",
    confirmText: "Delete",
    onConfirm: () => {},
  });

  const [notificationState, setNotificationState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    type: "success" | "error" | "info";
  }>({
    isOpen: false,
    title: "",
    message: "",
    type: "info",
  });

  const showNotification = (title: string, message: string, type: "success" | "error" | "info" = "info") => {
    setNotificationState({ isOpen: true, title, message, type });
    // Auto close after 4 seconds
    setTimeout(() => {
      setNotificationState(prev => {
        if (prev.title === title && prev.message === message) {
          return { ...prev, isOpen: false };
        }
        return prev;
      });
    }, 4000);
  };

  // Logo background style customization
  const [logoBg, setLogoBg] = useState<string>(() => {
    return safeStorage.getItem("binlahej_logo_bg") || "slate";
  });

  const handleLogoBgChange = (bgKey: string) => {
    setLogoBg(bgKey);
    safeStorage.setItem("binlahej_logo_bg", bgKey);
  };

  const fetchLaborCodes = async () => {
    setIsLoadingLaborCodes(true);
    setLaborCodesError("");
    try {
      const res = await fetch("/api/labor-codes");
      if (res.ok) {
        const data = await res.json();
        setLaborCodes(data);
      } else {
        setLaborCodesError("Failed to fetch labor codes from database.");
      }
    } catch (err) {
      setLaborCodesError("Error connecting to database server.");
    } finally {
      setIsLoadingLaborCodes(false);
    }
  };

  const fetchProjectCodes = async () => {
    setIsLoadingProjectCodes(true);
    setProjectCodesError("");
    try {
      const res = await fetch("/api/project-codes");
      if (res.ok) {
        const data = await res.json();
        setProjectCodes(data);
      } else {
        setProjectCodesError("Failed to fetch project codes from database.");
      }
    } catch (err) {
      setProjectCodesError("Error connecting to database server.");
    } finally {
      setIsLoadingProjectCodes(false);
    }
  };

  const checkPasscodeStatus = async () => {
    try {
      const res = await fetch("/api/passcode-status");
      if (res.ok) {
        const data = await res.json();
        setIsPasscodeConfigured(data.configured);
      } else {
        setIsPasscodeConfigured(false);
      }
    } catch (e) {
      console.error("Failed to check passcode status:", e);
      setIsPasscodeConfigured(false);
    }
  };

  // Load existing passcode from cache on startup
  useEffect(() => {
    const savedCode = safeStorage.getItem("binlahej_passcode");
    if (savedCode) {
      verifyStoredPasscode(savedCode);
    }
    checkPasscodeStatus();
    fetchLaborCodes();
    fetchProjectCodes();
  }, []);

  // Fetch admin logs whenever admin view is active or authenticated, with real-time short polling updates
  useEffect(() => {
    if (isAuthenticated || currentView === "admin") {
      fetchSubmissions();
      fetchLaborCodes();
      fetchProjectCodes();

      const interval = setInterval(() => {
        fetchSubmissions();
      }, 8000); // Poll every 8 seconds for real-time updates

      return () => clearInterval(interval);
    }
  }, [isAuthenticated, currentView]);

  const handleLaborCodeChange = (codeVal: string) => {
    const upperCode = codeVal.toUpperCase().trim();
    setFormData(prev => ({ ...prev, laborCode: upperCode }));
    
    // Find matching labor code
    const combinedLaborCodes = laborCodes.length > 0 ? laborCodes : DEFAULT_LABOR_CODES;
    const matched = combinedLaborCodes.find(lc => lc.code.toUpperCase() === upperCode);
    if (matched) {
      setMatchedLaborName(matched.name);
      const laborDesignation = (matched.designation || "HELPER").toUpperCase().trim();
      const isPredefined = DESIGNATIONS.includes(laborDesignation);
      setFormData(prev => ({ 
        ...prev, 
        laborsName: matched.name,
        designation: isPredefined ? laborDesignation : "OTHER",
        customDesignation: isPredefined ? "" : laborDesignation
      }));
    } else {
      setMatchedLaborName("");
    }
  };

  const handleProjectCodeChange = (codeVal: string) => {
    const upperCode = codeVal.toUpperCase().trim();
    
    // Find matching project code
    const combinedProjectCodes = projectCodes.length > 0 ? projectCodes : DEFAULT_PROJECT_CODES;
    const matched = combinedProjectCodes.find(pc => pc.code.toUpperCase() === upperCode);
    if (matched) {
      setFormData(prev => ({ 
        ...prev, 
        project: upperCode,
        projectLocation: matched.location
      }));
    } else {
      setFormData(prev => ({ 
        ...prev, 
        project: upperCode,
        projectLocation: ""
      }));
    }
  };

  const handleDesignationChange = (val: string) => {
    const upperVal = val.toUpperCase().trim();
    if (DESIGNATIONS.includes(upperVal)) {
      setFormData(prev => ({ ...prev, designation: upperVal, customDesignation: "" }));
    } else if (val === "") {
      setFormData(prev => ({ ...prev, designation: "", customDesignation: "" }));
    } else {
      setFormData(prev => ({ ...prev, designation: "OTHER", customDesignation: val }));
    }
  };

  const handleTaskChange = (val: string) => {
    const upperVal = val.toUpperCase().trim();
    if (COMMON_TASKS.includes(upperVal)) {
      setFormData(prev => ({ ...prev, reassignedTask: upperVal, customReassignedTask: "" }));
    } else if (val === "") {
      setFormData(prev => ({ ...prev, reassignedTask: "", customReassignedTask: "" }));
    } else {
      setFormData(prev => ({ ...prev, reassignedTask: "OTHER", customReassignedTask: val }));
    }
  };

  const handleSaveLaborCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLaborCode.trim() || !newLaborName.trim()) {
      setSaveLaborCodeError("Please fill in all fields.");
      return;
    }

    setIsSavingLaborCode(true);
    setSaveLaborCodeError("");

    try {
      const res = await fetch("/api/labor-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newLaborCode.trim().toUpperCase(),
          name: newLaborName.trim().toUpperCase(),
          designation: newLaborDesignation.trim().toUpperCase(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setLaborCodes(prev => {
          const filtered = prev.filter(c => c.id !== data.entry.id && c.code !== data.entry.code);
          return [...filtered, data.entry];
        });
        setNewLaborCode("");
        setNewLaborName("");
        setNewLaborDesignation("HELPER");
        showNotification("Success", "Labor code mapping saved successfully.", "success");
      } else {
        const errorData = await res.json();
        setSaveLaborCodeError(errorData.error || "Failed to save code mapping.");
      }
    } catch (err) {
      setSaveLaborCodeError("Network error. Could not connect to database.");
    } finally {
      setIsSavingLaborCode(false);
    }
  };

  const handleSaveProjectCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectCode.trim() || !newProjectName.trim() || !newProjectLocation.trim()) {
      setSaveProjectCodeError("Please fill in all three fields.");
      return;
    }

    setIsSavingProjectCode(true);
    setSaveProjectCodeError("");

    try {
      const res = await fetch("/api/project-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: newProjectCode.trim().toUpperCase(),
          name: newProjectName.trim().toUpperCase(),
          location: newProjectLocation.trim().toUpperCase(),
        }),
      });

      if (res.ok) {
        const data = await res.json();
        setProjectCodes(prev => {
          const filtered = prev.filter(c => c.id !== data.entry.id && c.code !== data.entry.code);
          return [...filtered, data.entry];
        });
        setNewProjectCode("");
        setNewProjectName("");
        setNewProjectLocation("");
        showNotification("Success", "Project code mapping saved successfully.", "success");
      } else {
        const errorData = await res.json();
        setSaveProjectCodeError(errorData.error || "Failed to save project code mapping.");
      }
    } catch (err) {
      setSaveProjectCodeError("Network error. Could not connect to database.");
    } finally {
      setIsSavingProjectCode(false);
    }
  };

  const handleDeleteProjectCode = (id: string, code: string) => {
    setConfirmState({
      isOpen: true,
      title: "Delete Project Code Mapping",
      message: `Are you sure you want to delete the mapping for project code ${code}? This cannot be undone.`,
      confirmText: "Yes, Delete",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/project-codes/${id}`, {
            method: "DELETE"
          });
          if (res.ok) {
            setProjectCodes(prev => prev.filter(c => c.id !== id));
            showNotification("Success", `Project code ${code} mapping deleted successfully.`, "success");
          } else {
            showNotification("Error", "Failed to delete project code mapping.", "error");
          }
        } catch (error) {
          showNotification("Error", "Network error while deleting project code mapping.", "error");
        }
      }
    });
  };

  const handleDeleteLaborCode = (id: string, code: string) => {
    setConfirmState({
      isOpen: true,
      title: "Delete Code Mapping",
      message: `Are you sure you want to delete the mapping for labor code ${code}? This cannot be undone.`,
      confirmText: "Yes, Delete",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/labor-codes/${id}`, {
            method: "DELETE",
          });

          if (res.ok) {
            setLaborCodes(prev => prev.filter(c => c.id !== id));
            showNotification("Success", `Labor code ${code} mapping deleted successfully.`, "success");
          } else {
            showNotification("Error", "Failed to delete code mapping.", "error");
          }
        } catch (err) {
          showNotification("Network Error", "Could not connect to the database.", "error");
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleUpdateLaborCode = async (id: string) => {
    if (!editLaborName.trim()) {
      showNotification("Error", "Labor name cannot be empty.", "error");
      return;
    }

    try {
      const oldCode = id;
      const cleanNewCode = editLaborCode.trim().toUpperCase();
      const cleanNewName = editLaborName.trim().toUpperCase();
      const cleanNewDesignation = editLaborDesignation.trim().toUpperCase();

      if (cleanNewCode !== oldCode) {
        await fetch(`/api/labor-codes/${oldCode}`, { method: "DELETE" });
      }

      const res = await fetch("/api/labor-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanNewCode,
          name: cleanNewName,
          designation: cleanNewDesignation
        })
      });

      if (res.ok) {
        const data = await res.json();
        setLaborCodes(prev => {
          let filtered = prev.filter(c => c.id !== oldCode);
          filtered = filtered.filter(c => c.id !== data.entry.id && c.code !== data.entry.code);
          return [...filtered, data.entry];
        });
        setEditingLaborId(null);
        showNotification("Success", "Labor mapping updated successfully.", "success");
      } else {
        const errData = await res.json();
        showNotification("Error", errData.error || "Failed to update labor mapping.", "error");
      }
    } catch (err) {
      showNotification("Error", "Network error while updating labor mapping.", "error");
    }
  };

  const handleUpdateProjectCode = async (id: string) => {
    if (!editProjectName.trim() || !editProjectLocation.trim()) {
      showNotification("Error", "Project name and location cannot be empty.", "error");
      return;
    }

    try {
      const oldCode = id;
      const cleanNewCode = editProjectCode.trim().toUpperCase();
      const cleanNewName = editProjectName.trim().toUpperCase();
      const cleanNewLocation = editProjectLocation.trim().toUpperCase();

      if (cleanNewCode !== oldCode) {
        await fetch(`/api/project-codes/${oldCode}`, { method: "DELETE" });
      }

      const res = await fetch("/api/project-codes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: cleanNewCode,
          name: cleanNewName,
          location: cleanNewLocation
        })
      });

      if (res.ok) {
        const data = await res.json();
        setProjectCodes(prev => {
          let filtered = prev.filter(c => c.id !== oldCode);
          filtered = filtered.filter(c => c.id !== data.entry.id && c.code !== data.entry.code);
          return [...filtered, data.entry];
        });
        setEditingProjectId(null);
        showNotification("Success", "Project mapping updated successfully.", "success");
      } else {
        const errData = await res.json();
        showNotification("Error", errData.error || "Failed to update project mapping.", "error");
      }
    } catch (err) {
      showNotification("Error", "Network error while updating project mapping.", "error");
    }
  };

  const filteredLaborCodes = laborCodes.filter(lc => {
    const sTerm = laborCodeSearch.toLowerCase();
    return lc.code.toLowerCase().includes(sTerm) || lc.name.toLowerCase().includes(sTerm);
  });

  const filteredProjectCodes = projectCodes.filter(pc => {
    const sTerm = projectCodeSearch.toLowerCase();
    return (
      pc.code.toLowerCase().includes(sTerm) ||
      pc.name.toLowerCase().includes(sTerm) ||
      pc.location.toLowerCase().includes(sTerm)
    );
  });

  // Handle password submission and save token to browser cache
  const verifyStoredPasscode = async (code: string) => {
    try {
      setCheckingAuth(true);
      const res = await fetch("/api/verify-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: code }),
      });
      const data = await res.json();
      if (data.valid) {
        setPasscode(code);
        setIsAuthenticated(true);
      } else {
        safeStorage.removeItem("binlahej_passcode");
      }
    } catch (e) {
      console.error("Passcode autologin validation failed", e);
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode.trim()) {
      setAuthError("Please enter the administrator passcode.");
      return;
    }

    setCheckingAuth(true);
    setAuthError("");

    try {
      const res = await fetch("/api/verify-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode }),
      });
      
      const data = await res.json();
      if (data.valid) {
        setIsAuthenticated(true);
        safeStorage.setItem("binlahej_passcode", passcode);
        setAuthError("");
      } else {
        setAuthError("Incorrect admin passcode. Please try again.");
      }
    } catch (err) {
      setAuthError("Failed to communicate with authorization server.");
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setPasscode("");
    safeStorage.removeItem("binlahej_passcode");
    setCurrentView("form");
  };

  const handlePasscodeSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSetupPasscode.trim()) {
      setSetupError("Passcode cannot be blank.");
      return;
    }
    if (newSetupPasscode.length < 4) {
      setSetupError("Passcode must be at least 4 characters.");
      return;
    }
    if (newSetupPasscode !== confirmSetupPasscode) {
      setSetupError("Passcodes do not match.");
      return;
    }

    setSettingUp(true);
    setSetupError("");
    setSetupSuccess("");

    try {
      const res = await fetch("/api/setup-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPasscode: newSetupPasscode })
      });
      const data = await res.json();
      if (res.ok) {
        setSetupSuccess("Security passcode configured successfully!");
        setPasscode(newSetupPasscode);
        setIsAuthenticated(true);
        safeStorage.setItem("binlahej_passcode", newSetupPasscode);
        setIsPasscodeConfigured(true);
        setNewSetupPasscode("");
        setConfirmSetupPasscode("");
      } else {
        setSetupError(data.error || "Failed to save passcode.");
      }
    } catch (err) {
      setSetupError("Communication error with server.");
    } finally {
      setSettingUp(false);
    }
  };

  const handlePasscodeChange = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChangePasscode.trim()) {
      setChangePasscodeError("New passcode cannot be empty.");
      return;
    }
    if (newChangePasscode.length < 4) {
      setChangePasscodeError("New passcode must be at least 4 characters long.");
      return;
    }
    if (newChangePasscode !== confirmChangePasscode) {
      setChangePasscodeError("New passcodes do not match.");
      return;
    }

    setChangingPasscode(true);
    setChangePasscodeError("");
    setChangePasscodeSuccess("");

    try {
      const res = await fetch("/api/setup-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPasscode: currentChangePasscode,
          newPasscode: newChangePasscode
        })
      });
      const data = await res.json();
      if (res.ok) {
        setChangePasscodeSuccess("Passcode updated successfully in Firebase Database!");
        setPasscode(newChangePasscode);
        safeStorage.setItem("binlahej_passcode", newChangePasscode);
        setCurrentChangePasscode("");
        setNewChangePasscode("");
        setConfirmChangePasscode("");
      } else {
        setChangePasscodeError(data.error || "Failed to update passcode.");
      }
    } catch (err) {
      setChangePasscodeError("Failed to communicate with authorization server.");
    } finally {
      setChangingPasscode(false);
    }
  };

  // Submission execution
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Core validations based on activeFormTab
    let payload: any = {
      date: formData.date,
      project: formData.project.trim().toUpperCase(),
      projectLocation: formData.projectLocation.trim().toUpperCase(),
      siteEngineer: formData.siteEngineer.trim().toUpperCase(),
    };

    if (!payload.project) {
      setSubmitError("Please specify the Project Code.");
      return;
    }

    if (!payload.siteEngineer) {
      setSubmitError("Please specify the Site Engineer.");
      return;
    }

    if (activeFormTab === "attendance") {
      if (!formData.laborsName.trim()) {
        setSubmitError("Please fill in the Labor's Name.");
        return;
      }

      const actualDesignation = formData.designation === "OTHER" 
        ? formData.customDesignation.trim() 
        : formData.designation;

      const actualReassignedTask = formData.reassignedTask === "OTHER" 
        ? formData.customReassignedTask.trim() 
        : formData.reassignedTask;

      if (!actualDesignation) {
        setSubmitError("Please specify the Labor Designation.");
        return;
      }

      if (!actualReassignedTask) {
        setSubmitError("Please specify the Reassigned Task.");
        return;
      }

      payload = {
        ...payload,
        laborsName: formData.laborsName.trim().toUpperCase(),
        designation: actualDesignation.toUpperCase(),
        reassignedTask: actualReassignedTask.toUpperCase(),
        attendanceStatus: formData.attendanceStatus,
        activityName: "",
        workCompletedPercent: "",
        targetDate: "",
        workCompletedTodayPercent: "",
        noOfLaborSubcontractor: "",
        equipment: "",
      };
    } else {
      // "monitoring" tab
      if (!formData.activityName.trim()) {
        setSubmitError("Please specify the Name of Activity.");
        return;
      }

      payload = {
        ...payload,
        laborsName: "",
        designation: "",
        reassignedTask: "",
        attendanceStatus: "Present",
        activityName: formData.activityName.trim().toUpperCase(),
        workCompletedPercent: formData.workCompletedPercent.trim(),
        targetDate: formData.targetDate.trim(),
        workCompletedTodayPercent: formData.workCompletedTodayPercent.trim(),
        noOfLaborSubcontractor: formData.noOfLaborSubcontractor.trim(),
        equipment: formData.equipment.trim().toUpperCase(),
        remarks: formData.remarks.trim().toUpperCase(),
        images: formImages,
      };
    }

    setIsSubmitting(true);
    setSubmitError("");

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setLastSubmittedName(activeFormTab === "attendance" ? payload.laborsName : payload.activityName);
        setFormImages([]); // Reset uploaded pictures
        // Reset name block and task, keep project config to allow rapid logging of next worker
        setFormData(prev => ({
          ...prev,
          laborsName: "",
          customDesignation: "",
          customReassignedTask: "",
          laborCode: "",
          attendanceStatus: "Present",
          activityName: "",
          workCompletedPercent: "",
          targetDate: "",
          workCompletedTodayPercent: "",
          noOfLaborSubcontractor: "",
          equipment: "",
          remarks: "",
        }));
        setMatchedLaborName("");
        // Also refresh the separate daily and monthly ledger files list and submissions in the background
        fetchLedgerFiles();
        fetchSubmissions();
      } else {
        const errorData = await res.json();
        setSubmitError(errorData.error || "Failed to submit entry. Please try again.");
      }
    } catch (err) {
      setSubmitError("Network error. Could not connect to the database.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to compress and resize images to keep database entries light and fast
  const compressImage = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = (event) => {
        const img = new Image();
        img.src = event.target?.result as string;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const MAX_WIDTH = 1024;
          const MAX_HEIGHT = 1024;
          let width = img.width;
          let height = img.height;

          if (width > height) {
            if (width > MAX_WIDTH) {
              height *= MAX_WIDTH / width;
              width = MAX_WIDTH;
            }
          } else {
            if (height > MAX_HEIGHT) {
              width *= MAX_HEIGHT / height;
              height = MAX_HEIGHT;
            }
          }

          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext("2d");
          if (ctx) {
            ctx.drawImage(img, 0, 0, width, height);
            // Compress with a quality of 0.75 for a balance of visual clarity and compact size
            const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.75);
            resolve(compressedDataUrl);
          } else {
            resolve(event.target?.result as string);
          }
        };
        img.onerror = (err) => {
          reject(err);
        };
      };
      reader.onerror = (err) => {
        reject(err);
      };
    });
  };

  // Retrieve existing entries from persistent backend
  const fetchSubmissions = async () => {
    setIsLoadingLogs(true);
    setLogsError("");
    try {
      const res = await fetch("/api/submissions");

      if (res.ok) {
        const data = await res.json();
        setSubmissions(data);
        // Also load the separate daily and monthly files
        fetchLedgerFiles();
      } else {
        setLogsError("Error retrieving database log sheet entries from server.");
      }
    } catch (err) {
      setLogsError("Error loading logs from server.");
    } finally {
      setIsLoadingLogs(false);
    }
  };

  const fetchLedgerFiles = async () => {
    setIsLoadingLedgerFiles(true);
    setLedgerFilesError("");
    try {
      const res = await fetch("/api/ledger-files");
      if (res.ok) {
        const data = await res.json();
        setLedgerFiles(data);
      } else {
        setLedgerFilesError("Failed to load separate daily and monthly ledger files from server.");
      }
    } catch (err) {
      setLedgerFilesError("Network error loading ledger files.");
    } finally {
      setIsLoadingLedgerFiles(false);
    }
  };

  // Helper to export specific records as a beautifully styled PDF document
  const exportSpecificRecordsToPDF = async (records: Submission[], title: string, pdfFilename: string) => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const autoTableFn = autoTableModule.default;

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      // Header Brand bar styling
      doc.setFillColor(15, 23, 42); // slate-900 (#0F172A)
      doc.rect(0, 0, 297, 40, "F");

      // Corporate Header Texts
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(15);
      doc.text("BIN LAHEJ GENERAL MAINTENANCE & CONTRACTING L.L.C", 15, 14);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text("LABOR MONITORING & DESIGNATION SYSTEM", 15, 22);
      doc.text("DOCUMENT CONTROLLER SECURE LEDGER LOGS", 15, 27);

      doc.setFont("Helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("System Record Clerk: KRISTHEL JADE OCDE", 15, 34);

      // Section label inside white canvas
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.text(title.toUpperCase(), 15, 52);

      // Accent separator line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(15, 55, 282, 55);

      // Ledger metadata info block
      doc.setFontSize(8.5);
      doc.setFont("Helvetica", "normal");
      doc.text(`Generated Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 15, 62);
      doc.text(`Total Records Included: ${records.length}`, 15, 67);

      // Setup table parameters
      const tableColumns = [
        "DATE",
        "PROJECT",
        "LABOR'S NAME",
        "TRADE / DESIGNATION",
        "SITE LOCATION",
        "SITE ENGINEER",
        "ASSIGNED TASK",
        "ATTENDANCE"
      ];

      const tableRows = records.map((s) => [
        s.date,
        s.project || "-",
        s.laborsName || "-",
        s.designation || "-",
        s.projectLocation || "-",
        s.siteEngineer || "-",
        s.reassignedTask || "-",
        s.attendanceStatus || "Present"
      ]);

      const tableOptions = {
        head: [tableColumns],
        body: tableRows,
        startY: 74,
        theme: "striped" as const,
        headStyles: {
          fillColor: [15, 23, 42] as [number, number, number], // slate-900 (#0F172A)
          textColor: [255, 255, 255] as [number, number, number],
          fontSize: 8,
          fontStyle: "bold" as const,
          halign: "left" as const
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [51, 65, 85] as [number, number, number] // slate-700
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] as [number, number, number] // slate-50
        },
        columnStyles: {
          0: { cellWidth: 24 }, // Date
          1: { cellWidth: 38 }, // Project
          2: { cellWidth: 38 }, // Labor Name
          3: { cellWidth: 32 }, // Trade/Designation
          4: { cellWidth: 32 }, // Location
          5: { cellWidth: 32 }, // Engineer
          6: { cellWidth: 38 }, // Assigned Task
          7: { cellWidth: 33 }  // Attendance
        },
        styles: {
          cellPadding: 2.5,
          lineColor: [226, 232, 240] as [number, number, number], // slate-200
          lineWidth: 0.1,
          font: "Helvetica"
        },
        margin: { left: 15, right: 15 }
      };

      if (typeof autoTableFn === "function") {
        autoTableFn(doc, tableOptions);
      } else if (typeof (doc as any).autoTable === "function") {
        (doc as any).autoTable(tableOptions);
      } else {
        throw new Error("jsPDF AutoTable is not correctly initialized.");
      }

      doc.save(pdfFilename);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Encountered an issue compiling the PDF document. Please refresh or try again.");
    }
  };

  // View individual ledger file and populate into view modal/slider state
  const handleViewLedgerFile = async (type: "daily" | "monthly", filename: string, date: string) => {
    setActiveViewFile({
      isOpen: true,
      type,
      filename,
      date,
      records: [],
      isLoading: true,
      error: "",
      searchTerm: "",
    });

    try {
      const res = await fetch(`/api/ledger-files/view/${type}/${filename}`);
      if (res.ok) {
        const records = await res.json();
        setActiveViewFile(prev => ({
          ...prev,
          records,
          isLoading: false
        }));
      } else {
        const errText = await res.text();
        setActiveViewFile(prev => ({
          ...prev,
          isLoading: false,
          error: `Error loading records: ${errText || "unauthorized or server error"}`
        }));
      }
    } catch (err) {
      setActiveViewFile(prev => ({
        ...prev,
        isLoading: false,
        error: "Network error loading ledger records."
      }));
    }
  };

  // Instantly download ledger file as PDF
  const handleDownloadFileAsPDF = async (type: "daily" | "monthly", filename: string, date: string) => {
    try {
      const res = await fetch(`/api/ledger-files/view/${type}/${filename}`);
      if (res.ok) {
        const records = await res.json();
        const formattedTitle = type === "daily" 
          ? `DAILY LEDGER RECORDS FOR ${date}`
          : `MONTHLY LEDGER RECORDS FOR ${date}`;
        const pdfName = filename.replace(".json", ".pdf");
        await exportSpecificRecordsToPDF(records, formattedTitle, pdfName);
        showNotification("Success", `${pdfName} downloaded successfully.`, "success");
      } else {
        showNotification("Error", "Could not fetch records to generate PDF.", "error");
      }
    } catch (err) {
      showNotification("Error", "Network error while compiling PDF.", "error");
    }
  };

  const handleDeleteItem = (id: string, name: string) => {
    setConfirmState({
      isOpen: true,
      title: "Delete Ledger Record",
      message: `Are you sure you want to permanently delete the log entry for ${name}? This action cannot be undone.`,
      confirmText: "Yes, Delete",
      onConfirm: async () => {
        try {
          const res = await fetch(`/api/submissions/${id}`, {
            method: "DELETE",
          });

          if (res.ok) {
            setSubmissions(prev => prev.filter((s) => s.id !== id));
            showNotification("Success", "Record deleted successfully.", "success");
            fetchLedgerFiles();
          } else {
            showNotification("Error", "Delete operation failed. Please refresh and try again.", "error");
          }
        } catch (err) {
          showNotification("Network Error", "Could not connect to the database server.", "error");
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDeleteProjectDailySheet = (projectCode: string, dateStr: string) => {
    const combinedProjectCodes = projectCodes.length > 0 ? projectCodes : DEFAULT_PROJECT_CODES;
    const projectInfo = combinedProjectCodes.find(pc => pc.code.toUpperCase() === projectCode.toUpperCase());
    const projectName = projectInfo ? projectInfo.name : `${projectCode} PROJECT`;

    const matchingRecords = submissions.filter(s => 
      s.project.toUpperCase().trim() === projectCode.toUpperCase().trim() && 
      (s.date || "UNKNOWN") === dateStr
    );

    if (matchingRecords.length === 0) {
      showNotification("Error", "No records found for the selected project and date.", "error");
      return;
    }

    setConfirmState({
      isOpen: true,
      title: "Delete Project Daily Sheet",
      message: `Are you sure you want to permanently delete the entire Daily Progress Log Sheet for project ${projectCode} (${projectName}) on ${dateStr}? This will delete all ${matchingRecords.length} activity records in this sheet. This cannot be undone.`,
      confirmText: "Yes, Delete Entire Sheet",
      onConfirm: async () => {
        try {
          // Delete all records in parallel
          const deletePromises = matchingRecords.map(r => 
            fetch(`/api/submissions/${r.id}`, { method: "DELETE" })
          );
          const results = await Promise.all(deletePromises);
          const allSuccessful = results.every(res => res.ok);

          if (allSuccessful) {
            // Update state
            setSubmissions(prev => prev.filter(s => 
              !(s.project.toUpperCase().trim() === projectCode.toUpperCase().trim() && (s.date || "UNKNOWN") === dateStr)
            ));
            showNotification("Success", `Daily Progress Log Sheet for ${projectCode} on ${dateStr} deleted successfully.`, "success");
            fetchLedgerFiles();
          } else {
            // Partial success or failure - refetch
            await fetchSubmissions();
            showNotification("Warning", "Some records could not be deleted. Refreshing list.", "info");
          }
        } catch (error) {
          showNotification("Error", "Network error while deleting project daily sheet.", "error");
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDeleteDailyLogDate = (dateStr: string) => {
    if (!dateStr) return;

    const formatDateHelper = (d: string) => {
      const parts = d.split("-");
      if (parts.length !== 3) return d;
      const year = parts[0];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const day = parseInt(parts[2], 10);
      const months = [
        "January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"
      ];
      return `${months[monthIdx] || parts[1]} ${day}, ${year}`;
    };

    const matchingRecords = submissions.filter(s => (s.date || "UNKNOWN") === dateStr);

    if (matchingRecords.length === 0) {
      showNotification("Error", "No records found for the selected date.", "error");
      return;
    }

    setConfirmState({
      isOpen: true,
      title: "Delete Entire Date Logs",
      message: `Are you sure you want to permanently delete all logs for ${formatDateHelper(dateStr)}? This will delete all ${matchingRecords.length} activity records across all projects on this date. This action cannot be undone.`,
      confirmText: "Yes, Delete All",
      onConfirm: async () => {
        try {
          const deletePromises = matchingRecords.map(r => 
            fetch(`/api/submissions/${r.id}`, { method: "DELETE" })
          );
          const results = await Promise.all(deletePromises);
          const allSuccessful = results.every(res => res.ok);

          if (allSuccessful) {
            setSubmissions(prev => prev.filter(s => (s.date || "UNKNOWN") !== dateStr));
            showNotification("Success", `All logs for ${formatDateHelper(dateStr)} deleted successfully.`, "success");
            fetchLedgerFiles();
            if (selectedMonitoringDate === dateStr) {
              setSelectedMonitoringDate("");
            }
          } else {
            await fetchSubmissions();
            showNotification("Warning", "Some records could not be deleted. Refreshing list.", "info");
          }
        } catch (error) {
          showNotification("Error", "Network error while deleting date logs.", "error");
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  const handleDeleteMultipleItems = (ids: string[]) => {
    if (ids.length === 0) return;
    setConfirmState({
      isOpen: true,
      title: "Delete Selected Records",
      message: `Are you sure you want to permanently delete the ${ids.length} selected log entries? This action cannot be undone.`,
      confirmText: "Yes, Delete Selected",
      onConfirm: async () => {
        try {
          const deletePromises = ids.map(id => 
            fetch(`/api/submissions/${id}`, { method: "DELETE" })
          );
          const results = await Promise.all(deletePromises);
          const allSuccessful = results.every(res => res.ok);

          if (allSuccessful) {
            setSubmissions(prev => prev.filter(s => !ids.includes(s.id)));
            setSelectedProgressRowIds(prev => prev.filter(id => !ids.includes(id)));
            showNotification("Success", `${ids.length} records deleted successfully.`, "success");
            fetchLedgerFiles();
          } else {
            // Partial success
            await fetchSubmissions();
            setSelectedProgressRowIds([]);
            showNotification("Warning", "Some records could not be deleted. Refreshing list.", "info");
          }
        } catch (err) {
          showNotification("Network Error", "Could not connect to the database server.", "error");
        } finally {
          setConfirmState(prev => ({ ...prev, isOpen: false }));
        }
      }
    });
  };

  // Excel UTF-8 safe CSV Downloader
  const downloadCSV = () => {
    window.open("/api/export", "_blank");
  };

  // Modern PDF Downloader of Filtered logs with Document Controller branding Header details
  const exportPDF = async () => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const autoTableFn = autoTableModule.default;

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      // Header Brand bar styling
      doc.setFillColor(15, 23, 42); // slate-900 (#0F172A)
      doc.rect(0, 0, 297, 40, "F");

      // Corporate Header Texts
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(15);
      doc.text("BIN LAHEJ GENERAL MAINTENANCE & CONTRACTING L.L.C", 15, 14);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text("LABOR MONITORING & DESIGNATION SYSTEM", 15, 22);
      doc.text("DOCUMENT CONTROLLER SECURE LEDGER LOGS", 15, 27);

      doc.setFont("Helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text("System Record Clerk: KRISTHEL JADE OCDE", 15, 34);

      // Section label inside white canvas
      doc.setTextColor(15, 23, 42); // slate-900
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(11);
      doc.text("LEDGER LOG SUMMARY", 15, 52);

      // Accent separator line
      doc.setDrawColor(226, 232, 240); // slate-200
      doc.setLineWidth(0.5);
      doc.line(15, 55, 282, 55);

      // Ledger metadata info block
      doc.setFontSize(8.5);
      doc.setFont("Helvetica", "normal");
      doc.text(`Generated Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}`, 15, 62);
      doc.text(`Search Query: ${searchTerm ? `"${searchTerm}"` : "None"}`, 15, 67);
      
      const filterProjStr = selectedProjectFilter === "ALL" ? "All Projects" : selectedProjectFilter;
      const filterTradeStr = selectedDesignationFilter === "ALL" ? "All Trades" : selectedDesignationFilter;
      doc.text(`Project Filter: ${filterProjStr}`, 135, 62);
      doc.text(`Trade Filter: ${filterTradeStr}`, 135, 67);

      doc.text(`Showing ${filteredSubmissions.length} of ${submissions.length} total logged record sheets`, 215, 62);

      // Setup table parameters
      const tableColumns = [
        "DATE",
        "PROJECT",
        "LABOR'S NAME",
        "TRADE / DESIGNATION",
        "SITE LOCATION",
        "SITE ENGINEER",
        "ASSIGNED TASK",
        "ATTENDANCE"
      ];

      const tableRows = filteredSubmissions.map((s) => [
        s.date,
        s.project || "-",
        s.laborsName || "-",
        s.designation || "-",
        s.projectLocation || "-",
        s.siteEngineer || "-",
        s.reassignedTask || "-",
        s.attendanceStatus || "Present"
      ]);

      const tableOptions = {
        head: [tableColumns],
        body: tableRows,
        startY: 74,
        theme: "striped" as const,
        headStyles: {
          fillColor: [15, 23, 42] as [number, number, number], // slate-900 (#0F172A)
          textColor: [255, 255, 255] as [number, number, number],
          fontSize: 8,
          fontStyle: "bold" as const,
          halign: "left" as const
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [51, 65, 85] as [number, number, number] // slate-700
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] as [number, number, number] // slate-50
        },
        columnStyles: {
          0: { cellWidth: 24 }, // Date
          1: { cellWidth: 38 }, // Project
          2: { cellWidth: 38 }, // Labor Name
          3: { cellWidth: 32 }, // Trade/Designation
          4: { cellWidth: 32 }, // Location
          5: { cellWidth: 32 }, // Engineer
          6: { cellWidth: 38 }, // Assigned Task
          7: { cellWidth: 33 }  // Attendance
        },
        styles: {
          cellPadding: 2.5,
          lineColor: [226, 232, 240] as [number, number, number], // slate-200
          lineWidth: 0.1,
          font: "Helvetica"
        },
        margin: { left: 15, right: 15 }
      };

      if (typeof autoTableFn === "function") {
        autoTableFn(doc, tableOptions);
      } else if (typeof (doc as any).autoTable === "function") {
        (doc as any).autoTable(tableOptions);
      } else {
        throw new Error("jsPDF AutoTable is not correctly initialized.");
      }

      // Save output
      const dateStr = new Date().toISOString().split("T")[0];
      doc.save(`Bin_Lahej_Labor_Log_${dateStr}.pdf`);
    } catch (err) {
      console.error("PDF generation failed:", err);
      alert("Encountered an issue compiling the PDF document. Please refresh or try again.");
    }
  };

  // Dedicated CSV Exporter for Daily Activity & Progress Monitoring Logs
  const downloadMonitoringCSV = (filteredLogs: Submission[]) => {
    const BOM = "\uFEFF";
    let csvContent = BOM + '"DATE","PROJECT","SITE LOCATION","SITE ENGINEER","ACTIVITY NAME","TARGET DATE","% WORK COMPLETED (CUMULATIVE)","% WORK COMPLETED TODAY","LABORS/SUB-CONTRACTORS","EQUIPMENT","REMARKS","PICTURES"\n';

    for (const s of filteredLogs) {
      const row = [
        s.date,
        s.project,
        s.projectLocation || "",
        s.siteEngineer || "",
        s.activityName || "",
        s.targetDate || "",
        s.workCompletedPercent || "",
        s.workCompletedTodayPercent || "",
        s.noOfLaborSubcontractor || "",
        s.equipment || "",
        s.remarks || "",
        s.images && s.images.length > 0 ? s.images.join(" | ") : ""
      ].map(val => {
        const clean = (val || "").replace(/"/g, '""');
        return `"${clean}"`;
      }).join(",");
      csvContent += row + "\n";
    }

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `daily_activity_monitoring_log_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to export a single sheet as CSV
  const exportSingleProgressSheetCSV = (projectCode: string, projectName: string, date: string, records: Submission[]) => {
    const BOM = "\uFEFF";
    let csvContent = BOM + `"DAILY PROGRESS LOG SHEET - ${projectName.toUpperCase()}"\n`;
    csvContent += `"PROJECT CODE","${projectCode}"\n`;
    csvContent += `"DATE","${date}"\n\n`;
    
    csvContent += '"S/NO.","NAME OF ACTIVITY","% WORK COMPLETED (CUMULATIVE)","TARGET DATE","WORK COMPLETED TODAY","NO. LABOR / SUBCONTRACTOR","EQUIPMENT","REMARKS","PICTURES"\n';

    records.forEach((s, idx) => {
      const row = [
        (idx + 1).toString(),
        s.activityName || "",
        s.workCompletedPercent ? `${s.workCompletedPercent}%` : "0%",
        s.targetDate || "",
        s.workCompletedTodayPercent ? `+${s.workCompletedTodayPercent}%` : "",
        s.noOfLaborSubcontractor || "",
        s.equipment || "",
        s.remarks || "",
        s.images && s.images.length > 0 ? s.images.join(" | ") : ""
      ].map(val => {
        const clean = (val || "").replace(/"/g, '""');
        return `"${clean}"`;
      }).join(",");
      csvContent += row + "\n";
    });

    const totalLabors = records.reduce((acc, curr) => acc + parseInt(curr.noOfLaborSubcontractor || "0", 10), 0) || 0;
    csvContent += `"","TOTAL ACTIVITIES: ${records.length}","","","","TOTAL LABORS: ${totalLabors}","","",""\n`;

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Progress_Sheet_${projectCode}_${date}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotification("Export Successful", `CSV generated for Project ${projectCode} on ${date}.`, "success");
  };

  // Helper to export a single sheet as PDF
  const exportSingleProgressSheetPDF = async (projectCode: string, projectName: string, date: string, records: Submission[]) => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const autoTableFn = autoTableModule.default;

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      // Header Brand bar styling
      doc.setFillColor(15, 23, 42); // slate-900 (#0F172A)
      doc.rect(0, 0, 297, 40, "F");

      // Corporate Header Texts
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(14);
      doc.text("BIN LAHEJ GENERAL MAINTENANCE & CONTRACTING L.L.C", 15, 12);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text("DAILY ACTIVITY & PROGRESS MONITORING SHEET", 15, 20);
      
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(9);
      doc.text(`PROJECT: ${projectName.toUpperCase()}`, 15, 26);
      doc.text(`CODE: ${projectCode} | DATE: ${date}`, 15, 31);

      doc.setFont("Helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 36);

      const tableColumns = [
        "S/NO.",
        "NAME OF ACTIVITY",
        "% WORK COMPLETED (CUMULATIVE)",
        "TARGET DATE",
        "WORK COMPLETED TODAY",
        "NO. LABOR / SUBCONTRACTOR",
        "EQUIPMENT",
        "REMARKS",
        "PICTURES"
      ];

      const tableRows = records.map((s, idx) => [
        idx + 1,
        s.activityName || "-",
        s.workCompletedPercent ? `${s.workCompletedPercent}%` : "0%",
        s.targetDate || "-",
        s.workCompletedTodayPercent ? `+${s.workCompletedTodayPercent}%` : "-",
        s.noOfLaborSubcontractor || "-",
        s.equipment || "-",
        s.remarks || "-",
        "" // Empty space for drawings!
      ]);

      // Append total summary row
      const totalLabors = records.reduce((acc, curr) => acc + parseInt(curr.noOfLaborSubcontractor || "0", 10), 0) || 0;
      tableRows.push([
        "",
        "TOTAL ACTIVITIES: " + records.length,
        "",
        "",
        "",
        "TOTAL LABORS: " + totalLabors,
        "",
        "",
        ""
      ]);

      const tableOptions = {
        startY: 45,
        head: [tableColumns],
        body: tableRows,
        theme: "grid" as const,
        headStyles: {
          fillColor: [31, 78, 120] as [number, number, number], // #1F4E78 steel blue
          textColor: 255,
          fontSize: 8,
          fontStyle: "bold" as const,
          halign: "center" as const
        },
        bodyStyles: {
          fontSize: 8,
          textColor: 50
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] as [number, number, number] // slate-50
        },
        columnStyles: {
          0: { cellWidth: 10, halign: "center" as const }, // S/No.
          1: { cellWidth: 35, fontStyle: "bold" as const }, // Activity Name
          2: { cellWidth: 24, halign: "center" as const }, // Cumulative
          3: { cellWidth: 20, halign: "center" as const }, // Target Date
          4: { cellWidth: 22, halign: "center" as const }, // Today
          5: { cellWidth: 24, halign: "center" as const }, // Labor
          6: { cellWidth: 24 }, // Equipment
          7: { cellWidth: 28 },  // Remarks
          8: { cellWidth: 80 }  // Pictures (wide so images are larger and clear!)
        },
        styles: {
          cellPadding: 2.5,
          lineColor: [226, 232, 240] as [number, number, number], // slate-200
          lineWidth: 0.1,
          font: "Helvetica",
          valign: "middle" as const,
          overflow: "linebreak" as const
        },
        margin: { left: 15, right: 15 },
        didParseCell: (data: any) => {
          if (data.column.index === 8 && data.cell.section === "body") {
            const logEntry = records[data.row.index];
            if (logEntry?.images && logEntry.images.length > 0) {
              data.row.height = Math.max(data.row.height, 32); // Force taller row height (32mm) for larger images
            }
          }
        },
        didDrawCell: (data: any) => {
          if (data.column.index === 8 && data.cell.section === "body") {
            const logEntry = records[data.row.index];
            if (logEntry?.images && logEntry.images.length > 0) {
              const imgs = logEntry.images.slice(0, 3); // Draw up to 3 images to fit nicely
              const cellX = data.cell.x;
              const cellY = data.cell.y;
              const cellWidth = data.cell.width;
              const cellHeight = data.cell.height;

              // Size the images larger (e.g. 24mm x 24mm) for high visibility!
              const imgSize = 24; 
              const gap = 2;
              const totalWidth = imgs.length * imgSize + (imgs.length - 1) * gap;
              
              // Center the images horizontally within the cell
              let startX = cellX + (cellWidth - totalWidth) / 2;
              if (startX < cellX + 1) startX = cellX + 1; // Safeguard padding
              
              // Center vertically
              const startY = cellY + (cellHeight - imgSize) / 2;

              imgs.forEach((imgSrc, imgIdx) => {
                try {
                  // Ensure it's a valid string
                  if (typeof imgSrc === "string" && imgSrc.startsWith("data:image")) {
                    let format = "JPEG";
                    if (imgSrc.includes("png")) format = "PNG";
                    else if (imgSrc.includes("webp")) format = "WEBP";
                    
                    doc.addImage(
                      imgSrc,
                      format,
                      startX + imgIdx * (imgSize + gap),
                      startY,
                      imgSize,
                      imgSize
                    );
                  }
                } catch (e) {
                  console.error("Error rendering image in PDF", e);
                }
              });
            }
          }
        }
      };

      if (typeof autoTableFn === "function") {
        autoTableFn(doc, tableOptions);
      } else if (typeof (doc as any).autoTable === "function") {
        (doc as any).autoTable(tableOptions);
      } else {
        throw new Error("jsPDF AutoTable is not correctly initialized.");
      }

      doc.save(`Progress_Sheet_${projectCode}_${date}.pdf`);
      showNotification("Export Successful", `PDF generated for Project ${projectCode} on ${date}.`, "success");
    } catch (err) {
      console.error("Single sheet PDF generation failed:", err);
      showNotification("Export Failed", "Encountered an issue compiling the PDF document.", "error");
    }
  };

  // Handle saving an edited activity row in progress monitoring
  const handleSaveProgressEdit = async (id: string) => {
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editProgressForm),
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.createdNew) {
          setSubmissions(prev => [data.entry, ...prev]);
          showNotification("New Entry Saved", "A new progress record was created for the updated date. Original historical record remains unchanged.", "success");
        } else {
          setSubmissions(prev => prev.map(s => s.id === id ? data.entry : s));
          showNotification("Record Updated", "The activity progress entry was updated successfully.", "success");
        }
        
        setEditingProgressId(null);
        
        // Also update open viewing sheet records if viewing
        if (viewingProgressSheet && viewingProgressSheet.isOpen) {
          setViewingProgressSheet(prev => {
            if (!prev) return null;
            if (data.createdNew) {
              return {
                ...prev,
                records: [data.entry, ...prev.records]
              };
            }
            return {
              ...prev,
              records: prev.records.map(r => r.id === id ? data.entry : r)
            };
          });
        }
      } else {
        const err = await res.json();
        showNotification("Update Failed", err.error || "Could not update the record.", "error");
      }
    } catch (error) {
      console.error("Failed to update progress monitoring record:", error);
      showNotification("Update Failed", "A network error occurred while updating the record.", "error");
    }
  };

  // Handle saving an edited record in the engineer portal
  const handleSaveEngineerRecord = async (id: string) => {
    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editEngineerForm),
      });

      if (res.ok) {
        const data = await res.json();
        
        if (data.createdNew) {
          setSubmissions(prev => [data.entry, ...prev]);
          showNotification("New Entry Saved", "Your daily activity progress has been logged as a new entry. The original historical record remains unchanged.", "success");
        } else {
          setSubmissions(prev => prev.map(s => s.id === id ? data.entry : s));
          showNotification("Record Updated", "Your daily activity progress record has been successfully updated.", "success");
        }
        
        setEditingEngineerRecordId(null);
        
        // Also update open viewing sheet records if viewing
        if (viewingProgressSheet && viewingProgressSheet.isOpen) {
          setViewingProgressSheet(prev => {
            if (!prev) return null;
            if (data.createdNew) {
              return {
                ...prev,
                records: [data.entry, ...prev.records]
              };
            }
            return {
              ...prev,
              records: prev.records.map(r => r.id === id ? data.entry : r)
            };
          });
        }
        // Also update ledger files if needed
        fetchLedgerFiles();
      } else {
        const err = await res.json();
        showNotification("Update Failed", err.error || "Could not update the record.", "error");
      }
    } catch (error) {
      console.error("Failed to update engineer progress record:", error);
      showNotification("Update Failed", "A network error occurred while updating the record.", "error");
    }
  };

  // Handle adding a completely new activity in the engineer portal
  const handleAddNewActivity = async () => {
    if (!newActivityForm.project.trim()) {
      setAddActivityError("Please select/specify the Project Code.");
      return;
    }
    if (!newActivityForm.date) {
      setAddActivityError("Please specify the Log Date.");
      return;
    }
    if (!newActivityForm.activityName.trim()) {
      setAddActivityError("Please specify the Name of Activity.");
      return;
    }

    setAddActivityError("");
    setIsAddingActivitySubmitting(true);

    try {
      const payload = {
        date: newActivityForm.date,
        project: newActivityForm.project.trim().toUpperCase(),
        projectLocation: newActivityForm.projectLocation.trim().toUpperCase(),
        siteEngineer: (portalSelectedEngineer || "").trim().toUpperCase(),
        laborsName: "",
        designation: "",
        reassignedTask: "",
        attendanceStatus: "Present",
        activityName: newActivityForm.activityName.trim().toUpperCase(),
        workCompletedPercent: newActivityForm.workCompletedPercent.trim(),
        targetDate: newActivityForm.targetDate.trim(),
        workCompletedTodayPercent: newActivityForm.workCompletedTodayPercent.trim(),
        noOfLaborSubcontractor: newActivityForm.noOfLaborSubcontractor.trim(),
        equipment: newActivityForm.equipment.trim().toUpperCase(),
        remarks: newActivityForm.remarks.trim().toUpperCase(),
        images: engineerFormImages,
      };

      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await fetchSubmissions();
        await fetchLedgerFiles();

        setIsAddingActivity(false);
        setEngineerFormImages([]); // Clear uploaded pictures
        setNewActivityForm({
          project: engineerPortalActiveProject === "ALL" ? "" : engineerPortalActiveProject,
          projectLocation: engineerPortalActiveProject === "ALL" ? "" : (newActivityForm.projectLocation),
          date: new Date().toISOString().split("T")[0],
          activityName: "",
          workCompletedPercent: "",
          targetDate: "",
          workCompletedTodayPercent: "",
          noOfLaborSubcontractor: "",
          equipment: "",
          remarks: ""
        });

        showNotification("Activity Added", "A new activity record has been successfully logged under your name.", "success");
      } else {
        const errData = await res.json();
        setAddActivityError(errData.error || "Failed to add activity. Please try again.");
      }
    } catch (err) {
      console.error("Error adding activity:", err);
      setAddActivityError("Network error. Could not connect to the database.");
    } finally {
      setIsAddingActivitySubmitting(false);
    }
  };

  // Dedicated PDF Exporter for Daily Activity & Progress Monitoring Logs
  const exportMonitoringPDF = async (filteredLogs: Submission[]) => {
    try {
      const { jsPDF } = await import("jspdf");
      const autoTableModule = await import("jspdf-autotable");
      const autoTableFn = autoTableModule.default;

      const doc = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4"
      });

      // Header Brand bar styling
      doc.setFillColor(15, 23, 42); // slate-900 (#0F172A)
      doc.rect(0, 0, 297, 40, "F");

      // Corporate Header Texts
      doc.setTextColor(255, 255, 255);
      doc.setFont("Helvetica", "bold");
      doc.setFontSize(15);
      doc.text("BIN LAHEJ GENERAL MAINTENANCE & CONTRACTING L.L.C", 15, 14);

      doc.setFont("Helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(203, 213, 225); // slate-300
      doc.text("DAILY ACTIVITY & PROGRESS MONITORING REPORT", 15, 22);
      doc.text("DOCUMENT CONTROLLER SECURE MONITORING DATABASE", 15, 27);

      doc.setFont("Helvetica", "italic");
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184); // slate-400
      doc.text(`Generated on: ${new Date().toLocaleString()}`, 15, 33);
      doc.text(`Total Monitored Records: ${filteredLogs.length}`, 220, 33);

      const tableColumns = [
        "DATE",
        "PROJECT",
        "SITE ENGINEER",
        "ACTIVITY NAME",
        "TARGET DATE",
        "CUMULATIVE %",
        "TODAY %",
        "LABORS",
        "EQUIPMENT",
        "REMARKS",
        "PICTURES"
      ];

      const tableRows = filteredLogs.map((s) => [
        s.date || "-",
        s.project || "-",
        s.siteEngineer || "-",
        s.activityName || "-",
        s.targetDate || "-",
        s.workCompletedPercent ? `${s.workCompletedPercent}%` : "-",
        s.workCompletedTodayPercent ? `${s.workCompletedTodayPercent}%` : "-",
        s.noOfLaborSubcontractor || "-",
        s.equipment || "-",
        s.remarks || "-",
        "" // Leave empty space for drawings!
      ]);

      const tableOptions = {
        head: [tableColumns],
        body: tableRows,
        startY: 46,
        theme: "striped" as const,
        headStyles: {
          fillColor: [15, 23, 42] as [number, number, number], // slate-900 (#0F172A)
          textColor: [255, 255, 255] as [number, number, number],
          fontSize: 8,
          fontStyle: "bold" as const,
          halign: "left" as const
        },
        bodyStyles: {
          fontSize: 8,
          textColor: [51, 65, 85] as [number, number, number] // slate-700
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252] as [number, number, number] // slate-50
        },
        columnStyles: {
          0: { cellWidth: 15 }, // Date
          1: { cellWidth: 18 }, // Project
          2: { cellWidth: 22 }, // Site Eng
          3: { cellWidth: 32 }, // Activity
          4: { cellWidth: 18 }, // Target Date
          5: { cellWidth: 14 }, // Cumulative %
          6: { cellWidth: 14 }, // Today %
          7: { cellWidth: 12 }, // Labors
          8: { cellWidth: 22 }, // Equipment
          9: { cellWidth: 28 }, // Remarks
          10: { cellWidth: 82 } // Pictures (wide so images are larger!)
        },
        styles: {
          cellPadding: 2.5,
          lineColor: [226, 232, 240] as [number, number, number], // slate-200
          lineWidth: 0.1,
          font: "Helvetica",
          valign: "middle" as const,
          overflow: "linebreak" as const
        },
        margin: { left: 10, right: 10 },
        didParseCell: (data: any) => {
          if (data.column.index === 10 && data.cell.section === "body") {
            const logEntry = filteredLogs[data.row.index];
            if (logEntry?.images && logEntry.images.length > 0) {
              data.row.height = Math.max(data.row.height, 32); // Force taller row height (32mm) for larger images
            }
          }
        },
        didDrawCell: (data: any) => {
          if (data.column.index === 10 && data.cell.section === "body") {
            const logEntry = filteredLogs[data.row.index];
            if (logEntry?.images && logEntry.images.length > 0) {
              const imgs = logEntry.images.slice(0, 3); // Draw up to 3 images to fit nicely
              const cellX = data.cell.x;
              const cellY = data.cell.y;
              const cellWidth = data.cell.width;
              const cellHeight = data.cell.height;

              // Size the images larger (e.g. 24mm x 24mm) for high visibility!
              const imgSize = 24; 
              const gap = 2;
              const totalWidth = imgs.length * imgSize + (imgs.length - 1) * gap;
              
              // Center the images horizontally within the cell
              let startX = cellX + (cellWidth - totalWidth) / 2;
              if (startX < cellX + 1) startX = cellX + 1; // Safeguard padding
              
              // Center vertically
              const startY = cellY + (cellHeight - imgSize) / 2;

              imgs.forEach((imgSrc, imgIdx) => {
                try {
                  // Ensure it's a valid string
                  if (typeof imgSrc === "string" && imgSrc.startsWith("data:image")) {
                    let format = "JPEG";
                    if (imgSrc.includes("png")) format = "PNG";
                    else if (imgSrc.includes("webp")) format = "WEBP";
                    
                    doc.addImage(
                      imgSrc,
                      format,
                      startX + imgIdx * (imgSize + gap),
                      startY,
                      imgSize,
                      imgSize
                    );
                  }
                } catch (e) {
                  console.error("Error rendering image in PDF", e);
                }
              });
            }
          }
        }
      };

      if (typeof autoTableFn === "function") {
        autoTableFn(doc, tableOptions);
      } else if (typeof (doc as any).autoTable === "function") {
        (doc as any).autoTable(tableOptions);
      } else {
        throw new Error("jsPDF AutoTable is not correctly initialized.");
      }

      doc.save(`daily_activity_monitoring_report_${new Date().toISOString().split("T")[0]}.pdf`);
    } catch (err) {
      console.error("Failed to export PDF:", err);
      alert("Error generating PDF document.");
    }
  };

  // Pre-fill helper
  const quickSetField = (field: "project" | "projectLocation" | "siteEngineer", value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Log calculation properties (Filter out progress monitoring records from Labor Attendance)
  const filteredSubmissions = submissions.filter(s => {
    const hasLaborName = !!(s.laborsName && s.laborsName.trim());
    if (!hasLaborName) return false;

    const matchesSearch = 
      s.laborsName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.siteEngineer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.designation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProject = selectedProjectFilter === "ALL" || s.project === selectedProjectFilter;
    const matchesDesignation = selectedDesignationFilter === "ALL" || s.designation === selectedDesignationFilter;

    return matchesSearch && matchesProject && matchesDesignation;
  });

  // Extract unique active projects & designations for sidebar filter dropdowns (only for Labor Attendance)
  const uniqueProjects = Array.from(new Set(
    submissions
      .filter(s => s.laborsName && s.laborsName.trim() && s.project && s.project.trim())
      .map(s => s.project)
  ));
  const uniqueDesignations = Array.from(new Set(
    submissions
      .filter(s => s.laborsName && s.laborsName.trim() && s.designation && s.designation.trim())
      .map(s => s.designation)
  ));

  // Grouped stats for admin visualization cards (Labor Attendance only)
  const totalLoggedWorkers = submissions.filter(s => s.laborsName && s.laborsName.trim()).length;
  
  // Stats - Project and task distribution counts
  const projectCounts: { [key: string]: number } = {};
  const designationCounts: { [key: string]: number } = {};
  submissions.filter(s => s.laborsName && s.laborsName.trim()).forEach(s => {
    projectCounts[s.project] = (projectCounts[s.project] || 0) + 1;
    designationCounts[s.designation] = (designationCounts[s.designation] || 0) + 1;
  });

  return (
    <div className="min-h-screen flex flex-col font-sans bg-[#F1F5F9] antialiased selection:bg-slate-200">
      
      {/* Top Utility Access Switcher */}
      <div className="bg-[#0F172A] text-slate-400 py-2.5 px-6 text-xs font-mono border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-slate-400 animate-pulse"></span>
            <span className="text-slate-300 tracking-wider">MONITORING SYSTEM • DOCUMENT CONTROLLER</span>
          </div>
          <div className="flex items-center gap-4">
            {currentView === "form" ? (
              <button 
                id="view-admin-btn"
                onClick={() => setCurrentView("admin")}
                className="flex items-center gap-1.5 hover:text-white transition-colors duration-200 cursor-pointer text-slate-300 font-medium"
              >
                <Lock className="h-3.5 w-3.5 text-slate-400" /> Document Controller Database View
              </button>
            ) : (
              <button 
                id="view-form-btn"
                onClick={() => setCurrentView("form")}
                className="flex items-center gap-1.5 hover:text-white transition-colors duration-200 cursor-pointer text-slate-300 font-medium"
              >
                <PlusCircle className="h-3.5 w-3.5 text-slate-400" /> Back to Blank Logging Form
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Clean Minimalism Branded Header */}
      <header id="brand-header" className="bg-white text-slate-900 border-b border-slate-200/60 shadow-sm">
        <div className="max-w-7xl mx-auto px-6 py-6 flex flex-col lg:flex-row items-center justify-between gap-4">
          <div className="flex flex-col text-center lg:text-left">
            <h1 className="text-2xl md:text-3xl font-semibold tracking-tight text-[#0F172A] pb-1 font-display uppercase">
              LABOR DESIGNATION & MONITORING SYSTEM
            </h1>
            <p className="text-xs text-slate-500 mt-1 uppercase tracking-widest font-mono">
              Bin Lahej General Maintenance & Contracting LLC • DOCUMENT CONTROLLER LOGGING PORTAL
            </p>
          </div>
                 {/* Recreated Logo Element following Clean Minimalism aesthetic with Custom BG Options */}
          <div className="flex flex-col sm:items-end gap-2 w-full max-w-sm lg:w-auto">
            <div className={`transition-all duration-300 rounded-2xl p-4 flex items-center select-none border shadow-xs ${LOGO_BG_PRESETS[logoBg]?.containerClass || LOGO_BG_PRESETS.slate.containerClass}`}>
              {/* Minimalist Architectural Graphic Mark */}
              <div className="flex-shrink-0 mr-4 relative flex items-center justify-center w-12 h-12">
                {/* Thin overlapping rotated squares for premium construction motif */}
                <div className={`absolute inset-1 border rounded-lg transform rotate-6 transition-colors duration-300 ${logoBg === "dark" ? "border-slate-700" : "border-slate-200"}`}></div>
                <div className={`absolute inset-1 border rounded-lg transform -rotate-12 transition-colors duration-300 ${logoBg === "dark" ? "border-slate-500" : "border-slate-300"}`}></div>
                <div className="relative text-center leading-none">
                  <span className={`text-[13px] font-black tracking-tight ${LOGO_BG_PRESETS[logoBg]?.titleClass}`}>B</span>
                  <span className={`text-[12px] font-light ${LOGO_BG_PRESETS[logoBg]?.subClass}`}>L</span>
                </div>
              </div>

              {/* Vertical line divider */}
              <div className={`h-11 w-[1px] ${LOGO_BG_PRESETS[logoBg]?.lineClass} mr-4 transition-colors duration-300`}></div>

              {/* Typography block */}
              <div className="flex flex-col">
                <div className="flex items-baseline gap-1">
                  <span className={`font-black text-sm tracking-widest uppercase font-sans ${LOGO_BG_PRESETS[logoBg]?.titleClass}`}>
                    BIN LAHEJ
                  </span>
                  <span className="text-[8px] tracking-wider uppercase font-light text-slate-400 font-mono">
                    Est.1993
                  </span>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-tight leading-none ${LOGO_BG_PRESETS[logoBg]?.subClass}`}>
                  General Maintenance &amp; Contracting
                </span>
                
                {/* Slim divider */}
                <div className={`w-full h-[1px] ${LOGO_BG_PRESETS[logoBg]?.lineClass} my-1.5 transition-colors duration-300`}></div>
                
                <span className={`text-[8px] font-bold uppercase tracking-widest text-[#94A3B8] font-sans ${logoBg === "dark" ? "text-slate-500" : "text-slate-400"}`}>
                  بن لاحج للصيانة العامة والمقاولات
                </span>
              </div>
            </div>

            {/* Micro Customizer Control Panel */}
            <div className="flex items-center justify-center lg:justify-end gap-2.5 px-2">
              <span className="text-[9px] text-slate-400 font-mono font-medium tracking-wider flex items-center gap-1">
                <Palette className="h-3 w-3 text-slate-400" /> LOGO BG:
              </span>
              <div className="flex items-center gap-1.5 bg-white py-1 px-2 rounded-full border border-slate-200/60 shadow-2xs">
                {Object.keys(LOGO_BG_PRESETS).map((key) => {
                  const preset = LOGO_BG_PRESETS[key];
                  const isActive = logoBg === key;
                  return (
                    <button
                      key={key}
                      onClick={() => handleLogoBgChange(key)}
                      title={preset.name}
                      className={`w-3.5 h-3.5 rounded-full cursor-pointer transition-all duration-150 relative flex items-center justify-center border ${
                        isActive ? "scale-125 border-slate-900 ring-2 ring-slate-900/10" : "border-slate-300 hover:scale-110"
                      }`}
                      style={{ backgroundColor: preset.colorHex }}
                    >
                      {isActive && (
                        <span className={`w-1 h-1 rounded-full ${key === "dark" ? "bg-white" : "bg-slate-900"}`}></span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 lg:p-8">
        
        {/* PUBLIC FORM VIEW */}
        {currentView === "form" && (
          <div id="form-container" className="max-w-5xl mx-auto bg-white rounded-3xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.02)] border border-slate-200/60 overflow-hidden">
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-slate-700" />
                <h2 className="font-bold text-slate-800 uppercase tracking-wider text-sm font-sans">
                  {activeFormTab === "attendance" ? "Daily Labor Attendance Form" : "Daily Progress Monitoring Form"}
                </h2>
              </div>
              
              {/* Form Selection Tabs */}
              <div className="flex items-center gap-1 bg-slate-200/60 p-1 rounded-xl">
                <button
                  id="tab-btn-attendance"
                  type="button"
                  onClick={() => {
                    setActiveFormTab("attendance");
                    setSubmitSuccess(false);
                    setSubmitError("");
                  }}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer ${
                    activeFormTab === "attendance"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Labor Attendance
                </button>
                <button
                  id="tab-btn-monitoring"
                  type="button"
                  onClick={() => {
                    setActiveFormTab("monitoring");
                    setSubmitSuccess(false);
                    setSubmitError("");
                  }}
                  className={`px-4 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg transition-all duration-150 cursor-pointer ${
                    activeFormTab === "monitoring"
                      ? "bg-slate-900 text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  Progress Monitoring
                </button>
              </div>
            </div>

            <div className="p-6 md:p-10">
              {submitSuccess ? (
                <div id="success-panel" className="py-12 text-center flex flex-col items-center justify-center animate-fade-in">
                  <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full mb-4">
                    <CheckCircle2 className="h-16 w-16" />
                  </div>
                  <h3 className="text-2xl font-bold font-display text-emerald-800">Record Saved Successfully!</h3>
                  <p className="text-slate-600 mt-2 max-w-md text-sm">
                    {activeFormTab === "attendance" ? (
                      <>
                        The labor entry for <strong className="text-slate-900 font-mono text-lg bg-slate-100 px-2 py-0.5 rounded">{lastSubmittedName}</strong> has been secured in your private database.
                      </>
                    ) : (
                      <>
                        The daily activity monitoring details for <strong className="text-slate-900 font-mono text-lg bg-slate-100 px-2 py-0.5 rounded">{lastSubmittedName}</strong> have been secured in your private database.
                      </>
                    )}
                  </p>
                  
                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <button
                      id="log-another-btn"
                      onClick={() => setSubmitSuccess(false)}
                      className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-slate-900 hover:bg-slate-800 shadow-sm focus:outline-none cursor-pointer transition-all duration-200"
                    >
                      {activeFormTab === "attendance" ? "Log Another Labor Record" : "Log Another Progress Record"}
                    </button>
                  </div>
                </div>
              ) : (
                <form id="labor-fill-form" onSubmit={handleFormSubmit} className="space-y-6">
                  {submitError && (
                    <div className="bg-rose-50 border-l-4 border-rose-500 p-4 rounded text-sm text-rose-700 flex items-start gap-2">
                      <AlertCircle className="h-5 w-5 flex-shrink-0 text-rose-500" />
                      <span>{submitError}</span>
                    </div>
                  )}

                  <p className="text-xs text-slate-400 pb-4 border-b border-slate-100">
                    Provide accurate details. All entries are instantly secured in the document controller ledger, restricted exclusively to authorized personnel.
                  </p>

                  {/* SECTION 1: GENERAL METADATA HEADER (SHARED BY BOTH FORMS) */}
                  <div className="bg-slate-50/55 p-5 rounded-2xl border border-slate-100 space-y-4">
                    <h3 className="text-2xs font-bold text-slate-400 tracking-wider uppercase flex items-center gap-1.5 mb-2">
                      <Layers className="h-3.5 w-3.5 text-slate-400" /> General Info Headers
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* DATE */}
                      <div className="flex flex-col">
                        <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                          <Calendar className="h-3.5 w-3.5 text-slate-400" /> Date of Log
                        </label>
                        <input
                          id="input-date"
                          type="date"
                          required
                          value={formData.date}
                          onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                          className="w-full bg-white border border-slate-200 rounded-xl py-2.5 px-3.5 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-medium text-slate-800 transition-all"
                        />
                      </div>

                      {/* PROJECT */}
                      <SearchableDropdown
                        id="select-project"
                        label="Project Code"
                        icon={<Briefcase className="h-3.5 w-3.5 text-slate-400" />}
                        placeholder="Search or enter Project Code..."
                        options={(projectCodes.length > 0 ? projectCodes : DEFAULT_PROJECT_CODES).map(pc => ({
                          value: pc.code,
                          label: pc.name,
                          sublabel: pc.location
                        }))}
                        value={formData.project}
                        onChange={(val) => handleProjectCodeChange(val)}
                        required
                        allowCustom
                        containerId="select-project-container"
                        onlyDisplayValue
                      />

                      {/* PROJECT LOCATION */}
                      <div className="flex flex-col">
                        <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" /> Site Location
                        </label>
                        <input
                          id="input-location"
                          type="text"
                          placeholder={(projectCodes.length > 0 ? projectCodes : DEFAULT_PROJECT_CODES).some(pc => pc.code.toUpperCase() === formData.project.toUpperCase().trim()) ? "Auto-filled from Project Code" : "Enter Site Location..."}
                          value={formData.projectLocation}
                          onChange={(e) => setFormData(prev => ({ ...prev, projectLocation: e.target.value }))}
                          readOnly={(projectCodes.length > 0 ? projectCodes : DEFAULT_PROJECT_CODES).some(pc => pc.code.toUpperCase() === formData.project.toUpperCase().trim())}
                          className={`w-full border border-slate-200 rounded-xl py-2.5 px-3.5 focus:outline-none text-sm font-semibold transition-all uppercase ${
                            (projectCodes.length > 0 ? projectCodes : DEFAULT_PROJECT_CODES).some(pc => pc.code.toUpperCase() === formData.project.toUpperCase().trim())
                              ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200" 
                              : "bg-white text-slate-800 focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700"
                          }`}
                        />
                      </div>

                      {/* SITE ENGINEER */}
                      <SearchableDropdown
                        id="select-engineer"
                        label="Assigned Site Engineer"
                        icon={<UserCheck className="h-3.5 w-3.5 text-slate-400" />}
                        placeholder="Search or enter Site Engineer..."
                        options={COMMON_ENGINEERS.map((eng) => ({
                          value: eng,
                          label: eng
                        }))}
                        value={formData.siteEngineer}
                        onChange={(val) => setFormData(prev => ({ ...prev, siteEngineer: val }))}
                        required
                        allowCustom
                        containerId="select-engineer-container"
                      />
                    </div>
                  </div>

                  {/* SECTION 2: FORM DEPENDENT FIELDS */}
                  {activeFormTab === "attendance" ? (
                    /* LABOR ATTENDANCE FORM FIELDS */
                    <div className="space-y-6 animate-fade-in">
                      <div className="border-b border-slate-100 pb-2">
                        <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <HardHat className="h-4 w-4 text-slate-600" /> Labor Attendance Log
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* LABOR CODE */}
                        <div className="space-y-1">
                          <SearchableDropdown
                            id="select-labor-code"
                            label="Select Labor Code"
                            icon={<Key className="h-3.5 w-3.5 text-slate-400" />}
                            placeholder="Search or enter Labor Code..."
                            options={(laborCodes.length > 0 ? laborCodes : DEFAULT_LABOR_CODES).map(lc => ({
                              value: lc.code,
                              label: lc.name
                            }))}
                            value={formData.laborCode}
                            onChange={(val) => handleLaborCodeChange(val)}
                            required
                            allowCustom
                            containerId="select-labor-code-container"
                            onlyDisplayValue
                          />
                          {formData.laborCode && (
                            <div className="mt-2 text-right">
                              {matchedLaborName ? (
                                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold font-mono">
                                  ✓ {matchedLaborName} MATCHED
                                </span>
                              ) : (
                                <span className="text-[10px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-bold font-mono">
                                  NO MATCH
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        {/* LABOR'S NAME */}
                        <div className="flex flex-col">
                          <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                            <User className="h-3.5 w-3.5 text-slate-400" /> Labor's Full Name
                          </label>
                          <input
                            id="input-labors-name"
                            type="text"
                            placeholder={matchedLaborName ? "Auto-filled from Labor Code" : "Enter Labor's Full Name..."}
                            value={formData.laborsName}
                            onChange={(e) => setFormData(prev => ({ ...prev, laborsName: e.target.value }))}
                            readOnly={!!matchedLaborName}
                            className={`w-full border border-slate-200 rounded-xl py-2.5 px-3.5 focus:outline-none text-sm font-semibold transition-all uppercase ${
                              matchedLaborName
                                ? "bg-slate-100 text-slate-500 cursor-not-allowed border-slate-200"
                                : "bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700"
                            }`}
                          />
                        </div>

                        {/* DESIGNATION */}
                        <SearchableDropdown
                          id="select-designation"
                          label="Designation / Trade"
                          icon={<HardHat className="h-3.5 w-3.5 text-slate-400" />}
                          placeholder="Search or enter custom designation..."
                          options={DESIGNATIONS.map(role => ({
                            value: role,
                            label: role
                          }))}
                          value={formData.designation === "OTHER" ? formData.customDesignation : formData.designation}
                          onChange={(val) => handleDesignationChange(val)}
                          required
                          allowCustom
                          containerId="select-designation-container"
                        />

                        {/* REASSIGNED TASK */}
                        <SearchableDropdown
                          id="select-reassigned"
                          label="Active Assigned Task"
                          icon={<ClipboardCheck className="h-3.5 w-3.5 text-slate-400" />}
                          placeholder="Search or enter custom task..."
                          options={COMMON_TASKS.map(task => ({
                            value: task,
                            label: task
                          }))}
                          value={formData.reassignedTask === "OTHER" ? formData.customReassignedTask : formData.reassignedTask}
                          onChange={(val) => handleTaskChange(val)}
                          required
                          allowCustom
                          containerId="select-reassigned-container"
                        />
                      </div>

                      {/* ATTENDANCE STATUS SECTION */}
                      <div className="pt-4 border-t border-slate-100">
                        <label className="block text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-3 flex items-center gap-1.5">
                          <UserCheck className="h-3.5 w-3.5 text-slate-400" /> Labor Attendance Status
                        </label>
                        <div id="attendance-status-selector" className="grid grid-cols-3 gap-4 max-w-lg">
                          <button
                            id="attendance-btn-present"
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, attendanceStatus: "Present" }))}
                            className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-2 ${
                              formData.attendanceStatus === "Present"
                                ? "bg-emerald-600 text-white border-emerald-600 shadow-sm shadow-emerald-100"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <span className={`h-2 w-2 rounded-full ${formData.attendanceStatus === "Present" ? "bg-white" : "bg-emerald-500"}`}></span>
                            Present
                          </button>

                          <button
                            id="attendance-btn-absent"
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, attendanceStatus: "Absent" }))}
                            className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-2 ${
                              formData.attendanceStatus === "Absent"
                                ? "bg-rose-600 text-white border-rose-600 shadow-sm shadow-rose-100"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <span className={`h-2 w-2 rounded-full ${formData.attendanceStatus === "Absent" ? "bg-white" : "bg-rose-500"}`}></span>
                            Absent
                          </button>

                          <button
                            id="attendance-btn-undertime"
                            type="button"
                            onClick={() => setFormData(prev => ({ ...prev, attendanceStatus: "Under Time" }))}
                            className={`py-3 px-4 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all duration-200 cursor-pointer flex flex-col sm:flex-row items-center justify-center gap-2 ${
                              formData.attendanceStatus === "Under Time"
                                ? "bg-amber-600 text-white border-amber-600 shadow-sm shadow-amber-100"
                                : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100 hover:text-slate-900"
                            }`}
                          >
                            <span className={`h-2 w-2 rounded-full ${formData.attendanceStatus === "Under Time" ? "bg-white" : "bg-amber-500"}`}></span>
                            Under Time
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* DAILY ACTIVITY & PROGRESS MONITORING FORM FIELDS */
                    <div className="space-y-6 animate-fade-in">
                      <div className="border-b border-slate-100 pb-2">
                        <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                          <ClipboardCheck className="h-4 w-4 text-slate-600" /> Daily Activity & Progress Monitoring
                        </h3>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Name of Activity */}
                        <div className="flex flex-col">
                          <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                            <Layers className="h-3.5 w-3.5 text-slate-400" /> Name of Activity
                          </label>
                          <input
                            id="input-activity-name"
                            type="text"
                            required
                            placeholder="e.g. CONCRETING WORKS..."
                            value={formData.activityName}
                            onChange={(e) => setFormData(prev => ({ ...prev, activityName: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-semibold text-slate-800 transition-all uppercase"
                          />
                        </div>

                        {/* % Work Completed */}
                        <div className="flex flex-col">
                          <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" /> % Work Completed (Cumulative)
                          </label>
                          <div className="relative">
                            <input
                              id="input-work-completed"
                              type="text"
                              placeholder="e.g. 75"
                              value={formData.workCompletedPercent}
                              onChange={(e) => setFormData(prev => ({ ...prev, workCompletedPercent: e.target.value }))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-8 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-semibold text-slate-800 transition-all"
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                          </div>
                        </div>

                        {/* Target Date */}
                        <div className="flex flex-col">
                          <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" /> Target Date
                          </label>
                          <input
                            id="input-target-date"
                            type="date"
                            value={formData.targetDate}
                            onChange={(e) => setFormData(prev => ({ ...prev, targetDate: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-semibold text-slate-800 transition-all"
                          />
                        </div>

                        {/* % Work Completed Today */}
                        <div className="flex flex-col">
                          <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" /> % Work Completed Today
                          </label>
                          <div className="relative">
                            <input
                              id="input-completed-today"
                              type="text"
                              placeholder="e.g. 5"
                              value={formData.workCompletedTodayPercent}
                              onChange={(e) => setFormData(prev => ({ ...prev, workCompletedTodayPercent: e.target.value }))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-8 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-semibold text-slate-800 transition-all"
                            />
                            <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-xs">%</span>
                          </div>
                        </div>

                        {/* No. of Labor / Sub-Contractor */}
                        <div className="flex flex-col">
                          <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-slate-400" /> No. of Labor / Sub-Contractor
                          </label>
                          <input
                            id="input-no-of-labor"
                            type="text"
                            placeholder="e.g. 12"
                            value={formData.noOfLaborSubcontractor}
                            onChange={(e) => setFormData(prev => ({ ...prev, noOfLaborSubcontractor: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-semibold text-slate-800 transition-all"
                          />
                        </div>

                        {/* Equipment */}
                        <div className="flex flex-col">
                          <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                            <Wrench className="h-3.5 w-3.5 text-slate-400" /> Equipment
                          </label>
                          <input
                            id="input-equipment"
                            type="text"
                            placeholder="e.g. CONCRETE MIXER, JACKHAMMER..."
                            value={formData.equipment}
                            onChange={(e) => setFormData(prev => ({ ...prev, equipment: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-semibold text-slate-800 transition-all uppercase"
                          />
                        </div>

                        {/* Remarks */}
                        <div className="flex flex-col md:col-span-2 lg:col-span-3">
                          <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                            <FileText className="h-3.5 w-3.5 text-slate-400" /> Remarks / Notes
                          </label>
                          <input
                            id="input-remarks"
                            type="text"
                            placeholder="e.g. WORK COMPLETED ACCORDING TO SPECIFICATIONS..."
                            value={formData.remarks}
                            onChange={(e) => setFormData(prev => ({ ...prev, remarks: e.target.value }))}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-semibold text-slate-800 transition-all uppercase"
                          />
                        </div>

                        {/* Picture Upload Area */}
                        <div className="flex flex-col md:col-span-2 lg:col-span-3 mt-2">
                          <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                            <PlusCircle className="h-3.5 w-3.5 text-slate-400" /> Activity Pictures / Attachments
                          </label>
                          <div className="bg-slate-50 border-2 border-dashed border-slate-200 hover:border-slate-300 transition-all rounded-xl p-6 flex flex-col items-center justify-center relative cursor-pointer group">
                            <input
                              type="file"
                              multiple
                              accept="image/*"
                              onChange={async (e) => {
                                const files = e.target.files;
                                if (files) {
                                  const promises = Array.from(files).map((file: any) => compressImage(file));
                                  try {
                                    const base64Images = await Promise.all(promises);
                                    setFormImages(prev => [...prev, ...base64Images]);
                                  } catch (err) {
                                    console.error("Image compression failed", err);
                                  }
                                }
                              }}
                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                            />
                            <div className="flex flex-col items-center justify-center text-center pointer-events-none">
                              <div className="bg-white p-2 rounded-full shadow-xs border border-slate-100 mb-2 group-hover:scale-105 transition-transform">
                                <Plus className="h-4 w-4 text-slate-500" />
                              </div>
                              <p className="text-xs font-bold text-slate-700 uppercase tracking-wider">Drag & drop or Click to Upload Pictures</p>
                              <p className="text-[9px] font-mono text-slate-400 mt-0.5">JPEG, PNG files are automatically resized & compressed</p>
                            </div>
                          </div>

                          {formImages.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-3 mt-4 p-3 bg-slate-50/50 rounded-xl border border-slate-150">
                              {formImages.map((img, index) => (
                                <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-2xs group bg-white">
                                  <img 
                                    src={img} 
                                    alt={`Attachment ${index + 1}`} 
                                    className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                    onClick={() => setLightbox({ isOpen: true, images: formImages, activeIndex: index, title: "Uploaded Activity Picture" })}
                                    referrerPolicy="no-referrer"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => setFormImages(prev => prev.filter((_, i) => i !== index))}
                                    className="absolute top-1 right-1 bg-slate-900/80 hover:bg-rose-600 p-1 rounded-full text-white transition-colors shadow-sm cursor-pointer z-20"
                                  >
                                    <X className="h-3 w-3" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* SUBMIT BLOCK */}
                  <div className="pt-8 border-t border-slate-100 flex flex-col items-center">
                    <button
                      id="submit-form-btn"
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:w-64 inline-flex items-center justify-center py-3.5 px-6 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase rounded-xl shadow-sm text-xs tracking-widest cursor-pointer disabled:opacity-50 transition-colors duration-150"
                    >
                      {isSubmitting ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin text-white" />
                          Saving...
                        </>
                      ) : (
                        "SAVE RECORD"
                      )}
                    </button>
                    <span className="text-[10px] text-slate-400 mt-2.5 font-mono">
                      Log sheet commits straight to the local container secure database.
                    </span>
                  </div>

                </form>
              )}

              {/* ENGINEER Dedicated PORTAL BUTTON */}
              {activeFormTab === "monitoring" && formData.siteEngineer && formData.siteEngineer.trim() && (
                <div className="mt-8 pt-6 border-t border-slate-150 animate-fade-in">
                  <div className="bg-slate-50 border border-slate-200/80 rounded-2xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-slate-850 uppercase tracking-wider flex items-center gap-1.5">
                        <span className="inline-flex h-2 w-2 rounded-full bg-indigo-500"></span>
                        Engineer Dedicated Access Portal
                      </h4>
                      <p className="text-[11px] text-slate-500 font-medium">
                        Access, edit, and update previously saved activity progress records for <strong className="text-indigo-600 font-semibold uppercase">{formData.siteEngineer}</strong>.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setPortalSelectedEngineer(formData.siteEngineer);
                        setIsEngineerPortalOpen(true);
                        setEditingEngineerRecordId(null); // Reset any current edits
                        setEngineerPortalActiveProject("ALL"); // Reset project filter
                        setEngineerPortalMobileView("projects"); // Reset mobile view to project list
                      }}
                      className="self-start sm:self-center inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm hover:shadow-indigo-100 cursor-pointer"
                    >
                      <UserCheck className="h-4 w-4" />
                      Access {formData.siteEngineer} Portal
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
                    {/* ADMIN DATABASE VIEW */}
        {currentView === "admin" && (
          <div id="admin-container" className="space-y-6">
            {!isAuthenticated && isPasscodeConfigured === null && (
              <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-8 flex flex-col items-center text-center animate-fade-in">
                <RefreshCw className="h-8 w-8 animate-spin text-slate-600 mb-4" />
                <p className="text-xs text-slate-500 font-mono">Loading Security Configuration...</p>
              </div>
            )}

            {!isAuthenticated && isPasscodeConfigured === false && (
              <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-8 flex flex-col items-center text-center animate-fade-in">
                <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 mb-6 animate-pulse">
                  <Shield className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                  Passcode Configuration Setup
                </h3>
                <p className="text-xs text-slate-400 mt-1 mb-6 font-medium">
                  Bin Lahej General Maintenance & Contracting LLC
                </p>
                <div className="w-full bg-emerald-50/50 p-4 rounded-2xl border border-emerald-100 mb-6 text-left">
                  <p className="text-2xs text-emerald-700 font-mono font-bold uppercase tracking-wider mb-1">Passcode Setup Required</p>
                  <p className="text-[11px] text-emerald-600 leading-relaxed font-medium">
                    This system's security has not been configured yet. As the Document Controller, please create your custom passcode to protect the database and restrict unauthorized access.
                  </p>
                </div>
                <form onSubmit={handlePasscodeSetup} className="w-full space-y-4">
                  <div className="text-left">
                    <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Create Secure Passcode
                    </label>
                    <input
                      type="password"
                      placeholder="••••••"
                      value={newSetupPasscode}
                      onChange={(e) => setNewSetupPasscode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all text-center tracking-widest font-mono text-slate-800"
                      required
                    />
                  </div>

                  <div className="text-left">
                    <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Confirm Passcode
                    </label>
                    <input
                      type="password"
                      placeholder="••••••"
                      value={confirmSetupPasscode}
                      onChange={(e) => setConfirmSetupPasscode(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all text-center tracking-widest font-mono text-slate-800"
                      required
                    />
                  </div>

                  {setupError && (
                    <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 text-xs rounded-xl font-medium flex items-center gap-2 text-left">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0"></span>
                      <span>{setupError}</span>
                    </div>
                  )}

                  {setupSuccess && (
                    <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs rounded-xl font-medium flex items-center gap-2 text-left">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                      <span>{setupSuccess}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={settingUp}
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    {settingUp ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-white" /> Configuring Security...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Save & Initialize Access
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {!isAuthenticated && isPasscodeConfigured === true && (
              <div className="max-w-md mx-auto my-12 bg-white rounded-3xl border border-slate-200/80 shadow-xl overflow-hidden p-8 flex flex-col items-center text-center animate-fade-in">
                <div className="p-4 bg-amber-50 text-amber-600 rounded-2xl border border-amber-100 mb-6">
                  <Lock className="h-8 w-8" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 uppercase tracking-tight">
                  Document Controller Login
                </h3>
                <p className="text-xs text-slate-400 mt-1 mb-6 font-medium">
                  Bin Lahej General Maintenance & Contracting LLC
                </p>
                <div className="w-full bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mb-6 text-left">
                  <p className="text-2xs text-slate-400 font-mono font-bold uppercase tracking-wider mb-1">Security Notice</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Access to separate daily/monthly ledger records, labor code registry, and database search is restricted to authorized Document Controllers only.
                  </p>
                </div>
                <form onSubmit={handleLogin} className="w-full space-y-4">
                  <div className="text-left">
                    <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Enter Security Passcode
                    </label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="•••••"
                        value={passcode}
                        onChange={(e) => setPasscode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all text-center tracking-widest font-mono text-slate-800"
                        autoFocus
                      />
                    </div>
                  </div>

                  {authError && (
                    <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 text-xs rounded-xl font-medium flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0"></span>
                      <span>{authError}</span>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={checkingAuth}
                    className="w-full py-3 bg-[#0F172A] hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors shadow-md flex items-center justify-center gap-2"
                  >
                    {checkingAuth ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin text-white" /> Verifying...
                      </>
                    ) : (
                      <>
                        <Check className="h-4 w-4" /> Authenticate Access
                      </>
                    )}
                  </button>
                </form>
              </div>
            )}

            {isAuthenticated && (
              <div id="admin-authenticated-panel" className="space-y-6">
                {/* Elegant Sub-navigation for Console Views */}
                <div className="flex justify-between items-center border-b border-slate-200/80 mb-4 bg-white p-2 rounded-xl shadow-2xs flex-wrap gap-2">
                  <div className="flex flex-wrap gap-2">
                    <button
                      id="tab-ledger"
                      onClick={() => setAdminTab("ledger")}
                      className={`pb-2 pt-2 px-6 text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer rounded-lg flex items-center gap-2 ${
                        adminTab === "ledger"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <FileSpreadsheet className="h-4 w-4" /> Ledger Logs Database
                    </button>
                    <button
                      id="tab-monitoring"
                      onClick={() => setAdminTab("monitoring")}
                      className={`pb-2 pt-2 px-6 text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer rounded-lg flex items-center gap-2 ${
                        adminTab === "monitoring"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <ClipboardCheck className="h-4 w-4" /> Activity Progress Monitoring
                    </button>
                    <button
                      id="tab-labor-codes"
                      onClick={() => setAdminTab("labor_codes")}
                      className={`pb-2 pt-2 px-6 text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer rounded-lg flex items-center gap-2 ${
                        adminTab === "labor_codes"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <Key className="h-4 w-4" /> Manage Labor Codes System
                    </button>
                    <button
                      id="tab-security"
                      onClick={() => setAdminTab("security")}
                      className={`pb-2 pt-2 px-6 text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer rounded-lg flex items-center gap-2 ${
                        adminTab === "security"
                          ? "bg-slate-900 text-white shadow-xs"
                          : "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
                      }`}
                    >
                      <Lock className="h-4 w-4" /> Security Settings
                    </button>
                  </div>
                  <button
                    id="btn-signout"
                    onClick={handleLogout}
                    className="pb-2 pt-2 px-4 text-xs font-bold tracking-wider uppercase transition-all duration-200 cursor-pointer rounded-lg flex items-center gap-2 text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                  >
                    <LogOut className="h-4 w-4" /> Sign Out
                  </button>
                </div>
            
            {/* LOGS DASHBOARD ACTIVE VIEW */}
            {adminTab === "ledger" && (
              <div id="logs-dashboard" className="space-y-6">
              
              {/* Admin Header Commands */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 text-slate-700 p-2.5 rounded-xl border border-slate-100">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 font-display uppercase tracking-tight flex flex-wrap items-center gap-2">
                      <span>Document Controller Console</span>
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-bold tracking-normal uppercase">
                        ● Live Database Connected
                      </span>
                    </h2>
                    <p className="text-xs text-slate-400 font-mono">
                      Active Database Ledger Log (entries.json)
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 w-full md:w-auto">
                  <button
                    id="export-csv-btn"
                    onClick={downloadCSV}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-xs font-semibold uppercase tracking-wide text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer shadow-sm transition-colors"
                  >
                    <Download className="h-4 w-4" /> Export CSV Sheet
                  </button>

                  <button
                    id="export-pdf-btn"
                    onClick={exportPDF}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 rounded-xl cursor-pointer shadow-sm transition-all duration-150"
                  >
                    <FileText className="h-4 w-4 text-slate-500" /> Export PDF Log
                  </button>
                  
                  <button
                    id="refresh-logs-btn"
                    onClick={fetchSubmissions}
                    disabled={isLoadingLogs}
                    className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                  >
                    <RefreshCw className={`h-4 w-4 ${isLoadingLogs ? "animate-spin" : ""}`} />
                  </button>

                  <button
                    id="lock-console-btn"
                    onClick={() => setCurrentView("form")}
                    className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                  >
                    <LogOut className="h-4 w-4" /> Back to Form
                  </button>
                </div>
              </div>



                {/* Dashboard Metrics Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  
                  {/* METRIC 1 */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.01)] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block font-mono">Total Recorded Logs</span>
                      <span className="text-2xl font-bold text-slate-800 font-display mt-1 block">{totalLoggedWorkers}</span>
                    </div>
                    <div className="bg-slate-50 text-slate-500 p-2.5 rounded-xl border border-slate-100/80">
                      <FileSpreadsheet className="h-5 w-5" />
                    </div>
                  </div>

                  {/* METRIC 2 */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.01)] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block font-mono">Active Projects</span>
                      <span className="text-2xl font-bold text-slate-800 font-display mt-1 block">{uniqueProjects.length}</span>
                    </div>
                    <div className="bg-slate-50 text-slate-500 p-2.5 rounded-xl border border-slate-100/80">
                      <MapPin className="h-5 w-5" />
                    </div>
                  </div>

                  {/* METRIC 3 */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.01)] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block font-mono">Craft Trades</span>
                      <span className="text-2xl font-bold text-slate-800 font-display mt-1 block">{uniqueDesignations.length}</span>
                    </div>
                    <div className="bg-slate-50 text-slate-500 p-2.5 rounded-xl border border-slate-100/80">
                      <HardHat className="h-5 w-5" />
                    </div>
                  </div>

                  {/* METRIC 4 */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.02),0_2px_4px_-1px_rgba(0,0,0,0.01)] flex items-center justify-between">
                    <div>
                      <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block font-mono">Latest Submitter</span>
                      <span className="text-xs font-semibold text-slate-500 mt-2 block font-mono max-w-[150px] truncate">
                        {submissions.length > 0 ? submissions[0].laborsName : "Nil"}
                      </span>
                    </div>
                    <div className="bg-slate-50 text-slate-500 p-2.5 rounded-xl border border-slate-100/80">
                      <PlusCircle className="h-5 w-5" />
                    </div>
                  </div>

                </div>

                {/* Separate Daily & Monthly Ledger Files Panel */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Daily Records Column */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col h-[380px]">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-rose-500" />
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Daily Ledger Records</h3>
                          <p className="text-[10px] text-slate-400 font-mono">Individual files per day (JSON & CSV)</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-rose-50 text-rose-600 px-2.5 py-0.5 rounded-full border border-rose-100 uppercase">
                        {ledgerFiles.daily?.length || 0} Days
                      </span>
                    </div>

                    {isLoadingLedgerFiles ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
                        <RefreshCw className="h-6 w-6 animate-spin text-slate-300 mb-2" />
                        Scanning daily directory...
                      </div>
                    ) : !ledgerFiles.daily || ledgerFiles.daily.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4 border border-dashed border-slate-100 rounded-2xl bg-slate-50/20">
                        <FileSpreadsheet className="h-8 w-8 text-slate-200 mb-2" />
                        <span>No daily files generated yet.<br />Submit logs to create records automatically.</span>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                        {ledgerFiles.daily.map((file) => {
                          const formattedDate = (() => {
                            try {
                              const d = new Date(file.date);
                              return d.toLocaleDateString('en-US', { 
                                weekday: 'short',
                                year: 'numeric', 
                                month: 'short', 
                                day: 'numeric' 
                              });
                            } catch {
                              return file.date;
                            }
                          })();

                          return (
                            <div key={file.filename} className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200/85 rounded-2xl transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold text-slate-700 block truncate">
                                  {formattedDate}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 block mt-0.5 truncate">
                                  {file.filename}
                                </span>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-indigo-50 text-indigo-600 px-1.5 py-0.5 rounded border border-indigo-100 font-mono">
                                    {file.recordCount} {file.recordCount === 1 ? 'record' : 'records'}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-400">
                                    {(file.size / 1024).toFixed(2)} KB
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1.5 shrink-0 items-center">
                                <button
                                  onClick={() => handleViewLedgerFile("daily", file.filename, file.date)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 hover:border-indigo-300 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                                  title="View records of this day directly in screen"
                                >
                                  <Eye className="h-3 w-3 text-indigo-600" /> View
                                </button>
                                <button
                                  onClick={() => handleDownloadFileAsPDF("daily", file.filename, file.date)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                                  title="Export this day as a clean PDF document"
                                >
                                  <FileText className="h-3 w-3 text-rose-600" /> PDF
                                </button>
                                <a
                                  href={`${file.path}?format=csv`}
                                  download
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                                  title="Download as CSV file for Microsoft Excel"
                                >
                                  <FileSpreadsheet className="h-3 w-3 text-emerald-600" /> CSV
                                </a>
                                <a
                                  href={`${file.path}?format=json`}
                                  download
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                                  title="Download raw JSON database backup file"
                                >
                                  <Download className="h-3 w-3 text-slate-500" /> JSON
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Monthly Records Column */}
                  <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm flex flex-col h-[380px]">
                    <div className="flex items-center justify-between mb-4 shrink-0">
                      <div className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-indigo-500" />
                        <div>
                          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-tight">Monthly Ledger Records</h3>
                          <p className="text-[10px] text-slate-400 font-mono">Roll-up files per month (JSON & CSV)</p>
                        </div>
                      </div>
                      <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-600 px-2.5 py-0.5 rounded-full border border-indigo-100 uppercase">
                        {ledgerFiles.monthly?.length || 0} Months
                      </span>
                    </div>

                    {isLoadingLedgerFiles ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs">
                        <RefreshCw className="h-6 w-6 animate-spin text-slate-300 mb-2" />
                        Scanning monthly directory...
                      </div>
                    ) : !ledgerFiles.monthly || ledgerFiles.monthly.length === 0 ? (
                      <div className="flex-1 flex flex-col items-center justify-center text-slate-400 text-xs text-center p-4 border border-dashed border-slate-100 rounded-2xl bg-slate-50/20">
                        <FileSpreadsheet className="h-8 w-8 text-slate-200 mb-2" />
                        <span>No monthly files generated yet.<br />Submit logs to create records automatically.</span>
                      </div>
                    ) : (
                      <div className="flex-1 overflow-y-auto pr-1 space-y-3">
                        {ledgerFiles.monthly.map((file) => {
                          const formattedMonth = (() => {
                            try {
                              const [year, month] = file.date.split("-");
                              const d = new Date(parseInt(year), parseInt(month) - 1, 1);
                              return d.toLocaleDateString('en-US', { 
                                year: 'numeric', 
                                month: 'long' 
                              });
                            } catch {
                              return file.date;
                            }
                          })();

                          return (
                            <div key={file.filename} className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-slate-200/85 rounded-2xl transition-all flex flex-col xl:flex-row xl:items-center justify-between gap-3">
                              <div className="flex-1 min-w-0">
                                <span className="text-xs font-bold text-slate-700 block truncate">
                                  {formattedMonth}
                                </span>
                                <span className="text-[10px] font-mono text-slate-400 block mt-0.5 truncate">
                                  {file.filename}
                                </span>
                                <div className="flex items-center gap-2 mt-1.5">
                                  <span className="inline-flex items-center gap-0.5 text-[9px] font-semibold bg-rose-50 text-rose-600 px-1.5 py-0.5 rounded border border-rose-100 font-mono">
                                    {file.recordCount} {file.recordCount === 1 ? 'record' : 'records'}
                                  </span>
                                  <span className="text-[9px] font-mono text-slate-400">
                                    {(file.size / 1024).toFixed(2)} KB
                                  </span>
                                </div>
                              </div>
                              <div className="flex flex-wrap gap-1.5 shrink-0 items-center">
                                <button
                                  onClick={() => handleViewLedgerFile("monthly", file.filename, file.date)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 hover:border-indigo-300 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                                  title="View records of this month directly in screen"
                                >
                                  <Eye className="h-3 w-3 text-indigo-600" /> View
                                </button>
                                <button
                                  onClick={() => handleDownloadFileAsPDF("monthly", file.filename, file.date)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 hover:border-rose-300 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                                  title="Export this month as a clean PDF document"
                                >
                                  <FileText className="h-3 w-3 text-rose-600" /> PDF
                                </button>
                                <a
                                  href={`${file.path}?format=csv`}
                                  download
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 hover:border-emerald-300 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                                  title="Download as CSV file for Microsoft Excel"
                                >
                                  <FileSpreadsheet className="h-3 w-3 text-emerald-600" /> CSV
                                </a>
                                <a
                                  href={`${file.path}?format=json`}
                                  download
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-white hover:bg-slate-100 text-slate-600 border border-slate-200 hover:border-slate-300 text-[10px] font-bold uppercase tracking-wider rounded-lg cursor-pointer transition-colors"
                                  title="Download raw JSON database backup file"
                                >
                                  <Download className="h-3 w-3 text-slate-500" /> JSON
                                </a>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                {/* Database Search & Filters Control Panel */}
                <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                  
                  {/* Search bar */}
                  <div className="relative w-full md:max-w-md">
                    <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                      id="search-input"
                      type="text"
                      placeholder="Search by worker, project, engineer..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 bg-slate-50/50 font-medium"
                    />
                  </div>

                  {/* Interactive Option Filters */}
                  <div className="flex flex-wrap gap-3 w-full md:w-auto">
                    <div className="flex items-center gap-2">
                      <span className="text-2xs font-semibold text-slate-400 uppercase tracking-widest">Project:</span>
                      <select
                        id="filter-project"
                        value={selectedProjectFilter}
                        onChange={(e) => setSelectedProjectFilter(e.target.value)}
                        className="text-xs border border-slate-200 rounded-xl py-2 px-3 bg-slate-50 hover:bg-slate-100/60 transition-colors focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 outline-none font-medium text-slate-700"
                      >
                        <option value="ALL">All Projects</option>
                        {uniqueProjects.map(p => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-2xs font-semibold text-slate-400 uppercase tracking-widest">Trade:</span>
                      <select
                        id="filter-designation"
                        value={selectedDesignationFilter}
                        onChange={(e) => setSelectedDesignationFilter(e.target.value)}
                        className="text-xs border border-slate-200 rounded-xl py-2 px-3 bg-slate-50 hover:bg-slate-100/60 transition-colors focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 outline-none font-medium text-slate-700"
                      >
                        <option value="ALL">All Trades</option>
                        {uniqueDesignations.map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                </div>

                {/* MAIN SPREADSHEET TABLE LOG VIEWER */}
                <div className="bg-white rounded-3xl shadow-[0_20px_25px_-5px_rgba(0,0,0,0.05),0_10px_10px_-5px_rgba(0,0,0,0.02)] border border-slate-200/60 overflow-hidden">
                  <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileSpreadsheet className="h-4.5 w-4.5 text-slate-500" />
                      <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Bin Lahej Ledger Records</span>
                    </div>
                    <span className="text-2xs font-mono bg-slate-200/80 text-slate-600 px-2.5 py-1 rounded-full font-bold">
                      {filteredSubmissions.length} OF {submissions.length} SHOWN
                    </span>
                  </div>

                  {logsError && (
                    <div className="p-4 bg-rose-50 text-rose-700 text-xs border-b border-rose-100 flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-rose-500" />
                      <span>{logsError}</span>
                    </div>
                  )}

                  {isLoadingLogs ? (
                    <div className="p-12 text-center text-slate-500">
                      <RefreshCw className="h-8 w-8 animate-spin mx-auto text-slate-400 mb-2" />
                      Uploading recent logs...
                    </div>
                  ) : filteredSubmissions.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 font-medium text-xs">
                      No matching log sheets found in your database.
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table id="labor-records-table" className="w-full text-left border-collapse">
                        
                        {/* Table Header mirroring premium minimal dark-slate header theme */}
                        <thead className="bg-[#0F172A] text-slate-200 select-none text-[10px] uppercase font-mono tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4 font-bold border-r border-[#1e293b]">DATE</th>
                            <th className="py-3 px-4 font-bold border-r border-[#1e293b]">PROJECT CODE</th>
                            <th className="py-3 px-4 font-bold border-r border-[#1e293b]">LABORS NAME</th>
                            <th className="py-3 px-4 font-bold border-r border-[#1e293b]">DESIGNATION</th>
                            <th className="py-3 px-4 font-bold border-r border-[#1e293b]">PROJECT LOCATION</th>
                            <th className="py-3 px-4 font-bold border-r border-[#1e293b]">SITE ENGINEER</th>
                            <th className="py-3 px-4 font-bold border-r border-[#1e293b]">REASSIGNED TASK</th>
                            <th className="py-3 px-4 font-bold border-r border-[#1e293b] text-center">ATTENDANCE</th>
                            <th className="py-3 px-4 font-bold text-center">ACTION</th>
                          </tr>
                        </thead>

                        {/* Table Body mimicking the screenshot exact cell styling style */}
                        <tbody className="divide-y divide-slate-200 text-xs font-medium">
                          {filteredSubmissions.map((s) => {
                            // Style the date display similar to standard formatting on the sheet (Red & Bold Underlined)
                            // "Monday, June 22, 2026"
                            const formattedDate = (() => {
                              try {
                                const d = new Date(s.date);
                                return d.toLocaleDateString('en-US', { 
                                  weekday: 'long', 
                                  year: 'numeric', 
                                  month: 'long', 
                                  day: 'numeric' 
                                });
                              } catch {
                                return s.date;
                              }
                            })();

                            return (
                              <tr key={s.id} className="hover:bg-slate-50 transition-colors duration-100 border-b border-slate-200">
                                {/* DATE (Red, Bold, Underlined as shown in row 1 of the screenshot) */}
                                <td className="py-3.5 px-4 text-[#e11d48] font-bold underline whitespace-nowrap bg-rose-50/10 border-r border-slate-200">
                                  {formattedDate}
                                </td>
                                
                                {/* PROJECT (uppercase bold black) */}
                                <td className="py-3.5 px-4 text-slate-800 font-bold uppercase border-r border-slate-200">
                                  {s.project}
                                </td>
                                
                                {/* LABORS NAME (uppercase bold black) */}
                                <td className="py-3.5 px-4 text-slate-800 font-bold uppercase border-r border-slate-200 font-mono">
                                  {s.laborsName}
                                </td>
                                
                                {/* DESIGNATION (uppercase black bold underlined as shown in screenshot "CARPENTER"/"HELPER") */}
                                <td className="py-3.5 px-4 text-slate-900 font-extrabold uppercase underline border-r border-slate-200">
                                  {s.designation}
                                </td>
                                
                                {/* PROJECT LOCATION */}
                                <td className="py-3.5 px-4 text-slate-700 uppercase border-r border-slate-200">
                                  {s.projectLocation}
                                </td>
                                
                                {/* SITE ENGINEER */}
                                <td className="py-3.5 px-4 text-slate-700 uppercase border-r border-slate-200">
                                  {s.siteEngineer}
                                </td>
                                
                                {/* REASSIGNED TASK (uppercase bold green as shown in screenshot "HOUSEKEEPING"/"STEEL FIXER") */}
                                <td className="py-3.5 px-4 text-emerald-700 font-extrabold uppercase bg-emerald-50/10 border-r border-slate-200">
                                  {s.reassignedTask}
                                </td>

                                {/* ATTENDANCE STATUS */}
                                <td className="py-3.5 px-4 text-center border-r border-slate-200">
                                  <span className={`px-2 py-1 rounded-full text-[10px] font-extrabold uppercase whitespace-nowrap ${
                                    (s.attendanceStatus || "Present") === "Present"
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : (s.attendanceStatus || "Present") === "Absent"
                                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                                      : "bg-amber-100 text-amber-800 border border-amber-200"
                                  }`}>
                                    {s.attendanceStatus || "Present"}
                                  </span>
                                </td>

                                {/* DELETION ACTION */}
                                <td className="py-3.2 px-4 text-center">
                                  <button
                                    onClick={() => handleDeleteItem(s.id, s.laborsName)}
                                    title="Delete Entry"
                                    className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200 rounded cursor-pointer transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5 inline" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>

                      </table>
                    </div>
                  )}
                </div>


              </div>
            )}

            {/* DAILY ACTIVITY & PROGRESS MONITORING DATABASE VIEW */}
            {adminTab === "monitoring" && (() => {
              // Get submissions that have at least one monitoring field or match search/project filters
              const monitoringEntries = submissions.filter(s => {
                const matchesProject = monitoringProjectFilter === "ALL" || s.project.toUpperCase() === monitoringProjectFilter.toUpperCase();
                
                // Generic query matching:
                const query = monitoringSearchTerm.trim().toUpperCase();
                const matchesSearch = !query || 
                  (s.activityName && s.activityName.toUpperCase().includes(query)) ||
                  (s.equipment && s.equipment.toUpperCase().includes(query)) ||
                  (s.projectLocation && s.projectLocation.toUpperCase().includes(query)) ||
                  (s.siteEngineer && s.siteEngineer.toUpperCase().includes(query)) ||
                  (s.project && s.project.toUpperCase().includes(query));

                // Always require at least one monitoring detail to be filled
                const hasMonitoringData = !!(s.activityName || s.workCompletedPercent || s.targetDate || s.workCompletedTodayPercent || s.noOfLaborSubcontractor || s.equipment);

                return matchesProject && matchesSearch && hasMonitoringData;
              });

              // Calculate beautiful metrics for monitoring:
              const totalActivities = monitoringEntries.length;
              const completedActivities = monitoringEntries.filter(s => s.workCompletedPercent === "100" || s.workCompletedPercent?.includes("100")).length;
              
              // Average progress calculation:
              const progressValues = monitoringEntries
                .map(s => parseFloat(s.workCompletedPercent || "0"))
                .filter(val => !isNaN(val));
              const avgProgress = progressValues.length > 0 
                ? Math.round(progressValues.reduce((sum, val) => sum + val, 0) / progressValues.length)
                : 0;

              // Unique active equipments
              const activeEquipmentCount = Array.from(new Set(
                monitoringEntries
                  .map(s => s.equipment?.toUpperCase() || "")
                  .filter(eq => eq.trim() !== "")
              )).length;

              const uniqueProjectsList = Array.from(new Set(
                submissions
                  .filter(s => s.activityName && s.activityName.trim() && s.project && s.project.trim())
                  .map(s => s.project)
              ));

              return (
                <div id="monitoring-dashboard" className="space-y-6 animate-fadeIn">
                  
                  {/* Admin Header Commands */}
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="bg-slate-50 text-slate-700 p-2.5 rounded-xl border border-slate-100">
                        <ClipboardCheck className="h-5 w-5 text-slate-700" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-900 font-display uppercase tracking-tight flex flex-wrap items-center gap-2">
                          <span>Activity & Progress Monitoring Database</span>
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-bold tracking-normal uppercase">
                            ● Monitoring Sheet View
                          </span>
                        </h2>
                        <p className="text-xs text-slate-400 font-mono">
                          Live Progress logs & Construction Milestones
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                      <button
                        id="monitoring-export-csv-btn"
                        onClick={() => downloadMonitoringCSV(monitoringEntries)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 border border-transparent text-xs font-semibold uppercase tracking-wide text-white bg-slate-900 hover:bg-slate-800 rounded-xl cursor-pointer shadow-sm transition-colors"
                      >
                        <Download className="h-4 w-4" /> Export CSV Sheet
                      </button>

                      <button
                        id="monitoring-export-pdf-btn"
                        onClick={() => exportMonitoringPDF(monitoringEntries)}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-700 bg-white hover:bg-slate-50 hover:border-slate-300 rounded-xl cursor-pointer shadow-sm transition-all duration-150"
                      >
                        <FileText className="h-4 w-4 text-slate-500" /> Export PDF Log
                      </button>
                      
                      <button
                        id="monitoring-refresh-btn"
                        onClick={fetchSubmissions}
                        disabled={isLoadingLogs}
                        className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                      >
                        <RefreshCw className={`h-4 w-4 ${isLoadingLogs ? "animate-spin" : ""}`} />
                      </button>

                      <button
                        id="monitoring-back-btn"
                        onClick={() => setCurrentView("form")}
                        className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                      >
                        <LogOut className="h-4 w-4" /> Back to Form
                      </button>
                    </div>
                  </div>

                  {/* Dashboard Metrics Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* METRIC 1 */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block font-mono">Monitored Tasks</span>
                        <span className="text-2xl font-bold text-slate-800 font-display mt-1 block">{totalActivities}</span>
                      </div>
                      <div className="bg-slate-50 text-slate-500 p-2.5 rounded-xl border border-slate-100/80">
                        <Layers className="h-5 w-5" />
                      </div>
                    </div>

                    {/* METRIC 2 */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block font-mono">Average Completion</span>
                        <span className="text-2xl font-bold text-slate-800 font-display mt-1 block">{avgProgress}%</span>
                      </div>
                      <div className="bg-slate-50 text-slate-500 p-2.5 rounded-xl border border-slate-100/80">
                        <Clock className="h-5 w-5" />
                      </div>
                    </div>

                    {/* METRIC 3 */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block font-mono">Fully Completed</span>
                        <span className="text-2xl font-bold text-emerald-600 font-display mt-1 block">{completedActivities}</span>
                      </div>
                      <div className="bg-emerald-50/50 text-emerald-600 p-2.5 rounded-xl border border-emerald-100/50">
                        <CheckCircle2 className="h-5 w-5" />
                      </div>
                    </div>

                    {/* METRIC 4 */}
                    <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block font-mono">Active Equipment types</span>
                        <span className="text-2xl font-bold text-slate-800 font-display mt-1 block">{activeEquipmentCount}</span>
                      </div>
                      <div className="bg-slate-50 text-slate-500 p-2.5 rounded-xl border border-slate-100/80">
                        <Wrench className="h-5 w-5" />
                      </div>
                    </div>
                  </div>

                  {/* Table Search & Project Filters block */}
                  <div className="bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm flex flex-col sm:flex-row gap-4 items-center">
                    <div className="relative w-full sm:flex-1">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                      <input
                        id="monitoring-search-input"
                        type="text"
                        placeholder="Search by Activity, Equipment, Site Engineer, Project Location..."
                        value={monitoringSearchTerm}
                        onChange={(e) => setMonitoringSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-xs font-medium text-slate-800 rounded-xl transition-all"
                      />
                      {monitoringSearchTerm && (
                        <button
                          onClick={() => setMonitoringSearchTerm("")}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs font-bold"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    <div className="w-full sm:w-64 flex flex-col">
                      <select
                        id="monitoring-project-filter"
                        value={monitoringProjectFilter}
                        onChange={(e) => setMonitoringProjectFilter(e.target.value)}
                        className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:bg-white focus:outline-none transition-all uppercase"
                      >
                        <option value="ALL">Filter By Project (ALL)</option>
                        {uniqueProjectsList.map((proj) => (
                          <option key={proj} value={proj}>{proj}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Project-separated Daily Progress Sheets */}
                  <div className="space-y-12">
                    {(() => {
                      const formatDateLong = (dateStr: string) => {
                        if (!dateStr || dateStr === "UNKNOWN") return "Unknown Date";
                        const parts = dateStr.split("-");
                        if (parts.length !== 3) return dateStr;
                        const year = parts[0];
                        const monthIdx = parseInt(parts[1], 10) - 1;
                        const day = parseInt(parts[2], 10);
                        const months = [
                          "January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"
                        ];
                        return `${months[monthIdx] || parts[1]} ${day}, ${year}`;
                      };

                      const getMonthYear = (dateStr: string) => {
                        if (!dateStr || dateStr === "UNKNOWN") return "Unknown Month";
                        const parts = dateStr.split("-");
                        if (parts.length < 2) return "Unknown Month";
                        const year = parts[0];
                        const monthIdx = parseInt(parts[1], 10) - 1;
                        const months = [
                          "January", "February", "March", "April", "May", "June",
                          "July", "August", "September", "October", "November", "December"
                        ];
                        return `${months[monthIdx] || parts[1]} ${year}`;
                      };

                      const monthGroups: {
                        [monthYear: string]: {
                          [dateStr: string]: {
                            [projectCode: string]: {
                              projectName: string;
                              projectLocation: string;
                              records: Submission[];
                            }
                          }
                        }
                      } = {};

                      monitoringEntries.forEach((r) => {
                        const projCode = (r.project || "UNKNOWN").toUpperCase().trim();
                        const dateVal = r.date || "UNKNOWN";
                        const combinedProjectCodes = projectCodes.length > 0 ? projectCodes : DEFAULT_PROJECT_CODES;
                        const projectInfo = combinedProjectCodes.find(pc => pc.code.toUpperCase() === projCode);
                        const pName = projectInfo ? projectInfo.name : `${projCode} PROJECT`;
                        const pLoc = projectInfo ? projectInfo.location : (r.projectLocation || "N/A");

                        const mYear = getMonthYear(dateVal);

                        if (!monthGroups[mYear]) {
                          monthGroups[mYear] = {};
                        }
                        if (!monthGroups[mYear][dateVal]) {
                          monthGroups[mYear][dateVal] = {};
                        }
                        if (!monthGroups[mYear][dateVal][projCode]) {
                          monthGroups[mYear][dateVal][projCode] = {
                            projectName: pName,
                            projectLocation: pLoc,
                            records: []
                          };
                        }
                        monthGroups[mYear][dateVal][projCode].records.push(r);
                      });

                      const sortedMonths = Object.keys(monthGroups).sort((a, b) => {
                        const getVal = (mStr: string) => {
                          const pts = mStr.split(" ");
                          if (pts.length < 2) return 0;
                          const yr = parseInt(pts[1], 10);
                          const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
                          const mIdx = months.indexOf(pts[0]);
                          return yr * 12 + mIdx;
                        };
                        return getVal(b) - getVal(a);
                      });

                      const allAvailableDates = sortedMonths.flatMap(m => 
                        Object.keys(monthGroups[m]).sort((a, b) => b.localeCompare(a))
                      );

                      const activeDate = selectedMonitoringDate || allAvailableDates[0] || "";
                      const activeMonthYear = activeDate ? getMonthYear(activeDate) : "";
                      const projectsOnActiveDate = (activeMonthYear && activeDate) ? (monthGroups[activeMonthYear]?.[activeDate] || {}) : {};
                      const sortedActiveProjectCodes = Object.keys(projectsOnActiveDate).sort();

                      if (sortedMonths.length === 0) {
                        return (
                          <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200/60 font-medium text-sm">
                            <Layers className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                            No activity progress monitoring records match your search filters.
                          </div>
                        );
                      }

                      return (
                        <div className="flex flex-col lg:flex-row gap-6 items-start">
                          {/* Left Column: Interactive Month & Date Browser */}
                          <div className="w-full lg:w-80 shrink-0 space-y-4">
                            <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
                              <div className="flex items-center gap-2 border-b border-slate-100 pb-2.5">
                                <Calendar className="h-4 w-4 text-slate-500" />
                                <span className="text-xs font-bold font-mono uppercase tracking-wider text-slate-500">
                                  Select Daily Log Sheet
                                </span>
                              </div>

                              <div className="space-y-6 max-h-[70vh] overflow-y-auto pr-1">
                                {sortedMonths.map((month) => {
                                  const datesInMonth = Object.keys(monthGroups[month]).sort((a, b) => b.localeCompare(a));
                                  return (
                                    <div key={month} className="space-y-2.5">
                                      {/* Month Year Header */}
                                      <div className="flex items-center gap-1.5 text-slate-800 font-extrabold text-xs uppercase tracking-wider border-l-4 border-slate-900 pl-2 py-0.5 bg-slate-50 rounded-r-md">
                                        <span>{month}</span>
                                      </div>

                                      {/* Dates list */}
                                      <div className="space-y-2 pl-1">
                                        {datesInMonth.map((dKey) => {
                                          const projects = monthGroups[month][dKey];
                                          const pCodes = Object.keys(projects).sort();
                                          const isSelected = activeDate === dKey;

                                          return (
                                            <div key={dKey} className="space-y-1">
                                              <div
                                                role="button"
                                                tabIndex={0}
                                                onClick={() => setSelectedMonitoringDate(dKey)}
                                                onKeyDown={(e) => {
                                                  if (e.key === "Enter" || e.key === " ") {
                                                    e.preventDefault();
                                                    setSelectedMonitoringDate(dKey);
                                                  }
                                                }}
                                                className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1.5 cursor-pointer ${
                                                  isSelected
                                                    ? "bg-slate-900 text-white border-transparent shadow-md font-bold"
                                                    : "bg-white text-slate-700 border-slate-200/80 hover:border-slate-300 hover:bg-slate-50"
                                                }`}
                                              >
                                                <div className="flex items-center justify-between w-full">
                                                  <span className="text-xs font-bold font-mono tracking-tight">
                                                    {formatDateLong(dKey)}
                                                  </span>
                                                  <div className="flex items-center gap-1.5">
                                                    <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${
                                                      isSelected ? "bg-slate-800 text-slate-300 border border-slate-700" : "bg-slate-100 text-slate-500 border border-slate-200"
                                                    }`}>
                                                      {pCodes.length} {pCodes.length === 1 ? "project" : "projects"}
                                                    </span>
                                                    <button
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteDailyLogDate(dKey);
                                                      }}
                                                      className={`p-1 rounded-md transition-colors ${
                                                        isSelected 
                                                          ? "text-rose-400 hover:text-rose-300 hover:bg-slate-800" 
                                                          : "text-rose-500 hover:text-rose-600 hover:bg-rose-50"
                                                      }`}
                                                      title={`Delete all logs on ${formatDateLong(dKey)}`}
                                                    >
                                                      <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                  </div>
                                                </div>

                                                {/* Projects under this date as nested items */}
                                                <div className="pl-2 border-l border-slate-300/40 text-[10px] space-y-1 text-left">
                                                  {pCodes.map((pCode) => {
                                                    const proj = projects[pCode];
                                                    return (
                                                      <div key={pCode} className={`truncate uppercase font-medium ${isSelected ? "text-slate-300" : "text-slate-500"}`}>
                                                        • <strong className="font-mono">{pCode}</strong> <span className="opacity-90">{proj.projectName.split("–")[0].split("-")[0]}</span>
                                                      </div>
                                                    );
                                                  })}
                                                </div>
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Select Project to Delete All Records on Date */}
                            {activeDate && sortedActiveProjectCodes.length > 0 && (
                              <div className="bg-white rounded-3xl border border-rose-200/80 p-5 shadow-xs space-y-3 mt-4">
                                <div className="flex items-center gap-2 border-b border-rose-100 pb-2.5 text-rose-600">
                                  <Trash2 className="h-4 w-4 text-rose-500" />
                                  <span className="text-xs font-bold font-mono uppercase tracking-wider">
                                    Quick Delete Daily Sheet
                                  </span>
                                </div>
                                
                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                  Select an active project code to delete its entire log sheet for <strong className="font-semibold text-slate-800">{formatDateLong(activeDate)}</strong>.
                                </p>

                                <div className="flex flex-col gap-2">
                                  <select
                                    id="monitoring-delete-project-select"
                                    onChange={(e) => {
                                      const pCode = e.target.value;
                                      if (pCode) {
                                        handleDeleteProjectDailySheet(pCode, activeDate);
                                        e.target.value = ""; // Reset
                                      }
                                    }}
                                    className="w-full px-3 py-2 bg-rose-50/30 border border-rose-150 rounded-xl text-xs font-semibold text-rose-800 focus:bg-white focus:outline-none transition-all uppercase cursor-pointer"
                                  >
                                    <option value="">-- Choose Project --</option>
                                    {sortedActiveProjectCodes.map((pCode) => (
                                      <option key={pCode} value={pCode}>
                                        {pCode} - {projectsOnActiveDate[pCode].projectName}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}

                            {/* Select Date to Delete Entirely */}
                            {allAvailableDates.length > 0 && (
                              <div className="bg-white rounded-3xl border border-rose-200/80 p-5 shadow-xs space-y-3 mt-4">
                                <div className="flex items-center gap-2 border-b border-rose-100 pb-2.5 text-rose-600">
                                  <Trash2 className="h-4 w-4 text-rose-500" />
                                  <span className="text-xs font-bold font-mono uppercase tracking-wider">
                                    Delete Date Logs
                                  </span>
                                </div>

                                <p className="text-[11px] text-slate-500 font-medium leading-relaxed">
                                  Select a date from the dropdown to delete all its daily progress log entries across all projects.
                                </p>

                                <div className="flex flex-col gap-2">
                                  <select
                                    id="monitoring-delete-date-select"
                                    onChange={(e) => {
                                      const dateStr = e.target.value;
                                      if (dateStr) {
                                        handleDeleteDailyLogDate(dateStr);
                                        e.target.value = ""; // Reset
                                      }
                                    }}
                                    className="w-full px-3 py-2 bg-rose-50/30 border border-rose-150 rounded-xl text-xs font-semibold text-rose-800 focus:bg-white focus:outline-none transition-all uppercase cursor-pointer"
                                  >
                                    <option value="">-- Select Date --</option>
                                    {allAvailableDates.map((dateStr) => (
                                      <option key={dateStr} value={dateStr}>
                                        {formatDateLong(dateStr)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Right Column: Active Date Project Records */}
                          <div className="flex-1 w-full space-y-6">
                            {activeDate ? (
                              <>
                                {/* Active Date Top Summary Panel */}
                                <div className="bg-[#0F172A] p-5 rounded-3xl text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-slate-800 shadow-sm shrink-0">
                                  <div className="flex items-center gap-3">
                                    <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                                      <Calendar className="h-6 w-6" />
                                    </div>
                                    <div>
                                      <span className="text-[9px] font-mono text-emerald-400 font-bold uppercase tracking-widest block">DAILY PROGRESS OVERVIEW</span>
                                      <h3 className="text-base font-extrabold uppercase tracking-tight font-display">
                                        {formatDateLong(activeDate)}
                                      </h3>
                                    </div>
                                  </div>
                                  <div className="text-left sm:text-right">
                                    <span className="text-[9px] text-slate-400 font-mono block">DATE CODE</span>
                                    <span className="font-mono text-xs font-bold bg-slate-800 px-2.5 py-1 rounded-lg border border-slate-700">{activeDate}</span>
                                  </div>
                                </div>

                                {/* List of Project Cards */}
                                <div className="space-y-6">
                                  {sortedActiveProjectCodes.map((pCode) => {
                                    const projData = projectsOnActiveDate[pCode];
                                    const dayEntries = projData.records;
                                    const dayRefNo = `WR/${pCode}/${activeDate.replace(/-/g, "").substring(2,6) || "29"}`;
                                    const siteEngineerName = dayEntries[0]?.siteEngineer || "N/A";
                                    const projectSelectedRowIds = dayEntries
                                      .map(r => r.id)
                                      .filter(id => selectedProgressRowIds.includes(id));

                                    return (
                                      <div key={pCode} className="bg-white rounded-3xl border border-slate-200 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] overflow-hidden p-6 relative space-y-6">
                                        {/* Project Title and Header buttons */}
                                        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-4">
                                          <div className="flex items-center gap-3">
                                            <div className="bg-slate-900 text-white px-2.5 py-1 rounded-xl text-2xs font-bold font-mono">
                                              {pCode}
                                            </div>
                                            <div>
                                              <h4 className="text-xs font-extrabold text-slate-800 uppercase tracking-wider">
                                                {projData.projectName}
                                              </h4>
                                              <p className="text-[10px] font-mono text-slate-400 uppercase">
                                                Location: {projData.projectLocation}
                                              </p>
                                            </div>
                                          </div>

                                          <div className="flex items-center flex-wrap gap-1.5">
                                            <button
                                              onClick={() => setViewingProgressSheet({
                                                isOpen: true,
                                                projectCode: pCode,
                                                projectName: projData.projectName,
                                                projectLocation: projData.projectLocation,
                                                date: activeDate,
                                                records: dayEntries
                                              })}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg border border-indigo-200 cursor-pointer transition-colors"
                                              title="View printable template"
                                            >
                                              <Eye className="h-3 w-3" /> View Sheet
                                            </button>
                                            <button
                                              onClick={() => exportSingleProgressSheetCSV(pCode, projData.projectName, activeDate, dayEntries)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg border border-emerald-200 cursor-pointer transition-colors"
                                              title="Export to CSV file"
                                            >
                                              <Download className="h-3 w-3" /> CSV
                                            </button>
                                            <button
                                              onClick={() => exportSingleProgressSheetPDF(pCode, projData.projectName, activeDate, dayEntries)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200 cursor-pointer transition-colors"
                                              title="Export to PDF report"
                                            >
                                              <FileText className="h-3 w-3" /> PDF
                                            </button>
                                            <button
                                              onClick={() => handleDeleteProjectDailySheet(pCode, activeDate)}
                                              className="inline-flex items-center gap-1 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-rose-600 bg-rose-50/50 hover:bg-rose-100 rounded-lg border border-rose-200 cursor-pointer transition-colors"
                                              title="Delete entire project daily sheet"
                                            >
                                              <Trash2 className="h-3 w-3" /> Delete
                                            </button>
                                            {projectSelectedRowIds.length > 0 && (
                                              <button
                                                onClick={() => handleDeleteMultipleItems(projectSelectedRowIds)}
                                                className="inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-white bg-rose-600 hover:bg-rose-700 rounded-lg border border-rose-500 cursor-pointer transition-all shadow-xs animate-fadeIn"
                                                title={`Delete ${projectSelectedRowIds.length} selected items`}
                                              >
                                                <Trash2 className="h-3 w-3 text-white" /> Delete Selected ({projectSelectedRowIds.length})
                                              </button>
                                            )}
                                          </div>
                                        </div>

                                        {/* Details strip */}
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-50/50 p-4 rounded-2xl border border-slate-100">
                                          <div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase block font-mono">SITE ENGINEER IN-CHARGE</span>
                                            <span className="text-xs font-bold text-slate-800 uppercase block mt-0.5">{siteEngineerName}</span>
                                          </div>
                                          <div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase block font-mono">REPORT REF NO</span>
                                            <span className="text-xs font-mono font-bold text-slate-800 block mt-0.5">{dayRefNo}</span>
                                          </div>
                                          <div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase block font-mono">ACTIVITIES LOGGED</span>
                                            <span className="text-xs font-bold text-slate-800 block mt-0.5">{dayEntries.length} Items</span>
                                          </div>
                                        </div>

                                        {/* TABLE CONTAINER */}
                                        <div className="border border-slate-300 rounded-xl overflow-hidden bg-white shadow-2xs relative">
                                          <div className="overflow-x-auto relative z-10">
                                            <table className="w-full text-left border-collapse min-w-[1000px]">
                                              <thead>
                                                <tr className="bg-[#DDEBF7] text-[#1F4E78] text-[10px] font-mono tracking-wider uppercase border-b border-slate-300">
                                                  <th className="py-2.5 px-2 font-bold border-r border-slate-300 text-center w-10">
                                                    <input
                                                      type="checkbox"
                                                      checked={dayEntries.length > 0 && dayEntries.every(r => selectedProgressRowIds.includes(r.id))}
                                                      onChange={(e) => {
                                                        const isChecked = e.target.checked;
                                                        const entryIds = dayEntries.map(r => r.id);
                                                        if (isChecked) {
                                                          setSelectedProgressRowIds(prev => {
                                                            const union = new Set([...prev, ...entryIds]);
                                                            return Array.from(union);
                                                          });
                                                        } else {
                                                          setSelectedProgressRowIds(prev => prev.filter(id => !entryIds.includes(id)));
                                                        }
                                                      }}
                                                      className="rounded border-slate-300 text-[#1F4E78] focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                                                      title="Select All"
                                                    />
                                                  </th>
                                                  <th className="py-2.5 px-3 font-bold border-r border-slate-300 text-center w-16">S/NO.</th>
                                                  <th className="py-2.5 px-4 font-bold border-r border-slate-300">NAME OF ACTIVITY</th>
                                                  <th className="py-2.5 px-3 font-bold border-r border-slate-300 text-center w-40">% WORK COMPLETED</th>
                                                  <th className="py-2.5 px-3 font-bold border-r border-slate-300 text-center w-32">TARGET DATE</th>
                                                  <th className="py-2.5 px-3 font-bold border-r border-slate-300 text-center w-40">WORK COMPLETED TODAY</th>
                                                  <th className="py-2.5 px-3 font-bold border-r border-slate-300 text-center w-40">NO. LABOR / SUBCONTRACTOR</th>
                                                  <th className="py-2.5 px-4 font-bold border-r border-slate-300">EQUIPMENT</th>
                                                  <th className="py-2.5 px-4 font-bold border-r border-slate-300">REMARKS</th>
                                                  <th className="py-2.5 px-4 border-r border-slate-300 text-center w-28">PICTURES</th>
                                                  <th className="py-2.5 px-3 font-bold text-center w-24">ACTIONS</th>
                                                </tr>
                                              </thead>
                                              <tbody className="divide-y divide-slate-200 text-xs text-slate-700">
                                                {dayEntries.map((row, idx) => {
                                                  const cumVal = parseFloat(row.workCompletedPercent || "0");
                                                  const cleanCum = isNaN(cumVal) ? 0 : Math.min(100, Math.max(0, cumVal));

                                                  return editingProgressId === row.id ? (
                                                    <tr key={row.id} className="bg-blue-50/40 border-b border-blue-100 animate-fadeIn">
                                                      <td className="py-2 px-2 border-r border-slate-200 text-center">
                                                         {/* Spacer for checkbox column during edit mode */}
                                                       </td>
                                                       <td className="py-2 px-2 text-center border-r border-slate-200 text-slate-400 font-bold font-mono">
                                                        {idx + 1}
                                                      </td>
                                                      <td className="py-2 px-2 border-r border-slate-200">
                                                        <input
                                                          type="text"
                                                          value={editProgressForm.activityName}
                                                          onChange={(e) => setEditProgressForm(prev => ({ ...prev, activityName: e.target.value }))}
                                                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs uppercase font-semibold text-slate-800 focus:ring-1 focus:ring-blue-500 focus:outline-none font-sans"
                                                        />
                                                      </td>
                                                      <td className="py-2 px-2 border-r border-slate-200">
                                                        <input
                                                          type="number"
                                                          min="0"
                                                          max="100"
                                                          value={editProgressForm.workCompletedPercent}
                                                          onChange={(e) => setEditProgressForm(prev => ({ ...prev, workCompletedPercent: e.target.value }))}
                                                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-center focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                          placeholder="0-100"
                                                        />
                                                      </td>
                                                      <td className="py-2 px-2 border-r border-slate-200 text-center">
                                                        <input
                                                          type="date"
                                                          value={editProgressForm.targetDate}
                                                          onChange={(e) => setEditProgressForm(prev => ({ ...prev, targetDate: e.target.value }))}
                                                          className="w-full bg-white border border-slate-300 rounded px-1 py-1 text-xs font-mono text-center focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                      </td>
                                                      <td className="py-2 px-2 border-r border-slate-200">
                                                        <input
                                                          type="number"
                                                          min="0"
                                                          max="100"
                                                          value={editProgressForm.workCompletedTodayPercent}
                                                          onChange={(e) => setEditProgressForm(prev => ({ ...prev, workCompletedTodayPercent: e.target.value }))}
                                                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-center focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                          placeholder="0-100"
                                                        />
                                                      </td>
                                                      <td className="py-2 px-2 border-r border-slate-200">
                                                        <input
                                                          type="number"
                                                          min="0"
                                                          value={editProgressForm.noOfLaborSubcontractor}
                                                          onChange={(e) => setEditProgressForm(prev => ({ ...prev, noOfLaborSubcontractor: e.target.value }))}
                                                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono text-center focus:ring-1 focus:ring-blue-500 focus:outline-none"
                                                        />
                                                      </td>
                                                      <td className="py-2 px-2 border-r border-slate-200">
                                                        <input
                                                          type="text"
                                                          value={editProgressForm.equipment}
                                                          onChange={(e) => setEditProgressForm(prev => ({ ...prev, equipment: e.target.value }))}
                                                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs uppercase focus:ring-1 focus:ring-blue-500 focus:outline-none font-sans"
                                                        />
                                                      </td>
                                                      <td className="py-2 px-2 border-r border-slate-200">
                                                        <input
                                                          type="text"
                                                          value={editProgressForm.remarks}
                                                          onChange={(e) => setEditProgressForm(prev => ({ ...prev, remarks: e.target.value }))}
                                                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs uppercase focus:ring-1 focus:ring-blue-500 focus:outline-none font-sans"
                                                        />
                                                      </td>
                                                      <td className="py-2 px-2 border-r border-slate-200">
                                                        <div className="flex flex-col gap-1.5 items-center justify-center">
                                                          <div className="flex flex-wrap gap-1 max-w-[120px] max-h-[80px] overflow-y-auto justify-center">
                                                            {(editProgressForm.images || []).map((img, idx) => (
                                                              <div key={idx} className="relative w-7 h-7 rounded border border-slate-200 overflow-hidden shrink-0">
                                                                <img 
                                                                  src={img} 
                                                                  className="w-full h-full object-cover cursor-pointer" 
                                                                  onClick={() => setLightbox({ isOpen: true, images: editProgressForm.images, activeIndex: idx, title: "Edit Progress Photo" })} 
                                                                  referrerPolicy="no-referrer" 
                                                                />
                                                                <button 
                                                                  type="button" 
                                                                  onClick={() => setEditProgressForm(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== idx) }))} 
                                                                  className="absolute -top-0.5 -right-0.5 bg-rose-600 rounded-full text-white p-0.5 hover:bg-rose-700 cursor-pointer z-10"
                                                                >
                                                                  <X className="h-1.5 w-1.5" />
                                                                </button>
                                                              </div>
                                                            ))}
                                                          </div>
                                                          <label className="relative inline-flex items-center justify-center px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-[9px] font-bold text-indigo-700 rounded cursor-pointer border border-indigo-100 uppercase tracking-wider text-center">
                                                            Add
                                                            <input 
                                                              type="file" 
                                                              multiple 
                                                              accept="image/*" 
                                                              onChange={async (e) => {
                                                                const files = e.target.files;
                                                                if (files) {
                                                                  const promises = Array.from(files).map((f: any) => compressImage(f));
                                                                  try {
                                                                    const resImgs = await Promise.all(promises);
                                                                    setEditProgressForm(prev => ({ ...prev, images: [...prev.images, ...resImgs] }));
                                                                  } catch (err) { 
                                                                    console.error(err); 
                                                                  }
                                                                }
                                                              }} 
                                                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                                            />
                                                          </label>
                                                        </div>
                                                      </td>
                                                      <td className="py-2 px-2 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                          <button
                                                            onClick={() => handleSaveProgressEdit(row.id)}
                                                            className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg border border-transparent hover:border-emerald-100 transition-colors cursor-pointer inline-flex items-center justify-center"
                                                            title="Save changes"
                                                          >
                                                            <Check className="h-3.5 w-3.5" />
                                                          </button>
                                                          <button
                                                            onClick={() => setEditingProgressId(null)}
                                                            className="p-1 text-slate-500 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-200 transition-colors cursor-pointer inline-flex items-center justify-center"
                                                            title="Cancel"
                                                          >
                                                            <X className="h-3.5 w-3.5" />
                                                          </button>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  ) : (
                                                    <tr key={row.id} className="hover:bg-slate-50/55 transition-colors">
                                                      <td className="py-3 px-2 text-center border-r border-slate-200">
                                                         <input
                                                           type="checkbox"
                                                           checked={selectedProgressRowIds.includes(row.id)}
                                                           onChange={(e) => {
                                                             const isChecked = e.target.checked;
                                                             if (isChecked) {
                                                               setSelectedProgressRowIds(prev => [...prev, row.id]);
                                                             } else {
                                                               setSelectedProgressRowIds(prev => prev.filter(id => id !== row.id));
                                                             }
                                                           }}
                                                           className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-3.5 w-3.5 cursor-pointer"
                                                         />
                                                       </td>
                                                       <td className="py-3 px-3 text-center border-r border-slate-200 text-slate-400 font-bold font-mono">
                                                        {idx + 1}
                                                      </td>
                                                      <td className="py-3 px-4 font-bold border-r border-slate-200 text-slate-900 uppercase">
                                                        {row.activityName || "-"}
                                                      </td>
                                                      <td className="py-3 px-3 border-r border-slate-200">
                                                        <div className="flex items-center gap-2">
                                                          <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                                                            <div 
                                                              className={`h-full rounded-full ${cleanCum === 100 ? "bg-emerald-500" : cleanCum > 50 ? "bg-amber-500" : "bg-blue-500"}`}
                                                              style={{ width: `${cleanCum}%` }}
                                                            ></div>
                                                          </div>
                                                          <span className="font-bold font-mono text-[10px] text-slate-800">{row.workCompletedPercent || "0"}%</span>
                                                        </div>
                                                      </td>
                                                      <td className="py-3 px-3 text-center border-r border-slate-200 text-slate-600 font-semibold font-mono">
                                                        {row.targetDate || "-"}
                                                      </td>
                                                      <td className="py-3 px-3 text-center border-r border-slate-200">
                                                        {row.workCompletedTodayPercent ? (
                                                          <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px]">
                                                            +{row.workCompletedTodayPercent}%
                                                          </span>
                                                        ) : (
                                                          <span className="text-slate-400 font-mono">-</span>
                                                        )}
                                                      </td>
                                                      <td className="py-3 px-3 text-center border-r border-slate-200 font-mono font-bold text-slate-800">
                                                        {row.noOfLaborSubcontractor || "-"}
                                                      </td>
                                                      <td className="py-3 px-4 border-r border-slate-200 text-slate-600 uppercase font-medium">
                                                        {row.equipment || "-"}
                                                      </td>
                                                      <td className="py-3 px-4 border-r border-slate-200 text-slate-600 uppercase font-medium">
                                                        {row.remarks || "-"}
                                                      </td>
                                                      <td className="py-3 px-4 border-r border-slate-200 text-center">
                                                        {row.images && row.images.length > 0 ? (
                                                          <div className="flex flex-wrap gap-1 justify-center max-w-[120px]">
                                                            {row.images.map((img, imgIdx) => (
                                                              <div key={imgIdx} className="w-8 h-8 rounded border border-slate-200 overflow-hidden shadow-2xs hover:scale-105 transition-transform shrink-0">
                                                                <img
                                                                  src={img}
                                                                  alt="Log Photo"
                                                                  className="w-full h-full object-cover cursor-pointer"
                                                                  onClick={() => setLightbox({ isOpen: true, images: row.images || [], activeIndex: imgIdx, title: `${row.activityName || "Activity"} Photo` })}
                                                                  referrerPolicy="no-referrer"
                                                                />
                                                              </div>
                                                            ))}
                                                          </div>
                                                        ) : (
                                                          <span className="text-slate-400 font-mono block text-center">-</span>
                                                        )}
                                                      </td>
                                                      <td className="py-3 px-3 text-center">
                                                        <div className="flex items-center justify-center gap-1.5">
                                                          <button
                                                            onClick={() => {
                                                              setEditingProgressId(row.id);
                                                              setEditProgressForm({
                                                                activityName: row.activityName || "",
                                                                workCompletedPercent: row.workCompletedPercent || "",
                                                                targetDate: row.targetDate || "",
                                                                workCompletedTodayPercent: row.workCompletedTodayPercent || "",
                                                                noOfLaborSubcontractor: row.noOfLaborSubcontractor || "",
                                                                equipment: row.equipment || "",
                                                                remarks: row.remarks || "",
                                                                images: row.images || []
                                                              });
                                                            }}
                                                            className="p-1 text-slate-600 hover:bg-slate-100 rounded-lg border border-transparent hover:border-slate-200 transition-colors cursor-pointer inline-flex items-center justify-center"
                                                            title="Edit log entry"
                                                          >
                                                            <Edit className="h-3.5 w-3.5" />
                                                          </button>
                                                          <button
                                                            onClick={() => handleDeleteItem(row.id, row.activityName || "Log Entry")}
                                                            className="p-1 text-rose-600 hover:bg-rose-50 rounded-lg border border-transparent hover:border-rose-100 transition-colors cursor-pointer inline-flex items-center justify-center"
                                                            title="Delete log entry"
                                                          >
                                                            <Trash2 className="h-3.5 w-3.5" />
                                                          </button>
                                                        </div>
                                                      </td>
                                                    </tr>
                                                  );
                                                })}

                                                {/* Summary row */}
                                                <tr className="bg-[#E2EFDA] text-slate-800 select-none">
                                                  <td className="py-2 px-3 border-r border-slate-300"></td>
                                                  <td className="py-2 px-2 border-r border-slate-300"></td>
                                                   <td className="py-2 px-4 font-bold border-r border-slate-300 text-[10px] uppercase text-[#375623]">TOTAL ACTIVITIES IN SHEET</td>
                                                  <td className="py-2 px-3 border-r border-slate-300 font-bold font-mono text-[11px] text-[#375623]">{dayEntries.length}</td>
                                                  <td className="py-2 px-3 border-r border-slate-300"></td>
                                                  <td className="py-2 px-3 border-r border-slate-300"></td>
                                                  <td className="py-2 px-3 border-r border-slate-300 font-bold font-mono text-[11px] text-[#375623]">
                                                    {dayEntries.reduce((acc, curr) => acc + parseInt(curr.noOfLaborSubcontractor || "0", 10), 0) || "-"}
                                                  </td>
                                                  <td className="py-2 px-4 border-r border-slate-300"></td>
                                                  <td className="py-2 px-4 border-r border-slate-300"></td>
                                                  <td className="py-2 px-4 border-r border-slate-300"></td>
                                                  <td className="py-2 px-3"></td>
                                                </tr>
                                              </tbody>
                                            </table>
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </>
                            ) : (
                              <div className="bg-white rounded-3xl p-12 text-center text-slate-400 border border-slate-200/60 font-medium text-sm">
                                <Calendar className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                Select a date from the browser to view records.
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              );
            })()}

            {/* LABOR CODES & PROJECT CODES CONFIGURATION DASHBOARD */}
            {adminTab === "labor_codes" && (
              <div id="labor-codes-dashboard" className="space-y-6 animate-fadeIn">
                
                {/* Admin Header Commands */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-50 text-slate-700 p-2.5 rounded-xl border border-slate-100">
                      <Key className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 font-display uppercase tracking-tight flex flex-wrap items-center gap-2">
                        <span>Directory Mapping Control Console</span>
                        <span className="inline-flex items-center gap-1 text-[10px] bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full border border-indigo-200 font-bold tracking-normal uppercase">
                          ● Admin Database
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400 font-mono">
                        Manage code dictionaries for automatic form autofill and validation
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2 w-full md:w-auto">
                    <button
                      id="refresh-codes-btn"
                      onClick={async () => {
                        await Promise.all([fetchLaborCodes(), fetchProjectCodes()]);
                        showNotification("Refreshed", "Directories successfully synchronized with cloud database.", "success");
                      }}
                      disabled={isLoadingLaborCodes || isLoadingProjectCodes}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 border border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-500 bg-slate-50 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                    >
                      <RefreshCw className={`h-4 w-4 ${(isLoadingLaborCodes || isLoadingProjectCodes) ? "animate-spin" : ""}`} /> Refresh Live Data
                    </button>

                    <button
                      id="close-console-btn"
                      onClick={() => setCurrentView("form")}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2 border border-slate-200 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer transition-colors"
                    >
                      <LogOut className="h-4 w-4" /> Close Console
                    </button>
                  </div>
                </div>

                {/* Sub-tabs selector for Labor vs Project mapping */}
                <div className="flex border-b border-slate-200 bg-white p-2 rounded-2xl border border-slate-200/60 shadow-2xs gap-1">
                  <button
                    onClick={() => setLaborCodesSubTab("labor_codes")}
                    className={`flex-1 py-3 px-4 rounded-xl text-center font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      laborCodesSubTab === "labor_codes"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Labor Codes Registry
                  </button>
                  <button
                    onClick={() => setLaborCodesSubTab("project_codes")}
                    className={`flex-1 py-3 px-4 rounded-xl text-center font-bold text-xs uppercase tracking-wider transition-all cursor-pointer ${
                      laborCodesSubTab === "project_codes"
                        ? "bg-slate-900 text-white shadow-xs"
                        : "text-slate-400 hover:text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    Project Codes Registry &amp; Locations
                  </button>
                </div>

                {/* SUB-TAB 1: LABOR CODES */}
                {laborCodesSubTab === "labor_codes" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                    
                    {/* Left Column: Input Form */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4 h-fit">
                      <h3 className="font-semibold text-slate-800 uppercase tracking-wider text-xs font-mono border-b border-slate-100 pb-2 flex items-center gap-1.5">
                        <PlusCircle className="h-4 w-4 text-slate-500" /> Add Labor Mapping
                      </h3>
                      
                      {saveLaborCodeError && (
                        <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded text-2xs text-rose-700 flex items-start gap-1.5">
                          <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500" />
                          <span>{saveLaborCodeError}</span>
                        </div>
                      )}

                      <form onSubmit={handleSaveLaborCode} className="space-y-4">
                        <div className="flex flex-col">
                          <label className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1">
                            Labor Code
                          </label>
                          <input
                            id="new-labor-code"
                            type="text"
                            required
                            placeholder="e.g. BL005"
                            value={newLaborCode}
                            onChange={(e) => setNewLaborCode(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-xs font-semibold text-slate-800 uppercase transition-all"
                          />
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1">
                            Labor's Full Name
                          </label>
                          <input
                            id="new-labor-name"
                            type="text"
                            required
                            placeholder="e.g. SANDEEP SINGH"
                            value={newLaborName}
                            onChange={(e) => setNewLaborName(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-xs font-semibold text-slate-800 uppercase transition-all"
                          />
                        </div>

                        <div className="flex flex-col">
                          <label className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1">
                            Designation / Trade
                          </label>
                          <input
                            id="new-labor-designation"
                            type="text"
                            required
                            list="designations-list"
                            placeholder="e.g. CARPENTER, MASON..."
                            value={newLaborDesignation}
                            onChange={(e) => setNewLaborDesignation(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-xs font-semibold text-slate-800 uppercase transition-all"
                          />
                        </div>

                        <button
                          id="save-code-mapping-btn"
                          type="submit"
                          disabled={isSavingLaborCode}
                          className="w-full inline-flex items-center justify-center py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase rounded-xl shadow-sm text-[10px] tracking-wider cursor-pointer disabled:opacity-50 transition-colors"
                        >
                          {isSavingLaborCode ? (
                            <>
                              <RefreshCw className="h-3 w-3 mr-1.5 animate-spin text-white" />
                              SAVING...
                            </>
                          ) : (
                            "SAVE LABOR MAPPING"
                          )}
                        </button>
                      </form>
                    </div>

                    {/* Right Column: Code Mapping Ledger Table */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4.5 w-4.5 text-slate-500" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Labor Mapping Ledger</span>
                        </div>
                        
                        {/* Search code */}
                        <div className="relative w-full sm:max-w-xs">
                          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            id="search-codes-input"
                            type="text"
                            placeholder="Search labor codes or names..."
                            value={laborCodeSearch}
                            onChange={(e) => setLaborCodeSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 bg-white font-medium text-slate-800"
                          />
                        </div>
                      </div>

                      {laborCodesError && (
                        <div className="p-4 bg-rose-50 text-rose-700 text-xs border-b border-rose-100 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-rose-500" />
                          <span>{laborCodesError}</span>
                        </div>
                      )}

                      {isLoadingLaborCodes ? (
                        <div className="p-12 text-center text-slate-500">
                          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-slate-400 mb-2" />
                          Loading mapped labor codes...
                        </div>
                      ) : filteredLaborCodes.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-medium text-xs">
                          No mapped labor codes found.
                        </div>
                      ) : (
                        <div className="overflow-x-auto flex-1">
                          <table id="labor-codes-table" className="w-full text-left border-collapse">
                            <thead className="bg-[#0F172A] text-slate-200 select-none text-[10px] uppercase font-mono tracking-wider border-b border-slate-800">
                              <tr>
                                <th className="py-2.5 px-4 font-bold border-r border-[#1e293b]">LABOR CODE</th>
                                <th className="py-2.5 px-4 font-bold border-r border-[#1e293b]">FULL NAME</th>
                                <th className="py-2.5 px-4 font-bold border-r border-[#1e293b]">DESIGNATION / TRADE</th>
                                <th className="py-2.5 px-4 font-bold text-center">ACTION</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs font-medium">
                              {filteredLaborCodes.map((lc) => (
                                <tr key={lc.id} className="hover:bg-slate-50 transition-colors duration-100 border-b border-slate-200">
                                  {editingLaborId === lc.id ? (
                                    <>
                                      <td className="py-1 px-3 border-r border-slate-200">
                                        <input
                                          type="text"
                                          value={editLaborCode}
                                          onChange={(e) => setEditLaborCode(e.target.value.toUpperCase())}
                                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-[#e11d48] uppercase focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        />
                                      </td>
                                      <td className="py-1 px-3 border-r border-slate-200">
                                        <input
                                          type="text"
                                          value={editLaborName}
                                          onChange={(e) => setEditLaborName(e.target.value.toUpperCase())}
                                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800 uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                      </td>
                                      <td className="py-1 px-3 border-r border-slate-200">
                                        <input
                                          type="text"
                                          list="designations-list"
                                          value={editLaborDesignation}
                                          onChange={(e) => setEditLaborDesignation(e.target.value.toUpperCase())}
                                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800 uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                      </td>
                                      <td className="py-1 px-3 text-center flex items-center justify-center gap-1.5 min-h-[38px]">
                                        <button
                                          onClick={() => handleUpdateLaborCode(lc.id)}
                                          title="Save Changes"
                                          className="p-1 px-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-800 border border-emerald-200 rounded cursor-pointer transition-colors"
                                        >
                                          <Check className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setEditingLaborId(null)}
                                          title="Cancel"
                                          className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 border border-slate-300 rounded cursor-pointer transition-colors"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="py-2 px-4 text-[#e11d48] font-bold font-mono uppercase border-r border-slate-200 bg-indigo-50/5">
                                        {lc.code}
                                      </td>
                                      <td className="py-2 px-4 text-slate-800 font-bold uppercase border-r border-slate-200">
                                        {lc.name}
                                      </td>
                                      <td className="py-2 px-4 text-slate-600 uppercase border-r border-slate-200 font-semibold">
                                        {lc.designation || "HELPER"}
                                      </td>
                                      <td className="py-2 px-4 text-center space-x-1.5">
                                        <button
                                          onClick={() => {
                                            setEditingLaborId(lc.id);
                                            setEditLaborCode(lc.code);
                                            setEditLaborName(lc.name);
                                            setEditLaborDesignation(lc.designation || "HELPER");
                                          }}
                                          title="Edit Mapping"
                                          className="p-1 px-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded cursor-pointer transition-colors"
                                        >
                                          <Edit className="h-3.5 w-3.5 inline" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteLaborCode(lc.id, lc.code)}
                                          title="Delete Mapping"
                                          className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200 rounded cursor-pointer transition-colors"
                                        >
                                          <Trash2 className="h-3.5 w-3.5 inline" />
                                        </button>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>

                  </div>
                )}

                {/* SUB-TAB 2: PROJECT CODES */}
                {laborCodesSubTab === "project_codes" && (
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                    
                    {/* Left Column: Input Form & Delete Select Panel */}
                    <div className="space-y-6 h-fit">
                      {/* Add Project card */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                        <h3 className="font-semibold text-slate-800 uppercase tracking-wider text-xs font-mono border-b border-slate-100 pb-2 flex items-center gap-1.5">
                          <PlusCircle className="h-4 w-4 text-slate-500" /> Add Project Mapping
                        </h3>
                        
                        {saveProjectCodeError && (
                          <div className="bg-rose-50 border-l-4 border-rose-500 p-3 rounded text-2xs text-rose-700 flex items-start gap-1.5">
                            <AlertCircle className="h-4 w-4 flex-shrink-0 text-rose-500" />
                            <span>{saveProjectCodeError}</span>
                          </div>
                        )}

                        <form onSubmit={handleSaveProjectCode} className="space-y-4">
                          <div className="flex flex-col">
                            <label className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1">
                              Project Code
                            </label>
                            <input
                              id="new-project-code"
                              type="text"
                              required
                              placeholder="e.g. P004"
                              value={newProjectCode}
                              onChange={(e) => setNewProjectCode(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-xs font-semibold text-slate-800 uppercase transition-all"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1">
                              Project Name
                            </label>
                            <input
                              id="new-project-name"
                              type="text"
                              required
                              placeholder="e.g. COMMERCIAL TOWER PROJECT"
                              value={newProjectName}
                              onChange={(e) => setNewProjectName(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-xs font-semibold text-slate-800 uppercase transition-all"
                            />
                          </div>

                          <div className="flex flex-col">
                            <label className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1">
                              Site Location
                            </label>
                            <input
                              id="new-project-location"
                              type="text"
                              required
                              placeholder="e.g. AL BARSHA 1ST"
                              value={newProjectLocation}
                              onChange={(e) => setNewProjectLocation(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-xs font-semibold text-slate-800 uppercase transition-all"
                            />
                          </div>

                          <button
                            id="save-project-mapping-btn"
                            type="submit"
                            disabled={isSavingProjectCode}
                            className="w-full inline-flex items-center justify-center py-2.5 px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold uppercase rounded-xl shadow-sm text-[10px] tracking-wider cursor-pointer disabled:opacity-50 transition-colors"
                          >
                            {isSavingProjectCode ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1.5 animate-spin text-white" />
                                SAVING...
                              </>
                            ) : (
                              "SAVE PROJECT MAPPING"
                            )}
                          </button>
                        </form>
                      </div>

                      {/* Select Project to Delete card */}
                      <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4">
                        <h3 className="font-semibold text-rose-600 uppercase tracking-wider text-xs font-mono border-b border-slate-100 pb-2 flex items-center gap-1.5">
                          <Trash2 className="h-4 w-4 text-rose-500" /> Delete Project Mapping
                        </h3>
                        
                        <div className="flex flex-col">
                          <label className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase mb-1">
                            Select Project to Delete
                          </label>
                          <select
                            id="delete-project-select"
                            value={projectToDelete}
                            onChange={(e) => setProjectToDelete(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-950/10 focus:border-slate-700 text-xs font-semibold text-slate-800 uppercase transition-all cursor-pointer"
                          >
                            <option value="">-- Choose Project --</option>
                            {projectCodes.length === 0 ? (
                              <option value="" disabled>No custom database projects available</option>
                            ) : (
                              projectCodes.map((pc) => (
                                <option key={pc.id} value={pc.id}>
                                  {pc.code} - {pc.name}
                                </option>
                              ))
                            )}
                          </select>
                        </div>

                        <button
                          id="delete-selected-project-btn"
                          type="button"
                          disabled={!projectToDelete}
                          onClick={() => {
                            const pc = projectCodes.find(c => c.id === projectToDelete);
                            if (pc) {
                              handleDeleteProjectCode(pc.id, pc.code);
                              setProjectToDelete("");
                            }
                          }}
                          className="w-full inline-flex items-center justify-center py-2.5 px-4 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold uppercase rounded-xl shadow-sm text-[10px] tracking-wider cursor-pointer transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> DELETE SELECTED PROJECT
                        </button>
                      </div>
                    </div>

                    {/* Right Column: Project Mapping Ledger Table */}
                    <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
                      <div className="bg-slate-50 border-b border-slate-100 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                          <FileSpreadsheet className="h-4.5 w-4.5 text-slate-500" />
                          <span className="text-xs font-semibold uppercase tracking-wider text-slate-700">Project Mapping Ledger</span>
                        </div>
                        
                        {/* Search code */}
                        <div className="relative w-full sm:max-w-xs">
                          <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
                          <input
                            id="search-projects-input"
                            type="text"
                            placeholder="Search projects or locations..."
                            value={projectCodeSearch}
                            onChange={(e) => setProjectCodeSearch(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-800 bg-white font-medium text-slate-800"
                          />
                        </div>
                      </div>

                      {projectCodesError && (
                        <div className="p-4 bg-rose-50 text-rose-700 text-xs border-b border-rose-100 flex items-center gap-2">
                          <AlertCircle className="h-5 w-5 text-rose-500" />
                          <span>{projectCodesError}</span>
                        </div>
                      )}

                      {isLoadingProjectCodes ? (
                        <div className="p-12 text-center text-slate-500">
                          <RefreshCw className="h-8 w-8 animate-spin mx-auto text-slate-400 mb-2" />
                          Loading mapped project codes...
                        </div>
                      ) : filteredProjectCodes.length === 0 ? (
                        <div className="p-12 text-center text-slate-400 font-medium text-xs">
                          No mapped project codes found.
                        </div>
                      ) : (
                        <div className="overflow-x-auto flex-1">
                          <table id="project-codes-table" className="w-full text-left border-collapse">
                            <thead className="bg-[#0F172A] text-slate-200 select-none text-[10px] uppercase font-mono tracking-wider border-b border-slate-800">
                              <tr>
                                <th className="py-2.5 px-4 font-bold border-r border-[#1e293b]">PROJECT CODE</th>
                                <th className="py-2.5 px-4 font-bold border-r border-[#1e293b]">PROJECT NAME</th>
                                <th className="py-2.5 px-4 font-bold border-r border-[#1e293b]">SITE LOCATION</th>
                                <th className="py-2.5 px-4 font-bold text-center">ACTION</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs font-medium">
                              {filteredProjectCodes.map((pc) => (
                                <tr key={pc.id} className="hover:bg-slate-50 transition-colors duration-100 border-b border-slate-200">
                                  {editingProjectId === pc.id ? (
                                    <>
                                      <td className="py-1 px-3 border-r border-slate-200">
                                        <input
                                          type="text"
                                          value={editProjectCode}
                                          onChange={(e) => setEditProjectCode(e.target.value.toUpperCase())}
                                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-mono font-bold text-[#e11d48] uppercase focus:outline-none focus:ring-1 focus:ring-rose-500"
                                        />
                                      </td>
                                      <td className="py-1 px-3 border-r border-slate-200">
                                        <input
                                          type="text"
                                          value={editProjectName}
                                          onChange={(e) => setEditProjectName(e.target.value.toUpperCase())}
                                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-800 uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                      </td>
                                      <td className="py-1 px-3 border-r border-slate-200">
                                        <input
                                          type="text"
                                          value={editProjectLocation}
                                          onChange={(e) => setEditProjectLocation(e.target.value.toUpperCase())}
                                          className="w-full bg-white border border-slate-300 rounded px-2 py-1 text-xs font-bold text-slate-600 uppercase focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                        />
                                      </td>
                                      <td className="py-1 px-3 text-center flex items-center justify-center gap-1.5 min-h-[38px]">
                                        <button
                                          onClick={() => handleUpdateProjectCode(pc.id)}
                                          title="Save Changes"
                                          className="p-1 px-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 hover:text-emerald-800 border border-emerald-200 rounded cursor-pointer transition-colors"
                                        >
                                          <Check className="h-3.5 w-3.5" />
                                        </button>
                                        <button
                                          onClick={() => setEditingProjectId(null)}
                                          title="Cancel"
                                          className="p-1 px-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-800 border border-slate-300 rounded cursor-pointer transition-colors"
                                        >
                                          <X className="h-3.5 w-3.5" />
                                        </button>
                                      </td>
                                    </>
                                  ) : (
                                    <>
                                      <td className="py-2 px-4 text-[#e11d48] font-bold font-mono uppercase border-r border-slate-200 bg-indigo-50/5">
                                        {pc.code}
                                      </td>
                                      <td className="py-2 px-4 text-slate-800 font-bold uppercase border-r border-slate-200">
                                        {pc.name}
                                      </td>
                                      <td className="py-2 px-4 text-slate-600 uppercase border-r border-slate-200">
                                        {pc.location}
                                      </td>
                                      <td className="py-2 px-4 text-center space-x-1.5">
                                        <button
                                          onClick={() => {
                                            setEditingProjectId(pc.id);
                                            setEditProjectCode(pc.code);
                                            setEditProjectName(pc.name);
                                            setEditProjectLocation(pc.location);
                                          }}
                                          title="Edit Mapping"
                                          className="p-1 px-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded cursor-pointer transition-colors"
                                        >
                                          <Edit className="h-3.5 w-3.5 inline" />
                                        </button>
                                        <button
                                          onClick={() => handleDeleteProjectCode(pc.id, pc.code)}
                                          title="Delete Mapping"
                                          className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200 rounded cursor-pointer transition-colors"
                                        >
                                          <Trash2 className="h-3.5 w-3.5 inline" />
                                        </button>
                                      </td>
                                    </>
                                  )}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )}

              </div>
            )}

            {adminTab === "security" && (
              <div id="security-settings" className="space-y-6 animate-fade-in">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-slate-50 text-slate-700 p-2.5 rounded-xl border border-slate-100">
                      <Lock className="h-5 w-5 text-slate-700" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-slate-900 font-display uppercase tracking-tight flex flex-wrap items-center gap-2">
                        <span>Security & Access Control Console</span>
                        <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200 font-bold tracking-normal uppercase">
                          ● Active Protection
                        </span>
                      </h2>
                      <p className="text-xs text-slate-400 font-mono">
                        Manage security credentials and passcodes for the Document Controller database
                      </p>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 max-w-xl mx-auto">
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <Shield className="h-4 w-4 text-emerald-500" /> Update Security Passcode
                  </h3>
                  <p className="text-xs text-slate-500 mb-6 leading-relaxed">
                    Change the secure passcode for the Document Controller database. The updated passcode will immediately replace the old one in the Firebase database and must be used for future log ins.
                  </p>

                  <form onSubmit={handlePasscodeChange} className="space-y-4">
                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Current Passcode
                      </label>
                      <input
                        type="password"
                        placeholder="••••••"
                        value={currentChangePasscode}
                        onChange={(e) => setCurrentChangePasscode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all font-mono tracking-widest text-slate-800"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        New Passcode (Min. 4 characters)
                      </label>
                      <input
                        type="password"
                        placeholder="••••••"
                        value={newChangePasscode}
                        onChange={(e) => setNewChangePasscode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all font-mono tracking-widest text-slate-800"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                        Confirm New Passcode
                      </label>
                      <input
                        type="password"
                        placeholder="••••••"
                        value={confirmChangePasscode}
                        onChange={(e) => setConfirmChangePasscode(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900/10 focus:bg-white transition-all font-mono tracking-widest text-slate-800"
                        required
                      />
                    </div>

                    {changePasscodeError && (
                      <div className="p-3 bg-rose-50 text-rose-600 border border-rose-100 text-xs rounded-xl font-medium flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0"></span>
                        <span>{changePasscodeError}</span>
                      </div>
                    )}

                    {changePasscodeSuccess && (
                      <div className="p-3 bg-emerald-50 text-emerald-700 border border-emerald-100 text-xs rounded-xl font-medium flex items-center gap-2">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                        <span>{changePasscodeSuccess}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={changingPasscode}
                      className="w-full py-2.5 bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors shadow-sm flex items-center justify-center gap-2"
                    >
                      {changingPasscode ? (
                        <>
                          <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Updating Passcode...
                        </>
                      ) : (
                        <>
                          <Check className="h-3.5 w-3.5" /> Save Security Passcode
                        </>
                      )}
                    </button>
                  </form>
                </div>
              </div>
            )}
              </div>
            )}
          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="font-semibold block text-slate-300">© 2026 BIN LAHEJ GENERAL MAINTENANCE L.L.C</span>
            <span className="text-slate-500">External labor log system data record log. All Rights Reserved.</span>
            <span className="text-slate-500 flex items-center justify-center sm:justify-start gap-1 mt-1">
              This system Created By KRISTHEL JADE OCDE <Heart className="h-3.5 w-3.5 text-rose-500 fill-rose-500 animate-pulse inline" />
            </span>
          </div>
          <div className="flex items-center gap-4">
            {currentView === "form" ? (
              <button 
                id="footer-admin-link"
                onClick={() => setCurrentView("admin")} 
                className="text-amber-400 hover:text-amber-300 font-bold transition-colors uppercase tracking-wider text-2xs cursor-pointer"
              >
                🔒 Document Controller Database Access
              </button>
            ) : (
              <button 
                id="footer-form-link"
                onClick={() => setCurrentView("form")} 
                className="text-sky-400 hover:text-sky-300 font-bold transition-colors uppercase tracking-wider text-2xs cursor-pointer"
              >
                ✏ Public Logging Form Screen
              </button>
            )}
          </div>
        </div>
      </footer>

      {/* CUSTOM CONFIRMATION DIALOG MODAL */}
      {confirmState.isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-md w-full overflow-hidden transform scale-100 transition-all animate-slide-in">
            <div className="p-6">
              <div className="flex items-start gap-4">
                <div className="bg-rose-50 text-rose-600 p-3 rounded-2xl border border-rose-100">
                  <AlertCircle className="h-6 w-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display uppercase tracking-tight">
                    {confirmState.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
                    {confirmState.message}
                  </p>
                </div>
              </div>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-600 hover:bg-slate-200/60 rounded-xl transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  confirmState.onConfirm();
                }}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wide text-white bg-rose-600 hover:bg-rose-700 rounded-xl transition-all shadow-md shadow-rose-200 cursor-pointer"
              >
                {confirmState.confirmText}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CUSTOM NOTIFICATION TOAST */}
      {notificationState.isOpen && (
        <div className="fixed bottom-6 right-6 z-55 max-w-sm w-full bg-white rounded-2xl border border-slate-200 shadow-xl p-4 flex items-start gap-3 animate-slide-in">
          <div className={`p-2 rounded-xl border ${
            notificationState.type === "success" 
              ? "bg-emerald-50 text-emerald-600 border-emerald-100" 
              : notificationState.type === "error"
              ? "bg-rose-50 text-rose-600 border-rose-100"
              : "bg-blue-50 text-blue-600 border-blue-100"
          }`}>
            {notificationState.type === "success" ? (
              <CheckCircle2 className="h-5 w-5 animate-bounce" />
            ) : notificationState.type === "error" ? (
              <AlertCircle className="h-5 w-5" />
            ) : (
              <Info className="h-5 w-5" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
              {notificationState.title}
            </h4>
            <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
              {notificationState.message}
            </p>
          </div>
          <button
            onClick={() => setNotificationState(prev => ({ ...prev, isOpen: false }))}
            className="text-slate-400 hover:text-slate-600 text-sm font-bold font-mono px-1.5 py-0.5 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
          >
            ×
          </button>
        </div>
      )}

      {/* SEPARATE LEDGER RECORD VIEWER MODAL */}
      {activeViewFile.isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-900/75 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-6xl w-full h-[90vh] md:h-[85vh] flex flex-col overflow-hidden transform scale-100 transition-all animate-slide-in">
            
            {/* Modal Header */}
            <div className="bg-[#0F172A] p-5 md:p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl ${activeViewFile.type === "daily" ? "bg-rose-500/10 text-rose-400 border border-rose-500/20" : "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"}`}>
                  {activeViewFile.type === "daily" ? <Calendar className="h-6 w-6" /> : <FileText className="h-6 w-6" />}
                </div>
                <div>
                  <h3 className="text-base font-bold uppercase tracking-tight flex items-center gap-2">
                    {activeViewFile.type === "daily" ? "Daily Ledger Records" : "Monthly Ledger Records"}
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${activeViewFile.type === "daily" ? "bg-rose-950 text-rose-400 border-rose-800" : "bg-indigo-950 text-indigo-400 border-indigo-800"}`}>
                      {activeViewFile.date}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-md">
                    File: {activeViewFile.filename}
                  </p>
                </div>
              </div>

              {/* Action buttons inside Modal Header */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    const formattedTitle = activeViewFile.type === "daily" 
                      ? `DAILY LEDGER LOG FOR ${activeViewFile.date}`
                      : `MONTHLY LEDGER LOG FOR ${activeViewFile.date}`;
                    const pdfName = activeViewFile.filename.replace(".json", ".pdf");
                    exportSpecificRecordsToPDF(activeViewFile.records, formattedTitle, pdfName);
                  }}
                  disabled={activeViewFile.isLoading || activeViewFile.records.length === 0}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" /> Export PDF
                </button>
                <a
                  href={`/api/ledger-files/download/${activeViewFile.type}/${activeViewFile.filename}?format=csv`}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
                </a>
                <a
                  href={`/api/ledger-files/download/${activeViewFile.type}/${activeViewFile.filename}?format=json`}
                  download
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                >
                  <Download className="h-3.5 w-3.5" /> Export JSON
                </a>
                <button
                  onClick={() => setActiveViewFile(prev => ({ ...prev, isOpen: false }))}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Close viewer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 p-5 md:p-6">
              
              {activeViewFile.isLoading ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-500">
                  <RefreshCw className="h-10 w-10 animate-spin text-indigo-500 mb-3" />
                  <span className="font-bold text-slate-700">Fetching records...</span>
                  <span className="text-xs text-slate-400 mt-1 font-mono">Parsing JSON payload from secure ledger storage...</span>
                </div>
              ) : activeViewFile.error ? (
                <div className="flex-1 flex flex-col items-center justify-center text-rose-500 p-6 border border-dashed border-rose-200 rounded-2xl bg-rose-50/50">
                  <AlertCircle className="h-12 w-12 text-rose-400 mb-3" />
                  <span className="font-bold text-rose-700">{activeViewFile.error}</span>
                  <button
                    onClick={() => handleViewLedgerFile(activeViewFile.type, activeViewFile.filename, activeViewFile.date)}
                    className="mt-4 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                  >
                    Retry Loading
                  </button>
                </div>
              ) : (
                <>
                  {/* Internal filter and metadata summary bar */}
                  <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col sm:flex-row gap-3 items-center justify-between mb-4 shrink-0">
                    <div className="relative w-full sm:max-w-xs">
                      <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search records in this file..."
                        value={activeViewFile.searchTerm}
                        onChange={(e) => setActiveViewFile(prev => ({ ...prev, searchTerm: e.target.value }))}
                        className="w-full bg-slate-50/80 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/25 focus:bg-white transition-all text-slate-800"
                      />
                      {activeViewFile.searchTerm && (
                        <button
                          onClick={() => setActiveViewFile(prev => ({ ...prev, searchTerm: "" }))}
                          className="absolute right-3 top-2 text-slate-400 hover:text-slate-600 font-bold"
                        >
                          ×
                        </button>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 text-xs font-semibold">
                      <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-full border border-slate-200">
                        Total Sheet Rows: {activeViewFile.records.length}
                      </span>
                      {activeViewFile.searchTerm && (
                        <span className="bg-indigo-50 text-indigo-700 px-3 py-1 rounded-full border border-indigo-100">
                          Filtered Matches: {
                            activeViewFile.records.filter(r => 
                              (r.laborsName || "").toLowerCase().includes(activeViewFile.searchTerm.toLowerCase()) ||
                              (r.project || "").toLowerCase().includes(activeViewFile.searchTerm.toLowerCase()) ||
                              (r.siteEngineer || "").toLowerCase().includes(activeViewFile.searchTerm.toLowerCase()) ||
                              (r.designation || "").toLowerCase().includes(activeViewFile.searchTerm.toLowerCase()) ||
                              (r.projectLocation || "").toLowerCase().includes(activeViewFile.searchTerm.toLowerCase()) ||
                              (r.reassignedTask || "").toLowerCase().includes(activeViewFile.searchTerm.toLowerCase())
                            ).length
                          }
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Records Table View */}
                  <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-inner overflow-hidden flex flex-col">
                    <div className="overflow-auto flex-1">
                      <table className="w-full text-left border-collapse min-w-[800px]">
                        <thead className="bg-[#0F172A] text-slate-200 sticky top-0 z-10 text-[10px] uppercase font-mono tracking-wider border-b border-slate-800">
                          <tr>
                            <th className="py-3 px-4 font-bold border-r border-[#1e293b]">DATE</th>
                            <th className="py-3 px-4 font-bold border-r border-[#1e293b]">PROJECT</th>
                            <th className="py-3 px-4 font-bold border-r border-[#1e293b]">LABOR NAME</th>
                            <th className="py-3 px-4 font-bold border-r border-[#1e293b]">DESIGNATION</th>
                            <th className="py-3 px-4 font-bold border-r border-[#1e293b]">LOCATION</th>
                            <th className="py-3 px-4 font-bold border-r border-[#1e293b]">SITE ENGINEER</th>
                            <th className="py-3 px-4 font-bold border-r border-[#1e293b]">ASSIGNED TASK</th>
                            <th className="py-3 px-4 font-bold text-center">ATTENDANCE</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-xs font-medium">
                          {(() => {
                            const filtered = activeViewFile.records.filter(r => {
                              const s = activeViewFile.searchTerm.toLowerCase();
                              if (!s) return true;
                              return (
                                (r.laborsName || "").toLowerCase().includes(s) ||
                                (r.project || "").toLowerCase().includes(s) ||
                                (r.siteEngineer || "").toLowerCase().includes(s) ||
                                (r.designation || "").toLowerCase().includes(s) ||
                                (r.projectLocation || "").toLowerCase().includes(s) ||
                                (r.reassignedTask || "").toLowerCase().includes(s)
                              );
                            });

                            if (filtered.length === 0) {
                              return (
                                <tr>
                                  <td colSpan={8} className="py-12 text-center text-slate-400">
                                    No records found matching your file filter query.
                                  </td>
                                </tr>
                              );
                            }

                            return filtered.map((r, idx) => (
                              <tr key={idx} className="hover:bg-slate-50/55 transition-colors border-b border-slate-100">
                                <td className="py-2.5 px-4 text-slate-500 font-mono whitespace-nowrap border-r border-slate-100">{r.date}</td>
                                <td className="py-2.5 px-4 text-slate-800 font-bold uppercase border-r border-slate-100">{r.project}</td>
                                <td className="py-2.5 px-4 text-slate-900 font-bold uppercase border-r border-slate-100">{r.laborsName}</td>
                                <td className="py-2.5 px-4 text-slate-600 border-r border-slate-100">
                                  <span className="bg-indigo-50 text-indigo-700 border border-indigo-100 text-[10px] px-2 py-0.5 rounded font-bold font-mono">
                                    {r.designation}
                                  </span>
                                </td>
                                <td className="py-2.5 px-4 text-slate-600 uppercase border-r border-slate-100">{r.projectLocation || "-"}</td>
                                <td className="py-2.5 px-4 text-slate-700 font-bold uppercase border-r border-slate-100">{r.siteEngineer}</td>
                                <td className="py-2.5 px-4 text-slate-600 uppercase leading-relaxed max-w-xs truncate border-r border-slate-100" title={r.reassignedTask}>
                                  {r.reassignedTask}
                                </td>
                                <td className="py-2.5 px-4 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase whitespace-nowrap inline-block ${
                                    (r.attendanceStatus || "Present") === "Present"
                                      ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                                      : (r.attendanceStatus || "Present") === "Absent"
                                      ? "bg-rose-100 text-rose-800 border border-rose-200"
                                      : "bg-amber-100 text-amber-800 border border-amber-200"
                                  }`}>
                                    {r.attendanceStatus || "Present"}
                                  </span>
                                </td>
                              </tr>
                            ));
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </>
              )}
            </div>
            
            {/* Modal Footer */}
            <div className="bg-slate-100 px-6 py-4 flex items-center justify-between border-t border-slate-200/60 shrink-0">
              <span className="text-[10px] text-slate-400 font-mono">
                System: SECURE DOCUMENT CONTROLLER VIEWER ENGINE .
              </span>
              <button
                type="button"
                onClick={() => setActiveViewFile(prev => ({ ...prev, isOpen: false }))}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Close Viewer
              </button>
            </div>

          </div>
        </div>
      )}

      {/* SEPARATE PROGRESS MONITORING SHEET VIEWER MODAL */}
      {viewingProgressSheet && viewingProgressSheet.isOpen && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-900/75 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-6xl w-full h-[90vh] md:h-[85vh] flex flex-col overflow-hidden transform scale-100 transition-all animate-slide-in">
            
            {/* Modal Header */}
            <div className="bg-[#0F172A] p-5 md:p-6 text-white flex flex-col md:flex-row md:items-center justify-between gap-4 shrink-0 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Calendar className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold uppercase tracking-tight flex items-center gap-2">
                    Daily Progress Log Sheet
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-emerald-950 text-emerald-400 border-emerald-800">
                      {viewingProgressSheet.date}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5 truncate max-w-md">
                    Project: {viewingProgressSheet.projectName} ({viewingProgressSheet.projectCode})
                  </p>
                </div>
              </div>

              {/* Action buttons inside Modal Header */}
              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => exportSingleProgressSheetPDF(
                    viewingProgressSheet.projectCode,
                    viewingProgressSheet.projectName,
                    viewingProgressSheet.date,
                    viewingProgressSheet.records
                  )}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                >
                  <FileText className="h-3.5 w-3.5" /> Export PDF
                </button>
                <button
                  onClick={() => exportSingleProgressSheetCSV(
                    viewingProgressSheet.projectCode,
                    viewingProgressSheet.projectName,
                    viewingProgressSheet.date,
                    viewingProgressSheet.records
                  )}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                >
                  <FileSpreadsheet className="h-3.5 w-3.5" /> Export CSV
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                >
                  <Printer className="h-3.5 w-3.5" /> Print
                </button>
                <button
                  onClick={() => setViewingProgressSheet(null)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                  title="Close viewer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="flex-1 flex flex-col overflow-hidden bg-slate-50/50 p-5 md:p-6">
              
              {/* Sheet Metadata Banner */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col md:flex-row gap-4 items-stretch justify-between mb-4 shrink-0">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono mb-0.5">DATE</span>
                    <span className="font-semibold text-slate-800">{viewingProgressSheet.date}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono mb-0.5">PROJECT CODE</span>
                    <span className="font-mono font-bold text-slate-800">{viewingProgressSheet.projectCode}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono mb-0.5">PROJECT NAME</span>
                    <span className="font-bold text-slate-900 uppercase">{viewingProgressSheet.projectName}</span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block font-mono mb-0.5">LOCATION</span>
                    <span className="font-semibold text-slate-600 uppercase">{viewingProgressSheet.projectLocation || "N/A"}</span>
                  </div>
                </div>
                
                <div className="border-l border-slate-200 pl-4 flex items-center gap-4">
                  <div>
                    <span className="text-[9px] font-bold text-slate-400 uppercase block font-mono">SITE ENGINEER IN-CHARGE</span>
                    <span className="text-xs font-bold text-slate-800 uppercase">{viewingProgressSheet.records[0]?.siteEngineer || "N/A"}</span>
                  </div>
                </div>
              </div>

              {/* Records Table */}
              <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-inner overflow-hidden flex flex-col">
                <div className="overflow-auto flex-1">
                  <table className="w-full text-left border-collapse min-w-[800px]">
                    <thead className="bg-[#1F4E78] text-white sticky top-0 z-10 text-[10px] uppercase font-mono tracking-wider border-b border-slate-300">
                      <tr>
                        <th className="py-3 px-3 font-bold text-center w-16 border-r border-[#153a5b]">S/NO.</th>
                        <th className="py-3 px-4 font-bold border-r border-[#153a5b]">NAME OF ACTIVITY</th>
                        <th className="py-3 px-3 font-bold text-center w-40 border-r border-[#153a5b]">% WORK COMPLETED</th>
                        <th className="py-3 px-3 font-bold text-center w-32 border-r border-[#153a5b]">TARGET DATE</th>
                        <th className="py-3 px-3 font-bold text-center w-40 border-r border-[#153a5b]">WORK COMPLETED TODAY</th>
                        <th className="py-3 px-3 font-bold text-center w-40 border-r border-[#153a5b]">NO. LABOR</th>
                        <th className="py-3 px-4 font-bold border-r border-[#153a5b]">EQUIPMENT</th>
                        <th className="py-3 px-4 font-bold border-r border-[#153a5b]">REMARKS</th>
                        <th className="py-3 px-4 font-bold text-center w-28">PICTURES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs font-medium">
                      {viewingProgressSheet.records.map((r, idx) => {
                        const cumVal = parseFloat(r.workCompletedPercent || "0");
                        const cleanCum = isNaN(cumVal) ? 0 : Math.min(100, Math.max(0, cumVal));
                        return (
                          <tr key={idx} className="hover:bg-slate-50/55 transition-colors border-b border-slate-100">
                            <td className="py-2.5 px-3 text-center border-r border-slate-100 text-slate-400 font-bold font-mono">{idx + 1}</td>
                            <td className="py-2.5 px-4 text-slate-900 font-bold uppercase border-r border-slate-100">{r.activityName || "-"}</td>
                            <td className="py-2.5 px-3 border-r border-slate-100">
                              <div className="flex items-center gap-2 justify-center">
                                <div className="w-20 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                                  <div 
                                    className={`h-full rounded-full ${cleanCum === 100 ? "bg-emerald-500" : cleanCum > 50 ? "bg-amber-500" : "bg-blue-500"}`}
                                    style={{ width: `${cleanCum}%` }}
                                  ></div>
                                </div>
                                <span className="font-bold font-mono text-[10px] text-slate-800">{r.workCompletedPercent || "0"}%</span>
                              </div>
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-100 text-slate-600 font-semibold font-mono">{r.targetDate || "-"}</td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-100">
                              {r.workCompletedTodayPercent ? (
                                <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px]">
                                  +{r.workCompletedTodayPercent}%
                                </span>
                              ) : (
                                <span className="text-slate-400 font-mono">-</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-center border-r border-slate-100 font-mono font-bold text-slate-800">
                              {r.noOfLaborSubcontractor || "-"}
                            </td>
                            <td className="py-2.5 px-4 text-slate-600 uppercase border-r border-slate-100">{r.equipment || "-"}</td>
                            <td className="py-2.5 px-4 text-slate-600 uppercase border-r border-slate-100">{r.remarks || "-"}</td>
                            <td className="py-2.5 px-4 text-center">
                              {r.images && r.images.length > 0 ? (
                                <div className="flex flex-wrap gap-1 justify-center max-w-[120px]">
                                  {r.images.map((img, imgIdx) => (
                                    <div key={imgIdx} className="w-8 h-8 rounded border border-slate-200 overflow-hidden shadow-2xs hover:scale-105 transition-transform shrink-0">
                                      <img
                                        src={img}
                                        alt="Log Photo"
                                        className="w-full h-full object-cover cursor-pointer"
                                        onClick={() => setLightbox({ isOpen: true, images: r.images || [], activeIndex: imgIdx, title: `${r.activityName || "Activity"} Photo` })}
                                        referrerPolicy="no-referrer"
                                      />
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <span className="text-slate-400 font-mono block text-center">-</span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                    </table>
                </div>
              </div>
            </div>
            
            {/* Modal Footer */}
            <div className="bg-slate-100 px-6 py-4 flex items-center justify-between border-t border-slate-200/60 shrink-0">
              <span className="text-[10px] text-slate-400 font-mono">
                System: SECURE ACTIVITY LOGS PRESENTATION CONTROLLER .
              </span>
              <button
                type="button"
                onClick={() => setViewingProgressSheet(null)}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Close Sheet
              </button>
            </div>

          </div>
        </div>
      )}
          {/* ENGINEER DEDICATED CONTROL PORTAL MODAL */}
      {isEngineerPortalOpen && portalSelectedEngineer && (
        <div className="fixed inset-0 z-55 flex items-center justify-center p-4 sm:p-6 md:p-10 bg-slate-900/75 backdrop-blur-md animate-fade-in">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl max-w-7xl w-full h-[90vh] md:h-[85vh] flex flex-col overflow-hidden transform scale-100 transition-all animate-slide-in">
            
            {/* Modal Header */}
            <div className="bg-[#1e1b4b] p-5 md:p-6 text-white flex items-center justify-between gap-4 shrink-0 border-b border-indigo-900">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  <UserCheck className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold uppercase tracking-tight flex items-center gap-2">
                    Engineer Control Portal
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full border bg-indigo-950 text-indigo-400 border-indigo-800 uppercase">
                      {portalSelectedEngineer}
                    </span>
                  </h3>
                  <p className="text-xs text-indigo-200 mt-0.5">
                    Access, edit, and update your saved daily progress monitoring entries.
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsEngineerPortalOpen(false);
                  setEditingEngineerRecordId(null);
                }}
                className="p-2 text-slate-400 hover:text-white hover:bg-indigo-900 rounded-xl transition-colors cursor-pointer"
                title="Close Portal"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search & Filter Bar */}
            <div className="bg-slate-50 border-b border-slate-150 p-4 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
              <div className="relative w-full sm:max-w-xs">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search entries..."
                  value={engineerSearchQuery}
                  onChange={(e) => setEngineerSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                />
              </div>
              <div className="text-[10px] font-mono font-bold text-indigo-600 uppercase tracking-widest">
                SHOWING SUBMITTED ACTIVITY LOGS
              </div>
            </div>

            {/* Main Content Area */}
            {(() => {
              // 1. Gather all logs for the engineer
              const allEngineerLogs = submissions.filter(s => {
                const matchesEngineer = (s.siteEngineer || "").toUpperCase() === portalSelectedEngineer.toUpperCase();
                const isProgressLog = !!(s.activityName || s.workCompletedPercent || s.targetDate || s.workCompletedTodayPercent || s.noOfLaborSubcontractor || s.equipment);
                
                if (!matchesEngineer || !isProgressLog) return false;
                
                if (engineerSearchQuery.trim()) {
                  const q = engineerSearchQuery.toLowerCase();
                  return (
                    (s.activityName || "").toLowerCase().includes(q) ||
                    (s.project || "").toLowerCase().includes(q) ||
                    (s.date || "").toLowerCase().includes(q) ||
                    (s.remarks || "").toLowerCase().includes(q) ||
                    (s.equipment || "").toLowerCase().includes(q)
                  );
                }
                return true;
              });

              // Sort logs by date descending, then createdAt descending
              allEngineerLogs.sort((a, b) => {
                const dateComp = (b.date || "").localeCompare(a.date || "");
                if (dateComp !== 0) return dateComp;
                return (b.createdAt || "").localeCompare(a.createdAt || "");
              });

              // 2. Group logs by project
              const logsByProject: { [projectCode: string]: Submission[] } = {};
              allEngineerLogs.forEach(log => {
                const pCode = (log.project || "UNASSIGNED").toUpperCase().trim();
                if (!logsByProject[pCode]) {
                  logsByProject[pCode] = [];
                }
                logsByProject[pCode].push(log);
              });

              const uniqueProjectCodes = Object.keys(logsByProject).sort();

              // Get actual projects available to match details (or fallback)
              const combinedProjectCodes = projectCodes.length > 0 ? projectCodes : DEFAULT_PROJECT_CODES;

              // Filter logs according to selected project in portal
              const filteredLogs = allEngineerLogs.filter(log => {
                if (engineerPortalActiveProject === "ALL") return true;
                return (log.project || "").toUpperCase().trim() === engineerPortalActiveProject;
              });

              const activeProjInfo = engineerPortalActiveProject !== "ALL" 
                ? combinedProjectCodes.find(pc => pc.code.toUpperCase() === engineerPortalActiveProject)
                : null;
              const activeProjName = activeProjInfo ? activeProjInfo.name : `${engineerPortalActiveProject} PROJECT`;
              const activeProjLoc = activeProjInfo ? activeProjInfo.location : "";

              return (
                <div className="flex-1 flex flex-col md:flex-row overflow-hidden bg-slate-50/50">
                  {/* Left Sidebar - Projects list */}
                  <div className={`w-full md:w-72 border-b md:border-b-0 md:border-r border-slate-200 bg-white flex flex-col shrink-0 overflow-y-auto ${
                    engineerPortalMobileView === "logs" ? "hidden md:flex" : "flex"
                  }`}>
                    <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
                      <span className="text-[11px] font-mono font-bold text-indigo-950 uppercase tracking-widest flex items-center gap-1.5">
                        <Briefcase className="h-4 w-4 text-indigo-600" /> Site Projects
                      </span>
                      <span className="text-[9px] font-mono font-bold text-slate-400 bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded-md">
                        {uniqueProjectCodes.length} {uniqueProjectCodes.length === 1 ? 'Project' : 'Projects'}
                      </span>
                    </div>

                    <div className="p-3 space-y-1">
                      {/* "All Projects" Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setEngineerPortalActiveProject("ALL");
                          setEditingEngineerRecordId(null);
                          setNewActivityForm(prev => ({
                            ...prev,
                            project: "",
                            projectLocation: ""
                          }));
                          setAddActivityError("");
                          setIsAddingActivity(false);
                          setEngineerPortalMobileView("logs");
                        }}
                        className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer ${
                          engineerPortalActiveProject === "ALL"
                            ? "bg-indigo-950 text-white border-transparent shadow-sm"
                            : "bg-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-transparent"
                        }`}
                      >
                        <div className="flex items-center justify-between w-full">
                          <span className="text-xs font-bold uppercase tracking-wide">All Projects</span>
                          <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                            engineerPortalActiveProject === "ALL"
                              ? "bg-indigo-800 text-indigo-100"
                              : "bg-slate-100 text-slate-500"
                          }`}>
                            {allEngineerLogs.length}
                          </span>
                        </div>
                        <span className={`text-[10px] block ${
                          engineerPortalActiveProject === "ALL" ? "text-indigo-200" : "text-slate-400"
                        }`}>
                          Show all logs across all sites
                        </span>
                      </button>

                      {/* Project-specific Buttons */}
                      {uniqueProjectCodes.map((pCode) => {
                        const logsForProj = logsByProject[pCode] || [];
                        const count = logsForProj.length;
                        const pc = combinedProjectCodes.find(c => c.code.toUpperCase() === pCode);
                        const pName = pc ? pc.name : `${pCode} PROJECT`;
                        const pLocation = pc ? pc.location : (logsForProj[0]?.projectLocation || "");
                        const isSelected = engineerPortalActiveProject === pCode;

                        return (
                          <div
                            key={pCode}
                            onClick={() => {
                              setEngineerPortalActiveProject(pCode);
                              setEditingEngineerRecordId(null);
                              setNewActivityForm(prev => ({
                                ...prev,
                                project: pCode,
                                projectLocation: pLocation
                              }));
                              setAddActivityError("");
                              setEngineerPortalMobileView("logs");
                            }}
                            className={`w-full text-left p-3 rounded-xl border transition-all flex flex-col gap-1 cursor-pointer ${
                              isSelected
                                ? "bg-indigo-950 text-white border-transparent shadow-sm"
                                : "bg-transparent text-slate-700 hover:bg-slate-50 hover:text-slate-900 border-transparent"
                            }`}
                          >
                            <div className="flex items-center justify-between w-full">
                              <span className="text-xs font-bold uppercase tracking-wide font-mono">{pCode}</span>
                              <span className={`text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full ${
                                isSelected
                                  ? "bg-indigo-800 text-indigo-100"
                                  : "bg-slate-100 text-slate-500"
                              }`}>
                                {count}
                              </span>
                            </div>
                            <span className={`text-[11px] font-bold block uppercase tracking-tight truncate ${
                              isSelected ? "text-white" : "text-slate-850"
                            }`} title={pName}>
                              {pName}
                            </span>
                            {pLocation && (
                              <span className={`text-[10px] block font-medium uppercase truncate ${
                                isSelected ? "text-indigo-200" : "text-slate-400"
                              }`} title={pLocation}>
                                {pLocation}
                              </span>
                            )}
                            
                            {/* Inline Add Activity Button directly inside each recorded project */}
                            <div className="mt-2.5 pt-2.5 border-t border-slate-100/10 flex justify-between items-center">
                              <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-slate-400">RECORDED PROJECT</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setEngineerPortalActiveProject(pCode);
                                  setEditingEngineerRecordId(null);
                                  setNewActivityForm({
                                    project: pCode,
                                    projectLocation: pLocation,
                                    date: new Date().toISOString().split("T")[0],
                                    activityName: "",
                                    workCompletedPercent: "",
                                    targetDate: "",
                                    workCompletedTodayPercent: "",
                                    noOfLaborSubcontractor: "",
                                    equipment: "",
                                    remarks: ""
                                  });
                                  setAddActivityError("");
                                  setIsAddingActivity(true);
                                  setEngineerPortalMobileView("logs");
                                }}
                                className={`inline-flex items-center gap-1 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md shadow-xs transition-colors cursor-pointer ${
                                  isSelected 
                                    ? "bg-indigo-600 hover:bg-indigo-700 text-white" 
                                    : "bg-indigo-50 hover:bg-indigo-100 text-indigo-600"
                                }`}
                              >
                                <Plus className="h-2.5 w-2.5" /> Add Activity
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Right Panel - Log details & table */}
                  <div className={`flex-1 overflow-y-auto p-4 md:p-6 space-y-4 flex flex-col ${
                    engineerPortalMobileView === "projects" ? "hidden md:flex" : "flex"
                  }`}>
                    {/* Mobile Back Button */}
                    <div className="md:hidden flex items-center mb-1">
                      <button
                        type="button"
                        onClick={() => setEngineerPortalMobileView("projects")}
                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-bold uppercase tracking-wider text-indigo-650 bg-indigo-50 hover:bg-indigo-100/80 rounded-xl transition-all cursor-pointer shadow-2xs"
                      >
                        <ChevronLeft className="h-4 w-4" /> Back to Site Projects
                      </button>
                    </div>

                    {/* Selected Project Header */}
                    <div className="bg-white border border-slate-200/80 rounded-2xl p-4 md:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs shrink-0">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded-lg border border-indigo-100 uppercase">
                            {engineerPortalActiveProject === "ALL" ? "GLOBAL VIEW" : "PROJECT ACCESS"}
                          </span>
                          {engineerPortalActiveProject !== "ALL" && (
                            <span className="text-[10px] font-mono font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100 uppercase">
                              ACTIVE
                            </span>
                          )}
                        </div>
                        <h4 className="text-sm font-bold text-slate-850 uppercase tracking-tight flex items-center gap-1.5 mt-1">
                          {engineerPortalActiveProject === "ALL" ? (
                            "All Projects Portfolio"
                          ) : (
                            <>
                              Project {engineerPortalActiveProject}
                            </>
                          )}
                        </h4>
                        <p className="text-[11px] text-slate-500 font-medium">
                          {engineerPortalActiveProject === "ALL" ? (
                            "Viewing all daily progress logs registered under your profile."
                          ) : (
                            <>
                              Managing activities and progress records for <strong className="text-indigo-600 font-semibold uppercase">{activeProjName}</strong> at <strong className="text-slate-700 font-semibold uppercase">{activeProjLoc || "N/A"}</strong>.
                            </>
                          )}
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
                        {engineerPortalActiveProject !== "ALL" && (
                          <div className="flex flex-col text-right">
                            <span className="text-[9px] font-mono font-bold text-slate-400 uppercase tracking-wider">PROJECT SITE CODE</span>
                            <span className="text-xs font-bold font-mono text-slate-800 mt-0.5 uppercase bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-lg inline-block text-center min-w-[70px]">
                              {engineerPortalActiveProject}
                            </span>
                          </div>
                        )}
                        {engineerPortalActiveProject !== "ALL" && (
                          <button
                            type="button"
                            onClick={() => {
                              setNewActivityForm({
                                project: engineerPortalActiveProject === "ALL" ? "" : engineerPortalActiveProject,
                                projectLocation: engineerPortalActiveProject === "ALL" ? "" : (activeProjLoc || ""),
                                date: new Date().toISOString().split("T")[0],
                                activityName: "",
                                workCompletedPercent: "",
                                targetDate: "",
                                workCompletedTodayPercent: "",
                                noOfLaborSubcontractor: "",
                                equipment: "",
                                remarks: ""
                              });
                              setAddActivityError("");
                              setIsAddingActivity(!isAddingActivity);
                            }}
                            className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition-all ${
                              isAddingActivity 
                                ? "bg-rose-600 hover:bg-rose-700 text-white" 
                                : "bg-indigo-600 hover:bg-indigo-700 text-white"
                            }`}
                          >
                            {isAddingActivity ? (
                              <>
                                <X className="h-4 w-4" /> Cancel Activity
                              </>
                            ) : (
                              <>
                                <Plus className="h-4 w-4" /> Add Activity
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Add Activity Inline Panel */}
                    {isAddingActivity && (
                      <div className="bg-white border-2 border-indigo-100 rounded-2xl p-4 md:p-6 shadow-md space-y-4 animate-slide-down shrink-0">
                        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                          <div className="flex items-center gap-2">
                            <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg">
                              <Plus className="h-4 w-4" />
                            </div>
                            <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-950">Add New Daily Activity Record</h5>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => setIsAddingActivity(false)}
                            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg cursor-pointer"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>

                        {addActivityError && (
                          <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs font-semibold px-4 py-3 rounded-xl flex items-center gap-2">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>{addActivityError}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                          {/* Project Code selection */}
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Project Site Code *
                            </label>
                            {engineerPortalActiveProject !== "ALL" ? (
                              <input
                                type="text"
                                readOnly
                                value={newActivityForm.project}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-500 cursor-not-allowed uppercase font-mono"
                              />
                            ) : (
                              <select
                                value={newActivityForm.project}
                                onChange={(e) => {
                                  const code = e.target.value;
                                  const combinedProjectCodes = projectCodes.length > 0 ? projectCodes : DEFAULT_PROJECT_CODES;
                                  const match = combinedProjectCodes.find(pc => pc.code.toUpperCase() === code.toUpperCase());
                                  setNewActivityForm(prev => ({
                                    ...prev,
                                    project: code,
                                    projectLocation: match ? match.location : ""
                                  }));
                                }}
                                className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 uppercase font-mono cursor-pointer"
                              >
                                <option value="">-- SELECT PROJECT --</option>
                                {(projectCodes.length > 0 ? projectCodes : DEFAULT_PROJECT_CODES).map(pc => (
                                  <option key={pc.code} value={pc.code}>
                                    {pc.code} - {pc.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>

                          {/* Project Location */}
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Site Location
                            </label>
                            <input
                              type="text"
                              placeholder="Site Location"
                              value={newActivityForm.projectLocation}
                              onChange={(e) => setNewActivityForm(prev => ({ ...prev, projectLocation: e.target.value }))}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-600 uppercase"
                              readOnly={true}
                            />
                          </div>

                          {/* Log Date */}
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Log Date *
                            </label>
                            <input
                              type="date"
                              value={newActivityForm.date}
                              onChange={(e) => setNewActivityForm(prev => ({ ...prev, date: e.target.value }))}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-mono"
                            />
                          </div>

                          {/* Name of Activity */}
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Name of Activity *
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. EXCAVATION WORK"
                              value={newActivityForm.activityName}
                              onChange={(e) => setNewActivityForm(prev => ({ ...prev, activityName: e.target.value }))}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                            />
                          </div>

                          {/* % Work Completed */}
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                              % Work Completed
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 45"
                              value={newActivityForm.workCompletedPercent}
                              onChange={(e) => setNewActivityForm(prev => ({ ...prev, workCompletedPercent: e.target.value }))}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-mono"
                            />
                          </div>

                          {/* Target Date */}
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Target Date
                            </label>
                            <input
                              type="date"
                              value={newActivityForm.targetDate}
                              onChange={(e) => setNewActivityForm(prev => ({ ...prev, targetDate: e.target.value }))}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-mono"
                            />
                          </div>

                          {/* Work Completed Today */}
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Work Completed Today (%)
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 5"
                              value={newActivityForm.workCompletedTodayPercent}
                              onChange={(e) => setNewActivityForm(prev => ({ ...prev, workCompletedTodayPercent: e.target.value }))}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-mono"
                            />
                          </div>

                          {/* No. of Labor */}
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                              No. of Labor
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. 3"
                              value={newActivityForm.noOfLaborSubcontractor}
                              onChange={(e) => setNewActivityForm(prev => ({ ...prev, noOfLaborSubcontractor: e.target.value }))}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 font-mono"
                            />
                          </div>

                          {/* Equipment */}
                          <div>
                            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Equipment Used
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. EXCAVATOR"
                              value={newActivityForm.equipment}
                              onChange={(e) => setNewActivityForm(prev => ({ ...prev, equipment: e.target.value }))}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                            />
                          </div>

                          {/* Remarks */}
                          <div className="sm:col-span-2 md:col-span-3">
                            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1">
                              Remarks
                            </label>
                            <input
                              type="text"
                              placeholder="e.g. ON GOING / COMPLETED"
                              value={newActivityForm.remarks}
                              onChange={(e) => setNewActivityForm(prev => ({ ...prev, remarks: e.target.value }))}
                              className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 uppercase focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                            />
                          </div>

                          {/* Engineer Picture Upload Area */}
                          <div className="sm:col-span-2 md:col-span-3">
                            <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
                              <PlusCircle className="h-3.5 w-3.5 text-slate-400" /> Activity Pictures / Attachments
                            </label>
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 hover:border-slate-300 transition-all rounded-xl p-5 flex flex-col items-center justify-center relative cursor-pointer group">
                              <input
                                type="file"
                                multiple
                                accept="image/*"
                                onChange={async (e) => {
                                  const files = e.target.files;
                                  if (files) {
                                    const promises = Array.from(files).map((file: any) => compressImage(file));
                                    try {
                                      const base64Images = await Promise.all(promises);
                                      setEngineerFormImages(prev => [...prev, ...base64Images]);
                                    } catch (err) {
                                      console.error("Image compression failed", err);
                                    }
                                  }
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                              />
                              <div className="flex flex-col items-center justify-center text-center pointer-events-none">
                                <div className="bg-white p-2 rounded-full shadow-xs border border-slate-100 mb-1 group-hover:scale-105 transition-transform">
                                  <Plus className="h-3.5 w-3.5 text-slate-500" />
                                </div>
                                <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Drag & drop or Click to Upload Pictures</p>
                                <p className="text-[9px] font-mono text-slate-400">JPEG, PNG files are automatically compressed</p>
                              </div>
                            </div>

                            {engineerFormImages.length > 0 && (
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3 p-2 bg-slate-50/50 rounded-xl border border-slate-150">
                                {engineerFormImages.map((img, index) => (
                                  <div key={index} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 shadow-2xs group bg-white">
                                    <img 
                                      src={img} 
                                      alt={`Attachment ${index + 1}`} 
                                      className="w-full h-full object-cover cursor-pointer hover:opacity-90 transition-opacity"
                                      onClick={() => setLightbox({ isOpen: true, images: engineerFormImages, activeIndex: index, title: "Uploaded Activity Picture" })}
                                      referrerPolicy="no-referrer"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => setEngineerFormImages(prev => prev.filter((_, i) => i !== index))}
                                      className="absolute top-1 right-1 bg-slate-900/80 hover:bg-rose-600 p-1 rounded-full text-white transition-colors shadow-sm cursor-pointer z-20"
                                    >
                                      <X className="h-2.5 w-2.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                          <button
                            type="button"
                            onClick={() => setIsAddingActivity(false)}
                            className="px-4 py-2 text-xs font-bold uppercase text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            disabled={isAddingActivitySubmitting}
                            onClick={handleAddNewActivity}
                            className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-white bg-indigo-600 hover:bg-indigo-700 rounded-xl transition-colors cursor-pointer shadow-sm disabled:opacity-50 inline-flex items-center gap-1.5"
                          >
                            {isAddingActivitySubmitting ? (
                              <>
                                <RefreshCw className="h-3.5 w-3.5 animate-spin" /> Saving...
                              </>
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5" /> Save Activity
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Table View */}
                    {filteredLogs.length === 0 ? (
                      <div className="flex-1 py-12 text-center flex flex-col items-center justify-center bg-white border border-dashed border-slate-200 rounded-3xl p-8">
                        <FileText className="h-10 w-10 text-slate-300 mb-3" />
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">No Activity Records Found</p>
                        <p className="text-[11px] text-slate-400 mt-1 max-w-sm">
                          No daily progress entries were found under this project, or none match your search criteria.
                        </p>
                      </div>
                    ) : (
                      <>
                        {/* Desktop Table View */}
                        <div className="hidden md:flex bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex-col flex-1">
                          <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse min-w-[1200px]">
                            <thead className="bg-[#1e1b4b] text-white sticky top-0 z-10 text-[10px] uppercase font-mono tracking-wider border-b border-indigo-950">
                              <tr>
                                <th className="py-3 px-3 font-bold text-center w-14 border-r border-indigo-950">S/NO.</th>
                                <th className="py-3 px-4 font-bold w-44 border-r border-indigo-950">PROJECT CODE & LOCATION</th>
                                <th className="py-3 px-3 font-bold text-center w-32 border-r border-indigo-950 font-mono">LOG DATE</th>
                                <th className="py-3 px-4 font-bold w-56 border-r border-indigo-950 font-mono">NAME OF ACTIVITY</th>
                                <th className="py-3 px-3 font-bold text-center w-36 border-r border-indigo-950">% WORK COMPLETED</th>
                                <th className="py-3 px-3 font-bold text-center w-32 border-r border-indigo-950 font-mono">TARGET DATE</th>
                                <th className="py-3 px-3 font-bold text-center w-36 border-r border-indigo-950 font-mono">WORK COMPLETED TODAY</th>
                                <th className="py-3 px-3 font-bold text-center w-28 border-r border-indigo-950 font-mono">NO. LABOR</th>
                                <th className="py-3 px-4 font-bold w-40 border-r border-indigo-950 font-mono">EQUIPMENT</th>
                                <th className="py-3 px-4 font-bold w-52 border-r border-indigo-950 font-mono">REMARKS</th>
                                <th className="py-3 px-4 border-r border-indigo-950 font-mono text-center w-36">PICTURES</th>
                                <th className="py-3 px-4 font-bold text-center w-32">ACTIONS</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 text-xs font-medium">
                              {filteredLogs.map((log, idx) => {
                                const isEditing = editingEngineerRecordId === log.id;
                                const cumVal = parseFloat(isEditing ? editEngineerForm.workCompletedPercent : (log.workCompletedPercent || "0"));
                                const cleanCum = isNaN(cumVal) ? 0 : Math.min(100, Math.max(0, cumVal));
                                
                                return (
                                  <tr key={log.id} className={`transition-colors border-b border-slate-100 ${
                                    isEditing ? "bg-indigo-50/20" : "hover:bg-slate-50/50"
                                  }`}>
                                    {/* S/NO */}
                                    <td className="py-3 px-3 text-center border-r border-slate-100 text-slate-400 font-bold font-mono">
                                      {idx + 1}
                                    </td>

                                    {/* PROJECT CODE & LOCATION */}
                                    <td className="py-3 px-4 border-r border-slate-100">
                                      {isEditing ? (
                                        <div className="space-y-1.5">
                                          <input
                                            type="text"
                                            value={editEngineerForm.project}
                                            onChange={(e) => setEditEngineerForm(prev => ({ ...prev, project: e.target.value }))}
                                            className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1 text-xs uppercase font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 focus:outline-none"
                                            placeholder="Proj Code"
                                          />
                                          <input
                                            type="text"
                                            value={editEngineerForm.projectLocation}
                                            onChange={(e) => setEditEngineerForm(prev => ({ ...prev, projectLocation: e.target.value }))}
                                            className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1 text-[11px] uppercase font-semibold text-slate-600 focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 focus:outline-none"
                                            placeholder="Location"
                                          />
                                        </div>
                                      ) : (
                                        <div>
                                          <span className="text-[11px] font-mono font-bold bg-indigo-50 text-indigo-800 px-2.5 py-0.5 rounded-lg border border-indigo-100 uppercase inline-block mb-1">
                                            {log.project || "N/A"}
                                          </span>
                                          <div className="text-[10px] text-slate-500 font-medium uppercase truncate max-w-[150px]" title={log.projectLocation}>
                                            {log.projectLocation || "N/A"}
                                          </div>
                                        </div>
                                      )}
                                    </td>

                                    {/* DATE */}
                                    <td className="py-3 px-3 text-center border-r border-slate-100">
                                      {isEditing ? (
                                        <input
                                          type="date"
                                          value={editEngineerForm.date}
                                          onChange={(e) => setEditEngineerForm(prev => ({ ...prev, date: e.target.value }))}
                                          className="w-full bg-white border border-slate-250 rounded-lg px-1.5 py-1 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 focus:outline-none font-mono"
                                        />
                                      ) : (
                                        <span className="text-xs font-bold text-slate-500 font-mono">
                                          {log.date}
                                        </span>
                                      )}
                                    </td>

                                    {/* ACTIVITY NAME */}
                                    <td className="py-3 px-4 border-r border-slate-100 font-mono">
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={editEngineerForm.activityName}
                                          onChange={(e) => setEditEngineerForm(prev => ({ ...prev, activityName: e.target.value }))}
                                          className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1 text-xs uppercase font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 focus:outline-none"
                                          placeholder="Activity Name"
                                        />
                                      ) : (
                                        <span className="font-bold text-slate-850 uppercase block whitespace-normal">
                                          {log.activityName || "-"}
                                        </span>
                                      )}
                                    </td>

                                    {/* % WORK COMPLETED */}
                                    <td className="py-3 px-3 border-r border-slate-100 text-center">
                                      {isEditing ? (
                                        <div className="flex items-center gap-1 justify-center">
                                          <input
                                            type="text"
                                            value={editEngineerForm.workCompletedPercent}
                                            onChange={(e) => setEditEngineerForm(prev => ({ ...prev, workCompletedPercent: e.target.value }))}
                                            className="w-16 bg-white border border-slate-250 rounded-lg px-1 py-1 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 focus:outline-none font-mono text-center"
                                            placeholder="0"
                                          />
                                          <span className="text-xs font-bold text-slate-500 font-mono">%</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 justify-center">
                                          <div className="w-16 bg-slate-100 rounded-full h-1.5 overflow-hidden border border-slate-200">
                                            <div 
                                              className={`h-full rounded-full ${cleanCum === 100 ? "bg-emerald-500" : cleanCum > 50 ? "bg-amber-500" : "bg-indigo-500"}`}
                                              style={{ width: `${cleanCum}%` }}
                                            ></div>
                                          </div>
                                          <span className="font-bold font-mono text-[10px] text-slate-800">{log.workCompletedPercent || "0"}%</span>
                                        </div>
                                      )}
                                    </td>

                                    {/* TARGET DATE */}
                                    <td className="py-3 px-3 text-center border-r border-slate-100 font-mono">
                                      {isEditing ? (
                                        <input
                                          type="date"
                                          value={editEngineerForm.targetDate}
                                          onChange={(e) => setEditEngineerForm(prev => ({ ...prev, targetDate: e.target.value }))}
                                          className="w-full bg-white border border-slate-250 rounded-lg px-1.5 py-1 text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 focus:outline-none font-mono"
                                        />
                                      ) : (
                                        <span className="font-semibold text-slate-600 font-mono">
                                          {log.targetDate || "-"}
                                        </span>
                                      )}
                                    </td>

                                    {/* WORK COMPLETED TODAY */}
                                    <td className="py-3 px-3 text-center border-r border-slate-100">
                                      {isEditing ? (
                                        <div className="flex items-center gap-1 justify-center">
                                          <span className="text-xs font-bold text-slate-400 font-mono">+</span>
                                          <input
                                            type="text"
                                            value={editEngineerForm.workCompletedTodayPercent}
                                            onChange={(e) => setEditEngineerForm(prev => ({ ...prev, workCompletedTodayPercent: e.target.value }))}
                                            className="w-14 bg-white border border-slate-250 rounded-lg px-1 py-1 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 focus:outline-none font-mono text-center"
                                            placeholder="0"
                                          />
                                          <span className="text-xs font-bold text-slate-500 font-mono">%</span>
                                        </div>
                                      ) : (
                                        log.workCompletedTodayPercent ? (
                                          <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 px-2.5 py-0.5 rounded-full font-bold font-mono text-[10px]">
                                            +{log.workCompletedTodayPercent}%
                                          </span>
                                        ) : (
                                          <span className="text-slate-400 font-mono">-</span>
                                        )
                                      )}
                                    </td>

                                    {/* NO OF LABOR */}
                                    <td className="py-3 px-3 text-center border-r border-slate-100">
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={editEngineerForm.noOfLaborSubcontractor}
                                          onChange={(e) => setEditEngineerForm(prev => ({ ...prev, noOfLaborSubcontractor: e.target.value }))}
                                          className="w-16 bg-white border border-slate-250 rounded-lg px-1 py-1 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 focus:outline-none font-mono text-center"
                                          placeholder="0"
                                        />
                                      ) : (
                                        <span className="font-mono font-bold text-slate-800">
                                          {log.noOfLaborSubcontractor || "-"}
                                        </span>
                                      )}
                                    </td>

                                    {/* EQUIPMENT */}
                                    <td className="py-3 px-4 border-r border-slate-100">
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={editEngineerForm.equipment}
                                          onChange={(e) => setEditEngineerForm(prev => ({ ...prev, equipment: e.target.value }))}
                                          className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1 text-xs uppercase font-semibold text-slate-850 focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 focus:outline-none"
                                          placeholder="Equipment"
                                        />
                                      ) : (
                                        <span className="text-slate-600 uppercase truncate block max-w-[150px]" title={log.equipment}>
                                          {log.equipment || "-"}
                                        </span>
                                      )}
                                    </td>

                                    {/* REMARKS */}
                                    <td className="py-3 px-4 border-r border-slate-100">
                                      {isEditing ? (
                                        <input
                                          type="text"
                                          value={editEngineerForm.remarks}
                                          onChange={(e) => setEditEngineerForm(prev => ({ ...prev, remarks: e.target.value }))}
                                          className="w-full bg-white border border-slate-250 rounded-lg px-2 py-1 text-xs uppercase font-semibold text-slate-850 focus:ring-2 focus:ring-indigo-500/15 focus:border-indigo-500 focus:outline-none"
                                          placeholder="Remarks"
                                        />
                                      ) : (
                                        <span className="text-slate-600 uppercase truncate block max-w-[180px]" title={log.remarks}>
                                          {log.remarks || "-"}
                                        </span>
                                      )}
                                    </td>

                                    {/* PICTURES */}
                                    <td className="py-3 px-4 border-r border-slate-100 text-center">
                                      {isEditing ? (
                                        <div className="flex flex-col gap-1.5 items-center justify-center">
                                          <div className="flex flex-wrap gap-1 max-w-[120px] max-h-[80px] overflow-y-auto justify-center">
                                            {(editEngineerForm.images || []).map((img, idx) => (
                                              <div key={idx} className="relative w-7 h-7 rounded border border-slate-200 overflow-hidden shrink-0">
                                                <img 
                                                  src={img} 
                                                  className="w-full h-full object-cover cursor-pointer" 
                                                  onClick={() => setLightbox({ isOpen: true, images: editEngineerForm.images || [], activeIndex: idx, title: "Edit Activity Photo" })} 
                                                  referrerPolicy="no-referrer" 
                                                />
                                                <button 
                                                  type="button" 
                                                  onClick={() => setEditEngineerForm(prev => ({ ...prev, images: (prev.images || []).filter((_, i) => i !== idx) }))} 
                                                  className="absolute -top-0.5 -right-0.5 bg-rose-600 rounded-full text-white p-0.5 hover:bg-rose-700 cursor-pointer z-10"
                                                >
                                                  <X className="h-1.5 w-1.5" />
                                                </button>
                                              </div>
                                            ))}
                                          </div>
                                          <label className="relative inline-flex items-center justify-center px-2 py-0.5 bg-indigo-50 hover:bg-indigo-100 text-[9px] font-bold text-indigo-700 rounded cursor-pointer border border-indigo-100 uppercase tracking-wider text-center">
                                            Add
                                            <input 
                                              type="file" 
                                              multiple 
                                              accept="image/*" 
                                              onChange={async (e) => {
                                                const files = e.target.files;
                                                if (files) {
                                                  const promises = Array.from(files).map((f: any) => compressImage(f));
                                                  try {
                                                    const resImgs = await Promise.all(promises);
                                                    setEditEngineerForm(prev => ({ ...prev, images: [...(prev.images || []), ...resImgs] }));
                                                  } catch (err) { 
                                                    console.error(err); 
                                                  }
                                                }
                                              }} 
                                              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                            />
                                          </label>
                                        </div>
                                      ) : (
                                        log.images && log.images.length > 0 ? (
                                          <div className="flex flex-wrap gap-1 justify-center max-w-[120px]">
                                            {log.images.map((img, imgIdx) => (
                                              <div key={imgIdx} className="w-8 h-8 rounded border border-slate-200 overflow-hidden shadow-2xs hover:scale-105 transition-transform shrink-0">
                                                <img
                                                  src={img}
                                                  alt="Log Photo"
                                                  className="w-full h-full object-cover cursor-pointer"
                                                  onClick={() => setLightbox({ isOpen: true, images: log.images || [], activeIndex: imgIdx, title: `${log.activityName || "Activity"} Photo` })}
                                                  referrerPolicy="no-referrer"
                                                />
                                              </div>
                                            ))}
                                          </div>
                                        ) : (
                                          <span className="text-slate-400 font-mono block text-center">-</span>
                                        )
                                      )}
                                    </td>

                                    {/* ACTIONS */}
                                    <td className="py-3 px-4 text-center">
                                      {isEditing ? (
                                        <div className="flex items-center justify-center gap-1.5">
                                          <button
                                            type="button"
                                            onClick={() => handleSaveEngineerRecord(log.id)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition-colors"
                                            title="Save Changes"
                                          >
                                            <Check className="h-3 w-3" /> Save
                                          </button>
                                          <button
                                            type="button"
                                            onClick={() => setEditingEngineerRecordId(null)}
                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-slate-150 hover:bg-slate-200 text-slate-700 text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors"
                                            title="Cancel"
                                          >
                                            <X className="h-3 w-3" /> Cancel
                                          </button>
                                        </div>
                                      ) : (
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setEditingEngineerRecordId(log.id);
                                            setEditEngineerForm({
                                              activityName: log.activityName || "",
                                              workCompletedPercent: log.workCompletedPercent || "",
                                              targetDate: log.targetDate || "",
                                              workCompletedTodayPercent: log.workCompletedTodayPercent || "",
                                              noOfLaborSubcontractor: log.noOfLaborSubcontractor || "",
                                              equipment: log.equipment || "",
                                              remarks: log.remarks || "",
                                              project: log.project || "",
                                              date: log.date || "",
                                              projectLocation: log.projectLocation || "",
                                              images: log.images || []
                                            });
                                          }}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 border border-indigo-100 rounded-xl cursor-pointer transition-colors"
                                        >
                                          <Edit className="h-3.5 w-3.5" /> Edit Record
                                        </button>
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Mobile Card-Based List View */}
                      <div className="block md:hidden space-y-4">
                        {filteredLogs.map((log, idx) => {
                          const isEditing = editingEngineerRecordId === log.id;
                          const cumVal = parseFloat(isEditing ? editEngineerForm.workCompletedPercent : (log.workCompletedPercent || "0"));
                          const cleanCum = isNaN(cumVal) ? 0 : Math.min(100, Math.max(0, cumVal));

                          return (
                            <div 
                              key={log.id} 
                              className={`bg-white border rounded-2xl p-4 shadow-sm space-y-3 transition-all ${
                                isEditing ? "border-indigo-500 ring-2 ring-indigo-500/10" : "border-slate-200"
                              }`}
                            >
                              {/* Header: S/No and Project Info */}
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="flex items-center gap-2">
                                  <span className="text-[10px] font-mono font-bold text-slate-400">#{idx + 1}</span>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editEngineerForm.project}
                                      onChange={(e) => setEditEngineerForm(prev => ({ ...prev, project: e.target.value }))}
                                      className="w-24 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-bold uppercase text-slate-805 font-mono focus:outline-none focus:border-indigo-500"
                                      placeholder="Proj Code"
                                    />
                                  ) : (
                                    <span className="text-[10px] font-mono font-bold bg-indigo-50 text-indigo-800 px-2 py-0.5 rounded-lg border border-indigo-100 uppercase">
                                      {log.project || "N/A"}
                                    </span>
                                  )}
                                </div>

                                <div className="text-[11px] font-mono text-slate-500">
                                  {isEditing ? (
                                    <input
                                      type="date"
                                      value={editEngineerForm.date}
                                      onChange={(e) => setEditEngineerForm(prev => ({ ...prev, date: e.target.value }))}
                                      className="bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-[11px] font-semibold text-slate-800 font-mono focus:outline-none"
                                    />
                                  ) : (
                                    log.date
                                  )}
                                </div>
                              </div>

                              {/* Activity Name */}
                              <div>
                                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block tracking-wider mb-0.5">Name of Activity</span>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editEngineerForm.activityName}
                                    onChange={(e) => setEditEngineerForm(prev => ({ ...prev, activityName: e.target.value }))}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs font-bold uppercase text-slate-800 focus:outline-none focus:border-indigo-500"
                                    placeholder="Activity Name"
                                  />
                                ) : (
                                  <h5 className="text-xs font-bold text-slate-800 uppercase tracking-tight">{log.activityName || "-"}</h5>
                                )}
                              </div>

                              {/* Site Location (only visible/editable) */}
                              <div>
                                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block tracking-wider mb-0.5">Location</span>
                                {isEditing ? (
                                  <input
                                    type="text"
                                    value={editEngineerForm.projectLocation}
                                    onChange={(e) => setEditEngineerForm(prev => ({ ...prev, projectLocation: e.target.value }))}
                                    className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs uppercase text-slate-600 focus:outline-none focus:border-indigo-500"
                                    placeholder="Location"
                                  />
                                ) : (
                                  <p className="text-[11px] text-slate-600 uppercase font-medium">{log.projectLocation || "N/A"}</p>
                                )}
                              </div>

                              {/* Grid containing other details */}
                              <div className="grid grid-cols-2 gap-3 pt-1">
                                {/* % Work Completed */}
                                <div className="col-span-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block tracking-wider mb-1">% Work Completed</span>
                                  {isEditing ? (
                                    <div className="flex items-center gap-1.5">
                                      <input
                                        type="text"
                                        value={editEngineerForm.workCompletedPercent}
                                        onChange={(e) => setEditEngineerForm(prev => ({ ...prev, workCompletedPercent: e.target.value }))}
                                        className="w-16 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 text-center font-mono focus:outline-none focus:border-indigo-500"
                                        placeholder="e.g. 45"
                                      />
                                      <span className="text-xs font-bold font-mono text-slate-500">%</span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center gap-2">
                                      <div className="flex-1 bg-slate-200/80 rounded-full h-1.5 overflow-hidden">
                                        <div 
                                          className={`h-full rounded-full ${cleanCum === 100 ? "bg-emerald-500" : cleanCum > 50 ? "bg-amber-500" : "bg-indigo-500"}`}
                                          style={{ width: `${cleanCum}%` }}
                                        ></div>
                                      </div>
                                      <span className="font-bold font-mono text-xs text-slate-800">{log.workCompletedPercent || "0"}%</span>
                                    </div>
                                  )}
                                </div>

                                {/* Target Date */}
                                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block tracking-wider mb-0.5">Target Date</span>
                                  {isEditing ? (
                                    <input
                                      type="date"
                                      value={editEngineerForm.targetDate}
                                      onChange={(e) => setEditEngineerForm(prev => ({ ...prev, targetDate: e.target.value }))}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-semibold text-slate-800 font-mono focus:outline-none"
                                    />
                                  ) : (
                                    <span className="text-xs font-bold text-slate-700 font-mono">{log.targetDate || "-"}</span>
                                  )}
                                </div>

                                {/* Work Completed Today */}
                                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block tracking-wider mb-0.5">Completed Today</span>
                                  {isEditing ? (
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs font-bold text-slate-400 font-mono">+</span>
                                      <input
                                        type="text"
                                        value={editEngineerForm.workCompletedTodayPercent}
                                        onChange={(e) => setEditEngineerForm(prev => ({ ...prev, workCompletedTodayPercent: e.target.value }))}
                                        className="w-14 bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 text-center font-mono focus:outline-none"
                                        placeholder="0"
                                      />
                                      <span className="text-xs font-bold text-slate-500 font-mono">%</span>
                                    </div>
                                  ) : (
                                    log.workCompletedTodayPercent ? (
                                      <span className="inline-block bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded-lg font-bold font-mono text-[11px]">
                                        +{log.workCompletedTodayPercent}%
                                      </span>
                                    ) : (
                                      <span className="text-slate-400 font-mono text-xs">-</span>
                                    )
                                  )}
                                </div>

                                {/* No. of Labor */}
                                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block tracking-wider mb-0.5">No. Labor</span>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editEngineerForm.noOfLaborSubcontractor}
                                      onChange={(e) => setEditEngineerForm(prev => ({ ...prev, noOfLaborSubcontractor: e.target.value }))}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs font-bold text-slate-800 text-center font-mono focus:outline-none"
                                      placeholder="0"
                                    />
                                  ) : (
                                    <span className="text-xs font-bold text-slate-800 font-mono">{log.noOfLaborSubcontractor || "-"}</span>
                                  )}
                                </div>

                                {/* Equipment used */}
                                <div className="bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block tracking-wider mb-0.5">Equipment</span>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editEngineerForm.equipment}
                                      onChange={(e) => setEditEngineerForm(prev => ({ ...prev, equipment: e.target.value }))}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-0.5 text-xs uppercase font-semibold text-slate-850 focus:outline-none"
                                      placeholder="Equipment"
                                    />
                                  ) : (
                                    <span className="text-xs font-bold text-slate-700 uppercase block truncate">{log.equipment || "-"}</span>
                                  )}
                                </div>

                                {/* Remarks */}
                                <div className="col-span-2 bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
                                  <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block tracking-wider mb-0.5">Remarks</span>
                                  {isEditing ? (
                                    <input
                                      type="text"
                                      value={editEngineerForm.remarks}
                                      onChange={(e) => setEditEngineerForm(prev => ({ ...prev, remarks: e.target.value }))}
                                      className="w-full bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs uppercase font-semibold text-slate-850 focus:outline-none"
                                      placeholder="Remarks"
                                    />
                                  ) : (
                                    <span className="text-xs font-bold text-slate-700 uppercase block">{log.remarks || "-"}</span>
                                  )}
                                </div>
                              </div>

                              {/* Pictures Section */}
                              <div className="bg-slate-50/50 p-3 rounded-2xl border border-slate-100 space-y-2">
                                <span className="text-[9px] font-mono font-bold text-slate-400 uppercase block tracking-wider">Activity Pictures</span>
                                {isEditing ? (
                                  <div className="space-y-2">
                                    <div className="flex flex-wrap gap-2">
                                      {(editEngineerForm.images || []).map((img, idx) => (
                                        <div key={idx} className="relative w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shrink-0 shadow-2xs">
                                          <img 
                                            src={img} 
                                            className="w-full h-full object-cover cursor-pointer" 
                                            onClick={() => setLightbox({ isOpen: true, images: editEngineerForm.images || [], activeIndex: idx, title: "Edit Activity Photo" })} 
                                            referrerPolicy="no-referrer" 
                                          />
                                          <button 
                                            type="button" 
                                            onClick={() => setEditEngineerForm(prev => ({ ...prev, images: (prev.images || []).filter((_, i) => i !== idx) }))} 
                                            className="absolute top-0.5 right-0.5 bg-rose-600 rounded-full text-white p-0.5 hover:bg-rose-700 cursor-pointer shadow-sm z-10"
                                          >
                                            <X className="h-2 w-2" />
                                          </button>
                                        </div>
                                      ))}
                                    </div>
                                    <label className="relative inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-[10px] font-bold text-indigo-700 rounded-xl cursor-pointer border border-indigo-100 uppercase tracking-wider shadow-2xs">
                                      <Plus className="h-3 w-3" /> Upload Picture
                                      <input 
                                        type="file" 
                                        multiple 
                                        accept="image/*" 
                                        onChange={async (e) => {
                                          const files = e.target.files;
                                          if (files) {
                                            const promises = Array.from(files).map((f: any) => compressImage(f));
                                            try {
                                              const resImgs = await Promise.all(promises);
                                              setEditEngineerForm(prev => ({ ...prev, images: [...(prev.images || []), ...resImgs] }));
                                            } catch (err) { 
                                              console.error(err); 
                                            }
                                          }
                                        }} 
                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" 
                                      />
                                    </label>
                                  </div>
                                ) : (
                                  log.images && log.images.length > 0 ? (
                                    <div className="flex flex-wrap gap-1.5">
                                      {log.images.map((img, imgIdx) => (
                                        <div key={imgIdx} className="w-12 h-12 rounded-lg border border-slate-200 overflow-hidden shadow-2xs hover:scale-105 transition-transform shrink-0">
                                          <img
                                            src={img}
                                            alt="Log Photo"
                                            className="w-full h-full object-cover cursor-pointer"
                                            onClick={() => setLightbox({ isOpen: true, images: log.images || [], activeIndex: imgIdx, title: `${log.activityName || "Activity"} Photo` })}
                                            referrerPolicy="no-referrer"
                                          />
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <span className="text-slate-400 font-mono text-[10px] block">-</span>
                                  )
                                )}
                              </div>

                              {/* Card Actions */}
                              <div className="border-t border-slate-100 pt-3 flex items-center justify-end gap-2">
                                {isEditing ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleSaveEngineerRecord(log.id)}
                                      className="inline-flex items-center gap-1 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer shadow-sm transition-colors w-full justify-center"
                                    >
                                      <Check className="h-3.5 w-3.5" /> Save Card
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setEditingEngineerRecordId(null)}
                                      className="inline-flex items-center gap-1 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-colors w-full justify-center"
                                    >
                                      <X className="h-3.5 w-3.5" /> Cancel
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingEngineerRecordId(log.id);
                                      setEditEngineerForm({
                                        activityName: log.activityName || "",
                                        workCompletedPercent: log.workCompletedPercent || "",
                                        targetDate: log.targetDate || "",
                                        workCompletedTodayPercent: log.workCompletedTodayPercent || "",
                                        noOfLaborSubcontractor: log.noOfLaborSubcontractor || "",
                                        equipment: log.equipment || "",
                                        remarks: log.remarks || "",
                                        project: log.project || "",
                                        date: log.date || "",
                                        projectLocation: log.projectLocation || "",
                                        images: log.images || []
                                      });
                                    }}
                                    className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold uppercase tracking-wider text-indigo-650 bg-indigo-50 hover:bg-indigo-100 text-center w-full justify-center border border-indigo-100/60 rounded-xl cursor-pointer transition-colors"
                                  >
                                    <Edit className="h-3.5 w-3.5" /> Edit Record Details
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                  </div>
                </div>
              );
            })()}

            {/* Modal Footer */}
            <div className="bg-slate-100 px-6 py-4 flex items-center justify-between border-t border-slate-200/60 shrink-0">
              <span className="text-[10px] text-slate-400 font-mono">
                ENGINEER PORTAL SECURE HANDLER
              </span>
              <button
                type="button"
                onClick={() => {
                  setIsEngineerPortalOpen(false);
                  setEditingEngineerRecordId(null);
                }}
                className="px-5 py-2 text-xs font-bold uppercase tracking-wider text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl transition-all cursor-pointer shadow-sm"
              >
                Close Portal
              </button>
            </div>

          </div>
        </div>
      )}

      {/* FULL SCREEN LIGHTBOX / IMAGE VIEWER WITH DOWNLOAD */}
      {lightbox.isOpen && lightbox.images && lightbox.images.length > 0 && (
        <div className="fixed inset-0 z-55 flex flex-col justify-between bg-slate-950/95 backdrop-blur-md p-4 animate-fade-in">
          {/* Lightbox Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-800/80 shrink-0">
            <div>
              <h4 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-display">
                {lightbox.title || "Image Viewer"}
              </h4>
              {lightbox.images.length > 1 && (
                <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                  Image {lightbox.activeIndex + 1} of {lightbox.images.length}
                </p>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDownloadLightboxImage}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold uppercase tracking-wider rounded-xl transition-colors cursor-pointer shadow-md"
                title="Download this picture"
              >
                <Download className="h-3.5 w-3.5" /> Download
              </button>
              <button
                type="button"
                onClick={() => setLightbox(prev => ({ ...prev, isOpen: false }))}
                className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-xl transition-colors cursor-pointer"
                title="Close Viewer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Lightbox Main Stage */}
          <div className="flex-1 flex items-center justify-center relative min-h-0 py-4">
            {lightbox.images.length > 1 && (
              <button
                type="button"
                onClick={() => setLightbox(prev => ({ ...prev, activeIndex: (prev.activeIndex - 1 + prev.images.length) % prev.images.length }))}
                className="absolute left-4 p-3 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white rounded-full border border-slate-800/50 transition-colors cursor-pointer z-10"
                title="Previous Image"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <div className="max-w-full max-h-full flex items-center justify-center p-2">
              <img
                src={lightbox.images[lightbox.activeIndex]}
                alt="Full preview"
                className="max-h-[70vh] max-w-full object-contain rounded-2xl shadow-2xl border border-slate-800/50"
                referrerPolicy="no-referrer"
              />
            </div>

            {lightbox.images.length > 1 && (
              <button
                type="button"
                onClick={() => setLightbox(prev => ({ ...prev, activeIndex: (prev.activeIndex + 1) % prev.images.length }))}
                className="absolute right-4 p-3 bg-slate-900/60 hover:bg-slate-800 text-slate-200 hover:text-white rounded-full border border-slate-800/50 transition-colors cursor-pointer z-10"
                title="Next Image"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {/* Lightbox Footer Thumbnail Strip */}
          {lightbox.images.length > 1 && (
            <div className="py-2 shrink-0 flex justify-center gap-2 border-t border-slate-900 overflow-x-auto max-w-full">
              {lightbox.images.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setLightbox(prev => ({ ...prev, activeIndex: idx }))}
                  className={`w-12 h-12 rounded-lg border-2 overflow-hidden transition-all shrink-0 ${idx === lightbox.activeIndex ? "border-indigo-500 scale-105" : "border-slate-800 opacity-60 hover:opacity-100"}`}
                >
                  <img
                    src={img}
                    alt="Thumbnail"
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      <datalist id="designations-list">
        {DESIGNATIONS.map((des) => (
          <option key={des} value={des} />
        ))}
      </datalist>

    </div>
  );
}
