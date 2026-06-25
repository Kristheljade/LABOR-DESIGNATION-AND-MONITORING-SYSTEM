import React, { useState, useEffect, useRef } from "react";
import { 
  Lock, 
  Unlock, 
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
  UserCheck
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
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Sync searchTerm with the external value directly (no description appending for cleaner typing and backspacing)
  useEffect(() => {
    setSearchTerm(value);
  }, [value]);

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        // On blur, if custom is NOT allowed, reset search term to matched value
        if (!allowCustom) {
          const option = options.find((o) => o.value.toUpperCase() === value.toUpperCase());
          if (option) {
            setSearchTerm(option.value);
          } else {
            setSearchTerm("");
          }
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen, value, options, allowCustom]);

  // Filter options
  const filtered = options.filter((o) => {
    const term = searchTerm.toLowerCase().trim();
    if (!term) return true;
    // If the search term exactly equals the current state value, show all options on focus/click so they don't get restricted
    if (term === value.toLowerCase().trim()) return true;
    return (
      o.value.toLowerCase().includes(term) ||
      o.label.toLowerCase().includes(term) ||
      (o.sublabel && o.sublabel.toLowerCase().includes(term))
    );
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (readOnly || disabled) return;
    const val = e.target.value;
    setSearchTerm(val);
    setIsOpen(true);

    if (allowCustom) {
      onChange(val);
    } else {
      // If they type a exact match to a code or label, select it immediately
      const exactMatch = options.find(
        (o) => o.value.toUpperCase() === val.toUpperCase().trim() || o.label.toUpperCase() === val.toUpperCase().trim()
      );
      if (exactMatch) {
        onChange(exactMatch.value, exactMatch.data);
      } else {
        onChange("");
      }
    }
  };

  const handleSelectOption = (opt: { value: string; label: string; data?: any }) => {
    onChange(opt.value, opt.data);
    setSearchTerm(opt.value);
    setIsOpen(false);
  };

  const handleInputFocus = () => {
    if (readOnly || disabled) return;
    setIsOpen(true);
  };

  // Find if there is a match to display its description beautifully
  const matchedOpt = options.find((o) => o.value.toUpperCase() === value.toUpperCase());
  const showLabelDescription = matchedOpt && matchedOpt.label !== matchedOpt.value;

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
      <div className="relative">
        <input
          id={id}
          type="text"
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
          disabled={disabled}
          value={searchTerm}

          onChange={handleInputChange}
          onFocus={handleInputFocus}
          autoComplete="off"
          className={`w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 pl-3.5 pr-10 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-semibold text-slate-800 transition-all ${
            disabled ? "cursor-not-allowed opacity-50" : "cursor-text"
          } ${readOnly ? "bg-slate-100 text-slate-500 cursor-not-allowed" : ""}`}
        />
        {!readOnly && !disabled && (
          <button
            type="button"
            onClick={() => setIsOpen(!isOpen)}
            className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
          >
            <svg
              className={`h-4 w-4 transform transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
        )}
      </div>

      {isOpen && !readOnly && !disabled && (
        <div className="absolute z-50 w-full mt-1.5 bg-white border border-slate-200 rounded-xl shadow-lg max-h-60 overflow-y-auto font-sans text-sm animate-fadeIn">
          {filtered.length > 0 ? (
            <div className="py-1">
              {filtered.map((opt) => {
                const isSelected = opt.value.toUpperCase() === value.toUpperCase();
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => handleSelectOption(opt)}
                    className={`w-full text-left px-4 py-2 hover:bg-slate-50 transition-colors flex flex-col gap-0.5 ${
                      isSelected ? "bg-slate-50 text-slate-900 font-bold" : "text-slate-700"
                    }`}
                  >
                    <span className="font-mono text-xs font-bold text-slate-900">
                      {opt.value} {opt.label !== opt.value ? `- ${opt.label}` : ""}
                    </span>
                    {opt.sublabel && (
                      <span className="text-[10px] text-slate-400 font-medium uppercase tracking-wider flex items-center gap-1">
                        <MapPin className="h-2.5 w-2.5" /> {opt.sublabel}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="px-4 py-3 text-xs text-slate-400 text-center font-medium">
              {allowCustom ? (
                <span className="font-mono text-slate-500">
                  Press enter or leave to use custom: <strong className="text-slate-900">"{searchTerm}"</strong>
                </span>
              ) : (
                "No matches found"
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default function App() {
  // Navigation & authentication state
  const [currentView, setCurrentView] = useState<"form" | "admin">("form");
  const [adminTab, setAdminTab] = useState<"ledger" | "labor_codes">("ledger");
  const [passcode, setPasscode] = useState<string>("");
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(true);
  const [authError, setAuthError] = useState<string>("");
  const [checkingAuth, setCheckingAuth] = useState<boolean>(false);

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

  // Labor Codes system state
  const [laborCodes, setLaborCodes] = useState<any[]>([]);
  const [isLoadingLaborCodes, setIsLoadingLaborCodes] = useState<boolean>(false);
  const [laborCodesError, setLaborCodesError] = useState<string>("");
  const [matchedLaborName, setMatchedLaborName] = useState<string>("");

  // New labor code inputs
  const [newLaborCode, setNewLaborCode] = useState("");
  const [newLaborName, setNewLaborName] = useState("");
  const [isSavingLaborCode, setIsSavingLaborCode] = useState(false);
  const [saveLaborCodeError, setSaveLaborCodeError] = useState("");
  const [laborCodeSearch, setLaborCodeSearch] = useState("");

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

  // Load existing passcode from cache on startup
  useEffect(() => {
    const savedCode = safeStorage.getItem("binlahej_passcode");
    if (savedCode) {
      verifyStoredPasscode(savedCode);
    }
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
    const upperCode = codeVal.toUpperCase();
    setFormData(prev => ({ ...prev, laborCode: upperCode }));
    
    // Find matching labor code
    const matched = laborCodes.find(lc => lc.code.toUpperCase() === upperCode.trim());
    if (matched) {
      setMatchedLaborName(matched.name);
      setFormData(prev => ({ ...prev, laborsName: matched.name }));
    } else {
      setMatchedLaborName("");
    }
  };

  const handleProjectCodeChange = (codeVal: string) => {
    const upperCode = codeVal.toUpperCase();
    
    // Find matching project code
    const matched = projectCodes.find(pc => pc.code.toUpperCase() === upperCode.trim());
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
      setSaveLaborCodeError("Please fill in both fields.");
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

  const handleQuickLogin = async () => {
    setCheckingAuth(true);
    setAuthError("");
    try {
      const res = await fetch("/api/verify-passcode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ passcode: "123456" }),
      });
      const data = await res.json();
      if (data.valid) {
        setIsAuthenticated(true);
        setPasscode("123456");
        safeStorage.setItem("binlahej_passcode", "123456");
      } else {
        setAuthError("Incorrect admin passcode. Please verify server settings.");
      }
    } catch (err) {
      setAuthError("Failed to communicate with authorization server.");
    } finally {
      setCheckingAuth(false);
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
      } else {
        setLogsError("Error retrieving database log sheet entries from server.");
      }
    } catch (err) {
      setLogsError("Error loading logs from server.");
    } finally {
      setIsLoadingLogs(false);
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
                        options={(projectCodes.length > 0 ? projectCodes : [
                          { code: "P001", name: "HASSAN VILLA PROJECT", location: "AL WARQA'A 1ST" },
                          { code: "P002", name: "MOSQUE PROJECT", location: "AL YALAYIS 5TH" },
                          { code: "P003", name: "PROPOSED RESIDENTIAL BUILDING", location: "AL BARSHA 2ND" }
                        ]).map(pc => ({
                          value: pc.code,
                          label: pc.name,
                          sublabel: pc.location
                        }))}
                        value={formData.project}
                        onChange={(val) => handleProjectCodeChange(val)}
                        required
                        allowCustom
                        containerId="select-project-container"
                      />

                      {/* PROJECT LOCATION */}
                      <div className="flex flex-col">
                        <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" /> Site Location
                        </label>
                        <input
                          id="input-location"
                          type="text"
                          placeholder={(projectCodes.length > 0 ? projectCodes : [
                            { code: "P001", name: "HASSAN VILLA PROJECT", location: "AL WARQA'A 1ST" },
                            { code: "P002", name: "MOSQUE PROJECT", location: "AL YALAYIS 5TH" },
                            { code: "P003", name: "PROPOSED RESIDENTIAL BUILDING", location: "AL BARSHA 2ND" }
                          ]).some(pc => pc.code.toUpperCase() === formData.project.toUpperCase().trim()) ? "Auto-filled from Project Code" : "Enter Site Location..."}
                          value={formData.projectLocation}
                          onChange={(e) => setFormData(prev => ({ ...prev, projectLocation: e.target.value }))}
                          readOnly={(projectCodes.length > 0 ? projectCodes : [
                            { code: "P001", name: "HASSAN VILLA PROJECT", location: "AL WARQA'A 1ST" },
                            { code: "P002", name: "MOSQUE PROJECT", location: "AL YALAYIS 5TH" },
                            { code: "P003", name: "PROPOSED RESIDENTIAL BUILDING", location: "AL BARSHA 2ND" }
                          ]).some(pc => pc.code.toUpperCase() === formData.project.toUpperCase().trim())}
                          className={`w-full border border-slate-200 rounded-xl py-2.5 px-3.5 focus:outline-none text-sm font-semibold transition-all uppercase ${
                            (projectCodes.length > 0 ? projectCodes : [
                              { code: "P001", name: "HASSAN VILLA PROJECT", location: "AL WARQA'A 1ST" },
                              { code: "P002", name: "MOSQUE PROJECT", location: "AL YALAYIS 5TH" },
                              { code: "P003", name: "PROPOSED RESIDENTIAL BUILDING", location: "AL BARSHA 2ND" }
                            ]).some(pc => pc.code.toUpperCase() === formData.project.toUpperCase().trim())
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
                        options={(laborCodes.length > 0 ? laborCodes : [
                          { code: "BL001", name: "MUHAMMAD RAMZAN" },
                          { code: "BL002", name: "KARTAR SINGH" },
                          { code: "BL003", name: "ALEXIS SÁNCHEZ" },
                          { code: "BL004", name: "AHMED MANSUR" }
                        ]).map(lc => ({
                          value: lc.code,
                          label: lc.name
                        }))}
                        value={formData.laborCode}
                        onChange={(val) => handleLaborCodeChange(val)}
                        required
                        allowCustom
                        containerId="select-labor-code-container"
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
            
            {/* Elegant Sub-navigation for Console Views */}
            <div className="flex border-b border-slate-200/80 mb-4 bg-white p-2 rounded-xl shadow-2xs">
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
                                <th className="py-2.5 px-4 font-bold text-center">ACTION</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200 text-xs font-medium">
                              {filteredLaborCodes.map((lc) => (
                                <tr key={lc.id} className="hover:bg-slate-50 transition-colors duration-100 border-b border-slate-200">
                                  <td className="py-2 px-4 text-[#e11d48] font-bold font-mono uppercase border-r border-slate-200 bg-indigo-50/5">
                                    {lc.code}
                                  </td>
                                  <td className="py-2 px-4 text-slate-800 font-bold uppercase border-r border-slate-200">
                                    {lc.name}
                                  </td>
                                  <td className="py-2 px-4 text-center">
                                    <button
                                      onClick={() => handleDeleteLaborCode(lc.id, lc.code)}
                                      title="Delete Mapping"
                                      className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200 rounded cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 inline" />
                                    </button>
                                  </td>
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
                                  <td className="py-2 px-4 text-[#e11d48] font-bold font-mono uppercase border-r border-slate-200 bg-indigo-50/5">
                                    {pc.code}
                                  </td>
                                  <td className="py-2 px-4 text-slate-800 font-bold uppercase border-r border-slate-200">
                                    {pc.name}
                                  </td>
                                  <td className="py-2 px-4 text-slate-600 uppercase border-r border-slate-200">
                                    {pc.location}
                                  </td>
                                  <td className="py-2 px-4 text-center">
                                    <button
                                      onClick={() => handleDeleteProjectCode(pc.id, pc.code)}
                                      title="Delete Mapping"
                                      className="p-1 px-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-800 border border-rose-200 rounded cursor-pointer transition-colors"
                                    >
                                      <Trash2 className="h-3.5 w-3.5 inline" />
                                    </button>
                                  </td>
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

          </div>
        )}

      </main>

      {/* FOOTER */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-6 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-center sm:text-left">
            <span className="font-semibold block text-slate-300">© 2026 BIN LAHEJ GENERAL MAINTENANCE L.L.C</span>
            <span className="text-slate-500">External labor log system data record log. All Rights Reserved.</span>
            <span className="text-slate-500"> @ KRISTHEL JADE OCDE .</span>
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

    </div>
  );
}
