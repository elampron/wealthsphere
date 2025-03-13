import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Divider,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { formatCurrency } from '@/utils/format';
import { EntityValue } from '@/types/finance';

interface EntityValueSummaryProps {
  values: EntityValue[];
  title: string;
}

interface SummaryMetric {
  label: string;
  value: string | number;
  tooltip?: string;
  trend?: {
    direction: 'up' | 'down' | 'none';
    value: string;
  };
}

export const EntityValueSummary: React.FC<EntityValueSummaryProps> = ({
  values,
  title,
}) => {
  // Sort values by date
  const sortedValues = [...values].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  // Calculate metrics
  const currentValue = sortedValues[sortedValues.length - 1]?.value || 0;
  const previousValue = sortedValues[sortedValues.length - 2]?.value || 0;
  const absoluteChange = currentValue - previousValue;
  const percentageChange = previousValue !== 0 ? (absoluteChange / previousValue) * 100 : 0;

  // Calculate average monthly change
  const monthlyChanges: number[] = [];
  for (let i = 1; i < sortedValues.length; i++) {
    const current = sortedValues[i];
    const previous = sortedValues[i - 1];
    const monthsDiff =
      (new Date(current.recorded_at).getTime() - new Date(previous.recorded_at).getTime()) /
      (1000 * 60 * 60 * 24 * 30.44); // Average month length
    const change = (current.value - previous.value) / monthsDiff;
    monthlyChanges.push(change);
  }
  const averageMonthlyChange =
    monthlyChanges.length > 0
      ? monthlyChanges.reduce((sum, change) => sum + change, 0) / monthlyChanges.length
      : 0;

  const metrics: SummaryMetric[] = [
    {
      label: 'Current Value',
      value: formatCurrency(currentValue),
      tooltip: 'The most recent recorded value',
    },
    {
      label: 'Change',
      value: formatCurrency(Math.abs(absoluteChange)),
      tooltip: 'Change from the previous recorded value',
      trend: {
        direction: absoluteChange > 0 ? 'up' : absoluteChange < 0 ? 'down' : 'none',
        value: `${Math.abs(percentageChange).toFixed(1)}%`,
      },
    },
    {
      label: 'Average Monthly Change',
      value: formatCurrency(averageMonthlyChange),
      tooltip: 'Average change in value per month',
      trend: {
        direction: averageMonthlyChange > 0 ? 'up' : averageMonthlyChange < 0 ? 'down' : 'none',
        value: formatCurrency(Math.abs(averageMonthlyChange)),
      },
    },
    {
      label: 'Number of Records',
      value: values.length,
      tooltip: 'Total number of value records',
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title} Summary
        </Typography>
        <Grid container spacing={3}>
          {metrics.map((metric, index) => (
            <React.Fragment key={metric.label}>
              <Grid item xs={12} sm={6} md={3}>
                <Box sx={{ textAlign: 'center', p: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      {metric.label}
                    </Typography>
                    {metric.tooltip && (
                      <Tooltip title={metric.tooltip}>
                        <IconButton size="small">
                          <InfoIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Box>
                  <Typography variant="h5" component="div" gutterBottom>
                    {metric.value}
                  </Typography>
                  {metric.trend && (
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 0.5,
                        color:
                          metric.trend.direction === 'up'
                            ? 'success.main'
                            : metric.trend.direction === 'down'
                            ? 'error.main'
                            : 'text.secondary',
                      }}
                    >
                      {metric.trend.direction === 'up' ? (
                        <TrendingUpIcon fontSize="small" />
                      ) : metric.trend.direction === 'down' ? (
                        <TrendingDownIcon fontSize="small" />
                      ) : null}
                      <Typography variant="body2">{metric.trend.value}</Typography>
                    </Box>
                  )}
                </Box>
              </Grid>
              {index < metrics.length - 1 && (
                <Grid item xs={12} sx={{ display: { xs: 'block', sm: 'none' } }}>
                  <Divider />
                </Grid>
              )}
            </React.Fragment>
          ))}
        </Grid>
      </CardContent>
    </Card>
  );
}; 