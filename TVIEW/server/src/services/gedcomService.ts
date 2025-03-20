import fs from 'fs';
import { logger } from '../utils/logger';
import Person from '../models/Person';
import Relationship from '../models/Relationship';
import Event from '../models/Event';

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
      // Import the module
      const parseGedcomModule = require('parse-gedcom');
      
      // Read the file content
      const gedcomContent = fs.readFileSync(filePath, 'utf8');
      
      // Use the parse method specifically
      const parsedData = parseGedcomModule.parse(gedcomContent);
      
      // Add logging to see the structure
      console.log('Parsed data structure sample:', 
        JSON.stringify(parsedData.slice(0, 3), null, 2));
      
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
      
      // parse-gedcom returns an array of records
      // We need to find individual and family records

      // First pass: extract individuals (INDI records)
      const individuals = gedcomData.filter((record: any) => record.tag === 'INDI');
      
      for (const individual of individuals) {
        try {
          const person = await this.createPersonFromGedcom(individual);
          individualMap.set(individual.pointer, person._id.toString());
          stats.individuals++;
        } catch (error) {
          if (error instanceof Error) {
            stats.errors.push(`Error importing individual ${individual.pointer}: ${error.message}`);
          } else {
            stats.errors.push(`Error importing individual ${individual.pointer}`);
          }
        }
      }

      // Second pass: extract families (FAM records)
      const families = gedcomData.filter((record: any) => record.tag === 'FAM');
      
      for (const family of families) {
        try {
          await this.createRelationshipsFromFamily(family, individualMap);
          stats.families++;
        } catch (error) {
          if (error instanceof Error) {
            stats.errors.push(`Error importing family ${family.pointer}: ${error.message}`);
          } else {
            stats.errors.push(`Error importing family ${family.pointer}`);
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
    
    // Find NAME records in the individual's data
    const nameData = individual.tree.filter((node: any) => node.tag === 'NAME');
    
    if (nameData.length > 0) {
      for (const name of nameData) {
        const fullName = name.data || '';
        // GEDCOM format often has names as "Surname, Given"
        // or "Given /Surname/"
        let given = '';
        let surname = '';
        
        if (fullName.includes('/')) {
          // Format: Given /Surname/
          const nameParts = fullName.split('/').map((part: string) => part.trim());
          given = nameParts[0] || '';
          surname = nameParts[1] || '';
        } else if (fullName.includes(',')) {
          // Format: Surname, Given
          const nameParts = fullName.split(',').map((part: string) => part.trim());
          surname = nameParts[0] || '';
          given = nameParts[1] || '';
        } else {
          // Just use the whole thing as given name
          given = fullName;
        }
        
        names.push({
          given,
          surname
        });
      }
    }

    // Extract birth information
    let birth = {};
    const birthData = individual.tree.find((node: any) => node.tag === 'BIRT');
    
    if (birthData) {
      const date = birthData.tree.find((node: any) => node.tag === 'DATE')?.data;
      const place = birthData.tree.find((node: any) => node.tag === 'PLAC')?.data;
      
      birth = {
        date: date ? new Date(date) : null,
        place: place || '',
        notes: ''
      };
    }

    // Extract death information
    let death = {};
    const deathData = individual.tree.find((node: any) => node.tag === 'DEAT');
    
    if (deathData) {
      const date = deathData.tree.find((node: any) => node.tag === 'DATE')?.data;
      const place = deathData.tree.find((node: any) => node.tag === 'PLAC')?.data;
      
      death = {
        date: date ? new Date(date) : null,
        place: place || '',
        notes: ''
      };
    }

    // Extract gender
    const sexData = individual.tree.find((node: any) => node.tag === 'SEX');
    const gender = sexData ? sexData.data : 'U';

    // Create person document
    const person = new Person({
      names,
      birth,
      death,
      gender,
      notes: '',
      sourceId: individual.pointer
    });

    await person.save();
    
    // Create events for this person
    // Filter for event tags
    const eventTags = ['RESI', 'OCCU', 'EDUC', 'GRAD', 'MILI', 'EMIG', 'IMMI'];
    
    for (const node of individual.tree) {
      if (eventTags.includes(node.tag)) {
        try {
          await this.createEventFromGedcom(node, person._id);
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
    
    // Extract date and place from the event
    const date = gedcomEvent.tree.find((node: any) => node.tag === 'DATE')?.data;
    const place = gedcomEvent.tree.find((node: any) => node.tag === 'PLAC')?.data;
    
    const event = new Event({
      person: personId,
      type: eventType,
      title: gedcomEvent.tag || 'Unknown Event',
      description: gedcomEvent.data || '',
      date: {
        start: date ? new Date(date) : null,
        isRange: false
      },
      location: {
        place: place || ''
      },
      notes: ''
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
    
    // Find husband and wife
    const husbandData = family.tree.find((node: any) => node.tag === 'HUSB');
    const wifeData = family.tree.find((node: any) => node.tag === 'WIFE');
    
    const husbandPointer = husbandData?.data;
    const wifePointer = wifeData?.data;
    
    // Create spouse relationship if both husband and wife exist
    if (husbandPointer && wifePointer) {
      const husbandId = individualMap.get(husbandPointer);
      const wifeId = individualMap.get(wifePointer);
      
      if (husbandId && wifeId) {
        // Find marriage info
        const marriageData = family.tree.find((node: any) => node.tag === 'MARR');
        let marriageDate = null;
        
        if (marriageData) {
          const datePart = marriageData.tree.find((node: any) => node.tag === 'DATE');
          if (datePart && datePart.data) {
            marriageDate = new Date(datePart.data);
          }
        }
        
        const spouseRelationship = new Relationship({
          type: 'Spouse',
          persons: [husbandId, wifeId],
          date: {
            start: marriageDate
          },
          notes: ''
        });
        
        await spouseRelationship.save();
        relationships.push(spouseRelationship);
      }
    }

    // Create parent-child relationships if children exist
    const childData = family.tree.filter((node: any) => node.tag === 'CHIL');
    
    if (childData.length > 0) {
      const parents = [];
      
      if (husbandPointer) {
        const husbandId = individualMap.get(husbandPointer);
        if (husbandId) parents.push(husbandId);
      }
      
      if (wifePointer) {
        const wifeId = individualMap.get(wifePointer);
        if (wifeId) parents.push(wifeId);
      }
      
      if (parents.length > 0) {
        for (const child of childData) {
          const childPointer = child.data;
          const dbChildId = individualMap.get(childPointer);
          
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