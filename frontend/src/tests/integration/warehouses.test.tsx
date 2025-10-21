import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { rest } from 'msw';
import { setupServer } from 'msw/node';
import WarehousesPage from '@/app/(dashboard)/warehouses/page';

const mockWarehouses = [
  {
    id: '1',
    name: 'Seoul Warehouse',
    location: 'Seoul, Korea',
    capacity: 1000,
    companyId: 'company-1',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    deletedAt: null,
    _count: {
      inventory: 50,
    },
  },
  {
    id: '2',
    name: 'Busan Warehouse',
    location: 'Busan, Korea',
    capacity: 1500,
    companyId: 'company-1',
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    deletedAt: null,
    _count: {
      inventory: 75,
    },
  },
];

const server = setupServer(
  rest.get('http://localhost:3001/api/warehouses', (req, res, ctx) => {
    return res(ctx.json(mockWarehouses));
  }),
  rest.post('http://localhost:3001/api/warehouses', async (req, res, ctx) => {
    const body = await req.json();
    return res(
      ctx.status(201),
      ctx.json({
        id: '3',
        ...body,
        companyId: 'company-1',
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null,
        _count: {
          inventory: 0,
        },
      })
    );
  }),
  rest.patch('http://localhost:3001/api/warehouses/:id', async (req, res, ctx) => {
    const { id } = req.params;
    const body = await req.json();
    const warehouse = mockWarehouses.find((w) => w.id === id);

    if (!warehouse) {
      return res(ctx.status(404), ctx.json({ message: 'Warehouse not found' }));
    }

    return res(
      ctx.json({
        ...warehouse,
        ...body,
        updatedAt: new Date(),
      })
    );
  }),
  rest.delete('http://localhost:3001/api/warehouses/:id', (req, res, ctx) => {
    const { id } = req.params;
    const warehouse = mockWarehouses.find((w) => w.id === id);

    if (!warehouse) {
      return res(ctx.status(404), ctx.json({ message: 'Warehouse not found' }));
    }

    return res(
      ctx.json({
        ...warehouse,
        deletedAt: new Date(),
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

describe('Warehouses Page', () => {
  it('should render warehouse list', async () => {
    render(<WarehousesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Seoul Warehouse')).toBeInTheDocument();
      expect(screen.getByText('Busan Warehouse')).toBeInTheDocument();
    });
  });

  it('should display warehouse details', async () => {
    render(<WarehousesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Seoul, Korea')).toBeInTheDocument();
      expect(screen.getByText('Busan, Korea')).toBeInTheDocument();
    });

    // Check for capacity information
    expect(screen.getByText(/1000/)).toBeInTheDocument();
    expect(screen.getByText(/1500/)).toBeInTheDocument();

    // Check for inventory count
    expect(screen.getByText(/50.*items/i)).toBeInTheDocument();
    expect(screen.getByText(/75.*items/i)).toBeInTheDocument();
  });

  it('should open add warehouse modal', async () => {
    const user = userEvent.setup();
    render(<WarehousesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Seoul Warehouse')).toBeInTheDocument();
    });

    const addButton = screen.getByRole('button', { name: /add warehouse/i });
    await user.click(addButton);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/location/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/capacity/i)).toBeInTheDocument();
  });

  it('should create a new warehouse', async () => {
    const user = userEvent.setup();
    render(<WarehousesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Seoul Warehouse')).toBeInTheDocument();
    });

    // Open modal
    const addButton = screen.getByRole('button', { name: /add warehouse/i });
    await user.click(addButton);

    // Fill form
    const nameInput = screen.getByLabelText(/name/i);
    const locationInput = screen.getByLabelText(/location/i);
    const capacityInput = screen.getByLabelText(/capacity/i);

    await user.type(nameInput, 'New Warehouse');
    await user.type(locationInput, 'Incheon, Korea');
    await user.type(capacityInput, '2000');

    // Submit form
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    // Verify new warehouse appears in list
    await waitFor(() => {
      expect(screen.getByText('New Warehouse')).toBeInTheDocument();
    });
  });

  it('should validate form inputs', async () => {
    const user = userEvent.setup();
    render(<WarehousesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Seoul Warehouse')).toBeInTheDocument();
    });

    // Open modal
    const addButton = screen.getByRole('button', { name: /add warehouse/i });
    await user.click(addButton);

    // Try to submit empty form
    const submitButton = screen.getByRole('button', { name: /create/i });
    await user.click(submitButton);

    // Check for validation errors
    await waitFor(() => {
      expect(screen.getByText(/name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/location is required/i)).toBeInTheDocument();
      expect(screen.getByText(/capacity is required/i)).toBeInTheDocument();
    });
  });

  it('should handle loading state', () => {
    server.use(
      rest.get('http://localhost:3001/api/warehouses', (req, res, ctx) => {
        return res(ctx.delay('infinite'));
      })
    );

    render(<WarehousesPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should handle error state', async () => {
    server.use(
      rest.get('http://localhost:3001/api/warehouses', (req, res, ctx) => {
        return res(ctx.status(500), ctx.json({ message: 'Server error' }));
      })
    );

    render(<WarehousesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/error/i)).toBeInTheDocument();
    });
  });

  it('should filter warehouses by search', async () => {
    const user = userEvent.setup();
    render(<WarehousesPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Seoul Warehouse')).toBeInTheDocument();
      expect(screen.getByText('Busan Warehouse')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'Seoul');

    await waitFor(() => {
      expect(screen.getByText('Seoul Warehouse')).toBeInTheDocument();
      expect(screen.queryByText('Busan Warehouse')).not.toBeInTheDocument();
    });
  });
});
