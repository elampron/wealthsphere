'use client';

import React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Asset } from '@/types/finance';
import { FamilyMember } from '@/types/family';
import { assetsApi, AssetTypeEnum } from '@/api/assets';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';

interface AssetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  familyMembers: FamilyMember[];
  isLoading?: boolean;
}

export const AssetForm: React.FC<AssetFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  familyMembers,
  isLoading = false,
}) => {
  const {
    control,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    defaultValues: {
      name: initialData?.name || '',
      asset_type: initialData?.asset_type || '',
      initial_value: initialData?.initial_value || 0,
      purchase_value: initialData?.purchase_value || 0,
      purchase_date: initialData?.purchase_date || '',
      expected_annual_appreciation: initialData?.expected_annual_appreciation || 0,
      is_primary_residence: initialData?.is_primary_residence || false,
      notes: initialData?.notes || '',
      family_member_id: initialData?.family_member_id || familyMembers[0]?.id,
    },
  });
  const { addToast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setValue(name, type === 'number' ? (value === '' ? 0 : parseFloat(value)) : value);
  };

  const handleSelectChange = (name: string, value: string) => {
    setValue(name, value);
  };

  const handleSubmitForm = async (data: any) => {
    try {
      if (initialData) {
        await assetsApi.updateAsset(initialData.id, data);
        addToast({
          title: "Success",
          description: "Asset updated successfully",
        });
      } else {
        await assetsApi.createAsset({
          ...data,
          expected_annual_appreciation: 0,
        });
        addToast({
          title: "Success",
          description: "Asset created successfully",
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error submitting form:', error);
      addToast({
        title: "Error",
        description: "Failed to save asset",
        variant: "destructive",
      });
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
        
        <form onSubmit={handleSubmit(handleSubmitForm)} className="space-y-4 py-4">
          <Controller
            name="name"
            control={control}
            rules={{ required: 'Name is required' }}
            render={({ field }) => (
              <FormField
                control={control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Name</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          />

          <Controller
            name="asset_type"
            control={control}
            rules={{ required: 'Asset type is required' }}
            render={({ field }) => (
              <FormField
                control={control}
                name="asset_type"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Asset Type</FormLabel>
                    <FormControl>
                      <Select {...field}>
                        <SelectTrigger>
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
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          />

          <Controller
            name="initial_value"
            control={control}
            rules={{ min: { value: 0, message: 'Initial value must be positive' } }}
            render={({ field }) => (
              <FormField
                control={control}
                name="initial_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Initial Value</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          />

          <Controller
            name="purchase_value"
            control={control}
            rules={{ min: { value: 0, message: 'Purchase value must be positive' } }}
            render={({ field }) => (
              <FormField
                control={control}
                name="purchase_value"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Value (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          />

          <Controller
            name="purchase_date"
            control={control}
            render={({ field }) => (
              <FormField
                control={control}
                name="purchase_date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Purchase Date (optional)</FormLabel>
                    <FormControl>
                      <Input {...field} type="date" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          />

          <Controller
            name="expected_annual_appreciation"
            control={control}
            rules={{
              validate: value => (value >= -1 && value <= 1) || 'Appreciation rate must be between -100% and 100%'
            }}
            render={({ field }) => (
              <FormField
                control={control}
                name="expected_annual_appreciation"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Expected Annual Appreciation Rate (%)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" step={0.01} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          />

          <Controller
            name="is_primary_residence"
            control={control}
            render={({ field }) => (
              <FormField
                control={control}
                name="is_primary_residence"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Is Primary Residence</FormLabel>
                    <FormControl>
                      <Switch {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          />

          <Controller
            name="notes"
            control={control}
            render={({ field }) => (
              <FormField
                control={control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes</FormLabel>
                    <FormControl>
                      <Textarea {...field} rows={3} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          />

          <Controller
            name="family_member_id"
            control={control}
            rules={{ required: 'Family member is required' }}
            render={({ field }) => (
              <FormField
                control={control}
                name="family_member_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Owner</FormLabel>
                    <FormControl>
                      <Select {...field}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select owner" />
                        </SelectTrigger>
                        <SelectContent>
                          {familyMembers.map((member) => (
                            <SelectItem key={member.id.toString()} value={member.id.toString()}>
                              {member.first_name} {member.last_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}
          />

          <div className="flex justify-end gap-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isLoading}
            >
              {initialData ? 'Update Asset' : 'Create Asset'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AssetForm; 