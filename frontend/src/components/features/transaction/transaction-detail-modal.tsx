'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Transaction } from '@/lib/api/transactions';
import { ArrowDownIcon, ArrowUpIcon } from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  open: boolean;
  onClose: () => void;
}

export function TransactionDetailModal({
  transaction,
  open,
  onClose,
}: TransactionDetailModalProps) {
  if (!transaction) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getTypeIcon = (type: 'INBOUND' | 'OUTBOUND') => {
    if (type === 'INBOUND') {
      return <ArrowDownIcon className="h-4 w-4" />;
    }
    return <ArrowUpIcon className="h-4 w-4" />;
  };

  const getTypeBadge = (type: 'INBOUND' | 'OUTBOUND') => {
    if (type === 'INBOUND') {
      return (
        <Badge variant="default" className="flex w-fit items-center gap-1">
          {getTypeIcon(type)}
          Inbound
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex w-fit items-center gap-1">
        {getTypeIcon(type)}
        Outbound
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Transaction Details</DialogTitle>
          <DialogDescription>View detailed information about this transaction</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Type */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Transaction Type</h4>
            {getTypeBadge(transaction.type)}
          </div>

          {/* Warehouse Information */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Warehouse</h4>
            <div className="rounded-lg border p-3">
              <p className="font-medium">{transaction.warehouse?.name}</p>
              <p className="text-sm text-muted-foreground">{transaction.warehouse?.location}</p>
            </div>
          </div>

          {/* Item Information */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Item</h4>
            <div className="rounded-lg border p-3">
              <p className="font-medium">{transaction.item?.name}</p>
              <p className="text-sm text-muted-foreground">
                SKU: {transaction.item?.sku} | Unit: {transaction.item?.unitOfMeasure}
              </p>
            </div>
          </div>

          {/* Quantity */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Quantity</h4>
            <p className="text-2xl font-bold">
              {transaction.quantity} {transaction.item?.unitOfMeasure}
            </p>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">Notes</h4>
              <div className="rounded-lg border p-3">
                <p className="text-sm">{transaction.notes}</p>
              </div>
            </div>
          )}

          {/* Created By */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Created By</h4>
            <div className="rounded-lg border p-3">
              <p className="font-medium">{transaction.user?.name}</p>
              <p className="text-sm text-muted-foreground">{transaction.user?.email}</p>
            </div>
          </div>

          {/* Timestamp */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">Date & Time</h4>
            <p className="text-sm">{formatDate(transaction.createdAt)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
