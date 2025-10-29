'use client';

import { useState } from 'react';
import { useStockSummary } from '@/lib/hooks/use-items';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Package, TrendingDown, ArrowLeftRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TransferInventoryModal } from '@/components/features/transaction/transfer-inventory-modal';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { transactionsApi, TransferInventoryRequest } from '@/lib/api/transactions';
import { useToast } from '@/hooks/use-toast';

export default function StockSummaryPage() {
  const { data: stockSummary, isLoading } = useStockSummary();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const transferMutation = useMutation({
    mutationFn: (data: TransferInventoryRequest) => transactionsApi.transfer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockSummary'] });
      queryClient.invalidateQueries({ queryKey: ['transactions'] });
      queryClient.invalidateQueries({ queryKey: ['warehouses'] });
      setIsTransferModalOpen(false);
      toast({
        title: '성공',
        description: '재고가 성공적으로 이동되었습니다.',
      });
    },
    onError: (error: unknown) => {
      const errorResponse = error as { response?: { data?: { message?: string } } };
      const message = errorResponse?.response?.data?.message || '재고 이동에 실패했습니다.';
      toast({
        title: '오류',
        description: message,
        variant: 'destructive',
      });
    },
  });

  const toggleRow = (itemId: string) => {
    setExpandedRows((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(itemId)) {
        newSet.delete(itemId);
      } else {
        newSet.add(itemId);
      }
      return newSet;
    });
  };

  const totalItems = stockSummary?.length || 0;
  const totalStock = stockSummary?.reduce((sum, item) => sum + item.totalQuantity, 0) || 0;
  const lowStockItems = stockSummary?.filter((item) => item.isLowStock).length || 0;

  return (
    <div className="space-y-[var(--space-6)]">
      {/* 페이지 헤더 */}
      <div className="flex items-center justify-between">
        <div className="space-y-[var(--space-2)]">
          <h1 className="title-l text-gray-900">재고 현황</h1>
          <p className="body-s text-gray-700">아이템별 총 재고량 및 창고별 분포를 확인하세요</p>
        </div>
        <Button onClick={() => setIsTransferModalOpen(true)}>
          <ArrowLeftRight className="mr-2 h-4 w-4" />
          재고 이동
        </Button>
      </div>

      {/* 요약 카드 */}
      <div className="grid gap-[var(--space-4)] md:grid-cols-3">
        <Card className="border-gray-400 bg-gray-100 shadow-sm rounded-[var(--radius-md)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-[var(--space-2)]">
            <CardTitle className="body-m font-semibold text-gray-800">총 아이템</CardTitle>
            <Package className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="title-l text-gray-900">{totalItems}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-400 bg-gray-100 shadow-sm rounded-[var(--radius-md)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-[var(--space-2)]">
            <CardTitle className="body-m font-semibold text-gray-800">총 재고량</CardTitle>
            <Package className="h-5 w-5 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="title-l text-gray-900">{totalStock.toLocaleString()}</div>
          </CardContent>
        </Card>

        <Card className="border-gray-400 bg-gray-100 shadow-sm rounded-[var(--radius-md)]">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-[var(--space-2)]">
            <CardTitle className="body-m font-semibold text-gray-800">재주문 필요</CardTitle>
            <TrendingDown className="h-5 w-5 text-[var(--semantic-error)]" />
          </CardHeader>
          <CardContent>
            <div className="title-l text-[var(--semantic-error)]">{lowStockItems}</div>
          </CardContent>
        </Card>
      </div>

      {/* 재고 현황 테이블 */}
      {isLoading ? (
        <div className="flex h-96 items-center justify-center">
          <div className="body-m text-gray-600">재고 현황을 불러오는 중...</div>
        </div>
      ) : (
        <div className="rounded-[var(--radius-md)] border border-gray-400 bg-gray-100 shadow-sm">
          <Table>
            <TableHeader>
              <TableRow className="border-b border-gray-400 bg-gray-200">
                <TableHead className="w-12"></TableHead>
                <TableHead className="title-s text-gray-900">SKU</TableHead>
                <TableHead className="title-s text-gray-900">아이템명</TableHead>
                <TableHead className="title-s text-gray-900">카테고리</TableHead>
                <TableHead className="title-s text-gray-900">단위</TableHead>
                <TableHead className="title-s text-right text-gray-900">총 재고량</TableHead>
                <TableHead className="title-s text-right text-gray-900">재주문 기준</TableHead>
                <TableHead className="title-s text-gray-900">상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockSummary && stockSummary.length > 0 ? (
                stockSummary.map((item) => (
                  <>
                    <TableRow
                      key={item.id}
                      className="cursor-pointer border-b border-gray-400 transition-colors hover:bg-gray-200"
                    >
                      <TableCell onClick={() => toggleRow(item.id)}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-gray-300"
                        >
                          {expandedRows.has(item.id) ? (
                            <ChevronDown className="h-4 w-4 text-gray-800" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-gray-800" />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className="body-m font-medium text-gray-900">{item.sku}</TableCell>
                      <TableCell className="body-m text-gray-800">{item.name}</TableCell>
                      <TableCell className="body-m text-gray-700">
                        {item.category || '-'}
                      </TableCell>
                      <TableCell className="body-m text-gray-700">{item.unitOfMeasure}</TableCell>
                      <TableCell className="body-m text-right font-semibold text-gray-900">
                        {item.totalQuantity.toLocaleString()}
                      </TableCell>
                      <TableCell className="body-m text-right text-gray-700">
                        {item.reorderThreshold?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell>
                        {item.isLowStock ? (
                          <Badge
                            variant="destructive"
                            className="bg-[var(--semantic-error-light)] text-[var(--semantic-error)] border-[var(--semantic-error)] rounded-[var(--radius-sm)]"
                          >
                            재주문 필요
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-[var(--semantic-success-light)] text-[var(--semantic-success)] border-[var(--semantic-success)] rounded-[var(--radius-sm)]"
                          >
                            정상
                          </Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(item.id) && (
                      <TableRow>
                        <TableCell colSpan={8} className="bg-gray-200 p-0">
                          <div className="p-[var(--space-4)]">
                            <h4 className="title-s mb-[var(--space-3)] text-gray-900">
                              창고별 재고 분포
                            </h4>
                            {item.warehouseDistribution.length > 0 ? (
                              <div className="grid gap-[var(--space-2)] md:grid-cols-2 lg:grid-cols-3">
                                {item.warehouseDistribution.map((dist) => (
                                  <div
                                    key={dist.warehouseId}
                                    className="rounded-[var(--radius-md)] border border-gray-400 bg-gray-100 p-[var(--space-3)] shadow-sm"
                                  >
                                    <div className="flex items-start justify-between">
                                      <div>
                                        <p className="body-m font-medium text-gray-900">
                                          {dist.warehouseName}
                                        </p>
                                        <p className="body-s text-gray-700">
                                          {dist.warehouseLocation}
                                        </p>
                                      </div>
                                      <Badge
                                        variant="outline"
                                        className="ml-[var(--space-2)] border-[var(--primary-default)] text-[var(--primary-default)] rounded-[var(--radius-sm)]"
                                      >
                                        <span className="body-s font-semibold">
                                          {dist.quantity.toLocaleString()} {item.unitOfMeasure}
                                        </span>
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className="body-s text-gray-600">
                                이 아이템은 아직 어느 창고에도 보관되어 있지 않습니다.
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className="h-24 text-center">
                    <p className="body-m text-gray-600">아이템이 없습니다.</p>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {/* 재고 이동 모달 */}
      <TransferInventoryModal
        open={isTransferModalOpen}
        onOpenChange={setIsTransferModalOpen}
        onSubmit={(values) => transferMutation.mutate(values)}
      />
    </div>
  );
}
