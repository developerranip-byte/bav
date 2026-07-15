import express from 'express';
import { exec } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const router = express.Router();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.join(__dirname, '..');

const runScript = (scriptName, req, res) => {
  const scriptPath = path.join(rootDir, scriptName);
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

router.get('/seed', (req, res) => runScript('seed.js', req, res));
router.get('/seed-large', (req, res) => runScript('seedLarge.js', req, res));
router.get('/seed-users', (req, res) => runScript('seedUsers.js', req, res));
router.get('/truncate', (req, res) => runScript('truncate.js', req, res));

export default router;
