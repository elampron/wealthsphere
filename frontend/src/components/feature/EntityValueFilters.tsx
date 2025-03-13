import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Button,
  Chip,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers';
import { EntityValue } from '@/types/finance';

interface EntityValueFiltersProps {
  values: EntityValue[];
  title: string;
  onFilterChange: (filters: EntityValueFilters) => void;
}

interface EntityValueFilters {
  entityTypes: string[];
  dateRange: {
    start: Date | null;
    end: Date | null;
  };
  valueRange: {
    min: number | null;
    max: number | null;
  };
  scenarios: string[];
}

export const EntityValueFilters: React.FC<EntityValueFiltersProps> = ({
  values,
  title,
  onFilterChange,
}) => {
  const [filters, setFilters] = React.useState<EntityValueFilters>({
    entityTypes: [],
    dateRange: {
      start: null,
      end: null,
    },
    valueRange: {
      min: null,
      max: null,
    },
    scenarios: [],
  });

  // Extract unique entity types and scenarios
  const uniqueEntityTypes = Array.from(
    new Set(values.map((value) => value.entity_type))
  ).sort();

  const uniqueScenarios = Array.from(
    new Set(values.map((value) => value.scenario_id))
  ).sort();

  // Handle filter changes
  const handleFilterChange = (
    field: keyof EntityValueFilters,
    value: any
  ) => {
    const newFilters = { ...filters, [field]: value };
    setFilters(newFilters);
    onFilterChange(newFilters);
  };

  // Handle chip deletion
  const handleChipDelete = (
    field: 'entityTypes' | 'scenarios',
    value: string
  ) => {
    const newValues = filters[field].filter((v) => v !== value);
    handleFilterChange(field, newValues);
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title} Filters
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="entity-type-label">Entity Types</InputLabel>
              <Select
                labelId="entity-type-label"
                multiple
                value={filters.entityTypes}
                onChange={(e) =>
                  handleFilterChange('entityTypes', e.target.value)
                }
                renderValue={(selected) => (
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    {(selected as string[]).map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        onDelete={() =>
                          handleChipDelete('entityTypes', value)
                        }
                      />
                    ))}
                  </Stack>
                )}
              >
                {uniqueEntityTypes.map((type) => (
                  <MenuItem key={type} value={type}>
                    {type}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="Start Date"
              value={filters.dateRange.start}
              onChange={(date) =>
                handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  start: date,
                })
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <DatePicker
              label="End Date"
              value={filters.dateRange.end}
              onChange={(date) =>
                handleFilterChange('dateRange', {
                  ...filters.dateRange,
                  end: date,
                })
              }
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Minimum Value"
              type="number"
              value={filters.valueRange.min || ''}
              onChange={(e) =>
                handleFilterChange('valueRange', {
                  ...filters.valueRange,
                  min: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </Grid>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Maximum Value"
              type="number"
              value={filters.valueRange.max || ''}
              onChange={(e) =>
                handleFilterChange('valueRange', {
                  ...filters.valueRange,
                  max: e.target.value ? Number(e.target.value) : null,
                })
              }
            />
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel id="scenarios-label">Scenarios</InputLabel>
              <Select
                labelId="scenarios-label"
                multiple
                value={filters.scenarios}
                onChange={(e) =>
                  handleFilterChange('scenarios', e.target.value)
                }
                renderValue={(selected) => (
                  <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
                    {(selected as string[]).map((value) => (
                      <Chip
                        key={value}
                        label={value}
                        onDelete={() =>
                          handleChipDelete('scenarios', value)
                        }
                      />
                    ))}
                  </Stack>
                )}
              >
                {uniqueScenarios.map((scenario) => (
                  <MenuItem key={scenario} value={scenario}>
                    {scenario}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => {
                  setFilters({
                    entityTypes: [],
                    dateRange: {
                      start: null,
                      end: null,
                    },
                    valueRange: {
                      min: null,
                      max: null,
                    },
                    scenarios: [],
                  });
                }}
              >
                Reset Filters
              </Button>
              <Button
                variant="contained"
                onClick={() => onFilterChange(filters)}
              >
                Apply Filters
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}; 