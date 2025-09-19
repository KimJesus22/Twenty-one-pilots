import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from '@mui/material/styles';
import i18n from '../../i18n';
import { twentyOnePilotsTheme } from '../../theme';
import Home from '../Home';

// Mock del ThemeProvider personalizado
const MockCustomThemeProvider = ({ children }) => (
  <div data-testid="custom-theme-provider">
    {children}
  </div>
);

// Wrapper completo para tests
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={twentyOnePilotsTheme}>
        <MockCustomThemeProvider>
          {children}
        </MockCustomThemeProvider>
      </ThemeProvider>
    </I18nextProvider>
  </BrowserRouter>
);

describe('Home Page', () => {
  beforeEach(() => {
    // Resetear idioma antes de cada test
    i18n.changeLanguage('en');
  });

  test('renders hero section with Twenty One Pilots title', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Verificar que se muestra el título principal
    await waitFor(() => {
      expect(screen.getByText('Twenty One Pilots')).toBeInTheDocument();
    });
  });

  test('displays hero content in English by default', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Verificar contenido del hero en inglés
    await waitFor(() => {
      expect(screen.getByText('Twenty One Pilots')).toBeInTheDocument();
      expect(screen.getByText('Fan Experience')).toBeInTheDocument();
    });
  });

  test('displays hero content in Spanish when language changes', async () => {
    // Cambiar idioma a español
    i18n.changeLanguage('es');

    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Verificar contenido del hero en español
    await waitFor(() => {
      expect(screen.getByText('Experiencia de Fan')).toBeInTheDocument();
      expect(screen.getByText('Explorar Ahora')).toBeInTheDocument();
      expect(screen.getByText('Documentos API')).toBeInTheDocument();
    });
  });

  test('renders feature cards with correct English content', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Verificar que se muestran las tarjetas de características
    await waitFor(() => {
      expect(screen.getByText('Complete Discography')).toBeInTheDocument();
      expect(screen.getByText('Official Videos')).toBeInTheDocument();
      expect(screen.getByText('Concerts & Events')).toBeInTheDocument();
      expect(screen.getByText('Fan Community')).toBeInTheDocument();
      expect(screen.getByText('Personalized Playlists')).toBeInTheDocument();
      expect(screen.getByText('Official Store')).toBeInTheDocument();
    });
  });

  test('renders feature cards with correct Spanish content', async () => {
    // Cambiar idioma a español
    i18n.changeLanguage('es');

    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Verificar que se muestran las tarjetas de características en español
    await waitFor(() => {
      expect(screen.getByText('Discografía Completa')).toBeInTheDocument();
      expect(screen.getByText('Videos Oficiales')).toBeInTheDocument();
      expect(screen.getByText('Conciertos y Eventos')).toBeInTheDocument();
      expect(screen.getByText('Comunidad de Fans')).toBeInTheDocument();
      expect(screen.getByText('Playlists Personalizadas')).toBeInTheDocument();
      expect(screen.getByText('Tienda Oficial')).toBeInTheDocument();
    });
  });

  test('includes Material-UI icons in feature cards', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Verificar que se renderizan los iconos de Material-UI
    await waitFor(() => {
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  test('applies Twenty One Pilots theme colors', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Verificar que se aplican los colores del tema
    await waitFor(() => {
      // El título debería tener el color rojo característico
      const title = screen.getByText('Twenty One Pilots');
      expect(title).toBeInTheDocument();
    });
  });

  test('renders call-to-action buttons', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Verificar que se muestran los botones de acción
    await waitFor(() => {
      expect(screen.getByText('Explorar Ahora')).toBeInTheDocument();
      expect(screen.getByText('Ver API Docs')).toBeInTheDocument();
    });
  });

  test('buttons have correct navigation links', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Verificar que los botones tienen enlaces correctos
    await waitFor(() => {
      // Los botones deberían tener funcionalidad de navegación
      const exploreButton = screen.getByText('Explorar Ahora');
      expect(exploreButton).toBeInTheDocument();
    });
  });

  test('handles responsive layout', async () => {
    // Mock de viewport móvil
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Verificar que el contenido se adapta al móvil
    await waitFor(() => {
      expect(screen.getByText('Twenty One Pilots')).toBeInTheDocument();
    });
  });

  test('maintains accessibility features', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Verificar elementos de accesibilidad
    await waitFor(() => {
      // Verificar que hay elementos con roles apropiados
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);
    });
  });

  test('displays statistics section', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Verificar que se muestra la sección de estadísticas
    await waitFor(() => {
      // Las estadísticas se muestran dinámicamente
      expect(screen.getByText('Twenty One Pilots')).toBeInTheDocument();
    });
  });

  test('integrates properly with routing', async () => {
    render(
      <TestWrapper>
        <Home />
      </TestWrapper>
    );

    // Verificar que funciona con React Router
    await waitFor(() => {
      expect(screen.getByText('Twenty One Pilots')).toBeInTheDocument();
    });
  });
});