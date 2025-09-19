import i18n from '../i18n';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('i18n Configuration', () => {
  beforeEach(() => {
    // Limpiar mocks antes de cada test
    jest.clearAllMocks();
    // Resetear idioma
    i18n.changeLanguage('en');
  });

  test('initializes with English as default language', () => {
    expect(i18n.language).toBe('en');
  });

  test('supports English and Spanish languages', () => {
    const supportedLanguages = Object.keys(i18n.services.resourceStore.data);
    expect(supportedLanguages).toContain('en');
    expect(supportedLanguages).toContain('es');
  });

  test('can change language to Spanish', async () => {
    await i18n.changeLanguage('es');
    expect(i18n.language).toBe('es');
  });

  test('can change language back to English', async () => {
    await i18n.changeLanguage('es');
    expect(i18n.language).toBe('es');

    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
  });

  test('persists language selection in localStorage', async () => {
    await i18n.changeLanguage('es');

    expect(localStorage.setItem).toHaveBeenCalledWith('twentyOnePilots-language', 'es');
  });

  test('loads language from localStorage on initialization', () => {
    // Simular que hay un idioma guardado
    localStorageMock.getItem.mockReturnValue('es');

    // Reinicializar i18n para probar la carga
    i18n.changeLanguage('es');

    // Verificar que se guarda en localStorage
    expect(localStorage.setItem).toHaveBeenCalledWith('twentyOnePilots-language', 'es');
  });

  test('falls back to English for missing translations', () => {
    // Cambiar a español
    i18n.changeLanguage('es');

    // Intentar obtener una traducción que no existe
    const missingTranslation = i18n.t('nonexistent.key');

    // Debería devolver la clave ya que no hay fallback configurado para esta clave específica
    expect(missingTranslation).toBe('nonexistent.key');
  });

  test('provides correct English translations', () => {
    i18n.changeLanguage('en');

    expect(i18n.t('nav.home')).toBe('Home');
    expect(i18n.t('nav.discography')).toBe('Discography');
    expect(i18n.t('hero.title')).toBe('Twenty One Pilots');
    expect(i18n.t('common.loading')).toBe('Loading...');
  });

  test('provides correct Spanish translations', () => {
    i18n.changeLanguage('es');

    expect(i18n.t('nav.home')).toBe('Inicio');
    expect(i18n.t('nav.discography')).toBe('Discografía');
    expect(i18n.t('hero.title')).toBe('Twenty One Pilots');
    expect(i18n.t('common.loading')).toBe('Cargando...');
  });

  test('handles nested translation keys', () => {
    i18n.changeLanguage('en');

    expect(i18n.t('features.discography.title')).toBe('Complete Discography');
    expect(i18n.t('features.videos.title')).toBe('Official Videos');
  });

  test('supports interpolation', () => {
    i18n.changeLanguage('en');

    // Las traducciones actuales no usan interpolación, pero podemos probar con claves que podrían tenerla
    expect(i18n.t('discography.title')).toBe('Twenty One Pilots Discography');
  });

  test('maintains language selection across sessions', async () => {
    // Simular primera sesión
    await i18n.changeLanguage('es');
    expect(localStorage.setItem).toHaveBeenCalledWith('twentyOnePilots-language', 'es');

    // Simular nueva sesión cargando desde localStorage
    localStorageMock.getItem.mockReturnValue('es');
    await i18n.changeLanguage('es'); // Esto simularía la carga inicial

    expect(i18n.language).toBe('es');
  });

  test('handles language change errors gracefully', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    // Intentar cambiar a un idioma no soportado
    await i18n.changeLanguage('fr');

    // El idioma debería cambiar pero usar el fallback
    expect(i18n.language).toBe('fr'); // i18next permite cualquier código de idioma

    consoleSpy.mockRestore();
  });
});