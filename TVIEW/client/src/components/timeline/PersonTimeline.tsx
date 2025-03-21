// src/components/timeline/PersonTimeline.tsx
import React, { useState, useEffect } from 'react';
import { formatEventDate, isValidDate } from '@/utils/dateUtils';
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
  Alert
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

interface Event {
  _id: string;
  type: string;
  title: string;
  description?: string;
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
  
  // Fetch events for the person
  const fetchEvents = async () => {
    try {
      setLoading(true);
      const response = await axios.get(API.persons.events(personId));
      
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
  
  const handleDeleteEvent = async (eventId: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(API.events.delete(eventId));
        // Remove the deleted event from the state
        setEvents(events.filter(event => event._id !== eventId));
      } catch (err) {
        let errorMessage = 'Failed to delete event';
        if (axios.isAxiosError(err) && err.response) {
          errorMessage = err.response.data.message || errorMessage;
        } else if (err instanceof Error) {
          errorMessage = err.message;
        }
        alert(`Error: ${errorMessage}`);
      }
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
  
  const formatEventDate = (event: Event) => {
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
                    {formatEventDate(event.date.start, event.date.end, event.date.isRange)}
                  </Typography>
                  {/* rest of the component */}
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
                        
                        {event.notes && (
                          <Typography variant="body2" color="text.secondary">
                            <strong>Notes:</strong> {event.notes}
                          </Typography>
                        )}
                      </Grid>
                      
                      <Grid item>
                        <Box>
                          <IconButton
                            size="small"
                            onClick={() => setEditingEventId(event._id)}
                            title="Edit"
                          >
                            <EditIcon fontSize="small" />
                          </IconButton>
                          <IconButton
                            size="small"
                            onClick={() => handleDeleteEvent(event._id)}
                            title="Delete"
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
    </div>
  );
};

export default PersonTimeline;
