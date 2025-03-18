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
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

interface AssetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: any;
  familyMembers: FamilyMember[];
  isLoading?: boolean;
}

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  asset_type: z.string().min(1, 'Asset type is required'),
  initial_value: z.string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= 0, 'Initial value must be a positive number'),
  purchase_value: z.string()
    .transform((val) => val === '' ? undefined : Number(val))
    .refine((val) => val === undefined || (!isNaN(val) && val >= 0), 'Purchase value must be a positive number')
    .optional(),
  purchase_date: z.string().optional(),
  expected_annual_appreciation: z.string()
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val) && val >= -100 && val <= 100, 'Appreciation rate must be between -100% and 100%'),
  is_primary_residence: z.boolean(),
  notes: z.string().optional(),
  family_member_id: z.string().min(1, 'Owner is required'),
});

type FormValues = z.infer<typeof formSchema>;

export const AssetForm: React.FC<AssetFormProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  familyMembers,
  isLoading = false,
}) => {
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: initialData?.name || '',
      asset_type: initialData?.asset_type || '',
      initial_value: initialData?.initial_value?.toString() || '0',
      purchase_value: initialData?.purchase_value?.toString() || '0',
      purchase_date: initialData?.purchase_date || '',
      expected_annual_appreciation: initialData?.expected_annual_appreciation?.toString() || '0',
      is_primary_residence: initialData?.is_primary_residence || false,
      notes: initialData?.notes || '',
      family_member_id: initialData?.family_member_id?.toString() || familyMembers[0]?.id?.toString(),
    },
  });

  const {
    control,
    handleSubmit,
  } = form;
  const { addToast } = useToast();

  const handleSubmitForm = async (data: FormValues) => {
    try {
      const formattedData = {
        name: data.name,
        asset_type: data.asset_type,
        initial_value: data.initial_value,
        purchase_value: data.purchase_value,
        purchase_date: data.purchase_date,
        expected_return_rate: data.expected_annual_appreciation,
        notes: data.notes,
        family_member_id: parseInt(data.family_member_id),
        is_primary_residence: data.is_primary_residence,
      };

      if (initialData) {
        await assetsApi.updateAsset(initialData.id, formattedData);
        addToast({
          title: "Success",
          description: "Asset updated successfully",
        });
      } else {
        await assetsApi.createAsset(formattedData);
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
        
        <Form {...form}>
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
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
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
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
                        <Select
                          onValueChange={field.onChange}
                          value={field.value}
                          defaultValue={field.value}
                        >
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
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default AssetForm; 