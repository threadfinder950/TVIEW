import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ErrorResponse } from '../middleware/errorMiddleware';
import Person from '../models/Person';
import Event from '../models/Event';
import Relationship from '../models/Relationship';

/**
 * @desc    Get all persons
 * @route   GET /api/persons
 * @access  Public
 */
export const getAllPersons = asyncHandler(async (req: Request, res: Response) => {
  const persons = await Person.find().sort({ 'names.surname': 1, 'names.given': 1 });
  
  res.json(persons);
});

/**
 * @desc    Get single person by ID
 * @route   GET /api/persons/:id
 * @access  Public
 */
export const getPersonById = asyncHandler(async (req: Request, res: Response) => {
  const person = await Person.findById(req.params.id);
  
  if (!person) {
    throw new ErrorResponse('Person not found', 404);
  }
  
  res.json(person);
});

/**
 * @desc    Create a new person
 * @route   POST /api/persons
 * @access  Public
 */
export const createPerson = asyncHandler(async (req: Request, res: Response) => {
  const person = new Person(req.body);
  
  const newPerson = await person.save();
  
  res.status(201).json(newPerson);
});

/**
 * @desc    Update a person
 * @route   PATCH /api/persons/:id
 * @access  Public
 */
export const updatePerson = asyncHandler(async (req: Request, res: Response) => {
  const person = await Person.findById(req.params.id);
  
  if (!person) {
    throw new ErrorResponse('Person not found', 404);
  }
  
  // Update fields
  Object.assign(person, req.body);
  
  const updatedPerson = await person.save();
  
  res.json(updatedPerson);
});

/**
 * @desc    Delete a person and related data
 * @route   DELETE /api/persons/:id
 * @access  Public
 */
export const deletePerson = asyncHandler(async (req: Request, res: Response) => {
  const person = await Person.findById(req.params.id);
  
  if (!person) {
    throw new ErrorResponse('Person not found', 404);
  }
  
  // Delete related events
  await Event.deleteMany({ person: req.params.id });
  
  // Delete related relationships
  await Relationship.deleteMany({ persons: req.params.id });
  
  // Delete the person
  await Person.findByIdAndDelete(req.params.id);
  
  res.json({ success: true, message: 'Person deleted successfully' });
});

/**
 * @desc    Get a person's events
 * @route   GET /api/persons/:id/events
 * @access  Public
 */
export const getPersonEvents = asyncHandler(async (req: Request, res: Response) => {
  const events = await Event.find({ person: req.params.id }).sort('date.start');
  
  res.json(events);
});

/**
 * @desc    Get a person's relationships
 * @route   GET /api/persons/:id/relationships
 * @access  Public
 */
export const getPersonRelationships = asyncHandler(async (req: Request, res: Response) => {
  const relationships = await Relationship.find({ 
    persons: req.params.id 
  }).populate('persons', 'names');
  
  res.json(relationships);
});

/**
 * @desc    Get a person's family members
 * @route   GET /api/persons/:id/family
 * @access  Public
 */
export const getPersonFamily = asyncHandler(async (req: Request, res: Response) => {
  const personId = req.params.id;
  
  // Find all relationships the person is part of
  const relationships = await Relationship.find({ persons: personId });
  
  // Extract all related person IDs
  const familyIds = new Set<string>();
  relationships.forEach(rel => {
    rel.persons.forEach(id => {
      if (id.toString() !== personId) {
        familyIds.add(id.toString());
      }
    });
  });
  
  // Get family member details
  const familyMembers = await Person.find({ 
    _id: { $in: Array.from(familyIds) } 
  });
  
  // Organize by relationship type
  const family = {
    parents: [],
    spouses: [],
    children: [],
    siblings: []
  };
  
  for (const rel of relationships) {
    const otherPersonIds = rel.persons
      .filter(id => id.toString() !== personId)
      .map(id => id.toString());
    
    const relatedPersons = familyMembers.filter(p => 
      otherPersonIds.includes(p._id.toString())
    );
    
    if (rel.type === 'Parent-Child') {
      // Determine if the person is the parent or child
      const isParent = rel.persons[0].toString() === personId;
      
      if (isParent) {
        family.children.push(...relatedPersons);
      } else {
        family.parents.push(...relatedPersons);
      }
    } else if (rel.type === 'Spouse') {
      family.spouses.push(...relatedPersons);
    } else if (rel.type === 'Sibling') {
      family.siblings.push(...relatedPersons);
    }
  }
  
  res.json(family);
});