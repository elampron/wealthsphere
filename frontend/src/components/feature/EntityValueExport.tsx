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
  Checkbox,
  FormControlLabel,
  FormGroup,
} from '@mui/material';
import {
  Download as DownloadIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { formatCurrency } from '@/utils/format';
import { EntityValue } from '@/types/finance';

interface EntityValueExportProps {
  values: EntityValue[];
  title: string;
  onExport: (format: string, options: ExportOptions) => void;
}

interface ExportOptions {
  format: 'csv' | 'json' | 'excel';
  includeFields: string[];
  groupBy?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

const AVAILABLE_FIELDS = [
  { key: 'recorded_at', label: 'Date' },
  { key: 'entity_type', label: 'Entity Type' },
  { key: 'entity_id', label: 'Entity ID' },
  { key: 'value', label: 'Value' },
  { key: 'scenario_id', label: 'Scenario' },
];

const GROUP_BY_OPTIONS = [
  { key: 'none', label: 'None' },
  { key: 'entity_type', label: 'Entity Type' },
  { key: 'entity_id', label: 'Entity' },
  { key: 'scenario_id', label: 'Scenario' },
];

const SORT_BY_OPTIONS = [
  { key: 'recorded_at', label: 'Date' },
  { key: 'value', label: 'Value' },
  { key: 'entity_type', label: 'Entity Type' },
  { key: 'entity_id', label: 'Entity ID' },
  { key: 'scenario_id', label: 'Scenario' },
];

export const EntityValueExport: React.FC<EntityValueExportProps> = ({
  values,
  title,
  onExport,
}) => {
  const [exportOptions, setExportOptions] = React.useState<ExportOptions>({
    format: 'csv',
    includeFields: AVAILABLE_FIELDS.map((field) => field.key),
    groupBy: 'none',
    sortBy: 'recorded_at',
    sortOrder: 'desc',
  });

  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const handleExport = () => {
    onExport(exportOptions.format, exportOptions);
  };

  const handleFieldToggle = (field: string) => {
    setExportOptions((prev) => ({
      ...prev,
      includeFields: prev.includeFields.includes(field)
        ? prev.includeFields.filter((f) => f !== field)
        : [...prev.includeFields, field],
    }));
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title} Export
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="format-label">Export Format</InputLabel>
              <Select
                labelId="format-label"
                value={exportOptions.format}
                label="Export Format"
                onChange={(e) =>
                  setExportOptions((prev) => ({
                    ...prev,
                    format: e.target.value as 'csv' | 'json' | 'excel',
                  }))
                }
              >
                <MenuItem value="csv">CSV</MenuItem>
                <MenuItem value="json">JSON</MenuItem>
                <MenuItem value="excel">Excel</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <Button
              startIcon={<SettingsIcon />}
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>
          </Grid>
          {showAdvanced && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Include Fields
                </Typography>
                <FormGroup row>
                  {AVAILABLE_FIELDS.map((field) => (
                    <FormControlLabel
                      key={field.key}
                      control={
                        <Checkbox
                          checked={exportOptions.includeFields.includes(field.key)}
                          onChange={() => handleFieldToggle(field.key)}
                        />
                      }
                      label={field.label}
                    />
                  ))}
                </FormGroup>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="group-by-label">Group By</InputLabel>
                  <Select
                    labelId="group-by-label"
                    value={exportOptions.groupBy}
                    label="Group By"
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        groupBy: e.target.value,
                      }))
                    }
                  >
                    {GROUP_BY_OPTIONS.map((option) => (
                      <MenuItem key={option.key} value={option.key}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="sort-by-label">Sort By</InputLabel>
                  <Select
                    labelId="sort-by-label"
                    value={exportOptions.sortBy}
                    label="Sort By"
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        sortBy: e.target.value,
                      }))
                    }
                  >
                    {SORT_BY_OPTIONS.map((option) => (
                      <MenuItem key={option.key} value={option.key}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="sort-order-label">Sort Order</InputLabel>
                  <Select
                    labelId="sort-order-label"
                    value={exportOptions.sortOrder}
                    label="Sort Order"
                    onChange={(e) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        sortOrder: e.target.value as 'asc' | 'desc',
                      }))
                    }
                  >
                    <MenuItem value="asc">Ascending</MenuItem>
                    <MenuItem value="desc">Descending</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </>
          )}
          <Grid item xs={12}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExport}
                disabled={exportOptions.includeFields.length === 0}
              >
                Export {values.length} Records
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}; 