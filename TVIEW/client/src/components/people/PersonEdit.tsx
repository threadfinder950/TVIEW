// src/components/people/PersonEdit.tsx
import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Divider,
  CircularProgress,
  Alert
} from '@mui/material';
import { Save as SaveIcon, Cancel as CancelIcon } from '@mui/icons-material';
import axios from 'axios';
import { API } from '../../config/api';
import { debounce } from 'lodash';

interface PersonFormData {
  names: { given: string; surname: string }[];
  gender: 'M' | 'F' | 'O' | 'U';
  birth: { date: string; place: string; notes: string };
  death: { date: string; place: string; notes: string };
  notes: string;
}

const PersonEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<PersonFormData>({
    names: [{ given: '', surname: '' }],
    gender: 'U',
    birth: { date: '', place: '', notes: '' },
    death: { date: '', place: '', notes: '' },
    notes: ''
  });

  useEffect(() => {
    const fetchPerson = async () => {
      try {
        setLoading(true);
        const response = await axios.get(API.persons.getById(id!));
        const person = response.data;

        if (person.birth?.date && !isNaN(Date.parse(person.birth.date))) {
          person.birth.date = new Date(person.birth.date).toISOString().split('T')[0];
        }
        if (person.death?.date && !isNaN(Date.parse(person.death.date))) {
          person.death.date = new Date(person.death.date).toISOString().split('T')[0];
        }

        setFormData(person);
      } catch (err) {
        setError('Failed to fetch person details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchPerson();
  }, [id]);

  // Autosave debounced function
  const debouncedSave = useCallback(
    debounce(async (data: PersonFormData) => {
      try {
        setSaving(true);
        await axios.patch(API.persons.update(id!), data);
      } catch (err) {
        console.error('Autosave failed:', err);
        setError('Autosave failed');
      } finally {
        setSaving(false);
      }
    }, 1000),
    [id]
  );

  // Trigger autosave on form changes
  useEffect(() => {
    if (!loading) {
      debouncedSave(formData);
    }
  }, [formData, debouncedSave, loading]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof PersonFormData],
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleNameChange = (index: number, field: 'given' | 'surname', value: string) => {
    const updatedNames = [...formData.names];
    updatedNames[index] = { ...updatedNames[index], [field]: value };
    setFormData(prev => ({ ...prev, names: updatedNames }));
  };

  const handleSelectChange = (e: any) => {
    setFormData(prev => ({ ...prev, gender: e.target.value }));
  };

  const handleManualSave = async () => {
    try {
      setSaving(true);
      if (!formData.names[0].given || !formData.names[0].surname) {
        setError('Given name and surname are required');
        return;
      }
      await axios.patch(API.persons.update(id!), formData);
      navigate(`/people/${id}`);
    } catch (err) {
      setError('Failed to save changes');
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate(`/people/${id}`);
  };

  if (loading && !formData.names[0].given) {
    return <Box p={4}><CircularProgress /></Box>;
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Paper elevation={3} sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Edit Person
      </Typography>
      <Divider sx={{ mb: 3 }} />

      {saving && <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>Autosaving...</Typography>}

      <form>
        <Grid container spacing={3}>
          {/* Name Section */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Name</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Given Name(s)"
                  required
                  value={formData.names[0]?.given || ''}
                  onChange={(e) => handleNameChange(0, 'given', e.target.value)}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Surname"
                  required
                  value={formData.names[0]?.surname || ''}
                  onChange={(e) => handleNameChange(0, 'surname', e.target.value)}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Gender */}
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={formData.gender}
                onChange={handleSelectChange}
                label="Gender"
              >
                <MenuItem value="M">Male</MenuItem>
                <MenuItem value="F">Female</MenuItem>
                <MenuItem value="O">Other</MenuItem>
                <MenuItem value="U">Unknown</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Birth Info */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Birth Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Birth Date"
                  name="birth.date"
                  value={formData.birth?.date || ''}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Birth Place"
                  name="birth.place"
                  value={formData.birth?.place || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Birth Notes"
                  name="birth.notes"
                  value={formData.birth?.notes || ''}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Death Info */}
          <Grid item xs={12}>
            <Typography variant="h6" gutterBottom>Death Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  type="date"
                  label="Death Date"
                  name="death.date"
                  value={formData.death?.date || ''}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Death Place"
                  name="death.place"
                  value={formData.death?.place || ''}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  multiline
                  rows={2}
                  label="Death Notes"
                  name="death.notes"
                  value={formData.death?.notes || ''}
                  onChange={handleInputChange}
                />
              </Grid>
            </Grid>
          </Grid>

          {/* Notes */}
          <Grid item xs={12}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="Notes"
              name="notes"
              value={formData.notes || ''}
              onChange={handleInputChange}
            />
          </Grid>

          {/* Actions */}
          <Grid item xs={12}>
            <Box display="flex" justifyContent="flex-end" gap={2}>
              <Button
                variant="outlined"
                startIcon={<CancelIcon />}
                onClick={handleCancel}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                color="primary"
                startIcon={<SaveIcon />}
                onClick={handleManualSave}
                disabled={saving}
              >
                Save Changes
              </Button>
            </Box>
          </Grid>
        </Grid>
      </form>
    </Paper>
  );
};

export default PersonEdit;
