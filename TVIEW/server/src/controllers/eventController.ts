import { Request, Response } from 'express';
import { asyncHandler } from '../utils/asyncHandler';
import { ErrorResponse } from '../middleware/errorMiddleware';
import Event from '../models/Event';

/**
 * @desc    Get all events
 * @route   GET /api/events
 * @access  Public
 */
export const getAllEvents = asyncHandler(async (req: Request, res: Response) => {
  const events = await Event.find()
    .populate('person', 'names')
    .sort('date.start');
  
  res.json(events);
});

/**
 * @desc    Get single event by ID
 * @route   GET /api/events/:id
 * @access  Public
 */
export const getEventById = asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findById(req.params.id)
    .populate('person', 'names');
  
  if (!event) {
    throw new ErrorResponse('Event not found', 404);
  }
  
  res.json(event);
});

/**
 * @desc    Create a new event
 * @route   POST /api/events
 * @access  Public
 */
export const createEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = new Event(req.body);
  
  const newEvent = await event.save();
  
  res.status(201).json(newEvent);
});

/**
 * @desc    Update an event
 * @route   PATCH /api/events/:id
 * @access  Public
 */
export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findById(req.params.id);
  
  if (!event) {
    throw new ErrorResponse('Event not found', 404);
  }
  
  // Update fields
  Object.assign(event, req.body);
  
  const updatedEvent = await event.save();
  
  res.json(updatedEvent);
});

/**
 * @desc    Delete an event
 * @route   DELETE /api/events/:id
 * @access  Public
 */
export const deleteEvent = asyncHandler(async (req: Request, res: Response) => {
  const event = await Event.findById(req.params.id);
  
  if (!event) {
    throw new ErrorResponse('Event not found', 404);
  }
  
  await Event.findByIdAndDelete(req.params.id);
  
  res.json({ success: true, message: 'Event deleted successfully' });
});
