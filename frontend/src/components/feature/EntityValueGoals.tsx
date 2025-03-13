import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Chip,
} from '@mui/material';
import { formatCurrency } from '@/utils/format';
import { EntityValue } from '@/types/finance';

interface EntityValueGoalsProps {
  values: EntityValue[];
  title: string;
  goals: {
    shortTerm: number;
    mediumTerm: number;
    longTerm: number;
  };
}

interface GoalProgress {
  label: string;
  target: number;
  progress: number;
  color: 'primary' | 'secondary' | 'success' | 'warning' | 'error';
  status: string;
}

export const EntityValueGoals: React.FC<EntityValueGoalsProps> = ({
  values,
  title,
  goals,
}) => {
  // Get the current value
  const currentValue = values.length > 0 ? values[values.length - 1].value : 0;

  // Calculate progress for each goal
  const goalProgress: GoalProgress[] = [
    {
      label: 'Short Term Goal',
      target: goals.shortTerm,
      progress: (currentValue / goals.shortTerm) * 100,
      color: 'primary',
      status: currentValue >= goals.shortTerm ? 'Achieved' : 'In Progress',
    },
    {
      label: 'Medium Term Goal',
      target: goals.mediumTerm,
      progress: (currentValue / goals.mediumTerm) * 100,
      color: 'secondary',
      status: currentValue >= goals.mediumTerm ? 'Achieved' : 'In Progress',
    },
    {
      label: 'Long Term Goal',
      target: goals.longTerm,
      progress: (currentValue / goals.longTerm) * 100,
      color: 'warning',
      status: currentValue >= goals.longTerm ? 'Achieved' : 'In Progress',
    },
  ];

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title} Goals
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Current Value: {formatCurrency(currentValue)}
        </Typography>
        <List>
          {goalProgress.map((goal) => (
            <ListItem
              key={goal.label}
              sx={{
                flexDirection: 'column',
                alignItems: 'stretch',
                gap: 1,
                py: 2,
              }}
            >
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <ListItemText
                  primary={goal.label}
                  secondary={`Target: ${formatCurrency(goal.target)}`}
                />
                <Chip
                  label={goal.status}
                  color={goal.status === 'Achieved' ? 'success' : 'default'}
                  size="small"
                />
              </Box>
              <Box sx={{ width: '100%', position: 'relative' }}>
                <LinearProgress
                  variant="determinate"
                  value={Math.min(goal.progress, 100)}
                  color={goal.color}
                  sx={{ height: 8, borderRadius: 4 }}
                />
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    position: 'absolute',
                    right: 0,
                    top: -20,
                    fontSize: '0.75rem',
                  }}
                >
                  {goal.progress.toFixed(1)}%
                </Typography>
              </Box>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  mt: 1,
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                }}
              >
                <Typography variant="body2">
                  Remaining: {formatCurrency(Math.max(goal.target - currentValue, 0))}
                </Typography>
                {goal.progress >= 100 && (
                  <Typography variant="body2" color="success.main">
                    Exceeded by:{' '}
                    {formatCurrency(Math.max(currentValue - goal.target, 0))}
                  </Typography>
                )}
              </Box>
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}; 