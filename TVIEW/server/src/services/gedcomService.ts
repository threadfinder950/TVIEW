import fs from 'fs';
import { logger } from '../utils/logger';
import Person from '../models/Person';
import Relationship from '../models/Relationship';
import Event from '../models/Event';

// Note: For TypeScript, we'd ideally have type definitions for the gedcom-parser,
// but for now we'll use any types for the gedcom data structures
// You might want to create proper types based on the actual structure

interface ImportStats {
  individuals: number;
  families: number;
  events: number;
  errors: string[];
}

/**
 * Service to handle GEDCOM file parsing and database import
 */
class GedcomService {
  /**
   * Parse a GEDCOM file and return structured data
   * @param {string} filePath - Path to the GEDCOM file
   * @returns {Object} Parsed GEDCOM data
   */
  async parseGedcomFile(filePath: string): Promise<any> {
    try {
      // Import the parser using the updated package
      const { parse } = require('@lewisl9029/gedcom-parser');
      
      // Read the file content
      const gedcomContent = fs.readFileSync(filePath, 'utf8');
      
      // Parse the content
      const parsedData = parse(gedcomContent);
      
      return parsedData;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error parsing GEDCOM file: ${error.message}`);
        throw new Error(`Failed to parse GEDCOM file: ${error.message}`);
      } else {
        logger.error('Unknown error parsing GEDCOM file');
        throw new Error('Failed to parse GEDCOM file');
      }
    }
  }

  /**
   * Import GEDCOM data into the database
   * @param {Object} gedcomData - Parsed GEDCOM data
   * @returns {Object} Import statistics
   */
  async importToDatabase(gedcomData: any): Promise<ImportStats> {
    try {
      const stats: ImportStats = {
        individuals: 0,
        families: 0,
        events: 0,
        errors: []
      };

      // Process individuals
      const individualMap = new Map<string, string>(); // Map GEDCOM IDs to database IDs
      
      if (gedcomData.individuals) {
        for (const individual of gedcomData.individuals) {
          try {
            const person = await this.createPersonFromGedcom(individual);
            individualMap.set(individual.id, person._id.toString());
            stats.individuals++;
          } catch (error) {
            if (error instanceof Error) {
              stats.errors.push(`Error importing individual ${individual.id}: ${error.message}`);
            } else {
              stats.errors.push(`Error importing individual ${individual.id}`);
            }
          }
        }
      }

      // Process families and relationships
      if (gedcomData.families) {
        for (const family of gedcomData.families) {
          try {
            await this.createRelationshipsFromFamily(family, individualMap);
            stats.families++;
          } catch (error) {
            if (error instanceof Error) {
              stats.errors.push(`Error importing family ${family.id}: ${error.message}`);
            } else {
              stats.errors.push(`Error importing family ${family.id}`);
            }
          }
        }
      }

      return stats;
    } catch (error) {
      if (error instanceof Error) {
        logger.error(`Error importing GEDCOM data: ${error.message}`);
        throw new Error(`Failed to import GEDCOM data: ${error.message}`);
      } else {
        logger.error('Unknown error importing GEDCOM data');
        throw new Error('Failed to import GEDCOM data');
      }
    }
  }

  /**
   * Create a Person document from GEDCOM individual data
   * @param {Object} individual - GEDCOM individual record
   * @returns {Object} Created Person document
   */
  private async createPersonFromGedcom(individual: any) {
    // Extract name(s)
    const names = [];
    if (individual.name) {
      names.push({
        given: individual.name.given || '',
        surname: individual.name.surname || '',
        // No date ranges in basic GEDCOM, so we leave these null
      });
    }

    // Extract birth information
    let birth = {};
    const birthEvent = individual.events?.find((e: any) => e.tag === 'BIRT');
    if (birthEvent) {
      birth = {
        date: birthEvent.date ? new Date(birthEvent.date) : null,
        place: birthEvent.place || '',
        notes: birthEvent.note || ''
      };
    }

    // Extract death information
    let death = {};
    const deathEvent = individual.events?.find((e: any) => e.tag === 'DEAT');
    if (deathEvent) {
      death = {
        date: deathEvent.date ? new Date(deathEvent.date) : null,
        place: deathEvent.place || '',
        notes: deathEvent.note || ''
      };
    }

    // Create person document
    const person = new Person({
      names,
      birth,
      death,
      gender: individual.gender || 'U',
      notes: individual.note || '',
      sourceId: individual.id
    });

    await person.save();
    
    // Create events for this person
    if (individual.events) {
      for (const gedcomEvent of individual.events) {
        // Skip birth and death events as they're already handled
        if (gedcomEvent.tag === 'BIRT' || gedcomEvent.tag === 'DEAT') continue;
        
        try {
          await this.createEventFromGedcom(gedcomEvent, person._id);
        } catch (error) {
          if (error instanceof Error) {
            logger.error(`Error creating event for person ${person._id}: ${error.message}`);
          } else {
            logger.error(`Error creating event for person ${person._id}`);
          }
        }
      }
    }

    return person;
  }

  /**
   * Create an Event document from GEDCOM event data
   * @param {Object} gedcomEvent - GEDCOM event record
   * @param {ObjectId} personId - Database ID of the related person
   * @returns {Object} Created Event document
   */
  private async createEventFromGedcom(gedcomEvent: any, personId: string) {
    // Map GEDCOM event tags to our event types
    const eventTypeMap: Record<string, string> = {
      'RESI': 'Residence',
      'OCCU': 'Work',
      'EDUC': 'Education',
      'GRAD': 'Education',
      'MILI': 'Military',
      'EMIG': 'Travel',
      'IMMI': 'Travel',
      // Add more mappings as needed
    };

    const eventType = (eventTypeMap[gedcomEvent.tag] || 'Custom') as any;
    
    const event = new Event({
      person: personId,
      type: eventType,
      title: gedcomEvent.tag || 'Unknown Event',
      description: gedcomEvent.description || '',
      date: {
        start: gedcomEvent.date ? new Date(gedcomEvent.date) : null,
        isRange: false
      },
      location: {
        place: gedcomEvent.place || ''
      },
      notes: gedcomEvent.note || ''
    });

    await event.save();
    return event;
  }

  /**
   * Create Relationship documents from GEDCOM family data
   * @param {Object} family - GEDCOM family record
   * @param {Map} individualMap - Map of GEDCOM IDs to database IDs
   * @returns {Array} Created Relationship documents
   */
  private async createRelationshipsFromFamily(family: any, individualMap: Map<string, string>) {
    const relationships = [];

    // Create spouse relationship if both husband and wife exist
    if (family.husband && family.wife) {
      const husbandId = individualMap.get(family.husband);
      const wifeId = individualMap.get(family.wife);
      
      if (husbandId && wifeId) {
        const spouseRelationship = new Relationship({
          type: 'Spouse',
          persons: [husbandId, wifeId],
          date: {
            start: family.marriage ? new Date(family.marriage.date) : null
          },
          notes: family.marriage ? family.marriage.note || '' : ''
        });
        
        await spouseRelationship.save();
        relationships.push(spouseRelationship);
      }
    }

    // Create parent-child relationships if children exist
    if (family.children && family.children.length > 0) {
      const parents = [];
      
      if (family.husband) {
        const husbandId = individualMap.get(family.husband);
        if (husbandId) parents.push(husbandId);
      }
      
      if (family.wife) {
        const wifeId = individualMap.get(family.wife);
        if (wifeId) parents.push(wifeId);
      }
      
      if (parents.length > 0) {
        for (const childId of family.children) {
          const dbChildId = individualMap.get(childId);
          
          if (dbChildId) {
            for (const parentId of parents) {
              const parentChildRelationship = new Relationship({
                type: 'Parent-Child',
                persons: [parentId, dbChildId]
              });
              
              await parentChildRelationship.save();
              relationships.push(parentChildRelationship);
            }
          }
        }
      }
    }

    return relationships;
  }
}

export default new GedcomService();
