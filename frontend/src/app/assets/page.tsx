'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { assetsApi } from "@/api/assets";
import { Asset, AssetType } from "@/types/finance";
import { useToast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { PlusCircle, Pencil, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle 
} from "@/components/ui/dialog";
import { AssetForm } from "@/components/feature/forms/AssetForm";
import { familyApi } from "@/api/family";
import type { FamilyMember } from "@/types/family";
import { SelectItem } from "@/components/ui/select";

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const { addToast } = useToast();

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [assetsData, familyData] = await Promise.all([
        assetsApi.getAssets(),
        familyApi.getAll()
      ]);
      
      // Transform the data to match the expected types
      const transformedAssets = assetsData?.map(asset => ({
        ...asset,
        current_value: asset.current_value || 0,
        asset_type: asset.asset_type as AssetType
      })) || [];

      const transformedFamilyMembers = familyData?.map(member => ({
        ...member,
        user_id: 1, // TODO: Get the actual user ID from context/auth
        expected_retirement_age: member.expected_retirement_age || undefined,
        expected_death_age: member.expected_death_age || undefined
      })) || [];

      setAssets(transformedAssets);
      setFamilyMembers(transformedFamilyMembers as FamilyMember[]);
    } catch (error) {
      console.error('Error fetching data:', error);
      addToast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleFormSuccess = () => {
    fetchData();
  };

  const handleDeleteAsset = async (asset: Asset) => {
    try {
      await assetsApi.deleteAsset(asset.id);
      addToast({
        title: "Success",
        description: "Asset deleted successfully",
      });
      fetchData();
    } catch (error) {
      console.error('Error deleting asset:', error);
      addToast({
        title: "Error",
        description: "Failed to delete asset",
        variant: "destructive",
      });
    }
  };

  const formatCurrency = (value: number | undefined | null) => {
    // Handle null, undefined, or NaN values
    const safeValue = (value === null || value === undefined || isNaN(value)) ? 0 : value;
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD'
    }).format(safeValue);
  };

  const getAssetTypeLabel = (type: string) => {
    switch (type) {
      case AssetType.PRIMARY_RESIDENCE:
        return 'Primary Residence';
      case AssetType.SECONDARY_PROPERTY:
        return 'Secondary Property';
      case AssetType.BUSINESS:
        return 'Business';
      case AssetType.VEHICLE:
        return 'Vehicle';
      case AssetType.OTHER:
        return 'Other';
      default:
        return type;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case AssetType.PRIMARY_RESIDENCE:
        return 'default';
      case AssetType.SECONDARY_PROPERTY:
        return 'secondary';
      case AssetType.BUSINESS:
        return 'outline';
      case AssetType.VEHICLE:
        return 'destructive';
      default:
        return 'outline';
    }
  };

  const getAppreciationColor = (rate: number | undefined | null) => {
    console.log("Rate value:", rate, "Type:", typeof rate);
    // Handle undefined, null, or NaN values
    if (rate === undefined || rate === null || isNaN(rate)) return 'text-gray-500';
    
    if (rate > 0.05) return 'text-green-600';
    if (rate > 0) return 'text-green-500';
    if (rate < -0.05) return 'text-red-600';
    if (rate < 0) return 'text-red-500';
    return 'text-gray-500';
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Assets</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="w-full">
              <CardHeader>
                <Skeleton className="h-4 w-3/4" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-4 w-1/2 mb-2" />
                <Skeleton className="h-4 w-1/3" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assets.map((asset) => (
            <Card key={asset.id} className="w-full">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {asset.name}
                  <Badge variant="outline">{getAssetTypeLabel(asset.asset_type)}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-semibold">${(asset.current_value || 0).toLocaleString()}</p>
                {asset.purchase_value && (
                  <p className="text-sm text-gray-500">
                    Purchased for ${asset.purchase_value.toLocaleString()}
                    {asset.purchase_date && ` on ${new Date(asset.purchase_date).toLocaleDateString()}`}
                  </p>
                )}
              </CardContent>
              <CardFooter className="flex justify-end space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedAsset(asset)}
                >
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteAsset(asset)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Asset</DialogTitle>
          </DialogHeader>
          <AssetForm
            isOpen={isDialogOpen}
            onClose={() => setIsDialogOpen(false)}
            onSuccess={handleFormSuccess}
            familyMembers={familyMembers}
          />
        </DialogContent>
      </Dialog>

      {selectedAsset && (
        <Dialog open={true} onOpenChange={() => setSelectedAsset(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Asset</DialogTitle>
            </DialogHeader>
            <AssetForm
              isOpen={true}
              onClose={() => setSelectedAsset(null)}
              onSuccess={handleFormSuccess}
              familyMembers={familyMembers}
              initialData={selectedAsset}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
} 