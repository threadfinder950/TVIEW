import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import Person, { IPerson } from '../models/Person';
import Event, { IEvent } from '../models/Event';
import Relationship, { IRelationship } from '../models/Relationship';
import Media, { IMedia } from '../models/Media';

interface ExportStats {
  persons: number;
  events: number;
  relationships: number;
  media: number;
}

interface PersonExportResult {
  filePath: string;
  stats: {
    events: number;
    relationships: number;
    media: number;
  };
  person: any;
}

/**
 * Service to export data in a format compatible with Time Tunnel VR application
 */
class ExportService {
  /**
   * Export all data to a directory
   * @param {string} exportDir - Directory to export data to
   * @returns {Object} Export statistics
   */
  async exportAllData(exportDir: string): Promise<ExportStats> {
    try {
      // Create export directory if it doesn't exist
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      const stats: ExportStats = {
        persons: 0,
        events: 0,
        relationships: 0,
        media: 0
      };
      
      // Export persons
      const persons = await Person.find();
      const personsData = await this.processPersons(persons);
      fs.writeFileSync(
        path.join(exportDir, 'persons.json'),
        JSON.stringify(personsData, null, 2)
      );
      stats.persons = persons.length;
      
      // Export events
      const events = await Event.find().populate('person');
      const eventsData = await this.processEvents(events);
      fs.writeFileSync(
        path.join(exportDir, 'events.json'),
        JSON.stringify(eventsData, null, 2)
      );
      stats.events = events.length;
      
      // Export relationships
      const relationships = await Relationship.find().populate('persons');
      const relationshipsData = await this.processRelationships(relationships);
      fs.writeFileSync(
        path.join(exportDir, 'relationships.json'),
        JSON.stringify(relationshipsData, null, 2)
      );
      stats.relationships = relationships.length;
      
      // Export media
      const media = await Media.find();
      const mediaData = await this.processMedia(media, exportDir);
      fs.writeFileSync(
        path.join(exportDir, 'media.json'),
        JSON.stringify(mediaData, null, 2)
      );
      stats.media = media.length;
      
      // Create an index file with metadata
      const metadata = {
        exportDate: new Date(),
        stats,
        version: '1.0'
      };
      fs.writeFileSync(
        path.join(exportDir, 'metadata.json'),
        JSON.stringify(metadata, null, 2)
      );
      
      return stats;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error exporting data: ${error.message}`);
        throw new Error(`Failed to export data: ${error.message}`);
      } else {
        logger.error('Unknown error exporting data');
        throw new Error('Failed to export data');
      }
    }
  }
  
  /**
   * Process person data for export
   * @param {Array} persons - Array of Person documents
   * @returns {Array} Processed person data
   */
  async processPersons(persons: IPerson[]): Promise<any[]> {
    return persons.map(person => ({
      id: person._id.toString(),
      names: person.names.map(name => ({
        given: name.given,
        surname: name.surname,
        fromDate: name.fromDate,
        toDate: name.toDate
      })),
      birth: person.birth ? {
        date: person.birth.date,
        place: person.birth.place,
        notes: person.birth.notes
      } : null,
      death: person.death ? {
        date: person.death.date,
        place: person.death.place,
        notes: person.death.notes
      } : null,
      gender: person.gender,
      mediaIds: person.media?.map(id => id.toString()) || [],
      notes: person.notes,
      sourceId: person.sourceId,
      customFields: person.customFields
    }));
  }
  
  /**
   * Process event data for export
   * @param {Array} events - Array of Event documents
   * @returns {Array} Processed event data
   */
  async processEvents(events: IEvent[]): Promise<any[]> {
    return events.map(event => ({
      id: event._id.toString(),
      personId: event.person ? event.person.toString() : null,
      type: event.type,
      title: event.title,
      description: event.description,
      date: {
        start: event.date?.start,
        end: event.date?.end,
        isRange: event.date?.isRange
      },
      location: event.location ? {
        place: event.location.place,
        coordinates: event.location.coordinates ? {
          latitude: event.location.coordinates.latitude,
          longitude: event.location.coordinates.longitude
        } : null
      } : null,
      mediaIds: event.media?.map(id => id.toString()) || [],
      notes: event.notes,
      sources: event.sources,
      customFields: event.customFields
    }));
  }
  
  /**
   * Process relationship data for export
   * @param {Array} relationships - Array of Relationship documents
   * @returns {Array} Processed relationship data
   */
  async processRelationships(relationships: IRelationship[]): Promise<any[]> {
    return relationships.map(relationship => ({
      id: relationship._id.toString(),
      type: relationship.type,
      personIds: relationship.persons.map(person => person.toString()),
      date: relationship.date ? {
        start: relationship.date.start,
        end: relationship.date.end
      } : null,
      notes: relationship.notes
    }));
  }
  
  /**
   * Process media data for export and copy media files
   * @param {Array} media - Array of Media documents
   * @param {string} exportDir - Directory to export media files to
   * @returns {Array} Processed media data
   */
  async processMedia(media: IMedia[], exportDir: string): Promise<any[]> {
    // Create media directory
    const mediaDir = path.join(exportDir, 'media');
    if (!fs.existsSync(mediaDir)) {
      fs.mkdirSync(mediaDir, { recursive: true });
    }
    
    return Promise.all(media.map(async (item) => {
      // Copy the media file to the export directory
      const sourceFilePath = item.file.path;
      const fileName = path.basename(sourceFilePath);
      const destFilePath = path.join(mediaDir, fileName);
      
      try {
        // Check if source file exists
        if (fs.existsSync(sourceFilePath)) {
          fs.copyFileSync(sourceFilePath, destFilePath);
        }
      } catch (error) {
        if (error instanceof Error) {
          logger.error(`Error copying media file ${fileName}: ${error.message}`);
        } else {
          logger.error(`Error copying media file ${fileName}`);
        }
      }
      
      return {
        id: item._id.toString(),
        type: item.type,
        title: item.title,
        description: item.description,
        file: {
          path: `media/${fileName}`,
          originalName: item.file.originalName,
          mimeType: item.file.mimeType,
          size: item.file.size
        },
        date: item.date,
        tags: item.tags,
        personIds: item.persons.map(id => id.toString()),
        eventIds: item.events.map(id => id.toString()),
        notes: item.notes
      };
    }));
  }
  
  /**
   * Export data for a specific person
   * @param {string} personId - ID of the person to export
   * @param {string} exportDir - Directory to export data to
   * @returns {Object} Export statistics and person data
   */
  async exportPerson(personId: string, exportDir: string): Promise<PersonExportResult> {
    try {
      // Create export directory if it doesn't exist
      if (!fs.existsSync(exportDir)) {
        fs.mkdirSync(exportDir, { recursive: true });
      }
      
      // Get the person
      const person = await Person.findById(personId);
      if (!person) {
        throw new Error(`Person with ID ${personId} not found`);
      }
      
      // Process person data
      const personData = (await this.processPersons([person]))[0];
      
      // Get and process events for this person
      const events = await Event.find({ person: personId });
      const eventsData = await this.processEvents(events);
      
      // Get relationships involving this person
      const relationships = await Relationship.find({ persons: personId }).populate('persons');
      const relationshipsData = await this.processRelationships(relationships);
      
      // Get media for this person
      const personMediaIds = person.media?.map(id => id.toString()) || [];
      const media = await Media.find({ _id: { $in: personMediaIds } });
      const mediaData = await this.processMedia(media, exportDir);
      
      // Create a single export file with all data
      const exportData = {
        person: personData,
        events: eventsData,
        relationships: relationshipsData,
        media: mediaData,
        exportDate: new Date(),
        version: '1.0'
      };
      
      // Write to file
      const exportFilePath = path.join(exportDir, `person_${personId}.json`);
      fs.writeFileSync(exportFilePath, JSON.stringify(exportData, null, 2));
      
      return {
        filePath: exportFilePath,
        stats: {
          events: events.length,
          relationships: relationships.length,
          media: media.length
        },
        person: personData
      };
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error exporting person ${personId}: ${error.message}`);
        throw new Error(`Failed to export person: ${error.message}`);
      } else {
        logger.error(`Unknown error exporting person ${personId}`);
        throw new Error('Failed to export person');
      }
    }
  }
}

export default new ExportService();