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
} from '@mui/material';
import {
  Upload as UploadIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { formatCurrency } from '@/utils/format';
import { EntityValue } from '@/types/finance';

interface EntityValueImportProps {
  title: string;
  onImport: (data: EntityValue[], options: ImportOptions) => Promise<void>;
}

interface ImportOptions {
  format: 'csv' | 'json' | 'excel';
  fieldMapping: Record<string, string>;
  defaultScenarioId?: string;
  skipValidation?: boolean;
  updateExisting?: boolean;
}

interface ImportPreview {
  totalRecords: number;
  validRecords: number;
  invalidRecords: number;
  errors: string[];
  preview: EntityValue[];
}

const REQUIRED_FIELDS = ['entity_type', 'entity_id', 'value', 'recorded_at'];

export const EntityValueImport: React.FC<EntityValueImportProps> = ({
  title,
  onImport,
}) => {
  const [file, setFile] = React.useState<File | null>(null);
  const [importOptions, setImportOptions] = React.useState<ImportOptions>({
    format: 'csv',
    fieldMapping: {},
    skipValidation: false,
    updateExisting: false,
  });
  const [preview, setPreview] = React.useState<ImportPreview | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = React.useState(false);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      // Auto-detect format from file extension
      const extension = selectedFile.name.split('.').pop()?.toLowerCase();
      if (extension === 'csv' || extension === 'json' || extension === 'xlsx') {
        setImportOptions((prev) => ({
          ...prev,
          format: extension === 'xlsx' ? 'excel' : (extension as 'csv' | 'json'),
        }));
      }
    }
  };

  const handleImport = async () => {
    if (!file || !preview) return;

    try {
      setIsLoading(true);
      setError(null);
      await onImport(preview.preview, importOptions);
      // Reset form after successful import
      setFile(null);
      setPreview(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title} Import
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <input
              type="file"
              accept=".csv,.json,.xlsx"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
              ref={fileInputRef}
            />
            <Button
              variant="outlined"
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
            >
              Select File
            </Button>
            {file && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                Selected file: {file.name}
              </Typography>
            )}
          </Grid>
          <Grid item xs={12} sm={6}>
            <FormControl fullWidth>
              <InputLabel id="format-label">File Format</InputLabel>
              <Select
                labelId="format-label"
                value={importOptions.format}
                label="File Format"
                onChange={(e) =>
                  setImportOptions((prev) => ({
                    ...prev,
                    format: e.target.value as 'csv' | 'json' | 'excel',
                  }))
                }
                disabled={isLoading}
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
              disabled={isLoading}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>
          </Grid>
          {showAdvanced && (
            <>
              <Grid item xs={12}>
                <Typography variant="subtitle2" gutterBottom>
                  Field Mapping
                </Typography>
                {REQUIRED_FIELDS.map((field) => (
                  <TextField
                    key={field}
                    label={`${field} Column`}
                    value={importOptions.fieldMapping[field] || ''}
                    onChange={(e) =>
                      setImportOptions((prev) => ({
                        ...prev,
                        fieldMapping: {
                          ...prev.fieldMapping,
                          [field]: e.target.value,
                        },
                      }))
                    }
                    fullWidth
                    margin="normal"
                    disabled={isLoading}
                  />
                ))}
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Default Scenario ID"
                  value={importOptions.defaultScenarioId || ''}
                  onChange={(e) =>
                    setImportOptions((prev) => ({
                      ...prev,
                      defaultScenarioId: e.target.value,
                    }))
                  }
                  disabled={isLoading}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl component="fieldset">
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={importOptions.skipValidation}
                        onChange={(e) =>
                          setImportOptions((prev) => ({
                            ...prev,
                            skipValidation: e.target.checked,
                          }))
                        }
                        disabled={isLoading}
                      />
                    }
                    label="Skip Validation"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={importOptions.updateExisting}
                        onChange={(e) =>
                          setImportOptions((prev) => ({
                            ...prev,
                            updateExisting: e.target.checked,
                          }))
                        }
                        disabled={isLoading}
                      />
                    }
                    label="Update Existing Records"
                  />
                </FormControl>
              </Grid>
            </>
          )}
          {preview && (
            <Grid item xs={12}>
              <Alert
                severity={preview.invalidRecords > 0 ? 'warning' : 'success'}
                sx={{ mb: 2 }}
              >
                <AlertTitle>Import Preview</AlertTitle>
                <Typography variant="body2">
                  Total Records: {preview.totalRecords}
                </Typography>
                <Typography variant="body2">
                  Valid Records: {preview.validRecords}
                </Typography>
                {preview.invalidRecords > 0 && (
                  <Typography variant="body2" color="error">
                    Invalid Records: {preview.invalidRecords}
                  </Typography>
                )}
              </Alert>
              {preview.errors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  <AlertTitle>Validation Errors</AlertTitle>
                  <ul>
                    {preview.errors.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </Alert>
              )}
            </Grid>
          )}
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
                startIcon={<UploadIcon />}
                onClick={handleImport}
                disabled={!file || isLoading || !preview?.validRecords}
              >
                Import Data
              </Button>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}; 