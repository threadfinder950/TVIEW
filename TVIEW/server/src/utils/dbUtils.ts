// src/utils/dbUtils.ts
import mongoose from 'mongoose';
import { logger } from './logger';

/**
 * Utility functions for database operations
 */
const dbUtils = {
  /**
   * Clear all data from the database or specific collections
   * @param {string[]} collections - Optional array of collection names to clear
   * @returns {Promise<object>} Results of the operation
   */
  async clearDatabase(collections?: string[]): Promise<Record<string, any>> {
    try {
      const results: Record<string, any> = {};
      
      // If specific collections were provided, clear only those
      if (collections && collections.length > 0) {
        for (const collectionName of collections) {
          if (mongoose.connection.collections[collectionName]) {
            const deleteResult = await mongoose.connection.collections[collectionName].deleteMany({});
            results[collectionName] = deleteResult.deletedCount || 0;
            logger.info(`Cleared collection: ${collectionName}, removed ${results[collectionName]} documents`);
          } else {
            results[collectionName] = 'Collection not found';
          }
        }
      } 
      // Otherwise clear all collections
      else {
        const allCollections = Object.keys(mongoose.connection.collections);
        for (const collectionName of allCollections) {
          const deleteResult = await mongoose.connection.collections[collectionName].deleteMany({});
          results[collectionName] = deleteResult.deletedCount || 0;
          logger.info(`Cleared collection: ${collectionName}, removed ${results[collectionName]} documents`);
        }
      }
      
      return results;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error clearing database: ${error.message}`);
        throw new Error(`Failed to clear database: ${error.message}`);
      } else {
        logger.error('Unknown error clearing database');
        throw new Error('Failed to clear database');
      }
    }
  }
};

export default dbUtils;