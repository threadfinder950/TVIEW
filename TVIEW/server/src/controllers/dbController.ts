import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import dbUtils from '../utils/dbUtils';

/**
 * @desc    Clear database collections
 * @route   POST /api/db/clear
 * @access  Admin (you might want to add authentication middleware)
 */
export const clearDatabase = asyncHandler(async (req: Request, res: Response) => {
    // Get collections to clear from request body (optional)
    const { collections } = req.body;
    
    // Clear specified collections or all if none specified
    const results = await dbUtils.clearDatabase(collections);
    
    res.status(200).json({
        success: true,
        message: 'Database cleared successfully',
        data: results
    });
});