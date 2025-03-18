import express from 'express';
import { exportAllData, exportPerson } from '../controllers/exportController';

const router = express.Router();

// Export all data
router.get('/all', exportAllData);

// Export a specific person
router.get('/person/:id', exportPerson);

export default router;
