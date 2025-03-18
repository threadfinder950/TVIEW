import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

interface AppConfig {
  // Server configuration
  port: number;
  nodeEnv: string;
  
  // Database configuration
  mongodbUri: string;
  
  // File paths
  uploadPath: string;
  exportPath: string;
  
  // Logging
  logLevel: string;
  
  // GEDCOM import settings
  maxFileSizeMB: number;
  allowedFileExtensions: string[];
  
  // Misc settings
  corsOrigin: string | string[];
}

const config: AppConfig = {
  // Server configuration
  port: parseInt(process.env.PORT || '5000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database configuration
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/timetunnel',
  
  // File paths
  uploadPath: process.env.UPLOAD_PATH || './uploads',
  exportPath: process.env.EXPORT_PATH || './exports',
  
  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',
  
  // GEDCOM import settings
  maxFileSizeMB: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  allowedFileExtensions: ['.ged'],
  
  // CORS settings - in development allow localhost, in production use specific domain
  corsOrigin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN || 'https://your-production-domain.com' 
    : ['http://localhost:3000', 'http://localhost:5173']
};

export default config;
