'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { useWarehouses } from '@/lib/hooks/use-warehouses';
import { useItems } from '@/lib/hooks/use-items';

interface TransactionFilters {
  type?: 'INBOUND' | 'OUTBOUND' | '';
  warehouseId?: string;
  itemId?: string;
  startDate?: string;
  endDate?: string;
}

interface TransactionFiltersProps {
  filters: TransactionFilters;
  onFilterChange: (filters: TransactionFilters) => void;
}

export function TransactionFilters({
  filters,
  onFilterChange,
}: TransactionFiltersProps) {
  const { data: warehouses } = useWarehouses();
  const { data: items } = useItems();

  const handleReset = () => {
    onFilterChange({
      type: '',
      warehouseId: '',
      itemId: '',
      startDate: '',
      endDate: '',
    });
  };

  return (
    <div className='space-y-4 rounded-lg border p-4'>
      <h3 className='text-lg font-semibold'>Filters</h3>

      <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-3'>
        {/* Type Filter */}
        <div className='space-y-2'>
          <Label htmlFor='type-filter'>Type</Label>
          <Select
            value={filters.type || 'all'}
            onValueChange={(value) =>
              onFilterChange({
                ...filters,
                type: value === 'all' ? '' : (value as 'INBOUND' | 'OUTBOUND'),
              })
            }
          >
            <SelectTrigger id='type-filter'>
              <SelectValue placeholder='All types' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All types</SelectItem>
              <SelectItem value='INBOUND'>Inbound</SelectItem>
              <SelectItem value='OUTBOUND'>Outbound</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Warehouse Filter */}
        <div className='space-y-2'>
          <Label htmlFor='warehouse-filter'>Warehouse</Label>
          <Select
            value={filters.warehouseId || 'all'}
            onValueChange={(value) =>
              onFilterChange({ ...filters, warehouseId: value === 'all' ? '' : value })
            }
          >
            <SelectTrigger id='warehouse-filter'>
              <SelectValue placeholder='All warehouses' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All warehouses</SelectItem>
              {warehouses?.map((warehouse) => (
                <SelectItem key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Item Filter */}
        <div className='space-y-2'>
          <Label htmlFor='item-filter'>Item</Label>
          <Select
            value={filters.itemId || 'all'}
            onValueChange={(value) =>
              onFilterChange({ ...filters, itemId: value === 'all' ? '' : value })
            }
          >
            <SelectTrigger id='item-filter'>
              <SelectValue placeholder='All items' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>All items</SelectItem>
              {items?.map((item) => (
                <SelectItem key={item.id} value={item.id}>
                  {item.name} ({item.sku})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Start Date Filter */}
        <div className='space-y-2'>
          <Label htmlFor='start-date-filter'>Start Date</Label>
          <Input
            id='start-date-filter'
            type='date'
            value={filters.startDate || ''}
            onChange={(e) =>
              onFilterChange({ ...filters, startDate: e.target.value })
            }
          />
        </div>

        {/* End Date Filter */}
        <div className='space-y-2'>
          <Label htmlFor='end-date-filter'>End Date</Label>
          <Input
            id='end-date-filter'
            type='date'
            value={filters.endDate || ''}
            onChange={(e) =>
              onFilterChange({ ...filters, endDate: e.target.value })
            }
          />
        </div>

        {/* Reset Button */}
        <div className='flex items-end'>
          <Button variant='outline' onClick={handleReset} className='w-full'>
            Reset Filters
          </Button>
        </div>
      </div>
    </div>
  );
}
