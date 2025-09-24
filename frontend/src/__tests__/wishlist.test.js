import React from 'react';
import { render, screen, fireEvent, waitFor, renderHook, act } from '@testing-library/react';
import '@testing-library/jest-dom';
import { useWishlist } from '../hooks/useWishlist';
import WishlistAPI from '../api/wishlist';
import WishlistButton from '../components/WishlistButton';
import WishlistItem from '../components/WishlistItem';
import WishlistPage from '../pages/WishlistPage';
import RangeSlider from '../components/RangeSlider';
import { UserPreferencesProvider, useUserPreferences } from '../contexts/UserPreferencesContext';
import LanguageCurrencySelector from '../components/LanguageCurrencySelector';

// Mock de dependencias
jest.mock('../api/wishlist');
jest.mock('../hooks/useWishlist');
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    user: { _id: 'user123', username: 'testuser' }
  })
}));

// Mock de React Router
jest.mock('react-router-dom', () => ({
  Link: ({ children, to }) => <a href={to}>{children}</a>,
  useLocation: () => ({ pathname: '/' })
}));

// Mock de i18next
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key) => key,
    i18n: {
      changeLanguage: jest.fn(),
      language: 'en'
    }
  })
}));

// Wrapper para pruebas con contexto
const TestWrapper = ({ children, currency = 'USD', language = 'en' }) => (
  <UserPreferencesProvider>
    {children}
  </UserPreferencesProvider>
);

const mockProduct = {
  _id: 'prod123',
  name: 'Test Product',
  price: 29.99,
  images: ['image1.jpg'],
  category: 'electronics',
  stock: 10
};

const mockWishlistItem = {
  product: mockProduct,
  addedAt: '2024-01-01T00:00:00Z',
  notes: 'Test notes'
};

describe('Wishlist System Components', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('RangeSlider Component', () => {
    test('renders with default values', () => {
      render(
        <TestWrapper>
          <RangeSlider min={0} max={100} value={[20, 80]} onChange={jest.fn()} />
        </TestWrapper>
      );
      expect(screen.getByDisplayValue('20')).toBeInTheDocument();
      expect(screen.getByDisplayValue('80')).toBeInTheDocument();
    });

    test('calls onChange when value changes', () => {
      const mockOnChange = jest.fn();
      render(
        <TestWrapper>
          <RangeSlider min={0} max={100} value={[20, 80]} onChange={mockOnChange} />
        </TestWrapper>
      );

      const minInput = screen.getByDisplayValue('20');
      fireEvent.change(minInput, { target: { value: '30' } });
      fireEvent.blur(minInput);

      expect(mockOnChange).toHaveBeenCalledWith([30, 80]);
    });

    test('is disabled when disabled prop is true', () => {
      render(
        <TestWrapper>
          <RangeSlider min={0} max={100} value={[20, 80]} onChange={jest.fn()} disabled={true} />
        </TestWrapper>
      );
      const minInput = screen.getByDisplayValue('20');
      const maxInput = screen.getByDisplayValue('80');
      expect(minInput).toBeDisabled();
      expect(maxInput).toBeDisabled();
    });
  });

  describe('Wishlist Filters and Recommendations', () => {
    test('shows advanced filters when toggle is clicked', () => {
      useWishlist.mockReturnValue({
        wishlist: [mockWishlistItem],
        loading: false,
        error: null,
        filters: { sortBy: 'addedAt', sortOrder: 'desc', minPrice: 0, maxPrice: 1000, category: 'all' },
        recommendations: [],
        removeFromWishlist: jest.fn(),
        clearWishlist: jest.fn(),
        getWishlistCount: jest.fn(() => 1),
        getWishlistValue: jest.fn(() => 29.99),
        updateFilters: jest.fn(),
        applyFilters: jest.fn(() => [mockWishlistItem]),
        isInWishlist: jest.fn(() => false)
      });

      render(
        <TestWrapper>
          <WishlistPage />
        </TestWrapper>
      );
      const toggleButton = screen.getByText('Mostrar filtros avanzados');
      fireEvent.click(toggleButton);
      expect(screen.getByText('Ordenar por:')).toBeInTheDocument();
      expect(screen.getByText('Rango de precios:')).toBeInTheDocument();
    });

    test('shows recommendations when they exist', () => {
      const mockRecommendation = {
        _id: 'rec123',
        name: 'Recommended Product',
        price: 19.99,
        images: ['/image.jpg'],
        category: 'electronics'
      };

      useWishlist.mockReturnValue({
        wishlist: [mockWishlistItem],
        loading: false,
        error: null,
        filters: { sortBy: 'addedAt', sortOrder: 'desc', minPrice: 0, maxPrice: 1000, category: 'all' },
        recommendations: [mockRecommendation],
        removeFromWishlist: jest.fn(),
        clearWishlist: jest.fn(),
        getWishlistCount: jest.fn(() => 1),
        getWishlistValue: jest.fn(() => 29.99),
        updateFilters: jest.fn(),
        applyFilters: jest.fn(() => [mockWishlistItem]),
        isInWishlist: jest.fn(() => false),
        addToWishlist: jest.fn()
      });

      render(
        <TestWrapper>
          <WishlistPage />
        </TestWrapper>
      );
      expect(screen.getByText('Productos recomendados')).toBeInTheDocument();
      expect(screen.getByText('Recommended Product')).toBeInTheDocument();
    });

    test('applies filters correctly', () => {
      const mockUpdateFilters = jest.fn();
      useWishlist.mockReturnValue({
        wishlist: [mockWishlistItem],
        loading: false,
        error: null,
        filters: { sortBy: 'addedAt', sortOrder: 'desc', minPrice: 0, maxPrice: 1000, category: 'all' },
        recommendations: [],
        removeFromWishlist: jest.fn(),
        clearWishlist: jest.fn(),
        getWishlistCount: jest.fn(() => 1),
        getWishlistValue: jest.fn(() => 29.99),
        updateFilters: mockUpdateFilters,
        applyFilters: jest.fn(() => [mockWishlistItem]),
        isInWishlist: jest.fn(() => false)
      });

      render(
        <TestWrapper>
          <WishlistPage />
        </TestWrapper>
      );
      const toggleButton = screen.getByText('Mostrar filtros avanzados');
      fireEvent.click(toggleButton);
      const applyButton = screen.getByText('Aplicar filtros');
      fireEvent.click(applyButton);
      expect(mockUpdateFilters).toHaveBeenCalled();
    });

    test('shows correct state in recommendations', () => {
      const mockRecommendation = {
        _id: 'rec123',
        name: 'Recommended Product',
        price: 19.99,
        images: ['/image.jpg'],
        category: 'electronics'
      };

      useWishlist.mockReturnValue({
        wishlist: [mockWishlistItem],
        loading: false,
        error: null,
        filters: { sortBy: 'addedAt', sortOrder: 'desc', minPrice: 0, maxPrice: 1000, category: 'all' },
        recommendations: [mockRecommendation],
        removeFromWishlist: jest.fn(),
        clearWishlist: jest.fn(),
        getWishlistCount: jest.fn(() => 1),
        getWishlistValue: jest.fn(() => 29.99),
        updateFilters: jest.fn(),
        applyFilters: jest.fn(() => [mockWishlistItem]),
        isInWishlist: jest.fn((id) => id === 'rec123'),
        addToWishlist: jest.fn()
      });

      render(
        <TestWrapper>
          <WishlistPage />
        </TestWrapper>
      );
      const addButton = screen.getByText('En wishlist');
      expect(addButton).toBeDisabled();
      expect(addButton).toHaveClass('in-wishlist');
    });
  });

  describe('Multilanguage and Multicurrency Support', () => {
    test('formats prices correctly in different currencies', () => {
      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: UserPreferencesProvider
      });

      // Test USD formatting
      act(() => {
        result.current.changeCurrency('USD');
      });
      expect(result.current.formatPrice(29.99)).toBe('$29.99');

      // Test EUR formatting
      act(() => {
        result.current.changeCurrency('EUR');
      });
      expect(result.current.formatPrice(29.99)).toBe('€29.99');

      // Test GBP formatting
      act(() => {
        result.current.changeCurrency('GBP');
      });
      expect(result.current.formatPrice(29.99)).toBe('£29.99');
    });

    test('converts prices correctly between currencies', () => {
      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: UserPreferencesProvider
      });

      // Test conversion from USD to EUR
      act(() => {
        result.current.changeCurrency('EUR');
      });
      const convertedPrice = result.current.convertPrice(29.99, 'USD');
      expect(convertedPrice).toBeCloseTo(25.49, 2); // Aproximadamente 29.99 * 0.85
    });

    test('LanguageCurrencySelector renders with all options', () => {
      render(
        <TestWrapper>
          <LanguageCurrencySelector />
        </TestWrapper>
      );

      // Check that selectors exist
      expect(screen.getByDisplayValue('language.english')).toBeInTheDocument();
      expect(screen.getByDisplayValue('currency.usd')).toBeInTheDocument();
    });

    test('UserPreferencesContext initializes with default values', () => {
      const { result } = renderHook(() => useUserPreferences(), {
        wrapper: UserPreferencesProvider
      });

      expect(result.current.currency).toBe('USD');
      expect(result.current.language).toBe('en');
      expect(typeof result.current.formatPrice).toBe('function');
      expect(typeof result.current.convertPrice).toBe('function');
    });
  });
});