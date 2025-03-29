// src/components/timeview/TimeView.tsx
import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Select, MenuItem, Button, Grid, Paper, FormControl, InputLabel
} from '@mui/material';
import axios from 'axios';
import { API } from '../../config/api';

// Define relationship types for better organization
interface Person {
  _id: string;
  names?: { given: string; surname: string }[];
  birth?: { date: string };
  death?: { date: string };
  relationships?: { type: string; person: string }[];
}

const TimeView = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [allPeople, setAllPeople] = useState<Person[]>([]);
  const [selectedId, setSelectedId] = useState<string>('');
  const [selectedPerson, setSelectedPerson] = useState<Person | null>(null);
  const [immediateRelatives, setImmediateRelatives] = useState<Person[]>([]);
  const [extendedRelatives, setExtendedRelatives] = useState<Person[]>([]);
  const [metaFamilyRelatives, setMetaFamilyRelatives] = useState<Person[]>([]);
  const [showAllCategories, setShowAllCategories] = useState<boolean>(true);

  useEffect(() => {
    const fetchPeople = async () => {
      try {
        const response = await axios.get(API.persons.getAll);
        setAllPeople(response.data);
      } catch (err) {
        console.error('Error fetching people:', err);
      }
    };
    fetchPeople();
  }, []);

  useEffect(() => {
    const loadPersonAndRelatives = async () => {
      if (!selectedId) return;
      try {
        const personResponse = await axios.get(API.persons.getById(selectedId));
        const familyResponse = await axios.get(API.persons.family(selectedId));
        
        setSelectedPerson(personResponse.data);

        // Reset all relationship arrays
        const immediate: Person[] = [];
        const extended: Person[] = [];
        const metaFamily: Person[] = [];
        
        // Get current spouses - only current spouses are immediate family
        const currentSpouses = (familyResponse.data.spouses || []).filter((spouse: Person) => {
          // Logic to determine if spouse is current (not divorced)
          return !spouse.relationships?.some(r => 
            r.type === 'divorce' && r.person === selectedId
          );
        });
        
        // Ex-spouses go to extended family
        const exSpouses = (familyResponse.data.spouses || []).filter((spouse: Person) => {
          return spouse.relationships?.some(r => 
            r.type === 'divorce' && r.person === selectedId
          );
        });
        
        // Categorize immediate family
        immediate.push(
          ...(familyResponse.data.parents || []),
          ...(familyResponse.data.children || []),
          ...currentSpouses,
          ...(familyResponse.data.siblings || [])
        );
        
        // Start with ex-spouses in extended family
        extended.push(...exSpouses);

        if (showAllCategories) {
          // Add grandparents to extended family
          for (const parent of familyResponse.data.parents || []) {
            const parentFamily = await axios.get(API.persons.family(parent._id));
            extended.push(...(parentFamily.data.parents || []));
          }

          // Add grandchildren to extended family
          for (const child of familyResponse.data.children || []) {
            const childFamily = await axios.get(API.persons.family(child._id));
            extended.push(...(childFamily.data.children || []));
          }

          // Add aunts/uncles and cousins to extended family
          for (const parent of familyResponse.data.parents || []) {
            const parentFamily = await axios.get(API.persons.family(parent._id));
            const siblingsOfParent = parentFamily.data.siblings || [];
            extended.push(...siblingsOfParent);

            for (const sibling of siblingsOfParent) {
              const siblingFamily = await axios.get(API.persons.family(sibling._id));
              extended.push(...(siblingFamily.data.children || []));
            }
          }

          // Add in-laws to metaFamily (both current and ex-spouses)
          for (const spouse of familyResponse.data.spouses || []) {
            const spouseFamily = await axios.get(API.persons.family(spouse._id));
            const isExSpouse = spouse.relationships?.some(r => 
              r.type === 'divorce' && r.person === selectedId
            );
            
            // Add spouse's parents (in-laws)
            for (const inLaw of spouseFamily.data.parents || []) {
              if (!isInAnyArray(inLaw, immediate, extended)) {
                metaFamily.push(inLaw);
              }
            }
            
            // Add spouse's siblings (in-laws)
            for (const siblingInLaw of spouseFamily.data.siblings || []) {
              if (!isInAnyArray(siblingInLaw, immediate, extended)) {
                metaFamily.push(siblingInLaw);
              }
            }
            
            // Add children of ex-spouses (not shared children)
            if (isExSpouse) {
              for (const child of spouseFamily.data.children || []) {
                if (!isChild(child._id, selectedId, familyResponse.data.children || [])) {
                  metaFamily.push(child);
                }
              }
            }
            
            // Add ex-spouse's new spouse (like Jim Zarpentine in your example)
            if (isExSpouse) {
              for (const spouseOfExSpouse of spouseFamily.data.spouses || []) {
                if (spouseOfExSpouse._id !== selectedId) {
                  metaFamily.push(spouseOfExSpouse);
                  
                  // Also get children of this new spouse that aren't already included
                  const spouseOfExSpouseFamily = await axios.get(API.persons.family(spouseOfExSpouse._id));
                  for (const stepChild of spouseOfExSpouseFamily.data.children || []) {
                    if (!isInAnyArray(stepChild, immediate, extended, metaFamily)) {
                      metaFamily.push(stepChild);
                    }
                  }
                }
              }
            }
          }
          
          // Add cousins more thoroughly
          // First, get all aunts and uncles (siblings of parents)
          const auntsAndUncles = [];
          for (const parent of familyResponse.data.parents || []) {
            const parentFamily = await axios.get(API.persons.family(parent._id));
            auntsAndUncles.push(...(parentFamily.data.siblings || []));
          }
          
          // Then get all their children (cousins)
          for (const auntOrUncle of auntsAndUncles) {
            const auntOrUncleFamily = await axios.get(API.persons.family(auntOrUncle._id));
            for (const cousin of auntOrUncleFamily.data.children || []) {
              if (!isInAnyArray(cousin, immediate, extended)) {
                extended.push(cousin);
              }
            }
          }
        }

        // Make sure relatives are unique in their categories
        const uniqueImmediate = removeDuplicates(immediate);
        const uniqueExtended = removeDuplicates(extended.filter(person => 
          !isInArray(person, uniqueImmediate)
        ));
        const uniqueMetaFamily = removeDuplicates(metaFamily.filter(person => 
          !isInArray(person, uniqueImmediate) && !isInArray(person, uniqueExtended)
        ));

        setImmediateRelatives(uniqueImmediate);
        setExtendedRelatives(uniqueExtended);
        setMetaFamilyRelatives(uniqueMetaFamily);
      } catch (err) {
        console.error('Error loading person and relatives:', err);
      }
    };

    loadPersonAndRelatives();
  }, [selectedId, showAllCategories]);

  // Helper function to check if a person is already in any of the provided arrays
  const isInAnyArray = (person: Person, ...arrays: Person[][]) => {
    return arrays.some(array => isInArray(person, array));
  };

  // Helper function to check if a person is already in an array
  const isInArray = (person: Person, array: Person[]) => {
    return array.some(p => p._id === person._id);
  };

  // Helper function to check if a person is a child of another person
  const isChild = (childId: string, parentId: string, children: Person[]) => {
    return children.some(child => child._id === childId);
  };

  // Helper function to remove duplicates from an array of persons
  const removeDuplicates = (persons: Person[]) => {
    return persons.filter((person, index, self) => 
      index === self.findIndex(p => p._id === person._id)
    );
  };

  // Updated isAlive function to properly handle living relatives
  const isAlive = (person: Person, refYear: number) => {
    if (!person) return false;
    
    // IMPORTANT: If we're looking at the current year, assume any person without 
    // a death date is alive, even if missing birth date
    const currentYear = new Date().getFullYear();
    if (refYear === currentYear) {
      return !person.death || !person.death.date;
    }
    
    const birthYear = person.birth?.date 
      ? new Date(person.birth.date).getFullYear() 
      : null;
    
    const deathYear = person.death?.date 
      ? new Date(person.death.date).getFullYear() 
      : null;
    
    // For historical years, use more precise logic:
    // 1. If there's no birth date but no death date, assume they're alive
    // 2. If there is a birth date, they must be born before/during reference year
    // 3. They either have no death date OR died after the reference year
    if (birthYear === null) {
      return !deathYear || deathYear >= refYear;
    } else {
      return birthYear <= refYear && (!deathYear || deathYear >= refYear);
    }
  };

  const getBoxColor = (person: Person) => {
    if (!person) return 'white';
    
    const deathYear = person.death?.date 
      ? new Date(person.death.date).getFullYear() 
      : null;
    
    if (person._id === selectedId) {
      return deathYear === year ? 'gray' : 'lightgreen';
    }
    if (deathYear === year) return 'yellow';
    return 'lightblue';
  };

  const renderPersonCard = (person: Person) => {
    if (!person) return null;
    
    return (
      <Paper 
        key={person._id} 
        elevation={2} 
        sx={{ 
          p: 2, 
          backgroundColor: getBoxColor(person),
          minHeight: '80px'
        }}
      >
        <Typography variant="subtitle1">
          {person.names?.[0]?.given} {person.names?.[0]?.surname}
        </Typography>
        {person.birth?.date && (
          <Typography variant="body2">
            Age: {calculateAge(person.birth.date, year)}
          </Typography>
        )}
      </Paper>
    );
  };

  const calculateAge = (birthDate: string, refYear: number) => {
    return refYear - new Date(birthDate).getFullYear();
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>TimeView</Typography>

      <Box display="flex" alignItems="center" gap={2} mb={3}>
        <Button variant="outlined" onClick={() => setYear(y => y - 1)}>-</Button>
        <Typography variant="h6">{year}</Typography>
        <Button variant="outlined" onClick={() => setYear(y => y + 1)}>+</Button>

        <FormControl sx={{ minWidth: 300 }}>
          <InputLabel>Select a person</InputLabel>
          <Select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value as string)}
            label="Select a person"
          >
            {allPeople.map((p) => (
              <MenuItem key={p._id} value={p._id}>
                {p.names?.[0]?.given} {p.names?.[0]?.surname}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <FormControl>
          <InputLabel>Categories</InputLabel>
          <Select
            value={showAllCategories ? 'all' : 'immediate'}
            onChange={(e) => setShowAllCategories(e.target.value === 'all')}
            label="Categories"
          >
            <MenuItem value="all">Show All Categories</MenuItem>
            <MenuItem value="immediate">Immediate Only</MenuItem>
          </Select>
        </FormControl>
        
        <Button 
          variant="contained" 
          color="primary"
          onClick={() => {
            // Instead of showing a dialog here, we'll navigate to a different page
            // You'll need to use your app's router
            // For now just a simple alert
            if (selectedId) {
              window.location.href = `/persons/add?personId=${selectedId}`;
            } else {
              alert("Please select a person first");
            }
          }}
        >
          Add Important Person
        </Button>
      </Box>

      {selectedPerson && (
        <Box mb={4}>
          <Typography variant="h6">Selected Person</Typography>
          {renderPersonCard(selectedPerson)}
        </Box>
      )}

      <Typography variant="h6" sx={{ mt: 3 }}>Immediate Family</Typography>
      <Grid container spacing={2} sx={{ mb: 4 }}>
        {immediateRelatives
          .filter(p => isAlive(p, year))
          .map(p => (
            <Grid item key={p._id} xs={12} sm={6} md={3}>
              {renderPersonCard(p)}
            </Grid>
          ))}
        {immediateRelatives.filter(p => isAlive(p, year)).length === 0 && (
          <Grid item xs={12}>
            <Typography variant="body2" color="text.secondary">
              No living immediate family members in this year.
            </Typography>
          </Grid>
        )}
      </Grid>

      {showAllCategories && (
        <>
          <Typography variant="h6" sx={{ mt: 3 }}>Extended Family</Typography>
          <Grid container spacing={2} sx={{ mb: 4 }}>
            {extendedRelatives
              .filter(p => isAlive(p, year))
              .map(p => (
                <Grid item key={p._id} xs={12} sm={6} md={3}>
                  {renderPersonCard(p)}
                </Grid>
              ))}
            {extendedRelatives.filter(p => isAlive(p, year)).length === 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  No living extended family members in this year.
                </Typography>
              </Grid>
            )}
          </Grid>

          <Typography variant="h6" sx={{ mt: 3 }}>Meta-Family</Typography>
          <Grid container spacing={2}>
            {metaFamilyRelatives
              .filter(p => isAlive(p, year))
              .map(p => (
                <Grid item key={p._id} xs={12} sm={6} md={3}>
                  {renderPersonCard(p)}
                </Grid>
              ))}
            {metaFamilyRelatives.filter(p => isAlive(p, year)).length === 0 && (
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  No living meta-family members in this year.
                </Typography>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </Box>
  );
};

export default TimeView;