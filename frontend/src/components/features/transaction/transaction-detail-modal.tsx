'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { Transaction } from '@/lib/api/transactions';
import { ArrowDownIcon, ArrowUpIcon, ArrowLeftRight } from 'lucide-react';

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
    return new Date(dateString).toLocaleString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTypeIcon = (type: 'INBOUND' | 'OUTBOUND' | 'TRANSFER') => {
    if (type === 'INBOUND') {
      return <ArrowDownIcon className="h-4 w-4" />;
    }
    if (type === 'TRANSFER') {
      return <ArrowLeftRight className="h-4 w-4" />;
    }
    return <ArrowUpIcon className="h-4 w-4" />;
  };

  const getTypeBadge = (type: 'INBOUND' | 'OUTBOUND' | 'TRANSFER') => {
    if (type === 'INBOUND') {
      return (
        <Badge variant="default" className="flex w-fit items-center gap-1">
          {getTypeIcon(type)}
          입고
        </Badge>
      );
    }
    if (type === 'TRANSFER') {
      return (
        <Badge variant="outline" className="flex w-fit items-center gap-1 border-blue-500 text-blue-700">
          {getTypeIcon(type)}
          이동
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex w-fit items-center gap-1">
        {getTypeIcon(type)}
        출고
      </Badge>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>거래 상세 정보</DialogTitle>
          <DialogDescription>거래 내역의 상세 정보를 확인하세요</DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Transaction Type */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">거래 유형</h4>
            {getTypeBadge(transaction.type)}
          </div>

          {/* Transaction Items */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">
              거래 항목 ({transaction.items.length}개)
            </h4>
            <div className="rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>창고</TableHead>
                    <TableHead>아이템</TableHead>
                    <TableHead className="text-right">수량</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transaction.items.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.warehouse.name}</p>
                          <p className="text-xs text-muted-foreground">{item.warehouse.location}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.item.name}</p>
                          <p className="text-sm text-muted-foreground">SKU: {item.item.sku}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {item.quantity} {item.item.unitOfMeasure}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Notes */}
          {transaction.notes && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground">비고</h4>
              <div className="rounded-lg border p-3">
                <p className="text-sm">{transaction.notes}</p>
              </div>
            </div>
          )}

          {/* Created By */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">등록자</h4>
            <div className="rounded-lg border p-3">
              <p className="font-medium">{transaction.user?.name}</p>
              <p className="text-sm text-muted-foreground">{transaction.user?.email}</p>
            </div>
          </div>

          {/* Timestamp */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground">거래 일시</h4>
            <p className="text-sm">{formatDate(transaction.createdAt)}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
