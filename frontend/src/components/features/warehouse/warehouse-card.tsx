'use client';

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Warehouse } from '@/lib/api/warehouses';
import { MapPin, Package, Edit, Trash2 } from 'lucide-react';

interface WarehouseCardProps {
  warehouse: Warehouse;
  onEdit?: (warehouse: Warehouse) => void;
  onDelete?: (warehouse: Warehouse) => void;
}

export function WarehouseCard({ warehouse, onEdit, onDelete }: WarehouseCardProps) {
  const inventoryCount = warehouse._count?.inventory || 0;
  const utilizationPercentage = warehouse.capacity > 0
    ? Math.round((inventoryCount / warehouse.capacity) * 100)
    : 0;

  const getUtilizationColor = (percentage: number) => {
    if (percentage >= 90) return 'destructive';
    if (percentage >= 70) return 'secondary';
    return 'default';
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-xl">
              <Link
                href={`/warehouses/${warehouse.id}`}
                className="hover:underline"
              >
                {warehouse.name}
              </Link>
            </CardTitle>
            <CardDescription className="flex items-center gap-1 mt-1">
              <MapPin className="h-4 w-4" />
              {warehouse.location}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            {onEdit && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onEdit(warehouse)}
                aria-label="Edit warehouse"
              >
                <Edit className="h-4 w-4" />
              </Button>
            )}
            {onDelete && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDelete(warehouse)}
                aria-label="Delete warehouse"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Package className="h-4 w-4" />
              <span>{inventoryCount} items</span>
            </div>
            <Badge variant={getUtilizationColor(utilizationPercentage)}>
              {utilizationPercentage}% utilized
            </Badge>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Capacity</span>
              <span className="font-medium">
                {inventoryCount} / {warehouse.capacity}
              </span>
            </div>
            <div className="w-full bg-secondary rounded-full h-2">
              <div
                className={`h-2 rounded-full transition-all ${
                  utilizationPercentage >= 90
                    ? 'bg-destructive'
                    : utilizationPercentage >= 70
                    ? 'bg-yellow-500'
                    : 'bg-primary'
                }`}
                style={{ width: `${Math.min(utilizationPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
