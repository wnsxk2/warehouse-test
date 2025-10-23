'use client';

import { useState } from 'react';
import { useTransactions } from '@/lib/hooks/use-transactions';
import { TransactionFilters } from '@/components/features/transaction/transaction-filters';
import { TransactionTable } from '@/components/features/transaction/transaction-table';
import { TransactionDetailModal } from '@/components/features/transaction/transaction-detail-modal';
import { CreateTransactionModal } from '@/components/features/transaction/create-transaction-modal';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import type { Transaction } from '@/lib/api/transactions';

export default function TransactionsPage() {
  const [filters, setFilters] = useState<{
    type?: 'INBOUND' | 'OUTBOUND' | '';
    warehouseId?: string;
    itemId?: string;
    startDate?: string;
    endDate?: string;
  }>({
    type: '',
    warehouseId: '',
    itemId: '',
    startDate: '',
    endDate: '',
  });

  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // Build filters for API
  const apiFilters = {
    ...(filters.type && { type: filters.type as 'INBOUND' | 'OUTBOUND' }),
    ...(filters.warehouseId && { warehouseId: filters.warehouseId }),
    ...(filters.itemId && { itemId: filters.itemId }),
    ...(filters.startDate && { startDate: filters.startDate }),
    ...(filters.endDate && { endDate: filters.endDate }),
  };

  const { data: transactions, isLoading, error } = useTransactions(apiFilters);

  const handleViewDetails = (transaction: Transaction) => {
    setSelectedTransaction(transaction);
    setIsDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setIsDetailModalOpen(false);
    setSelectedTransaction(null);
  };

  return (
    <div className="space-y-[var(--space-6)]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-[var(--space-2)]">
          <h1 className="title-l text-gray-900">거래 내역</h1>
          <p className="body-s text-gray-700">모든 입출고 거래 내역을 확인하고 추적하세요</p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="bg-[var(--primary-default)] text-gray-100 hover:bg-[var(--primary-hover)] rounded-[var(--radius-md)] body-m font-semibold"
        >
          <Plus className="mr-2 h-4 w-4" />
          거래 등록
        </Button>
      </div>

      {/* Filters */}
      <TransactionFilters filters={filters} onFilterChange={setFilters} />

      {/* Transaction Table */}
      {isLoading && (
        <div className="rounded-[var(--radius-md)] border border-gray-400 bg-gray-100 p-8 text-center">
          <p className="body-m text-gray-600">거래 내역을 불러오는 중...</p>
        </div>
      )}

      {error && (
        <div className="rounded-[var(--radius-md)] border border-[var(--semantic-error)] bg-[var(--semantic-error-light)] p-8 text-center">
          <p className="body-m text-[var(--semantic-error)]">거래 내역을 불러오지 못했습니다</p>
        </div>
      )}

      {!isLoading && !error && transactions && (
        <>
          <div className="flex items-center justify-between">
            <p className="body-s text-gray-700">
              {transactions.length}개의 거래 내역
            </p>
          </div>

          <TransactionTable transactions={transactions} onViewDetails={handleViewDetails} />
        </>
      )}

      {/* Transaction Detail Modal */}
      <TransactionDetailModal
        transaction={selectedTransaction}
        open={isDetailModalOpen}
        onClose={handleCloseDetailModal}
      />

      {/* Create Transaction Modal */}
      <CreateTransactionModal
        open={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
      />
    </div>
  );
}
