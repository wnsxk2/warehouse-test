'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { useWarehouses, useDeleteWarehouse } from '@/lib/hooks/use-warehouses';
import { WarehouseCard } from '@/components/features/warehouse/warehouse-card';
import { AddWarehouseModal } from '@/components/features/warehouse/add-warehouse-modal';
import { useToast } from '@/hooks/use-toast';
import type { Warehouse } from '@/lib/api/warehouses';
import { Search, Loader2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function WarehousesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteWarehouse, setDeleteWarehouse] = useState<Warehouse | null>(null);
  const { data: warehouses, isLoading, error } = useWarehouses();
  const deleteWarehouseMutation = useDeleteWarehouse();
  const { toast } = useToast();

  const filteredWarehouses = warehouses?.filter((warehouse) =>
    warehouse.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    warehouse.location.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDelete = async () => {
    if (!deleteWarehouse) return;

    try {
      await deleteWarehouseMutation.mutateAsync(deleteWarehouse.id);
      toast({
        title: 'Success',
        description: 'Warehouse deleted successfully',
      });
      setDeleteWarehouse(null);
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to delete warehouse',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <p className="text-lg font-semibold text-destructive">Error loading warehouses</p>
          <p className="text-sm text-muted-foreground mt-2">
            Please try again later or contact support if the problem persists.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your warehouse locations and inventory
          </p>
        </div>
        <AddWarehouseModal />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search warehouses by name or location..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {filteredWarehouses && filteredWarehouses.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredWarehouses.map((warehouse) => (
            <WarehouseCard
              key={warehouse.id}
              warehouse={warehouse}
              onDelete={(warehouse) => setDeleteWarehouse(warehouse)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-lg text-muted-foreground">
            {searchQuery
              ? 'No warehouses found matching your search'
              : 'No warehouses yet. Create your first warehouse to get started.'}
          </p>
        </div>
      )}

      <AlertDialog
        open={!!deleteWarehouse}
        onOpenChange={(open) => !open && setDeleteWarehouse(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Warehouse</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{deleteWarehouse?.name}&quot;?
              This action cannot be undone and will remove all associated inventory data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteWarehouseMutation.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
