'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useItems, useDeleteItem } from '@/lib/hooks/use-items';
import { ItemTable } from '@/components/features/item/item-table';
import { RegisterItemModal } from '@/components/features/item/register-item-modal';
import type { Item } from '@/lib/api/items';
import { Plus, Search } from 'lucide-react';
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

export default function ItemsPage() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<Item | null>(null);
  const [itemToDelete, setItemToDelete] = useState<Item | null>(null);

  const { data: items, isLoading } = useItems({ search, category });
  const deleteItem = useDeleteItem();

  const handleEdit = (item: Item) => {
    setSelectedItem(item);
    setIsRegisterModalOpen(true);
  };

  const handleDelete = (item: Item) => {
    setItemToDelete(item);
  };

  const confirmDelete = async () => {
    if (itemToDelete) {
      await deleteItem.mutateAsync(itemToDelete.id);
      setItemToDelete(null);
    }
  };

  const handleRegisterModalClose = () => {
    setIsRegisterModalOpen(false);
    setSelectedItem(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Items</h1>
          <p className="text-muted-foreground">Manage your inventory items</p>
        </div>
        <Button onClick={() => setIsRegisterModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Register Item
        </Button>
      </div>

      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by SKU, name, or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Input
          placeholder="Filter by category..."
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="max-w-xs"
        />
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="text-muted-foreground">Loading items...</div>
        </div>
      ) : (
        <ItemTable items={items || []} onEdit={handleEdit} onDelete={handleDelete} />
      )}

      <RegisterItemModal
        open={isRegisterModalOpen}
        onClose={handleRegisterModalClose}
        item={selectedItem}
      />

      <AlertDialog open={!!itemToDelete} onOpenChange={() => setItemToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Item</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {itemToDelete?.name} ({itemToDelete?.sku})? This
              action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
