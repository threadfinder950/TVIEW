// src/App.tsx
import { useState, useEffect } from 'react';

import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link,
  useParams,
  useNavigate // Add this import
} from 'react-router-dom';

import { 
  AppBar,
  Button,
  Box,
  Toolbar, 
  Typography, 
  Container, 
  CssBaseline, 
  Drawer,
  Divider,
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  ListItemButton,
  Paper,
  createTheme,
  ThemeProvider,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Dashboard as DashboardIcon, 
  People as PeopleIcon, 
  Event as EventIcon, 
  CloudUpload as UploadIcon,
  Edit as EditIcon,
  Settings as SettingsIcon,
  CloudDownload as ExportIcon
} from '@mui/icons-material';
import axios from 'axios';

import GedcomImport from './components/gedcom/GedcomImport';
import PersonTimeline from './components/timeline/PersonTimeline';
import PeopleList from './components/people/PeopleList'; // Import the new PeopleList component
import EventsPage from './components/events/EventsPage';
import ExportData from './components/export/ExportData';
import PersonEdit from './components/people/PersonEdit'; // Ensure the file exists at this path or update the path accordingly
import FamilyView from './components/family/FamilyView'; // Import the FamilyView component
import { API } from './config/api';
import DatabaseManager from './components/admin/DatabaseManager';

const theme = createTheme({
  palette: {
    primary: {
      main: '#3f51b5',
    },
    secondary: {
      main: '#f50057', 
    },
  },
});

// Person Details Component
// In App.tsx - update the component name
const PersonOverview = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [person, setPerson] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    const fetchPerson = async () => {
      try {
        setLoading(true);
        const response = await axios.get(API.persons.getById(id!));
        setPerson(response.data);
      } catch (err) {
        setError('Failed to fetch person details');
      } finally {
        setLoading(false);
      }
    };
    
    if (id) {
      fetchPerson();
    }
  }, [id]);
  
  const handleViewFamily = () => {
    navigate(`/family/${id}`);
  };
  
  const handleEditPerson = () => {
    navigate(`/people/${id}/edit`);
  };
  
  if (loading) return <CircularProgress />;
  if (error) return <Alert severity="error">{error}</Alert>;
  if (!person) return <Typography>Person not found</Typography>;
  
  // Get the current/primary name
  const currentName = person.names && person.names.length > 0 
    ? `${person.names[0].given} ${person.names[0].surname}` 
    : 'Unknown Person';
  
  return (
    <div>
      <Typography variant="h4" gutterBottom>
        {currentName}
      </Typography>
      
      {/* Navigation controls at the top level */}
      <Paper elevation={2} sx={{ p: 1, mb: 3 }}>
        <Box display="flex" justifyContent="center" gap={2}>
          <Button
            variant="outlined"
            startIcon={<PeopleIcon />}
            onClick={handleViewFamily}
            aria-label="View Family Members"
          >
            Family Members
          </Button>
          <Button
            variant="outlined"
            startIcon={<EditIcon />}
            onClick={handleEditPerson}
            aria-label="Edit Person Details"
          >
            Edit Person
          </Button>
        </Box>
      </Paper>
      
      <Box sx={{ mb: 4 }}>
        <Typography variant="h6">Personal Timeline</Typography>
        <PersonTimeline personId={id || ''} personName={currentName} />
      </Box>
    </div>
  );
};
// Dashboard Component
const Dashboard = () => {
  return (
    <div>
      <Typography variant="h4" gutterBottom>
        Dashboard
      </Typography>
      <Typography paragraph>
        Welcome to the Time Tunnel Machine GEDCOM Manager. This application allows you to:
      </Typography>
      <ul>
        <li>Import genealogical data from GEDCOM files</li>
        <li>Manage people and their relationships</li>
        <li>Add custom life events and personal history</li>
        <li>Prepare data for your Time Tunnel VR experience</li>
      </ul>
      <Typography paragraph>
        Start by importing a GEDCOM file or adding personal events for people already in the system.
      </Typography>
    </div>
  );
};

// Settings Placeholder
const SettingsPage = () => {
  return (
    <Typography variant="h4">Settings</Typography>
  );
};

// Main App Component
function App() {
  const drawerWidth = 240;
  
  return (
    <ThemeProvider theme={theme}>
      <Router>
        <Box sx={{ display: 'flex' }}>
          <CssBaseline />
          
          <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
            <Toolbar>
              <Typography variant="h6" noWrap component="div">
                Time Tunnel GEDCOM Manager
              </Typography>
            </Toolbar>
          </AppBar>
          
          <Drawer
            variant="permanent"
            sx={{
              width: drawerWidth,
              flexShrink: 0,
              [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: 'border-box', paddingTop: '64px' },
            }}
          >
            <List>
              <ListItem component={Link} to="/" disablePadding>
                <ListItemButton>
                  <ListItemIcon><DashboardIcon /></ListItemIcon>
                  <ListItemText primary="Dashboard" />
                </ListItemButton>
              </ListItem>
              
              <ListItem component={Link} to="/import" disablePadding>
                <ListItemButton>
                  <ListItemIcon><UploadIcon /></ListItemIcon>
                  <ListItemText primary="Import GEDCOM" />
                </ListItemButton>
              </ListItem>
              
              <ListItem component={Link} to="/people" disablePadding>
                <ListItemButton>
                  <ListItemIcon><PeopleIcon /></ListItemIcon>
                  <ListItemText primary="People" />
                </ListItemButton>
              </ListItem>
              
               <ListItem component={Link} to="/events" disablePadding>
                <ListItemButton>
                  <ListItemIcon><EventIcon /></ListItemIcon>
                  <ListItemText primary="Events" />
                </ListItemButton>
              </ListItem>
              
              <ListItem component={Link} to="/export" disablePadding>
                <ListItemButton>
                  <ListItemIcon><ExportIcon /></ListItemIcon>
                  <ListItemText primary="Export for VR" />
                </ListItemButton>
              </ListItem>
            </List>
            
            <Divider />
            
            <List>
              <ListItem component={Link} to="/settings" disablePadding>
                <ListItemButton>
                  <ListItemIcon><SettingsIcon /></ListItemIcon>
                  <ListItemText primary="Settings" />
                </ListItemButton>
              </ListItem>
              
              <ListItem component={Link} to="/admin/database" disablePadding>
                <ListItemButton>
                  <ListItemIcon><SettingsIcon /></ListItemIcon>
                  <ListItemText primary="Database Management" />
                </ListItemButton>
              </ListItem>
            </List>
          </Drawer>
          
          <Box
            component="main" 
            sx={{
              flexGrow: 1,
              p: 3,
              mt: '64px',
            }}
          >
            <Container maxWidth="lg">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/import" element={<GedcomImport />} />
                <Route path="/people" element={<PeopleList />} />
                <Route path="/people/:id" element={<PersonOverview />} />
                <Route path="/people/:id/edit" element={<PersonEdit />} />
                <Route path="/family/:id" element={<FamilyView />} /> 
                <Route path="/events" element={<EventsPage />} />
                <Route path="/export" element={<ExportData />} />
                <Route path="/admin/database" element={<DatabaseManager />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Routes>
            </Container>
          </Box>
        </Box>
      </Router>
    </ThemeProvider>
  );
}

export default App;