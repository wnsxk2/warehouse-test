export class DashboardStatsDto {
  totalWarehouses!: number;
  totalItems!: number;
  lowStockItems!: number;
  totalTransactions!: number;
}

export class RecentTransactionDto {
  id!: string;
  type!: string;
  quantity!: number;
  notes?: string;
  createdAt!: Date;
  warehouse!: {
    id: string;
    name: string;
  };
  item!: {
    id: string;
    name: string;
    sku: string;
  };
  user!: {
    id: string;
    name: string;
  };
}
