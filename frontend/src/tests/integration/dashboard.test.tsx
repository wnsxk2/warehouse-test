import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DashboardPage from '../../app/(dashboard)/dashboard/page';

// Mock useAuth hook
vi.mock('../../lib/hooks/use-auth', () => ({
  useAuth: vi.fn(() => ({
    user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'ADMIN', companyId: '1' },
    isAuthenticated: true,
    isLoading: false,
  })),
}));

// Mock API client
vi.mock('../../lib/api/client', () => ({
  default: {
    get: vi.fn((url: string) => {
      if (url === '/dashboard/stats') {
        return Promise.resolve({
          data: {
            totalWarehouses: 2,
            totalItems: 3,
            lowStockItems: 1,
            totalTransactions: 4,
          },
        });
      }
      if (url === '/dashboard/recent-transactions') {
        return Promise.resolve({
          data: [
            {
              id: '1',
              type: 'INBOUND',
              quantity: 100,
              createdAt: new Date().toISOString(),
              warehouse: { name: 'Main Warehouse' },
              item: { name: 'Widget A', sku: 'ITEM-001' },
            },
          ],
        });
      }
      return Promise.reject(new Error('Not found'));
    }),
  },
}));

describe('Dashboard Page', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  it('should render dashboard title', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Dashboard/i)).toBeDefined();
  });

  it('should display loading state initially', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );

    // Initial render should show placeholders or loading state
    const placeholders = screen.queryAllByText('--');
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it('should display statistics after loading', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );

    await waitFor(() => {
      // Should no longer show all placeholders
      const placeholders = screen.queryAllByText('--');
      expect(placeholders.length).toBe(0);
    });
  });

  it('should render statistics cards', () => {
    render(
      <QueryClientProvider client={queryClient}>
        <DashboardPage />
      </QueryClientProvider>
    );

    expect(screen.getByText(/Total Items/i)).toBeDefined();
    expect(screen.getByText(/Warehouses/i)).toBeDefined();
  });
});
