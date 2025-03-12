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
import { investmentApi } from "@/api/investments";
import { familyApi } from "@/api/family";
import { useToast } from "@/components/ui/use-toast";

interface AccountFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (account: any) => void;
  initialData?: {
    id: number;
    account_name: string;
    account_type: string;
    balance: number;
    annual_return_rate: number;
    family_member_id: number;
  };
}

interface FamilyMember {
  id: number;
  name: string;
  relationship: string;
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
    balance: initialData?.balance || 0,
    annual_return_rate: initialData?.annual_return_rate || 5,
    family_member_id: initialData?.family_member_id || 0
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
        
        // Set default family member if none is selected
        if (!initialData && mappedMembers.length > 0 && !formData.family_member_id) {
          setFormData(prev => ({ ...prev, family_member_id: mappedMembers[0].id }));
        }
      } catch (error) {
        console.error('Failed to fetch family members:', error);
        toast({
          title: "Error",
          description: "Failed to load family members. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchFamilyMembers();
  }, [isOpen, initialData, toast]);

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

  const handleSelectChange = (name: string, value: string | number) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.account_name || !formData.account_type || formData.family_member_id === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Map form data to backend field names
      const apiData = {
        name: formData.account_name,
        account_type: formData.account_type,
        current_balance: formData.balance,
        expected_return_rate: formData.annual_return_rate / 100, // Convert percentage to decimal
        family_member_id: formData.family_member_id
      };
      
      console.log("Submitting account data:", apiData);

      if (initialData?.id) {
        // Update existing account
        const updatedAccount = await investmentApi.update(initialData.id, apiData);
        toast({
          title: "Success",
          description: "Account updated successfully.",
        });
        onSuccess(updatedAccount);
      } else {
        // Create new account
        const newAccount = await investmentApi.create(apiData);
        toast({
          title: "Success",
          description: "Account added successfully.",
        });
        onSuccess(newAccount);
      }
      onClose();
    } catch (error) {
      console.error('Failed to save account:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to save account. Please try again.";
      
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
          <SheetTitle>{initialData ? 'Edit Investment Account' : 'Add Investment Account'}</SheetTitle>
          <SheetDescription>
            {initialData 
              ? 'Update the details of this investment account.' 
              : 'Add a new investment account to track.'}
          </SheetDescription>
        </SheetHeader>
        
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
              value={formData.account_type} 
              onValueChange={(value) => handleSelectChange('account_type', value)}
            >
              <SelectTrigger>
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
          
          <div className="space-y-2">
            <Label htmlFor="balance">Balance</Label>
            <Input
              id="balance"
              name="balance"
              type="number"
              min="0"
              step="100"
              value={formData.balance}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="annual_return_rate">Annual Return Rate (%)</Label>
            <Input
              id="annual_return_rate"
              name="annual_return_rate"
              type="number"
              min="0"
              step="0.1"
              max="100"
              value={formData.annual_return_rate}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="family_member_id">Family Member</Label>
            <Select 
              value={formData.family_member_id.toString()} 
              onValueChange={(value) => handleSelectChange('family_member_id', parseInt(value))}
              disabled={isLoading || familyMembers.length === 0}
            >
              <SelectTrigger>
                <SelectValue placeholder={isLoading ? "Loading..." : "Select family member"} />
              </SelectTrigger>
              <SelectContent>
                {familyMembers.map(member => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.name} ({member.relationship})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {familyMembers.length === 0 && !isLoading && (
              <p className="text-sm text-destructive mt-1">
                No family members found. Please add a family member first.
              </p>
            )}
          </div>
          
          <SheetFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting || isLoading || familyMembers.length === 0}
            >
              {isSubmitting ? 'Saving...' : initialData ? 'Update' : 'Add'}
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
} 