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
import { ArrowDownIcon, ArrowUpIcon, Eye } from 'lucide-react';

interface TransactionTableProps {
  transactions: Transaction[];
  onViewDetails: (transaction: Transaction) => void;
}

export function TransactionTable({ transactions, onViewDetails }: TransactionTableProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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
        <Badge variant="default" className="flex items-center gap-1">
          {getTypeIcon(type)}
          Inbound
        </Badge>
      );
    }
    return (
      <Badge variant="secondary" className="flex items-center gap-1">
        {getTypeIcon(type)}
        Outbound
      </Badge>
    );
  };

  if (transactions.length === 0) {
    return (
      <div className="rounded-lg border p-8 text-center">
        <p className="text-muted-foreground">No transactions found</p>
      </div>
    );
  }

  return (
    <div className="rounded-lg border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Warehouse</TableHead>
            <TableHead>Item</TableHead>
            <TableHead className="text-right">Quantity</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Created By</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((transaction) => (
            <TableRow key={transaction.id}>
              <TableCell>{getTypeBadge(transaction.type)}</TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{transaction.warehouse?.name}</p>
                  <p className="text-sm text-muted-foreground">{transaction.warehouse?.location}</p>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  <p className="font-medium">{transaction.item?.name}</p>
                  <p className="text-sm text-muted-foreground">{transaction.item?.sku}</p>
                </div>
              </TableCell>
              <TableCell className="text-right font-medium">
                {transaction.quantity} {transaction.item?.unitOfMeasure}
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
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
