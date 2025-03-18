import React, { useState, useEffect } from 'react';
import {
  Button,
  Typography,
  Paper,
  Grid,
  CircularProgress,
  Box,
  Card,
  CardContent,
  CardActions,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Alert
} from '@mui/material';
import {
  CloudDownload as DownloadIcon,
  Person as PersonIcon,
  People as PeopleIcon
} from '@mui/icons-material';
import axios from 'axios';

interface Person {
  _id: string;
  names: Array<{
    given: string;
    surname: string;
  }>;
}

const ExportData: React.FC = () => {
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [exportInProgress, setExportInProgress] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [openDialog, setOpenDialog] = useState<boolean>(false);
  
  useEffect(() => {
    // Fetch people for individual export
    const fetchPeople = async () => {
      try {
        setLoading(true);
        const response = await axios.get('http://localhost:5000/api/persons');
        setPeople(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch people.');
        setLoading(false);
      }
    };
    
    fetchPeople();
  }, []);
  
  const handleExportAll = async () => {
    try {
      setExportInProgress(true);
      setError(null);
      
      // Use axios to download the file
      const response = await axios({
        url: 'http://localhost:5000/api/export/all',
        method: 'GET',
        responseType: 'blob',
      });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      
      // Get filename from content-disposition header or use default
      const contentDisposition = response.headers['content-disposition'];
      let filename = 'timetunnel_export.zip';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch && filenameMatch.length === 2) {
          filename = filenameMatch[1];
        }
      }
      
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      setExportInProgress(false);
    } catch (err) {
      setError('Export failed. Please try again.');
      setExportInProgress(false);
    }
  };
  
  const handleExportPerson = async (person: Person) => {
    try {
      setExportInProgress(true);
      setError(null);
      setOpenDialog(false);
      
      // Use axios to download the file
      const response = await axios({
        url: `http://localhost:5000/api/export/person/${person._id}`,
        method: 'GET',
        responseType: 'blob',
      });
      
      // Create a URL for the blob
      const url = window.URL.createObjectURL(new Blob([response.data]));
      
      // Create a temporary link and trigger download
      const link = document.createElement('a');
      link.href = url;
      
      // Get name for the filename
      const personName = person.names && person.names.length > 0
        ? `${person.names[0].given}_${person.names[0].surname}`
        : person._id;
      
      link.setAttribute('download', `${personName}_export.zip`);
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      setExportInProgress(false);
    } catch (err) {
      setError(`Export failed for ${getPersonName(person)}. Please try again.`);
      setExportInProgress(false);
    }
  };
  
  const openExportDialog = (person: Person) => {
    setSelectedPerson(person);
    setOpenDialog(true);
  };
  
  const closeExportDialog = () => {
    setOpenDialog(false);
  };
  
  const getPersonName = (person: Person): string => {
    return person.names && person.names.length > 0
      ? `${person.names[0].given} ${person.names[0].surname}`
      : 'Unknown Person';
  };
  
  return (
    <div>
      <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
        <Typography variant="h5" gutterBottom>
          Export Data for Time Tunnel VR
        </Typography>
        <Typography paragraph>
          Export your genealogical data and personal history for use in the Time Tunnel Machine VR application.
          You can export all data or select specific individuals to export.
        </Typography>
        
        {error && (
          <Box mt={2} mb={2} p={2} sx={{ bgcolor: 'error.light', borderRadius: 1 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        )}
        
        <Box mt={3}>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExportAll}
            disabled={exportInProgress}
            sx={{ mr: 2 }}
          >
            {exportInProgress ? <CircularProgress size={24} /> : 'Export All Data'}
          </Button>
        </Box>
      </Paper>
      
      <Card variant="outlined">
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item>
              <PersonIcon />
            </Grid>
            <Grid item xs>
              <Typography variant="h6">Export Individual Person</Typography>
            </Grid>
          </Grid>
          
          <Divider sx={{ my: 2 }} />
          
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : people.length === 0 ? (
            <Typography>No people found. Please import data first.</Typography>
          ) : (
            <List>
              {people.map((person) => (
                <ListItem key={person._id}>
                  <ListItemText primary={getPersonName(person)} />
                  <ListItemSecondaryAction>
                    <IconButton 
                      edge="end" 
                      aria-label="export" 
                      onClick={() => openExportDialog(person)}
                      disabled={exportInProgress}
                    >
                      <DownloadIcon />
                    </IconButton>
                  </ListItemSecondaryAction>
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>
      
      {/* Confirmation Dialog */}
      <Dialog
        open={openDialog}
        onClose={closeExportDialog}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Export Person
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to export {selectedPerson ? getPersonName(selectedPerson) : ''} and all their related data?
            This will include all events, relationships, and media associated with this person.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeExportDialog} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={() => selectedPerson && handleExportPerson(selectedPerson)} 
            color="primary" 
            autoFocus
            variant="contained"
          >
            Export
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ExportData;