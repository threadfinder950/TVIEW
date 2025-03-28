// src/components/people/PersonDetails.tsx
import { useState, useEffect } from 'react';
import { 
  Typography, 
  Paper, 
  Box, 
  Grid, 
  Button, 
  Divider, 
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Avatar
} from '@mui/material';
import {
  Event as EventIcon,
  Person as PersonIcon,
  FamilyRestroom as FamilyIcon,
  Edit as EditIcon,
  LocationOn as LocationIcon,
  Cake as BirthIcon,
  SentimentVeryDissatisfied as DeathIcon
} from '@mui/icons-material';
import { Link, useParams } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../config/api';
import PersonTimeline from '../timeline/PersonTimeline';

function PersonDetails() {
  const { id } = useParams<{ id: string }>();
  const [person, setPerson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'details' | 'timeline' | 'events'>('details');
  
  useEffect(() => {
    const fetchPerson = async () => {
      try {
        setLoading(true);
        setError(null);
        
        if (id) {
          const response = await axios.get(API.persons.getById(id));
          setPerson(response.data);
        }
      } catch (err) {
        console.error('Error fetching person:', err);
        setError('Failed to load person details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchPerson();
  }, [id]);
  
  // Helper function to format person's name
  const getPersonName = () => {
    if (!person?.names || person.names.length === 0) {
      return 'Unknown Person';
    }
    return `${person.names[0].given} ${person.names[0].surname}`;
  };
  
  // Format date for display
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Unknown';
    try {
      const date = new Date(dateStr);
      return isNaN(date.getTime()) ? 'Invalid date' : date.toLocaleDateString();
    } catch (error) {
      return 'Invalid date';
    }
  };
  
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Alert severity="error" sx={{ mt: 2 }}>
        {error}
      </Alert>
    );
  }
  
  if (!person) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Person not found
      </Alert>
    );
  }
  
  return (
    <div>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Typography variant="h4" gutterBottom>
              {getPersonName()}
            </Typography>
            <Box display="flex" gap={1} mb={2}>
              {person.gender && (
                <Chip 
                  label={
                    person.gender === 'M' ? 'Male' : 
                    person.gender === 'F' ? 'Female' : 
                    person.gender === 'O' ? 'Other' : 'Unknown'
                  }
                  color={
                    person.gender === 'M' ? 'primary' : 
                    person.gender === 'F' ? 'secondary' : 
                    'default'
                  }
                  size="small"
                />
              )}
              {person.sourceId && (
                <Chip 
                  label={`ID: ${person.sourceId}`}
                  variant="outlined"
                  size="small"
                />
              )}
            </Box>
          </Grid>
          <Grid item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              startIcon={<EditIcon />}
              component={Link}
              to={`/people/edit/${id}`}
              sx={{ mr: 1 }}
            >
              Edit
            </Button>
            <Button 
              variant="outlined" 
              startIcon={<FamilyIcon />}
              component={Link}
              to={`/family/${id}`}
            >
              View Family
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Box mb={3}>
        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 2 }}
        >
          <Tab label="Details" value="details" />
          <Tab label="Timeline" value="timeline" />
          <Tab label="Events" value="events" />
        </Tabs>
      </Box>
      
      {activeTab === 'details' && (
        <Paper elevation={1} sx={{ p: 3 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                <Box display="flex" alignItems="center">
                  <PersonIcon sx={{ mr: 1 }} />
                  Personal Information
                </Box>
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List disablePadding>
                <ListItem>
                  <ListItemText 
                    primary="Full Name" 
                    secondary={getPersonName()}
                  />
                </ListItem>
                
                <ListItem>
                  <ListItemText 
                    primary="Gender" 
                    secondary={
                      person.gender === 'M' ? 'Male' : 
                      person.gender === 'F' ? 'Female' : 
                      person.gender === 'O' ? 'Other' : 'Unknown'
                    }
                  />
                </ListItem>
                
                {person.sourceId && (
                  <ListItem>
                    <ListItemText 
                      primary="Source ID" 
                      secondary={person.sourceId}
                    />
                  </ListItem>
                )}
              </List>
            </Grid>
            
            <Grid item xs={12} md={6}>
              <Typography variant="h6" gutterBottom>
                <Box display="flex" alignItems="center">
                  <EventIcon sx={{ mr: 1 }} />
                  Life Events
                </Box>
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <List disablePadding>
                {person.birth && (
                  <ListItem>
                    <BirthIcon sx={{ mr: 2 }} color="primary" />
                    <ListItemText 
                      primary="Birth" 
                      secondary={
                        <>
                          <Box>Date: {formatDate(person.birth.date)}</Box>
                          {person.birth.place && <Box>Place: {person.birth.place}</Box>}
                        </>
                      }
                    />
                  </ListItem>
                )}
                
                {person.death && (
                  <ListItem>
                    <DeathIcon sx={{ mr: 2 }} color="error" />
                    <ListItemText 
                      primary="Death" 
                      secondary={
                        <>
                          <Box>Date: {formatDate(person.death.date)}</Box>
                          {person.death.place && <Box>Place: {person.death.place}</Box>}
                        </>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </Grid>
            
            {person.notes && (
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>Notes</Typography>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="body1">{person.notes}</Typography>
              </Grid>
            )}
          </Grid>
        </Paper>
      )}
      
      {activeTab === 'timeline' && (
        <Paper elevation={1} sx={{ p: 3 }}>
          <PersonTimeline personId={id || ''} personName={getPersonName()} />
        </Paper>
      )}
      
      {activeTab === 'events' && (
        <Paper elevation={1} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Events</Typography>
          <Divider sx={{ mb: 2 }} />
          
          {/* Event list would go here */}
          <Typography variant="body1">
            This would display a detailed list of all events associated with this person.
          </Typography>
        </Paper>
      )}
    </div>
  );
}

export default PersonDetails;