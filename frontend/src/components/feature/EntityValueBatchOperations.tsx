import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  TextField,
  Alert,
  AlertTitle,
  LinearProgress,
  Chip,
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { formatCurrency } from '@/utils/format';
import { EntityValue } from '@/types/finance';

interface EntityValueBatchOperationsProps {
  values: EntityValue[];
  title: string;
  onExecute: (operation: BatchOperation) => Promise<void>;
}

interface BatchOperation {
  type: 'update' | 'delete' | 'copy';
  filters: {
    entityTypes?: string[];
    entityIds?: string[];
    scenarioIds?: string[];
    dateRange?: {
      start: Date | null;
      end: Date | null;
    };
    valueRange?: {
      min: number | null;
      max: number | null;
    };
  };
  updates?: {
    value?: {
      type: 'set' | 'multiply' | 'add';
      amount: number;
    };
    scenarioId?: string;
    recordedAt?: Date;
  };
  copyTarget?: {
    scenarioId: string;
    adjustValue?: {
      type: 'multiply' | 'add';
      amount: number;
    };
  };
}

export const EntityValueBatchOperations: React.FC<EntityValueBatchOperationsProps> = ({
  values,
  title,
  onExecute,
}) => {
  const [operation, setOperation] = React.useState<BatchOperation>({
    type: 'update',
    filters: {},
    updates: {},
  });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  // Extract unique values for filters
  const uniqueEntityTypes = Array.from(new Set(values.map((v) => v.entity_type)));
  const uniqueEntityIds = Array.from(new Set(values.map((v) => v.entity_id)));
  const uniqueScenarioIds = Array.from(new Set(values.map((v) => v.scenario_id)));

  // Calculate affected records
  const getAffectedRecords = () => {
    return values.filter((value) => {
      const { filters } = operation;
      if (filters.entityTypes?.length && !filters.entityTypes.includes(value.entity_type)) {
        return false;
      }
      if (filters.entityIds?.length && !filters.entityIds.includes(value.entity_id)) {
        return false;
      }
      if (filters.scenarioIds?.length && !filters.scenarioIds.includes(value.scenario_id)) {
        return false;
      }
      if (filters.dateRange?.start && new Date(value.recorded_at) < filters.dateRange.start) {
        return false;
      }
      if (filters.dateRange?.end && new Date(value.recorded_at) > filters.dateRange.end) {
        return false;
      }
      if (filters.valueRange?.min != null && value.value < filters.valueRange.min) {
        return false;
      }
      if (filters.valueRange?.max != null && value.value > filters.valueRange.max) {
        return false;
      }
      return true;
    });
  };

  const affectedRecords = getAffectedRecords();

  const handleExecute = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await onExecute(operation);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title} Batch Operations
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="operation-type-label">Operation Type</InputLabel>
              <Select
                labelId="operation-type-label"
                value={operation.type}
                label="Operation Type"
                onChange={(e) =>
                  setOperation((prev) => ({
                    ...prev,
                    type: e.target.value as BatchOperation['type'],
                    // Reset updates/copyTarget based on type
                    updates: e.target.value === 'update' ? {} : undefined,
                    copyTarget: e.target.value === 'copy' ? { scenarioId: '' } : undefined,
                  }))
                }
                disabled={isLoading}
              >
                <MenuItem value="update">Update Values</MenuItem>
                <MenuItem value="delete">Delete Values</MenuItem>
                <MenuItem value="copy">Copy to Scenario</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button
              startIcon={<SettingsIcon />}
              onClick={() => setShowAdvanced(!showAdvanced)}
              disabled={isLoading}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
            </Button>
          </Grid>
          {showAdvanced && (
            <>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="entity-types-label">Entity Types</InputLabel>
                  <Select
                    labelId="entity-types-label"
                    multiple
                    value={operation.filters.entityTypes || []}
                    label="Entity Types"
                    onChange={(e) =>
                      setOperation((prev) => ({
                        ...prev,
                        filters: {
                          ...prev.filters,
                          entityTypes: e.target.value as string[],
                        },
                      }))
                    }
                    disabled={isLoading}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
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
                <FormControl fullWidth>
                  <InputLabel id="scenarios-label">Scenarios</InputLabel>
                  <Select
                    labelId="scenarios-label"
                    multiple
                    value={operation.filters.scenarioIds || []}
                    label="Scenarios"
                    onChange={(e) =>
                      setOperation((prev) => ({
                        ...prev,
                        filters: {
                          ...prev.filters,
                          scenarioIds: e.target.value as string[],
                        },
                      }))
                    }
                    disabled={isLoading}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {(selected as string[]).map((value) => (
                          <Chip key={value} label={value} />
                        ))}
                      </Box>
                    )}
                  >
                    {uniqueScenarioIds.map((id) => (
                      <MenuItem key={id} value={id}>
                        {id}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Minimum Value"
                  type="number"
                  value={operation.filters.valueRange?.min || ''}
                  onChange={(e) =>
                    setOperation((prev) => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        valueRange: {
                          ...prev.filters.valueRange,
                          min: e.target.value ? Number(e.target.value) : null,
                        },
                      },
                    }))
                  }
                  disabled={isLoading}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Maximum Value"
                  type="number"
                  value={operation.filters.valueRange?.max || ''}
                  onChange={(e) =>
                    setOperation((prev) => ({
                      ...prev,
                      filters: {
                        ...prev.filters,
                        valueRange: {
                          ...prev.filters.valueRange,
                          max: e.target.value ? Number(e.target.value) : null,
                        },
                      },
                    }))
                  }
                  disabled={isLoading}
                />
              </Grid>
            </>
          )}
          {operation.type === 'update' && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Update Settings
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="value-update-type-label">
                          Value Update Type
                        </InputLabel>
                        <Select
                          labelId="value-update-type-label"
                          value={operation.updates?.value?.type || 'set'}
                          label="Value Update Type"
                          onChange={(e) =>
                            setOperation((prev) => ({
                              ...prev,
                              updates: {
                                ...prev.updates,
                                value: {
                                  type: e.target.value as 'set' | 'multiply' | 'add',
                                  amount: prev.updates?.value?.amount || 0,
                                },
                              },
                            }))
                          }
                          disabled={isLoading}
                        >
                          <MenuItem value="set">Set Value</MenuItem>
                          <MenuItem value="multiply">Multiply By</MenuItem>
                          <MenuItem value="add">Add Amount</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Amount"
                        type="number"
                        value={operation.updates?.value?.amount || ''}
                        onChange={(e) =>
                          setOperation((prev) => ({
                            ...prev,
                            updates: {
                              ...prev.updates,
                              value: {
                                type: prev.updates?.value?.type || 'set',
                                amount: Number(e.target.value),
                              },
                            },
                          }))
                        }
                        disabled={isLoading}
                      />
                    </Grid>
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
          {operation.type === 'copy' && (
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Typography variant="subtitle1" gutterBottom>
                    Copy Settings
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="target-scenario-label">
                          Target Scenario
                        </InputLabel>
                        <Select
                          labelId="target-scenario-label"
                          value={operation.copyTarget?.scenarioId || ''}
                          label="Target Scenario"
                          onChange={(e) =>
                            setOperation((prev) => ({
                              ...prev,
                              copyTarget: {
                                ...prev.copyTarget,
                                scenarioId: e.target.value,
                              },
                            }))
                          }
                          disabled={isLoading}
                        >
                          {uniqueScenarioIds.map((id) => (
                            <MenuItem key={id} value={id}>
                              {id}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel id="value-adjustment-type-label">
                          Value Adjustment
                        </InputLabel>
                        <Select
                          labelId="value-adjustment-type-label"
                          value={operation.copyTarget?.adjustValue?.type || ''}
                          label="Value Adjustment"
                          onChange={(e) =>
                            setOperation((prev) => ({
                              ...prev,
                              copyTarget: {
                                ...prev.copyTarget,
                                adjustValue: e.target.value
                                  ? {
                                      type: e.target.value as 'multiply' | 'add',
                                      amount: prev.copyTarget?.adjustValue?.amount || 0,
                                    }
                                  : undefined,
                              },
                            }))
                          }
                          disabled={isLoading}
                        >
                          <MenuItem value="">No Adjustment</MenuItem>
                          <MenuItem value="multiply">Multiply By</MenuItem>
                          <MenuItem value="add">Add Amount</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    {operation.copyTarget?.adjustValue && (
                      <Grid item xs={12} sm={6}>
                        <TextField
                          fullWidth
                          label="Adjustment Amount"
                          type="number"
                          value={operation.copyTarget.adjustValue.amount || ''}
                          onChange={(e) =>
                            setOperation((prev) => ({
                              ...prev,
                              copyTarget: {
                                ...prev.copyTarget,
                                adjustValue: {
                                  type: prev.copyTarget?.adjustValue?.type as 'multiply' | 'add',
                                  amount: Number(e.target.value),
                                },
                              },
                            }))
                          }
                          disabled={isLoading}
                        />
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            </Grid>
          )}
          <Grid item xs={12}>
            <Alert
              severity={affectedRecords.length > 0 ? 'info' : 'warning'}
              sx={{ mb: 2 }}
            >
              <AlertTitle>Operation Preview</AlertTitle>
              <Typography variant="body2">
                This operation will affect {affectedRecords.length} records
                {affectedRecords.length > 0 &&
                  ` with a total value of ${formatCurrency(
                    affectedRecords.reduce((sum, record) => sum + record.value, 0)
                  )}`}
                .
              </Typography>
            </Alert>
          </Grid>
          {error && (
            <Grid item xs={12}>
              <Alert severity="error">{error}</Alert>
            </Grid>
          )}
          {isLoading && (
            <Grid item xs={12}>
              <LinearProgress />
            </Grid>
          )}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<PlayArrowIcon />}
                onClick={handleExecute}
                disabled={
                  isLoading ||
                  affectedRecords.length === 0 ||
                  (operation.type === 'copy' && !operation.copyTarget?.scenarioId)
                }
              >
                Execute {operation.type === 'copy' ? 'Copy' : operation.type}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}; 