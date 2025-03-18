import express from 'express';
import {
  getAllPersons,
  getPersonById,
  createPerson,
  updatePerson,
  deletePerson,
  getPersonEvents,
  getPersonRelationships,
  getPersonFamily
} from '../controllers/personController';

const router = express.Router();

// GET all persons
router.get('/', getAllPersons);

// GET a single person
router.get('/:id', getPersonById);

// POST a new person
router.post('/', createPerson);

// PATCH update a person
router.patch('/:id', updatePerson);

// DELETE a person
router.delete('/:id', deletePerson);

// GET a person's events
router.get('/:id/events', getPersonEvents);

// GET a person's relationships
router.get('/:id/relationships', getPersonRelationships);

// GET a person's family members
router.get('/:id/family', getPersonFamily);

export default router;
