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
  Edit,
  Eye,
  Heart
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
  const [adminTab, setAdminTab] = useState<"ledger" | "labor_codes" | "security">("ledger");
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
  });

  // Submission UX state
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

  // Editing state for Project Mapping Ledger
  const [editingProjectId, setEditingProjectId] = useState<string | null>(null);
  const [editProjectCode, setEditProjectCode] = useState("");
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectLocation, setEditProjectLocation] = useState("");
  const [laborCodesSubTab, setLaborCodesSubTab] = useState<"labor_codes" | "project_codes">("labor_codes");
  
  // Table search and filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("ALL");
  const [selectedDesignationFilter, setSelectedDesignationFilter] = useState<string>("ALL");

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

  // Fetch admin logs whenever admin view is active or authenticated
  useEffect(() => {
    if (isAuthenticated || currentView === "admin") {
      fetchSubmissions();
      fetchLaborCodes();
      fetchProjectCodes();
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
    
    // Core validations
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

    setIsSubmitting(true);
    setSubmitError("");

    const payload = {
      date: formData.date,
      project: formData.project.trim().toUpperCase(),
      laborsName: formData.laborsName.trim().toUpperCase(),
      designation: actualDesignation.toUpperCase(),
      projectLocation: formData.projectLocation.trim().toUpperCase(),
      siteEngineer: formData.siteEngineer.trim().toUpperCase(),
      reassignedTask: actualReassignedTask.toUpperCase(),
    };

    try {
      const res = await fetch("/api/submissions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setSubmitSuccess(true);
        setLastSubmittedName(payload.laborsName);
        // Reset name block and task, keep project config to allow rapid logging of next worker
        setFormData(prev => ({
          ...prev,
          laborsName: "",
          customDesignation: "",
          customReassignedTask: "",
          laborCode: "",
        }));
        setMatchedLaborName("");
        // Also refresh the separate daily and monthly ledger files list in the background
        fetchLedgerFiles();
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
        "ASSIGNED TASK"
      ];

      const tableRows = records.map((s) => [
        s.date,
        s.project || "-",
        s.laborsName || "-",
        s.designation || "-",
        s.projectLocation || "-",
        s.siteEngineer || "-",
        s.reassignedTask || "-"
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
          1: { cellWidth: 46 }, // Project
          2: { cellWidth: 46 }, // Labor Name
          3: { cellWidth: 36 }, // Trade/Designation
          4: { cellWidth: 35 }, // Location
          5: { cellWidth: 35 }, // Engineer
          6: { cellWidth: 45 }  // Assigned Task
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
        "ASSIGNED TASK"
      ];

      const tableRows = filteredSubmissions.map((s) => [
        s.date,
        s.project || "-",
        s.laborsName || "-",
        s.designation || "-",
        s.projectLocation || "-",
        s.siteEngineer || "-",
        s.reassignedTask || "-"
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
          1: { cellWidth: 46 }, // Project
          2: { cellWidth: 46 }, // Labor Name
          3: { cellWidth: 36 }, // Trade/Designation
          4: { cellWidth: 35 }, // Location
          5: { cellWidth: 35 }, // Engineer
          6: { cellWidth: 45 }  // Assigned Task
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

  // Pre-fill helper
  const quickSetField = (field: "project" | "projectLocation" | "siteEngineer", value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  // Log calculation properties
  const filteredSubmissions = submissions.filter(s => {
    const matchesSearch = 
      s.laborsName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.project.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.siteEngineer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.designation.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesProject = selectedProjectFilter === "ALL" || s.project === selectedProjectFilter;
    const matchesDesignation = selectedDesignationFilter === "ALL" || s.designation === selectedDesignationFilter;

    return matchesSearch && matchesProject && matchesDesignation;
  });

  // Extract unique active projects & designations for sidebar filter dropdowns
  const uniqueProjects = Array.from(new Set(submissions.map(s => s.project)));
  const uniqueDesignations = Array.from(new Set(submissions.map(s => s.designation)));

  // Grouped stats for admin visualization cards
  const totalLoggedWorkers = submissions.length;
  
  // Stats - Project and task distribution counts
  const projectCounts: { [key: string]: number } = {};
  const designationCounts: { [key: string]: number } = {};
  submissions.forEach(s => {
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
            <div className="bg-slate-50 border-b border-slate-100 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-slate-600" />
                <h2 className="font-semibold text-slate-800 uppercase tracking-wider text-sm font-sans">Daily Log Sheet Form</h2>
              </div>
              <span className="text-[10px] font-mono bg-slate-200/80 text-slate-700 px-2.5 py-1 rounded-full font-medium">ENGINEERS FILL FORM</span>
            </div>

            <div className="p-6 md:p-10">
              {submitSuccess ? (
                <div id="success-panel" className="py-12 text-center flex flex-col items-center justify-center">
                  <div className="bg-emerald-50 text-emerald-600 p-4 rounded-full mb-4">
                    <CheckCircle2 className="h-16 w-16" />
                  </div>
                  <h3 className="text-2xl font-bold font-display text-emerald-800">Record Saved Successfully!</h3>
                  <p className="text-slate-600 mt-2 max-w-md">
                    The labor entry for <strong className="text-slate-900 font-mono text-lg bg-slate-100 px-2 py-0.5 rounded">{lastSubmittedName}</strong> has been secured in your private database.
                  </p>
                  
                  <div className="mt-8 flex flex-col sm:flex-row gap-3">
                    <button
                      id="log-another-btn"
                      onClick={() => setSubmitSuccess(false)}
                      className="inline-flex items-center justify-center px-6 py-3 border border-transparent text-sm font-semibold rounded-lg text-white bg-slate-900 hover:bg-slate-800 shadow-sm focus:outline-none cursor-pointer transition-all duration-200"
                    >
                      Log Another Labor Record
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

                  <p className="text-xs text-slate-400 pb-6 border-b border-slate-100">
                    Provide accurate field details. All entries are instantly secured in the document controller ledger, restricted exclusively to authorized personnel.
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                    
                    {/* LEFT COLUMN */}
                    <div className="space-y-6">
                      
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
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-medium text-slate-800 transition-all"
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
                              : "bg-slate-50 text-slate-800 focus:bg-white focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700"
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

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                      
                      {/* LABOR CODE */}
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

                  </div>

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
                    
                    {/* Left Column: Input Form */}
                    <div className="bg-white p-6 rounded-3xl border border-slate-200/60 shadow-sm space-y-4 h-fit">
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
                            <th className="py-3 px-4 font-bold">ASSIGNED TASK</th>
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
                                  <td colSpan={7} className="py-12 text-center text-slate-400">
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
                                <td className="py-2.5 px-4 text-slate-600 uppercase leading-relaxed max-w-xs truncate" title={r.reassignedTask}>
                                  {r.reassignedTask}
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

      <datalist id="designations-list">
        {DESIGNATIONS.map((des) => (
          <option key={des} value={des} />
        ))}
      </datalist>

    </div>
  );
}
