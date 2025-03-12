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
  incomeApi, 
  IncomeSourceCreate, 
  IncomeSourceUpdate, 
  IncomeTypeEnum 
} from "@/api/income";
import { familyApi, FamilyMember } from "@/api/family";
import { useToast } from "@/components/ui/use-toast";

interface IncomeSourceFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: number;
    name: string;
    income_type: IncomeTypeEnum;
    amount: number;
    is_taxable: boolean;
    start_year: number;
    end_year: number | null;
    expected_growth_rate: number;
    notes: string | null;
    family_member_id: number;
  };
}

export function IncomeSourceForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialData 
}: IncomeSourceFormProps) {
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    income_type: initialData?.income_type || IncomeTypeEnum.SALARY,
    amount: initialData?.amount || 0,
    is_taxable: initialData?.is_taxable ?? true,
    start_year: initialData?.start_year || new Date().getFullYear(),
    end_year: initialData?.end_year || null,
    expected_growth_rate: initialData?.expected_growth_rate || 0,
    notes: initialData?.notes || '',
    family_member_id: initialData?.family_member_id || 0
  });
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);

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
      } finally {
        setIsLoading(false);
      }
    }

    fetchFamilyMembers();
  }, [initialData, toast]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: ['amount', 'start_year', 'end_year', 'expected_growth_rate'].includes(name)
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
      const apiData: IncomeSourceCreate | IncomeSourceUpdate = {
        name: formData.name,
        income_type: formData.income_type,
        amount: formData.amount,
        is_taxable: formData.is_taxable,
        start_year: formData.start_year,
        end_year: formData.end_year,
        expected_growth_rate: formData.expected_growth_rate,
        notes: formData.notes || null,
        family_member_id: formData.family_member_id
      };

      // Call API to create or update income source
      const result = initialData 
        ? await incomeApi.update(initialData.id, apiData as IncomeSourceUpdate)
        : await incomeApi.create(apiData as IncomeSourceCreate);

      toast({
        title: initialData ? "Income Source Updated" : "Income Source Created",
        description: `${formData.name} has been ${initialData ? "updated" : "created"} successfully.`
      });
      
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save income source:", error);
      toast({
        title: "Error",
        description: `Failed to ${initialData ? "update" : "create"} income source. Please try again.`,
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
          <SheetTitle>{initialData ? "Edit Income Source" : "Add New Income Source"}</SheetTitle>
          <SheetDescription>
            {initialData 
              ? "Update the details of your existing income source." 
              : "Enter the details of your new income source."}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6 py-6">
          <div className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="family_member_id">Family Member</Label>
              <Select 
                defaultValue={formData.family_member_id.toString()} 
                onValueChange={(value) => handleSelectChange('family_member_id', value)}
                disabled={isLoading || familyMembers.length === 0}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={isLoading ? "Loading..." : "Select family member"} />
                </SelectTrigger>
                <SelectContent>
                  {familyMembers.map(member => (
                    <SelectItem key={member.id} value={member.id.toString()}>
                      {member.first_name} {member.last_name} ({member.relationship_type})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="name">Income Source Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Salary, Pension, Dividends, etc."
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="income_type">Income Type</Label>
              <Select 
                defaultValue={formData.income_type} 
                onValueChange={(value) => handleSelectChange('income_type', value)}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select income type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={IncomeTypeEnum.SALARY}>Salary</SelectItem>
                  <SelectItem value={IncomeTypeEnum.BUSINESS_INCOME}>Business Income</SelectItem>
                  <SelectItem value={IncomeTypeEnum.RENTAL}>Rental Income</SelectItem>
                  <SelectItem value={IncomeTypeEnum.DIVIDEND}>Investment Income (Dividends)</SelectItem>
                  <SelectItem value={IncomeTypeEnum.INTEREST}>Investment Income (Interest)</SelectItem>
                  <SelectItem value={IncomeTypeEnum.PENSION}>Pension</SelectItem>
                  <SelectItem value={IncomeTypeEnum.CPP}>CPP</SelectItem>
                  <SelectItem value={IncomeTypeEnum.OAS}>OAS</SelectItem>
                  <SelectItem value={IncomeTypeEnum.OTHER}>Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="amount">Annual Amount ($)</Label>
              <Input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                value={formData.amount}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="is_taxable"
                checked={formData.is_taxable}
                onCheckedChange={(checked) => handleSwitchChange('is_taxable', checked)}
              />
              <Label htmlFor="is_taxable">Is this income taxable?</Label>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="start_year">Start Year</Label>
                <Input
                  id="start_year"
                  name="start_year"
                  type="number"
                  min={new Date().getFullYear() - 10}
                  max={new Date().getFullYear() + 50}
                  value={formData.start_year}
                  onChange={handleChange}
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="end_year">End Year (Optional)</Label>
                <Input
                  id="end_year"
                  name="end_year"
                  type="number"
                  min={formData.start_year || new Date().getFullYear()}
                  max={new Date().getFullYear() + 100}
                  value={formData.end_year || ''}
                  onChange={handleChange}
                />
              </div>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="expected_growth_rate">Expected Annual Growth Rate (%)</Label>
              <Input
                id="expected_growth_rate"
                name="expected_growth_rate"
                type="number"
                step="0.1"
                min="-100"
                max="100"
                placeholder="0.0"
                value={formData.expected_growth_rate * 100}
                onChange={(e) => {
                  const value = parseFloat(e.target.value) || 0;
                  setFormData(prev => ({
                    ...prev,
                    expected_growth_rate: value / 100
                  }));
                }}
              />
              <p className="text-sm text-muted-foreground">
                Enter as percentage (e.g., 2 for 2%)
              </p>
            </div>
            
            <div className="grid gap-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                name="notes"
                placeholder="Additional details about this income source..."
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
              {isSubmitting ? "Saving..." : initialData ? "Save Changes" : "Add Income Source"}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
} 