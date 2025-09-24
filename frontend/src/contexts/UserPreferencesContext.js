import React, { createContext, useContext, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const UserPreferencesContext = createContext();

export function useUserPreferences() {
  const context = useContext(UserPreferencesContext);
  if (!context) {
    throw new Error('useUserPreferences debe ser usado dentro de un UserPreferencesProvider');
  }
  return context;
}

export function UserPreferencesProvider({ children }) {
  const { i18n } = useTranslation();
  const [currency, setCurrency] = useState('USD');
  const [language, setLanguage] = useState('en');

  // Cargar preferencias del localStorage al inicializar
  useEffect(() => {
    const savedCurrency = localStorage.getItem('twentyOnePilots-currency');
    const savedLanguage = localStorage.getItem('twentyOnePilots-language') || 'en';

    if (savedCurrency) {
      setCurrency(savedCurrency);
    }
    if (savedLanguage) {
      setLanguage(savedLanguage);
      i18n.changeLanguage(savedLanguage);
    }
  }, [i18n]);

  // Función para cambiar la divisa
  const changeCurrency = (newCurrency) => {
    setCurrency(newCurrency);
    localStorage.setItem('twentyOnePilots-currency', newCurrency);
  };

  // Función para cambiar el idioma
  const changeLanguage = (newLanguage) => {
    setLanguage(newLanguage);
    i18n.changeLanguage(newLanguage);
    localStorage.setItem('twentyOnePilots-language', newLanguage);
  };

  // Función para formatear precios según la divisa actual
  const formatPrice = (price) => {
    const formatter = new Intl.NumberFormat(language, {
      style: 'currency',
      currency: currency,
    });
    return formatter.format(price);
  };

  // Tasas de conversión (simplificadas - en producción usar API real)
  const getExchangeRate = (fromCurrency, toCurrency) => {
    const rates = {
      'USD': { 'EUR': 0.85, 'GBP': 0.73, 'USD': 1 },
      'EUR': { 'USD': 1.18, 'GBP': 0.86, 'EUR': 1 },
      'GBP': { 'USD': 1.37, 'EUR': 1.16, 'GBP': 1 }
    };
    return rates[fromCurrency]?.[toCurrency] || 1;
  };

  // Convertir precio a la divisa actual
  const convertPrice = (price, fromCurrency = 'USD') => {
    const rate = getExchangeRate(fromCurrency, currency);
    return price * rate;
  };

  const value = {
    currency,
    language,
    changeCurrency,
    changeLanguage,
    formatPrice,
    convertPrice,
    getExchangeRate,
  };

  return (
    <UserPreferencesContext.Provider value={value}>
      {children}
    </UserPreferencesContext.Provider>
  );
}