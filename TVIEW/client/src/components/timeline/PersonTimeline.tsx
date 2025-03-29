// Enhanced PersonTimeline.tsx with TypeScript fixes
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

import {
  Paper,
  Typography,
  Button,
  Box,
  Chip,
  Grid,
  IconButton,
  Card,
  CardContent,
  Tooltip,
  Avatar,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider
} from '@mui/material';
import { People as PeopleIcon } from '@mui/icons-material';
import Timeline from '@mui/lab/Timeline';
import TimelineItem from '@mui/lab/TimelineItem';
import TimelineSeparator from '@mui/lab/TimelineSeparator';
import TimelineConnector from '@mui/lab/TimelineConnector';
import TimelineContent from '@mui/lab/TimelineContent';
import TimelineDot from '@mui/lab/TimelineDot';
import TimelineOppositeContent from '@mui/lab/TimelineOppositeContent';
import {
  Edit as EditIcon,
  Add as AddIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Home as HomeIcon,
  MilitaryTech as MilitaryIcon,
  LocalHospital as MedicalIcon,
  FlightTakeoff as TravelIcon,
  EmojiEvents as AchievementIcon,
  Event as EventIcon,
  FilterList as FilterIcon,
  Sort as SortIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Cake as BirthIcon,
  SentimentVeryDissatisfied as DeathIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import axios from 'axios';
import EventEditor from '../forms/EventEditor';
import { API } from '../../config/api';

// Define interfaces for the component props and event data
interface PersonTimelineProps {
  personId: string;
  personName?: string;
}

interface EventDate {
  start?: Date | string | null;
  end?: Date | string | null;
  isRange: boolean;
}

interface EventLocation {
  place?: string;
  coordinates?: {
    latitude?: number;
    longitude?: number;
  };
}

interface PersonName {
  given: string;
  surname: string;
  fromDate?: Date | string;
  toDate?: Date | string;
}

interface Person {
  _id: string;
  names: PersonName[];
  gender?: 'M' | 'F' | 'O' | 'U';
}

interface Event {
  _id: string;
  type: string;
  title: string;
  description?: string;
  date: EventDate;
  location?: EventLocation;
  notes?: string;
  persons: Person[];
}

interface PersonDetails {
  _id: string;
  names: PersonName[];
  gender?: 'M' | 'F' | 'O' | 'U';
  birth?: {
    date?: Date | string;
    place?: string;
    notes?: string;
  };
  death?: {
    date?: Date | string;
    place?: string;
    notes?: string;
  };
}

const PersonTimeline: React.FC<PersonTimelineProps> = ({ personId, personName }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const navigate = useNavigate(); //
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showAddEvent, setShowAddEvent] = useState<boolean>(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [personDetails, setPersonDetails] = useState<PersonDetails | null>(null);
  
  const handleEditPerson = () => {
    navigate(`/people/${personId}/edit`);
  };




  // Fetch events for the person
  const fetchEvents = async (): Promise<void> => {
    try {
      setLoading(true);
      
      // Get person details
      const personResponse = await axios.get(API.persons.getById(personId));
      setPersonDetails(personResponse.data);
      
      // Get events
      const eventsResponse = await axios.get(API.persons.events(personId));
      
      // Convert date strings to Date objects
      const eventsWithDates = eventsResponse.data.map((event: any) => ({
        ...event,
        date: {
          ...event.date,
          start: event.date?.start ? new Date(event.date.start) : null,
          end: event.date?.end ? new Date(event.date.end) : null,
        }
      }));
      
      setEvents(eventsWithDates);
      setError(null);
    } catch (err) {
      setError('Failed to load events');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

 // Define the PersonNavigationMenu component outside the return statement
const PersonNavigationMenu = (): React.ReactNode => {
  const navigate = useNavigate();
  
  const handleViewFamily = () => {
    navigate(`/family/${personId}`); 
  };
  
  const handleViewPerson = () => {
    navigate(`/people/${personId}`);
  };
  
  return (
    <Paper elevation={2} sx={{ p: 1, mb: 3 }}>
      <Box display="flex" justifyContent="center" gap={2}>
        <Button
          variant="outlined"
          startIcon={<PeopleIcon />}
          onClick={handleViewFamily}
          aria-label="View Family Members"
        >
          Family Members
        </Button>
        <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEditPerson}
            aria-label="Edit Person"
          >
            Edit Person
          </Button>
      </Box>
    </Paper>
  );
};

  useEffect(() => {
    fetchEvents();
  }, [personId]);
  
  const handleDeleteEvent = async (eventId: string): Promise<void> => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await axios.delete(API.events.delete(eventId));
        // Remove the deleted event from the state
        setEvents(events.filter(event => event._id !== eventId));
      } catch (err) {
        alert(`Error: Failed to delete event`);
        console.error(err);
      }
    }
  };
  
  const handleEventSaved = (): void => {
    // Reload events after saving
    fetchEvents();
    // Close editor
    setShowAddEvent(false);
    setEditingEventId(null);
  };
  
  const getEventIcon = (eventType: string): React.ReactNode => {
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
  
  const getEventColor = (eventType: string): string => {
    switch (eventType) {
      case 'Work':
        return 'primary.main';
      case 'Education':
        return 'secondary.main';
      case 'Residence':
        return 'success.main';
      case 'Military':
        return 'warning.dark';
      case 'Medical':
        return 'error.main';
      case 'Travel':
        return 'info.main';
      case 'Achievement':
        return 'warning.main';
      default:
        return 'text.secondary';
    }
  };
  
  


  const formatEventDate = (event: Event): string => {
    if (!event.date || !event.date.start) return 'No date';
    
    const startDate = new Date(event.date.start);
    
    if (event.date.isRange && event.date.end) {
      const endDate = new Date(event.date.end);
      return `${format(startDate, 'MMM d, yyyy')} - ${format(endDate, 'MMM d, yyyy')}`;
    }
    
    return format(startDate, 'MMM d, yyyy');
  };
  
  // Get additional participants
  const getParticipants = (event: Event): string | null => {
    if (!event.persons || event.persons.length <= 1) {
      return null;
    }
    
    const otherPersons = event.persons.filter(p => p._id !== personId);
    
    if (otherPersons.length === 0) {
      return null;
    }
    
    return otherPersons.map(person => {
      if (person.names && person.names.length > 0) {
        return `${person.names[0].given} ${person.names[0].surname}`;
      }
      return 'Unknown Person';
    }).join(', ');
  };
  
  // Apply filters and sorting
  const filteredAndSortedEvents = [...events]
    .filter(event => {
      if (filterType === 'all') return true;
      return event.type === filterType;
    })
    .sort((a, b) => {
      const dateA = a.date?.start ? new Date(a.date.start).getTime() : 0;
      const dateB = b.date?.start ? new Date(b.date.start).getTime() : 0;
      return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
    });
  
  // Find birth and death events for life span display
  const birthEvent = events.find(event => event.type === 'Birth' || (
    event.title?.toLowerCase().includes('birth') && event.date?.start));
  
  const deathEvent = events.find(event => event.type === 'Death' || (
    event.title?.toLowerCase().includes('death') && event.date?.start));
  
  // Calculate age or lifespan
  const getLifespan = (): string | null => {
    if (!birthEvent?.date?.start) return null;
    
    const birthDate = new Date(birthEvent.date.start);
    
    if (deathEvent?.date?.start) {
      const deathDate = new Date(deathEvent.date.start);
      const years = deathDate.getFullYear() - birthDate.getFullYear();
      // Adjust for month and day
      if (
        deathDate.getMonth() < birthDate.getMonth() || 
        (deathDate.getMonth() === birthDate.getMonth() && deathDate.getDate() < birthDate.getDate())
      ) {
        return `${years - 1} years`;
      }
      return `${years} years`;
    }
    
    // Person is still alive or death date unknown
    const now = new Date();
    const years = now.getFullYear() - birthDate.getFullYear();
    // Adjust for month and day
    if (
      now.getMonth() < birthDate.getMonth() || 
      (now.getMonth() === birthDate.getMonth() && now.getDate() < birthDate.getDate())
    ) {
      return `${years - 1} years`;
    }
    return `${years} years`;
  };

// Person summary display for the top of the timeline
const PersonSummary = (): React.ReactNode => {
  if (!personDetails) return null;
  
  return (
    <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ width: 64, height: 64 }}>
              <PersonIcon fontSize="large" />
            </Avatar>
            <Box>
              <Typography variant="h4">
                {personName || 'Person Timeline'}
              </Typography>
              
              {personDetails.gender && (
                <Chip 
                  label={personDetails.gender === 'M' ? 'Male' : 
                         personDetails.gender === 'F' ? 'Female' : 
                         personDetails.gender === 'O' ? 'Other' : 'Unknown'} 
                  color={personDetails.gender === 'M' ? 'primary' : 
                         personDetails.gender === 'F' ? 'secondary' : 
                         'default'}
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
            </Box>
          </Box>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Box display="flex" flexDirection="column" gap={1}>
            {personDetails.birth && (
              <Box display="flex" alignItems="center" gap={1}>
                <BirthIcon fontSize="small" color="primary" />
                <Typography>
                  <strong>Born:</strong> {
                    personDetails.birth.date ? 
                      format(new Date(personDetails.birth.date), 'MMMM d, yyyy') : 
                      'Date unknown'
                  }
                  {personDetails.birth.place ? ` in ${personDetails.birth.place}` : ''}
                </Typography>
              </Box>
            )}
            
            {personDetails.death && (
              <Box display="flex" alignItems="center" gap={1}>
                <DeathIcon fontSize="small" color="error" />
                <Typography>
                  <strong>Died:</strong> {
                    personDetails.death.date ? 
                      format(new Date(personDetails.death.date), 'MMMM d, yyyy') : 
                      'Date unknown'
                  }
                  {personDetails.death.place ? ` in ${personDetails.death.place}` : ''}
                </Typography>
              </Box>
            )}
            
            {getLifespan() && (
              <Typography variant="subtitle1">
                <strong>Lifespan:</strong> {getLifespan()}
              </Typography>
            )}
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};

  return (
    <div>
      {/* Person summary at the top */}
      <PersonSummary />
      <PersonNavigationMenu />
      {/* Timeline controls */}
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h5">
              Life Events
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
        
        <Box mt={3} display="flex" justifyContent="flex-end">
          <IconButton onClick={() => setShowFilters(!showFilters)}>
            <FilterIcon />
          </IconButton>
          <IconButton onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}>
            <SortIcon />
          </IconButton>
        </Box>
        
        {showFilters && (
          <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1}>
            <FormControl fullWidth size="small">
              <InputLabel>Event Type</InputLabel>
              <Select
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                label="Event Type"
              >
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="Work">Work</MenuItem>
                <MenuItem value="Education">Education</MenuItem>
                <MenuItem value="Residence">Residence</MenuItem>
                <MenuItem value="Military">Military</MenuItem>
                <MenuItem value="Medical">Medical</MenuItem>
                <MenuItem value="Travel">Travel</MenuItem>
                <MenuItem value="Achievement">Achievement</MenuItem>
                <MenuItem value="Custom">Custom</MenuItem>
              </Select>
            </FormControl>
          </Box>
        )}
      </Paper>
      
      {/* Event editor modal */}
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
      
      {/* Timeline display */}
      {loading ? (
        <Typography>Loading timeline...</Typography>
      ) : error ? (
        <Typography color="error">{error}</Typography>
      ) : filteredAndSortedEvents.length === 0 ? (
        <Paper elevation={2} sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" gutterBottom>No Events Found</Typography>
          <Typography>
            This person doesn't have any recorded events
            {filterType !== 'all' ? ` of type "${filterType}"` : ''}.
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            startIcon={<AddIcon />}
            onClick={() => setShowAddEvent(true)}
            sx={{ mt: 2 }}
          >
            Add First Event
          </Button>
        </Paper>
      ) : (
        <Paper elevation={2} sx={{ p: 2 }}>
          <Timeline position="alternate">
            {filteredAndSortedEvents.map((event) => (
              <TimelineItem key={event._id}>
                <TimelineOppositeContent sx={{ m: 'auto 0' }} color="text.secondary">
                  <Typography variant="body2" fontWeight="bold">
                    {formatEventDate(event)}
                  </Typography>
                  {event.location?.place && (
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <LocationIcon fontSize="small" />
                      <Typography variant="body2" color="text.secondary">
                        {event.location.place}
                      </Typography>
                    </Box>
                  )}
                </TimelineOppositeContent>
                
                <TimelineSeparator>
                  <Tooltip title={event.type}>
                    <TimelineDot sx={{ bgcolor: getEventColor(event.type) }}>
                      {getEventIcon(event.type)}
                    </TimelineDot>
                  </Tooltip>
                  <TimelineConnector />
                </TimelineSeparator>
                
                <TimelineContent sx={{ py: 2 }}>
                  <Card 
                    elevation={3} 
                    sx={{ 
                      transition: 'transform 0.2s, box-shadow 0.2s',
                      '&:hover': {
                        transform: 'translateY(-3px)',
                        boxShadow: 6
                      }
                    }}
                  >
                    <CardContent>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                        <Box width="100%">
                          <Box display="flex" alignItems="center" gap={1} mb={1}>
                            <Typography variant="h6">{event.title}</Typography>
                            <Chip
                              label={event.type}
                              size="small"
                              sx={{ 
                                bgcolor: getEventColor(event.type),
                                color: 'white'
                              }}
                            />
                          </Box>
                          
                          {event.description && (
                            <Typography variant="body2" paragraph>
                              {event.description}
                            </Typography>
                          )}
                          
                          {getParticipants(event) && (
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              <strong>Also involving:</strong> {getParticipants(event)}
                            </Typography>
                          )}
                          
                          {event.notes && (
                            <Typography variant="body2" color="text.secondary">
                              <strong>Notes:</strong> {event.notes}
                            </Typography>
                          )}
                        </Box>
                        
                        <Box>
                          <IconButton 
                            size="small" 
                            onClick={() => setEditingEventId(event._id)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
                </TimelineContent>
              </TimelineItem>
            ))}
          </Timeline>
        </Paper>
      )}
    </div>
  );
};

export default PersonTimeline;