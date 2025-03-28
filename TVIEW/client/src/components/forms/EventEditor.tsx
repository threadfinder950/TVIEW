// src/components/forms/EventEditor.tsx
import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Paper,
  Typography,
  Divider,
  Switch,
  FormControlLabel,
  Snackbar,
  Alert,
  SelectChangeEvent,
  Box,
  FormHelperText,
  CircularProgress,
  Chip,
  OutlinedInput
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import axios from 'axios';
import { API } from '../../config/api';
import { isValidDate } from '../../utils/dateUtils';

interface EventFormData {
  type: string;
  title: string;
  description: string;
  date: {
    start: Date | null;
    end: Date | null;
    isRange: boolean;
  };
  location: {
    place: string;
    coordinates: {
      latitude: number | null;
      longitude: number | null;
    };
  };
  notes: string;
}

interface EventEditorProps {
  personId?: string; // Optional - if provided, will add this person automatically
  eventId?: string; // Optional - for editing existing events
  onSave?: () => void;
  onCancel?: () => void;
  onClose?: () => void; // Added for better compatibility
}

const initialFormData: EventFormData = {
  type: 'Custom',
  title: '',
  description: '',
  date: {
    start: null,
    end: null,
    isRange: false,
  },
  location: {
    place: '',
    coordinates: {
      latitude: null,
      longitude: null,
    },
  },
  notes: '',
};

const eventTypes = [
  'Work',
  'Education',
  'Residence',
  'Military',
  'Medical',
  'Travel',
  'Achievement',
  'Custom',
  'Marriage',
  'Divorce',
  'Engagement',
  'Separation',
  'Annulment',
  'Adoption',
  'Baptism',
  'Burial',
  'Birth',
  'Death',
  'Retirement',
  'Graduation',
  'Census',
  'Contact',
  'ResearchNote'
] as const;

const EventEditor: React.FC<EventEditorProps> = ({ personId, eventId, onSave, onCancel, onClose }) => {
  // Enhanced to include selectedPersonIds as an array
  const [formData, setFormData] = useState<EventFormData & { selectedPersonIds: string[] }>({
    ...initialFormData,
    selectedPersonIds: personId ? [personId] : []
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [availablePeople, setAvailablePeople] = useState<any[]>([]);
  
  // If eventId is provided, fetch the event data
  // If no personId is provided or if we're editing, fetch the list of people
 // In src/components/forms/EventEditor.tsx
useEffect(() => {
  const loadData = async () => {
    try {
      
      console.log("Starting to load event data for ID:", eventId);
      setLoading(true);
      console.log("Fetching people list...");
      
      // Always fetch available people for multi-select
      const peopleResponse = await axios.get(API.persons.getAll);
     
      console.log("People data received:", peopleResponse.data.length, "people found");
      setAvailablePeople(peopleResponse.data);
      
      // Fetch event data if editing an existing event
      if (eventId) {
        const response = await axios.get(API.events.getById(eventId));
        
        // Convert string dates to Date objects if they're valid
        const eventData = {
          ...response.data,
          date: {
            ...response.data.date,
            start: response.data.date.start && isValidDate(response.data.date.start) ? 
              new Date(response.data.date.start) : null,
            end: response.data.date.end && isValidDate(response.data.date.end) ? 
              new Date(response.data.date.end) : null,
          }
        };
        
        // Handle the conversion of persons field
        const personsArray = Array.isArray(response.data.persons) 
          ? response.data.persons.map((p) => typeof p === 'object' ? p._id : p)
          : response.data.person  // Handle legacy data with single person
            ? [response.data.person]
            : [];
        
        setFormData({
          ...eventData,
          selectedPersonIds: personsArray
        });
      }
      
      setLoading(false);
    } catch (err) {
      let errorMessage = 'Failed to fetch data';
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };
  
  loadData();
}, [eventId, personId]);
  
  // Handler for text input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Handler for select dropdown changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Handler for multiple person selection
  const handlePersonSelectChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    setFormData({
      ...formData,
      selectedPersonIds: typeof value === 'string' ? value.split(',') : value,
    });
  };
  
  // Handler for date changes
  const handleDateChange = (date: Date | null, fieldName: string) => {
    setFormData({
      ...formData,
      date: {
        ...formData.date,
        [fieldName]: date,
      },
    });
  };
  
  // Handler for location changes
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        [name]: value,
      },
    });
  };
  
  // Handler for coordinate changes
  const handleCoordinateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? null : parseFloat(value);
    
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        coordinates: {
          ...formData.location.coordinates,
          [name]: numValue,
        },
      },
    });
  };
  
  // Handler for date range toggle
  const handleRangeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    setFormData({
      ...formData,
      date: {
        ...formData.date,
        isRange: checked,
        end: checked ? formData.date.end : null,
      },
    });
  };
  
  // Form submission handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate that at least one person is selected
      if (formData.selectedPersonIds.length === 0) {
        setError('Please select at least one person for this event');
        setLoading(false);
        return;
      }
      
      // Prepare the event data with the persons array
      const eventData = {
        ...formData,
        persons: formData.selectedPersonIds,
      };
      
      // Remove the selectedPersonIds field since it's not part of the model
      delete eventData.selectedPersonIds;
      
      let response;
      
      if (eventId) {
        // Update existing event
        response = await axios.patch(API.events.update(eventId), eventData);
      } else {
        // Create new event
        response = await axios.post(API.events.create, eventData);
      }
      
      setSuccess(true);
      setLoading(false);
      
      // Reset form after successful submit if creating a new event
      if (!eventId) {
        setFormData({
          ...initialFormData,
          selectedPersonIds: personId ? [personId] : []
        });
      }
      
      // Call onSave callback if provided
      if (onSave) {
        onSave();
      }
    } catch (err) {
      let errorMessage = 'Failed to save event';
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };
  
  const handleCancelClick = () => {
    if (onCancel) {
      onCancel();
    }
    if (onClose) {
      onClose();
    }
  };
  
  // Helper function to get person name by ID
  const getPersonName = (personId: string): string => {
    const person = availablePeople.find(p => p._id === personId);
    if (!person || !person.names || person.names.length === 0) {
      return 'Unknown Person';
    }
    return `${person.names[0].given} ${person.names[0].surname}`;
  };
  
  return (
    <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
      <Typography variant="h5" gutterBottom>
        {eventId ? 'Edit Event' : 'Add New Event'}
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading && !formData.title ? (
        <Box display="flex" justifyContent="center" p={3}>
          <CircularProgress />
        </Box>
      ) : (
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            {/* Multi-person selector - always show, but pre-select personId if provided */}
            <Grid item xs={12}>
              <FormControl fullWidth required error={formData.selectedPersonIds.length === 0 && !!error}>
                <InputLabel id="person-select-label">Participants</InputLabel>
                <Select
                  labelId="person-select-label"
                  id="person-select"
                  multiple
                  value={formData.selectedPersonIds}
                  onChange={handlePersonSelectChange}
                  input={<OutlinedInput label="Participants" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {selected.map((value) => (
                        <Chip key={value} label={getPersonName(value)} />
                      ))}
                    </Box>
                  )}
                >
                  {availablePeople.map((person) => (
                    <MenuItem key={person._id} value={person._id}>
                      {person.names && person.names.length > 0
                        ? `${person.names[0].given} ${person.names[0].surname}`
                        : 'Unknown Name'}
                    </MenuItem>
                  ))}
                </Select>
                {formData.selectedPersonIds.length === 0 && !!error && (
                  <FormHelperText>At least one person must be selected</FormHelperText>
                )}
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel id="event-type-label">Event Type</InputLabel>
                <Select
                  labelId="event-type-label"
                  id="event-type"
                  name="type"
                  value={formData.type}
                  onChange={handleSelectChange}
                  label="Event Type"
                  required
                >
                  {eventTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="title"
                label="Event Title"
                fullWidth
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="description"
                label="Description"
                fullWidth
                multiline
                minRows={3}
                value={formData.description}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <FormControlLabel
                control={
                  <Switch
                    checked={formData.date.isRange}
                    onChange={handleRangeToggle}
                    color="primary"
                  />
                }
                label="Date Range"
              />
            </Grid>
            
            <Grid item xs={12} sm={formData.date.isRange ? 6 : 12}>
              <DatePicker
                label={formData.date.isRange ? "Start Date" : "Date"}
                value={formData.date.start}
                onChange={(date) => handleDateChange(date, "start")}
                slotProps={{
                  textField: {
                    fullWidth: true,
                    variant: "outlined"
                  }
                }}
              />
            </Grid>
            
            {formData.date.isRange && (
              <Grid item xs={12} sm={6}>
                <DatePicker
                  label="End Date"
                  value={formData.date.end}
                  onChange={(date) => handleDateChange(date, "end")}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      variant: "outlined"
                    }
                  }}
                />
              </Grid>
            )}
            
            <Grid item xs={12}>
              <TextField
                name="place"
                label="Location"
                fullWidth
                value={formData.location.place}
                onChange={handleLocationChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="latitude"
                label="Latitude (optional)"
                fullWidth
                type="number"
                inputProps={{ step: 'any' }}
                value={formData.location.coordinates.latitude === null ? '' : formData.location.coordinates.latitude}
                onChange={handleCoordinateChange}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                name="longitude"
                label="Longitude (optional)"
                fullWidth
                type="number"
                inputProps={{ step: 'any' }}
                value={formData.location.coordinates.longitude === null ? '' : formData.location.coordinates.longitude}
                onChange={handleCoordinateChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes"
                fullWidth
                multiline
                minRows={3}
                value={formData.notes}
                onChange={handleInputChange}
              />
            </Grid>
            
            <Grid item xs={12}>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                sx={{ mr: 2 }}
              >
                {loading ? 'Saving...' : (eventId ? 'Update Event' : 'Save Event')}
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleCancelClick}
                disabled={loading}
              >
                Cancel
              </Button>
            </Grid>
          </Grid>
        </form>
      )}
      
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(false)}
      >
        <Alert onClose={() => setSuccess(false)} severity="success">
          Event successfully {eventId ? 'updated' : 'saved'}!
        </Alert>
      </Snackbar>
    </Paper>
  );
};

export default EventEditor;