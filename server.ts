import express from "express";
import fs from "fs/promises";
import { existsSync } from "fs";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(process.cwd(), "entries.json");

app.use(express.json());

// Helper to read submissions
async function getSubmissions(): Promise<any[]> {
  try {
    if (!existsSync(DATA_FILE)) {
      return [];
    }
    const data = await fs.readFile(DATA_FILE, "utf-8");
    return JSON.parse(data || "[]");
  } catch (error) {
    console.error("Error reading submissions:", error);
    return [];
  }
}

// Helper to save submissions
async function saveSubmissions(submissions: any[]): Promise<void> {
  try {
    await fs.writeFile(DATA_FILE, JSON.stringify(submissions, null, 2), "utf-8");
  } catch (error) {
    console.error("Error saving submissions:", error);
  }
}

const ADMIN_PASSCODE = process.env.ADMIN_PASSPHRASE || "123456";

// Get admin passcode
async function getAdminPasscode(): Promise<string> {
  return ADMIN_PASSCODE;
}

// Middleware to check admin passcode
async function requireAdmin(req: express.Request, res: express.Response, next: express.NextFunction): Promise<any> {
  try {
    const code = req.headers["x-admin-passcode"] || req.query.passcode;
    const currentPasscode = await getAdminPasscode();
    if (!code || code !== currentPasscode) {
      return res.status(401).json({ error: "Unauthorized: Invalid passcode" });
    }
    next();
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

// API Routes

// Verify passcode
app.post("/api/verify-passcode", async (req, res) => {
  try {
    const { passcode } = req.body;
    const currentPasscode = await getAdminPasscode();
    if (passcode === currentPasscode) {
      res.json({ valid: true });
    } else {
      res.json({ valid: false });
    }
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

    const submissions = await getSubmissions();
    const newSubmission = {
      id: Date.now().toString() + "-" + Math.random().toString(36).substring(2, 6),
      date,
      project,
      laborsName,
      designation,
      projectLocation,
      siteEngineer,
      reassignedTask,
      createdAt: new Date().toISOString()
    };

    submissions.push(newSubmission);
    await saveSubmissions(submissions);

    res.status(201).json({ success: true, entry: newSubmission });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Read submissions (Admin only)
app.get("/api/submissions", requireAdmin, async (req, res) => {
  try {
    const submissions = await getSubmissions();
    // Sort by date descending (or log date)
    submissions.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    res.json(submissions);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete a submission (Admin only)
app.delete("/api/submissions/:id", requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    let submissions = await getSubmissions();
    const initialLength = submissions.length;
    submissions = submissions.filter((s: any) => s.id !== id);

    if (submissions.length === initialLength) {
      return res.status(404).json({ error: "Submission not found" });
    }

    await saveSubmissions(submissions);
    res.json({ success: true });
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
