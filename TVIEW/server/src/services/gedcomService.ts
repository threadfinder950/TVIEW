import fs from 'fs';
import { logger } from '../utils/logger';
import Person from '../models/Person';
import Relationship from '../models/Relationship';
import Event from '../models/Event';
import { safeDate } from '../utils/dateUtils';

interface ImportStats {
  individuals: number;
  families: number;
  events: number;
  errors: string[];
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
  
      // 🔍 LOG THE FIRST FEW RECORDS FOR DEBUGGING
      console.log("🔍 DEBUG: First 5 GEDCOM Records:", JSON.stringify(gedcomRecords.slice(0, 5), null, 2));
  
      logger.info(`Parsed ${gedcomRecords.length} total records from GEDCOM file`);
      return gedcomRecords;
    } catch (error) {
      logger.error(`Error parsing GEDCOM file: ${error.message}`, { stack: error.stack });
      throw new Error(`Failed to parse GEDCOM file: ${error.message}`);
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
        errors: []
      };
  
      const individualMap = new Map<string, string>();
  
      // Process Individuals (INDI)
      const individuals = gedcomData.filter((record) => record.type === 'INDI');
      logger.info(`Processing ${individuals.length} individuals...`);
  
      for (const individual of individuals) {
        try {
          // 🔥 Corrected to use `xref_id` instead of `pointer`
          const individualId = individual.data?.xref_id;
          if (!individualId) {
            logger.warn(`Skipping individual with missing xref_id: ${JSON.stringify(individual, null, 2)}`);
            continue;
          }
  
          logger.debug(`Processing individual: ${individualId}`);
  
          const person = await this.createPersonFromGedcom(individual);
          individualMap.set(individualId, person._id.toString());
          stats.individuals++;
        } catch (error) {
          stats.errors.push(`Error importing individual: ${error.message}`);
        }
      }
  
      logger.info(`Imported ${stats.individuals} individuals successfully`);
  
      return stats;
    } catch (error) {
      logger.error(`Error importing GEDCOM data: ${error.message}`, { stack: error.stack });
      throw new Error(`Failed to import GEDCOM data: ${error.message}`);
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
      const [given, surname] = fullName.includes('/') ? fullName.split('/').map(s => s.trim()) : [fullName, ''];
      names.push({ given, surname });
    }
  
    // 🔥 Fixed birth and death extraction
    const birth = this.extractEventData(individual, 'BIRT');
    const death = this.extractEventData(individual, 'DEAT');
  
    const gender = individual.children?.find((node: any) => node.type === 'SEX')?.value || 'U';
  
    const person = new Person({
      names,
      birth,
      death,
      gender,
      notes: '',
      sourceId: individualId
    });
  
    await person.save();
    logger.debug(`Saved person ${individualId} to database (ID: ${person._id})`);
  
    return person;
  }
  

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
  
  const noteNode = eventNode.children?.find((node: any) => 
    node.type === 'NOTE'
  );
  
  return {
    // Use safeDate to handle invalid dates
    date: dateNode ? safeDate(dateNode.value) : null,
    place: placeNode ? placeNode.value : '',
    notes: noteNode ? noteNode.value : ''
  };
}

  /**
   * Creates Relationships from GEDCOM family data.
   */
  private async createRelationshipsFromFamily(family: any, individualMap: Map<string, string>) {
    logger.debug(`Processing family: ${family.data?.pointer || 'Unknown'}`);

    const relationships = [];

    const husbandId = individualMap.get(family.children?.find((node: any) => node.type === 'HUSB')?.data);
    const wifeId = individualMap.get(family.children?.find((node: any) => node.type === 'WIFE')?.data);
    const childNodes = family.children?.filter((node: any) => node.type === 'CHIL') || [];

    if (husbandId && wifeId) {
      relationships.push({ type: 'Spouse', persons: [husbandId, wifeId] });
    }

    for (const child of childNodes) {
      const childId = individualMap.get(child.data);
      if (childId) {
        [husbandId, wifeId].forEach(parentId => {
          if (parentId) {
            relationships.push({ type: 'Parent-Child', persons: [parentId, childId] });
          }
        });
      }
    }

    if (relationships.length > 0) {
      await Relationship.insertMany(relationships);
      logger.debug(`Saved ${relationships.length} relationships for family`);
    }
  }
}

export default new GedcomService();
