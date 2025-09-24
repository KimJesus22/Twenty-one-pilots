import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderHistory from '../components/OrderHistory';
import { getUserOrders, getOrderStats, reorderOrder, formatPaymentMethod, formatPaymentStatus } from '../api/orders';

// Mock de dependencias
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'user123', username: 'testuser' },
    isAuthenticated: true
  })
}));
jest.mock('../contexts/UserPreferencesContext', () => ({
  useUserPreferences: () => ({
    formatPrice: (price) => `$${price.toFixed(2)}`
  })
}));

jest.mock('../api/orders', () => ({
  getUserOrders: jest.fn(),
  getOrderStats: jest.fn(),
  formatOrderStatus: jest.fn((status) => {
    const statusMap = {
      pending: { label: 'Pendiente', color: '#ffa726' },
      confirmed: { label: 'Confirmado', color: '#42a5f5' },
      processing: { label: 'Procesando', color: '#ab47bc' },
      shipped: { label: 'Enviado', color: '#66bb6a' },
      delivered: { label: 'Entregado', color: '#26a69a' },
      cancelled: { label: 'Cancelado', color: '#ef5350' },
      completed: { label: 'Completado', color: '#4caf50' }
    };
    return statusMap[status] || { label: status, color: '#9e9e9e' };
  }),
  formatPaymentMethod: jest.fn((method) => {
    const methodMap = {
      paypal: { name: 'PayPal', description: 'Pago seguro con PayPal', icon: '💳' },
      mercadopago: { name: 'MercadoPago', description: 'Pago con MercadoPago (México)', icon: '💰' },
      stripe: { name: 'Stripe', description: 'Pago con tarjeta', icon: '💳' }
    };
    return methodMap[method] || { name: method, description: 'Método de pago', icon: '💳' };
  }),
  formatPaymentStatus: jest.fn((status) => {
    const statusMap = {
      pending: { label: 'Pendiente', color: '#ffa726' },
      processing: { label: 'Procesando', color: '#42a5f5' },
      completed: { label: 'Completado', color: '#4caf50' },
      failed: { label: 'Fallido', color: '#ef5350' },
      refunded: { label: 'Reembolsado', color: '#8d6e63' }
    };
    return statusMap[status] || { label: status, color: '#9e9e9e' };
  }),
  reorderOrder: jest.fn()
}));

// Las funciones están mockeadas arriba

// Mock de react-router-dom
jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useLocation: () => ({ pathname: '/' })
}));

const mockOrders = [
  {
    _id: 'order1',
    orderNumber: '20240924001',
    createdAt: '2024-09-24T10:00:00Z',
    total: 59.99,
    currency: 'USD',
    status: 'delivered',
    paymentMethod: 'paypal',
    paymentStatus: 'completed',
    paymentReference: 'PAY123456789',
    items: [
      {
        productName: 'Test Product',
        quantity: 1,
        price: 59.99,
        total: 59.99
      }
    ],
    shipping: {
      trackingNumber: 'TR123456789',
      carrier: 'ups',
      currentStatus: 'delivered',
      progress: 100,
      isDelayed: false
    }
  },
  {
    _id: 'order2',
    orderNumber: '20240924002',
    createdAt: '2024-09-20T10:00:00Z',
    total: 1299.99,
    currency: 'MXN',
    status: 'shipped',
    paymentMethod: 'mercadopago',
    paymentStatus: 'completed',
    paymentReference: 'MP987654321',
    items: [
      {
        productName: 'Another Product',
        quantity: 1,
        price: 1299.99,
        total: 1299.99
      }
    ],
    shipping: {
      trackingNumber: 'TR987654321',
      carrier: 'fedex',
      currentStatus: 'in_transit',
      progress: 60,
      isDelayed: false
    }
  },
  {
    _id: 'order3',
    orderNumber: '20240924003',
    createdAt: '2024-09-18T10:00:00Z',
    total: 89.99,
    currency: 'USD',
    status: 'processing',
    paymentMethod: 'stripe',
    paymentStatus: 'processing',
    paymentReference: 'STRIPE456789',
    items: [
      {
        productName: 'Third Product',
        quantity: 1,
        price: 89.99,
        total: 89.99
      }
    ]
  }
];

const mockStats = {
  totalOrders: 3,
  totalSpent: 1449.97,
  averageOrderValue: 483.32,
  lastOrderDate: '2024-09-24T10:00:00Z',
  statusBreakdown: {
    delivered: 1,
    shipped: 1,
    processing: 1
  }
};

describe('OrderHistory Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default mocks
    getUserOrders.mockResolvedValue({
      success: true,
      data: mockOrders,
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalItems: 3,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
      }
    });

    getOrderStats.mockResolvedValue({
      success: true,
      data: mockStats
    });

    reorderOrder.mockResolvedValue({
      success: true,
      data: { totalItems: 1 }
    });
  });

  test('renders loading state initially', () => {
    render(<OrderHistory />);
    expect(screen.getByText('Cargando tu historial de pedidos...')).toBeInTheDocument();
  });

  test('renders orders and stats after loading', async () => {
    render(<OrderHistory />);

    await waitFor(() => {
      expect(screen.getByText('Mis Pedidos')).toBeInTheDocument();
    });

    // Check stats
    expect(screen.getByText('3')).toBeInTheDocument(); // totalOrders
    expect(screen.getByText('$1449.97')).toBeInTheDocument(); // totalSpent
    expect(screen.getByText('$483.32')).toBeInTheDocument(); // averageOrderValue

    // Check orders
    expect(screen.getByText('Pedido #20240924001')).toBeInTheDocument();
    expect(screen.getByText('Pedido #20240924002')).toBeInTheDocument();
  });

  test('filters orders by status', async () => {
    render(<OrderHistory />);

    await waitFor(() => {
      expect(screen.getByText('Mis Pedidos')).toBeInTheDocument();
    });

    // Change filter to delivered
    const statusFilter = screen.getByDisplayValue('Todos los pedidos');
    fireEvent.change(statusFilter, { target: { value: 'delivered' } });

    await waitFor(() => {
      expect(getUserOrders).toHaveBeenCalledWith('user123', expect.objectContaining({
        status: 'delivered'
      }));
    });
  });

  test('changes sort order', async () => {
    render(<OrderHistory />);

    await waitFor(() => {
      expect(screen.getByText('Mis Pedidos')).toBeInTheDocument();
    });

    // Change sort to total descending
    const sortFilter = screen.getByDisplayValue('Fecha (más reciente)');
    fireEvent.change(sortFilter, { target: { value: 'total_desc' } });

    await waitFor(() => {
      expect(getUserOrders).toHaveBeenCalledWith('user123', expect.objectContaining({
        sortBy: 'total',
        sortOrder: 'desc'
      }));
    });
  });

  test('handles reorder functionality', async () => {
    // Mock window.alert
    const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

    render(<OrderHistory />);

    await waitFor(() => {
      expect(screen.getByText('Mis Pedidos')).toBeInTheDocument();
    });

    // Click reorder button
    const reorderButtons = screen.getAllByText('Reordenar');
    fireEvent.click(reorderButtons[0]);

    await waitFor(() => {
      expect(reorderOrder).toHaveBeenCalledWith('order1', 'user123');
      expect(alertMock).toHaveBeenCalledWith('Se agregaron 1 productos al carrito');
    });

    alertMock.mockRestore();
  });

  test('displays shipping information', async () => {
    render(<OrderHistory />);

    await waitFor(() => {
      expect(screen.getByText('Mis Pedidos')).toBeInTheDocument();
    });

    // Check shipping info is displayed
    expect(screen.getByText('TR123456789')).toBeInTheDocument();
    expect(screen.getByText('TR987654321')).toBeInTheDocument();
  });

  test('shows empty state when no orders', async () => {
    getUserOrders.mockResolvedValue({
      success: true,
      data: [],
      pagination: {
        currentPage: 1,
        totalPages: 0,
        totalItems: 0,
        itemsPerPage: 10,
        hasNextPage: false,
        hasPrevPage: false
      }
    });

    render(<OrderHistory />);

    await waitFor(() => {
      expect(screen.getByText('No tienes pedidos aún')).toBeInTheDocument();
    });
  });

  test('handles API errors', async () => {
    getUserOrders.mockRejectedValue(new Error('API Error'));

    render(<OrderHistory />);

    await waitFor(() => {
      expect(screen.getByText('Error al cargar los pedidos')).toBeInTheDocument();
    });

    // Test retry functionality
    const retryButton = screen.getByText('Reintentar');
    fireEvent.click(retryButton);

    expect(getUserOrders).toHaveBeenCalledTimes(2);
  });

  test('formats dates correctly', async () => {
    render(<OrderHistory />);

    await waitFor(() => {
      expect(screen.getByText('Mis Pedidos')).toBeInTheDocument();
    });

    // Check that dates are formatted (exact format depends on locale)
    expect(screen.getByText(/24 sep 2024/)).toBeInTheDocument();
  });

  test('displays order status correctly', async () => {
    render(<OrderHistory />);

    await waitFor(() => {
      expect(screen.getByText('Mis Pedidos')).toBeInTheDocument();
    });

    // Check status badges
    expect(screen.getByText('Entregado')).toBeInTheDocument();
    expect(screen.getByText('Enviado')).toBeInTheDocument();
    expect(screen.getByText('Procesando')).toBeInTheDocument();
  });

  test('displays payment information correctly', async () => {
    render(<OrderHistory />);

    await waitFor(() => {
      expect(screen.getByText('Mis Pedidos')).toBeInTheDocument();
    });

    // Check payment methods are displayed
    expect(screen.getByText('PayPal')).toBeInTheDocument();
    expect(screen.getByText('MercadoPago')).toBeInTheDocument();
    expect(screen.getByText('Stripe')).toBeInTheDocument();

    // Check payment statuses
    expect(screen.getAllByText('Completado').length).toBeGreaterThan(0);

    // Check currencies
    expect(screen.getByText('Moneda: USD')).toBeInTheDocument();
    expect(screen.getByText('Moneda: MXN')).toBeInTheDocument();

    // Check payment references
    expect(screen.getByText('Ref: PAY123456789')).toBeInTheDocument();
    expect(screen.getByText('Ref: MP987654321')).toBeInTheDocument();
  });

  test('handles different payment methods and currencies', async () => {
    render(<OrderHistory />);

    await waitFor(() => {
      expect(screen.getByText('Mis Pedidos')).toBeInTheDocument();
    });

    // Verify formatPaymentMethod is called for each payment method
    expect(formatPaymentMethod).toHaveBeenCalledWith('paypal');
    expect(formatPaymentMethod).toHaveBeenCalledWith('mercadopago');
    expect(formatPaymentMethod).toHaveBeenCalledWith('stripe');

    // Verify formatPaymentStatus is called
    expect(formatPaymentStatus).toHaveBeenCalledWith('completed');
    expect(formatPaymentStatus).toHaveBeenCalledWith('processing');
  });
});