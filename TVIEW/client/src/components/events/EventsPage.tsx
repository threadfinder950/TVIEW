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
  Box
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Sort as SortIcon,
  Event as EventIcon,
  Home as HomeIcon,
  Work as WorkIcon,
  School as SchoolIcon,
  Timeline as TimelineIcon,
  List as ListIcon
} from '@mui/icons-material';
import axios from 'axios';
import EventEditor from '../forms/EventEditor';
import { API } from '../../config/api';
import type { IEvent, Person, EventType } from './EventsPage.types';

function EventsPage() {
  const [events, setEvents] = useState<IEvent[]>([]);
  const [people, setPeople] = useState<Person[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [filterType, setFilterType] = useState('all');
  const [filterPerson, setFilterPerson] = useState('all');
  const [viewMode, setViewMode] = useState('list');
  const [showFilters, setShowFilters] = useState(false);

  const getEventIcon = (type: EventType) => {
    switch (type) {
      case 'Residence': return <HomeIcon />;
      case 'Work': return <WorkIcon />;
      case 'Education': return <SchoolIcon />;
      default: return <EventIcon />;
    }
  };

  const getDateDisplay = (event: IEvent) => {
    if (!event.date || !event.date.start) return 'No date';
    const date = new Date(event.date.start);
    return isNaN(date.getTime()) ? 'No date' : date.toLocaleDateString();
  };

  const getPersonName = (event: IEvent): string => {
    if (!event.persons?.length || !event.persons[0].names?.length) return 'Unknown Person';
    const name = event.persons[0].names[0];
    return `${name.given} ${name.surname}`;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const eventsResponse = await axios.get(API.events.getAll);
        const peopleResponse = await axios.get(API.persons.getAll);
        setEvents(eventsResponse.data);
        setPeople(peopleResponse.data);
      } catch (err) {
        console.error('Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleEditEvent = (id?: string) => {
    setSelectedEventId(id);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedEventId(undefined);
  };

  const handleEventSaved = async () => {
    try {
      const response = await axios.get(API.events.getAll);
      setEvents(response.data);
      handleCloseEditor();
    } catch (err) {
      console.error('Error refreshing events:', err);
    }
  };

  const filteredAndSortedEvents = [...events]
    .filter(event => {
      if (filterType !== 'all' && event.type !== filterType) return false;
      if (filterPerson !== 'all' && !event.persons.some(p => p._id === filterPerson)) return false;
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.date?.start ?? 0).getTime() - new Date(a.date?.start ?? 0).getTime();
        case 'type': return a.type.localeCompare(b.type);
        case 'title': return a.title.localeCompare(b.title);
        case 'person': return getPersonName(a).localeCompare(getPersonName(b));
        default: return 0;
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
            <Button variant="contained" startIcon={<EventIcon />} onClick={() => handleEditEvent(undefined)}>
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
            <IconButton onClick={() => setShowFilters(!showFilters)}><FilterIcon /></IconButton>
            <IconButton><SortIcon /></IconButton>
          </Box>
        </Box>

        {showFilters && (
          <Box mt={2}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
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
                  <Select value={filterType} onChange={(e) => setFilterType(e.target.value)}>
                    <MenuItem value="all">All</MenuItem>
                    {[...new Set(events.map(e => e.type))].map(type => (
                      <MenuItem key={type} value={type}>{type}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={4}>
                <FormControl fullWidth size="small">
                  <InputLabel>Person</InputLabel>
                  <Select value={filterPerson} onChange={(e) => setFilterPerson(e.target.value)}>
                    <MenuItem value="all">All</MenuItem>
                    {people.map(p => (
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

      <Paper elevation={1}>
        <List>
          {filteredAndSortedEvents.map(event => (
            <ListItem key={event._id} divider>
              <ListItemText
                primary={<Box display="flex" alignItems="center" gap={1}>
                  {getEventIcon(event.type)}
                  <Typography variant="h6">{event.title}</Typography>
                  <Chip label={event.type} size="small" />
                </Box>}
                secondary={<>
                  <Typography variant="body2"><strong>Date:</strong> {getDateDisplay(event)}</Typography>
                  <Typography variant="body2"><strong>Person:</strong> {getPersonName(event)}</Typography>
                  {event.location?.place && (
                    <Typography variant="body2"><strong>Location:</strong> {event.location.place}</Typography>
                  )}
                  {event.description && (
                    <Typography variant="body2" color="textSecondary">{event.description}</Typography>
                  )}
                </>} />
              <Button onClick={() => handleEditEvent(event._id)} variant="outlined">Edit</Button>
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={isEditorOpen} onClose={handleCloseEditor} fullWidth maxWidth="md">
        <DialogContent>
          <EventEditor eventId={selectedEventId} onClose={handleCloseEditor} onSave={handleEventSaved} />
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default EventsPage;
