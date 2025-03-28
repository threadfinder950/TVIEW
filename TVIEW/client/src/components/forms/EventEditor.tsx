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
import { EventType } from '../events/EventsPage.types';

// Form data interface
interface EventFormData {
  type: EventType;
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

// Component props
interface EventEditorProps {
  personId?: string; // Optional - if provided, will add this person automatically
  eventId?: string; // Optional - for editing existing events
  onSave?: () => void;
  onCancel?: () => void;
  onClose?: () => void; // Added for better compatibility
}

// All available event types
const eventTypes: EventType[] = [
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
];

// Initial form data
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

const EventEditor: React.FC<EventEditorProps> = ({ personId, eventId, onSave, onCancel, onClose }) => {
  console.log('==========================================');
  console.log('EVENTEDITIOR COMPONENT RENDERED');
  console.log('eventId:', eventId);
  console.log('personId:', personId);
  console.log('==========================================');

  // State
  const [formData, setFormData] = useState<EventFormData & { selectedPersonIds: string[] }>({
    ...initialFormData,
    selectedPersonIds: personId ? [personId] : []
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [availablePeople, setAvailablePeople] = useState<any[]>([]);
  
  // Load event data and people
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log("Starting to load event data for ID:", eventId);
        setLoading(true);
        
        // Always fetch available people for multi-select
        console.log("Fetching people list...");
        const peopleResponse = await axios.get(API.persons.getAll);
        console.log("People data received:", peopleResponse.data.length, "people found");
        setAvailablePeople(peopleResponse.data);
        
        // Fetch event data if editing an existing event
        if (eventId) {
          try {
            console.log("Fetching event details for event ID:", eventId);
            console.log("API URL:", API.events.getById(eventId));
            
            const response = await axios.get(API.events.getById(eventId));
            console.log("Event data received:", response.data);
            
            // Convert string dates to Date objects if they're valid
            const eventData = {
              ...response.data,
              date: {
                ...response.data.date,
                start: response.data.date?.start && isValidDate(response.data.date.start) ? 
                  new Date(response.data.date.start) : null,
                end: response.data.date?.end && isValidDate(response.data.date.end) ? 
                  new Date(response.data.date.end) : null,
                isRange: response.data.date?.isRange || false
              },
              // Ensure these fields are defined
              description: response.data.description || '',
              notes: response.data.notes || '',
              location: response.data.location || { 
                place: '', 
                coordinates: { latitude: null, longitude: null } 
              }
            };
            
            // Handle the conversion of persons field
            const personsArray = Array.isArray(response.data.persons) 
              ? response.data.persons.map((p: any) => typeof p === 'object' ? p._id : p)
              : response.data.person  // Handle legacy data with single person
                ? [response.data.person]
                : [];
            
            console.log("Processed persons array:", personsArray);
            
            setFormData({
              ...eventData,
              selectedPersonIds: personsArray
            });
            
            console.log("Form data initialized with event values");
          } catch (fetchError) {
            console.error("Error fetching event:", fetchError);
            setError('Failed to fetch event details');
          }
        } else {
          console.log("Creating new event, form initialized with defaults");
        }
        
        setLoading(false);
      } catch (err) {
        console.error("General error in loadData:", err);
        if (axios.isAxiosError(err) && err.response) {
          setError(err.response.data.message || 'Failed to load data');
        } else if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unknown error occurred');
        }
        setLoading(false);
      }
    };
    
    loadData();
    
    return () => {
      console.log('==========================================');
      console.log('EVENTEDITIOR UNMOUNTING');
      console.log('==========================================');
    };
  }, [eventId, personId]);
  
  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`Input changed: ${name} = ${value}`);
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Handle select dropdown changes
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    console.log(`Select changed: ${name} = ${value}`);
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Handle multiple person selection
  const handlePersonSelectChange = (event: SelectChangeEvent<string[]>) => {
    const { value } = event.target;
    const personIds = typeof value === 'string' ? value.split(',') : value;
    console.log("Persons selection changed:", personIds);
    setFormData({
      ...formData,
      selectedPersonIds: personIds,
    });
  };
  
  // Handle date changes
  const handleDateChange = (date: Date | null, fieldName: string) => {
    console.log(`Date changed: ${fieldName} = ${date}`);
    
    // Remove time component from date
    let dateWithoutTime = null;
    if (date) {
      dateWithoutTime = new Date(date);
      dateWithoutTime.setHours(0, 0, 0, 0);
    }
    
    setFormData({
      ...formData,
      date: {
        ...formData.date,
        [fieldName]: dateWithoutTime,
      },
    });
  };
  
  // Handle location changes
  const handleLocationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    console.log(`Location changed: ${name} = ${value}`);
    setFormData({
      ...formData,
      location: {
        ...formData.location,
        [name]: value,
      },
    });
  };
  
  // Handle coordinate changes
  const handleCoordinateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numValue = value === '' ? null : parseFloat(value);
    console.log(`Coordinate changed: ${name} = ${numValue}`);
    
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
  
  // Handle date range toggle
  const handleRangeToggle = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { checked } = e.target;
    console.log(`Date range toggled: ${checked}`);
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
    console.log("Form submitted");
    
    try {
      setLoading(true);
      setError(null);
      
      // Validate that at least one person is selected
      if (formData.selectedPersonIds.length === 0) {
        console.error("No persons selected");
        setError('Please select at least one person for this event');
        setLoading(false);
        return;
      }
      
      // Prepare the event data with the persons array
      const { selectedPersonIds, ...eventDataWithoutSelected } = formData;
      const eventData = {
        ...eventDataWithoutSelected,
        persons: selectedPersonIds,
      };
      
      console.log("Prepared event data for submission:", eventData);
      
      if (eventId) {
        // Update existing event
        console.log("Updating existing event with ID:", eventId);
        await axios.patch(API.events.update(eventId), eventData);
        console.log("Event updated successfully");
      } else {
        // Create new event
        console.log("Creating new event");
        await axios.post(API.events.create, eventData);
        console.log("Event created successfully");
      }
      
      setSuccess(true);
      console.log("Success state set to true");
      setLoading(false);
      
      // Reset form after successful submit if creating a new event
      if (!eventId) {
        console.log("Resetting form for new event creation");
        setFormData({
          ...initialFormData,
          selectedPersonIds: personId ? [personId] : []
        });
      }
      
      // Call onSave callback if provided
      if (onSave) {
        console.log("Calling onSave callback");
        onSave();
      }
    } catch (err) {
      console.error("Error saving event:", err);
      let errorMessage = 'Failed to save event';
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data.message || errorMessage;
        console.error("API error response:", err.response.data);
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
      setLoading(false);
    }
  };
  
  // Cancel button handler
  const handleCancelClick = () => {
    console.log("Cancel button clicked");
    if (onCancel) {
      console.log("Calling onCancel callback");
      onCancel();
    }
    if (onClose) {
      console.log("Calling onClose callback");
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
  
  // Debug before render
  console.log("RENDER STATE:", { 
    loading, 
    error, 
    formData: { 
      ...formData, 
      date: {
        ...formData.date,
        start: formData.date?.start?.toString(),
        end: formData.date?.end?.toString()
      }
    }
  });
  
  return (
    <Paper elevation={3} sx={{ p: 4, mt: 2 }}>
     <Typography variant="h5" gutterBottom>
        {eventId ? 'Edit Event' : 'Add New Event'} {eventId ? `(ID: ${eventId})` : ''}
      </Typography>
      <Divider sx={{ mb: 3 }} />
      
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      
      {loading && !formData.title ? (
        <Box display="flex" flexDirection="column" alignItems="center" p={3}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 2 }}>
            Loading event data...
          </Typography>
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
                value={formData.description || ''}
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
                value={formData.location?.place || ''}
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
                value={formData.location?.coordinates?.latitude === null ? '' : formData.location?.coordinates?.latitude}
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
                value={formData.location?.coordinates?.longitude === null ? '' : formData.location?.coordinates?.longitude}
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
                value={formData.notes || ''}
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