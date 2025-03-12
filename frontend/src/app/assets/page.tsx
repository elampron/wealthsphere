'use client';

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { assetApi, Asset, AssetTypeEnum } from "@/api/assets";
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

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<Asset | null>(null);
  const [deletingAsset, setDeletingAsset] = useState<Asset | null>(null);
  const { toast } = useToast();

  const fetchAssets = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const fetchedAssets = await assetApi.getAll();
      console.log("Fetched assets:", JSON.stringify(fetchedAssets, null, 2));
      setAssets(fetchedAssets);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      setError(`Failed to load assets: ${errorMessage}`);
      toast({
        title: "Error",
        description: `Failed to load assets: ${errorMessage}`,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssets();
  }, []);

  const handleAddAsset = () => {
    setIsAddFormOpen(true);
  };

  const handleEditAsset = (asset: Asset) => {
    setEditingAsset(asset);
  };

  const handleDeleteAsset = async () => {
    if (!deletingAsset) return;
    
    try {
      await assetApi.delete(deletingAsset.id);
      toast({
        title: "Asset Deleted",
        description: `${deletingAsset.name} has been deleted successfully.`
      });
      setDeletingAsset(null);
      fetchAssets();
    } catch (error) {
      console.error("Failed to delete asset:", error);
      toast({
        title: "Error",
        description: "Failed to delete asset. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleFormSuccess = () => {
    fetchAssets();
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
      case AssetTypeEnum.PRIMARY_RESIDENCE:
        return 'Primary Residence';
      case AssetTypeEnum.SECONDARY_PROPERTY:
        return 'Secondary Property';
      case AssetTypeEnum.BUSINESS:
        return 'Business';
      case AssetTypeEnum.VEHICLE:
        return 'Vehicle';
      case AssetTypeEnum.OTHER:
        return 'Other';
      default:
        return type;
    }
  };

  const getBadgeVariant = (type: string) => {
    switch (type) {
      case AssetTypeEnum.PRIMARY_RESIDENCE:
        return 'default';
      case AssetTypeEnum.SECONDARY_PROPERTY:
        return 'secondary';
      case AssetTypeEnum.BUSINESS:
        return 'outline';
      case AssetTypeEnum.VEHICLE:
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Assets</h1>
          <p className="text-muted-foreground">
            Manage your assets and track their values over time
          </p>
        </div>
        <Button onClick={handleAddAsset} size="sm">
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Asset
        </Button>
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
          <Button onClick={fetchAssets} variant="outline" className="mt-4">
            Try Again
          </Button>
        </div>
      ) : (
        <>
          {assets.length === 0 ? (
            <div className="text-center py-12">
              <h3 className="text-lg font-medium mb-2">No Assets Found</h3>
              <p className="text-muted-foreground mb-4">
                You haven't added any assets yet. Add your first asset to start tracking.
              </p>
              <Button onClick={handleAddAsset}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Your First Asset
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {assets.map((asset) => {
                console.log("Rendering asset:", asset.id, asset);
                return (
                <Card key={asset.id} className="overflow-hidden">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between items-start">
                      <CardTitle className="text-xl">{asset.name}</CardTitle>
                      <Badge variant={getBadgeVariant(asset.asset_type)}>
                        {getAssetTypeLabel(asset.asset_type)}
                      </Badge>
                    </div>
                    <CardDescription>
                      {asset.purchase_date && (
                        <span>Purchased on {new Date(asset.purchase_date).toLocaleDateString()}</span>
                      )}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Current Value:</span>
                        <span className="font-medium">{formatCurrency(asset.current_value)}</span>
                      </div>
                      
                      {asset.purchase_value && (
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Purchase Value:</span>
                          <span>{formatCurrency(asset.purchase_value)}</span>
                        </div>
                      )}
                      
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Expected Annual Appreciation:</span>
                        <span className={getAppreciationColor(asset.expected_annual_appreciation)}>
                          {asset.expected_annual_appreciation !== undefined && 
                           asset.expected_annual_appreciation !== null && 
                           !isNaN(asset.expected_annual_appreciation)
                            ? (asset.expected_annual_appreciation * 100).toFixed(1)
                            : '0.0'}%
                        </span>
                      </div>
                      
                      {asset.notes && (
                        <div className="pt-2 border-t">
                          <p className="text-sm text-muted-foreground">{asset.notes}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditAsset(asset)}
                    >
                      <Pencil className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setDeletingAsset(asset)}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Asset Form */}
      <AssetForm
        isOpen={isAddFormOpen}
        onClose={() => setIsAddFormOpen(false)}
        onSuccess={handleFormSuccess}
      />

      {editingAsset && (
        <AssetForm
          isOpen={!!editingAsset}
          onClose={() => setEditingAsset(null)}
          onSuccess={handleFormSuccess}
          initialData={{
            id: editingAsset.id,
            name: editingAsset.name,
            asset_type: editingAsset.asset_type,
            current_value: editingAsset.current_value,
            purchase_value: editingAsset.purchase_value || null,
            purchase_date: editingAsset.purchase_date || null,
            expected_annual_appreciation: editingAsset.expected_annual_appreciation,
            is_primary_residence: editingAsset.is_primary_residence || false,
            notes: editingAsset.notes
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deletingAsset} onOpenChange={(open) => !open && setDeletingAsset(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {deletingAsset?.name}? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingAsset(null)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAsset}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
} 