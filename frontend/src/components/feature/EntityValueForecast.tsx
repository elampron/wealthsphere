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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { formatCurrency } from '@/utils/format';
import { EntityValue } from '@/types/finance';

interface EntityValueForecastProps {
  values: EntityValue[];
  title: string;
  growthRate: number;
  yearsToForecast: number;
}

interface ForecastPoint {
  date: string;
  actual: number;
  forecast: number;
}

export const EntityValueForecast: React.FC<EntityValueForecastProps> = ({
  values,
  title,
  growthRate,
  yearsToForecast,
}) => {
  // Sort values by date
  const sortedValues = [...values].sort(
    (a, b) => new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
  );

  // Get the most recent value
  const latestValue = sortedValues[sortedValues.length - 1]?.value || 0;
  const latestDate = sortedValues[sortedValues.length - 1]?.recorded_at
    ? new Date(sortedValues[sortedValues.length - 1].recorded_at)
    : new Date();

  // Generate forecast data
  const forecastData: ForecastPoint[] = [];
  const monthlyRate = Math.pow(1 + growthRate, 1 / 12) - 1;

  // Add historical data
  sortedValues.forEach((value) => {
    forecastData.push({
      date: new Date(value.recorded_at).toLocaleDateString(),
      actual: value.value,
      forecast: 0,
    });
  });

  // Add forecast data
  let currentValue = latestValue;
  const forecastMonths = yearsToForecast * 12;
  
  for (let i = 1; i <= forecastMonths; i++) {
    const forecastDate = new Date(latestDate);
    forecastDate.setMonth(forecastDate.getMonth() + i);
    
    currentValue = currentValue * (1 + monthlyRate);
    
    forecastData.push({
      date: forecastDate.toLocaleDateString(),
      actual: 0,
      forecast: currentValue,
    });
  }

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title} Value Forecast
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Projected growth rate: {(growthRate * 100).toFixed(2)}% per year
        </Typography>
        <Box sx={{ width: '100%', height: 400, mt: 2 }}>
          <ResponsiveContainer>
            <LineChart data={forecastData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="date"
                interval={Math.floor(forecastData.length / 6)}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis tickFormatter={(value) => formatCurrency(value)} />
              <Tooltip
                formatter={(value) => formatCurrency(Number(value))}
                labelFormatter={(label) => `Date: ${label}`}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="actual"
                name="Actual Value"
                stroke="#2196f3"
                strokeWidth={2}
                dot={{ r: 4 }}
              />
              <Line
                type="monotone"
                dataKey="forecast"
                name="Forecast Value"
                stroke="#4caf50"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </Box>
        <TableContainer component={Paper} sx={{ mt: 4 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Forecast Period</TableCell>
                <TableCell align="right">Projected Value</TableCell>
                <TableCell align="right">Growth from Current</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {[1, 2, 5, 10].map((year) => {
                if (year > yearsToForecast) return null;
                const yearIndex = year * 12;
                const projectedValue = forecastData[forecastData.length - yearIndex]?.forecast || 0;
                const growth = projectedValue - latestValue;
                const growthPercent = (growth / latestValue) * 100;

                return (
                  <TableRow key={year}>
                    <TableCell>{year} Year{year > 1 ? 's' : ''}</TableCell>
                    <TableCell align="right">
                      {formatCurrency(projectedValue)}
                    </TableCell>
                    <TableCell
                      align="right"
                      sx={{
                        color: growth >= 0 ? 'success.main' : 'error.main',
                      }}
                    >
                      {formatCurrency(growth)} ({growthPercent.toFixed(2)}%)
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