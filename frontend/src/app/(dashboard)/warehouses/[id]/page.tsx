'use client';

import { use, useState } from 'react';
import { useWarehouse } from '@/lib/hooks/use-warehouses';
import { useWarehouseInventory } from '@/lib/hooks/use-inventory';
import { InventoryTable } from '@/components/features/warehouse/inventory-table';
import { AddItemToWarehouseModal } from '@/components/features/warehouse/add-item-to-warehouse-modal';
import { CreateTransactionModal } from '@/components/features/transaction/create-transaction-modal';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, MapPin, Package, ArrowLeft, ArrowUpDown } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface WarehouseDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function WarehouseDetailPage({
  params,
}: WarehouseDetailPageProps) {
  const { id } = use(params);
  const {
    data: warehouse,
    isLoading: warehouseLoading,
    error: warehouseError,
  } = useWarehouse(id);
  const { data: inventory, isLoading: inventoryLoading } =
    useWarehouseInventory(id);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);

  if (warehouseLoading || inventoryLoading) {
    return (
      <div className='flex items-center justify-center h-96'>
        <Loader2 className='h-8 w-8 animate-spin text-muted-foreground' />
      </div>
    );
  }

  if (warehouseError || !warehouse) {
    return (
      <div className='flex items-center justify-center h-96'>
        <div className='text-center'>
          <p className='text-lg font-semibold text-destructive'>
            Error loading warehouse
          </p>
          <p className='text-sm text-muted-foreground mt-2'>
            The warehouse could not be found or you don&apos;t have permission
            to view it.
          </p>
          <Link href='/warehouses' className='mt-4 inline-block'>
            <Button variant='outline'>
              <ArrowLeft className='mr-2 h-4 w-4' />
              Back to Warehouses
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const totalQuantity =
    inventory?.reduce((sum, item) => sum + item.quantity, 0) || 0;
  const capacityNumber =
    typeof warehouse.capacity === 'number'
      ? warehouse.capacity
      : Number(warehouse.capacity);
  const utilizationPercentage =
    capacityNumber > 0 ? Math.round((totalQuantity / capacityNumber) * 100) : 0;

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 70) return 'secondary';
    return 'default';
  };

  const lowStockItems = inventory?.filter((item) => item.quantity < 20) || [];

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div className='space-y-1'>
          <div className='flex items-center gap-3'>
            <Link href='/warehouses'>
              <Button variant='ghost' size='icon'>
                <ArrowLeft className='h-4 w-4' />
              </Button>
            </Link>
            <div>
              <h1 className='text-3xl font-bold tracking-tight'>
                {warehouse.name}
              </h1>
              <div className='flex items-center gap-2 text-muted-foreground mt-1'>
                <MapPin className='h-4 w-4' />
                <span>{warehouse.location}</span>
              </div>
            </div>
          </div>
        </div>
        <div className='flex gap-2'>
          <Button
            onClick={() => setIsTransactionModalOpen(true)}
            variant='outline'
          >
            <ArrowUpDown className='mr-2 h-4 w-4' />
            New Transaction
          </Button>
          {/* <AddItemToWarehouseModal warehouseId={id} /> */}
        </div>
      </div>

      {/* Stats Grid */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Total Items</CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{inventory?.length || 0}</div>
            <p className='text-xs text-muted-foreground'>
              Unique items in warehouse
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>Capacity</CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {totalQuantity} / {capacityNumber}
            </div>
            <div className='mt-2'>
              <div className='flex items-center gap-2'>
                <div className='w-full bg-secondary rounded-full h-2'>
                  <div
                    className={`h-2 rounded-full transition-all ${
                      utilizationPercentage >= 90
                        ? 'bg-destructive'
                        : utilizationPercentage >= 70
                        ? 'bg-yellow-500'
                        : 'bg-primary'
                    }`}
                    style={{
                      width: `${Math.min(utilizationPercentage, 100)}%`,
                    }}
                  />
                </div>
                <Badge variant={getUtilizationColor(utilizationPercentage)}>
                  {utilizationPercentage}%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>
              Low Stock Items
            </CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{lowStockItems.length}</div>
            <p className='text-xs text-muted-foreground'>
              Items with quantity &lt; 20
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory</CardTitle>
          <CardDescription>
            All items currently stored in this warehouse
          </CardDescription>
        </CardHeader>
        <CardContent>
          <InventoryTable inventory={inventory || []} />
        </CardContent>
      </Card>

      {/* Transaction Modal */}
      <CreateTransactionModal
        open={isTransactionModalOpen}
        onClose={() => setIsTransactionModalOpen(false)}
        defaultWarehouseId={id}
      />
    </div>
  );
}
