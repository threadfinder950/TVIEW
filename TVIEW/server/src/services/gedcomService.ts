import fs from 'fs';
import path from 'path';
import { logger } from '../utils/logger';
import Person from '../models/Person';
import Relationship from '../models/Relationship';
import Event from '../models/Event';
import Media from '../models/Media';
import { safeDate } from '../utils/dateUtils';
import mongoose from 'mongoose';

interface ImportStats {
  individuals: number;
  families: number;
  events: number;
  media: number;
  errors: string[];
  warnings?: string[]; // For non-critical issues like missing family references
}
class GedcomService {
  /**
   * Parses a GEDCOM file and returns structured data.
   * @param {string} filePath - Path to the GEDCOM file.
   * @returns {Array} Parsed GEDCOM data.
   */
  async parseGedcomFile(filePath: string): Promise<any[]> {
    try {
      const parseGedcomModule = require('parse-gedcom');
  
      const { size } = await fs.promises.stat(filePath);
      logger.info(`Starting GEDCOM file import: ${filePath} (${(size / 1024).toFixed(2)} KB)`);
  
      const gedcomContent = await fs.promises.readFile(filePath, 'utf8');
      logger.info(`GEDCOM file successfully read, size: ${gedcomContent.length} characters`);
  
      const parsedData = parseGedcomModule.parse(gedcomContent);
  
      // Ensure parsedData.children exists and is an array
      const gedcomRecords = parsedData.children || [];
  
      if (!Array.isArray(gedcomRecords)) {
        throw new Error("Parsed GEDCOM data does not contain a valid 'children' array");
      }
  
      // Log the first few records for debugging
      logger.debug("First 5 GEDCOM Records:", JSON.stringify(gedcomRecords.slice(0, 5), null, 2));
  
      logger.info(`Parsed ${gedcomRecords.length} total records from GEDCOM file`);
      return gedcomRecords;
    } catch (error) {
      const err = error as Error;
      logger.error(`Error parsing GEDCOM file: ${err.message}`, { stack: err.stack });
      throw new Error(`Failed to parse GEDCOM file: ${err.message}`);
    }
  }
  
  /**
   * Imports GEDCOM data into the database.
   * @param {Array} gedcomData - Parsed GEDCOM data.
   * @returns {Object} Import statistics.
   */
  async importToDatabase(gedcomData: any[]): Promise<ImportStats> {
    try {
      if (!Array.isArray(gedcomData)) {
        throw new Error("GEDCOM data is not an array");
      }
  
      logger.info(`Starting GEDCOM import: ${gedcomData.length} records found`);
  
      const stats: ImportStats = {
        individuals: 0,
        families: 0,
        events: 0,
        media: 0,
        errors: []
      };
  
      // First, process media objects
      const mediaMap = await this.processMediaObjects(gedcomData);
      logger.info(`Processed ${mediaMap.size} media objects`);
      stats.media = mediaMap.size;
  
      const individualMap = new Map<string, string>();
      const familyMap = new Map<string, boolean>();
  
      // Process Individuals (INDI)
      const individuals = gedcomData.filter((record) => record.type === 'INDI');
      logger.info(`Processing ${individuals.length} individuals...`);
  
      for (const individual of individuals) {
        try {
          const individualId = individual.data?.xref_id;
          if (!individualId) {
            logger.warn(`Skipping individual with missing xref_id: ${JSON.stringify(individual, null, 2)}`);
            continue;
          }
  
          logger.debug(`Processing individual: ${individualId}`);
  
          const person = await this.createPersonFromGedcom(individual);
          individualMap.set(individualId, person._id.toString());
          stats.individuals++;
  
          // Create additional events for this person
          const additionalEvents = await this.createEventsFromGedcom(individual, person._id.toString());
          stats.events += additionalEvents;
        } catch (error) {
          const err = error as Error;
          stats.errors.push(`Error importing individual: ${err.message}`);
        }
      }
  
      // Process Families (FAM)
      const families = gedcomData.filter((record) => record.type === 'FAM');
      logger.info(`Processing ${families.length} families...`);
  
      for (const family of families) {
        try {
          const familyId = family.data?.xref_id;
          if (familyId) {
            familyMap.set(familyId, true);
          }
          
          await this.createRelationshipsFromFamily(family, individualMap);
          stats.families++;
        } catch (error) {
          const err = error as Error;
          stats.errors.push(`Error importing family: ${err.message}`);
        }
      }
      
      // Check for missing family references
      await this.verifyFamilyReferences(individualMap, familyMap, stats);
      
      // Link media objects to people
      await this.linkMediaObjects(gedcomData, individualMap, mediaMap);
  
      logger.info(`Imported ${stats.individuals} individuals, ${stats.families} families, and ${stats.events} events successfully`);
      logger.info(`Linked ${mediaMap.size} media objects`);
  
      return stats;
    } catch (error) {
      const err = error as Error;
      logger.error(`Error importing GEDCOM data: ${err.message}`, { stack: err.stack });
      throw new Error(`Failed to import GEDCOM data: ${err.message}`);
    }
  }

  /**
   * Creates a Person document from GEDCOM individual data.
   */
  private async createPersonFromGedcom(individual: any) {
    const individualId = individual.data?.xref_id || "Unknown";
    logger.debug(`Processing individual: ${individualId}`);
  
    const names = [];
    const nameData = individual.children?.filter((node: any) => node.type === 'NAME') || [];
  
    for (const name of nameData) {
      const fullName = name.value || '';
      const [given, surname] = fullName.includes('/') ? fullName.split('/').map((s: string) => s.replace(/\//g, '').trim()) : [fullName, ''];
      names.push({ given, surname });
    }
  
    // Extract birth and death information
    const birth = this.extractEventData(individual, 'BIRT');
    const death = this.extractEventData(individual, 'DEAT');
  
    const gender = individual.children?.find((node: any) => node.type === 'SEX')?.value || 'U';
    
    // Extract notes
    const noteNodes = individual.children?.filter((node: any) => node.type === 'NOTE') || [];
    let notes = '';
    for (const noteNode of noteNodes) {
      if (noteNode.value) {
        notes += (notes ? '\n\n' : '') + noteNode.value;
      }
      
      // Add continuation lines
      const contNodes = noteNode.children?.filter((node: any) => node.type === 'CONT') || [];
      for (const contNode of contNodes) {
        if (contNode.value) {
          notes += '\n' + contNode.value;
        }
      }
    }
    
    // Create additional custom fields for information that doesn't fit elsewhere
    const customFields: Record<string, any> = {};
    
    // Extract email if present
    const emailNode = individual.children?.find((node: any) => node.type === 'EMAIL');
    if (emailNode && emailNode.value) {
      customFields.email = emailNode.value;
    }
    
    // Extract source citations
    const sourceNodes = individual.children?.filter((node: any) => node.type === 'SOUR') || [];
    if (sourceNodes.length > 0) {
      customFields.sources = sourceNodes.map((source: any) => {
        const sourceId = source.data?.value || source.value || '';
        const pageNode = source.children?.find((node: any) => node.type === 'PAGE');
        const page = pageNode?.value || '';
        
        return sourceId + (page ? ` (${page})` : '');
      }).filter(Boolean);
    }
    
    // Extract family references (FAMC = child in family, FAMS = spouse in family)
    const famcNodes = individual.children?.filter((node: any) => node.type === 'FAMC') || [];
    const famsNodes = individual.children?.filter((node: any) => node.type === 'FAMS') || [];
    
    if (famcNodes.length > 0) {
      customFields.childInFamilies = famcNodes.map((node: any) => 
        node.data?.value || node.value
      ).filter(Boolean);
    }
    
    if (famsNodes.length > 0) {
      customFields.spouseInFamilies = famsNodes.map((node: any) => 
        node.data?.value || node.value
      ).filter(Boolean);
    }
  
    const person = new Person({
      names,
      birth,
      death,
      gender,
      notes,
      sourceId: individualId,
      media: [], // Media IDs will be linked later
      customFields
    });
  
    await person.save();
    logger.debug(`Saved person ${individualId} to database (ID: ${person._id})`);
  
    return person;
  }
  
  /**
   * Extracts event data from a GEDCOM node
   */
  private extractEventData(individual: any, eventType: string) {
    const eventNode = individual.children?.find((node: any) => 
      node.type === eventType
    );
    
    if (!eventNode) return {};
    
    const dateNode = eventNode.children?.find((node: any) => 
      node.type === 'DATE'
    );
    
    const placeNode = eventNode.children?.find((node: any) => 
      node.type === 'PLAC'
    );
    
    const noteNodes = eventNode.children?.filter((node: any) => 
      node.type === 'NOTE'
    ) || [];
    
    let notes = '';
    for (const noteNode of noteNodes) {
      if (noteNode.value) {
        notes += (notes ? '\n\n' : '') + noteNode.value;
      }
      
      // Add continuation lines
      const contNodes = noteNode.children?.filter((node: any) => node.type === 'CONT') || [];
      for (const contNode of contNodes) {
        if (contNode.value) {
          notes += '\n' + contNode.value;
        }
      }
    }
    
    return {
      // Use safeDate to handle invalid dates
      date: dateNode ? safeDate(dateNode.value) : null,
      place: placeNode ? placeNode.value : '',
      notes: notes
    };
  }

  /**
   * Creates additional events for a person from GEDCOM data
   */
  private async createEventsFromGedcom(individual: any, personId: string): Promise<number> {
    let eventCount = 0;
    
    // Define event types to look for in GEDCOM
    const eventTypes = [
      { gedcom: 'BIRT', type: 'Birth', title: 'Birth' },
      { gedcom: 'CHR', type: 'Baptism', title: 'Christening' },
      { gedcom: 'DEAT', type: 'Death', title: 'Death' },
      { gedcom: 'BURI', type: 'Burial', title: 'Burial' },
      { gedcom: 'CREM', type: 'Burial', title: 'Cremation' },
    
      { gedcom: 'NAME', type: 'Identity', title: 'Name' }, // optional: skip if not stored
      { gedcom: 'NICK', type: 'Identity', title: 'Nickname' }, // same
      { gedcom: 'TITL', type: 'Identity', title: 'Title' }, // same
    
      { gedcom: 'MARR', type: 'Marriage', title: 'Marriage' },
      { gedcom: 'ENGA', type: 'Engagement', title: 'Engagement' },
      { gedcom: 'DIV', type: 'Divorce', title: 'Divorce' },
      { gedcom: 'DIVF', type: 'Divorce', title: 'Divorce Filed' },
      { gedcom: 'MARS', type: 'Marriage', title: 'Marriage Settlement' },
    
      { gedcom: 'ADOP', type: 'Adoption', title: 'Adoption' },
      { gedcom: 'BAPM', type: 'Baptism', title: 'Baptism' },
      { gedcom: 'BARM', type: 'Baptism', title: 'Bar Mitzvah' },
      { gedcom: 'BASM', type: 'Baptism', title: 'Bas Mitzvah' },
      { gedcom: 'CHRA', type: 'Baptism', title: 'Adult Christening' },
      { gedcom: 'CONF', type: 'Baptism', title: 'Confirmation' },
    
      { gedcom: 'EDUC', type: 'Education', title: 'Education' },
      { gedcom: 'GRAD', type: 'Graduation', title: 'Graduation' },
      { gedcom: 'OCCU', type: 'Work', title: 'Occupation' },
      { gedcom: 'RETI', type: 'Retirement', title: 'Retirement' },
      { gedcom: 'RESI', type: 'Residence', title: 'Residence' },
    
      { gedcom: 'MILI', type: 'Military', title: 'Military Service' },
      { gedcom: 'PROB', type: 'Legal', title: 'Probate' }, // optional
      { gedcom: 'WILL', type: 'Legal', title: 'Will' }, // optional
      { gedcom: 'NATI', type: 'Custom', title: 'Nationality' },
      { gedcom: 'EMIG', type: 'Custom', title: 'Emigration' },
      { gedcom: 'IMMI', type: 'Custom', title: 'Immigration' },
      { gedcom: 'CITI', type: 'Custom', title: 'Naturalization' },
    
      { gedcom: 'DSCR', type: 'Medical', title: 'Physical Description' },
      { gedcom: 'CAST', type: 'Custom', title: 'Caste' },
      { gedcom: 'RELI', type: 'Custom', title: 'Religion' },
    
      { gedcom: 'EVEN', type: 'Custom', title: 'Custom Event' },
      { gedcom: 'CENS', type: 'Census', title: 'Census' },
      { gedcom: 'FACT', type: 'Custom', title: 'Fact' },
      { gedcom: 'UID', type: 'Technical', title: 'Unique Identifier' }, // skip if not meaningful
    ];
    
  
    for (const eventDef of eventTypes) {
      const eventNodes = individual.children?.filter((node: any) => 
        node.type === eventDef.gedcom
      ) || [];
  
      for (const eventNode of eventNodes) {
        try {
          const dateNode = eventNode.children?.find((node: any) => node.type === 'DATE');
          const placeNode = eventNode.children?.find((node: any) => node.type === 'PLAC');
          const noteNodes = eventNode.children?.filter((node: any) => node.type === 'NOTE') || [];
          const sourceNodes = eventNode.children?.filter((node: any) => node.type === 'SOUR') || [];
          
          // Combine all notes into a single string
          let notes = '';
          for (const noteNode of noteNodes) {
            let noteText = noteNode.value || '';
            
            // Add continuation lines
            const contNodes = noteNode.children?.filter((node: any) => node.type === 'CONT') || [];
            for (const contNode of contNodes) {
              noteText += '\n' + (contNode.value || '');
            }
            
            if (noteText) {
              notes += (notes ? '\n\n' : '') + noteText;
            }
          }
          
          // Extract source citations
          const sources = sourceNodes.map((sourceNode: any) => {
            const sourceId = sourceNode.data?.value || sourceNode.value || '';
            const pageNode = sourceNode.children?.find((node: any) => node.type === 'PAGE');
            const page = pageNode?.value || '';
            
            return sourceId + (page ? ` (${page})` : '');
          });
          
          // Get description from the event value or note
          const description = eventNode.value || '';
          
          // Create event object
          const eventData = {
            person: personId,
            persons: [personId],
            type: eventDef.type,
            title: eventDef.title,
            description: description,
            date: {
              start: dateNode ? safeDate(dateNode.value) : null,
              isRange: false
            },
            location: {
              place: placeNode ? placeNode.value : ''
            },
            notes: notes,
            sources: sources
          };
  
          // Save event to database
          const event = new Event(eventData);
          await event.save();
          eventCount++;
          
        } catch (error) {
          const err = error as Error;
          logger.warn(`Failed to create event ${eventDef.gedcom} for person ${personId}: ${err.message}`);
        }
      }
    }
    
    // Process address information as a residence event if not already captured
    const addrNode = individual.children?.find((node: any) => node.type === 'ADDR');
    if (addrNode) {
      try {
        const noteNode = addrNode.children?.find((node: any) => node.type === 'NOTE');
        const addressText = noteNode?.value || addrNode.value || '';
        
        if (addressText) {
          const eventData = {
            person: personId,
            persons: [personId],
            type: 'Residence',
            title: 'Address',
            description: 'Address information',
            location: {
              place: addressText
            },
            notes: ''
          };
          
          const event = new Event(eventData);
          await event.save();
          eventCount++;
        }
      } catch (error) {
        const err = error as Error;
        logger.warn(`Failed to create address event for person ${personId}: ${err.message}`);
      }
    }
    
    // Process email as custom contact event
    const emailNode = individual.children?.find((node: any) => node.type === 'EMAIL');
    if (emailNode && emailNode.value) {
      try {
        const eventData = {
          person: personId,
          persons: [personId],
          type: 'Custom',
          title: 'Contact Information',
          description: `Email: ${emailNode.value}`,
          notes: ''
        };
        
        const event = new Event(eventData);
        await event.save();
        eventCount++;
      } catch (error) {
        const err = error as Error;
        logger.warn(`Failed to create email event for person ${personId}: ${err.message}`);
      }
    }
  
    return eventCount; 
  }

  /**
   * Creates Relationships from GEDCOM family data.
   */
  private async createRelationshipsFromFamily(family: any, individualMap: Map<string, string>) {
    const familyId = family.data?.xref_id || 'Unknown';
    logger.debug(`Processing family: ${familyId}`);
    logger.debug(`[FAMILY] Processing ${familyId}`);
    logger.debug(`[FAMILY] Children raw: ${JSON.stringify(family.children?.filter((c: { type: string }) => c.type === 'CHIL'), null, 2)}`);
    logger.debug(`[FAMILY] HUSB: ${JSON.stringify(family.children?.find((c: { type: string }) => c.type ===  'HUSB'), null, 2)}`);
    logger.debug(`[FAMILY] WIFE: ${JSON.stringify(family.children?.find((c: { type: string }) => c.type ===  'WIFE'), null, 2)}`);


    const relationships = [];

    // Find husband and wife
    const husbandNode = family.children?.find((node: any) => node.type === 'HUSB');
    const wifeNode = family.children?.find((node: any) => node.type === 'WIFE');
    
    const husbandId = husbandNode ? 
    individualMap.get(husbandNode.data?.pointer || husbandNode.data?.value || husbandNode.value || '') : null;
  
  const wifeId = wifeNode ? 
    individualMap.get(wifeNode.data?.pointer || wifeNode.data?.value || wifeNode.value || '') : null;
  

    // Create marriage/spouse relationship if both husband and wife exist
    if (husbandId && wifeId) {
      try {
        const marrNode = family.children?.find((node: any) => node.type === 'MARR');
        let marriageDate = null;
    
        // Extract marriage date before using it
        if (marrNode) {
          const dateNode = marrNode.children?.find((node: any) => node.type === 'DATE');
          if (dateNode && dateNode.value) {
            marriageDate = safeDate(dateNode.value);
          }
        }
    
        // Create marriage event if MARR node exists
        if (marrNode) {
          const placeNode = marrNode.children?.find((node: any) => node.type === 'PLAC');
          const notes = ''; // Optionally extract more
    
          const eventData = {
            type: 'Marriage',
            title: 'Marriage',
            description: '',
            date: {
              start: marriageDate
            },
            location: {
              place: placeNode?.value || ''
            },
            notes,
            persons: [husbandId, wifeId]
          };
    
          const event = new Event(eventData);
          await event.save();
          logger.debug(`Created marriage event between ${husbandId} and ${wifeId}`);
        }
    
        // Create the relationship
        const spouseRelationship = new Relationship({
          type: 'Spouse',
          persons: [husbandId, wifeId],
          date: marriageDate ? { start: marriageDate } : undefined,
          notes: ''
        });
    
        await spouseRelationship.save();
        logger.debug(`Created spouse relationship between ${husbandId} and ${wifeId}`);
      } catch (error) {
        const err = error as Error;
        logger.warn(`Failed to create spouse relationship: ${err.message}`);
      }
    }
    
    // Process all children
    const childNodes = family.children?.filter((node: any) => node.type === 'CHIL') || [];
    
    for (const childNode of childNodes) {
      try {
        
        const childRef = childNode.data?.pointer || childNode.data?.value || childNode.value || '';

        
        const childId = individualMap.get(childRef);
        
        if (!childId) {
          logger.warn(`Child reference "${childRef}" not found in individual map (from family ${familyId})`);
          continue;
        }
        
        
        // Create parent-child relationships
        if (husbandId) {
          const fatherRelationship = new Relationship({
            type: 'Parent-Child',
            persons: [husbandId, childId],
            notes: ''
          });
          
          await fatherRelationship.save();
          logger.debug(`Created parent-child relationship between ${husbandId} and ${childId}`);
        }
        
        if (wifeId) {
          const motherRelationship = new Relationship({
            type: 'Parent-Child',
            persons: [wifeId, childId],
            notes: ''
          });
          
          await motherRelationship.save();
          logger.debug(`Created parent-child relationship between ${wifeId} and ${childId}`);
        }
      } catch (error) {
      
        const err = error as Error;
        logger.warn(`Failed to create parent-child relationship: ${err.message}`);
      }
    }
    
    // Create sibling relationships between all children
    for (let i = 0; i < childNodes.length; i++) {
      for (let j = i + 1; j < childNodes.length; j++) {
        try {
          const child1Ref = childNodes[i].data?.value || childNodes[i].value || '';
          const child2Ref = childNodes[j].data?.value || childNodes[j].value || '';
          
          const child1Id = individualMap.get(child1Ref);
          const child2Id = individualMap.get(child2Ref);
          
          if (!child1Id || !child2Id) continue;
          
          const siblingRelationship = new Relationship({
            type: 'Sibling',
            persons: [child1Id, child2Id],
            notes: ''
          });
          
          await siblingRelationship.save();
          logger.debug(`Created sibling relationship between ${child1Id} and ${child2Id}`);
        } catch (error) {
          const err = error as Error;
          logger.warn(`Failed to create sibling relationship: ${err.message}`);
        }
      }
    }
  }

  /**
   * Process media objects from GEDCOM data and create Media records in the database
   * @param gedcomData Parsed GEDCOM data
   * @returns Map of GEDCOM OBJE IDs to database Media IDs
   */
  private async processMediaObjects(gedcomData: any[]): Promise<Map<string, string>> {
    const mediaMap = new Map<string, string>();
    
    // Get all OBJE records from the GEDCOM data
    const mediaObjects = gedcomData.filter((record) => record.type === 'OBJE');
    logger.info(`Processing ${mediaObjects.length} media objects...`);
    
    for (const mediaObj of mediaObjects) {
      try {
        const mediaId = mediaObj.data?.xref_id;
        if (!mediaId) {
          logger.warn(`Skipping media object with missing xref_id`);
          continue;
        }
        
        // Extract file information
        const fileNode = mediaObj.children?.find((node: any) => node.type === 'FILE');
        if (!fileNode || !fileNode.value) {
          logger.warn(`Skipping media object ${mediaId} with no file path`);
          continue;
        }
        
        const filePath = fileNode.value;
        const formNode = fileNode.children?.find((node: any) => node.type === 'FORM');
        const mimeType = formNode?.value || this.getMimeTypeFromPath(filePath);
        
        // Extract title and notes
        const titleNode = mediaObj.children?.find((node: any) => node.type === 'TITL');
        const title = titleNode?.value || path.basename(filePath);
        
        const noteNodes = mediaObj.children?.filter((node: any) => node.type === 'NOTE') || [];
        let notes = '';
        for (const noteNode of noteNodes) {
          if (noteNode.value) {
            notes += (notes ? '\n\n' : '') + noteNode.value;
          }
        }
        
        // Determine media type based on file extension or mime type
        const mediaType = this.determineMediaType(filePath, mimeType);
        
        // Create media record
        const media = new Media({
          type: mediaType,
          title: title,
          description: '',
          file: {
            path: filePath,
            originalName: path.basename(filePath),
            mimeType: mimeType
          },
          notes: notes,
          persons: [], // Will be linked to persons later
          events: []   // Will be linked to events later
        });
        
        await media.save();
        mediaMap.set(mediaId, media._id.toString());
        logger.debug(`Saved media object ${mediaId} to database (ID: ${media._id})`);
      } catch (error) {
        const err = error as Error;
        logger.error(`Error processing media object: ${err.message}`);
      }
    }
    
    return mediaMap;
  }

  /**
   * Update person and event records with media references
   * @param gedcomData Parsed GEDCOM data
   * @param individualMap Map of GEDCOM individual IDs to database Person IDs
   * @param mediaMap Map of GEDCOM media IDs to database Media IDs
   */
  /**
   * Verify family references and create inferred relationships
   * @param individualMap Map of GEDCOM individual IDs to database Person IDs
   * @param familyMap Map of GEDCOM family IDs indicating if they exist
   * @param stats Statistics object to update with warnings
   */
  private async verifyFamilyReferences(
    individualMap: Map<string, string>,
    familyMap: Map<string, boolean>,
    stats: ImportStats
  ): Promise<void> {
    logger.info('Verifying family references and checking for inconsistencies...');
    
    if (!stats.warnings) {
      stats.warnings = [];
    }
    
    // Get all people with family references
    const people = await Person.find({
      $or: [
        { 'customFields.childInFamilies': { $exists: true, $ne: [] } },
        { 'customFields.spouseInFamilies': { $exists: true, $ne: [] } }
      ]
    });
    
    for (const person of people) {
      // Check child-in-family references
      const childInFamilies = person.customFields?.childInFamilies || [];
      for (const familyId of childInFamilies) {
        if (!familyMap.has(familyId)) {
          const warning = `Person ${person._id} (${person.sourceId}) references non-existent family ${familyId} as child`;
          stats.warnings.push(warning);
          logger.warn(warning);
        }
      }
      
      // Check spouse-in-family references
      const spouseInFamilies = person.customFields?.spouseInFamilies || [];
      for (const familyId of spouseInFamilies) {
        if (!familyMap.has(familyId)) {
          const warning = `Person ${person._id} (${person.sourceId}) references non-existent family ${familyId} as spouse`;
          stats.warnings.push(warning);
          logger.warn(warning);
        }
      }
    }
    
    // TODO: Infer missing relationships based on FAMC/FAMS references
    // For future implementation
  }
  
  private async linkMediaObjects(
    gedcomData: any[], 
    individualMap: Map<string, string>, 
    mediaMap: Map<string, string>
  ): Promise<void> {
    logger.info('Linking media objects to persons and events...');
    
    // Process INDI records to find media references
    const individuals = gedcomData.filter((record) => record.type === 'INDI');
    
    for (const individual of individuals) {
      const individualId = individual.data?.xref_id;
      if (!individualId) continue;
      
      const personId = individualMap.get(individualId);
      if (!personId) continue;
      
      // Find all OBJE references for this individual
      const mediaRefs = individual.children?.filter((node: any) => node.type === 'OBJE') || [];
      if (mediaRefs.length === 0) continue;
      
      // Collect media IDs
      const personMediaIds = [];
      for (const mediaRef of mediaRefs) {
        const mediaXref = mediaRef.data?.value || mediaRef.value || '';
        // Handle either xref or inline media
        if (mediaXref && mediaMap.has(mediaXref)) {
          const dbMediaId = mediaMap.get(mediaXref);
          if (dbMediaId) {
            personMediaIds.push(new mongoose.Types.ObjectId(dbMediaId));
            
            // Also update the media record to reference this person
            await Media.findByIdAndUpdate(
              dbMediaId,
              { $addToSet: { persons: personId } }
            );
          }
        } else if (mediaRef.children) {
          // This is an inline media object (not a reference)
          // Process and create a new media object
          try {
            const fileNode = mediaRef.children.find((node: any) => node.type === 'FILE');
            if (fileNode && fileNode.value) {
              const filePath = fileNode.value;
              const formNode = mediaRef.children.find((node: any) => node.type === 'FORM');
              const mimeType = formNode?.value || this.getMimeTypeFromPath(filePath);
              const mediaType = this.determineMediaType(filePath, mimeType);
              
              const media = new Media({
                type: mediaType,
                title: path.basename(filePath),
                file: {
                  path: filePath,
                  originalName: path.basename(filePath),
                  mimeType: mimeType
                },
                persons: [personId]
              });
              
              await media.save();
              personMediaIds.push(media._id);
            }
          } catch (error) {
            const err = error as Error;
            logger.warn(`Failed to process inline media for person ${personId}: ${err.message}`);
          }
        }
      }
      
      // Update person with media references
      if (personMediaIds.length > 0) {
        await Person.findByIdAndUpdate(
          personId,
          { $addToSet: { media: { $each: personMediaIds } } }
        );
        logger.debug(`Linked ${personMediaIds.length} media objects to person ${personId}`);
      }
    }
  }

  /**
   * Determine media type based on file extension or MIME type
   */
  private determineMediaType(filePath: string, mimeType?: string): 'Photo' | 'Document' | 'Audio' | 'Video' {
    const ext = path.extname(filePath).toLowerCase();
    
    // Check extension first
    if (['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.tiff', '.webp'].includes(ext)) {
      return 'Photo';
    } else if (['.mp3', '.wav', '.ogg', '.m4a', '.flac'].includes(ext)) {
      return 'Audio';
    } else if (['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'].includes(ext)) {
      return 'Video';
    } else if (['.pdf', '.doc', '.docx', '.txt', '.rtf'].includes(ext)) {
      return 'Document';
    }
    
    // If extension doesn't provide enough info, check mime type
    if (mimeType) {
      if (mimeType.startsWith('image/')) {
        return 'Photo';
      } else if (mimeType.startsWith('audio/')) {
        return 'Audio';
      } else if (mimeType.startsWith('video/')) {
        return 'Video';
      } else if (mimeType.startsWith('application/') || mimeType.startsWith('text/')) {
        return 'Document';
      }
    }
    
    // Default to Document if we can't determine
    return 'Document';
  }

  /**
   * Get MIME type from file path based on extension
   */
  private getMimeTypeFromPath(filePath: string): string {
    const ext = path.extname(filePath).toLowerCase();
    
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.bmp': 'image/bmp',
      '.tiff': 'image/tiff',
      '.webp': 'image/webp',
      '.mp3': 'audio/mpeg',
      '.wav': 'audio/wav',
      '.ogg': 'audio/ogg',
      '.m4a': 'audio/mp4',
      '.flac': 'audio/flac',
      '.mp4': 'video/mp4',
      '.avi': 'video/x-msvideo',
      '.mov': 'video/quicktime',
      '.wmv': 'video/x-ms-wmv',
      '.flv': 'video/x-flv',
      '.webm': 'video/webm',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.txt': 'text/plain',
      '.rtf': 'application/rtf'
    };
    
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

export default new GedcomService();