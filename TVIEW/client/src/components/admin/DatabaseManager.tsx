// src/components/admin/DatabaseManager.tsx
import React, { useState } from 'react';
import { 
  Button, 
  Typography, 
  Paper, 
  Box, 
  Container,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Alert,
  CircularProgress
} from '@mui/material';
import axios from 'axios';
import { API } from '../../config/api';

const DatabaseManager: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedCollections, setSelectedCollections] = useState<{
    people: boolean;
    events: boolean;
    relationships: boolean;
    media: boolean;
  }>({
    people: true,
    events: true,
    relationships: true,
    media: true
  });

  const handleCollectionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedCollections({
      ...selectedCollections,
      [event.target.name]: event.target.checked
    });
  };

  const handleClearAll = async () => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await axios.post(API.db.clear);
      setResult(response.data.data);
    } catch (err) {
      let errorMessage = 'An error occurred while clearing the database.';
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSelected = async () => {
    // Get array of selected collections
    const collections = Object.entries(selectedCollections)
      .filter(([_, isSelected]) => isSelected)
      .map(([name]) => name);
    
    if (collections.length === 0) {
      setError('Please select at least one collection to clear.');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    setResult(null);
    
    try {
      const response = await axios.post(API.db.clear, { collections });
      setResult(response.data.data);
    } catch (err) {
      let errorMessage = 'An error occurred while clearing the selected collections.';
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom color="error">
          Database Management
        </Typography>
        
        <Typography variant="body1" paragraph>
          Warning: The actions on this page will permanently delete data from the database.
          This should only be used in development or when you want to start fresh.
        </Typography>
        
        <Box mt={4}>
          <Typography variant="h6" gutterBottom>
            Clear Specific Collections
          </Typography>
          
          <FormGroup>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={selectedCollections.people} 
                  onChange={handleCollectionChange} 
                  name="people" 
                />
              }
              label="People"
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={selectedCollections.events} 
                  onChange={handleCollectionChange} 
                  name="events" 
                />
              }
              label="Events"
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={selectedCollections.relationships} 
                  onChange={handleCollectionChange} 
                  name="relationships" 
                />
              }
              label="Relationships"
            />
            <FormControlLabel
              control={
                <Checkbox 
                  checked={selectedCollections.media} 
                  onChange={handleCollectionChange} 
                  name="media" 
                />
              }
              label="Media"
            />
          </FormGroup>
          
          <Box mt={2} display="flex" gap={2}>
            <Button
              variant="contained"
              color="warning"
              disabled={isLoading}
              onClick={handleClearSelected}
            >
              Clear Selected Collections
              {isLoading && <CircularProgress size={24} sx={{ ml: 1 }} />}
            </Button>
            
            <Button
              variant="contained"
              color="error"
              disabled={isLoading}
              onClick={handleClearAll}
            >
              Clear All Collections
              {isLoading && <CircularProgress size={24} sx={{ ml: 1 }} />}
            </Button>
          </Box>
        </Box>
        
        {error && (
          <Box mt={3}>
            <Alert severity="error">{error}</Alert>
          </Box>
        )}
        
        {result && (
          <Box mt={3}>
            <Alert severity="success">
              <Typography variant="subtitle1" gutterBottom>
                Database cleared successfully
              </Typography>
              <Typography variant="body2" component="pre" sx={{ whiteSpace: 'pre-wrap' }}>
                {JSON.stringify(result, null, 2)}
              </Typography>
            </Alert>
          </Box>
        )}
      </Paper>
    </Container>
  );
};

export default DatabaseManager;