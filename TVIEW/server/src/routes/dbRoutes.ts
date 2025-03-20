// src/routes/dbRoutes.ts
import express from 'express';
import { clearDatabase } from '../controllers/dbController';

const router = express.Router();

// Add authentication middleware here if needed
// router.use(authMiddleware);

router.post('/clear', clearDatabase);

export default router;
