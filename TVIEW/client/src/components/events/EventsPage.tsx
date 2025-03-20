import { useState, useEffect } from 'react';
import { 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Button,
  Dialog,
  DialogContent
} from '@mui/material';
import axios from 'axios';
import EventEditor from '../forms/EventEditor';
import { API } from '../../config/api';

const EventsPage = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedEventId, setSelectedEventId] = useState(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const response = await axios.get(API.events.getAll);
        setEvents(response.data);
      } catch (error) {
        console.error('Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchEvents();
  }, []);

  const handleEditEvent = (eventId) => {
    setSelectedEventId(eventId);
    setIsEditorOpen(true);
  };

  const handleCloseEditor = () => {
    setIsEditorOpen(false);
    setSelectedEventId(null);
  };

  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Events Management
      </Typography>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={() => handleEditEvent(null)}
        sx={{ mb: 2 }}
      >
        Create New Event
      </Button>
      
      {loading ? <p>Loading events...</p> : (
        <List>
          {events.map((event) => (
            <ListItem key={event._id}>
              <ListItemText 
                primary={event.title} 
                secondary={`${event.type} - ${new Date(event.date.start).toLocaleDateString()}`} 
              />
              <Button 
                variant="outlined" 
                onClick={() => handleEditEvent(event._id)}
              >
                Edit
              </Button>
            </ListItem>
          ))}
        </List>
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
            onSave={() => {
              handleCloseEditor();
              // Refresh the events list
              fetchEvents();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default EventsPage;