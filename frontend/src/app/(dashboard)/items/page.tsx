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
    <div className="space-y-[var(--space-6)]">
      <div className="flex items-center justify-between">
        <div className="space-y-[var(--space-2)]">
          <h1 className="title-l text-gray-900">아이템 관리</h1>
          <p className="body-s text-gray-700">재고 아이템을 관리하세요</p>
        </div>
        <Button
          onClick={() => setIsRegisterModalOpen(true)}
          className="bg-[var(--primary-default)] text-gray-100 hover:bg-[var(--primary-hover)] rounded-[var(--radius-md)] body-m font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" />
          아이템 등록
        </Button>
      </div>

      <div className="flex gap-[var(--space-4)]">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-600" />
          <Input
            placeholder="SKU, 이름 또는 카테고리로 검색..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 border-gray-400 bg-gray-100 rounded-[var(--radius-md)] body-m text-gray-900 placeholder:text-gray-600"
          />
        </div>
        <Input
          placeholder="카테고리 필터..."
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="max-w-xs border-gray-400 bg-gray-100 rounded-[var(--radius-md)] body-m text-gray-900 placeholder:text-gray-600"
        />
      </div>

      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="body-m text-gray-600">아이템을 불러오는 중...</div>
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
        <AlertDialogContent className="border-gray-400 bg-gray-100 rounded-[var(--radius-lg)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="title-m text-gray-900">아이템 삭제</AlertDialogTitle>
            <AlertDialogDescription className="body-m text-gray-700">
              {itemToDelete?.name} ({itemToDelete?.sku})를 삭제하시겠습니까? 이 작업은 되돌릴 수
              없습니다.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="border-gray-400 bg-gray-100 text-gray-900 hover:bg-gray-200 rounded-[var(--radius-md)] body-m">
              취소
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-[var(--semantic-error)] text-gray-100 hover:bg-[var(--semantic-error)]/90 rounded-[var(--radius-md)] body-m"
            >
              삭제
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
