'use client';

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Sheet, SheetContent, SheetDescription, 
  SheetHeader, SheetTitle, SheetFooter
} from "@/components/ui/sheet";
import { expenseApi, ExpenseTypeEnum } from "@/api/expenses";
import { familyApi } from "@/api/family";
import { useToast } from "@/components/ui/use-toast";

interface ExpenseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: number;
    name: string;
    amount: number;
    type: string;
    category: string;
    family_member_id: number | null;
    year: number;
  };
}

interface FamilyMember {
  id: number;
  name: string;
  relationship: string;
}

// Restore original expense types
const EXPENSE_TYPES = ["Recurring", "Discretionary", "Special"];

const EXPENSE_CATEGORIES = [
  "Housing", 
  "Transportation", 
  "Utilities", 
  "Food", 
  "Healthcare", 
  "Insurance",
  "Debt Payments",
  "Entertainment",
  "Education",
  "Clothing",
  "Personal Care",
  "Gifts/Donations",
  "Travel",
  "Other"
];

// Map user-friendly types to backend enum values
const mapTypeToBackendValue = (type: string): string => {
  // Map the user-friendly type to the corresponding backend enum value
  switch(type) {
    case "Recurring":
      return ExpenseTypeEnum.HOUSING; // Default for recurring expenses
    case "Discretionary":
      return ExpenseTypeEnum.ENTERTAINMENT; // Default for discretionary
    case "Special":
      return ExpenseTypeEnum.SPECIAL; // Special maps directly
    default:
      return ExpenseTypeEnum.OTHER; // Fallback
  }
};

export function ExpenseForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialData 
}: ExpenseFormProps) {
  const currentYear = new Date().getFullYear();
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    amount: initialData?.amount || 0,
    type: initialData?.type || '',
    category: initialData?.category || '',
    family_member_id: initialData?.family_member_id === null ? null : initialData?.family_member_id || null,
    year: initialData?.year || currentYear
  });
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Fetch family members for the dropdown
  useEffect(() => {
    async function fetchFamilyMembers() {
      if (!isOpen) return;
      
      setIsLoading(true);
      try {
        const members = await familyApi.getAll();
        // Map the API response to match our local interface
        const mappedMembers = members.map(member => ({
          id: member.id,
          name: `${member.first_name} ${member.last_name}`,
          relationship: member.relationship_type
        }));
        setFamilyMembers(mappedMembers);
      } catch (error) {
        console.error('Failed to fetch family members:', error);
        toast({
          title: "Error",
          description: "Failed to load family members. This won't prevent you from saving the expense.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchFamilyMembers();
  }, [isOpen, toast]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value, type } = e.target;
    
    // Handle numeric inputs
    if (type === 'number') {
      setFormData(prev => ({ 
        ...prev, 
        [name]: value === '' ? 0 : parseFloat(value)
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSelectChange = (name: string, value: string | number | null) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.type || !formData.category) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Map form data to the backend field names
      const apiData = {
        name: formData.name,
        amount: formData.amount,
        expense_type: mapTypeToBackendValue(formData.type), // Map to backend enum value
        category: formData.category,
        family_member_id: formData.family_member_id,
        start_year: formData.year,   // Map 'year' to 'start_year'
        expected_growth_rate: 0.0,
        is_tax_deductible: false
      };

      console.log("Submitting expense data:", apiData);

      if (initialData?.id) {
        // Update existing expense
        await expenseApi.update(initialData.id, apiData);
        toast({
          title: "Success",
          description: "Expense updated successfully.",
        });
      } else {
        // Create new expense
        await expenseApi.create(apiData);
        toast({
          title: "Success",
          description: "Expense added successfully.",
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save expense:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to save expense. Please try again.";
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent className="sm:max-w-[425px]">
        <SheetHeader>
          <SheetTitle>{initialData ? 'Edit Expense' : 'Add Expense'}</SheetTitle>
          <SheetDescription>
            {initialData 
              ? 'Update the details of this expense.' 
              : 'Add a new expense to track.'}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Description</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="E.g. Mortgage Payment"
              required
            />
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
            <Label htmlFor="type">Expense Type</Label>
            <Select 
              defaultValue={formData.type} 
              onValueChange={(value) => handleSelectChange('type', value)}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {EXPENSE_TYPES.map(type => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
                {EXPENSE_CATEGORIES.map(category => (
                  <SelectItem key={category} value={category}>{category}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="year">Year</Label>
            <Input
              id="year"
              name="year"
              type="number"
              min={currentYear - 10}
              max={currentYear + 30}
              value={formData.year}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="family_member_id">Family Member (Optional)</Label>
            <Select 
              defaultValue={formData.family_member_id?.toString() || "0"} 
              onValueChange={(value) => {
                const memberId = value === "0" ? null : parseInt(value);
                handleSelectChange('family_member_id', memberId);
              }}
              disabled={isLoading}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={isLoading ? "Loading..." : "Select family member (optional)"} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">Shared / Household</SelectItem>
                {familyMembers.map(member => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.name} ({member.relationship})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <SheetFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Add'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
} 