import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const runScript = (scriptName, req, res) => {
  const scriptPath = path.join(rootDir, scriptName);
  
  if (!fs.existsSync(scriptPath)) {
    return res.status(404).json({ message: `Script ${scriptName} not found` });
  }

  // Using cross-env or node directly. Just node works fine.
  exec(`node ${scriptPath}`, { cwd: rootDir }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error executing ${scriptName}:`, error);
      return res.status(500).json({ 
        message: `Error running ${scriptName}`, 
        error: error.message, 
        stderr 
      });
    }
    res.json({ 
      message: `Successfully executed ${scriptName}`, 
      stdout 
    });
  });
};

// Dynamic route to run any JS script in the backend root directory
router.get('/run/:scriptName', (req, res) => {
  const { scriptName } = req.params;
  
  // Security check: ensure it's a .js file and prevent directory traversal
  if (!scriptName.endsWith('.js') || scriptName.includes('..') || scriptName.includes('/') || scriptName.includes('\\')) {
    return res.status(400).json({ message: 'Invalid script name. Must be a .js file in the root directory.' });
  }
  
  runScript(scriptName, req, res);
});

export default router;
