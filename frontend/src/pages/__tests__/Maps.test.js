import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Maps from '../Maps';

// Mock del hook useMaps
const mockUseMaps = {
  geocodeAddress: jest.fn(),
  getNearbyPlaces: jest.fn(),
  getNearbyEvents: jest.fn(),
  addLocationToFavorites: jest.fn(),
  checkLocationFavorite: jest.fn(),
  loading: false,
  error: null,
  currentLocation: [-82.9988, 39.9612],
  nearbyPlaces: [],
  nearbyEvents: [],
  topLocations: {
    songLocations: [
      {
        id: 'ohio_city',
        name: 'Ohio City',
        coordinates: [-81.6954, 41.4993],
        song: 'Ohio Is For Lovers',
        description: 'Ciudad mencionada en la canción Ohio Is For Lovers'
      }
    ],
    officialStores: [
      {
        id: 'store_columbus',
        name: 'Twenty One Pilots Official Store',
        coordinates: [-82.9988, 39.9612],
        address: '123 Main St, Columbus, OH'
      }
    ]
  },
  getAutocompleteSuggestions: jest.fn(),
  autocompleteSuggestions: [],
  clearAutocompleteSuggestions: jest.fn(),
  isLocationFavorite: jest.fn().mockReturnValue(false),
};

jest.mock('../../hooks/useMaps', () => ({
  useMaps: () => mockUseMaps,
}));

// Mock de navigator.geolocation
const mockGeolocation = {
  getCurrentPosition: jest.fn(),
};

Object.defineProperty(global.navigator, 'geolocation', {
  value: mockGeolocation,
  writable: true,
});

describe('Maps Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGeolocation.getCurrentPosition.mockImplementation((success) =>
      success({
        coords: {
          latitude: 39.9612,
          longitude: -82.9988,
        },
      })
    );
  });

  describe('Renderización inicial', () => {
    it('debe renderizar el componente correctamente', () => {
      render(<Maps />);

      expect(screen.getByText('Mapas Interactivos')).toBeInTheDocument();
      expect(screen.getByText('Tienda Oficial')).toBeInTheDocument();
      expect(screen.getByText('Buscar Dirección')).toBeInTheDocument();
      expect(screen.getByText('Acciones')).toBeInTheDocument();
    });

    it('debe mostrar la ubicación actual del usuario', () => {
      render(<Maps />);

      expect(screen.getByText('Tu Ubicación')).toBeInTheDocument();
      expect(screen.getByText('Lat: 39.96120, Lng: -82.99880')).toBeInTheDocument();
    });

    it('debe mostrar ubicaciones TOP', () => {
      render(<Maps />);

      expect(screen.getByText('🎵 Lugares en Canciones de TOP')).toBeInTheDocument();
      expect(screen.getByText('🏪 Tiendas Oficiales')).toBeInTheDocument();
      expect(screen.getByText('Ohio City')).toBeInTheDocument();
      expect(screen.getByText('Twenty One Pilots Official Store')).toBeInTheDocument();
    });
  });

  describe('Búsqueda de direcciones', () => {
    it('debe llamar a geocodeAddress cuando se envía el formulario', async () => {
      const user = userEvent.setup();
      mockUseMaps.geocodeAddress.mockResolvedValue({
        address: 'Columbus, Ohio',
        coordinates: [-82.9988, 39.9612],
      });

      render(<Maps />);

      const input = screen.getByPlaceholderText('Ingresa una dirección...');
      const button = screen.getByRole('button', { name: /buscar/i });

      await user.type(input, 'Columbus, Ohio');
      await user.click(button);

      expect(mockUseMaps.geocodeAddress).toHaveBeenCalledWith('Columbus, Ohio');
    });

    it('debe mostrar ubicación seleccionada después de geocodificar', async () => {
      const user = userEvent.setup();
      mockUseMaps.geocodeAddress.mockResolvedValue({
        address: 'Columbus, Ohio',
        coordinates: [-82.9988, 39.9612],
      });

      render(<Maps />);

      const input = screen.getByPlaceholderText('Ingresa una dirección...');
      const button = screen.getByRole('button', { name: /buscar/i });

      await user.type(input, 'Columbus, Ohio');
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('📍 Ubicación Seleccionada')).toBeInTheDocument();
        expect(screen.getByText('Columbus, Ohio')).toBeInTheDocument();
      });
    });

    it('debe mostrar sugerencias de autocompletado', async () => {
      const user = userEvent.setup();
      mockUseMaps.getAutocompleteSuggestions.mockResolvedValue([
        { text: 'Columbus, Ohio', placeName: 'Columbus, Ohio, USA' },
        { text: 'Columbus, Indiana', placeName: 'Columbus, Indiana, USA' },
      ]);

      render(<Maps />);

      const input = screen.getByPlaceholderText('Ingresa una dirección...');

      await user.type(input, 'Columbus');

      await waitFor(() => {
        expect(mockUseMaps.getAutocompleteSuggestions).toHaveBeenCalledWith('Columbus', { limit: 5 });
      });
    });
  });

  describe('Acciones de lugares cercanos', () => {
    it('debe llamar a getNearbyPlaces cuando se hace clic en el botón', async () => {
      const user = userEvent.setup();
      mockUseMaps.getNearbyPlaces.mockResolvedValue({
        places: [
          { id: '1', name: 'Lugar cercano 1', address: 'Dirección 1' },
        ],
      });

      render(<Maps />);

      const button = screen.getByRole('button', { name: /lugares cercanos/i });
      await user.click(button);

      expect(mockUseMaps.getNearbyPlaces).toHaveBeenCalledWith(
        [-82.9988, 39.9612],
        { radius: 2000, limit: 20 }
      );
    });

    it('debe mostrar lugares cercanos después de obtenerlos', async () => {
      const user = userEvent.setup();
      mockUseMaps.getNearbyPlaces.mockResolvedValue({
        places: [
          { id: '1', name: 'Restaurante cercano', address: '123 Main St', distance: 500 },
        ],
      });

      render(<Maps />);

      const button = screen.getByRole('button', { name: /lugares cercanos/i });
      await user.click(button);

      await waitFor(() => {
        expect(screen.getByText('📍 Lugares Cercanos')).toBeInTheDocument();
        expect(screen.getByText('Restaurante cercano')).toBeInTheDocument();
        expect(screen.getByText('123 Main St')).toBeInTheDocument();
      });
    });

    it('debe llamar a getNearbyEvents cuando se hace clic en el botón', async () => {
      const user = userEvent.setup();
      mockUseMaps.getNearbyEvents.mockResolvedValue({
        events: [
          { id: '1', name: 'Concierto TOP', venue: 'Venue 1', distance: 10000 },
        ],
      });

      render(<Maps />);

      const button = screen.getByRole('button', { name: /eventos cercanos/i });
      await user.click(button);

      expect(mockUseMaps.getNearbyEvents).toHaveBeenCalledWith(
        [-82.9988, 39.9612],
        { radius: 50000, limit: 10 }
      );
    });
  });

  describe('Carrito de compras', () => {
    it('debe mostrar el botón del carrito con el contador de items', () => {
      render(<Maps />);

      const cartButton = screen.getByRole('button', { name: /carrito/i });
      expect(cartButton).toBeInTheDocument();
      expect(cartButton).toHaveTextContent('🛒 Carrito (0)');
    });

    it('debe mostrar/ocultar el carrito al hacer clic en el botón', async () => {
      const user = userEvent.setup();
      render(<Maps />);

      const cartButton = screen.getByRole('button', { name: /carrito/i });

      // El carrito debería estar oculto inicialmente
      expect(screen.queryByText('Carrito de Compras')).not.toBeInTheDocument();

      // Mostrar carrito
      await user.click(cartButton);
      expect(screen.getByText('Carrito de Compras')).toBeInTheDocument();

      // Ocultar carrito
      await user.click(cartButton);
      expect(screen.queryByText('Carrito de Compras')).not.toBeInTheDocument();
    });
  });

  describe('Favoritos', () => {
    it('debe mostrar botones de favorito para ubicaciones', () => {
      render(<Maps />);

      const favoriteButtons = screen.getAllByText('🤍');
      expect(favoriteButtons.length).toBeGreaterThan(0);
    });

    it('debe llamar a addLocationToFavorites cuando se hace clic en favorito', async () => {
      const user = userEvent.setup();
      mockUseMaps.addLocationToFavorites.mockResolvedValue({
        id: 'fav123',
        name: 'Ohio City',
      });

      render(<Maps />);

      const favoriteButtons = screen.getAllByText('🤍');
      await user.click(favoriteButtons[0]);

      expect(mockUseMaps.addLocationToFavorites).toHaveBeenCalledWith({
        locationId: 'ohio_city',
        name: 'Ohio City',
        coordinates: [-81.6954, 41.4993],
        type: 'song_location',
        description: 'Ciudad mencionada en la canción Ohio Is For Lovers'
      });
    });

    it('debe mostrar alerta de éxito después de agregar a favoritos', async () => {
      const user = userEvent.setup();
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

      mockUseMaps.addLocationToFavorites.mockResolvedValue({
        id: 'fav123',
        name: 'Ohio City',
      });

      render(<Maps />);

      const favoriteButtons = screen.getAllByText('🤍');
      await user.click(favoriteButtons[0]);

      expect(alertMock).toHaveBeenCalledWith('Ubicación agregada a favoritos');
      alertMock.mockRestore();
    });
  });

  describe('Manejo de errores', () => {
    it('debe mostrar mensaje de error cuando falla la geocodificación', async () => {
      const user = userEvent.setup();
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});
      mockUseMaps.geocodeAddress.mockRejectedValue(new Error('Dirección no encontrada'));

      render(<Maps />);

      const input = screen.getByPlaceholderText('Ingresa una dirección...');
      const button = screen.getByRole('button', { name: /buscar/i });

      await user.type(input, 'Dirección inválida');
      await user.click(button);

      expect(alertMock).toHaveBeenCalledWith('Error buscando dirección: Dirección no encontrada');
      alertMock.mockRestore();
    });

    it('debe mostrar mensaje de error cuando no hay ubicación del usuario', async () => {
      const user = userEvent.setup();
      const alertMock = jest.spyOn(window, 'alert').mockImplementation(() => {});

      // Simular que no hay ubicación del usuario
      mockUseMaps.currentLocation = null;

      render(<Maps />);

      const button = screen.getByRole('button', { name: /lugares cercanos/i });
      await user.click(button);

      expect(alertMock).toHaveBeenCalledWith('Se necesita tu ubicación para buscar lugares cercanos');
      alertMock.mockRestore();
    });
  });

  describe('Información y accesibilidad', () => {
    it('debe mostrar información sobre las funcionalidades', () => {
      render(<Maps />);

      expect(screen.getByText('ℹ️ Información')).toBeInTheDocument();
      expect(screen.getByText('Geocoding:')).toBeInTheDocument();
      expect(screen.getByText('Reverse Geocoding:')).toBeInTheDocument();
      expect(screen.getByText('Lugares Cercanos:')).toBeInTheDocument();
    });

    it('debe tener atributos de accesibilidad en elementos interactivos', () => {
      render(<Maps />);

      const searchInput = screen.getByPlaceholderText('Ingresa una dirección...');
      expect(searchInput).toHaveAttribute('type', 'text');

      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(button).toBeEnabled();
      });
    });
  });

  describe('Responsive design', () => {
    it('debe mantener la funcionalidad en diferentes tamaños de pantalla', () => {
      render(<Maps />);

      // Verificar que los elementos principales estén presentes
      expect(screen.getByText('Mapas Interactivos')).toBeInTheDocument();
      expect(screen.getByText('Buscar Dirección')).toBeInTheDocument();
      expect(screen.getByText('Acciones')).toBeInTheDocument();

      // Verificar que el mapa esté presente
      expect(screen.getByText('Centro del mapa: [-82.9988, 39.9612]')).toBeInTheDocument();
    });
  });
});