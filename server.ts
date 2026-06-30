import express from "express";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  getFirestore,
  collection, 
  getDocs, 
  doc, 
  getDoc,
  setDoc, 
  deleteDoc
} from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "entries.json");
const PASSCODE_FILE = path.join(process.cwd(), "passcode_config.json");

// Elegant and clean Firebase error logger to suppress verbose quota exceeded error traces in the console/logs
function handleFirebaseError(context: string, error: any) {
  const errMsg = error?.message || String(error);
  if (errMsg.includes("Quota limit exceeded") || errMsg.includes("quota")) {
    console.warn(`[Firebase - ${context}] Quota limit exceeded. Running in offline/local-cache fallback mode.`);
  } else {
    console.warn(`[Firebase - ${context}] Error:`, errMsg);
  }
}

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Dynamic/Lazy Firebase setup
let db: any = null;
let dbPromise: Promise<any> | null = null;

async function getDb() {
  if (db) return db;
  if (dbPromise) return dbPromise;

  dbPromise = (async () => {
    // Default values from firebase-applet-config.json
    let config = {
      projectId: "alien-tracer-9sc93",
      appId: "1:884780340480:web:39fb26bb42c6bb35520fe5",
      apiKey: "AIzaSyAHXX3X3mKnXrFSByq3apg28Gu_sjp8WnE",
      authDomain: "alien-tracer-9sc93.firebaseapp.com",
      storageBucket: "alien-tracer-9sc93.firebasestorage.app",
      messagingSenderId: "884780340480",
      databaseId: "ai-studio-2258ac32-355e-4529-818e-ffba2a83c4be"
    };

    try {
      const configPath = path.join(process.cwd(), "firebase-applet-config.json");
      if (existsSync(configPath)) {
        const configData = await fs.readFile(configPath, "utf-8");
        const parsed = JSON.parse(configData);
        config = { ...config, ...parsed, databaseId: parsed.firestoreDatabaseId || parsed.databaseId };
      }
    } catch (error) {
      console.warn("Failed to load firebase-applet-config.json, using defaults:", error);
    }

    try {
      const firebaseApp = getApps().length === 0 ? initializeApp({
        apiKey: config.apiKey,
        authDomain: config.authDomain,
        projectId: config.projectId,
        storageBucket: config.storageBucket,
        messagingSenderId: config.messagingSenderId,
        appId: config.appId
      }) : getApp();

      try {
        if (config.databaseId) {
          db = getFirestore(firebaseApp, config.databaseId);
        } else {
          db = getFirestore(firebaseApp);
        }
      } catch (firestoreError: any) {
        console.warn("getFirestore failed, falling back:", firestoreError.message);
        db = getFirestore(firebaseApp);
      }

      console.log("Firebase initialized successfully with project ID:", config.projectId);
      return db;
    } catch (error) {
      console.error("Error initializing Firebase:", error);
      dbPromise = null; // Clear promise so next request can retry if it was transient
      return null;
    }
  })();

  return dbPromise;
}

let writeQueue: Promise<any> = Promise.resolve();

// Helper to safely write a file atomically using a unique temp file and serialization queue
async function safeWriteFile(filePath: string, data: string) {
  return new Promise<void>((resolve, reject) => {
    writeQueue = writeQueue
      .catch(() => {}) // Ensure previous errors don't stall the write queue
      .then(async () => {
        let tempPath = "";
        try {
          const dir = path.dirname(filePath);
          await fs.mkdir(dir, { recursive: true });
          
          const rand = Math.random().toString(36).substring(2, 10);
          tempPath = `${filePath}.${rand}.tmp`;
          
          await fs.writeFile(tempPath, data, "utf-8");
          await fs.rename(tempPath, filePath);
          resolve();
        } catch (err) {
          console.error(`safeWriteFile error for ${filePath}:`, err);
          if (tempPath) {
            try {
              if (existsSync(tempPath)) {
                await fs.unlink(tempPath);
              }
            } catch (_) {}
          }
          reject(err);
        }
      });
  });
}

// Helper to safely write submissions to the main DATA_FILE atomically
async function safeWriteSubmissions(submissions: any[]) {
  await safeWriteFile(DATA_FILE, JSON.stringify(submissions, null, 2));
}

const MONITORING_FILE = path.join(process.cwd(), "pull_out_monitoring.json");

// Helper to safely write pull-out monitoring records atomically
async function safeWriteMonitoring(records: any[]) {
  await safeWriteFile(MONITORING_FILE, JSON.stringify(records, null, 2));
}

// Helper to safely read and parse local pull-out monitoring
async function readLocalMonitoring(): Promise<any[]> {
  try {
    if (!existsSync(MONITORING_FILE)) {
      return [];
    }
    const data = await fs.readFile(MONITORING_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading or parsing local pull-out monitoring backup:", error);
    try {
      const firestoreDb = await getDb();
      if (firestoreDb) {
        const colRef = collection(firestoreDb, "pull_out_monitoring");
        const querySnapshot = await getDocs(colRef);
        const list: any[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        await safeWriteMonitoring(list);
        return list;
      }
    } catch (fireErr) {
      handleFirebaseError("readLocalMonitoring - self-healing", fireErr);
    }
    return [];
  }
}

// Helper to read pull-out monitoring
async function getMonitoringRecords(): Promise<any[]> {
  try {
    const firestoreDb = await getDb();
    if (firestoreDb) {
      const colRef = collection(firestoreDb, "pull_out_monitoring");
      const querySnapshot = await getDocs(colRef);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });
      await safeWriteMonitoring(list);
      return list;
    }
  } catch (error) {
    handleFirebaseError("getMonitoringRecords", error);
  }
  return readLocalMonitoring();
}

// Helper to safely read and parse local submissions
async function readLocalSubmissions(): Promise<any[]> {
  try {
    if (!existsSync(DATA_FILE)) {
      return [];
    }
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading or parsing local submissions backup:", error);
    // Attempt self-healing from Firestore if available
    try {
      const firestoreDb = await getDb();
      if (firestoreDb) {
        const colRef = collection(firestoreDb, "submissions");
        const querySnapshot = await getDocs(colRef);
        const list: any[] = [];
        querySnapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        await safeWriteSubmissions(list);
        return list;
      }
    } catch (fireErr) {
      handleFirebaseError("readLocalSubmissions - self-healing", fireErr);
    }
    return [];
  }
}

// Helper to read submissions
async function getSubmissions(): Promise<any[]> {
  try {
    const firestoreDb = await getDb();
    if (firestoreDb) {
      const colRef = collection(firestoreDb, "submissions");
      const querySnapshot = await getDocs(colRef);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });

      // Cache locally to keep offline fallback sync atomically
      await safeWriteSubmissions(list);
      return list;
    }
  } catch (error) {
    handleFirebaseError("getSubmissions", error);
  }

  return readLocalSubmissions();
}

async function syncSeparateFiles() {
  try {
    const submissions = await getSubmissions();
    const LEDGER_DIR = path.join(process.cwd(), "ledger_records");
    const DAILY_DIR = path.join(LEDGER_DIR, "daily");
    const MONTHLY_DIR = path.join(LEDGER_DIR, "monthly");

    // Ensure directories exist
    if (!existsSync(LEDGER_DIR)) {
      await fs.mkdir(LEDGER_DIR, { recursive: true });
    }

    // Clean out folders to prevent stale records
    if (existsSync(DAILY_DIR)) {
      await fs.rm(DAILY_DIR, { recursive: true, force: true });
    }
    await fs.mkdir(DAILY_DIR, { recursive: true });

    if (existsSync(MONTHLY_DIR)) {
      await fs.rm(MONTHLY_DIR, { recursive: true, force: true });
    }
    await fs.mkdir(MONTHLY_DIR, { recursive: true });

    const dailyGroups: Record<string, any[]> = {};
    const monthlyGroups: Record<string, any[]> = {};

    for (const s of submissions) {
      // Only include submissions with valid laborsName for daily and monthly labor attendance ledger files
      if (!s.laborsName || !s.laborsName.trim()) {
        continue;
      }

      const sDate = s.date || "unknown";
      const dayKey = sDate.trim(); // e.g., "2026-06-25"
      const monthKey = sDate.length >= 7 ? sDate.substring(0, 7) : "unknown"; // e.g., "2026-06"

      if (!dailyGroups[dayKey]) dailyGroups[dayKey] = [];
      dailyGroups[dayKey].push(s);

      if (!monthlyGroups[monthKey]) monthlyGroups[monthKey] = [];
      monthlyGroups[monthKey].push(s);
    }

    for (const [day, list] of Object.entries(dailyGroups)) {
      if (day === "unknown") continue;
      list.sort((a, b) => (a.laborsName || "").localeCompare(b.laborsName || ""));
      const filePath = path.join(DAILY_DIR, `entries_daily_${day}.json`);
      await safeWriteFile(filePath, JSON.stringify(list, null, 2));
    }

    for (const [month, list] of Object.entries(monthlyGroups)) {
      if (month === "unknown") continue;
      list.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime() || (a.laborsName || "").localeCompare(b.laborsName || ""));
      const filePath = path.join(MONTHLY_DIR, `entries_monthly_${month}.json`);
      await safeWriteFile(filePath, JSON.stringify(list, null, 2));
    }

    console.log("Successfully synchronized separate daily and monthly ledger records on server.");
  } catch (err) {
    console.error("Error in syncSeparateFiles:", err);
  }
}

const ADMIN_PASSCODE = process.env.ADMIN_PASSPHRASE || "123456";

// Get admin passcode
async function getAdminPasscode(): Promise<string> {
  try {
    const firestoreDb = await getDb();
    if (firestoreDb) {
      const docRef = doc(firestoreDb, "settings", "passcode_config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        try {
          await fs.writeFile(PASSCODE_FILE, JSON.stringify(data, null, 2), "utf-8");
        } catch (err) {
          console.error("Failed to write passcode cache:", err);
        }
        return data.passcode;
      }
    }
  } catch (error) {
    handleFirebaseError("getAdminPasscode", error);
  }

  // Local cache fallback
  try {
    if (existsSync(PASSCODE_FILE)) {
      const cached = JSON.parse(await fs.readFile(PASSCODE_FILE, "utf-8"));
      if (cached && cached.passcode) {
        return cached.passcode;
      }
    }
  } catch (err) {
    console.error("Error reading local passcode cache:", err);
  }

  return ADMIN_PASSCODE;
}

// Middleware to check admin passcode (Bypassed for instant direct access)
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> {
  next();
}

// API Routes

// GET passcode status
app.get("/api/passcode-status", async (req, res) => {
  try {
    const firestoreDb = await getDb();
    if (firestoreDb) {
      const docRef = doc(firestoreDb, "settings", "passcode_config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        try {
          await fs.writeFile(PASSCODE_FILE, JSON.stringify(data, null, 2), "utf-8");
        } catch (err) {
          console.error("Failed to write passcode cache:", err);
        }
        if (data.isConfigured) {
          return res.json({ configured: true });
        }
      }
    }
  } catch (error: any) {
    handleFirebaseError("passcode-status", error);
  }

  // Local cache fallback
  try {
    if (existsSync(PASSCODE_FILE)) {
      const cached = JSON.parse(await fs.readFile(PASSCODE_FILE, "utf-8"));
      if (cached && cached.isConfigured) {
        return res.json({ configured: true });
      }
    }
  } catch (err) {
    console.error("Error reading local passcode cache:", err);
  }

  return res.json({ configured: false });
});

// Verify passcode
app.post("/api/verify-passcode", async (req, res) => {
  const { passcode } = req.body;
  if (!passcode) {
    return res.status(400).json({ valid: false, error: "Passcode is required." });
  }
  try {
    const firestoreDb = await getDb();
    if (firestoreDb) {
      const docRef = doc(firestoreDb, "settings", "passcode_config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const stored = docSnap.data().passcode;
        try {
          await fs.writeFile(PASSCODE_FILE, JSON.stringify(docSnap.data(), null, 2), "utf-8");
        } catch (err) {
          console.error("Failed to write passcode cache:", err);
        }
        return res.json({ valid: passcode === stored });
      }
    }
  } catch (error: any) {
    handleFirebaseError("verify-passcode", error);
  }

  // Local cache fallback
  try {
    if (existsSync(PASSCODE_FILE)) {
      const cached = JSON.parse(await fs.readFile(PASSCODE_FILE, "utf-8"));
      if (cached && cached.passcode) {
        return res.json({ valid: passcode === cached.passcode });
      }
    }
  } catch (err) {
    console.error("Error reading local passcode cache during verification:", err);
  }
  
  // Fallback ONLY if database is not configured yet
  if (process.env.ADMIN_PASSPHRASE) {
    return res.json({ valid: passcode === process.env.ADMIN_PASSPHRASE });
  }
  // Default fallback (123456) ONLY if database is completely empty/unconfigured
  return res.json({ valid: passcode === "123456" });
});

// Setup or update passcode
app.post("/api/setup-passcode", async (req, res) => {
  const { currentPasscode, newPasscode } = req.body;
  if (!newPasscode || newPasscode.trim().length < 4) {
    return res.status(400).json({ error: "New passcode must be at least 4 characters long." });
  }

  let isConfigured = false;
  let stored = "123456";

  // Check current passcode configuration
  try {
    const firestoreDb = await getDb();
    if (firestoreDb) {
      const docRef = doc(firestoreDb, "settings", "passcode_config");
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        isConfigured = docSnap.data().isConfigured;
        stored = docSnap.data().passcode;
      }
    }
  } catch (error: any) {
    handleFirebaseError("setup-passcode - get current config", error);
    // Local cache check fallback
    try {
      if (existsSync(PASSCODE_FILE)) {
        const cached = JSON.parse(await fs.readFile(PASSCODE_FILE, "utf-8"));
        if (cached) {
          isConfigured = cached.isConfigured;
          stored = cached.passcode;
        }
      }
    } catch (err) {
      console.error("Error reading local passcode config fallback during setup:", err);
    }
  }

  if (isConfigured) {
    // Must verify current passcode before updating
    if (currentPasscode !== stored) {
      return res.status(400).json({ error: "Incorrect current passcode. Cannot update security settings." });
    }
  }

  const updatedConfig = {
    id: "passcode_config",
    passcode: newPasscode,
    isConfigured: true
  };

  let firebaseSuccess = false;
  // Save to Firestore if available
  try {
    const firestoreDb = await getDb();
    if (firestoreDb) {
      const docRef = doc(firestoreDb, "settings", "passcode_config");
      await setDoc(docRef, updatedConfig);
      firebaseSuccess = true;
    }
  } catch (error: any) {
    handleFirebaseError("setup-passcode - save config", error);
  }

  // Save to local cache
  try {
    await fs.writeFile(PASSCODE_FILE, JSON.stringify(updatedConfig, null, 2), "utf-8");
  } catch (localError) {
    console.error("Failed to write passcode to local cache:", localError);
  }

  return res.json({ 
    success: true, 
    message: firebaseSuccess ? "Passcode updated successfully!" : "Passcode updated locally (offline fallback mode)." 
  });
});

const CODES_FILE = path.join(process.cwd(), "labor_codes.json");

// Helper to read labor codes
async function getLaborCodes(): Promise<any[]> {
  try {
    const firestoreDb = await getDb();
    if (firestoreDb) {
      const colRef = collection(firestoreDb, "labor_codes");
      const querySnapshot = await getDocs(colRef);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });

      if (list.length > 0) {
        // Cache locally
        await fs.writeFile(CODES_FILE, JSON.stringify(list, null, 2), "utf-8");
        return list;
      } else {
        // Seed default initial labor codes into Firestore
        const defaults = [
          { id: "BL001", code: "BL001", name: "MUHAMMAD RAMZAN", designation: "CARPENTER", createdAt: new Date().toISOString() },
          { id: "BL002", code: "BL002", name: "KARTAR SINGH", designation: "HELPER", createdAt: new Date().toISOString() },
          { id: "BL003", code: "BL003", name: "ALEXIS SÁNCHEZ", designation: "STEEL FIXER", createdAt: new Date().toISOString() },
          { id: "BL004", code: "BL004", name: "AHMED MANSUR", designation: "MASON", createdAt: new Date().toISOString() }
        ];
        for (const item of defaults) {
          try {
            await setDoc(doc(firestoreDb, "labor_codes", item.id), item);
          } catch (err) {
            handleFirebaseError(`getLaborCodes - write default ${item.id}`, err);
          }
        }
        await fs.writeFile(CODES_FILE, JSON.stringify(defaults, null, 2), "utf-8");
        return defaults;
      }
    }
  } catch (error) {
    handleFirebaseError("getLaborCodes", error);
  }

  try {
    if (!existsSync(CODES_FILE)) {
      // Default initial labor codes for standard seamless test
      const defaults = [
        { id: "BL001", code: "BL001", name: "MUHAMMAD RAMZAN", designation: "CARPENTER" },
        { id: "BL002", code: "BL002", name: "KARTAR SINGH", designation: "HELPER" },
        { id: "BL003", code: "BL003", name: "ALEXIS SÁNCHEZ", designation: "STEEL FIXER" },
        { id: "BL004", code: "BL004", name: "AHMED MANSUR", designation: "MASON" }
      ];
      await fs.writeFile(CODES_FILE, JSON.stringify(defaults, null, 2), "utf-8");
      return defaults;
    }
    const data = await fs.readFile(CODES_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading labor codes from fallback:", error);
    return [];
  }
}

// Get all labor codes
app.get("/api/labor-codes", async (req, res) => {
  try {
    const codes = await getLaborCodes();
    res.json(codes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create/Update labor code
app.post("/api/labor-codes", async (req, res) => {
  try {
    const { code, name, designation } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: "Code and Name are required." });
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim().toUpperCase();
    const cleanDesignation = designation ? designation.trim().toUpperCase() : "HELPER";

    const id = cleanCode; // Use uppercase code as ID to prevent duplicates

    const newCodeItem = {
      code: cleanCode,
      name: cleanName,
      designation: cleanDesignation,
      createdAt: new Date().toISOString()
    };

    let firebaseSuccess = false;
    try {
      const firestoreDb = await getDb();
      if (firestoreDb) {
        await setDoc(doc(firestoreDb, "labor_codes", id), newCodeItem);
        firebaseSuccess = true;
        console.log(`Stored labor code ${id} in Firestore.`);
      }
    } catch (error) {
      handleFirebaseError("createLaborCode", error);
    }

    // Cache locally
    try {
      let codes = [];
      if (existsSync(CODES_FILE)) {
        const data = await fs.readFile(CODES_FILE, "utf-8");
        codes = JSON.parse(data || "[]");
      }
      // Remove existing code if duplicate
      codes = codes.filter((c: any) => c.id !== id && c.code !== cleanCode);
      codes.push({ id, ...newCodeItem });
      await fs.writeFile(CODES_FILE, JSON.stringify(codes, null, 2), "utf-8");
    } catch (localError) {
      console.error("Failed to write labor code to local storage backup:", localError);
    }

    res.status(201).json({ success: true, entry: { id, ...newCodeItem }, storedInFirebase: firebaseSuccess });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete labor code
app.delete("/api/labor-codes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    let firebaseSuccess = false;
    try {
      const firestoreDb = await getDb();
      if (firestoreDb) {
        await deleteDoc(doc(firestoreDb, "labor_codes", id));
        firebaseSuccess = true;
        console.log(`Deleted labor code ${id} from Firestore.`);
      }
    } catch (error) {
      handleFirebaseError("deleteLaborCode", error);
    }

    // Update local cache
    try {
      if (existsSync(CODES_FILE)) {
        const data = await fs.readFile(CODES_FILE, "utf-8");
        let codes = JSON.parse(data || "[]");
        codes = codes.filter((c: any) => c.id !== id);
        await fs.writeFile(CODES_FILE, JSON.stringify(codes, null, 2), "utf-8");
      }
    } catch (localError) {
      console.error("Failed to update local labor codes cache:", localError);
    }

    res.json({ success: true, deletedFromFirebase: firebaseSuccess });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const PROJECT_CODES_FILE = path.join(process.cwd(), "project_codes.json");

// Helper to read project codes
async function getProjectCodes(): Promise<any[]> {
  try {
    const firestoreDb = await getDb();
    if (firestoreDb) {
      const colRef = collection(firestoreDb, "project_codes");
      const querySnapshot = await getDocs(colRef);
      const list: any[] = [];
      querySnapshot.forEach((doc) => {
        list.push({ id: doc.id, ...doc.data() });
      });

      if (list.length > 0) {
        // Cache locally
        await fs.writeFile(PROJECT_CODES_FILE, JSON.stringify(list, null, 2), "utf-8");
        return list;
      } else {
        // Seed default initial project codes into Firestore
        const defaults = [
          { id: "P001", code: "P001", name: "HASSAN VILLA PROJECT", location: "AL WARQA'A 1ST", createdAt: new Date().toISOString() },
          { id: "P002", code: "P002", name: "MOSQUE PROJECT", location: "AL YALAYIS 5TH", createdAt: new Date().toISOString() },
          { id: "P003", code: "P003", name: "PROPOSED RESIDENTIAL BUILDING", location: "AL BARSHA 2ND", createdAt: new Date().toISOString() }
        ];
        for (const item of defaults) {
          try {
            await setDoc(doc(firestoreDb, "project_codes", item.id), item);
          } catch (err) {
            handleFirebaseError(`getProjectCodes - write default ${item.id}`, err);
          }
        }
        await fs.writeFile(PROJECT_CODES_FILE, JSON.stringify(defaults, null, 2), "utf-8");
        return defaults;
      }
    }
  } catch (error) {
    handleFirebaseError("getProjectCodes", error);
  }

  try {
    if (!existsSync(PROJECT_CODES_FILE)) {
      // Default initial project codes for standard seamless test
      const defaults = [
        { id: "P001", code: "P001", name: "HASSAN VILLA PROJECT", location: "AL WARQA'A 1ST" },
        { id: "P002", code: "P002", name: "MOSQUE PROJECT", location: "AL YALAYIS 5TH" },
        { id: "P003", code: "P003", name: "PROPOSED RESIDENTIAL BUILDING", location: "AL BARSHA 2ND" }
      ];
      await fs.writeFile(PROJECT_CODES_FILE, JSON.stringify(defaults, null, 2), "utf-8");
      return defaults;
    }
    const data = await fs.readFile(PROJECT_CODES_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading project codes from fallback:", error);
    return [];
  }
}

// Get all project codes
app.get("/api/project-codes", async (req, res) => {
  try {
    const codes = await getProjectCodes();
    res.json(codes);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create/Update project code
app.post("/api/project-codes", async (req, res) => {
  try {
    const { code, name, location } = req.body;
    if (!code || !name || !location) {
      return res.status(400).json({ error: "Code, Name, and Location are required." });
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim().toUpperCase();
    const cleanLocation = location.trim().toUpperCase();

    const id = cleanCode; // Use uppercase code as ID to prevent duplicates

    const newProjectItem = {
      code: cleanCode,
      name: cleanName,
      location: cleanLocation,
      createdAt: new Date().toISOString()
    };

    let firebaseSuccess = false;
    try {
      const firestoreDb = await getDb();
      if (firestoreDb) {
        await setDoc(doc(firestoreDb, "project_codes", id), newProjectItem);
        firebaseSuccess = true;
        console.log(`Stored project code ${id} in Firestore.`);
      }
    } catch (error) {
      handleFirebaseError("createProjectCode", error);
    }

    // Cache locally
    try {
      let codes = [];
      if (existsSync(PROJECT_CODES_FILE)) {
        const data = await fs.readFile(PROJECT_CODES_FILE, "utf-8");
        codes = JSON.parse(data || "[]");
      }
      // Remove existing code if duplicate
      codes = codes.filter((c: any) => c.id !== id && c.code !== cleanCode);
      codes.push({ id, ...newProjectItem });
      await fs.writeFile(PROJECT_CODES_FILE, JSON.stringify(codes, null, 2), "utf-8");
    } catch (localError) {
      console.error("Failed to write project code to local storage backup:", localError);
    }

    res.status(201).json({ success: true, entry: { id, ...newProjectItem }, storedInFirebase: firebaseSuccess });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete project code
app.delete("/api/project-codes/:id", async (req, res) => {
  try {
    const { id } = req.params;

    let firebaseSuccess = false;
    try {
      const firestoreDb = await getDb();
      if (firestoreDb) {
        await deleteDoc(doc(firestoreDb, "project_codes", id));
        firebaseSuccess = true;
        console.log(`Deleted project code ${id} from Firestore.`);
      }
    } catch (error) {
      handleFirebaseError("deleteProjectCode", error);
    }

    // Update local cache
    try {
      if (existsSync(PROJECT_CODES_FILE)) {
        const data = await fs.readFile(PROJECT_CODES_FILE, "utf-8");
        let codes = JSON.parse(data || "[]");
        codes = codes.filter((c: any) => c.id !== id);
        await fs.writeFile(PROJECT_CODES_FILE, JSON.stringify(codes, null, 2), "utf-8");
      }
    } catch (localError) {
      console.error("Failed to update local project codes cache:", localError);
    }

    res.json({ success: true, deletedFromFirebase: firebaseSuccess });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Create submission (Public)
app.post("/api/submissions", async (req, res) => {
  try {
    const { 
      date, 
      project, 
      laborsName, 
      designation, 
      projectLocation, 
      siteEngineer, 
      reassignedTask, 
      attendanceStatus,
      activityName,
      workCompletedPercent,
      targetDate,
      workCompletedTodayPercent,
      noOfLaborSubcontractor,
      equipment,
      remarks,
      images,
      isPullOut,
      absentReason,
      absentReasonOther,
      underTimeTime,
      underTimeReason,
      underTimeReasonOther,
      pullOutTime,
      pullOutSite,
      pullOutReason
    } = req.body;
    
    const isMonitoringOnly = !!(activityName && activityName.trim());
    
    if (isMonitoringOnly) {
      if (!date || !project || !projectLocation || !siteEngineer) {
        return res.status(400).json({ error: "Date, Project, Site Location, and Site Engineer are required for Activity Monitoring." });
      }
    } else {
      if (!date || !project || !laborsName || !designation || !projectLocation || !siteEngineer || !reassignedTask) {
        return res.status(400).json({ error: "All Labor Attendance fields are required." });
      }
    }

    // Check for duplicate labor entry on the same day in Binlahej Ledger (only if laborsName is provided)
    if (laborsName && laborsName.trim()) {
      try {
        const submissions = await getSubmissions();
        const isDuplicate = submissions.some((sub: any) => {
          return (
            sub.date === date &&
            sub.laborsName &&
            sub.laborsName.trim().toUpperCase() === laborsName.trim().toUpperCase()
          );
        });

        if (isDuplicate) {
          return res.status(400).json({
            error: `Labor '${laborsName.trim().toUpperCase()}' has already been logged on ${date} in the ledger.`
          });
        }
      } catch (dbCheckError) {
        console.warn("Failed checking for duplicate submissions:", dbCheckError);
      }
    }

    const id = Date.now().toString() + "-" + Math.random().toString(36).substring(2, 6);
    const newSubmission = {
      date,
      project,
      laborsName: laborsName || "",
      designation: designation || "",
      projectLocation: projectLocation || "",
      siteEngineer: siteEngineer || "",
      reassignedTask: reassignedTask || "",
      attendanceStatus: attendanceStatus || "Present",
      activityName: activityName || "",
      workCompletedPercent: workCompletedPercent || "",
      targetDate: targetDate || "",
      workCompletedTodayPercent: workCompletedTodayPercent || "",
      noOfLaborSubcontractor: noOfLaborSubcontractor || "",
      equipment: equipment || "",
      remarks: remarks || "",
      images: images || [],
      isPullOut: isPullOut !== undefined ? isPullOut : false,
      absentReason: absentReason || "",
      absentReasonOther: absentReasonOther || "",
      underTimeTime: underTimeTime || "",
      underTimeReason: underTimeReason || "",
      underTimeReasonOther: underTimeReasonOther || "",
      pullOutTime: pullOutTime || "",
      pullOutSite: pullOutSite || "",
      pullOutReason: pullOutReason || "",
      createdAt: new Date().toISOString()
    };

    // Attempt to write to Firebase Firestore
    let firebaseSuccess = false;
    try {
      const firestoreDb = await getDb();
      if (firestoreDb) {
        await setDoc(doc(firestoreDb, "submissions", id), newSubmission);
        firebaseSuccess = true;
        console.log(`Successfully stored entry ${id} in Firestore.`);
      }
    } catch (error) {
      handleFirebaseError("createSubmission", error);
    }

    // Always sync locally to keep the local entries.json database up to date
    try {
      let submissions = await readLocalSubmissions();
      submissions.push({ id, ...newSubmission });
      await safeWriteSubmissions(submissions);
    } catch (localError) {
      console.error("Failed to write to local storage backup:", localError);
    }

    // Refresh the daily/monthly separate files
    await syncSeparateFiles();

    res.status(201).json({ success: true, entry: { id, ...newSubmission }, storedInFirebase: firebaseSuccess });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update submission (Public)
app.put("/api/submissions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { 
      date, 
      project, 
      laborsName, 
      designation, 
      projectLocation, 
      siteEngineer, 
      reassignedTask, 
      attendanceStatus,
      activityName,
      workCompletedPercent,
      targetDate,
      workCompletedTodayPercent,
      noOfLaborSubcontractor,
      equipment,
      remarks,
      images,
      isPullOut,
      absentReason,
      absentReasonOther,
      underTimeTime,
      underTimeReason,
      underTimeReasonOther,
      pullOutTime,
      pullOutSite,
      pullOutReason
    } = req.body;

    let submissions = await readLocalSubmissions();

    const index = submissions.findIndex((s: any) => s.id === id);
    if (index === -1) {
      return res.status(404).json({ error: "Record not found." });
    }

    const originalRecord = submissions[index];
    const isActivityLog = !!(originalRecord.activityName || activityName);

    // Get today's local date in YYYY-MM-DD format
    const getTodayString = () => {
      try {
        return new Date().toLocaleDateString("en-CA");
      } catch (e) {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${year}-${month}-${day}`;
      }
    };

    const todayStr = getTodayString();
    const originalDate = originalRecord.date;
    const targetDateVal = date !== undefined ? date : originalDate;

    // Check if we should create a new record instead of overwriting
    let shouldCreateNew = false;
    if (isActivityLog) {
      if (originalDate !== todayStr || originalDate !== targetDateVal) {
        shouldCreateNew = true;
      }
    }

    if (shouldCreateNew) {
      // Create a brand new record instead of overwriting the original one
      const newId = Date.now().toString() + "-" + Math.random().toString(36).substring(2, 6);
      
      // If the date in req.body matches original record (which means user didn't change it),
      // but they are editing it on a later/different day, set the new record's date to today's date.
      // If they explicitly changed the date in the edit form, use their specified date.
      const finalDate = (date && date !== originalDate) ? date : todayStr;

      const newSubmission = {
        date: finalDate,
        project: project !== undefined ? project : originalRecord.project,
        laborsName: laborsName !== undefined ? laborsName : originalRecord.laborsName,
        designation: designation !== undefined ? designation : originalRecord.designation,
        projectLocation: projectLocation !== undefined ? projectLocation : originalRecord.projectLocation,
        siteEngineer: siteEngineer !== undefined ? siteEngineer : originalRecord.siteEngineer,
        reassignedTask: reassignedTask !== undefined ? reassignedTask : originalRecord.reassignedTask,
        attendanceStatus: attendanceStatus !== undefined ? attendanceStatus : originalRecord.attendanceStatus,
        activityName: activityName !== undefined ? activityName : originalRecord.activityName,
        workCompletedPercent: workCompletedPercent !== undefined ? workCompletedPercent : originalRecord.workCompletedPercent,
        targetDate: targetDate !== undefined ? targetDate : originalRecord.targetDate,
        workCompletedTodayPercent: workCompletedTodayPercent !== undefined ? workCompletedTodayPercent : originalRecord.workCompletedTodayPercent,
        noOfLaborSubcontractor: noOfLaborSubcontractor !== undefined ? noOfLaborSubcontractor : originalRecord.noOfLaborSubcontractor,
        equipment: equipment !== undefined ? equipment : originalRecord.equipment,
        remarks: remarks !== undefined ? remarks : originalRecord.remarks,
        images: images !== undefined ? images : originalRecord.images,
        isPullOut: isPullOut !== undefined ? isPullOut : originalRecord.isPullOut,
        absentReason: absentReason !== undefined ? absentReason : originalRecord.absentReason,
        absentReasonOther: absentReasonOther !== undefined ? absentReasonOther : originalRecord.absentReasonOther,
        underTimeTime: underTimeTime !== undefined ? underTimeTime : originalRecord.underTimeTime,
        underTimeReason: underTimeReason !== undefined ? underTimeReason : originalRecord.underTimeReason,
        underTimeReasonOther: underTimeReasonOther !== undefined ? underTimeReasonOther : originalRecord.underTimeReasonOther,
        pullOutTime: pullOutTime !== undefined ? pullOutTime : originalRecord.pullOutTime,
        pullOutSite: pullOutSite !== undefined ? pullOutSite : originalRecord.pullOutSite,
        pullOutReason: pullOutReason !== undefined ? pullOutReason : originalRecord.pullOutReason,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Write to Firebase Firestore
      let firebaseSuccess = false;
      try {
        const firestoreDb = await getDb();
        if (firestoreDb) {
          await setDoc(doc(firestoreDb, "submissions", newId), newSubmission);
          firebaseSuccess = true;
          console.log(`Successfully created new entry ${newId} (copied/updated from ${id}) in Firestore.`);
        }
      } catch (error) {
        handleFirebaseError("copySubmissionOnLaterDate", error);
      }

      // Add to local submissions list
      submissions.push({ id: newId, ...newSubmission });
      await safeWriteSubmissions(submissions);

      // Refresh the daily/monthly separate files
      await syncSeparateFiles();

      return res.json({ success: true, entry: { id: newId, ...newSubmission }, storedInFirebase: firebaseSuccess, createdNew: true });
    }

    // Otherwise, do standard overwrite/update on the same day
    const updatedSubmission = {
      ...submissions[index],
      date: date !== undefined ? date : submissions[index].date,
      project: project !== undefined ? project : submissions[index].project,
      laborsName: laborsName !== undefined ? laborsName : submissions[index].laborsName,
      designation: designation !== undefined ? designation : submissions[index].designation,
      projectLocation: projectLocation !== undefined ? projectLocation : submissions[index].projectLocation,
      siteEngineer: siteEngineer !== undefined ? siteEngineer : submissions[index].siteEngineer,
      reassignedTask: reassignedTask !== undefined ? reassignedTask : submissions[index].reassignedTask,
      attendanceStatus: attendanceStatus !== undefined ? attendanceStatus : submissions[index].attendanceStatus,
      activityName: activityName !== undefined ? activityName : submissions[index].activityName,
      workCompletedPercent: workCompletedPercent !== undefined ? workCompletedPercent : submissions[index].workCompletedPercent,
      targetDate: targetDate !== undefined ? targetDate : submissions[index].targetDate,
      workCompletedTodayPercent: workCompletedTodayPercent !== undefined ? workCompletedTodayPercent : submissions[index].workCompletedTodayPercent,
      noOfLaborSubcontractor: noOfLaborSubcontractor !== undefined ? noOfLaborSubcontractor : submissions[index].noOfLaborSubcontractor,
      equipment: equipment !== undefined ? equipment : submissions[index].equipment,
      remarks: remarks !== undefined ? remarks : submissions[index].remarks,
      images: images !== undefined ? images : submissions[index].images,
      isPullOut: isPullOut !== undefined ? isPullOut : submissions[index].isPullOut,
      absentReason: absentReason !== undefined ? absentReason : submissions[index].absentReason,
      absentReasonOther: absentReasonOther !== undefined ? absentReasonOther : submissions[index].absentReasonOther,
      underTimeTime: underTimeTime !== undefined ? underTimeTime : submissions[index].underTimeTime,
      underTimeReason: underTimeReason !== undefined ? underTimeReason : submissions[index].underTimeReason,
      underTimeReasonOther: underTimeReasonOther !== undefined ? underTimeReasonOther : submissions[index].underTimeReasonOther,
      pullOutTime: pullOutTime !== undefined ? pullOutTime : submissions[index].pullOutTime,
      pullOutSite: pullOutSite !== undefined ? pullOutSite : submissions[index].pullOutSite,
      pullOutReason: pullOutReason !== undefined ? pullOutReason : submissions[index].pullOutReason,
      updatedAt: new Date().toISOString()
    };

    submissions[index] = updatedSubmission;

    // Write to Firebase Firestore
    let firebaseSuccess = false;
    try {
      const firestoreDb = await getDb();
      if (firestoreDb) {
        await setDoc(doc(firestoreDb, "submissions", id), updatedSubmission);
        firebaseSuccess = true;
        console.log(`Successfully updated entry ${id} in Firestore.`);
      }
    } catch (error) {
      handleFirebaseError("updateSubmission", error);
    }

    // Write to local cache atomically
    await safeWriteSubmissions(submissions);

    // Refresh the daily/monthly separate files
    await syncSeparateFiles();

    res.json({ success: true, entry: updatedSubmission, storedInFirebase: firebaseSuccess, createdNew: false });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Read submissions (Admin only)
app.get("/api/submissions", requireAdmin, async (req, res) => {
  try {
    const submissions = await getSubmissions();
    // Sort by date descending (or log date)
    submissions.sort((a: any, b: any) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());
    res.json(submissions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a submission (Admin only)
app.delete("/api/submissions/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;

    // Attempt to delete from Firebase Firestore
    let firebaseSuccess = false;
    try {
      const firestoreDb = await getDb();
      if (firestoreDb) {
        await deleteDoc(doc(firestoreDb, "submissions", id));
        firebaseSuccess = true;
        console.log(`Successfully deleted entry ${id} from Firestore.`);
      }
    } catch (error) {
      handleFirebaseError("deleteSubmission", error);
    }

    // Always sync locally to remove from the local backup entries.json database
    let initialLength = 0;
    try {
      let submissions = await readLocalSubmissions();
      initialLength = submissions.length;
      submissions = submissions.filter((s: any) => s.id !== id);
      await safeWriteSubmissions(submissions);
    } catch (localError) {
      console.error("Failed to update local storage backup during deletion:", localError);
    }

    // Refresh the daily/monthly separate files
    await syncSeparateFiles();

    res.json({ success: true, deletedFromFirebase: firebaseSuccess });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get all pull-out monitoring records
app.get("/api/pull-out-monitoring", async (req, res) => {
  try {
    const records = await getMonitoringRecords();
    // Sort by date descending
    records.sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Save or update pull-out monitoring record
app.post("/api/pull-out-monitoring", async (req, res) => {
  try {
    const { id, date, site, workers } = req.body;
    if (!date || !site || !workers || !Array.isArray(workers)) {
      return res.status(400).json({ error: "Date, Site, and Workers are required." });
    }

    let records = await readLocalMonitoring();
    const finalId = id || (Date.now().toString() + "-" + Math.random().toString(36).substring(2, 6));

    // Find if there is an existing record for this date and site
    const index = records.findIndex((r: any) => r.date === date && r.site === site);

    const newRecord = {
      id: finalId,
      date,
      site,
      workers,
      createdAt: new Date().toISOString()
    };

    if (index !== -1) {
      records[index] = newRecord;
    } else {
      records.push(newRecord);
    }

    // Save to Firebase Firestore
    let firebaseSuccess = false;
    try {
      const firestoreDb = await getDb();
      if (firestoreDb) {
        await setDoc(doc(firestoreDb, "pull_out_monitoring", finalId), newRecord);
        firebaseSuccess = true;
        console.log(`Successfully stored pull-out monitoring record ${finalId} in Firestore.`);
      }
    } catch (error) {
      handleFirebaseError("createPullOutMonitoring", error);
    }

    // Save locally
    await safeWriteMonitoring(records);

    res.status(201).json({ success: true, entry: newRecord, storedInFirebase: firebaseSuccess });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a pull-out monitoring record
app.delete("/api/pull-out-monitoring/:id", async (req, res) => {
  try {
    const { id } = req.params;

    let records = await readLocalMonitoring();
    records = records.filter((r: any) => r.id !== id);

    // Save locally
    await safeWriteMonitoring(records);

    // Delete from Firebase Firestore
    let firebaseSuccess = false;
    try {
      const firestoreDb = await getDb();
      if (firestoreDb) {
        await deleteDoc(doc(firestoreDb, "pull_out_monitoring", id));
        firebaseSuccess = true;
        console.log(`Successfully deleted pull-out monitoring record ${id} from Firestore.`);
      }
    } catch (error) {
      handleFirebaseError("deletePullOutMonitoring", error);
    }

    res.json({ success: true, deletedFromFirebase: firebaseSuccess });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// List all separate daily and monthly ledger files (Admin only)
app.get("/api/ledger-files", requireAdmin, async (req, res) => {
  try {
    await syncSeparateFiles();

    const LEDGER_DIR = path.join(process.cwd(), "ledger_records");
    const DAILY_DIR = path.join(LEDGER_DIR, "daily");
    const MONTHLY_DIR = path.join(LEDGER_DIR, "monthly");

    const dailyFilesList: any[] = [];
    const monthlyFilesList: any[] = [];

    if (existsSync(DAILY_DIR)) {
      const files = await fs.readdir(DAILY_DIR);
      for (const f of files) {
        if (f.endsWith(".json")) {
          const filePath = path.join(DAILY_DIR, f);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, "utf-8");
          const records = JSON.parse(content || "[]");
          const datePart = f.replace("entries_daily_", "").replace(".json", "");

          dailyFilesList.push({
            filename: f,
            type: "daily",
            date: datePart,
            size: stats.size,
            recordCount: records.length,
            path: `/api/ledger-files/download/daily/${f}`
          });
        }
      }
    }

    if (existsSync(MONTHLY_DIR)) {
      const files = await fs.readdir(MONTHLY_DIR);
      for (const f of files) {
        if (f.endsWith(".json")) {
          const filePath = path.join(MONTHLY_DIR, f);
          const stats = await fs.stat(filePath);
          const content = await fs.readFile(filePath, "utf-8");
          const records = JSON.parse(content || "[]");
          const monthPart = f.replace("entries_monthly_", "").replace(".json", "");

          monthlyFilesList.push({
            filename: f,
            type: "monthly",
            date: monthPart,
            size: stats.size,
            recordCount: records.length,
            path: `/api/ledger-files/download/monthly/${f}`
          });
        }
      }
    }

    dailyFilesList.sort((a, b) => b.date.localeCompare(a.date));
    monthlyFilesList.sort((a, b) => b.date.localeCompare(a.date));

    res.json({
      daily: dailyFilesList,
      monthly: monthlyFilesList
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Download separate daily/monthly ledger file (Admin only)
app.get("/api/ledger-files/download/:type/:filename", requireAdmin, async (req, res) => {
  try {
    const { type, filename } = req.params;
    const format = req.query.format === "csv" ? "csv" : "json";

    if (type !== "daily" && type !== "monthly") {
      return res.status(400).send("Invalid ledger type");
    }

    const dir = type === "daily" ? "daily" : "monthly";
    const filePath = path.join(process.cwd(), "ledger_records", dir, filename);

    if (!existsSync(filePath)) {
      return res.status(404).send("File not found");
    }

    if (format === "json") {
      res.setHeader("Content-Type", "application/json");
      res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
      return res.sendFile(filePath);
    } else {
      const content = await fs.readFile(filePath, "utf-8");
      const records = JSON.parse(content || "[]");

      records.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const BOM = "\uFEFF";
      let csvContent = BOM + '"DATE","PROJECT","LABORS NAME","DESIGNATION","PROJECT LOCATION","SITE ENGINEER","REASSIGNED TASK"\n';

      for (const s of records) {
        const row = [
          s.date,
          s.project,
          s.laborsName,
          s.designation,
          s.projectLocation,
          s.siteEngineer,
          s.reassignedTask
        ].map(val => {
          const clean = (val || "").replace(/"/g, '""');
          return `"${clean}"`;
        }).join(",");
        csvContent += row + "\n";
      }

      const csvFilename = filename.replace(".json", ".csv");
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${csvFilename}"`);
      return res.send(csvContent);
    }
  } catch (error: any) {
    res.status(500).send("Error downloading file: " + error.message);
  }
});

// View separate daily/monthly ledger file records (Admin only)
app.get("/api/ledger-files/view/:type/:filename", requireAdmin, async (req, res) => {
  try {
    const { type, filename } = req.params;
    if (type !== "daily" && type !== "monthly") {
      return res.status(400).json({ error: "Invalid ledger type" });
    }

    const dir = type === "daily" ? "daily" : "monthly";
    const filePath = path.join(process.cwd(), "ledger_records", dir, filename);

    if (!existsSync(filePath)) {
      return res.status(404).json({ error: "File not found" });
    }

    const content = await fs.readFile(filePath, "utf-8");
    const records = JSON.parse(content || "[]");
    res.json(records);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export CSV (Admin only)
app.get("/api/export", requireAdmin, async (req, res) => {
  try {
    const submissions = await getSubmissions();
    // Keep only entries with actual labor attendance logged
    const laborSubmissions = submissions.filter((s: any) => s.laborsName && s.laborsName.trim() !== "");
    // Sort by date ascending for the Excel report
    laborSubmissions.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // CSV header with Byte Order Mark (BOM) for flawless Excel display with UTF-8 characters
    const BOM = "\uFEFF";
    let csvContent = BOM + '"DATE","PROJECT","LABORS NAME","DESIGNATION","PROJECT LOCATION","SITE ENGINEER","REASSIGNED TASK"\n';

    for (const s of laborSubmissions) {
      const row = [
        s.date,
        s.project,
        s.laborsName,
        s.designation,
        s.projectLocation,
        s.siteEngineer,
        s.reassignedTask
      ].map(val => {
        const clean = (val || "").replace(/"/g, '""');
        return `"${clean}"`;
      }).join(",");
      csvContent += row + "\n";
    }

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", 'attachment; filename="external_labor_log.csv"');
    res.send(csvContent);
  } catch (error: any) {
    res.status(500).send("Error generating export: " + error.message);
  }
});

// Clean up and remove pre-encoded records from June 1 to 30
async function cleanupPreEncodedRecords() {
  try {
    const DATA_FILE = path.join(process.cwd(), "entries.json");
    let localSubmissions: any[] = [];
    try {
      if (existsSync(DATA_FILE)) {
        const data = await fs.readFile(DATA_FILE, "utf-8");
        localSubmissions = JSON.parse(data || "[]");
      }
    } catch (e) {
      console.warn("Failed to read entries.json for database cleanup:", e);
    }

    const firestoreDb = await getDb();
    if (firestoreDb) {
      console.log("Checking Firestore database for pre-encoded June 1 to 30 records...");
      const colRef = collection(firestoreDb, "submissions");
      const querySnapshot = await getDocs(colRef);
      const toDelete: string[] = [];

      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        const docId = docSnap.id;
        const dateVal = data.date || "";

        // Identify pre-encoded June records:
        // 1. Starts with seed-june-
        // 2. Or is a record with date in June 2026 that does NOT exist in local backup entries.json
        const isSeedId = docId.startsWith("seed-june-");
        const isJuneDate = dateVal.startsWith("2026-06-");
        const existsLocally = localSubmissions.some((ls: any) => ls.id === docId);

        if (isSeedId || (isJuneDate && !existsLocally)) {
          toDelete.push(docId);
        }
      });

      if (toDelete.length > 0) {
        console.log(`Cleaning up ${toDelete.length} pre-encoded June records from Firestore database...`);
        for (const id of toDelete) {
          try {
            await deleteDoc(doc(firestoreDb, "submissions", id));
          } catch (dbError) {
            handleFirebaseError(`cleanupPreEncodedRecords - delete ${id}`, dbError);
          }
        }
      }
    }

    // Clean up local entries.json of any seed-june- records
    let submissions: any[] = [];
    try {
      if (existsSync(DATA_FILE)) {
        const data = await fs.readFile(DATA_FILE, "utf-8");
        submissions = JSON.parse(data || "[]");
      }
    } catch (e) {}

    const remainingSubmissions = submissions.filter((s: any) => {
      const isSeedId = s.id && s.id.startsWith("seed-june-");
      return !isSeedId;
    });

    if (submissions.length !== remainingSubmissions.length) {
      await safeWriteSubmissions(remainingSubmissions);
      console.log(`Local backup entries.json cleaned. Remaining records: ${remainingSubmissions.length}`);
    } else {
      console.log("No pre-encoded records found in local entries.json.");
    }
  } catch (error) {
    handleFirebaseError("cleanupPreEncodedRecords", error);
  }
}

// Setup Vite or production build serving
async function setupVite() {
  // Sync separate daily and monthly ledger records on startup after cleanup
  try {
    await cleanupPreEncodedRecords();
    await syncSeparateFiles();
  } catch (syncError) {
    console.error("Failed to run initial syncSeparateFiles:", syncError);
  }

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

setupVite();
