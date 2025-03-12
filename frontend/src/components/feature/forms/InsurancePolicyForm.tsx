'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
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
  insuranceApi, 
  InsurancePolicyCreate, 
  InsurancePolicyUpdate, 
  InsuranceTypeEnum 
} from "@/api/insurance";
import { familyApi, FamilyMember } from "@/api/family";
import { useToast } from "@/components/ui/use-toast";

interface InsurancePolicyFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: number;
    name: string;
    policy_number?: string | null;
    insurance_type: InsuranceTypeEnum;
    provider?: string | null;
    coverage_amount: number;
    premium_amount: number;
    premium_payment_frequency?: string | null;
    start_date?: string | null;
    end_date?: string | null;
    is_term: boolean;
    is_taxable_benefit: boolean;
    notes?: string | null;
    family_member_id: number;
  };
}

export function InsurancePolicyForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialData 
}: InsurancePolicyFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    policy_number: initialData?.policy_number || '',
    insurance_type: initialData?.insurance_type || InsuranceTypeEnum.LIFE,
    provider: initialData?.provider || '',
    coverage_amount: initialData?.coverage_amount || 0,
    premium_amount: initialData?.premium_amount || 0,
    premium_payment_frequency: initialData?.premium_payment_frequency || 'annual',
    start_date: initialData?.start_date || '',
    end_date: initialData?.end_date || '',
    is_term: initialData?.is_term ?? true,
    is_taxable_benefit: initialData?.is_taxable_benefit ?? false,
    notes: initialData?.notes || '',
    family_member_id: initialData?.family_member_id || 0
  });
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchFamilyMembers() {
      try {
        const members = await familyApi.getAll();
        setFamilyMembers(members);
        
        // Set default family member if not editing and we have family members
        if (!initialData && members.length > 0 && formData.family_member_id === 0) {
          setFormData(prev => ({
            ...prev,
            family_member_id: members[0].id
          }));
        }
      } catch (error) {
        console.error("Failed to fetch family members:", error);
        toast({
          title: "Error",
          description: "Failed to load family members. Please refresh the page.",
          variant: "destructive"
        });
      }
    }

    fetchFamilyMembers();
  }, [initialData, toast]);

  const frequencyOptions = [
    { value: 'monthly', label: 'Monthly' },
    { value: 'quarterly', label: 'Quarterly' },
    { value: 'semi-annual', label: 'Semi-Annual' },
    { value: 'annual', label: 'Annual' }
  ];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['coverage_amount', 'premium_amount'].includes(name)
        ? parseFloat(value) || 0
        : value
    }));
  };

  const handleSelectChange = (name: string, value: string | number) => {
    setFormData((prev) => ({ 
      ...prev, 
      [name]: name === 'family_member_id' ? Number(value) : value 
    }));
  };

  const handleSwitchChange = (name: string, checked: boolean) => {
    setFormData((prev) => ({ ...prev, [name]: checked }));
  };

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value || ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Validate that a family member is selected
    if (formData.family_member_id === 0) {
      toast({
        title: "Validation Error",
        description: "Please select a family member.",
        variant: "destructive"
      });
      setIsSubmitting(false);
      return;
    }

    try {
      // Format the data for API
      const apiData: InsurancePolicyCreate | InsurancePolicyUpdate = {
        name: formData.name,
        policy_number: formData.policy_number || null,
        insurance_type: formData.insurance_type,
        provider: formData.provider || null,
        coverage_amount: formData.coverage_amount,
        premium_amount: formData.premium_amount,
        premium_payment_frequency: formData.premium_payment_frequency || null,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        is_term: formData.is_term,
        is_taxable_benefit: formData.is_taxable_benefit,
        notes: formData.notes || null,
        family_member_id: formData.family_member_id
      };

      // Call API to create or update insurance policy
      const result = initialData 
        ? await insuranceApi.update(initialData.id, apiData as InsurancePolicyUpdate)
        : await insuranceApi.create(apiData as InsurancePolicyCreate);

      toast({
        title: initialData ? "Insurance Policy Updated" : "Insurance Policy Created",
        description: `${formData.name} has been ${initialData ? "updated" : "created"} successfully.`
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save insurance policy:", error);
      toast({
        title: "Error",
        description: `Failed to ${initialData ? "update" : "create"} insurance policy. Please try again.`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-lg overflow-y-auto max-h-screen">
        <SheetHeader>
          <SheetTitle>{initialData ? "Edit Insurance Policy" : "Add New Insurance Policy"}</SheetTitle>
          <SheetDescription>
            {initialData 
              ? "Update the details of your existing insurance policy." 
              : "Enter the details of your new insurance policy."}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="family_member_id">Family Member</Label>
              <Select 
                value={formData.family_member_id.toString()} 
                onValueChange={(value) => handleSelectChange('family_member_id', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select family member" />
                </SelectTrigger>
                <SelectContent>
                  {familyMembers.map((member) => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.first_name} {member.last_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="name">Policy Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Life Insurance, Disability Insurance, etc."
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="policy_number">Policy Number</Label>
                <Input
                  id="policy_number"
                  name="policy_number"
                  placeholder="ABC123456"
                  value={formData.policy_number || ''}
                  onChange={handleChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="provider">Provider</Label>
                <Input
                  id="provider"
                  name="provider"
                  placeholder="Insurance Company"
                  value={formData.provider || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="insurance_type">Insurance Type</Label>
              <Select 
                value={formData.insurance_type} 
                onValueChange={(value) => handleSelectChange('insurance_type', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select insurance type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={InsuranceTypeEnum.LIFE}>Life</SelectItem>
                  <SelectItem value={InsuranceTypeEnum.DISABILITY}>Disability</SelectItem>
                  <SelectItem value={InsuranceTypeEnum.CRITICAL_ILLNESS}>Critical Illness</SelectItem>
                  <SelectItem value={InsuranceTypeEnum.LONG_TERM_CARE}>Long Term Care</SelectItem>
                  <SelectItem value={InsuranceTypeEnum.HEALTH}>Health</SelectItem>
                  <SelectItem value={InsuranceTypeEnum.HOME}>Home</SelectItem>
                  <SelectItem value={InsuranceTypeEnum.AUTO}>Auto</SelectItem>
                  <SelectItem value={InsuranceTypeEnum.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="coverage_amount">Coverage Amount ($)</Label>
                <Input
                  id="coverage_amount"
                  name="coverage_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.coverage_amount}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="premium_amount">Premium Amount ($)</Label>
                <Input
                  id="premium_amount"
                  name="premium_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={formData.premium_amount}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="premium_payment_frequency">Premium Payment Frequency</Label>
              <Select 
                value={formData.premium_payment_frequency || 'annual'} 
                onValueChange={(value) => handleSelectChange('premium_payment_frequency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select frequency" />
                </SelectTrigger>
                <SelectContent>
                  {frequencyOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date || ''}
                  onChange={handleDateChange}
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date || ''}
                  onChange={handleDateChange}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_term"
                checked={formData.is_term}
                onCheckedChange={(checked) => handleSwitchChange('is_term', checked)}
              />
              <Label htmlFor="is_term">Is this a term policy?</Label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_taxable_benefit"
                checked={formData.is_taxable_benefit}
                onCheckedChange={(checked) => handleSwitchChange('is_taxable_benefit', checked)}
              />
              <Label htmlFor="is_taxable_benefit">Is this a taxable benefit?</Label>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional details about this policy..."
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
              {isSubmitting ? "Saving..." : initialData ? "Save Changes" : "Add Insurance Policy"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
} 