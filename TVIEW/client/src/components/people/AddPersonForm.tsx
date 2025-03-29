// src/components/person/AddPersonForm.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Typography, TextField, Button, Paper, FormControl,
  InputLabel, Select, MenuItem, Grid, Snackbar, Alert
} from '@mui/material';
import axios from 'axios';
import { API } from '../../config/api';

interface Person {
  _id: string;
  names?: { given: string; surname: string }[];
  relationships?: { type: string; person: string }[];
}

// This will need to be updated with your actual route structure
interface AddPersonFormProps {
  onCancel: () => void;
  onSuccess: () => void;
  selectedPersonId?: string; // Optional: The ID of the person to connect with
}

const AddPersonForm = ({ onCancel, onSuccess, selectedPersonId }: AddPersonFormProps) => {
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [relationshipType, setRelationshipType] = useState<string>('partner');
  const [category, setCategory] = useState<string>('immediate');
  const [personName, setPersonName] = useState<{ given: string, surname: string }>({ given: '', surname: '' });
  const [existingPersonId, setExistingPersonId] = useState<string>('');
  const [useExistingPerson, setUseExistingPerson] = useState<boolean>(false);
  const [notification, setNotification] = useState<{ open: boolean, message: string, severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await axios.get(API.persons.getAll);
        setAllPeople(response.data);
      } catch (err) {
        console.error('Error fetching people:', err);
      }
    };

    const fetchSelectedPerson = async () => {
      if (!selectedPersonId) return;
      
      try {
        const response = await axios.get(API.persons.getById(selectedPersonId));
        setSelectedPerson(response.data);
      } catch (err) {
        console.error('Error fetching selected person:', err);
      }
    };

    fetchPeople();
    fetchSelectedPerson();
  }, [selectedPersonId]);

  const handleSubmit = async () => {
    if (!selectedPersonId) {
      setNotification({
        open: true,
        message: 'No person selected to connect with',
        severity: 'error'
      });
      return;
    }

    try {
      let personIdToConnect: string;
      
      if (useExistingPerson) {
        // Use existing person
        if (!existingPersonId) {
          setNotification({
            open: true,
            message: 'Please select an existing person',
            severity: 'error'
          });
          return;
        }
        personIdToConnect = existingPersonId;
      } else {
        // Create new person
        if (!personName.given) {
          setNotification({
            open: true,
            message: 'Please enter at least a given name',
            severity: 'error'
          });
          return;
        }
        
        const newPersonData = {
          names: [{ given: personName.given, surname: personName.surname }],
          customCategory: category
        };
        
        const response = await axios.post(API.persons.create, newPersonData);
        personIdToConnect = response.data._id;
      }
      
      // Create the relationships - assuming your API has this structure
      // You may need to adjust based on your actual API structure
      const relationshipData = {
        person1Id: selectedPersonId,
        person2Id: personIdToConnect,
        type: relationshipType,
        category: category
      };
      
      // Use relationships endpoint instead of non-existent addRelationship endpoint
      await axios.post(API.persons.relationships(selectedPersonId), relationshipData);
      
      setNotification({
        open: true,
        message: 'Person successfully added',
        severity: 'success'
      });
      
      // Wait a moment to show success message before redirecting
      setTimeout(() => {
        onSuccess();
      }, 1500);
      
    } catch (err) {
      console.error('Error adding person:', err);
      setNotification({
        open: true,
        message: 'Failed to add person. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Box p={4} maxWidth={800} mx="auto">
      <Paper elevation={3} sx={{ p: 4 }}>
        <Typography variant="h4" gutterBottom>Add Important Person</Typography>
        
        {selectedPerson && (
          <Box mb={4}>
            <Typography variant="h6">
              Adding connection to: {selectedPerson.names?.[0]?.given} {selectedPerson.names?.[0]?.surname}
            </Typography>
          </Box>
        )}
        
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Relationship Type</InputLabel>
              <Select
                value={relationshipType}
                onChange={(e) => setRelationshipType(e.target.value as string)}
                label="Relationship Type"
              >
                <MenuItem value="partner">Partner (non-married)</MenuItem>
                <MenuItem value="friend">Close Friend</MenuItem>
                <MenuItem value="caretaker">Caretaker</MenuItem>
                <MenuItem value="godparent">Godparent</MenuItem>
                <MenuItem value="custom">Other Important Relationship</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={category}
                onChange={(e) => setCategory(e.target.value as string)}
                label="Category"
              >
                <MenuItem value="immediate">Immediate Family</MenuItem>
                <MenuItem value="extended">Extended Family</MenuItem>
                <MenuItem value="metaFamily">Meta-Family</MenuItem>
                <MenuItem value="custom">Other Important People</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <Box mb={2}>
              <Typography variant="h6">Person Details</Typography>
              <Button 
                variant="text" 
                onClick={() => setUseExistingPerson(!useExistingPerson)}
                sx={{ mb: 2 }}
              >
                {useExistingPerson ? 'Add New Person' : 'Use Existing Person'}
              </Button>
            </Box>
            
            {useExistingPerson ? (
              <FormControl fullWidth>
                <InputLabel>Select Existing Person</InputLabel>
                <Select
                  value={existingPersonId}
                  onChange={(e) => setExistingPersonId(e.target.value as string)}
                  label="Select Existing Person"
                >
                  {allPeople
                    .filter(p => p._id !== selectedPersonId) // Don't show the selected person
                    .map((p) => (
                      <MenuItem key={p._id} value={p._id}>
                        {p.names?.[0]?.given} {p.names?.[0]?.surname}
                      </MenuItem>
                    ))}
                </Select>
              </FormControl>
            ) : (
              <>
                <TextField
                  label="Given Name"
                  value={personName.given}
                  onChange={(e) => setPersonName({...personName, given: e.target.value})}
                  fullWidth
                  sx={{ mb: 2 }}
                />
                <TextField
                  label="Surname"
                  value={personName.surname}
                  onChange={(e) => setPersonName({...personName, surname: e.target.value})}
                  fullWidth
                />
              </>
            )}
          </Grid>
          
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2} mt={2}>
              <Button variant="outlined" onClick={onCancel}>
                Cancel
              </Button>
              <Button variant="contained" color="primary" onClick={handleSubmit}>
                Add Person
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
      
      <Snackbar 
        open={notification.open} 
        autoHideDuration={6000}
        onClose={handleCloseNotification}
      >
        <Alert 
          onClose={handleCloseNotification} 
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AddPersonForm;