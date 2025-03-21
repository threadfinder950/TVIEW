// src/App.tsx
import { useState, useEffect } from 'react';
import { 
  BrowserRouter as Router, 
  Routes, 
  Route, 
  Link,
  useParams 
} from 'react-router-dom';
import { 
  AppBar,
  Box,
  Chip, 
  Toolbar, 
  Typography, 
  Container, 
  CssBaseline, 
  Drawer, 
  List, 
  ListItem, 
  ListItemIcon, 
  ListItemText, 
  ListItemButton,
  Divider, 
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
  Settings as SettingsIcon,
  CloudDownload as ExportIcon
} from '@mui/icons-material';
import axios from 'axios';

import GedcomImport from './components/gedcom/GedcomImport';
import PersonTimeline from './components/timeline/PersonTimeline';
import EventsPage from './components/events/EventsPage';
import ExportData from './components/export/ExportData';
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
const PersonDetails = () => {
  const { id } = useParams<{ id: string }>();
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

// People List Component
// People List Component - Enhanced version
const PeopleList = () => {
  const [people, setPeople] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await axios.get(API.persons.getAll);
        setPeople(response.data);
      } catch (error) {
        console.error('Error fetching people:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchPeople();
  }, []);
  
  if (loading) return <CircularProgress />;
  
  return (
    <div>
      <Typography variant="h4" gutterBottom>
        People
      </Typography>
      
      {people.length === 0 ? (
        <Typography>
          No people found. Try importing a GEDCOM file first.
        </Typography>
      ) : (
        <List>
          {people.map((person) => {
            const name = person.names && person.names.length > 0
              ? `${person.names[0].given} ${person.names[0].surname}`
              : 'Unknown Name';
              
            const gender = person.gender ? 
              person.gender === 'M' ? 'Male' : 
              person.gender === 'F' ? 'Female' : 
              person.gender === 'O' ? 'Other' : 'Unknown' : 'Unknown';
            
            const birthInfo = person.birth ? 
              `${person.birth.date ? new Date(person.birth.date).toLocaleDateString() : 'Unknown date'}${person.birth.place ? ` at ${person.birth.place}` : ''}` : 
              'Birth information unknown';
            
            const deathInfo = person.death && (person.death.date || person.death.place) ? 
              `${person.death.date ? new Date(person.death.date).toLocaleDateString() : 'Unknown date'}${person.death.place ? ` at ${person.death.place}` : ''}` : 
              null;
            
            return (
              <ListItem 
                component={Link} 
                to={`/people/${person._id}`} 
                key={person._id}
                disablePadding
                sx={{ 
                  mb: 2, 
                  border: '1px solid rgba(0,0,0,0.12)', 
                  borderRadius: 1 
                }}
              >
                <ListItemButton>
                  <Box sx={{ width: '100%', p: 1 }}>
                    <Typography variant="h6">{name}</Typography>
                    <Box display="flex" flexDirection="row" gap={2} mt={1}>
                      <Chip 
                        label={gender} 
                        size="small" 
                        color={
                          person.gender === 'M' ? 'primary' : 
                          person.gender === 'F' ? 'secondary' : 
                          'default'
                        }
                      />
                      {person.sourceId && 
                        <Chip 
                          label={`ID: ${person.sourceId}`} 
                          size="small" 
                          variant="outlined" 
                        />
                      }
                    </Box>
                    <Typography variant="body2" sx={{ mt: 1 }}>
                      <strong>Born:</strong> {birthInfo}
                    </Typography>
                    {deathInfo && (
                      <Typography variant="body2">
                        <strong>Died:</strong> {deathInfo}
                      </Typography>
                    )}
                    {person.notes && (
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          mt: 1, 
                          color: 'text.secondary',
                          maxHeight: '3em',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }}
                      >
                        <strong>Notes:</strong> {person.notes}
                      </Typography>
                    )}
                  </Box>
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      )}
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
            </List>

            <Divider />
            
<List>
  <ListItem component={Link} to="/settings" disablePadding>
    <ListItemButton>
      <ListItemIcon><SettingsIcon /></ListItemIcon>
      <ListItemText primary="Settings" />
    </ListItemButton>
  </ListItem>
  
  {/* Add this new item */}
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
                <Route path="/people/:id" element={<PersonDetails />} />
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