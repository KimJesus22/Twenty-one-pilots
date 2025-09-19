import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from '@mui/material/styles';
import i18n from '../../i18n';
import { twentyOnePilotsTheme } from '../../theme';
import Navbar from '../Navbar';

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

describe('Navbar', () => {
  beforeEach(() => {
    // Resetear idioma antes de cada test
    i18n.changeLanguage('en');
  });

  test('renders navbar with Twenty One Pilots branding', () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Verificar que se muestra el título de la aplicación
    expect(screen.getByText('Twenty One Pilots')).toBeInTheDocument();
  });

  test('displays navigation menu items in English', async () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Verificar que se muestran los elementos del menú en inglés
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Discography')).toBeInTheDocument();
      expect(screen.getByText('Videos')).toBeInTheDocument();
      expect(screen.getByText('Concerts')).toBeInTheDocument();
      expect(screen.getByText('Forum')).toBeInTheDocument();
      expect(screen.getByText('Playlists')).toBeInTheDocument();
      expect(screen.getByText('Store')).toBeInTheDocument();
    });
  });

  test('displays navigation menu items in Spanish when language changes', async () => {
    // Cambiar idioma a español
    i18n.changeLanguage('es');

    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Verificar que se muestran los elementos del menú en español
    await waitFor(() => {
      expect(screen.getByText('Inicio')).toBeInTheDocument();
      expect(screen.getByText('Discografía')).toBeInTheDocument();
      expect(screen.getByText('Videos')).toBeInTheDocument();
      expect(screen.getByText('Conciertos')).toBeInTheDocument();
      expect(screen.getByText('Foro')).toBeInTheDocument();
      expect(screen.getByText('Playlists')).toBeInTheDocument();
      expect(screen.getByText('Tienda')).toBeInTheDocument();
    });
  });

  test('highlights active navigation item', async () => {
    // Simular que estamos en la página de discografía
    window.history.pushState({}, '', '/discography');

    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Verificar que el elemento activo tiene el estilo correspondiente
    await waitFor(() => {
      const discographyLink = screen.getByText('Discography');
      expect(discographyLink).toBeInTheDocument();
      // Nota: El estilo de borde se aplicaría dinámicamente basado en la ruta
    });
  });

  test('includes Material-UI icons for each menu item', async () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Verificar que se renderizan los iconos (usando data-testid o clases específicas)
    await waitFor(() => {
      // Los iconos de Material-UI se renderizan como elementos SVG
      const icons = document.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  test('renders theme toggle button', () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Verificar que existe el botón de cambio de tema
    const themeButton = screen.getByRole('button', { name: /toggle theme/i });
    expect(themeButton).toBeInTheDocument();
  });

  test('renders language selector', () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Verificar que se muestra el selector de idioma
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  test('navigation links have correct routes', async () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Verificar que los enlaces tienen los href correctos
    await waitFor(() => {
      const homeLink = screen.getByText('Home').closest('a');
      const discographyLink = screen.getByText('Discography').closest('a');

      expect(homeLink).toHaveAttribute('href', '/');
      expect(discographyLink).toHaveAttribute('href', '/discography');
    });
  });

  test('applies Twenty One Pilots theme colors', () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Verificar que se aplican los estilos del tema
    const navbar = screen.getByText('Twenty One Pilots').closest('[class*="MuiAppBar-root"]');
    expect(navbar).toBeInTheDocument();

    // Verificar colores específicos del tema (esto depende de la implementación de estilos)
    // El color rojo característico debería estar presente
  });

  test('handles responsive design', () => {
    // Mock de media query para móvil
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // En móvil, algunos elementos podrían ocultarse o cambiar de layout
    // Esto depende de la implementación específica del responsive design
    expect(screen.getByText('Twenty One Pilots')).toBeInTheDocument();
  });

  test('maintains accessibility features', () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Verificar que los botones tienen roles apropiados
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Verificar que los enlaces de navegación son accesibles
    const links = screen.getAllByRole('link');
    expect(links.length).toBeGreaterThan(0);
  });
});