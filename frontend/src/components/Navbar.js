import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useTheme
} from '@mui/material';
import {
  Brightness4,
  Brightness7,
  MusicNote,
  Album,
  VideoLibrary,
  Event,
  Forum,
  QueueMusic,
  ShoppingCart
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../ThemeProvider';
import LanguageSelector from './LanguageSelector';

const Navbar = () => {
  const location = useLocation();
  const muiTheme = useTheme();
  const { isDarkMode, toggleTheme } = useCustomTheme();
  const { t } = useTranslation();

  const menuItems = [
    { path: '/', label: t('nav.home'), icon: MusicNote },
    { path: '/discography', label: t('nav.discography'), icon: Album },
    { path: '/videos', label: t('nav.videos'), icon: VideoLibrary },
    { path: '/concerts', label: t('nav.concerts'), icon: Event },
    { path: '/forum', label: t('nav.forum'), icon: Forum },
    { path: '/playlists', label: t('nav.playlists'), icon: QueueMusic },
    { path: '/store', label: t('nav.store'), icon: ShoppingCart },
  ];

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <Typography
          variant="h6"
          component={Link}
          to="/"
          sx={{
            flexGrow: 0,
            textDecoration: 'none',
            color: muiTheme.palette.primary.main,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '2px',
            mr: 4,
          }}
        >
          Twenty One Pilots
        </Typography>

        <Box sx={{ flexGrow: 1, display: 'flex', gap: 2 }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <Button
                key={item.path}
                component={Link}
                to={item.path}
                startIcon={<Icon />}
                sx={{
                  color: isActive
                    ? muiTheme.palette.primary.main
                    : muiTheme.palette.text.primary,
                  borderBottom: isActive
                    ? `2px solid ${muiTheme.palette.primary.main}`
                    : 'none',
                  borderRadius: 0,
                  textTransform: 'uppercase',
                  letterSpacing: '1px',
                  fontSize: '0.9rem',
                  '&:hover': {
                    color: muiTheme.palette.primary.main,
                    backgroundColor: 'transparent',
                  },
                }}
              >
                {item.label}
              </Button>
            );
          })}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <LanguageSelector />
          <IconButton
            onClick={toggleTheme}
            sx={{
              color: muiTheme.palette.text.primary,
              '&:hover': {
                color: muiTheme.palette.primary.main,
              },
            }}
            title={t('theme.toggle')}
          >
            {isDarkMode ? <Brightness7 /> : <Brightness4 />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;