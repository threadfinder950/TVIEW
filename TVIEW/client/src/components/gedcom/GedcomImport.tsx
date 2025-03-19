// src/components/gedcom/GedcomImport.tsx
import React, { useState } from 'react';
import { 
  Button, 
  Typography, 
  Paper, 
  LinearProgress, 
  Box, 
  Container,
  Card,
  CardContent,
  CardActions,
  Divider,
  List,
  ListItem,
  ListItemText,
  Chip,
  Alert
} from '@mui/material';
import axios from 'axios';
import { API } from '../../config/api';

const GedcomImport: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [importStats, setImportStats] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      // Check if the file is a GEDCOM file
      if (file.name.toLowerCase().endsWith('.ged')) {
        setSelectedFile(file);
        setError(null);
      } else {
        setSelectedFile(null);
        setError('Please select a valid GEDCOM (.ged) file.');
      }
    }
  };
  
  const handleUpload = async () => {
    if (!selectedFile) {
      setError('Please select a file first.');
      return;
    }
    
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    
    const formData = new FormData();
    formData.append('gedcomFile', selectedFile);
    
    try {
      const response = await axios.post(API.gedcom.upload, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / (progressEvent.total || 1));
          setUploadProgress(progress);
        }
      });
      
      setImportStats(response.data.stats);
    } catch (err) {
      let errorMessage = 'An error occurred during file upload.';
      if (axios.isAxiosError(err) && err.response) {
        errorMessage = err.response.data.message || errorMessage;
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      setError(errorMessage);
    } finally {
      setIsUploading(false);
      setSelectedFile(null);
      // Reset the file input
      const fileInput = document.getElementById('gedcom-file-input') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    }
  };
  
  return (
    <Container maxWidth="md">
      <Paper elevation={3} sx={{ p: 4, mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Import GEDCOM Data
        </Typography>
        <Typography variant="body1" paragraph>
          Upload a GEDCOM file to import your genealogical data into the Time Tunnel application.
        </Typography>
        
        <Divider sx={{ my: 2 }} />
        
        <Box mt={3}>
          <input
            id="gedcom-file-input"
            type="file"
            accept=".ged"
            style={{ display: 'none' }}
            onChange={handleFileChange}
          />
          <label htmlFor="gedcom-file-input">
            <Button
              variant="contained"
              color="primary"
              component="span"
              disabled={isUploading}
            >
              Select GEDCOM File
            </Button>
          </label>
          
          {selectedFile && (
            <Box mt={2}>
              <Typography variant="body2">
                Selected file: <strong>{selectedFile.name}</strong> ({(selectedFile.size / 1024).toFixed(2)} KB)
              </Typography>
            </Box>
          )}
          
          {error && (
            <Box mt={2}>
              <Alert severity="error">{error}</Alert>
            </Box>
          )}
          
          <Box mt={3}>
            <Button
              variant="contained"
              color="secondary"
              disabled={!selectedFile || isUploading}
              onClick={handleUpload}
            >
              Upload and Import
            </Button>
          </Box>
          
          {isUploading && (
            <Box mt={2}>
              <Typography variant="body2" gutterBottom>
                Uploading... {uploadProgress}%
              </Typography>
              <LinearProgress 
                variant="determinate" 
                value={uploadProgress} 
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Box>
          )}
        </Box>
        
        {importStats && (
          <Card variant="outlined" sx={{ mt: 4 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Import Results
              </Typography>
              
              <List dense>
                <ListItem>
                  <ListItemText 
                    primary="Individuals Imported" 
                    secondary={importStats.individuals} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Families Processed" 
                    secondary={importStats.families} 
                  />
                </ListItem>
                <ListItem>
                  <ListItemText 
                    primary="Events Created" 
                    secondary={importStats.events} 
                  />
                </ListItem>
              </List>
              
              {importStats.errors && importStats.errors.length > 0 && (
                <>
                  <Typography variant="subtitle2" sx={{ mt: 2, color: 'error.main' }}>
                    Errors:
                  </Typography>
                  <List dense>
                    {importStats.errors.slice(0, 5).map((error: string, index: number) => (
                      <ListItem key={index}>
                        <ListItemText secondary={error} />
                      </ListItem>
                    ))}
                    {importStats.errors.length > 5 && (
                      <ListItem>
                        <Chip 
                          label={`${importStats.errors.length - 5} more errors`} 
                          size="small" 
                          color="secondary"
                        />
                      </ListItem>
                    )}
                  </List>
                </>
              )}
            </CardContent>
            <CardActions>
              <Button 
                size="small" 
                color="primary"
                onClick={() => setImportStats(null)}
              >
                Close
              </Button>
            </CardActions>
          </Card>
        )}
      </Paper>
    </Container>
  );
};

export default GedcomImport;