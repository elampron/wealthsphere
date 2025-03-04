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
import { familyApi } from "@/lib/api/family";
import { useToast } from "@/components/ui/use-toast";

interface FamilyMemberFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialData?: {
    id: number;
    first_name?: string;
    last_name?: string;
    name?: string; // For backward compatibility
    relationship_type?: string;
    relationship?: string; // For backward compatibility
    date_of_birth?: string;
    birth_date?: string; // For backward compatibility
    is_primary?: boolean;
    is_dependent?: boolean; // For backward compatibility
  };
}

export function FamilyMemberForm({ 
  isOpen, 
  onClose, 
  onSuccess, 
  initialData 
}: FamilyMemberFormProps) {
  // Initialize form data, accounting for both old and new field names
  const [formData, setFormData] = useState({
    first_name: initialData?.first_name || (initialData?.name ? initialData.name.split(' ')[0] : ''),
    last_name: initialData?.last_name || (initialData?.name && initialData.name.split(' ').length > 1 ? initialData.name.split(' ')[1] : ''),
    relationship_type: initialData?.relationship_type || initialData?.relationship || '',
    date_of_birth: initialData?.date_of_birth || initialData?.birth_date 
      ? initialData?.date_of_birth 
        ? initialData.date_of_birth.split('T')[0] 
        : initialData?.birth_date 
          ? initialData.birth_date.split('T')[0] 
          : ''
      : '',
    is_primary: initialData?.is_primary || false
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();
  
  // Update form data when initialData changes (edit mode)
  useEffect(() => {
    if (initialData) {
      console.log("Updating form with initial data:", initialData);
      setFormData({
        first_name: initialData.first_name || (initialData.name ? initialData.name.split(' ')[0] : ''),
        last_name: initialData.last_name || (initialData.name && initialData.name.split(' ').length > 1 ? initialData.name.split(' ')[1] : ''),
        relationship_type: initialData.relationship_type || initialData.relationship || '',
        date_of_birth: initialData.date_of_birth || initialData.birth_date 
          ? initialData.date_of_birth 
            ? initialData.date_of_birth.split('T')[0] 
            : initialData.birth_date 
              ? initialData.birth_date.split('T')[0] 
              : ''
          : '',
        is_primary: initialData.is_primary || false
      });
    } else {
      // Reset form when adding a new family member
      setFormData({
        first_name: '',
        last_name: '',
        relationship_type: '',
        date_of_birth: '',
        is_primary: false
      });
    }
  }, [initialData, isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement> | { name: string; value: string | boolean }
  ) => {
    const { name, value } = 'target' in e ? e.target : e;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.first_name || !formData.last_name || !formData.relationship_type || !formData.date_of_birth) {
      toast({
        title: "Missing Information",
        description: "Please fill all required fields.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      if (initialData?.id) {
        // Update existing family member
        await familyApi.update(initialData.id, formData);
        toast({
          title: "Success",
          description: "Family member updated successfully.",
        });
      } else {
        // Create new family member
        await familyApi.create(formData);
        toast({
          title: "Success",
          description: "Family member added successfully.",
        });
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Failed to save family member:', error);
      const errorMessage = error instanceof Error 
        ? error.message 
        : "Failed to save family member. Please try again.";
      
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
          <SheetTitle>{initialData ? 'Edit Family Member' : 'Add Family Member'}</SheetTitle>
          <SheetDescription>
            {initialData 
              ? 'Update the details of this family member.' 
              : 'Add a new family member to your wealth sphere.'}
          </SheetDescription>
        </SheetHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">First Name</Label>
            <Input
              id="first_name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              placeholder="Enter first name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">Last Name</Label>
            <Input
              id="last_name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              placeholder="Enter last name"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="relationship_type">Relationship</Label>
            <Select 
              value={formData.relationship_type} 
              onValueChange={(value) => handleSelectChange('relationship_type', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select relationship" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Self">Self</SelectItem>
                <SelectItem value="Spouse">Spouse</SelectItem>
                <SelectItem value="Child">Child</SelectItem>
                <SelectItem value="Parent">Parent</SelectItem>
                <SelectItem value="Sibling">Sibling</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="date_of_birth">Date of Birth</Label>
            <Input
              id="date_of_birth"
              name="date_of_birth"
              type="date"
              value={formData.date_of_birth}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <input
              id="is_primary"
              name="is_primary"
              type="checkbox"
              checked={formData.is_primary}
              onChange={(e) => handleChange({ name: 'is_primary', value: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300"
            />
            <Label htmlFor="is_primary">Primary Family Member</Label>
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