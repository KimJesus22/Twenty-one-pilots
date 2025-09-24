import React from 'react';
import { useTranslation } from 'react-i18next';
import { useUserPreferences } from '../contexts/UserPreferencesContext';
import './LanguageCurrencySelector.css';

const LanguageCurrencySelector = () => {
  const { t } = useTranslation();
  const { currency, language, changeCurrency, changeLanguage } = useUserPreferences();

  const languages = [
    { code: 'en', name: t('language.english') },
    { code: 'es', name: t('language.spanish') },
    { code: 'fr', name: t('language.french') },
  ];

  const currencies = [
    { code: 'USD', symbol: '$', name: t('currency.usd') },
    { code: 'EUR', symbol: '€', name: t('currency.eur') },
    { code: 'GBP', symbol: '£', name: t('currency.gbp') },
  ];

  return (
    <div className="language-currency-selector">
      <div className="selector-group">
        <label htmlFor="language-select">{t('language.select')}:</label>
        <select
          id="language-select"
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
          className="selector-dropdown"
        >
          {languages.map((lang) => (
            <option key={lang.code} value={lang.code}>
              {lang.name}
            </option>
          ))}
        </select>
      </div>

      <div className="selector-group">
        <label htmlFor="currency-select">{t('currency.select')}:</label>
        <select
          id="currency-select"
          value={currency}
          onChange={(e) => changeCurrency(e.target.value)}
          className="selector-dropdown"
        >
          {currencies.map((curr) => (
            <option key={curr.code} value={curr.code}>
              {curr.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
};

export default LanguageCurrencySelector;