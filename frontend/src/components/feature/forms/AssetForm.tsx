'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Sheet, 
  SheetContent, 
  SheetDescription, 
  SheetHeader, 
  SheetTitle, 
  SheetFooter 
} from "@/components/ui/sheet";
import { 
  AssetCreate, 
  AssetUpdate, 
  AssetTypeEnum,
  assetApi
} from "@/api/assets";
import { useToast } from "@/components/ui/use-toast";

interface AssetFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: number;
    name: string;
    asset_type: string;
    current_value: number;
    purchase_value?: number | null;
    purchase_date?: string | null;
    expected_annual_appreciation: number;
    is_primary_residence: boolean;
    notes?: string | null;
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
    purchase_value: initialData?.purchase_value || null,
    purchase_date: initialData?.purchase_date || null,
    expected_annual_appreciation: initialData?.expected_annual_appreciation ?? 0,
    is_primary_residence: initialData?.is_primary_residence || false,
    notes: initialData?.notes || ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    
    if (name === 'current_value' || name === 'purchase_value') {
      // For currency values
      const numValue = parseFloat(value);
      setFormData(prev => ({
        ...prev,
        [name]: isNaN(numValue) ? 0 : numValue
      }));
    } else {
      // For non-numeric fields
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || null
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    console.log("Form data before submission:", formData);

    try {
      // Ensure we're sending valid numeric values with proper field names for the backend
      const dataToSend = {
        name: formData.name,
        asset_type: formData.asset_type,
        current_value: typeof formData.current_value === 'number' ? formData.current_value : 0,
        purchase_value: formData.purchase_value,
        purchase_date: formData.purchase_date,
        expected_annual_appreciation: typeof formData.expected_annual_appreciation === 'number' 
          ? formData.expected_annual_appreciation 
          : 0,
        is_primary_residence: formData.is_primary_residence,
        notes: formData.notes || null
      };
      
      console.log("Submitting asset data to API:", dataToSend);

      // Call API to create or update asset
      if (initialData) {
        const updatedAsset = await assetApi.update(initialData.id, dataToSend);
        console.log("Updated asset response:", updatedAsset);
      } else {
        const newAsset = await assetApi.create(dataToSend);
        console.log("New asset response:", newAsset);
      }

      toast({
        title: initialData ? "Asset Updated" : "Asset Created",
        description: `${formData.name} has been ${initialData ? "updated" : "created"} successfully.`
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save asset:", error);
      toast({
        title: "Error",
        description: `Failed to ${initialData ? "update" : "create"} asset. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg">
        <SheetHeader>
          <SheetTitle>{initialData ? "Edit Asset" : "Add New Asset"}</SheetTitle>
          <SheetDescription>
            {initialData 
              ? "Update the details of your existing asset." 
              : "Enter the details of your new asset."}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Asset Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Primary Residence, Tesla Stock, etc."
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="asset_type">Asset Type</Label>
              <Select 
                value={formData.asset_type} 
                onValueChange={(value) => handleSelectChange('asset_type', value)}
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
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="current_value">Current Value ($)</Label>
              <Input
                id="current_value"
                name="current_value"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.current_value}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="purchase_value">Purchase Value ($)</Label>
              <Input
                id="purchase_value"
                name="purchase_value"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.purchase_value === null ? '' : formData.purchase_value}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="purchase_date">Purchase Date</Label>
              <Input
                id="purchase_date"
                name="purchase_date"
                type="date"
                value={formData.purchase_date || ''}
                onChange={handleDateChange}
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="expected_annual_appreciation">Expected Annual Appreciation (%)</Label>
              <Input
                id="expected_annual_appreciation"
                name="expected_annual_appreciation"
                type="number"
                step="0.1"
                min="-100"
                max="100"
                placeholder="0.0"
                value={formData.expected_annual_appreciation * 100}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setFormData(prev => ({
                    ...prev,
                    expected_annual_appreciation: value / 100
                  }));
                }}
              />
              <p className="text-sm text-muted-foreground">
                Enter as percentage (e.g., 5 for 5%)
              </p>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_primary_residence"
                checked={formData.is_primary_residence}
                onCheckedChange={(checked) => handleSwitchChange('is_primary_residence', checked)}
              />
              <Label htmlFor="is_primary_residence">Is this your primary residence?</Label>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional details about this asset..."
                value={formData.notes || ''}
                onChange={handleChange}
                rows={3}
              />
            </div>
          </div>
          
          <SheetFooter>
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
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
} 