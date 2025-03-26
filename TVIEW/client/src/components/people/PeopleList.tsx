// Enhanced PeopleList.tsx with matching style to EventsPage
import { useState, useEffect } from 'react';
import { 
  Typography, 
  List, 
  ListItem, 
  ListItemText, 
  Button,
  Dialog,
  DialogContent,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Chip,
  Grid,
  Paper,
  Tabs,
  Tab,
  Box,
  Avatar,
  ListItemAvatar,
  Divider,
  Card,
  CardContent,
  ListItemButton,
  InputAdornment
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Sort as SortIcon,
  Person as PersonIcon,
  Wc as GenderIcon,
  Cake as BirthIcon,
  SentimentVeryDissatisfied as DeathIcon,
  Groups as FamilyIcon,
  Edit as EditIcon,
  Timeline as TimelineIcon,
  Search as SearchIcon,
  List as ListIcon,
  ViewModule as GridIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../config/api';
import { format } from 'date-fns';

// Interface definitions
interface PersonName {
  given: string;
  surname: string;
  fromDate?: Date | string;
  toDate?: Date | string;
}

interface Person {
  _id: string;
  names: PersonName[];
  gender?: 'M' | 'F' | 'O' | 'U';
  birth?: {
    date?: Date | string;
    place?: string;
  };
  death?: {
    date?: Date | string;
    place?: string;
  };
  notes?: string;
  sourceId?: string;
}

const PeopleList = () => {
  const navigate = useNavigate();
  const [people, setPeople] = useState<Person[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [viewMode, setViewMode] = useState<string>('list'); // 'list', 'grid', or 'family'
  const [sortBy, setSortBy] = useState<string>('name');
  const [filterGender, setFilterGender] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showFilters, setShowFilters] = useState<boolean>(false);
  
  useEffect(() => {
    const fetchPeople = async () => {
      try {
        setLoading(true);
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
  
  // Get formatted name for a person
  const getPersonName = (person: Person): string => {
    return person.names && person.names.length > 0
      ? `${person.names[0].given} ${person.names[0].surname}`
      : 'Unknown Name';
  };
  
  // Get formatted date
  const formatDate = (dateString?: Date | string): string => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    return !isNaN(date.getTime()) ? format(date, 'MMM d, yyyy') : 'Unknown';
  };
  
  // Get birth info
  const getBirthInfo = (person: Person): string => {
    if (!person.birth) return 'Birth information unknown';
    
    let info = formatDate(person.birth.date);
    if (person.birth.place) {
      info += ` at ${person.birth.place}`;
    }
    return info;
  };
  
  // Get death info
  const getDeathInfo = (person: Person): string | null => {
    if (!person.death || (!person.death.date && !person.death.place)) {
      return null;
    }
    
    let info = formatDate(person.death.date);
    if (person.death.place) {
      info += ` at ${person.death.place}`;
    }
    return info;
  };
  
  // Get gender display
  const getGenderDisplay = (gender?: string): string => {
    switch(gender) {
      case 'M': return 'Male';
      case 'F': return 'Female';
      case 'O': return 'Other';
      default: return 'Unknown';
    }
  };
  
  // Get gender chip color
  const getGenderColor = (gender?: string) => {
    switch(gender) {
      case 'M': return 'primary';
      case 'F': return 'secondary';
      case 'O': return 'success';
      default: return 'default';
    }
  };
  
  // Navigate to person details
  const handleViewPerson = (personId: string) => {
    navigate(`/people/${personId}`);
  };
  
  // Apply filters and sorting
  const filteredAndSortedPeople = [...people]
    .filter(person => {
      // Apply gender filter
      if (filterGender !== 'all' && person.gender !== filterGender) {
        return false;
      }
      
      // Apply search query
      if (searchQuery) {
        const name = getPersonName(person).toLowerCase();
        const query = searchQuery.toLowerCase();
        if (!name.includes(query)) {
          return false;
        }
      }
      
      return true;
    })
    .sort((a, b) => {
      switch(sortBy) {
        case 'name':
          return getPersonName(a).localeCompare(getPersonName(b));
        case 'birthDate':
          const dateA = a.birth?.date ? new Date(a.birth.date).getTime() : 0;
          const dateB = b.birth?.date ? new Date(b.birth.date).getTime() : 0;
          return dateA - dateB;
        default:
          return 0;
      }
    });

  return (
    <div>
      <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center" justifyContent="space-between">
          <Grid item>
            <Typography variant="h4">
              People Management
            </Typography>
          </Grid>
          <Grid item>
            <Button 
              variant="contained" 
              color="primary" 
              component={Link}
              to="/people/new"
              startIcon={<AddIcon />}
            >
              Add New Person
            </Button>
          </Grid>
        </Grid>
        
        <Box mt={3}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                placeholder="Search by name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                variant="outlined"
                size="small"
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box display="flex" justifyContent="flex-end">
                <Tabs value={viewMode} onChange={(e, newValue) => setViewMode(newValue)} sx={{ mr: 2 }}>
                  <Tab icon={<ListIcon />} value="list" />
                  <Tab icon={<GridIcon />} value="grid" />
                  <Tab icon={<FamilyIcon />} value="family" />
                </Tabs>
                <IconButton onClick={() => setShowFilters(!showFilters)}>
                  <FilterIcon />
                </IconButton>
                <IconButton>
                  <SortIcon onClick={() => setSortBy(sortBy === 'name' ? 'birthDate' : 'name')} />
                </IconButton>
              </Box>
            </Grid>
          </Grid>
        </Box>
        
        {showFilters && (
          <Box mt={2} p={2} bgcolor="background.paper" borderRadius={1}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sort By</InputLabel>
                  <Select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    label="Sort By"
                  >
                    <MenuItem value="name">Name (A-Z)</MenuItem>
                    <MenuItem value="birthDate">Birth Date (Oldest First)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth size="small">
                  <InputLabel>Gender</InputLabel>
                  <Select
                    value={filterGender}
                    onChange={(e) => setFilterGender(e.target.value)}
                    label="Gender"
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="M">Male</MenuItem>
                    <MenuItem value="F">Female</MenuItem>
                    <MenuItem value="O">Other</MenuItem>
                    <MenuItem value="U">Unknown</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
      
      {loading ? (
        <Typography>Loading people...</Typography>
      ) : filteredAndSortedPeople.length === 0 ? (
        <Paper elevation={2} sx={{ p: 3, textAlign: 'center' }}>
          <Typography>
            No people found. Try importing a GEDCOM file first or adjusting your search filters.
          </Typography>
        </Paper>
      ) : viewMode === 'list' ? (
        <Paper elevation={2}>
          <List>
            {filteredAndSortedPeople.map((person) => (
              <ListItem 
                key={person._id}
                divider
                disablePadding
              >
                <ListItemButton onClick={() => handleViewPerson(person._id)}>
                  <ListItemAvatar>
                    <Avatar>
                      <PersonIcon />
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center" gap={1}>
                        <Typography variant="h6">{getPersonName(person)}</Typography>
                        <Chip 
                          label={getGenderDisplay(person.gender)} 
                          size="small" 
                          color={getGenderColor(person.gender)} 
                        />
                        {person.sourceId && 
                          <Chip 
                            label={`ID: ${person.sourceId}`} 
                            size="small" 
                            variant="outlined" 
                          />
                        }
                      </Box>
                    }
                    secondary={
                      <Box mt={1}>
                        <Grid container spacing={2}>
                          <Grid item xs={12} md={6}>
                            <Box display="flex" alignItems="center" gap={1}>
                              <BirthIcon fontSize="small" color="primary" />
                              <Typography variant="body2">
                                <strong>Born:</strong> {getBirthInfo(person)}
                              </Typography>
                            </Box>
                          </Grid>
                          {getDeathInfo(person) && (
                            <Grid item xs={12} md={6}>
                              <Box display="flex" alignItems="center" gap={1}>
                                <DeathIcon fontSize="small" color="error" />
                                <Typography variant="body2">
                                  <strong>Died:</strong> {getDeathInfo(person)}
                                </Typography>
                              </Box>
                            </Grid>
                          )}
                          {person.notes && (
                            <Grid item xs={12}>
                              <Typography 
                                variant="body2" 
                                color="text.secondary"
                                sx={{
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                <strong>Notes:</strong> {person.notes}
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Box>
                    }
                  />
                  <IconButton 
                    edge="end" 
                    aria-label="view timeline" 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/people/${person._id}`);
                    }}
                    sx={{ mr: 1 }}
                  >
                    <TimelineIcon color="primary" />
                  </IconButton>
                  <IconButton 
                    edge="end" 
                    aria-label="edit" 
                    onClick={(e) => {
                      e.stopPropagation();
                      navigate(`/people/${person._id}/edit`);
                    }}
                    sx={{ mr: 1 }}
                  >
                    <EditIcon />
                  </IconButton>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      ) : viewMode === 'grid' ? (
        <Grid container spacing={2}>
          {filteredAndSortedPeople.map((person) => (
            <Grid item xs={12} sm={6} md={4} key={person._id}>
              <Card 
                sx={{ 
                  cursor: 'pointer',
                  transition: 'transform 0.2s',
                  '&:hover': {
                    transform: 'scale(1.02)',
                    boxShadow: 3
                  }
                }}
                onClick={() => handleViewPerson(person._id)}
              >
                <CardContent>
                  <Box display="flex" alignItems="center" gap={2} mb={2}>
                    <Avatar sx={{ width: 56, height: 56 }}>
                      <PersonIcon />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">{getPersonName(person)}</Typography>
                      <Chip 
                        label={getGenderDisplay(person.gender)} 
                        size="small" 
                        color={getGenderColor(person.gender)} 
                      />
                    </Box>
                  </Box>
                  
                  <Divider sx={{ mb: 2 }} />
                  
                  <Box display="flex" flexDirection="column" gap={1}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <BirthIcon fontSize="small" color="primary" />
                      <Typography variant="body2" noWrap>
                        <strong>Born:</strong> {getBirthInfo(person)}
                      </Typography>
                    </Box>
                    
                    {getDeathInfo(person) && (
                      <Box display="flex" alignItems="center" gap={1}>
                        <DeathIcon fontSize="small" color="error" />
                        <Typography variant="body2" noWrap>
                          <strong>Died:</strong> {getDeathInfo(person)}
                        </Typography>
                      </Box>
                    )}
                  </Box>
                  
                  <Box display="flex" justifyContent="flex-end" mt={2}>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/people/${person._id}`);
                      }}
                      color="primary"
                    >
                      <TimelineIcon />
                    </IconButton>
                    <IconButton 
                      size="small" 
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/people/${person._id}/edit`);
                      }}
                    >
                      <EditIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        // Family view (placeholder)
        <Paper elevation={2} sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Family Relationships View</Typography>
          <Typography>
            A family tree or relationship diagram will be implemented here.
          </Typography>
        </Paper>
      )}
    </div>
  );
};

export default PeopleList;
