import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ErrorResponse } from '../middleware/errorMiddleware';
import { logger } from '../utils/logger';
import fs from 'fs';
import gedcomService from '../services/gedcomService';

interface MulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  destination: string;
  filename: string;
  path: string;
  size: number;
}

type MulterRequest = Request & {
  file?: MulterFile;
};

/**
 * @desc    Upload and process GEDCOM file
 * @route   POST /api/gedcom/upload
 * @access  Public
 */
export const uploadGedcomFile = asyncHandler(async (req: MulterRequest, res: Response) => {
  if (!req.file) {
    throw new ErrorResponse('No file uploaded', 400);
  }

  const filePath = req.file.path;
  
  logger.info(`Processing GEDCOM file: ${req.file.originalname}`);
  
  try {
    // Parse the GEDCOM file
    const parsedData = await gedcomService.parseGedcomFile(filePath);
    
    // Import the data to the database
    const importStats = await gedcomService.importToDatabase(parsedData);
    
    // Optional: delete the file after processing
    fs.unlinkSync(filePath);
    
    res.status(200).json({
      success: true,
      message: 'GEDCOM file successfully processed',
      stats: importStats
    });
  } catch (error) {
    // Clean up the file if there was an error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    
    // Re-throw with appropriate status code
    if (error instanceof Error) {
      throw new ErrorResponse(`Failed to process GEDCOM file: ${error.message}`, 500);
    } else {
      throw new ErrorResponse('Failed to process GEDCOM file', 500);
    }
  }
});
