import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers';
import { EntityValue } from '@/types/finance';

interface EntityValueFormProps {
  value?: EntityValue;
  title: string;
  entityTypes: string[];
  entityIds: Record<string, string[]>;
  scenarioIds: string[];
  onSubmit: (data: EntityValueFormData) => void;
  onCancel?: () => void;
}

interface EntityValueFormData {
  entity_type: string;
  entity_id: string;
  value: number;
  recorded_at: Date;
  scenario_id: string;
}

export const EntityValueForm: React.FC<EntityValueFormProps> = ({
  value,
  title,
  entityTypes,
  entityIds,
  scenarioIds,
  onSubmit,
  onCancel,
}) => {
  const [formData, setFormData] = React.useState<EntityValueFormData>({
    entity_type: value?.entity_type || '',
    entity_id: value?.entity_id || '',
    value: value?.value || 0,
    recorded_at: value?.recorded_at ? new Date(value.recorded_at) : new Date(),
    scenario_id: value?.scenario_id || '',
  });

  const [errors, setErrors] = React.useState<Partial<Record<keyof EntityValueFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof EntityValueFormData, string>> = {};

    if (!formData.entity_type) {
      newErrors.entity_type = 'Entity type is required';
    }

    if (!formData.entity_id) {
      newErrors.entity_id = 'Entity ID is required';
    }

    if (formData.value < 0) {
      newErrors.value = 'Value must be non-negative';
    }

    if (!formData.scenario_id) {
      newErrors.scenario_id = 'Scenario is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof EntityValueFormData, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
      // Reset entity_id if entity_type changes
      ...(field === 'entity_type' ? { entity_id: '' } : {}),
    }));
    // Clear error when field is updated
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title}
        </Typography>
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.entity_type}>
                <InputLabel id="entity-type-label">Entity Type</InputLabel>
                <Select
                  labelId="entity-type-label"
                  value={formData.entity_type}
                  label="Entity Type"
                  onChange={(e) => handleChange('entity_type', e.target.value)}
                >
                  {entityTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
                {errors.entity_type && (
                  <Typography variant="caption" color="error">
                    {errors.entity_type}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl
                fullWidth
                error={!!errors.entity_id}
                disabled={!formData.entity_type}
              >
                <InputLabel id="entity-id-label">Entity</InputLabel>
                <Select
                  labelId="entity-id-label"
                  value={formData.entity_id}
                  label="Entity"
                  onChange={(e) => handleChange('entity_id', e.target.value)}
                >
                  {(entityIds[formData.entity_type] || []).map((id) => (
                    <MenuItem key={id} value={id}>
                      {id}
                    </MenuItem>
                  ))}
                </Select>
                {errors.entity_id && (
                  <Typography variant="caption" color="error">
                    {errors.entity_id}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Value"
                type="number"
                value={formData.value}
                onChange={(e) =>
                  handleChange('value', parseFloat(e.target.value) || 0)
                }
                error={!!errors.value}
                helperText={errors.value}
                inputProps={{ min: 0, step: 0.01 }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth error={!!errors.scenario_id}>
                <InputLabel id="scenario-label">Scenario</InputLabel>
                <Select
                  labelId="scenario-label"
                  value={formData.scenario_id}
                  label="Scenario"
                  onChange={(e) => handleChange('scenario_id', e.target.value)}
                >
                  {scenarioIds.map((id) => (
                    <MenuItem key={id} value={id}>
                      {id}
                    </MenuItem>
                  ))}
                </Select>
                {errors.scenario_id && (
                  <Typography variant="caption" color="error">
                    {errors.scenario_id}
                  </Typography>
                )}
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <DateTimePicker
                label="Recorded At"
                value={formData.recorded_at}
                onChange={(date) => handleChange('recorded_at', date)}
                slotProps={{
                  textField: {
                    fullWidth: true,
                  },
                }}
              />
            </Grid>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                {onCancel && (
                  <Button variant="outlined" onClick={onCancel}>
                    Cancel
                  </Button>
                )}
                <Button variant="contained" type="submit">
                  {value ? 'Update' : 'Create'} Value
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </CardContent>
    </Card>
  );
}; 