import React from 'react';
import { Box, Card, CardContent, Typography, Grid } from '@mui/material';
import { formatCurrency } from '@/utils/format';
import { EntityValue } from '@/types/finance';

interface EntityValueStatsProps {
  values: EntityValue[];
  title: string;
}

interface StatItemProps {
  label: string;
  value: string | number;
}

const StatItem: React.FC<StatItemProps> = ({ label, value }) => (
  <Box sx={{ textAlign: 'center', p: 2 }}>
    <Typography variant="body2" color="text.secondary" gutterBottom>
      {label}
    </Typography>
    <Typography variant="h6">{value}</Typography>
  </Box>
);

export const EntityValueStats: React.FC<EntityValueStatsProps> = ({
  values,
  title,
}) => {
  // Calculate statistics
  const currentValue = values.length > 0 ? values[values.length - 1].value : 0;
  const initialValue = values.length > 0 ? values[0].value : 0;
  const absoluteChange = currentValue - initialValue;
  const percentageChange =
    initialValue !== 0 ? (absoluteChange / initialValue) * 100 : 0;

  // Find min and max values
  const minValue = Math.min(...values.map((v) => v.value));
  const maxValue = Math.max(...values.map((v) => v.value));

  // Calculate average value
  const averageValue =
    values.reduce((sum, v) => sum + v.value, 0) / (values.length || 1);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title} Statistics
        </Typography>
        <Grid container spacing={2}>
          <Grid item xs={6} sm={4}>
            <StatItem
              label="Current Value"
              value={formatCurrency(currentValue)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <StatItem
              label="Initial Value"
              value={formatCurrency(initialValue)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <StatItem
              label="Absolute Change"
              value={formatCurrency(absoluteChange)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <StatItem
              label="Percentage Change"
              value={`${percentageChange.toFixed(2)}%`}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <StatItem
              label="Minimum Value"
              value={formatCurrency(minValue)}
            />
          </Grid>
          <Grid item xs={6} sm={4}>
            <StatItem
              label="Maximum Value"
              value={formatCurrency(maxValue)}
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <StatItem
              label="Average Value"
              value={formatCurrency(averageValue)}
            />
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
}; 