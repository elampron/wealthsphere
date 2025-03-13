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
  Collapse,
  IconButton,
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
} from '@mui/icons-material';
import { formatCurrency } from '@/utils/format';
import { EntityValue } from '@/types/finance';

interface EntityValueBreakdownProps {
  values: EntityValue[];
  title: string;
}

interface BreakdownRow {
  id: string;
  name: string;
  type: string;
  value: number;
  children?: BreakdownRow[];
}

interface BreakdownRowProps {
  row: BreakdownRow;
  level: number;
}

const BreakdownTableRow: React.FC<BreakdownRowProps> = ({ row, level }) => {
  const [open, setOpen] = React.useState(false);
  const hasChildren = row.children && row.children.length > 0;

  return (
    <>
      <TableRow>
        <TableCell
          sx={{
            pl: level * 4,
            display: 'flex',
            alignItems: 'center',
            gap: 1,
          }}
        >
          {hasChildren && (
            <IconButton
              size="small"
              onClick={() => setOpen(!open)}
              sx={{ mr: 1 }}
            >
              {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
            </IconButton>
          )}
          {row.name}
        </TableCell>
        <TableCell>{row.type}</TableCell>
        <TableCell align="right">{formatCurrency(row.value)}</TableCell>
        <TableCell align="right">
          {hasChildren
            ? `${((row.value / row.children.reduce((sum, child) => sum + child.value, 0)) * 100).toFixed(1)}%`
            : '-'}
        </TableCell>
      </TableRow>
      {hasChildren && (
        <TableRow>
          <TableCell
            style={{ paddingBottom: 0, paddingTop: 0 }}
            colSpan={4}
          >
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ my: 2 }}>
                <Table size="small">
                  <TableBody>
                    {row.children.map((childRow) => (
                      <BreakdownTableRow
                        key={childRow.id}
                        row={childRow}
                        level={level + 1}
                      />
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export const EntityValueBreakdown: React.FC<EntityValueBreakdownProps> = ({
  values,
  title,
}) => {
  // Group values by entity type and entity
  const breakdownData = values.reduce<Record<string, BreakdownRow>>((acc, value) => {
    const entityKey = `${value.entity_type}-${value.entity_id}`;
    
    if (!acc[entityKey]) {
      acc[entityKey] = {
        id: entityKey,
        name: value.entity_name,
        type: value.entity_type,
        value: value.value,
        children: [],
      };
    }
    
    return acc;
  }, {});

  // Convert to array and sort by value
  const sortedBreakdown = Object.values(breakdownData).sort((a, b) => b.value - a.value);

  // Calculate total value
  const totalValue = sortedBreakdown.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title} Breakdown
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          Total Value: {formatCurrency(totalValue)}
        </Typography>
        <TableContainer component={Paper} sx={{ mt: 2 }}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell align="right">Value</TableCell>
                <TableCell align="right">% of Parent</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedBreakdown.map((row) => (
                <BreakdownTableRow key={row.id} row={row} level={0} />
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
}; 