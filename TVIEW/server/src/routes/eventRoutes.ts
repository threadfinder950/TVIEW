import express from 'express';
import {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent
} from '../controllers/eventController';

const router = express.Router();

// GET all events
router.get('/', getAllEvents);

// GET a single event
router.get('/:id', getEventById);

// POST a new event
router.post('/', createEvent);

// PATCH update an event
router.patch('/:id', updateEvent);

// DELETE an event
router.delete('/:id', deleteEvent);

export default router;
