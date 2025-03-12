'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { insuranceApi, InsurancePolicy, InsuranceTypeEnum } from "@/api/insurance";
import { familyApi, FamilyMember } from "@/api/family";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Pencil, Trash2, Filter } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { InsurancePolicyForm } from "@/components/feature/forms/InsurancePolicyForm";

export default function InsurancePage() {
  const [insurancePolicies, setInsurancePolicies] = useState<InsurancePolicy[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState<InsurancePolicy | null>(null);
  const [deletingPolicy, setDeletingPolicy] = useState<InsurancePolicy | null>(null);
  const [filterMemberId, setFilterMemberId] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch family members first
      const members = await familyApi.getAll();
      setFamilyMembers(members);
      
      // Then fetch insurance policies, possibly filtered by family member and type
      const policies = await insuranceApi.getAll(filterMemberId || undefined, filterType || undefined);
      setInsurancePolicies(policies);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to load insurance policies. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load insurance policies. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterMemberId, filterType]);

  const handleAddPolicy = () => {
    setIsAddFormOpen(true);
  };

  const handleEditPolicy = (policy: InsurancePolicy) => {
    setEditingPolicy(policy);
  };

  const handleDeletePolicy = async () => {
    if (!deletingPolicy) return;
    
    try {
      await insuranceApi.delete(deletingPolicy.id);
      toast({
        title: "Insurance Policy Deleted",
        description: `${deletingPolicy.name} has been deleted successfully.`
      });
      setDeletingPolicy(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete insurance policy:", error);
      toast({
        title: "Error",
        description: "Failed to delete insurance policy. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFormSuccess = () => {
    fetchData();
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(value);
  };

  const getInsuranceTypeLabel = (type: InsuranceTypeEnum) => {
    switch (type) {
      case InsuranceTypeEnum.LIFE:
        return 'Life';
      case InsuranceTypeEnum.DISABILITY:
        return 'Disability';
      case InsuranceTypeEnum.CRITICAL_ILLNESS:
        return 'Critical Illness';
      case InsuranceTypeEnum.LONG_TERM_CARE:
        return 'Long Term Care';
      case InsuranceTypeEnum.HEALTH:
        return 'Health';
      case InsuranceTypeEnum.HOME:
        return 'Home';
      case InsuranceTypeEnum.AUTO:
        return 'Auto';
      case InsuranceTypeEnum.OTHER:
        return 'Other';
      default:
        return type;
    }
  };

  const getBadgeVariant = (type: InsuranceTypeEnum) => {
    switch (type) {
      case InsuranceTypeEnum.LIFE:
        return 'default';
      case InsuranceTypeEnum.DISABILITY:
      case InsuranceTypeEnum.CRITICAL_ILLNESS:
        return 'destructive';
      case InsuranceTypeEnum.LONG_TERM_CARE:
      case InsuranceTypeEnum.HEALTH:
        return 'secondary';
      case InsuranceTypeEnum.HOME:
      case InsuranceTypeEnum.AUTO:
        return 'outline';
      default:
        return 'outline';
    }
  };

  const getFamilyMemberName = (id: number) => {
    const member = familyMembers.find(m => m.id === id);
    return member ? `${member.first_name} ${member.last_name}` : 'Unknown';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-CA');
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Insurance Policies</h1>
          <p className="text-muted-foreground">
            Manage your insurance policies and coverage
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <Select
              value={filterMemberId?.toString() || "all"}
              onValueChange={(value) => setFilterMemberId(value === "all" ? null : Number(value))}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by member" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Family Members</SelectItem>
                {familyMembers.map((member) => (
                  <SelectItem key={member.id} value={member.id.toString()}>
                    {member.first_name} {member.last_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-center">
            <Select
              value={filterType || "all"}
              onValueChange={(value) => setFilterType(value === "all" ? null : value)}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {Object.values(InsuranceTypeEnum).map((type) => (
                  <SelectItem key={type} value={type}>
                    {getInsuranceTypeLabel(type as InsuranceTypeEnum)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <Button onClick={handleAddPolicy} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Policy
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden">
              <CardHeader className="pb-2">
                <Skeleton className="h-5 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-24 w-full" />
              </CardContent>
              <CardFooter>
                <Skeleton className="h-10 w-full" />
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : error ? (
        <div className="text-center">
          <p className="text-red-500">{error}</p>
          <Button onClick={fetchData} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {insurancePolicies.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No Insurance Policies Found</h3>
              <p className="text-muted-foreground mb-4">
                {(filterMemberId || filterType) 
                  ? "No policies found with current filters. Try removing or changing the filters, or add a new policy."
                  : "You haven't added any insurance policies yet. Add your first policy to start tracking."}
              </p>
              <Button onClick={handleAddPolicy}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Insurance Policy
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {insurancePolicies.map((policy) => (
                <Card key={policy.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{policy.name}</CardTitle>
                      <Badge variant={getBadgeVariant(policy.insurance_type)}>
                        {getInsuranceTypeLabel(policy.insurance_type)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {getFamilyMemberName(policy.family_member_id)}
                      {policy.policy_number && ` • Policy #${policy.policy_number}`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Coverage:</span>
                        <span className="font-medium">{formatCurrency(policy.coverage_amount)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Premium:</span>
                        <span>
                          {formatCurrency(policy.premium_amount)} 
                          {policy.premium_payment_frequency && ` (${policy.premium_payment_frequency})`}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Policy Period:</span>
                        <span>
                          {policy.start_date ? formatDate(policy.start_date) : 'N/A'} 
                          {policy.end_date ? ` to ${formatDate(policy.end_date)}` : ' (ongoing)'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Type:</span>
                        <span>{policy.is_term ? "Term" : "Permanent"}</span>
                      </div>
                      
                      {policy.provider && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Provider:</span>
                          <span>{policy.provider}</span>
                        </div>
                      )}
                      
                      {policy.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">{policy.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditPolicy(policy)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingPolicy(policy)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Insurance Policy Form */}
      <InsurancePolicyForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {editingPolicy && (
        <InsurancePolicyForm
          isOpen={!!editingPolicy}
          onClose={() => setEditingPolicy(null)}
          onSuccess={handleFormSuccess}
          initialData={editingPolicy}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingPolicy} onOpenChange={(open) => !open && setDeletingPolicy(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingPolicy?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingPolicy(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeletePolicy}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 