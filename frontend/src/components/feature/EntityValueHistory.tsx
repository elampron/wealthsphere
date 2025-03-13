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

interface EntityValueHistoryProps {
  values: EntityValue[];
  title: string;
}

export const EntityValueHistory: React.FC<EntityValueHistoryProps> = ({
  values,
  title,
}) => {
  // Sort values by recorded_at in descending order
  const sortedValues = [...values].sort(
    (a, b) => new Date(b.recorded_at).getTime() - new Date(a.recorded_at).getTime()
  );

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title} Value History
        </Typography>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell>Scenario</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedValues.map((value) => (
                <TableRow key={value.id}>
                  <TableCell>
                    {new Date(value.recorded_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    {formatCurrency(value.value)}
                  </TableCell>
                  <TableCell>{value.scenario.name}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}; 