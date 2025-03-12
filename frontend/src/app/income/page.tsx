'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { incomeApi, IncomeSource, IncomeTypeEnum } from "@/api/income";
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
import { IncomeSourceForm } from "@/components/feature/forms/IncomeSourceForm";

export default function IncomePage() {
  const [incomeSources, setIncomeSources] = useState<IncomeSource[]>([]);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<IncomeSource | null>(null);
  const [deletingSource, setDeletingSource] = useState<IncomeSource | null>(null);
  const [filterMemberId, setFilterMemberId] = useState<number | null>(null);
  const { toast } = useToast();

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Fetch family members first
      const membersPromise = await familyApi.getAll();
      const members = Array.isArray(membersPromise) ? membersPromise : [];
      setFamilyMembers(members);
      
      // Then fetch income sources, possibly filtered by family member
      const sourcesPromise = await incomeApi.getAll(filterMemberId || undefined);
      const sources = Array.isArray(sourcesPromise) ? sourcesPromise : [];
      setIncomeSources(sources);
    } catch (error) {
      console.error("Failed to fetch data:", error);
      setError("Failed to load income sources. Please try again.");
      toast({
        title: "Error",
        description: "Failed to load income sources. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filterMemberId]);

  const handleAddIncomeSource = () => {
    setIsAddFormOpen(true);
  };

  const handleEditIncomeSource = (source: IncomeSource) => {
    setEditingSource(source);
  };

  const handleDeleteIncomeSource = async () => {
    if (!deletingSource) return;
    
    try {
      await incomeApi.delete(deletingSource.id);
      toast({
        title: "Income Source Deleted",
        description: `${deletingSource.name} has been deleted successfully.`
      });
      setDeletingSource(null);
      fetchData();
    } catch (error) {
      console.error("Failed to delete income source:", error);
      toast({
        title: "Error",
        description: "Failed to delete income source. Please try again.",
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

  const getIncomeTypeLabel = (type: IncomeTypeEnum) => {
    switch (type) {
      case IncomeTypeEnum.SALARY:
        return 'Salary';
      case IncomeTypeEnum.BUSINESS_INCOME:
        return 'Business Income';
      case IncomeTypeEnum.PENSION:
        return 'Pension';
      case IncomeTypeEnum.CPP:
        return 'CPP';
      case IncomeTypeEnum.OAS:
        return 'OAS';
      case IncomeTypeEnum.GIS:
        return 'GIS';
      case IncomeTypeEnum.DIVIDEND:
        return 'Dividend';
      case IncomeTypeEnum.INTEREST:
        return 'Interest';
      case IncomeTypeEnum.CAPITAL_GAIN:
        return 'Capital Gain';
      case IncomeTypeEnum.RENTAL:
        return 'Rental';
      case IncomeTypeEnum.OTHER:
        return 'Other';
      default:
        return type;
    }
  };

  const getBadgeVariant = (type: IncomeTypeEnum) => {
    switch (type) {
      case IncomeTypeEnum.SALARY:
        return 'default';
      case IncomeTypeEnum.BUSINESS_INCOME:
        return 'secondary';
      case IncomeTypeEnum.PENSION:
      case IncomeTypeEnum.CPP:
      case IncomeTypeEnum.OAS:
      case IncomeTypeEnum.GIS:
        return 'outline';
      case IncomeTypeEnum.DIVIDEND:
      case IncomeTypeEnum.INTEREST:
      case IncomeTypeEnum.CAPITAL_GAIN:
        return 'destructive';
      case IncomeTypeEnum.RENTAL:
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getFamilyMemberName = (id: number) => {
    const member = familyMembers.find(m => m.id === id);
    return member ? `${member.first_name} ${member.last_name}` : 'Unknown';
  };

  const getGrowthRateColor = (rate: number) => {
    if (rate > 0.05) return 'text-green-600';
    if (rate > 0) return 'text-green-500';
    if (rate < -0.05) return 'text-red-600';
    if (rate < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Income Sources</h1>
          <p className="text-muted-foreground">
            Manage your income sources and track your earnings over time
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <div className="flex items-center">
            <Select
              value={filterMemberId?.toString() || "all"}
              onValueChange={(value: string) => setFilterMemberId(value === "all" ? null : Number(value))}
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
          <Button onClick={handleAddIncomeSource} size="sm">
            <PlusCircle className="mr-2 h-4 w-4" />
            Add Income Source
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
          {incomeSources.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No Income Sources Found</h3>
              <p className="text-muted-foreground mb-4">
                {filterMemberId 
                  ? "No income sources found for this family member. Try removing the filter or add a new income source."
                  : "You haven't added any income sources yet. Add your first income source to start tracking."}
              </p>
              <Button onClick={handleAddIncomeSource}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Income Source
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {incomeSources.map((source) => (
                <Card key={source.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{source.name}</CardTitle>
                      <Badge variant={getBadgeVariant(source.income_type)}>
                        {getIncomeTypeLabel(source.income_type)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {getFamilyMemberName(source.family_member_id)}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Annual Amount:</span>
                        <span className="font-medium">{formatCurrency(source.amount)}</span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Time Period:</span>
                        <span>
                          {source.start_year} - {source.end_year || "Ongoing"}
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Growth Rate:</span>
                        <span className={getGrowthRateColor(source.expected_growth_rate)}>
                          {(source.expected_growth_rate * 100).toFixed(1)}%
                        </span>
                      </div>
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Taxable:</span>
                        <span>{source.is_taxable ? "Yes" : "No"}</span>
                      </div>
                      
                      {source.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">{source.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditIncomeSource(source)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingSource(source)}
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

      {/* Add/Edit Income Source Form */}
      <IncomeSourceForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {editingSource && (
        <IncomeSourceForm
          isOpen={!!editingSource}
          onClose={() => setEditingSource(null)}
          onSuccess={handleFormSuccess}
          initialData={editingSource}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingSource} onOpenChange={(open: boolean) => !open && setDeletingSource(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingSource?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingSource(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteIncomeSource}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 