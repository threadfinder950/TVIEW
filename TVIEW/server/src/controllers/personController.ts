import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ErrorResponse } from '../middleware/errorMiddleware';
import Person, { IPerson } from '../models/Person';
import Event from '../models/Event';
import Relationship from '../models/Relationship';
import { Document, Types } from 'mongoose';

const { ObjectId } = Types;

/**
 * @desc    Get all persons
 * @route   GET /api/persons
 * @access  Public
 */
export const getAllPersons = asyncHandler(async (_req: Request, res: Response) => {
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
  // Find person first to verify it exists
  const person = await Person.findById(req.params.id);
  
  if (!person) {
    throw new ErrorResponse('Person not found', 404);
  }
  
  // Find all events where the person is in the persons array
  const events = await Event.find({ 
    persons: req.params.id 
  })
  .populate('persons', 'names')
  .sort('date.start');
  
  res.json(events);
});


/**
 * @desc    Get a person's family members (with inferred siblings)
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

  // Define the type for family members
  type FamilyMember = Document<unknown, {}, IPerson> & IPerson & { _id: Types.ObjectId };

  // Organize by relationship type
  const family: {
    parents: FamilyMember[];
    spouses: FamilyMember[];
    children: FamilyMember[];
    siblings: FamilyMember[];
  } = {
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
    ) as FamilyMember[];

    if (rel.type === 'Parent-Child') {
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

  // 🔁 Infer siblings via shared parents
  const inferredSiblingIds = new Set<string>();

  for (const parent of family.parents) {
    const parentRelationships = await Relationship.find({
      type: 'Parent-Child',
      persons: parent._id
    });

    for (const rel of parentRelationships) {
      const siblingIds = rel.persons
        .filter(id => id.toString() !== parent._id.toString() && id.toString() !== personId);

      siblingIds.forEach(id => inferredSiblingIds.add(id.toString()));
    }
  }

  const inferredSiblings = await Person.find({ _id: { $in: Array.from(inferredSiblingIds) } });

  // Add inferred siblings that are not already in siblings
  for (const sib of inferredSiblings) {
    const alreadyIncluded = family.siblings.some(s => s._id.toString() === sib._id.toString());
    if (!alreadyIncluded) {
      family.siblings.push(sib as FamilyMember);
    }
  }

  res.json(family);
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


