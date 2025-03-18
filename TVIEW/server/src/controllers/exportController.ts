import { Request, Response } from 'express';
import path from 'path';
import fs from 'fs';
import { asyncHandler } from '../utils/asyncHandler';
import { ErrorResponse } from '../middleware/errorMiddleware';
import exportService from '../services/exportService';
import Person from '../models/Person';

/**
 * Create export directory if it doesn't exist
 */
const createExportDir = (): string => {
  const exportDir = process.env.EXPORT_PATH || path.join(__dirname, '../../exports');
  if (!fs.existsSync(exportDir)) {
    fs.mkdirSync(exportDir, { recursive: true });
  }
  return exportDir;
};

/**
 * @desc    Export all data
 * @route   GET /api/export/all
 * @access  Public
 */
export const exportAllData = asyncHandler(async (req: Request, res: Response) => {
  const timestamp = Date.now();
  const exportDir = path.join(createExportDir(), `export_${timestamp}`);
  
  try {
    const stats = await exportService.exportAllData(exportDir);
    
    // Create a zip file
    const archiver = require('archiver');
    const zipFilePath = path.join(createExportDir(), `timetunnel_export_${timestamp}.zip`);
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Pipe archive data to the file
    archive.pipe(output);
    
    // Add the export directory to the archive
    archive.directory(exportDir, false);
    
    // Handle archive errors
    archive.on('error', (err: Error) => {
      throw new ErrorResponse(`Archive error: ${err.message}`, 500);
    });
    
    // Finalize the archive
    await archive.finalize();
    
    // Wait for the output stream to close
    await new Promise<void>((resolve) => {
      output.on('close', resolve);
    });
    
    // Return the zip file
    res.download(zipFilePath, `timetunnel_export_${timestamp}.zip`, (err) => {
      if (err) {
        console.error('Error sending zip file:', err);
      } 
      
      // Clean up files after sending
      setTimeout(() => {
        try {
          if (fs.existsSync(zipFilePath)) {
            fs.unlinkSync(zipFilePath);
          }
          if (fs.existsSync(exportDir)) {
            fs.rmSync(exportDir, { recursive: true, force: true });
          }
        } catch (error) {
          console.error('Error cleaning up export files:', error);
        }
      }, 60000); // Clean up after 1 minute
    });
  } catch (error) {
    // Clean up created directories in case of error
    if (fs.existsSync(exportDir)) {
      fs.rmSync(exportDir, { recursive: true, force: true });
    }
    
    if (error instanceof Error) {
      throw new ErrorResponse(`Failed to export data: ${error.message}`, 500);
    } else {
      throw new ErrorResponse('Failed to export data', 500);
    }
  }
});

/**
 * @desc    Export a specific person
 * @route   GET /api/export/person/:id
 * @access  Public
 */
export const exportPerson = asyncHandler(async (req: Request, res: Response) => {
  const personId = req.params.id;
  
  // Verify person exists
  const person = await Person.findById(personId);
  if (!person) {
    throw new ErrorResponse('Person not found', 404);
  }

  const timestamp = Date.now();
  const exportDir = path.join(createExportDir(), `person_${personId}_${timestamp}`);
  
  try {
    const result = await exportService.exportPerson(personId, exportDir);
    
    // Create a zip file
    const archiver = require('archiver');
    const zipFilePath = path.join(createExportDir(), `person_${personId}_${timestamp}.zip`);
    const output = fs.createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 } // Maximum compression
    });
    
    // Pipe archive data to the file
    archive.pipe(output);
    
    // Add the export directory to the archive
    archive.directory(exportDir, false);
    
    // Finalize the archive
    await archive.finalize();
    
    // Wait for the output stream to close
    await new Promise<void>((resolve) => {
      output.on('close', resolve);
    });
    
    // Return the zip file
    res.download(zipFilePath, `person_${personId}_export.zip`, (err) => {
      if (err) {
        console.error('Error sending zip file:', err);
      }
      
      // Clean up files after sending
      setTimeout(() => {
        try {
          if (fs.existsSync(zipFilePath)) {
            fs.unlinkSync(zipFilePath);
          }
          if (fs.existsSync(exportDir)) {
            fs.rmSync(exportDir, { recursive: true, force: true });
          }
        } catch (error) {
          console.error('Error cleaning up export files:', error);
        }
      }, 60000); // Clean up after 1 minute
    });
  } catch (error) {
    // Clean up created directories in case of error
    if (fs.existsSync(exportDir)) {
      fs.rmSync(exportDir, { recursive: true, force: true });
    }
    
    if (error instanceof Error) {
      throw new ErrorResponse(`Failed to export person: ${error.message}`, 500);
    } else {
      throw new ErrorResponse('Failed to export person', 500);
    }
  }
});
