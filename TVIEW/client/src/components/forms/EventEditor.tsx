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
  Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import axios from 'axios';

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
  personId: string;
  eventId?: string; // Optional - for editing existing events
  onSave?: () => void;
  onCancel?: () => void;
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
  'Custom'
];

const EventEditor: React.FC<EventEditorProps> = ({ personId, eventId, onSave, onCancel }) => {
  const [formData, setFormData] = useState<EventFormData>(initialFormData);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  
  // If eventId is provided, fetch the event data
  useEffect(() => {
    if (eventId) {
      const fetchEvent = async () => {
        try {
          setLoading(true);
          const response = await axios.get(`http://localhost:5000/api/events/${eventId}`);
          
          // Convert string dates to Date objects
          const eventData = {
            ...response.data,
            date: {
              ...response.data.date,
              start: response.data.date.start ? new Date(response.data.date.start) : null,
              end: response.data.date.end ? new Date(response.data.date.end) : null,
            }
          };
          
          setFormData(eventData);
          setLoading(false);
        } catch (err) {
          let errorMessage = 'Failed to fetch event data';
          if (axios.isAxiosError(err) && err.response) {
            errorMessage = err.response.data.message || errorMessage;
          } else if (err instanceof Error) {
            errorMessage = err.message;
          }
          setError(errorMessage);
          setLoading(false);
        }
      };
      
      fetchEvent();
    }
  }, [eventId]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleSelectChange = (e: SelectChangeEvent) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleDateChange = (date: Date | null, fieldName: string) => {
    setFormData({
      ...formData,
      date: {
        ...formData.date,
        [fieldName]: date,
      },
    });
  };
  
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      setError(null);
      
      // Add the person ID to the form data
      const eventData = {
        ...formData,
        person: personId,
      };
      
      let response;
      
      if (eventId) {
        // Update existing event
        response = await axios.patch(`http://localhost:5000/api/events/${eventId}`, eventData);
      } else {
        // Create new event
        response = await axios.post('http://localhost:5000/api/events', eventData);
      }
      
      setSuccess(true);
      setLoading(false);
      
      // Reset form after successful submit
      if (!eventId) {
        setFormData(initialFormData);
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
  };
  
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
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
        
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
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
      </Paper>
      
      <Snackbar 
        open={success} 
        autoHideDuration={6000} 
        onClose={() => setSuccess(false)}
      >
        <Alert onClose={() => setSuccess(false)} severity="success">
          Event successfully {eventId ? 'updated' : 'saved'}!
        </Alert>
      </Snackbar>
    </LocalizationProvider>
  );
};

export default EventEditor;