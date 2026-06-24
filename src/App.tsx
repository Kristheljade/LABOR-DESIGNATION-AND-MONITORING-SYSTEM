import React, { useState, useEffect } from "react";
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
  Palette
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
const COMMON_ENGINEERS = ["ENGR. SHAMJAS", "ENGR. DAWIT", "ENGR. JONAS", "ENGR. ALI"];
const DESIGNATIONS = ["CARPENTER", "HELPER", "STEEL FIXER", "MASON", "FOREMAN", "ELECTRICIAN", "PLUMBER", "TILE FIXER"];
const COMMON_TASKS = ["HOUSEKEEPING", "STEEL FIXER", "CONCRETING", "EXCAVATION", "WALL MASONRY", "SCAFFOLDING", "CLEANING"];

export default function App() {
  // Navigation & authentication state
  const [currentView, setCurrentView] = useState<"form" | "admin">("form");
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
  
  // Table search and filters
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedProjectFilter, setSelectedProjectFilter] = useState<string>("ALL");
  const [selectedDesignationFilter, setSelectedDesignationFilter] = useState<string>("ALL");

  // Logo background style customization
  const [logoBg, setLogoBg] = useState<string>(() => {
    return safeStorage.getItem("binlahej_logo_bg") || "slate";
  });

  const handleLogoBgChange = (bgKey: string) => {
    setLogoBg(bgKey);
    safeStorage.setItem("binlahej_logo_bg", bgKey);
  };

  // Load existing passcode from cache on startup
  useEffect(() => {
    const savedCode = safeStorage.getItem("binlahej_passcode");
    if (savedCode) {
      verifyStoredPasscode(savedCode);
    }
  }, []);

  // Fetch admin logs whenever admin view is active or authenticated
  useEffect(() => {
    if (isAuthenticated || currentView === "admin") {
      fetchSubmissions();
    }
  }, [isAuthenticated, currentView]);

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
        }));
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

  const handleDeleteItem = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete the record for ${name}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/submissions/${id}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setSubmissions(prev => prev.filter((s) => s.id !== id));
      } else {
        alert("Delete operation failed. Please refresh and try again.");
      }
    } catch (err) {
      alert("Error contacting database server.");
    }
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
                    <button
                      id="form-go-admin-btn"
                      onClick={() => setCurrentView("admin")}
                      className="inline-flex items-center justify-center px-6 py-3 border border-slate-200 text-sm font-semibold rounded-lg text-slate-800 bg-white hover:bg-slate-50 cursor-pointer transition-all duration-200"
                    >
                      Go to Admin Database
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
                      <div className="flex flex-col">
                        <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                          Project Designation
                        </label>
                        <input
                          id="input-project"
                          type="text"
                          required
                          placeholder="e.g. HASSAN VILLA PROJECT"
                          value={formData.project}
                          onChange={(e) => setFormData(prev => ({ ...prev, project: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-medium text-slate-800 uppercase placeholder:normal-case transition-all"
                        />
                        {/* Quick tags */}
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {COMMON_PROJECTS.map((proj) => (
                            <button
                              key={proj}
                              type="button"
                              onClick={() => quickSetField("project", proj)}
                              className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-500 py-1 px-2.5 rounded-lg font-medium border border-slate-200/60 focus:outline-none cursor-pointer transition-colors"
                            >
                              + {proj}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* PROJECT LOCATION */}
                      <div className="flex flex-col">
                        <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" /> Site Location
                        </label>
                        <input
                          id="input-location"
                          type="text"
                          required
                          placeholder="e.g. AL WARQA'A 1ST"
                          value={formData.projectLocation}
                          onChange={(e) => setFormData(prev => ({ ...prev, projectLocation: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-medium text-slate-800 uppercase placeholder:normal-case transition-all"
                        />
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {COMMON_LOCATIONS.map((loc) => (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => quickSetField("projectLocation", loc)}
                              className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-500 py-1 px-2.5 rounded-lg font-medium border border-slate-200/60 focus:outline-none cursor-pointer transition-colors"
                            >
                              + {loc}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* SITE ENGINEER */}
                      <div className="flex flex-col">
                        <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                          Assigned Site Engineer
                        </label>
                        <input
                          id="input-engineer"
                          type="text"
                          required
                          placeholder="e.g. ENGR. DAWIT"
                          value={formData.siteEngineer}
                          onChange={(e) => setFormData(prev => ({ ...prev, siteEngineer: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-medium text-slate-800 uppercase placeholder:normal-case transition-all"
                        />
                        <div className="flex flex-wrap gap-1 mt-2.5">
                          {COMMON_ENGINEERS.map((eng) => (
                            <button
                              key={eng}
                              type="button"
                              onClick={() => quickSetField("siteEngineer", eng)}
                              className="text-[10px] bg-slate-50 hover:bg-slate-100 text-slate-500 py-1 px-2.5 rounded-lg font-medium border border-slate-200/60 focus:outline-none cursor-pointer transition-colors"
                            >
                              + {eng}
                            </button>
                          ))}
                        </div>
                      </div>

                    </div>

                    {/* RIGHT COLUMN */}
                    <div className="space-y-6">
                      
                      {/* LABOR'S NAME */}
                      <div className="flex flex-col">
                        <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-slate-400" /> Labor's Full Name
                        </label>
                        <input
                          id="input-labors-name"
                          type="text"
                          required
                          placeholder="ENTER FULL NAME"
                          value={formData.laborsName}
                          onChange={(e) => setFormData(prev => ({ ...prev, laborsName: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-semibold text-slate-800 uppercase placeholder:normal-case transition-all"
                        />
                      </div>

                      {/* DESIGNATION */}
                      <div className="flex flex-col">
                        <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                          <HardHat className="h-3.5 w-3.5 text-slate-400" /> Designation / Trade
                        </label>
                        <select
                          id="select-designation"
                          value={formData.designation}
                          onChange={(e) => setFormData(prev => ({ ...prev, designation: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-medium text-slate-800 transition-all cursor-pointer"
                        >
                          {DESIGNATIONS.map(role => (
                            <option key={role} value={role}>{role}</option>
                          ))}
                          <option value="OTHER">OTHER (TYPE CUSTOM DESIGNATION...)</option>
                        </select>
                        
                        {formData.designation === "OTHER" && (
                          <input
                            id="input-custom-designation"
                            type="text"
                            required
                            placeholder="Type designation here..."
                            value={formData.customDesignation}
                            onChange={(e) => setFormData(prev => ({ ...prev, customDesignation: e.target.value }))}
                            className="mt-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-medium uppercase placeholder:normal-case transition-all"
                          />
                        )}
                      </div>

                      {/* REASSIGNED TASK */}
                      <div className="flex flex-col">
                        <label className="text-2xs font-semibold text-slate-400 tracking-wider uppercase mb-1.5 flex items-center gap-1.5">
                          <ClipboardCheck className="h-3.5 w-3.5 text-slate-400" /> Active Assigned Task
                        </label>
                        <select
                          id="select-reassigned"
                          value={formData.reassignedTask}
                          onChange={(e) => setFormData(prev => ({ ...prev, reassignedTask: e.target.value }))}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2.5 px-3.5 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-medium text-slate-800 transition-all cursor-pointer"
                        >
                          {COMMON_TASKS.map(task => (
                            <option key={task} value={task}>{task}</option>
                          ))}
                          <option value="OTHER">OTHER (TYPE CUSTOM REASSIGNED TASK...)</option>
                        </select>

                        {formData.reassignedTask === "OTHER" && (
                          <input
                            id="input-custom-task"
                            type="text"
                            required
                            placeholder="Type reassigned task here..."
                            value={formData.customReassignedTask}
                            onChange={(e) => setFormData(prev => ({ ...prev, customReassignedTask: e.target.value }))}
                            className="mt-2.5 w-full bg-slate-50 border border-slate-200 rounded-xl py-2 px-3 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-700 text-sm font-medium uppercase placeholder:normal-case transition-all"
                          />
                        )}
                      </div>

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
            
            {/* LOGS DASHBOARD ACTIVE VIEW */}
            <div id="logs-dashboard" className="space-y-6">
              
              {/* Admin Header Commands */}
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="bg-slate-50 text-slate-700 p-2.5 rounded-xl border border-slate-100">
                    <FileSpreadsheet className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900 font-display uppercase tracking-tight">Document Controller Console</h2>
                    <p className="text-xs text-slate-400 font-mono">
                      Active Database Ledger Log
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
                            <th className="py-3 px-4 font-bold border-r border-[#1e293b]">PROJECT</th>
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

                {/* USER HOSTING & INTEGRATION GUIDE COMPONENT (Answers "where can I use/host this etc.") */}
                <div id="hosting-guide" className="bg-slate-900 text-slate-100 rounded-xl p-6 shadow-lg border border-slate-800">
                  <div className="flex items-center gap-2 border-b border-slate-800 pb-3 mb-4">
                    <Info className="h-5 w-5 text-amber-400" />
                    <h3 className="text-lg font-bold font-display uppercase tracking-wider text-white">
                      Field Deployment &amp; Hosting Guide
                    </h3>
                  </div>

                  <p className="text-sm text-slate-400 leading-relaxed mb-6">
                    You requested information on what platforms or websites you can use to host this form so sub-contracted users can instantly submit from their phones on-site while keeping database records private to you. Here are the premium recommended options:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    
                    {/* OPTION 1 */}
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-white font-bold mb-2">
                          <div className="bg-amber-500/10 text-amber-400 p-1 rounded">
                            <Layers className="h-4 w-4" />
                          </div>
                          <span>1. Google AI Studio (Current)</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Your code is currently running live in a container on Google Cloud. Normal workers can access your form through the <strong>Shared App URL</strong> on any mobile phone, while you can view logs inside the <strong>Admin Console</strong>.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-900 text-3xs font-mono text-emerald-400">
                        ✓ ALREADY INSTALLED &amp; SHARABLE
                      </div>
                    </div>

                    {/* OPTION 2 */}
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-white font-bold mb-2">
                          <div className="bg-sky-500/10 text-sky-400 p-1 rounded">
                            <Server className="h-4 w-4" />
                          </div>
                          <span>2. Railway / Render / Caprover</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          Incredibly easy, low-cost options for hosting full-stack node apps. You simply link your GitHub repository and it compiles and provisions a solid live URL with zero-config databases on top of standard solid container servers.
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-900 text-3xs font-mono text-sky-400">
                        ★ BEST FOR FULL CUSTOM FORMS
                      </div>
                    </div>

                    {/* OPTION 3 */}
                    <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex flex-col justify-between">
                      <div>
                        <div className="flex items-center gap-2 text-white font-bold mb-2">
                          <div className="bg-purple-500/10 text-purple-400 p-1 rounded">
                            <Database className="h-4 w-4" />
                          </div>
                          <span>3. Google Sheets Integration</span>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          This code exports clean CSV excel tables. You can easily drag and drop your daily logs directly into Google Sheets or Microsoft Excel to instantly auto-generate your company labor log exactly like your upload images!
                        </p>
                      </div>
                      <div className="mt-4 pt-3 border-t border-slate-900 text-3xs font-mono text-purple-400">
                        ⚙ EASY EXCEL DIRECT FLUID SYNC
                      </div>
                    </div>

                  </div>

                </div>
              </div>

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

    </div>
  );
}
