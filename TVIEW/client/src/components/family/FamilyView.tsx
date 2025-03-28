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
  Link,
  CircularProgress,
  Alert,
  Tabs,
  Tab
} from '@mui/material';
import {
  Person as PersonIcon,
  FamilyRestroom as FamilyIcon,
  AccountTree as TreeIcon,
  ArrowUpward as ParentsIcon,
  ArrowDownward as ChildrenIcon,
  Favorite as SpouseIcon
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { API } from '../../config/api';

interface FamilyMember {
  _id: string;
  name: string;
  relationship: string;
  birthDate?: string;
  deathDate?: string;
  imageUrl?: string;
}

function FamilyView() {
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

        // Get person details
        const personResponse = await axios.get(API.persons.getById(id || ''));
        setCurrentPerson(personResponse.data);

        // Get family members
        const familyResponse = await axios.get(API.persons.family(id || ''));
        setFamily(familyResponse.data);
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

  // Format name from person object
  const formatName = (person: any) => {
    if (!person?.names || person.names.length === 0) return 'Unknown Person';
    return `${person.names[0].given} ${person.names[0].surname}`;
  };

  // Format dates for display
  const formatLifespan = (birthDate?: string, deathDate?: string) => {
    const birth = birthDate ? new Date(birthDate).getFullYear() : '?';
    const death = deathDate ? new Date(deathDate).getFullYear() : '';
    return death ? `${birth} - ${death}` : `b. ${birth}`;
  };

  // Handle clicking on a family member card
  const handlePersonClick = (personId: string) => {
    navigate(`/family/${personId}`);
  };

  // Render a person card
  const renderPersonCard = (person: FamilyMember, relationshipLabel?: string) => (
    <Card 
      key={person._id} 
      sx={{ 
        mb: 2, 
        border: person._id === id ? '2px solid #3f51b5' : 'none' 
      }}
    >
      <CardActionArea onClick={() => handlePersonClick(person._id)}>
        <CardContent>
          <Box display="flex" alignItems="center" mb={1}>
          <Avatar src={person.imageUrl} sx={{ mr: 2 }}>
                {!person.imageUrl && <PersonIcon />}
        </Avatar>
            <Box>
              <Typography variant="h6">{person.name}</Typography>
              {relationshipLabel && (
                <Typography variant="caption" color="textSecondary">
                  {relationshipLabel}
                </Typography>
              )}
            </Box>
          </Box>
          <Typography variant="body2">
            {formatLifespan(person.birthDate, person.deathDate)}
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
        <Link href="/people">People</Link>
        <Link href={`/people/${id}`}>{formatName(currentPerson)}</Link>
        <Typography color="textPrimary">Family</Typography>
      </Breadcrumbs>

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
          {/* Parents Section */}
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

          {/* Siblings Section */}
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

          {/* Spouses Section */}
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

          {/* Children Section */}
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
            This would require a more complex implementation with family tree visualization.
          </Typography>
          {/* Implement ancestor tree visualization here */}
        </Box>
      )}

      {viewMode === 'descendants' && (
        <Box>
          <Typography variant="body1">
            Descendant view would display children, grandchildren, etc. in a tree or hierarchical format.
            This would require a more complex implementation with family tree visualization.
          </Typography>
          {/* Implement descendant tree visualization here */}
        </Box>
      )}
    </Paper>
  );
}

export default FamilyView;