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
  TablePagination,
  TableSortLabel,
  Paper,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
} from '@mui/icons-material';
import { formatCurrency } from '@/utils/format';
import { EntityValue } from '@/types/finance';

interface EntityValueTableProps {
  values: EntityValue[];
  title: string;
  onEdit?: (value: EntityValue) => void;
  onDelete?: (value: EntityValue) => void;
}

type SortField = 'recorded_at' | 'value' | 'entity_type' | 'entity_id' | 'scenario_id';
type SortOrder = 'asc' | 'desc';

interface TableState {
  page: number;
  rowsPerPage: number;
  sortBy: SortField;
  sortOrder: SortOrder;
}

export const EntityValueTable: React.FC<EntityValueTableProps> = ({
  values,
  title,
  onEdit,
  onDelete,
}) => {
  const [tableState, setTableState] = React.useState<TableState>({
    page: 0,
    rowsPerPage: 10,
    sortBy: 'recorded_at',
    sortOrder: 'desc',
  });

  // Sort values
  const sortedValues = [...values].sort((a, b) => {
    const aValue = a[tableState.sortBy];
    const bValue = b[tableState.sortBy];

    if (tableState.sortBy === 'recorded_at') {
      return tableState.sortOrder === 'asc'
        ? new Date(aValue).getTime() - new Date(bValue).getTime()
        : new Date(bValue).getTime() - new Date(aValue).getTime();
    }

    if (tableState.sortBy === 'value') {
      return tableState.sortOrder === 'asc'
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    }

    return tableState.sortOrder === 'asc'
      ? String(aValue).localeCompare(String(bValue))
      : String(bValue).localeCompare(String(aValue));
  });

  // Get paginated values
  const paginatedValues = sortedValues.slice(
    tableState.page * tableState.rowsPerPage,
    (tableState.page + 1) * tableState.rowsPerPage
  );

  // Handle sort change
  const handleSort = (field: SortField) => {
    setTableState((prev) => ({
      ...prev,
      sortBy: field,
      sortOrder:
        prev.sortBy === field
          ? prev.sortOrder === 'asc'
            ? 'desc'
            : 'asc'
          : 'asc',
    }));
  };

  // Handle pagination change
  const handleChangePage = (event: unknown, newPage: number) => {
    setTableState((prev) => ({
      ...prev,
      page: newPage,
    }));
  };

  const handleChangeRowsPerPage = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    setTableState((prev) => ({
      ...prev,
      rowsPerPage: parseInt(event.target.value, 10),
      page: 0,
    }));
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          {title} Values
        </Typography>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <TableSortLabel
                    active={tableState.sortBy === 'recorded_at'}
                    direction={tableState.sortOrder}
                    onClick={() => handleSort('recorded_at')}
                  >
                    Date
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={tableState.sortBy === 'entity_type'}
                    direction={tableState.sortOrder}
                    onClick={() => handleSort('entity_type')}
                  >
                    Type
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={tableState.sortBy === 'entity_id'}
                    direction={tableState.sortOrder}
                    onClick={() => handleSort('entity_id')}
                  >
                    Entity ID
                  </TableSortLabel>
                </TableCell>
                <TableCell align="right">
                  <TableSortLabel
                    active={tableState.sortBy === 'value'}
                    direction={tableState.sortOrder}
                    onClick={() => handleSort('value')}
                  >
                    Value
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={tableState.sortBy === 'scenario_id'}
                    direction={tableState.sortOrder}
                    onClick={() => handleSort('scenario_id')}
                  >
                    Scenario
                  </TableSortLabel>
                </TableCell>
                {(onEdit || onDelete) && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {paginatedValues.map((value) => (
                <TableRow key={value.id}>
                  <TableCell>
                    {new Date(value.recorded_at).toLocaleDateString()}
                  </TableCell>
                  <TableCell>{value.entity_type}</TableCell>
                  <TableCell>{value.entity_id}</TableCell>
                  <TableCell align="right">
                    {formatCurrency(value.value)}
                  </TableCell>
                  <TableCell>{value.scenario_id}</TableCell>
                  {(onEdit || onDelete) && (
                    <TableCell>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        {onEdit && (
                          <Tooltip title="Edit">
                            <IconButton
                              size="small"
                              onClick={() => onEdit(value)}
                            >
                              <EditIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                        {onDelete && (
                          <Tooltip title="Delete">
                            <IconButton
                              size="small"
                              onClick={() => onDelete(value)}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                        )}
                      </Box>
                    </TableCell>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25, 50]}
          component="div"
          count={values.length}
          rowsPerPage={tableState.rowsPerPage}
          page={tableState.page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </CardContent>
    </Card>
  );
}; 