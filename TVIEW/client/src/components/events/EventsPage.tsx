// Enhanced EventsPage.tsx
import { useState, useEffect } from 'react';
import { 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Button,
  Dialog,
  DialogContent,
  TextField,
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
  Divider
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Sort as SortIcon,
  Event as EventIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Timeline as TimelineIcon,
  List as ListIcon
} from '@mui/icons-material';
import axios from 'axios';
import EventEditor from '../forms/EventEditor';
import { API } from '../../config/api';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  
  // New state for filtering and sorting
  const [sortBy, setSortBy] = useState('date');
  const [filterType, setFilterType] = useState('all');
  const [filterPerson, setFilterPerson] = useState('all');
  const [viewMode, setViewMode] = useState('list'); // 'list' or 'timeline'
  const [showFilters, setShowFilters] = useState(false);
  const [people, setPeople] = useState([]);
  
  // Function to get appropriate icon based on event type
  const getEventIcon = (type) => {
    switch(type) {
      case 'Residence': return <HomeIcon />;
      case 'Work': return <WorkIcon />;
      case 'Education': return <SchoolIcon />;
      default: return <EventIcon />;
    }
  };
  
  // Get formatted date display
  const getDateDisplay = (event) => {
    if (!event.date || !event.date.start) return 'No date';
    const date = new Date(event.date.start);
    if (isNaN(date)) return 'No date';
    
    return date.toLocaleDateString();
  };
  
  // Get person name display
  const getPersonName = (event) => {
    if (!event.persons || !event.persons.length) return 'Unknown Person';
    
    const person = event.persons[0];
    if (!person.names || !person.names.length) return 'Unknown Person';
    
    const name = person.names[0];
    return `${name.given} ${name.surname}`;
  };
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        // Fetch events
        const eventsResponse = await axios.get(API.events.getAll);
        setEvents(eventsResponse.data);
        
        // Fetch people for filtering
        const peopleResponse = await axios.get(API.persons.getAll);
        setPeople(peopleResponse.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleEditEvent = (eventId) => {
    setSelectedEventId(eventId);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedEventId(null);
  };
  
  const handleEventSaved = async () => {
    // Refresh the events list
    try {
      const response = await axios.get(API.events.getAll);
      setEvents(response.data);
      handleCloseEditor();
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };
  
  // Apply filters and sorting
  const filteredAndSortedEvents = [...events]
    .filter(event => {
      // Apply type filter
      if (filterType !== 'all' && event.type !== filterType) return false;
      
      // Apply person filter
      if (filterPerson !== 'all') {
        if (!event.persons || !event.persons.some(p => p._id === filterPerson)) return false;
      }
      
      return true;
    })
    .sort((a, b) => {
      // Apply sorting
      switch(sortBy) {
        case 'date':
          const dateA = a.date?.start ? new Date(a.date.start).getTime() : 0;
          const dateB = b.date?.start ? new Date(b.date.start).getTime() : 0;
          return dateB - dateA; // Most recent first
        case 'type':
          return a.type.localeCompare(b.type);
        case 'title':
          return a.title.localeCompare(b.title);
        case 'person':
          return getPersonName(a).localeCompare(getPersonName(b));
        default:
          return 0;
      }
    });
  
  // Group events by person
  const groupedByPerson = {};
  filteredAndSortedEvents.forEach(event => {
    const personName = getPersonName(event);
    if (!groupedByPerson[personName]) {
      groupedByPerson[personName] = [];
    }
    groupedByPerson[personName].push(event);
  });

  return (
    <div>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4">
              Events Management
            </Typography>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={() => handleEditEvent(null)}
              startIcon={<EventIcon />}
            >
              Create New Event
            </Button>
          </Grid>
        </Grid>
        
        <Box mt={3} display="flex" justifyContent="space-between">
          <Box>
            <Tabs value={viewMode} onChange={(e, newValue) => setViewMode(newValue)}>
              <Tab icon={<ListIcon />} label="List View" value="list" />
              <Tab icon={<TimelineIcon />} label="Timeline View" value="timeline" />
            </Tabs>
          </Box>
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
          <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Sort By"
                  >
                    <MenuItem value="date">Date (Newest First)</MenuItem>
                    <MenuItem value="type">Event Type</MenuItem>
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
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Person</InputLabel>
                  <Select
                    value={filterPerson}
                    onChange={(e) => setFilterPerson(e.target.value)}
                    label="Person"
                  >
                    <MenuItem value="all">All People</MenuItem>
                    {people.map(person => (
                      <MenuItem key={person._id} value={person._id}>
                        {person.names && person.names.length > 0
                          ? `${person.names[0].given} ${person.names[0].surname}`
                          : 'Unknown Name'}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      
      {loading ? (
        <Typography>Loading events...</Typography>
      ) : (
        viewMode === 'list' ? (
          <Paper elevation={2}>
            <List>
              {filteredAndSortedEvents.map((event) => (
                <ListItem 
                  key={event._id}
                  divider
                  secondaryAction={
                    <Button 
                      variant="outlined" 
                      onClick={() => handleEditEvent(event._id)}
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
                        <Chip 
                          label={event.type} 
                          size="small" 
                          color={event.type === 'Residence' ? 'success' : 
                                 event.type === 'Work' ? 'primary' : 
                                 event.type === 'Education' ? 'secondary' : 'default'} 
                        />
                      </Box>
                    }
                    secondary={
                      <Box mt={1}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2">
                              <strong>Date:</strong> {getDateDisplay(event)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            <Typography variant="body2">
                              <strong>Person:</strong> {getPersonName(event)}
                            </Typography>
                          </Grid>
                          <Grid item xs={12} sm={4}>
                            {event.location && event.location.place && (
                              <Typography variant="body2">
                                <strong>Location:</strong> {event.location.place}
                              </Typography>
                            )}
                          </Grid>
                          {event.description && (
                            <Grid item xs={12}>
                              <Typography variant="body2" color="text.secondary">
                                {event.description}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          </Paper>
        ) : (
          // Timeline view (placeholder for now)
          <Paper elevation={2} sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>Timeline View</Typography>
            <Typography>
              A visual timeline will be implemented here to show events chronologically.
            </Typography>
          </Paper>
        )
      )}
      
      <Dialog
        open={isEditorOpen}
        onClose={handleCloseEditor}
        fullWidth
        maxWidth="md"
      >
        <DialogContent>
          <EventEditor 
            eventId={selectedEventId} 
            onClose={handleCloseEditor}
            onSave={handleEventSaved}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventsPage;