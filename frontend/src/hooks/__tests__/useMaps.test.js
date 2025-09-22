import { renderHook, act, waitFor } from '@testing-library/react';
import { useMaps } from '../useMaps';

// Mock de las dependencias
jest.mock('../useFavorites', () => ({
  useFavorites: () => ({
    addToFavorites: jest.fn(),
    hasFavorite: jest.fn(),
  }),
}));

jest.mock('../useNotifications', () => ({
  useNotifications: () => ({
    createNotification: jest.fn(),
  }),
}));

jest.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { _id: 'user123', role: 'user' },
    isAuthenticated: true,
  }),
}));

jest.mock('../api/maps', () => ({
  default: {
    geocodeAddress: jest.fn(),
    reverseGeocode: jest.fn(),
    getRoute: jest.fn(),
    getNearbyPlaces: jest.fn(),
    getNearbyEvents: jest.fn(),
    createCustomMap: jest.fn(),
    addLocationToFavorites: jest.fn(),
    checkLocationFavorite: jest.fn(),
    getFavoriteLocations: jest.fn(),
    getAutocompleteSuggestions: jest.fn(),
    checkMapboxStatus: jest.fn(),
    getMapsStats: jest.fn(),
    configureLocationNotifications: jest.fn(),
    getLocationNotificationPreferences: jest.fn(),
    getTOPLocations: jest.fn(),
  },
}));

// Mock de navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('useMaps Hook', () => {
  let mapsAPI;

  beforeEach(() => {
    jest.clearAllMocks();
    mapsAPI = require('../api/maps').default;

    // Mock de geolocalización exitosa
    mockGeolocation.getCurrentPosition.mockImplementation((success) =>
      success({
        coords: {
          latitude: 39.9612,
          longitude: -82.9988,
        },
      })
    );
  });

  describe('Inicialización', () => {
    it('debe inicializar con valores por defecto', () => {
      const { result } = renderHook(() => useMaps());

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
      expect(result.current.currentLocation).toBe(null);
      expect(result.current.nearbyPlaces).toEqual([]);
      expect(result.current.nearbyEvents).toEqual([]);
      expect(result.current.topLocations).toEqual({});
      expect(result.current.autocompleteSuggestions).toEqual([]);
    });

    it('debe obtener la ubicación del usuario al inicializar', async () => {
      renderHook(() => useMaps());

      await waitFor(() => {
        expect(mockGeolocation.getCurrentPosition).toHaveBeenCalled();
      });
    });
  });

  describe('geocodeAddress', () => {
    it('debe geocodificar una dirección exitosamente', async () => {
      const mockResult = {
        address: 'Columbus, Ohio',
        coordinates: [-82.9988, 39.9612],
      };

      mapsAPI.geocodeAddress.mockResolvedValue({
        success: true,
        data: { geocoding: mockResult },
      });

      const { result } = renderHook(() => useMaps());

      let geocodingResult;
      await act(async () => {
        geocodingResult = await result.current.geocodeAddress('Columbus, Ohio');
      });

      expect(mapsAPI.geocodeAddress).toHaveBeenCalledWith('Columbus, Ohio');
      expect(geocodingResult).toEqual(mockResult);
      expect(result.current.error).toBe(null);
    });

    it('debe manejar errores de geocodificación', async () => {
      const errorMessage = 'Dirección no encontrada';
      mapsAPI.geocodeAddress.mockResolvedValue({
        success: false,
        message: errorMessage,
      });

      const { result } = renderHook(() => useMaps());

      await expect(result.current.geocodeAddress('Dirección inválida')).rejects.toThrow(errorMessage);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('getNearbyPlaces', () => {
    it('debe obtener lugares cercanos exitosamente', async () => {
      const mockPlaces = [
        { id: '1', name: 'Lugar 1', address: 'Dirección 1' },
        { id: '2', name: 'Lugar 2', address: 'Dirección 2' },
      ];

      const coordinates = [-82.9988, 39.9612];
      const options = { radius: 1000, limit: 10 };

      mapsAPI.getNearbyPlaces.mockResolvedValue({
        success: true,
        data: { places: mockPlaces },
      });

      const { result } = renderHook(() => useMaps());

      let placesResult;
      await act(async () => {
        placesResult = await result.current.getNearbyPlaces(coordinates, options);
      });

      expect(mapsAPI.getNearbyPlaces).toHaveBeenCalledWith(coordinates, options);
      expect(result.current.nearbyPlaces).toEqual(mockPlaces);
      expect(placesResult).toEqual({ places: mockPlaces });
    });
  });

  describe('getNearbyEvents', () => {
    it('debe requerir autenticación para obtener eventos cercanos', async () => {
      // Mock de usuario no autenticado
      const { useAuth } = require('../contexts/AuthContext');
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useMaps());

      await expect(result.current.getNearbyEvents([-82.9988, 39.9612])).rejects.toThrow(
        'Debes iniciar sesión para ver eventos cercanos'
      );
    });

    it('debe obtener eventos cercanos exitosamente cuando está autenticado', async () => {
      const mockEvents = [
        { id: '1', name: 'Concierto 1', venue: 'Venue 1', distance: 5000 },
        { id: '2', name: 'Concierto 2', venue: 'Venue 2', distance: 8000 },
      ];

      mapsAPI.getNearbyEvents.mockResolvedValue({
        success: true,
        data: { events: mockEvents },
      });

      const { result } = renderHook(() => useMaps());

      let eventsResult;
      await act(async () => {
        eventsResult = await result.current.getNearbyEvents([-82.9988, 39.9612]);
      });

      expect(mapsAPI.getNearbyEvents).toHaveBeenCalledWith([-82.9988, 39.9612], {});
      expect(result.current.nearbyEvents).toEqual(mockEvents);
      expect(eventsResult).toEqual({ events: mockEvents });
    });
  });

  describe('getAutocompleteSuggestions', () => {
    it('debe obtener sugerencias de autocompletado', async () => {
      const mockSuggestions = [
        { text: 'Columbus, Ohio', placeName: 'Columbus, Ohio, USA' },
        { text: 'Columbus, Indiana', placeName: 'Columbus, Indiana, USA' },
      ];

      mapsAPI.getAutocompleteSuggestions.mockResolvedValue({
        success: true,
        data: { suggestions: mockSuggestions },
      });

      const { result } = renderHook(() => useMaps());

      let suggestions;
      await act(async () => {
        suggestions = await result.current.getAutocompleteSuggestions('Columbus', { limit: 5 });
      });

      expect(mapsAPI.getAutocompleteSuggestions).toHaveBeenCalledWith('Columbus', { limit: 5 });
      expect(result.current.autocompleteSuggestions).toEqual(mockSuggestions);
      expect(suggestions).toEqual(mockSuggestions);
    });

    it('debe manejar consultas vacías', async () => {
      const { result } = renderHook(() => useMaps());

      let suggestions;
      await act(async () => {
        suggestions = await result.current.getAutocompleteSuggestions('', { limit: 5 });
      });

      expect(suggestions).toEqual([]);
      expect(mapsAPI.getAutocompleteSuggestions).not.toHaveBeenCalled();
    });
  });

  describe('addLocationToFavorites', () => {
    it('debe requerir autenticación para agregar ubicaciones a favoritos', async () => {
      const { useAuth } = require('../contexts/AuthContext');
      useAuth.mockReturnValue({
        user: null,
        isAuthenticated: false,
      });

      const { result } = renderHook(() => useMaps());

      await expect(result.current.addLocationToFavorites({
        locationId: 'test',
        name: 'Test Location',
        coordinates: [-82.9988, 39.9612],
      })).rejects.toThrow('Debes iniciar sesión para agregar ubicaciones a favoritos');
    });

    it('debe agregar ubicación a favoritos exitosamente', async () => {
      const mockFavorite = { id: 'fav123', name: 'Test Location' };
      const locationData = {
        locationId: 'test123',
        name: 'Test Location',
        coordinates: [-82.9988, 39.9612],
        type: 'poi',
      };

      mapsAPI.addLocationToFavorites.mockResolvedValue({
        success: true,
        data: { favorite: mockFavorite },
      });

      const { result } = renderHook(() => useMaps());

      let favoriteResult;
      await act(async () => {
        favoriteResult = await result.current.addLocationToFavorites(locationData);
      });

      expect(mapsAPI.addLocationToFavorites).toHaveBeenCalledWith(locationData);
      expect(favoriteResult).toEqual(mockFavorite);
    });
  });

  describe('Funciones de utilidad', () => {
    it('debe calcular la distancia correctamente', () => {
      const { result } = renderHook(() => useMaps());

      const coord1 = [-82.9988, 39.9612]; // Columbus, Ohio
      const coord2 = [-87.6298, 41.8781]; // Chicago, Illinois

      const distance = result.current.getDistance(coord1, coord2);

      // Distancia aproximada entre Columbus y Chicago es ~350-400 km
      expect(distance).toBeGreaterThan(300);
      expect(distance).toBeLessThan(500);
    });

    it('debe verificar si una ubicación está en favoritos', () => {
      const { result } = renderHook(() => useMaps());

      const { useFavorites } = require('../useFavorites');
      const mockHasFavorite = jest.fn().mockReturnValue(true);
      useFavorites.mockReturnValue({
        addToFavorites: jest.fn(),
        hasFavorite: mockHasFavorite,
      });

      const isFavorite = result.current.isLocationFavorite('location123');

      expect(mockHasFavorite).toHaveBeenCalledWith('location', 'location123');
      expect(isFavorite).toBe(true);
    });
  });

  describe('Manejo de errores', () => {
    it('debe manejar errores de red', async () => {
      mapsAPI.geocodeAddress.mockRejectedValue(new Error('Network error'));

      const { result } = renderHook(() => useMaps());

      await expect(result.current.geocodeAddress('Test Address')).rejects.toThrow('Network error');
      expect(result.current.error).toBe('Network error');
    });

    it('debe manejar respuestas de API fallidas', async () => {
      mapsAPI.geocodeAddress.mockResolvedValue({
        success: false,
        message: 'API Error',
      });

      const { result } = renderHook(() => useMaps());

      await expect(result.current.geocodeAddress('Test Address')).rejects.toThrow('API Error');
      expect(result.current.error).toBe('API Error');
    });
  });
});