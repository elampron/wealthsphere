import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Alert,
  AlertTitle,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { formatCurrency } from '@/utils/format';
import { EntityValue } from '@/types/finance';

interface EntityValueAlertsProps {
  values: EntityValue[];
  title: string;
  thresholds: {
    significantChange: number;
    warningThreshold: number;
    criticalThreshold: number;
  };
}

interface ValueAlert {
  type: 'success' | 'info' | 'warning' | 'error';
  title: string;
  message: string;
  icon: React.ReactNode;
}

export const EntityValueAlerts: React.FC<EntityValueAlertsProps> = ({
  values,
  title,
  thresholds,
}) => {
  // Sort values by date
  const sortedValues = [...values].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  const alerts: ValueAlert[] = [];

  if (sortedValues.length >= 2) {
    const currentValue = sortedValues[sortedValues.length - 1].value;
    const previousValue = sortedValues[sortedValues.length - 2].value;
    const absoluteChange = currentValue - previousValue;
    const percentageChange = (absoluteChange / previousValue) * 100;

    // Check for significant changes
    if (Math.abs(percentageChange) >= thresholds.significantChange) {
      alerts.push({
        type: percentageChange > 0 ? 'success' : 'info',
        title: percentageChange > 0 ? 'Significant Increase' : 'Significant Decrease',
        message: `Value has ${
          percentageChange > 0 ? 'increased' : 'decreased'
        } by ${Math.abs(percentageChange).toFixed(1)}% (${formatCurrency(
          Math.abs(absoluteChange)
        )})`,
        icon: percentageChange > 0 ? <TrendingUpIcon /> : <TrendingDownIcon />,
      });
    }

    // Check for warning threshold
    if (currentValue <= thresholds.warningThreshold) {
      alerts.push({
        type: 'warning',
        title: 'Warning Threshold',
        message: `Current value (${formatCurrency(
          currentValue
        )}) is below the warning threshold (${formatCurrency(
          thresholds.warningThreshold
        )})`,
        icon: <WarningIcon />,
      });
    }

    // Check for critical threshold
    if (currentValue <= thresholds.criticalThreshold) {
      alerts.push({
        type: 'error',
        title: 'Critical Threshold',
        message: `Current value (${formatCurrency(
          currentValue
        )}) is below the critical threshold (${formatCurrency(
          thresholds.criticalThreshold
        )})`,
        icon: <WarningIcon />,
      });
    }
  }

  // Add info alert if no data points for comparison
  if (sortedValues.length < 2) {
    alerts.push({
      type: 'info',
      title: 'Insufficient Data',
      message: 'At least two data points are required for trend analysis',
      icon: <InfoIcon />,
    });
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title} Alerts
        </Typography>
        {alerts.length === 0 ? (
          <Alert severity="success">
            <AlertTitle>All Clear</AlertTitle>
            No alerts to display at this time
          </Alert>
        ) : (
          <List>
            {alerts.map((alert, index) => (
              <ListItem key={index}>
                <Alert
                  severity={alert.type}
                  icon={alert.icon}
                  sx={{ width: '100%' }}
                >
                  <AlertTitle>{alert.title}</AlertTitle>
                  {alert.message}
                </Alert>
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
}; 