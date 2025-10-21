'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { InventoryItem } from '@/lib/api/inventory';
import { Edit } from 'lucide-react';

interface InventoryTableProps {
  inventory: InventoryItem[];
  onEdit?: (item: InventoryItem) => void;
}

export function InventoryTable({ inventory, onEdit }: InventoryTableProps) {
  if (inventory.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-lg text-muted-foreground">
          No inventory items in this warehouse yet.
        </p>
        <p className="text-sm text-muted-foreground mt-2">
          Add items to start tracking your inventory.
        </p>
      </div>
    );
  }

  const getStockStatus = (quantity: number) => {
    if (quantity === 0) {
      return { label: 'Out of Stock', variant: 'destructive' as const };
    }
    if (quantity < 20) {
      return { label: 'Low Stock', variant: 'secondary' as const };
    }
    return { label: 'In Stock', variant: 'default' as const };
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Item Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Category</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventory.map((item) => {
            const status = getStockStatus(item.quantity);
            return (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.item.name}</TableCell>
                <TableCell>{item.item.sku}</TableCell>
                <TableCell>{item.item.category || '-'}</TableCell>
                <TableCell className="text-right font-mono">
                  {item.quantity}
                </TableCell>
                <TableCell>
                  <Badge variant={status.variant}>{status.label}</Badge>
                </TableCell>
                <TableCell className="text-right">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(item)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
