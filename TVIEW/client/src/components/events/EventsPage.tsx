// src/components/events/EventsPage.tsx
import { useState, useEffect } from 'react';
import {
  Typography,
  List,
  ListItem,
  ListItemText,
  Button,
  Dialog,
  DialogContent,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Grid,
  Paper,
  Tabs,
  Tab,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Sort as SortIcon,
  Event as EventIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon,
  List as ListIcon,
  People as PeopleIcon,
  MilitaryTech as MilitaryIcon,
  LocalHospital as MedicalIcon,
  FlightTakeoff as TravelIcon,
  EmojiEvents as AchievementIcon,
  Favorite as FavoriteIcon,
  HeartBroken as HeartBrokenIcon,
  ChildCare as ChildCareIcon,
  SentimentVeryDissatisfied as SentimentVeryDissatisfiedIcon,
  Terrain as TerrainIcon,
  Water as WaterIcon,
  PeopleAlt as PeopleAltIcon,
  PersonSearch as PersonSearchIcon,
  NoteAlt as NoteAltIcon,
  Person as PersonIcon,
  Bedroom as BedroomIcon,
  MenuBook as MenuBookIcon
} from '@mui/icons-material';
import axios from 'axios';
import EventEditor from '../forms/EventEditor';
import { API } from '../../config/api';
import type { IEvent, Person, EventType } from './EventsPage.types';

function EventsPage() {
  console.log('==========================================');
  console.log('EVENTSPAGE COMPONENT RENDERED');
  console.log('==========================================');

  // State management
  const [events, setEvents] = useState<IEvent[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [filterType, setFilterType] = useState('all');
  const [filterPerson, setFilterPerson] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);

  // Get appropriate icon for event type
  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'Residence': return <HomeIcon />;
      case 'Work': return <WorkIcon />;
      case 'Education': return <SchoolIcon />;
      case 'Military': return <MilitaryIcon />;
      case 'Medical': return <MedicalIcon />;
      case 'Travel': return <TravelIcon />;
      case 'Achievement': return <AchievementIcon />;
      case 'Marriage': return <FavoriteIcon />;
      case 'Divorce': return <HeartBrokenIcon />;
      case 'Engagement': return <FavoriteIcon color="secondary" />;
      case 'Separation': return <HeartBrokenIcon color="secondary" />;
      case 'Annulment': return <HeartBrokenIcon color="warning" />;
      case 'Adoption': return <ChildCareIcon color="secondary" />;
      case 'Birth': return <ChildCareIcon />;
      case 'Death': return <SentimentVeryDissatisfiedIcon />;
      case 'Burial': return <TerrainIcon />;
      case 'Baptism': return <WaterIcon />;
      case 'Census': return <PeopleAltIcon />;
      case 'Retirement': return <BedroomIcon />;
      case 'Graduation': return <MenuBookIcon />;
      case 'Contact': return <PersonIcon />;
      case 'ResearchNote': return <NoteAltIcon />;
      case 'Custom': return <EventIcon color="secondary" />;
      default: return <EventIcon />;
    }
  };

  // Format date for display (day level only)
  const getDateDisplay = (event: IEvent) => {
    try {
      if (!event.date || !event.date.start) return 'No date';
      
      // Create date object and check validity
      const date = new Date(event.date.start);
      if (isNaN(date.getTime())) return 'Invalid date';
      
      // Format date as YYYY-MM-DD without time component
      return date.toISOString().split('T')[0];
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Error with date';
    }
  };

  // Get primary person name from event
  const getPersonName = (event: IEvent): string => {
    try {
      if (!event.persons || event.persons.length === 0) return 'Unknown Person';
      
      const person = event.persons[0];
      if (!person.names || person.names.length === 0) return 'Unnamed Person';
      
      const name = person.names[0];
      return `${name.given} ${name.surname}`;
    } catch (error) {
      console.error('Error getting person name:', error);
      return 'Error with person';
    }
  };

  // Get all participants for an event (except the primary person)
  const getParticipants = (event: IEvent): string => {
    try {
      if (!event.persons || event.persons.length <= 1) return '';
      
      return event.persons.slice(1).map(person => {
        if (!person.names || person.names.length === 0) return 'Unnamed Person';
        const name = person.names[0];
        return `${name.given} ${name.surname}`;
      }).join(', ');
    } catch (error) {
      console.error('Error getting participants:', error);
      return '';
    }
  };

  // Fetch events and people data
  const fetchData = async () => {
    try {
      console.log('Fetching events and people data...');
      setLoading(true);
      setError(null);
      
      const eventsResponse = await axios.get(API.events.getAll);
      console.log(`Received ${eventsResponse.data.length} events`);
      
      const peopleResponse = await axios.get(API.persons.getAll);
      console.log(`Received ${peopleResponse.data.length} people`);
      
      setEvents(eventsResponse.data);
      setPeople(peopleResponse.data);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError('Failed to load events and people data');
    } finally {
      setLoading(false);
      console.log('Data fetch complete');
    }
  };

  // Load data on component mount
  useEffect(() => {
    fetchData();
  }, []);

  // Handle opening event editor
  const handleEditEvent = (id?: string) => {
    console.log(`Opening editor for event ID: ${id || 'new event'}`);
    setSelectedEventId(id);
    setIsEditorOpen(true);
    console.log(`State updated - isEditorOpen: true, selectedEventId: ${id}`);
  };

  // Handle closing event editor
  const handleCloseEditor = () => {
    console.log('Closing editor dialog');
    setIsEditorOpen(false);
    setSelectedEventId(undefined);
    console.log('Editor dialog closed');
  };

  // Handle successful event save
  const handleEventSaved = async () => {
    console.log('Event saved, refreshing event list');
    try {
      const response = await axios.get(API.events.getAll);
      setEvents(response.data);
      handleCloseEditor();
    } catch (err) {
      console.error('Error refreshing events:', err);
      setError('Failed to refresh events after save');
    }
  };

  // Filter and sort events based on user selection
  const filteredAndSortedEvents = [...events]
    .filter(event => {
      if (filterType !== 'all' && event.type !== filterType) return false;
      if (filterPerson !== 'all' && !event.persons?.some(p => p._id === filterPerson)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          try {
            const dateA = a.date?.start ? new Date(a.date.start).getTime() : 0;
            const dateB = b.date?.start ? new Date(b.date.start).getTime() : 0;
            // Handle invalid dates gracefully
            return (isNaN(dateA) ? 0 : dateA) - (isNaN(dateB) ? 0 : dateB);
          } catch (error) {
            console.error('Error sorting by date:', error);
            return 0;
          }
        case 'type': 
          return (a.type || '').localeCompare(b.type || '');
        case 'title': 
          return (a.title || '').localeCompare(b.title || '');
        case 'person': 
          return getPersonName(a).localeCompare(getPersonName(b));
        default: 
          return 0;
      }
    });

  return (
    <div>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container justifyContent="space-between" alignItems="center">
          <Grid item>
            <Typography variant="h4">Events</Typography>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              startIcon={<EventIcon />} 
              onClick={() => handleEditEvent(undefined)}
            >
              Add Event
            </Button>
          </Grid>
        </Grid>

        <Box mt={2} display="flex" justifyContent="space-between">
          <Tabs value={viewMode} onChange={(e, val) => setViewMode(val)}>
            <Tab label="List" icon={<ListIcon />} value="list" />
            <Tab label="Timeline" icon={<TimelineIcon />} value="timeline" />
          </Tabs>
          <Box>
            <IconButton onClick={() => setShowFilters(!showFilters)}>
              <FilterIcon />
            </IconButton>
            <IconButton>
              <SortIcon />
            </IconButton>
          </Box>
        </Box>

        {showFilters && (
          <Box mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select 
                    value={sortBy} 
                    onChange={(e) => setSortBy(e.target.value)}
                  >
                    <MenuItem value="date">Date</MenuItem>
                    <MenuItem value="type">Type</MenuItem>
                    <MenuItem value="title">Title</MenuItem>
                    <MenuItem value="person">Person</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Event Type</InputLabel>
                  <Select 
                    value={filterType} 
                    onChange={(e) => setFilterType(e.target.value)}
                  >
                    <MenuItem value="all">All Types</MenuItem>
                    {Array.from(new Set(events.map(e => e.type)))
                      .sort()
                      .map(type => (
                        <MenuItem key={type} value={type}>{type}</MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Person</InputLabel>
                  <Select 
                    value={filterPerson} 
                    onChange={(e) => setFilterPerson(e.target.value)}
                  >
                    <MenuItem value="all">All People</MenuItem>
                    {people
                      .sort((a, b) => {
                        const nameA = a.names?.[0] ? `${a.names[0].surname}, ${a.names[0].given}` : '';
                        const nameB = b.names?.[0] ? `${b.names[0].surname}, ${b.names[0].given}` : '';
                        return nameA.localeCompare(nameB);
                      })
                      .map(p => (
                        <MenuItem key={p._id} value={p._id}>
                          {p.names?.[0]?.given} {p.names?.[0]?.surname}
                        </MenuItem>
                      ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box display="flex" justifyContent="center" p={4}>
          <CircularProgress />
        </Box>
      ) : (
        <Paper elevation={1}>
          {filteredAndSortedEvents.length === 0 ? (
            <Box p={4} textAlign="center">
              <Typography variant="body1">
                No events found. Add events using the "Add Event" button.
              </Typography>
            </Box>
          ) : (
            <List>
              {filteredAndSortedEvents.map(event => (
                <ListItem 
                  key={event._id} 
                  divider
                  secondaryAction={
                    <Button 
                      onClick={() => handleEditEvent(event._id)} 
                      variant="outlined"
                    >
                      Edit
                    </Button>
                  }
                >
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        {getEventIcon(event.type)}
                        <Typography variant="h6">{event.title}</Typography>
                        <Chip label={event.type} size="small" />
                      </Box>
                    }
                    secondary={
                      <>
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          <strong>Date:</strong> {getDateDisplay(event)}
                        </Typography>
                        
                        <Typography variant="body2">
                          <strong>Person:</strong> {getPersonName(event)}
                        </Typography>
                        
                        {event.persons && event.persons.length > 1 && (
                          <Typography variant="body2">
                            <strong>Also involving:</strong> {getParticipants(event)}
                          </Typography>
                        )}
                        
                        {event.location?.place && (
                          <Typography variant="body2">
                            <strong>Location:</strong> {event.location.place}
                          </Typography>
                        )}
                        
                        {event.description && (
                          <Typography 
                            variant="body2" 
                            color="textSecondary"
                            sx={{ mt: 1, fontStyle: 'italic' }}
                          >
                            {event.description}
                          </Typography>
                        )}
                      </>
                    } 
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>
      )}

      <Dialog 
        open={isEditorOpen} 
        onClose={handleCloseEditor} 
        fullWidth 
        maxWidth="md"
        TransitionProps={{
          onEnter: () => console.log("Dialog entering"),
          onEntered: () => console.log("Dialog fully entered"),
          onExit: () => console.log("Dialog exiting"),
          onExited: () => console.log("Dialog fully exited")
        }}
      >
        <DialogContent>
          {/* Rendering EventEditor with ID: ${selectedEventId || 'new'} */}
          {isEditorOpen && (
            <EventEditor 
              eventId={selectedEventId} 
              onClose={handleCloseEditor} 
              onSave={handleEventSaved} 
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EventsPage;