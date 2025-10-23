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

  const filteredWarehouses = warehouses?.filter(
    (warehouse) =>
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
        <Loader2 className="h-8 w-8 animate-spin text-[var(--primary-default)]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-[var(--space-2)]">
          <p className="title-m text-[var(--semantic-error)]">창고 데이터를 불러올 수 없습니다</p>
          <p className="body-s text-gray-700">
            잠시 후 다시 시도하시거나 문제가 지속되면 고객 지원팀에 문의해주세요.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-[var(--space-6)]">
      <div className="flex items-center justify-between">
        <div className="space-y-[var(--space-2)]">
          <h1 className="title-l text-gray-900">창고 관리</h1>
          <p className="body-s text-gray-700">창고 위치 및 재고를 관리하세요</p>
        </div>
        <AddWarehouseModal />
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
        <Input
          placeholder="창고명 또는 위치로 검색..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10 border-gray-400 bg-gray-100 rounded-[var(--radius-md)] body-m text-gray-900 placeholder:text-gray-600"
        />
      </div>

      {filteredWarehouses && filteredWarehouses.length > 0 ? (
        <div className="grid gap-[var(--space-4)] md:grid-cols-2 lg:grid-cols-3">
          {filteredWarehouses.map((warehouse) => (
            <WarehouseCard
              key={warehouse.id}
              warehouse={warehouse}
              onDelete={(warehouse) => setDeleteWarehouse(warehouse)}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 space-y-[var(--space-2)]">
          <p className="body-l text-gray-700">
            {searchQuery
              ? '검색 결과가 없습니다'
              : '아직 창고가 없습니다. 첫 번째 창고를 생성해보세요.'}
          </p>
        </div>
      )}

      <AlertDialog
        open={!!deleteWarehouse}
        onOpenChange={(open) => !open && setDeleteWarehouse(null)}
      >
        <AlertDialogContent className="border-gray-400 bg-gray-100 rounded-[var(--radius-lg)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="title-m text-gray-900">창고 삭제</AlertDialogTitle>
            <AlertDialogDescription className="body-m text-gray-700">
              &quot;{deleteWarehouse?.name}&quot; 창고를 삭제하시겠습니까? 이 작업은 되돌릴 수
              없으며 모든 관련 재고 데이터가 함께 삭제됩니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-400 bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-[var(--radius-md)] body-m">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-[var(--semantic-error)] text-gray-100 hover:bg-[var(--semantic-error)]/90 rounded-[var(--radius-md)] body-m"
            >
              {deleteWarehouseMutation.isPending ? '삭제 중...' : '삭제'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
