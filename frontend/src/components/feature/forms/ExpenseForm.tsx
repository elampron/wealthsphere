'use client';

import { useState } from 'react';
import { expenseApi, ExpenseTypeEnum } from '@/api/expenses';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: number;
    name: string;
    expense_type: string;
    amount: number;
    category: string;
  };
}

export function ExpenseForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialData 
}: ExpenseFormProps) {
  const currentYear = new Date().getFullYear();
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    expense_type: initialData?.expense_type || '',
    amount: initialData?.amount || 0,
    category: initialData?.category || '',
    start_year: currentYear,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (initialData) {
        await expenseApi.update(initialData.id, formData);
        addToast({
          title: "Success",
          description: "Expense updated successfully",
        });
      } else {
        await expenseApi.create(formData);
        addToast({
          title: "Success",
          description: "Expense created successfully",
        });
      }
      onSuccess();
      onClose();
    } catch (err) {
      addToast({
        title: "Error",
        description: err instanceof Error ? err.message : "Operation failed",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Update the details of this expense.' 
              : 'Add a new expense to track.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Expense Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="E.g. Rent, Utilities, etc."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="expense_type">Expense Type</Label>
            <Select 
              defaultValue={formData.expense_type} 
              onValueChange={(value) => handleSelectChange('expense_type', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select expense type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ExpenseTypeEnum.HOUSING}>Housing</SelectItem>
                <SelectItem value={ExpenseTypeEnum.TRANSPORTATION}>Transportation</SelectItem>
                <SelectItem value={ExpenseTypeEnum.FOOD}>Food</SelectItem>
                <SelectItem value={ExpenseTypeEnum.UTILITIES}>Utilities</SelectItem>
                <SelectItem value={ExpenseTypeEnum.HEALTHCARE}>Healthcare</SelectItem>
                <SelectItem value={ExpenseTypeEnum.INSURANCE}>Insurance</SelectItem>
                <SelectItem value={ExpenseTypeEnum.ENTERTAINMENT}>Entertainment</SelectItem>
                <SelectItem value={ExpenseTypeEnum.TRAVEL}>Travel</SelectItem>
                <SelectItem value={ExpenseTypeEnum.EDUCATION}>Education</SelectItem>
                <SelectItem value={ExpenseTypeEnum.SPECIAL}>Special</SelectItem>
                <SelectItem value={ExpenseTypeEnum.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select 
              defaultValue={formData.category} 
              onValueChange={(value) => handleSelectChange('category', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Monthly">Monthly</SelectItem>
                <SelectItem value="Annual">Annual</SelectItem>
                <SelectItem value="One-time">One-time</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : initialData ? "Save Changes" : "Add Expense"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 