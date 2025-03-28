  // Fix for src/controllers/eventController.ts
  import { Request, Response } from 'express';
  import { asyncHandler } from '../utils/asyncHandler';
  import { ErrorResponse } from '../middleware/errorMiddleware';
  import Event from '../models/Event';

  /**
   * @desc    Get all events
   * @route   GET /api/events
   * @access  Public
   */
  // In src/controllers/eventController.ts - getAllEvents function
  export const getAllEvents = asyncHandler(async (req: Request, res: Response) => {
    const events = await Event.find()
      .populate('persons', 'names gender')  // Add gender to the populated fields
      .sort('date.start');
    
    res.json(events);
  });

  // Also update getEventById function similarly
  export const getEventById = asyncHandler(async (req: Request, res: Response) => {
    const event = await Event.findById(req.params.id)
      .populate('persons', 'names gender');
    
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
    try {
      const data = {...req.body};
      
      // Ensure compatibility between person and persons fields
      if (data.persons && Array.isArray(data.persons) && data.persons.length > 0) {
        // If persons array is provided, also set person field to first person for backward compatibility
        data.person = data.persons[0];
      } else if (data.person && (!data.persons || !Array.isArray(data.persons) || data.persons.length === 0)) {
        // If only person is provided, create persons array
        data.persons = [data.person];
      }
      
      const event = new Event(data);
      const newEvent = await event.save();
      
      // Populate the persons field for the response
      const populatedEvent = await Event.findById(newEvent._id).populate('persons', 'names');
      
      res.status(201).json(populatedEvent);
    } catch (error) {
      console.error('Error creating event:', error);
      if (error instanceof Error) {
        throw new ErrorResponse(`Failed to create event: ${error.message}`, 400);
      } else {
        throw new ErrorResponse('Failed to create event', 400);
      }
    }
  });

  /**
   * @desc    Update an event
   * @route   PATCH /api/events/:id
   * @access  Public
   */
  export const updateEvent = asyncHandler(async (req: Request, res: Response) => {
    try {
      const event = await Event.findById(req.params.id);
      
      if (!event) {
        throw new ErrorResponse('Event not found', 404);
      }
      
      const data = {...req.body};
      
      // Ensure compatibility between person and persons fields
      if (data.persons && Array.isArray(data.persons) && data.persons.length > 0) {
        // If persons array is provided, also set person field to first person
        data.person = data.persons[0];
      } else if (data.person && (!data.persons || !Array.isArray(data.persons) || data.persons.length === 0)) {
        // If only person is provided, create persons array
        data.persons = [data.person];
      }
      
      // Update fields
      Object.assign(event, data);
      
      const updatedEvent = await event.save();
      
      // Populate the persons field for the response
      const populatedEvent = await Event.findById(updatedEvent._id).populate('persons', 'names');
      
      res.json(populatedEvent);
    } catch (error) {
      console.error('Error updating event:', error);
      if (error instanceof Error) {
        throw new ErrorResponse(`Failed to update event: ${error.message}`, 400);
      } else {
        throw new ErrorResponse('Failed to update event', 400);
      }
    }
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