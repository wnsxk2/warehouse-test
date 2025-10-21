'use client';

import { useDashboardStats, useRecentTransactions } from '@/lib/hooks/use-dashboard';
import { StatsCard } from '@/components/features/dashboard/stats-card';
import { RecentTransactions } from '@/components/features/dashboard/recent-transactions';
import { LowStockAlerts } from '@/components/features/dashboard/low-stock-alerts';

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: transactions, isLoading: transactionsLoading } = useRecentTransactions();

  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900">Dashboard</h1>
      <p className="mt-2 text-gray-600">Welcome to Warehouse ERP System</p>

      {/* Low Stock Alerts */}
      {stats && stats.lowStockItems > 0 && (
        <div className="mt-6">
          <LowStockAlerts count={stats.lowStockItems} isLoading={statsLoading} />
        </div>
      )}

      {/* Statistics Cards */}
      <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Items"
          value={stats?.totalItems ?? '--'}
          icon="📦"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Warehouses"
          value={stats?.totalWarehouses ?? '--'}
          icon="🏭"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Transactions (30d)"
          value={stats?.totalTransactions ?? '--'}
          icon="📊"
          isLoading={statsLoading}
        />
        <StatsCard
          title="Low Stock Items"
          value={stats?.lowStockItems ?? '--'}
          icon="⚠️"
          isLoading={statsLoading}
        />
      </div>

      {/* Recent Transactions */}
      <div className="mt-8">
        <h2 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h2>
        <RecentTransactions
          transactions={transactions || []}
          isLoading={transactionsLoading}
        />
      </div>
    </div>
  );
}
