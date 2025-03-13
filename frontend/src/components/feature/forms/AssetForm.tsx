'use client';

import { useState } from 'react';
import { assetApi, AssetTypeEnum } from '@/api/assets';
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

interface AssetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: number;
    name: string;
    asset_type: string;
    current_value: number;
  };
}

export function AssetForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialData 
}: AssetFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    asset_type: initialData?.asset_type || '',
    current_value: initialData?.current_value || 0,
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
        await assetApi.update(initialData.id, formData);
        addToast({
          title: "Success",
          description: "Asset updated successfully",
        });
      } else {
        await assetApi.create({
          ...formData,
          expected_annual_appreciation: 0,
          is_primary_residence: false,
        });
        addToast({
          title: "Success",
          description: "Asset created successfully",
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
          <DialogTitle>{initialData ? 'Edit Asset' : 'Add Asset'}</DialogTitle>
          <DialogDescription>
            {initialData 
              ? 'Update the details of this asset.' 
              : 'Add a new asset to track.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Asset Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="E.g. House, Car, etc."
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="asset_type">Asset Type</Label>
            <Select 
              defaultValue={formData.asset_type} 
              onValueChange={(value) => handleSelectChange('asset_type', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select asset type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={AssetTypeEnum.PRIMARY_RESIDENCE}>Primary Residence</SelectItem>
                <SelectItem value={AssetTypeEnum.SECONDARY_PROPERTY}>Secondary Property</SelectItem>
                <SelectItem value={AssetTypeEnum.BUSINESS}>Business</SelectItem>
                <SelectItem value={AssetTypeEnum.VEHICLE}>Vehicle</SelectItem>
                <SelectItem value={AssetTypeEnum.OTHER}>Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="current_value">Current Value</Label>
            <Input
              id="current_value"
              name="current_value"
              type="number"
              min="0"
              step="100"
              value={formData.current_value}
              onChange={handleChange}
              required
            />
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
              {isSubmitting ? "Saving..." : initialData ? "Save Changes" : "Add Asset"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 