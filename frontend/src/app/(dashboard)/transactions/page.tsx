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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transaction History</h1>
          <p className="text-muted-foreground">
            View and track all inbound and outbound transactions
          </p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          New Transaction
        </Button>
      </div>

      {/* Filters */}
      <TransactionFilters filters={filters} onFilterChange={setFilters} />

      {/* Transaction Table */}
      {isLoading && (
        <div className="rounded-lg border p-8 text-center">
          <p className="text-muted-foreground">Loading transactions...</p>
        </div>
      )}

      {error && (
        <div className="rounded-lg border border-destructive p-8 text-center">
          <p className="text-destructive">Failed to load transactions</p>
        </div>
      )}

      {!isLoading && !error && transactions && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Showing {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
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
