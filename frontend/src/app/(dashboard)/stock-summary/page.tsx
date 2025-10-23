'use client';

import { Fragment, useState } from 'react';
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
import { ChevronDown, ChevronRight, Package, TrendingDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';

export default function StockSummaryPage() {
  const { data: stockSummary, isLoading } = useStockSummary();
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());

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
  const totalStock =
    stockSummary?.reduce((sum, item) => sum + item.totalQuantity, 0) || 0;
  const lowStockItems =
    stockSummary?.filter((item) => item.isLowStock).length || 0;

  return (
    <div className='space-y-6'>
      <div>
        <h1 className='text-3xl font-bold'>재고 현황</h1>
        <p className='text-muted-foreground'>
          아이템별 총 재고량 및 창고별 분포를 확인하세요
        </p>
      </div>

      {/* 요약 카드 */}
      <div className='grid gap-4 md:grid-cols-3'>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>총 아이템</CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>{totalItems}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>총 재고량</CardTitle>
            <Package className='h-4 w-4 text-muted-foreground' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold'>
              {totalStock.toLocaleString()}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
            <CardTitle className='text-sm font-medium'>재주문 필요</CardTitle>
            <TrendingDown className='h-4 w-4 text-destructive' />
          </CardHeader>
          <CardContent>
            <div className='text-2xl font-bold text-destructive'>
              {lowStockItems}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 재고 현황 테이블 */}
      {isLoading ? (
        <div className='flex h-96 items-center justify-center'>
          <div className='text-muted-foreground'>
            재고 현황을 불러오는 중...
          </div>
        </div>
      ) : (
        <div className='rounded-md border'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className='w-12'></TableHead>
                <TableHead>SKU</TableHead>
                <TableHead>아이템명</TableHead>
                <TableHead>카테고리</TableHead>
                <TableHead>단위</TableHead>
                <TableHead className='text-right'>총 재고량</TableHead>
                <TableHead className='text-right'>재주문 기준</TableHead>
                <TableHead>상태</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {stockSummary && stockSummary.length > 0 ? (
                stockSummary.map((item, index) => (
                  <Fragment key={index}>
                    <TableRow
                      key={item.id}
                      className='cursor-pointer hover:bg-muted/50'
                    >
                      <TableCell onClick={() => toggleRow(item.id)}>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-8 w-8 p-0'
                        >
                          {expandedRows.has(item.id) ? (
                            <ChevronDown className='h-4 w-4' />
                          ) : (
                            <ChevronRight className='h-4 w-4' />
                          )}
                        </Button>
                      </TableCell>
                      <TableCell className='font-medium'>{item.sku}</TableCell>
                      <TableCell>{item.name}</TableCell>
                      <TableCell>{item.category || '-'}</TableCell>
                      <TableCell>{item.unitOfMeasure}</TableCell>
                      <TableCell className='text-right font-semibold'>
                        {item.totalQuantity.toLocaleString()}
                      </TableCell>
                      <TableCell className='text-right'>
                        {item.reorderThreshold?.toLocaleString() || '-'}
                      </TableCell>
                      <TableCell>
                        {item.isLowStock ? (
                          <Badge variant='destructive'>재주문 필요</Badge>
                        ) : (
                          <Badge variant='secondary'>정상</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                    {expandedRows.has(item.id) && (
                      <TableRow>
                        <TableCell colSpan={8} className='bg-muted/30 p-0'>
                          <div className='p-4'>
                            <h4 className='mb-3 font-semibold'>
                              창고별 재고 분포
                            </h4>
                            {item.warehouseDistribution.length > 0 ? (
                              <div className='grid gap-2 md:grid-cols-2 lg:grid-cols-3'>
                                {item.warehouseDistribution.map((dist) => (
                                  <div
                                    key={dist.warehouseId}
                                    className='rounded-lg border bg-background p-3'
                                  >
                                    <div className='flex items-start justify-between'>
                                      <div>
                                        <p className='font-medium'>
                                          {dist.warehouseName}
                                        </p>
                                        <p className='text-sm text-muted-foreground'>
                                          {dist.warehouseLocation}
                                        </p>
                                      </div>
                                      <Badge variant='outline' className='ml-2'>
                                        {dist.quantity.toLocaleString()}{' '}
                                        {item.unitOfMeasure}
                                      </Badge>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              <p className='text-sm text-muted-foreground'>
                                이 아이템은 아직 어느 창고에도 보관되어 있지
                                않습니다.
                              </p>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={8} className='h-24 text-center'>
                    아이템이 없습니다.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
