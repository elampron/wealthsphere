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
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/utils/format';
import { EntityValue } from '@/types/finance';

interface EntityValueContributionsProps {
  values: EntityValue[];
  title: string;
}

interface ContributionData {
  name: string;
  value: number;
  color: string;
}

const COLORS = [
  '#2196f3',
  '#4caf50',
  '#f44336',
  '#ff9800',
  '#9c27b0',
  '#00bcd4',
  '#795548',
  '#607d8b',
];

export const EntityValueContributions: React.FC<EntityValueContributionsProps> = ({
  values,
  title,
}) => {
  // Group values by entity type and calculate totals
  const contributionsByType = values.reduce<Record<string, number>>((acc, value) => {
    acc[value.entity_type] = (acc[value.entity_type] || 0) + value.value;
    return acc;
  }, {});

  // Transform data for the chart
  const chartData: ContributionData[] = Object.entries(contributionsByType)
    .map(([type, value], index) => ({
      name: type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
      value,
      color: COLORS[index % COLORS.length],
    }))
    .sort((a, b) => b.value - a.value);

  // Calculate total value
  const totalValue = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title} Contributions
        </Typography>
        <Box sx={{ width: '100%', height: 300 }}>
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={chartData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label={({
                  cx,
                  cy,
                  midAngle,
                  innerRadius,
                  outerRadius,
                  value,
                  name,
                }) => {
                  const RADIAN = Math.PI / 180;
                  const radius = 25 + innerRadius + (outerRadius - innerRadius);
                  const x = cx + radius * Math.cos(-midAngle * RADIAN);
                  const y = cy + radius * Math.sin(-midAngle * RADIAN);
                  const percent = ((value / totalValue) * 100).toFixed(1);

                  return percent > 5 ? (
                    <text
                      x={x}
                      y={y}
                      fill="#666"
                      textAnchor={x > cx ? 'start' : 'end'}
                      dominantBaseline="central"
                    >
                      {`${name} (${percent}%)`}
                    </text>
                  ) : null;
                }}
              >
                {chartData.map((entry, index) => (
                  <Cell key={entry.name} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
              />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </Box>
        <TableContainer component={Paper} sx={{ mt: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Type</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell align="right">Percentage</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {chartData.map((item) => {
                const percentage = (item.value / totalValue) * 100;
                return (
                  <TableRow key={item.name}>
                    <TableCell
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <Box
                        sx={{
                          width: 16,
                          height: 16,
                          borderRadius: '50%',
                          backgroundColor: item.color,
                        }}
                      />
                      {item.name}
                    </TableCell>
                    <TableCell align="right">
                      {formatCurrency(item.value)}
                    </TableCell>
                    <TableCell align="right">
                      {percentage.toFixed(1)}%
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Total</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  {formatCurrency(totalValue)}
                </TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                  100%
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}; 