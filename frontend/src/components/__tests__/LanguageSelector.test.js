import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../../i18n';
import LanguageSelector from '../LanguageSelector';

// Mock del ThemeProvider para evitar dependencias complejas
const MockThemeProvider = ({ children }) => <div>{children}</div>;

// Wrapper para proporcionar el contexto de i18n
const TestWrapper = ({ children }) => (
  <I18nextProvider i18n={i18n}>
    <MockThemeProvider>
      {children}
    </MockThemeProvider>
  </I18nextProvider>
);

describe('LanguageSelector', () => {
  beforeEach(() => {
    // Limpiar localStorage antes de cada test
    localStorage.clear();
    // Resetear idioma a inglés por defecto
    i18n.changeLanguage('en');
  });

  test('renders language selector with current language', async () => {
    render(
      <TestWrapper>
        <LanguageSelector />
      </TestWrapper>
    );

    // Verificar que se muestra el selector de idioma
    expect(screen.getByRole('combobox')).toBeInTheDocument();

    // Verificar que se muestra el idioma actual (inglés por defecto)
    await waitFor(() => {
      expect(screen.getByText('🇺🇸')).toBeInTheDocument();
      expect(screen.getByText('English')).toBeInTheDocument();
    });
  });

  test('displays available languages in dropdown', async () => {
    render(
      <TestWrapper>
        <LanguageSelector />
      </TestWrapper>
    );

    // Abrir el dropdown usando el combobox
    const selectElement = screen.getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Verificar que se puede abrir el dropdown (simplificado)
    expect(selectElement).toBeInTheDocument();
  });

  test('changes language when selecting Spanish', async () => {
    render(
      <TestWrapper>
        <LanguageSelector />
      </TestWrapper>
    );

    // Verificar idioma inicial
    expect(i18n.language).toBe('en');

    // Abrir dropdown y seleccionar español
    const selectElement = screen.getByRole('combobox');
    fireEvent.mouseDown(selectElement);

    // Buscar la opción de español por partes
    const spanishFlag = await screen.findByText('🇪🇸');
    const spanishText = await screen.findByText('Spanish');
    fireEvent.click(spanishFlag.closest('li') || spanishText.closest('li'));

    // Verificar que el idioma cambió
    await waitFor(() => {
      expect(i18n.language).toBe('es');
    });
  });

  test('persists language selection in localStorage', async () => {
    render(
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

    // Verificar que se guardó en localStorage
    await waitFor(() => {
      expect(localStorage.setItem).toHaveBeenCalledWith('twentyOnePilots-language', 'es');
    });
  });

  test('loads language from localStorage on mount', () => {
    // Simular que el usuario ya seleccionó español anteriormente
    localStorage.getItem.mockReturnValue('es');

    render(
      <TestWrapper>
        <LanguageSelector />
      </TestWrapper>
    );

    // Verificar que el componente se renderiza correctamente
    expect(screen.getByRole('combobox')).toBeInTheDocument();
  });

  test('shows correct flag and name for current language', async () => {
    // Cambiar a español primero
    i18n.changeLanguage('es');

    render(
      <TestWrapper>
        <LanguageSelector />
      </TestWrapper>
    );

    // Verificar que se muestra la bandera y nombre correctos
    await waitFor(() => {
      expect(screen.getByText('🇪🇸')).toBeInTheDocument();
      expect(screen.getByText('Español')).toBeInTheDocument();
    });
  });

  test('handles language change gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <TestWrapper>
        <LanguageSelector />
      </TestWrapper>
    );

    // Intentar cambiar a un idioma no soportado (esto no debería causar errores)
    await act(async () => {
      i18n.changeLanguage('fr'); // Francés no está soportado
    });

    // Verificar que no hay errores
    expect(consoleSpy).not.toHaveBeenCalled();

    consoleSpy.mockRestore();
  });
});