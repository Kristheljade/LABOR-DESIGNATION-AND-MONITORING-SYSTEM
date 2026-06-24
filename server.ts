import express from "express";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { initializeApp } from "firebase/app";
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

async function getDb() {
  if (db) return db;

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
    const firebaseApp = initializeApp({
      apiKey: config.apiKey,
      authDomain: config.authDomain,
      projectId: config.projectId,
      storageBucket: config.storageBucket,
      messagingSenderId: config.messagingSenderId,
      appId: config.appId
    });

    if (config.databaseId) {
      db = getFirestore(firebaseApp, config.databaseId);
    } else {
      db = getFirestore(firebaseApp);
    }
    console.log("Firebase initialized successfully with project ID:", config.projectId);
    return db;
  } catch (error) {
    console.error("Error initializing Firebase:", error);
    return null;
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

// Create submission (Public)
app.post("/api/submissions", async (req, res) => {
  try {
    const { date, project, laborsName, designation, projectLocation, siteEngineer, reassignedTask } = req.body;
    
    if (!date || !project || !laborsName || !designation || !projectLocation || !siteEngineer || !reassignedTask) {
      return res.status(400).json({ error: "All fields are required." });
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
