import express from 'express';
import seed from '../seed.js';
import seedLarge from '../seedLarge.js';
import seedUsers from '../seedUsers.js';
import truncateDatabase from '../truncate.js';

const router = express.Router();

const scripts = {
  'seed.js': seed,
  'seedLarge.js': seedLarge,
  'seedUsers.js': seedUsers,
  'truncate.js': truncateDatabase
};

router.get('/list', (req, res) => {
  res.json(Object.keys(scripts));
});

router.get('/run/:scriptName', async (req, res) => {
  const { scriptName } = req.params;
  const scriptFn = scripts[scriptName];
  
  if (!scriptFn) {
    return res.status(404).json({ message: `Script ${scriptName} not found` });
  }

  try {
    await scriptFn();
    res.json({
      message: `Successfully executed ${scriptName}`,
      stdout: 'Completed successfully.'
    });
  } catch (error) {
    console.error(`Error executing ${scriptName}:`, error);
    res.status(500).json({
      message: `Error running ${scriptName}`,
      error: error.message
    });
  }
});

export default router;
