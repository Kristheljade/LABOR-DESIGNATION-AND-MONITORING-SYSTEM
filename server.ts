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

const PASSCODE_FILE = path.join(process.cwd(), "config-passcode.json");

interface PasscodeConfig {
  passcode: string;
  recoveryCode?: string;
}

// Helper to load passcode configuration with default fallbacks
async function getPasscodeConfig(): Promise<PasscodeConfig> {
  const defaultPasscode = process.env.ADMIN_PASSPHRASE || "123456";
  const defaultRecoveryCode = "KRISTHEL";
  
  try {
    if (existsSync(PASSCODE_FILE)) {
      const data = await fs.readFile(PASSCODE_FILE, "utf-8");
      const parsed = JSON.parse(data || "{}");
      return {
        passcode: parsed.passcode || defaultPasscode,
        recoveryCode: parsed.recoveryCode || parsed.recoveryAnswer || defaultRecoveryCode,
      };
    }
  } catch (error) {
    console.error("Error reading config file:", error);
  }
  return {
    passcode: defaultPasscode,
    recoveryCode: defaultRecoveryCode,
  };
}

// Get admin passcode
async function getAdminPasscode(): Promise<string> {
  const config = await getPasscodeConfig();
  return config.passcode;
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

// Reset passcode via master recovery code (Forgot password/passcode flow)
app.post("/api/reset-passcode", async (req, res) => {
  try {
    const { recoveryCode, newPasscode } = req.body;
    if (!recoveryCode || typeof recoveryCode !== "string" || recoveryCode.trim().length === 0) {
      return res.status(400).json({ error: "Master recovery code is required." });
    }
    if (!newPasscode || typeof newPasscode !== "string" || newPasscode.trim().length === 0) {
      return res.status(400).json({ error: "New passcode cannot be empty." });
    }

    const config = await getPasscodeConfig();
    const normalizedConfigCode = (config.recoveryCode || "SHAMJAS").trim().toLowerCase();
    const normalizedUserCode = recoveryCode.trim().toLowerCase();

    if (normalizedUserCode === normalizedConfigCode) {
      config.passcode = newPasscode.trim();
      await fs.writeFile(PASSCODE_FILE, JSON.stringify(config, null, 2), "utf-8");
      res.json({ success: true, message: "Security passcode reset successfully." });
    } else {
      res.status(400).json({ error: "Incorrect master recovery code. Passcode reset denied." });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update passcode and security configuration (Admin/Document Controller only)
app.post("/api/set-passcode", requireAdmin, async (req, res) => {
  try {
    const { newPasscode, recoveryCode } = req.body;
    
    const config = await getPasscodeConfig();

    if (newPasscode !== undefined) {
      if (typeof newPasscode !== "string" || newPasscode.trim().length === 0) {
        return res.status(400).json({ error: "Invalid passcode. Passcode cannot be empty." });
      }
      config.passcode = newPasscode.trim();
    }

    if (recoveryCode !== undefined) {
      if (typeof recoveryCode !== "string" || recoveryCode.trim().length === 0) {
        return res.status(400).json({ error: "Recovery code cannot be empty." });
      }
      config.recoveryCode = recoveryCode.trim();
    }

    await fs.writeFile(PASSCODE_FILE, JSON.stringify(config, null, 2), "utf-8");
    res.json({ success: true, message: "Security configurations updated successfully." });
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
