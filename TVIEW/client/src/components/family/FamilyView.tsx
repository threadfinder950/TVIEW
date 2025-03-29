// src/components/family/FamilyView.tsx
import { useState, useEffect } from 'react';
import { 
  Typography, 
  Paper, 
  Box, 
  Grid, 
  Card, 
  CardContent, 
  CardActionArea,
  Avatar, 
  Divider, 
  Breadcrumbs,
  Link as MuiLink,
  CircularProgress,
  Alert,
  Tabs,
  Tab,
  Button
} from '@mui/material';
import {
  Person as PersonIcon,
  FamilyRestroom as FamilyIcon,
  ArrowUpward as ParentsIcon,
  ArrowDownward as ChildrenIcon,
  Favorite as SpouseIcon
} from '@mui/icons-material';
import { Link as RouterLink, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../config/api';

interface FamilyMember {
  _id: string;
  names: { given: string; surname: string }[];
  birth?: { date?: string };
  death?: { date?: string };
  imageUrl?: string;
}

const FamilyView = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [currentPerson, setCurrentPerson] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [family, setFamily] = useState<{
    parents: FamilyMember[];
    spouses: FamilyMember[];
    children: FamilyMember[];
    siblings: FamilyMember[];
  }>({
    parents: [],
    spouses: [],
    children: [],
    siblings: []
  });
  const [viewMode, setViewMode] = useState<'family' | 'ancestors' | 'descendants'>('family');

  useEffect(() => {
    const fetchPersonAndFamily = async () => {
      try {
        setLoading(true);
        setError(null);
  
        const personResponse = await axios.get(API.persons.getById(id || ''));
        const current = personResponse.data;
        setCurrentPerson(current);
  
        const familyResponse = await axios.get(API.persons.family(id || ''));
        const baseFamily = familyResponse.data;
  
        const inferredSiblings: FamilyMember[] = [];
  
        // Go through each parent and get their children
        for (const parent of baseFamily.parents || []) {
          const parentFamilyResponse = await axios.get(API.persons.family(parent._id));
          const siblingsFromParent = parentFamilyResponse.data.children || [];
  
          siblingsFromParent.forEach((sibling: any) => {
            if (
              sibling._id !== id && // exclude self
              !inferredSiblings.some(s => s._id === sibling._id) // prevent duplicates
            ) {
              inferredSiblings.push(sibling);
            }
          });
        }
  
        setFamily({
          ...baseFamily,
          siblings: inferredSiblings
        });
  
      } catch (err) {
        console.error('Error fetching family data:', err);
        setError('Failed to load family information');
      } finally {
        setLoading(false);
      }
    };
  
    if (id) {
      fetchPersonAndFamily();
    }
  }, [id]);
  

  const formatName = (person: FamilyMember) => {
    if (!person?.names || person.names.length === 0) return 'Unknown Person';
    return `${person.names[0].given} ${person.names[0].surname}`;
  };

  const formatLifespan = (birth?: { date?: string }, death?: { date?: string }) => {
    const birthYear = birth?.date ? new Date(birth.date).getFullYear() : '?';
    const deathYear = death?.date ? new Date(death.date).getFullYear() : '';
    return deathYear ? `${birthYear} - ${deathYear}` : `b. ${birthYear}`;
  };

  const handlePersonClick = (personId: string) => {
    navigate(`/family/${personId}`);
  };

  const handleViewPersonDetails = () => {
    navigate(`/people/${id}`);
  };

  const renderPersonCard = (person: FamilyMember, relationshipLabel?: string) => (
    <Card 
      key={person._id} 
      sx={{ mb: 2, border: person._id === id ? '2px solid #3f51b5' : 'none' }}
    >
      <CardActionArea onClick={() => handlePersonClick(person._id)}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={1}>
            <Avatar src={person.imageUrl} sx={{ mr: 2 }}>
              {!person.imageUrl && <PersonIcon />}
            </Avatar>
            <Box>
              <Typography variant="h6">{formatName(person)}</Typography>
              {relationshipLabel && (
                <Typography variant="caption" color="textSecondary">
                  {relationshipLabel}
                </Typography>
              )}
            </Box>
          </Box>
          <Typography variant="body2">
            {formatLifespan(person.birth, person.death)}
          </Typography>
        </CardContent>
      </CardActionArea>
    </Card>
  );

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

  if (!currentPerson) {
    return (
      <Alert severity="warning" sx={{ mt: 2 }}>
        Person not found
      </Alert>
    );
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Breadcrumbs sx={{ mb: 3 }}>
        <MuiLink component={RouterLink} to="/people">People</MuiLink>
        <MuiLink component={RouterLink} to={`/people/${id}`}>{formatName(currentPerson)}</MuiLink>
        <Typography color="textPrimary">Family</Typography>
      </Breadcrumbs>

      <Box display="flex" justifyContent="center" mb={3}>
        <Button
          variant="outlined"
          startIcon={<PersonIcon />}
          onClick={handleViewPersonDetails}
        >
          Back to Person Details
        </Button>
      </Box>

      <Box mb={3}>
        <Typography variant="h4" gutterBottom>
          {formatName(currentPerson)}'s Family
        </Typography>

        <Tabs 
          value={viewMode} 
          onChange={(e, newValue) => setViewMode(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab icon={<FamilyIcon />} label="Immediate Family" value="family" />
          <Tab icon={<ParentsIcon />} label="Ancestors" value="ancestors" />
          <Tab icon={<ChildrenIcon />} label="Descendants" value="descendants" />
        </Tabs>
      </Box>

      {viewMode === 'family' && (
        <Grid container spacing={3}>
          {/* Parents */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              <Box display="flex" alignItems="center">
                <ParentsIcon sx={{ mr: 1 }} />
                Parents
              </Box>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {family.parents.length > 0 ? (
              family.parents.map(parent => renderPersonCard(parent))
            ) : (
              <Typography variant="body2" color="textSecondary">
                No parents recorded
              </Typography>
            )}
          </Grid>

          {/* Siblings */}
          <Grid item xs={12} md={6}>
            <Typography variant="h6" gutterBottom>
              <Box display="flex" alignItems="center">
                <PersonIcon sx={{ mr: 1 }} />
                Siblings
              </Box>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {family.siblings.length > 0 ? (
              family.siblings.map(sibling => renderPersonCard(sibling))
            ) : (
              <Typography variant="body2" color="textSecondary">
                No siblings recorded
              </Typography>
            )}
          </Grid>

          {/* Spouses */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              <Box display="flex" alignItems="center">
                <SpouseIcon sx={{ mr: 1 }} />
                Spouses
              </Box>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {family.spouses.length > 0 ? (
              family.spouses.map(spouse => renderPersonCard(spouse))
            ) : (
              <Typography variant="body2" color="textSecondary">
                No spouses recorded
              </Typography>
            )}
          </Grid>

          {/* Children */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>
              <Box display="flex" alignItems="center">
                <ChildrenIcon sx={{ mr: 1 }} />
                Children
              </Box>
            </Typography>
            <Divider sx={{ mb: 2 }} />
            {family.children.length > 0 ? (
              family.children.map(child => renderPersonCard(child))
            ) : (
              <Typography variant="body2" color="textSecondary">
                No children recorded
              </Typography>
            )}
          </Grid>
        </Grid>
      )}

      {viewMode === 'ancestors' && (
        <Box>
          <Typography variant="body1">
            Ancestor view would display parents, grandparents, etc. in a tree or hierarchical format.
          </Typography>
        </Box>
      )}

      {viewMode === 'descendants' && (
        <Box>
          <Typography variant="body1">
            Descendant view would display children, grandchildren, etc. in a tree or hierarchical format.
          </Typography>
        </Box>
      )}
    </Paper>
  );
};

export default FamilyView;
