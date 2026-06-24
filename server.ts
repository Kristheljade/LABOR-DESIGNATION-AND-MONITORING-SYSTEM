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
  setDoc, 
  deleteDoc
} from "firebase/firestore";

dotenv.config();

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "entries.json");

app.use(express.json());

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

      // Cache locally to keep offline fallback sync
      await fs.writeFile(DATA_FILE, JSON.stringify(list, null, 2), "utf-8");
      return list;
    }
  } catch (error) {
    console.warn("Firebase fetch failed, falling back to local file cache:", error);
  }

  try {
    if (!existsSync(DATA_FILE)) {
      return [];
    }
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading submissions from fallback:", error);
    return [];
  }
}

const ADMIN_PASSCODE = process.env.ADMIN_PASSPHRASE || "123456";

// Get admin passcode
async function getAdminPasscode(): Promise<string> {
  return ADMIN_PASSCODE;
}

// Middleware to check admin passcode (Bypassed for instant direct access)
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> {
  next();
}

// API Routes

// Verify passcode (Bypassed for instant direct access)
app.post("/api/verify-passcode", async (req, res) => {
  res.json({ valid: true });
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

      // Cache locally
      await fs.writeFile(CODES_FILE, JSON.stringify(list, null, 2), "utf-8");
      return list;
    }
  } catch (error) {
    console.warn("Firebase fetch for labor codes failed, falling back to local file cache:", error);
  }

  try {
    if (!existsSync(CODES_FILE)) {
      // Default initial labor codes for standard seamless test
      const defaults = [
        { id: "BL001", code: "BL001", name: "MUHAMMAD RAMZAN" },
        { id: "BL002", code: "BL002", name: "KARTAR SINGH" },
        { id: "BL003", code: "BL003", name: "ALEXIS SÁNCHEZ" },
        { id: "BL004", code: "BL004", name: "AHMED MANSUR" }
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
    const { code, name } = req.body;
    if (!code || !name) {
      return res.status(400).json({ error: "Code and Name are required." });
    }

    const cleanCode = code.trim().toUpperCase();
    const cleanName = name.trim().toUpperCase();

    const id = cleanCode; // Use uppercase code as ID to prevent duplicates

    const newCodeItem = {
      code: cleanCode,
      name: cleanName,
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
      console.warn("Failed writing labor code to Firestore:", error);
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
      console.warn("Failed to delete labor code from Firestore:", error);
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

      // Cache locally
      await fs.writeFile(PROJECT_CODES_FILE, JSON.stringify(list, null, 2), "utf-8");
      return list;
    }
  } catch (error) {
    console.warn("Firebase fetch for project codes failed, falling back to local file cache:", error);
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
      console.warn("Failed writing project code to Firestore:", error);
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
      console.warn("Failed to delete project code from Firestore:", error);
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
    const { date, project, laborsName, designation, projectLocation, siteEngineer, reassignedTask } = req.body;
    
    if (!date || !project || !laborsName || !designation || !projectLocation || !siteEngineer || !reassignedTask) {
      return res.status(400).json({ error: "All fields are required." });
    }

    // Check for duplicate labor entry on the same day in Binlahej Ledger
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

    const id = Date.now().toString() + "-" + Math.random().toString(36).substring(2, 6);
    const newSubmission = {
      date,
      project,
      laborsName,
      designation,
      projectLocation,
      siteEngineer,
      reassignedTask,
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
      console.warn("Failed writing to Firebase Firestore, will rely on local storage cache:", error);
    }

    // Always sync locally to keep the local entries.json database up to date
    try {
      let submissions = [];
      if (existsSync(DATA_FILE)) {
        const data = await fs.readFile(DATA_FILE, "utf-8");
        submissions = JSON.parse(data || "[]");
      }
      submissions.push({ id, ...newSubmission });
      await fs.writeFile(DATA_FILE, JSON.stringify(submissions, null, 2), "utf-8");
    } catch (localError) {
      console.error("Failed to write to local storage backup:", localError);
    }

    res.status(201).json({ success: true, entry: { id, ...newSubmission }, storedInFirebase: firebaseSuccess });
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
      console.warn("Failed to delete from Firebase Firestore, will remove from local storage cache:", error);
    }

    // Always sync locally to remove from the local backup entries.json database
    let initialLength = 0;
    try {
      if (existsSync(DATA_FILE)) {
        const data = await fs.readFile(DATA_FILE, "utf-8");
        let submissions = JSON.parse(data || "[]");
        initialLength = submissions.length;
        submissions = submissions.filter((s: any) => s.id !== id);
        await fs.writeFile(DATA_FILE, JSON.stringify(submissions, null, 2), "utf-8");
      }
    } catch (localError) {
      console.error("Failed to update local storage backup during deletion:", localError);
    }

    res.json({ success: true, deletedFromFirebase: firebaseSuccess });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Export CSV (Admin only)
app.get("/api/export", requireAdmin, async (req, res) => {
  try {
    const submissions = await getSubmissions();
    // Sort by date ascending for the Excel report
    submissions.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());

    // CSV header with Byte Order Mark (BOM) for flawless Excel display with UTF-8 characters
    const BOM = "\uFEFF";
    let csvContent = BOM + '"DATE","PROJECT","LABORS NAME","DESIGNATION","PROJECT LOCATION","SITE ENGINEER","REASSIGNED TASK"\n';

    for (const s of submissions) {
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

// Setup Vite or production build serving
async function setupVite() {
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
