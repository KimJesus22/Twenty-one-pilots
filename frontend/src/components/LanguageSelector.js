import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Select,
  MenuItem,
  FormControl,
  Box,
  useTheme
} from '@mui/material';
import {
  Language as LanguageIcon
} from '@mui/icons-material';

const LanguageSelector = () => {
  const { i18n, t } = useTranslation();
  const theme = useTheme();

  const languages = [
    { code: 'en', name: t('language.english'), flag: '🇺🇸' },
    { code: 'es', name: t('language.spanish'), flag: '🇪🇸' },
  ];

  const handleLanguageChange = (event) => {
    const selectedLanguage = event.target.value;
    i18n.changeLanguage(selectedLanguage);
  };

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <LanguageIcon sx={{ color: theme.palette.text.secondary }} />
      <FormControl size="small" sx={{ minWidth: 120 }}>
        <Select
          value={i18n.language}
          onChange={handleLanguageChange}
          sx={{
            color: theme.palette.text.primary,
            '& .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.divider,
            },
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderColor: theme.palette.primary.main,
            },
            '& .MuiSelect-icon': {
              color: theme.palette.text.secondary,
            },
          }}
        >
          {languages.map((language) => (
            <MenuItem key={language.code} value={language.code}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <span>{language.flag}</span>
                <span>{language.name}</span>
              </Box>
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
};

export default LanguageSelector;