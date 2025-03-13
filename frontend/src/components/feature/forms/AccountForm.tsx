'use client';

import { useState } from 'react';
import { accountsApi } from '@/api/accounts';
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

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: string;
    account_name: string;
    account_type: string;
  };
}

export function AccountForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialData 
}: AccountFormProps) {
  const [formData, setFormData] = useState({
    account_name: initialData?.account_name || '',
    account_type: initialData?.account_type || '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (initialData) {
        await accountsApi.update(initialData.id, formData);
        addToast({
          title: "Success",
          description: "Account updated successfully",
        });
      } else {
        await accountsApi.create(formData);
        addToast({
          title: "Success",
          description: "Account created successfully",
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
          <DialogTitle>{initialData ? 'Edit Investment Account' : 'Add Investment Account'}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Update the details of this investment account.' 
              : 'Add a new investment account to track.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="account_name">Account Name</Label>
            <Input
              id="account_name"
              name="account_name"
              value={formData.account_name}
              onChange={handleChange}
              placeholder="E.g. TD RRSP"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="account_type">Account Type</Label>
            <Select 
              defaultValue={formData.account_type} 
              onValueChange={(value) => handleSelectChange('account_type', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="RRSP">RRSP</SelectItem>
                <SelectItem value="TFSA">TFSA</SelectItem>
                <SelectItem value="Non-Registered">Non-Registered</SelectItem>
                <SelectItem value="RESP">RESP</SelectItem>
                <SelectItem value="RRIF">RRIF</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
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
              {isSubmitting ? "Saving..." : initialData ? "Save Changes" : "Add Account"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 