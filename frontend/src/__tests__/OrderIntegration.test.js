import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import OrderTracking from '../components/OrderTracking';
import { getOrderTracking } from '../api/orders';

// Mock de dependencias
jest.mock('../api/orders');
jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'user123', username: 'testuser' },
    isAuthenticated: true
  })
}));

// Mock de localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
global.localStorage = localStorageMock;

// Mock de fetch para simular APIs externas
global.fetch = jest.fn();

describe('Order Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    // Mock de localStorage
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockImplementation(() => {});
  });

  describe('Shipping API Integration', () => {
    test('integrates with UPS API for tracking updates', async () => {
      // Mock de respuesta de UPS API
      const mockUPSResponse = {
        TrackResponse: {
          Response: {
            ResponseStatusCode: '1'
          },
          Shipment: {
            Package: {
              Activity: [
                {
                  Status: {
                    StatusType: {
                      Code: 'D',
                      Description: 'Delivered'
                    }
                  },
                  Date: '20240924',
                  Time: '143000',
                  Location: {
                    City: 'Madrid',
                    StateProvinceCode: 'MD',
                    CountryCode: 'ES'
                  }
                },
                {
                  Status: {
                    StatusType: {
                      Code: 'I',
                      Description: 'In Transit'
                    }
                  },
                  Date: '20240923',
                  Time: '090000',
                  Location: {
                    City: 'Barcelona',
                    StateProvinceCode: 'CT',
                    CountryCode: 'ES'
                  }
                }
              ]
            }
          }
        }
      };

      // Mock de fetch para UPS API
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockUPSResponse)
      });

      // Mock de getOrderTracking
      getOrderTracking.mockResolvedValue({
        success: true,
        data: {
          orderId: 'order123',
          orderNumber: '20240924001',
          trackingNumber: '1Z999AA1234567890',
          carrier: 'ups',
          carrierName: 'UPS',
          currentStatus: 'in_transit',
          currentDescription: 'In Transit',
          estimatedDelivery: '2024-09-25T17:00:00Z',
          updates: [
            {
              status: 'picked_up',
              description: 'Picked up',
              timestamp: '2024-09-22T09:00:00Z',
              location: { city: 'Madrid', state: 'MD', country: 'ES' }
            }
          ],
          progress: 60,
          isDelayed: false,
          timeRemaining: '1 día 8 horas'
        }
      });

      render(<OrderTracking orderId="order123" />);

      await waitFor(() => {
        expect(screen.getByText('Seguimiento de pedido')).toBeInTheDocument();
      });

      // Verificar que se muestra la información de UPS
      expect(screen.getByText('1Z999AA1234567890')).toBeInTheDocument();
      expect(screen.getByText('UPS')).toBeInTheDocument();
      expect(screen.getByText('In Transit')).toBeInTheDocument();
    });

    test('handles FedEx API integration', async () => {
      const mockFedExResponse = {
        output: {
          completeTrackResults: [
            {
              trackResults: [
                {
                  scanEvents: [
                    {
                      date: '2024-09-24T14:30:00',
                      eventDescription: 'Delivered',
                      eventType: 'DL',
                      location: {
                        city: 'Madrid',
                        stateOrProvinceCode: 'MD',
                        countryCode: 'ES'
                      }
                    },
                    {
                      date: '2024-09-23T09:00:00',
                      eventDescription: 'In Transit',
                      eventType: 'IT',
                      location: {
                        city: 'Barcelona',
                        stateOrProvinceCode: 'CT',
                        countryCode: 'ES'
                      }
                    }
                  ]
                }
              ]
            }
          ]
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockFedExResponse)
      });

      getOrderTracking.mockResolvedValue({
        success: true,
        data: {
          orderId: 'order456',
          orderNumber: '20240924002',
          trackingNumber: '777777777777',
          carrier: 'fedex',
          carrierName: 'FedEx',
          currentStatus: 'delivered',
          currentDescription: 'Delivered',
          actualDelivery: '2024-09-24T14:30:00Z',
          updates: [],
          progress: 100,
          isDelayed: false
        }
      });

      render(<OrderTracking orderId="order456" />);

      await waitFor(() => {
        expect(screen.getByText('777777777777')).toBeInTheDocument();
      });

      expect(screen.getByText('FedEx')).toBeInTheDocument();
      expect(screen.getByText('Delivered')).toBeInTheDocument();
    });

    test('handles DHL API integration', async () => {
      const mockDHLResponse = {
        shipments: [
          {
            id: '7777777777',
            status: {
              statusCode: 'delivered',
              description: 'Delivered'
            },
            events: [
              {
                timestamp: '2024-09-24T14:30:00Z',
                statusCode: 'delivered',
                description: 'Delivered',
                location: {
                  address: {
                    city: 'Madrid',
                    postalCode: '28001',
                    countryCode: 'ES'
                  }
                }
              }
            ]
          }
        ]
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockDHLResponse)
      });

      getOrderTracking.mockResolvedValue({
        success: true,
        data: {
          orderId: 'order789',
          orderNumber: '20240924003',
          trackingNumber: '7777777777',
          carrier: 'dhl',
          carrierName: 'DHL',
          currentStatus: 'delivered',
          currentDescription: 'Delivered',
          updates: [],
          progress: 100
        }
      });

      render(<OrderTracking orderId="order789" />);

      await waitFor(() => {
        expect(screen.getByText('7777777777')).toBeInTheDocument();
      });

      expect(screen.getByText('DHL')).toBeInTheDocument();
    });

    test('handles API errors gracefully', async () => {
      // Mock de API que falla
      global.fetch.mockRejectedValueOnce(new Error('API Error'));

      getOrderTracking.mockResolvedValue({
        success: true,
        data: {
          orderId: 'order999',
          orderNumber: '20240924004',
          trackingNumber: 'ERROR123',
          carrier: 'ups',
          carrierName: 'UPS',
          currentStatus: 'pending',
          updates: [],
          progress: 0
        }
      });

      render(<OrderTracking orderId="order999" />);

      await waitFor(() => {
        expect(screen.getByText('ERROR123')).toBeInTheDocument();
      });

      // Verificar que no crashea y muestra información básica
      expect(screen.getByText('UPS')).toBeInTheDocument();
    });

    test('auto-refreshes tracking data', async () => {
      jest.useFakeTimers();

      getOrderTracking.mockResolvedValue({
        success: true,
        data: {
          orderId: 'orderAuto',
          orderNumber: '20240924005',
          trackingNumber: 'AUTO123',
          carrier: 'ups',
          currentStatus: 'in_transit',
          updates: [],
          progress: 50
        }
      });

      render(<OrderTracking orderId="orderAuto" />);

      await waitFor(() => {
        expect(screen.getByText('AUTO123')).toBeInTheDocument();
      });

      // Fast-forward 5 minutos
      jest.advanceTimersByTime(5 * 60 * 1000);

      await waitFor(() => {
        expect(getOrderTracking).toHaveBeenCalledTimes(2);
      });

      jest.useRealTimers();
    });

    test('persists tracking data in localStorage', async () => {
      const trackingData = {
        orderId: 'orderPersist',
        orderNumber: '20240924006',
        trackingNumber: 'PERSIST123',
        carrier: 'ups',
        currentStatus: 'delivered',
        lastSync: '2024-09-24T10:00:00Z'
      };

      getOrderTracking.mockResolvedValue({
        success: true,
        data: trackingData
      });

      render(<OrderTracking orderId="orderPersist" />);

      await waitFor(() => {
        expect(screen.getByText('PERSIST123')).toBeInTheDocument();
      });

      // Verificar que se guardó en localStorage
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'orderTracking_orderPersist',
        JSON.stringify(trackingData)
      );
    });

    test('loads cached tracking data from localStorage', async () => {
      const cachedData = {
        orderId: 'orderCached',
        orderNumber: '20240924007',
        trackingNumber: 'CACHED123',
        carrier: 'fedex',
        currentStatus: 'shipped',
        lastSync: '2024-09-24T10:00:00Z'
      };

      localStorageMock.getItem.mockReturnValue(JSON.stringify(cachedData));

      // API falla, debería usar cache
      getOrderTracking.mockRejectedValue(new Error('Network Error'));

      render(<OrderTracking orderId="orderCached" />);

      await waitFor(() => {
        expect(screen.getByText('CACHED123')).toBeInTheDocument();
      });
    });

    test('shows retry option on API failure', async () => {
      getOrderTracking.mockRejectedValue(new Error('Network Error'));

      render(<OrderTracking orderId="orderFail" />);

      await waitFor(() => {
        expect(screen.getByText('Error al cargar el seguimiento')).toBeInTheDocument();
      });

      const retryButton = screen.getByText('Reintentar');
      expect(retryButton).toBeInTheDocument();

      // Click retry
      fireEvent.click(retryButton);
      expect(getOrderTracking).toHaveBeenCalledTimes(2);
    });
  });

  describe('Notification Integration', () => {
    test('sends notifications on status changes', async () => {
      // Mock del sistema de notificaciones
      const mockCreateNotification = jest.fn();
      jest.mock('../hooks/useNotifications', () => ({
        useNotifications: () => ({
          createNotification: mockCreateNotification
        })
      }));

      getOrderTracking.mockResolvedValue({
        success: true,
        data: {
          orderId: 'orderNotify',
          orderNumber: '20240924008',
          trackingNumber: 'NOTIFY123',
          carrier: 'ups',
          currentStatus: 'delivered', // Status changed
          updates: [],
          progress: 100
        }
      });

      render(<OrderTracking orderId="orderNotify" />);

      await waitFor(() => {
        expect(screen.getByText('NOTIFY123')).toBeInTheDocument();
      });

      // Verificar que se envió notificación
      expect(mockCreateNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'shipping_update',
          title: expect.stringContaining('NOTIFY123'),
          priority: 'high'
        })
      );
    });
  });
});