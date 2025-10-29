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
import type { Transaction } from '@/lib/api/transactions';
import { ArrowDownIcon, ArrowUpIcon, ArrowLeftRight, Eye, Package } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  onViewDetails: (transaction: Transaction) => void;
}

export function TransactionTable({ transactions, onViewDetails }: TransactionTableProps) {
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
        <Badge variant="default" className="flex items-center gap-1">
          {getTypeIcon(type)}
          입고
        </Badge>
      );
    }
    if (type === 'TRANSFER') {
      return (
        <Badge variant="outline" className="flex items-center gap-1 border-blue-500 text-blue-700">
          {getTypeIcon(type)}
          이동
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        {getTypeIcon(type)}
        출고
      </Badge>
    );
  };

  const getTransactionSummary = (transaction: Transaction) => {
    const itemCount = transaction.items.length;

    if (itemCount === 1) {
      const item = transaction.items[0];
      return {
        warehouse: `${item.warehouse.name}`,
        itemInfo: `${item.item.name}`,
        quantity: `${item.quantity} ${item.item.unitOfMeasure}`,
      };
    }

    // Get unique warehouses
    const uniqueWarehouses = Array.from(
      new Set(transaction.items.map(item => item.warehouse.name))
    );

    return {
      warehouse: uniqueWarehouses.length === 1
        ? uniqueWarehouses[0]
        : `${uniqueWarehouses.length}개 창고`,
      itemInfo: `${itemCount}개 아이템`,
      quantity: null,
    };
  };

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">거래 내역이 없습니다</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>유형</TableHead>
            <TableHead>창고</TableHead>
            <TableHead>아이템 정보</TableHead>
            <TableHead className="text-right">수량</TableHead>
            <TableHead>거래 일시</TableHead>
            <TableHead>등록자</TableHead>
            <TableHead className="text-right">작업</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => {
            const summary = getTransactionSummary(transaction);
            const itemCount = transaction.items.length;

            return (
              <TableRow key={transaction.id}>
                <TableCell>{getTypeBadge(transaction.type)}</TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{summary.warehouse}</p>
                    {itemCount > 1 && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                        <Package className="h-3 w-3" />
                        여러 위치
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{summary.itemInfo}</p>
                    {itemCount === 1 && (
                      <p className="text-sm text-muted-foreground">
                        {transaction.items[0].item.sku}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-right font-medium">
                  {summary.quantity || (
                    <Badge variant="outline" className="font-normal">
                      {itemCount}개 항목
                    </Badge>
                  )}
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {formatDate(transaction.createdAt)}
                </TableCell>
                <TableCell className="text-sm">{transaction.user?.name}</TableCell>
                <TableCell className="text-right">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onViewDetails(transaction)}
                    className="h-8 w-8 p-0"
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
