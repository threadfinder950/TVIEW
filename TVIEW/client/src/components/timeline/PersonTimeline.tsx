// src/components/timeline/PersonTimeline.tsx
import React, { useState, useEffect } from 'react';
import { formatDate, isValidDate } from '../../utils/dateUtils';
import {
  Paper,
  Typography,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Grid,
  IconButton,
  Button,
  Box,
  useTheme,
  CircularProgress,
  Alert,
  Dialog,
  DialogContent,
  DialogTitle,
  DialogActions
} from '@mui/material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Home as HomeIcon,
  MilitaryTech as MilitaryIcon,
  LocalHospital as MedicalIcon,
  FlightTakeoff as TravelIcon,
  EmojiEvents as AchievementIcon,
  Event as EventIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';
import EventEditor from '../forms/EventEditor';
import { API } from '../../config/api';

// Update the Event interface to include persons array
interface Event {
  _id: string;
  type: string;
  title: string;
  description?: string;
  persons: Array<{
    _id: string;
    names: Array<{
      given: string;
      surname: string;
    }>;
  }>;
  date: {
    start?: Date;
    end?: Date;
    isRange: boolean;
  };
  location?: {
    place?: string;
  };
  notes?: string;
}

// Add a helper function to display participants
const getParticipants = (event: Event, currentPersonId: string): string => {
  if (!event.persons || !Array.isArray(event.persons) || event.persons.length <= 1) {
    return '';
  }
  
  // Filter out the current person if they're in the list
  const otherPersons = event.persons.filter(p => p._id !== currentPersonId);
  
  if (otherPersons.length === 0) {
    return '';
  }
  
  return otherPersons.map(person => {
    if (person.names && person.names.length > 0) {
      return `${person.names[0].given} ${person.names[0].surname}`;
    }
    return 'Unknown Person';
  }).join(', ');
};

interface PersonTimelineProps {
  personId: string;
  personName?: string;
}

const PersonTimeline: React.FC<PersonTimelineProps> = ({ personId, personName }) => {
  const theme = useTheme();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddEvent, setShowAddEvent] = useState<boolean>(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState<boolean>(false);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);
  
  // Fetch events for the person
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API.persons.events(personId));
      
      // Ensure we have the persons data and it's populated
      if (response.data && Array.isArray(response.data)) {
        // Convert date strings to Date objects and sort by start date
        const eventsWithDates = response.data.map((event: any) => ({
          ...event,
          date: {
            ...event.date,
            start: event.date.start ? isValidDate(event.date.start) ? new Date(event.date.start) : null : null,
            end: event.date.end ? isValidDate(event.date.end) ? new Date(event.date.end) : null : null,
          }
        }));
        
        // Sort events by date (earliest first)
        const sortedEvents = eventsWithDates.sort((a: Event, b: Event) => {
          const dateA = a.date.start ? a.date.start.getTime() : 0;
          const dateB = b.date.start ? b.date.start.getTime() : 0;
          return dateA - dateB;
        });
        
        setEvents(sortedEvents);
        setError(null);
      } else {
        throw new Error('Invalid event data received from server');
      }
    } catch (err) {
      let errorMessage = 'Failed to fetch events';
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchEvents();
  }, [personId]);
  
  const handleOpenDeleteConfirm = (eventId: string) => {
    setEventToDelete(eventId);
    setDeleteConfirmOpen(true);
  };
  
  const handleCloseDeleteConfirm = () => {
    setDeleteConfirmOpen(false);
    setEventToDelete(null);
  };
  
  const handleDeleteEvent = async () => {
    if (!eventToDelete) return;
    
    try {
      await axios.delete(API.events.delete(eventToDelete));
      // Remove the deleted event from the state
      setEvents(events.filter(event => event._id !== eventToDelete));
      handleCloseDeleteConfirm();
    } catch (err) {
      let errorMessage = 'Failed to delete event';
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      alert(`Error: ${errorMessage}`);
    }
  };
  
  const handleEventSaved = () => {
    // Reload events after saving
    fetchEvents();
    // Close editor
    setShowAddEvent(false);
    setEditingEventId(null);
  };
  
  const getEventIcon = (eventType: string) => {
    switch (eventType) {
      case 'Work':
        return <WorkIcon />;
      case 'Education':
        return <SchoolIcon />;
      case 'Residence':
        return <HomeIcon />;
      case 'Military':
        return <MilitaryIcon />;
      case 'Medical':
        return <MedicalIcon />;
      case 'Travel':
        return <TravelIcon />;
      case 'Achievement':
        return <AchievementIcon />;
      default:
        return <EventIcon />;
    }
  };
  
  const getEventColor = (eventType: string) => {
    switch (eventType) {
      case 'Work':
        return theme.palette.primary.main;
      case 'Education':
        return theme.palette.secondary.main;
      case 'Residence':
        return '#4caf50'; // green
      case 'Military':
        return '#795548'; // brown
      case 'Medical':
        return '#e91e63'; // pink
      case 'Travel':
        return '#2196f3'; // blue
      case 'Achievement':
        return '#ff9800'; // orange
      default:
        return '#9e9e9e'; // grey
    }
  };
  
  const formatEventDateRange = (event: Event) => {
    if (!event.date.start) return 'No date';
    
    if (event.date.isRange && event.date.end) {
      return `${format(new Date(event.date.start), 'MMM d, yyyy')} - ${format(new Date(event.date.end), 'MMM d, yyyy')}`;
    }
    
    return format(new Date(event.date.start), 'MMM d, yyyy');
  };
  
  return (
    <div>
      <Paper elevation={3} sx={{ p: 3, mb: 2 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h5">
              {personName ? `${personName}'s Timeline` : 'Personal Timeline'}
            </Typography>
          </Grid>
          <Grid item>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={() => setShowAddEvent(true)}
            >
              Add Event
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {showAddEvent && (
        <EventEditor 
          personId={personId} 
          onSave={handleEventSaved} 
          onCancel={() => setShowAddEvent(false)} 
        />
      )}
      
      {editingEventId && (
        <EventEditor 
          personId={personId}
          eventId={editingEventId}
          onSave={handleEventSaved}
          onCancel={() => setEditingEventId(null)}
        />
      )}
      
      <Paper elevation={3} sx={{ p: 2 }}>
        {loading ? (
          <Box display="flex" justifyContent="center" padding={3}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : events.length === 0 ? (
          <Typography variant="body1" align="center" sx={{ py: 4 }}>
            No events found. Add some events to build the timeline.
          </Typography>
        ) : (
          <Timeline position="alternate">
            {events.map((event) => (
              <TimelineItem key={event._id}>
                <TimelineOppositeContent sx={{ m: 'auto 0' }} color="text.secondary">
                  <Typography variant="body2">
                    {formatEventDateRange(event)}
                  </Typography>
                  {event.location?.place && (
                    <Typography variant="body2" color="text.secondary">
                      {event.location.place}
                    </Typography>
                  )}
                </TimelineOppositeContent>
                
                <TimelineSeparator>
                  <TimelineDot sx={{ bgcolor: getEventColor(event.type) }}>
                    {getEventIcon(event.type)}
                  </TimelineDot>
                  <TimelineConnector />
                </TimelineSeparator>
                
                <TimelineContent sx={{ py: 2 }}>
                  <Paper elevation={3} sx={{ p: 2, mb: 2 }}>
                    <Grid container justifyContent="space-between" alignItems="flex-start">
                      <Grid item xs>
                        <Typography variant="h6" component="h3">
                          {event.title}
                        </Typography>
                        <Chip
                          label={event.type}
                          size="small"
                          sx={{ 
                            bgcolor: getEventColor(event.type),
                            color: 'white',
                            mb: 1
                          }}
                        />
                        
                        {event.description && (
                          <Typography variant="body2" paragraph>
                            {event.description}
                          </Typography>
                        )}
                        
                        {/* Display other participants */}
                        {getParticipants(event, personId) && (
                          <Typography variant="body2" sx={{ mb: 1 }}>
                            <strong>Also involving:</strong> {getParticipants(event, personId)}
                          </Typography>
                        )}
                        
                        {event.notes && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Notes:</strong> {event.notes}
                          </Typography>
                        )}
                      </Grid>
                      
                      <Grid item>
                        <Box display="flex">
                          <IconButton
                            size="small"
                            color="primary"
                            onClick={() => setEditingEventId(event._id)}
                            sx={{ mr: 0.5 }}
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            color="error"
                            onClick={() => handleOpenDeleteConfirm(event._id)}
                          >
                            <DeleteIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      </Grid>
                    </Grid>
                  </Paper>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        )}
      </Paper>
      
      {/* Delete confirmation dialog */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={handleCloseDeleteConfirm}
      >
        <DialogTitle>Delete Event</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete this event? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteConfirm}>Cancel</Button>
          <Button color="error" onClick={handleDeleteEvent}>Delete</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default PersonTimeline;
