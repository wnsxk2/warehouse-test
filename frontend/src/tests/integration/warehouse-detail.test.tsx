import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import WarehouseDetailPage from '@/app/(dashboard)/warehouses/[id]/page';

const mockWarehouse = {
  id: 'warehouse-1',
  name: 'Seoul Warehouse',
  location: 'Seoul, Korea',
  capacity: 1000,
  companyId: 'company-1',
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
  deletedAt: null,
  _count: {
    inventory: 3,
  },
};

const mockInventory = [
  {
    id: 'inv-1',
    warehouseId: 'warehouse-1',
    itemId: 'item-1',
    quantity: 100,
    minStockLevel: 10,
    maxStockLevel: 500,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    item: {
      id: 'item-1',
      name: 'Laptop',
      sku: 'LAP-001',
      category: 'Electronics',
    },
  },
  {
    id: 'inv-2',
    warehouseId: 'warehouse-1',
    itemId: 'item-2',
    quantity: 50,
    minStockLevel: 5,
    maxStockLevel: 200,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    item: {
      id: 'item-2',
      name: 'Mouse',
      sku: 'MOU-001',
      category: 'Electronics',
    },
  },
];

const server = setupServer(
  rest.get('http://localhost:3001/api/warehouses/:id', (req, res, ctx) => {
    return res(ctx.json(mockWarehouse));
  }),
  rest.get('http://localhost:3001/api/warehouses/:id/inventory', (req, res, ctx) => {
    return res(ctx.json(mockInventory));
  }),
  rest.post('http://localhost:3001/api/inventory', async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(201),
      ctx.json({
        id: 'inv-3',
        ...body,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    );
  }),
  rest.patch('http://localhost:3001/api/inventory/:id', async (req, res, ctx) => {
    const { id } = req.params;
    const body = await req.json();
    const inventory = mockInventory.find((inv) => inv.id === id);

    if (!inventory) {
      return res(ctx.status(404), ctx.json({ message: 'Inventory not found' }));
    }

    return res(
      ctx.json({
        ...inventory,
        ...body,
        updatedAt: new Date(),
      })
    );
  })
);

beforeAll(() => server.listen());
afterEach(() => server.resetHandlers());
afterAll(() => server.close());

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  Wrapper.displayName = 'QueryWrapper';

  return Wrapper;
};

describe('Warehouse Detail Page', () => {
  const mockParams = { id: 'warehouse-1' };

  it('should render warehouse details', async () => {
    render(<WarehouseDetailPage params={mockParams} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Seoul Warehouse')).toBeInTheDocument();
      expect(screen.getByText('Seoul, Korea')).toBeInTheDocument();
    });
  });

  it('should display inventory list', async () => {
    render(<WarehouseDetailPage params={mockParams} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Laptop')).toBeInTheDocument();
      expect(screen.getByText('Mouse')).toBeInTheDocument();
      expect(screen.getByText('LAP-001')).toBeInTheDocument();
      expect(screen.getByText('MOU-001')).toBeInTheDocument();
    });
  });

  it('should display inventory quantities', async () => {
    render(<WarehouseDetailPage params={mockParams} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/100/)).toBeInTheDocument();
      expect(screen.getByText(/50/)).toBeInTheDocument();
    });
  });

  it('should show capacity utilization', async () => {
    render(<WarehouseDetailPage params={mockParams} />, { wrapper: createWrapper() });

    await waitFor(() => {
      // Total quantity: 100 + 50 = 150 out of 1000
      expect(screen.getByText(/150.*1000/i)).toBeInTheDocument();
    });
  });

  it('should open add item modal', async () => {
    const user = userEvent.setup();
    render(<WarehouseDetailPage params={mockParams} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Seoul Warehouse')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add item/i });
    await user.click(addButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('should handle loading state', () => {
    server.use(
      rest.get('http://localhost:3001/api/warehouses/:id', (req, res, ctx) => {
        return res(ctx.delay('infinite'));
      })
    );

    render(<WarehouseDetailPage params={mockParams} />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    server.use(
      rest.get('http://localhost:3001/api/warehouses/:id', (req, res, ctx) => {
        return res(ctx.status(404), ctx.json({ message: 'Warehouse not found' }));
      })
    );

    render(<WarehouseDetailPage params={mockParams} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should display low stock warnings', async () => {
    server.use(
      rest.get('http://localhost:3001/api/warehouses/:id/inventory', (req, res, ctx) => {
        return res(
          ctx.json([
            {
              ...mockInventory[0],
              quantity: 5, // Below minStockLevel of 10
            },
          ])
        );
      })
    );

    render(<WarehouseDetailPage params={mockParams} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/low stock/i)).toBeInTheDocument();
    });
  });

  it('should show empty state when no inventory', async () => {
    server.use(
      rest.get('http://localhost:3001/api/warehouses/:id/inventory', (req, res, ctx) => {
        return res(ctx.json([]));
      })
    );

    render(<WarehouseDetailPage params={mockParams} />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/no inventory items/i)).toBeInTheDocument();
    });
  });
});
