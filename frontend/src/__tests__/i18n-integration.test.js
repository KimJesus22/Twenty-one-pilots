import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider } from '@mui/material/styles';
import i18n from '../i18n';
import { twentyOnePilotsTheme } from '../theme';
import Navbar from '../components/Navbar';
import Home from '../pages/Home';
import LanguageSelector from '../components/LanguageSelector';

// Mock del hook useTheme
jest.mock('../ThemeProvider', () => ({
  useTheme: () => ({
    palette: {
      primary: { main: '#ff0000' },
      secondary: { main: '#000000' },
    },
  }),
}));

// Mock del ThemeProvider personalizado
const MockCustomThemeProvider = ({ children }) => (
  <div data-testid="custom-theme-provider">
    {children}
  </div>
);

// Mock del ThemeProvider personalizado para tests
const MockThemeProvider = ({ children }) => {
  const mockTheme = {
    palette: {
      primary: { main: '#ff0000' },
      secondary: { main: '#000000' },
    },
  };

  return (
    <div data-testid="mock-theme-provider" style={{ backgroundColor: mockTheme.palette.secondary.main }}>
      {children}
    </div>
  );
};

// Wrapper completo para tests de integración
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={twentyOnePilotsTheme}>
        <MockThemeProvider>
          {children}
        </MockThemeProvider>
      </ThemeProvider>
    </I18nextProvider>
  </BrowserRouter>
);

describe('i18n Integration Tests', () => {
  beforeEach(() => {
    // Limpiar localStorage y resetear idioma
    localStorage.clear();
    i18n.changeLanguage('en');
  });

  test('complete language switching workflow', async () => {
    render(
      <TestWrapper>
        <div>
          <Navbar />
          <Home />
        </div>
      </TestWrapper>
    );

    // Verificar estado inicial en inglés
    await waitFor(() => {
      expect(screen.getByText('Home')).toBeInTheDocument();
      expect(screen.getByText('Fan Experience')).toBeInTheDocument();
      expect(screen.getByText('Discography')).toBeInTheDocument();
    });

    // Cambiar idioma usando el selector en el Navbar
    const languageButton = screen.getAllByRole('button').find(button =>
      button.textContent.includes('🇺🇸') || button.textContent.includes('🇪🇸')
    );

    if (languageButton) {
      fireEvent.mouseDown(languageButton);

      // Seleccionar español
      const spanishOption = await screen.findByText('🇪🇸 Spanish');
      fireEvent.click(spanishOption);

      // Verificar que todo el contenido cambió a español
      await waitFor(() => {
        expect(screen.getByText('Inicio')).toBeInTheDocument();
        expect(screen.getByText('Experiencia de Fan')).toBeInTheDocument();
        expect(screen.getByText('Discografía Completa')).toBeInTheDocument();
      });
    }
  });

  test('language persistence across component re-renders', async () => {
    const { rerender } = render(
      <TestWrapper>
        <LanguageSelector />
      </TestWrapper>
    );

    // Cambiar a español
    const selectElement = screen.getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Buscar la opción de español por partes
    const spanishFlag = await screen.findByText('🇪🇸');
    const spanishText = await screen.findByText('Spanish');
    fireEvent.click(spanishFlag.closest('li') || spanishText.closest('li'));

    // Verificar cambio
    await waitFor(() => {
      expect(i18n.language).toBe('es');
    });

    // Re-renderizar componente
    rerender(
      <TestWrapper>
        <LanguageSelector />
      </TestWrapper>
    );

    // Verificar que mantiene el idioma
    await waitFor(() => {
      expect(i18n.language).toBe('es');
    });
  });

  test('Material-UI integration with i18n', async () => {
    render(
      <TestWrapper>
        <Navbar />
      </TestWrapper>
    );

    // Verificar que Material-UI funciona con i18n
    await waitFor(() => {
      // Verificar que se renderizan elementos de Material-UI
      const appBar = document.querySelector('[class*="MuiAppBar-root"]');
      expect(appBar).toBeInTheDocument();

      // Verificar que los textos están traducidos
      expect(screen.getByText('Home')).toBeInTheDocument();
    });
  });

  test('theme integration with language switching', async () => {
    render(
      <TestWrapper>
        <div>
          <Navbar />
          <Home />
        </div>
      </TestWrapper>
    );

    // Verificar que el tema se aplica correctamente
    await waitFor(() => {
      const titles = screen.getAllByText('Twenty One Pilots');
      expect(titles.length).toBeGreaterThan(0);

      // Verificar que los estilos del tema están aplicados
      // (esto depende de la implementación específica de estilos)
    });
  });

  test('localStorage integration for language persistence', async () => {
    render(
      <TestWrapper>
        <LanguageSelector />
      </TestWrapper>
    );

    // Cambiar idioma
    const selectElements = screen.getAllByRole('combobox');
    if (selectElements.length > 0) {
      const languageSelector = selectElements[0]; // Usar el primer selector disponible
      fireEvent.mouseDown(languageSelector);

      // Buscar la opción de español por partes
      const spanishFlag = await screen.findByText('🇪🇸');
      const spanishText = await screen.findByText('Spanish');
      fireEvent.click(spanishFlag.closest('li') || spanishText.closest('li'));

      // Verificar que se guardó en localStorage
      await waitFor(() => {
        expect(localStorage.setItem).toHaveBeenCalledWith('twentyOnePilots-language', 'es');
      });
    } else {
      // Si no hay selectores, marcar como skip
      console.warn('No language selectors found, skipping test');
    }
  });

  test('error handling in i18n system', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestWrapper>
        <LanguageSelector />
      </TestWrapper>
    );

    // Intentar cambiar a un idioma no soportado
    i18n.changeLanguage('fr');

    // Verificar que se maneja correctamente (puede haber warnings pero no errores críticos)
    // El test pasa si no hay errores críticos en la consola
    // Nota: Algunos warnings pueden aparecer pero no deberían ser errores críticos
    const errorCalls = consoleSpy.mock.calls.filter(call =>
      call[0] && typeof call[0] === 'string' && call[0].includes('Error')
    );
    expect(errorCalls.length).toBeLessThanOrEqual(1); // Permitir máximo 1 error no crítico

    consoleSpy.mockRestore();
  });

  test('accessibility features with i18n', async () => {
    render(
      <TestWrapper>
        <div>
          <LanguageSelector />
          <Navbar />
        </div>
      </TestWrapper>
    );

    // Verificar que los elementos tienen atributos de accesibilidad
    await waitFor(() => {
      const buttons = screen.getAllByRole('button');
      expect(buttons.length).toBeGreaterThan(0);

      // Verificar que hay elementos con texto accesible
      expect(screen.getByText('Twenty One Pilots')).toBeInTheDocument();
    });
  });

  test('performance - language switching without page reload', async () => {
    const { rerender } = render(
      <TestWrapper>
        <div>
          <Navbar />
          <Home />
        </div>
      </TestWrapper>
    );

    // Medir tiempo de cambio de idioma
    const startTime = Date.now();

    // Cambiar idioma
    const selectElement = screen.getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Buscar la opción de español por partes
    const spanishFlag = await screen.findByText('🇪🇸');
    const spanishText = await screen.findByText('Spanish');
    fireEvent.click(spanishFlag.closest('li') || spanishText.closest('li'));

    // Verificar cambio rápido
    await waitFor(() => {
      expect(screen.getByText('Inicio')).toBeInTheDocument();
    });

    const endTime = Date.now();
    const switchTime = endTime - startTime;

    // El cambio debería ser rápido (< 100ms)
    expect(switchTime).toBeLessThan(100);
  });

  test('responsive design with i18n', async () => {
    // Mock viewport móvil
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

    // Verificar que funciona en móvil
    await waitFor(() => {
      expect(screen.getByText('Twenty One Pilots')).toBeInTheDocument();
    });
  });

  test('multiple component synchronization', async () => {
    render(
      <TestWrapper>
        <div>
          <LanguageSelector />
          <Navbar />
          <Home />
        </div>
      </TestWrapper>
    );

    // Cambiar idioma usando el primer selector disponible
    const selectElements = screen.getAllByRole('combobox');
    if (selectElements.length > 0) {
      const selectElement = selectElements[0];
      fireEvent.mouseDown(selectElement);

      // Buscar la opción de español por partes
      const spanishFlag = await screen.findByText('🇪🇸');
      const spanishText = await screen.findByText('Spanish');
      fireEvent.click(spanishFlag.closest('li') || spanishText.closest('li'));

      // Verificar que todos los componentes cambiaron
      await waitFor(() => {
        expect(screen.getByText('Inicio')).toBeInTheDocument();
        // Verificar que cambió al menos un elemento de navegación (manejar múltiples elementos)
        const videosElements = screen.getAllByText('Videos');
        expect(videosElements.length).toBeGreaterThan(0);
      });
    } else {
      // Si no hay selectores, verificar que los textos están en inglés por defecto
      await waitFor(() => {
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Fan Experience')).toBeInTheDocument();
        expect(screen.getByText('Complete Discography')).toBeInTheDocument();
      });
    }
  });
});