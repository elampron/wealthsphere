import React, { useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { formatCurrency } from '@/utils/format';
import { EntityValue } from '@/types/finance';

interface EntityValueDisplayProps {
  value: EntityValue;
  onUpdateValue: (value: number) => Promise<void>;
}

interface UpdateValueFormData {
  value: number;
}

export const EntityValueDisplay: React.FC<EntityValueDisplayProps> = ({
  value,
  onUpdateValue,
}) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateValueFormData>({
    defaultValues: {
      value: value.value,
    },
  });

  const handleOpenDialog = () => {
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
  };

  const handleUpdateValue = async (data: UpdateValueFormData) => {
    try {
      await onUpdateValue(data.value);
      handleCloseDialog();
    } catch (error) {
      console.error('Failed to update value:', error);
    }
  };

  return (
    <>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 1,
        }}
      >
        <Typography variant="body1">{formatCurrency(value.value)}</Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={handleOpenDialog}
          sx={{ ml: 2 }}
        >
          Update Value
        </Button>
      </Box>

      <Dialog open={isDialogOpen} onClose={handleCloseDialog}>
        <DialogTitle>Update Value</DialogTitle>
        <form onSubmit={handleSubmit(handleUpdateValue)}>
          <DialogContent>
            <Controller
              name="value"
              control={control}
              rules={{
                required: 'Value is required',
                min: { value: 0, message: 'Value must be positive' },
              }}
              render={({ field }) => (
                <TextField
                  {...field}
                  label="Value"
                  type="number"
                  fullWidth
                  error={!!errors.value}
                  helperText={errors.value?.message}
                  InputProps={{ inputProps: { min: 0, step: 0.01 } }}
                />
              )}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button type="submit" variant="contained" color="primary">
              Update
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
}; 