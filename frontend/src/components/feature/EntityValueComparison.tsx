import React from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
} from '@mui/material';
import { formatCurrency } from '@/utils/format';
import { EntityValue } from '@/types/finance';

interface EntityValueComparisonProps {
  values: EntityValue[];
  title: string;
}

interface ScenarioValue {
  scenarioId: string;
  scenarioName: string;
  value: number;
  recordedAt: string;
}

export const EntityValueComparison: React.FC<EntityValueComparisonProps> = ({
  values,
  title,
}) => {
  // Group values by scenario
  const scenarioValues = values.reduce<Record<string, ScenarioValue>>((acc, value) => {
    // Only keep the most recent value for each scenario
    if (
      !acc[value.scenario_id] ||
      new Date(value.recorded_at) > new Date(acc[value.scenario_id].recordedAt)
    ) {
      acc[value.scenario_id] = {
        scenarioId: value.scenario_id,
        scenarioName: value.scenario_name,
        value: value.value,
        recordedAt: value.recorded_at,
      };
    }
    return acc;
  }, {});

  // Convert to array and sort by value
  const sortedScenarios = Object.values(scenarioValues).sort((a, b) => b.value - a.value);

  // Find the highest value to use as baseline
  const baselineValue = sortedScenarios[0]?.value || 0;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title} Scenario Comparison
        </Typography>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Scenario</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell align="right">Difference</TableCell>
                <TableCell align="right">% Difference</TableCell>
                <TableCell>Last Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedScenarios.map((scenario) => {
                const difference = scenario.value - baselineValue;
                const percentDiff =
                  baselineValue !== 0
                    ? ((scenario.value - baselineValue) / baselineValue) * 100
                    : 0;

                return (
                  <TableRow key={scenario.scenarioId}>
                    <TableCell>{scenario.scenarioName}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(scenario.value)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color:
                          difference === 0
                            ? 'text.primary'
                            : difference > 0
                            ? 'success.main'
                            : 'error.main',
                      }}
                    >
                      {difference === 0
                        ? '-'
                        : formatCurrency(difference)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color:
                          percentDiff === 0
                            ? 'text.primary'
                            : percentDiff > 0
                            ? 'success.main'
                            : 'error.main',
                      }}
                    >
                      {percentDiff === 0
                        ? '-'
                        : `${percentDiff.toFixed(2)}%`}
                    </TableCell>
                    <TableCell>
                      {new Date(scenario.recordedAt).toLocaleDateString()}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}; 