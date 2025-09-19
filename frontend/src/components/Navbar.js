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
    <AppBar
      position="static"
      elevation={0}
      component="nav"
      role="navigation"
      aria-label={t('nav.mainNavigation')}
    >
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
          aria-label={t('nav.homePage')}
        >
          Twenty One Pilots
        </Typography>

        <Box
          sx={{ flexGrow: 1, display: 'flex', gap: 2 }}
          component="ul"
          role="menubar"
          aria-label={t('nav.mainMenu')}
        >
          {menuItems.map((item, index) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <li key={item.path} role="none">
                <Button
                  component={Link}
                  to={item.path}
                  startIcon={<Icon aria-hidden="true" />}
                  role="menuitem"
                  tabIndex={index === 0 ? 0 : -1}
                  aria-current={isActive ? 'page' : undefined}
                  aria-label={`${t('nav.goTo')} ${item.label}`}
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
                    '&:focus': {
                      outline: `2px solid ${muiTheme.palette.primary.main}`,
                      outlineOffset: '2px',
                    },
                  }}
                >
                  {item.label}
                </Button>
              </li>
            );
          })}
        </Box>

        <Box
          sx={{ display: 'flex', alignItems: 'center', gap: 2 }}
          component="div"
          role="toolbar"
          aria-label={t('nav.userControls')}
        >
          <LanguageSelector />
          <IconButton
            onClick={toggleTheme}
            sx={{
              color: muiTheme.palette.text.primary,
              '&:hover': {
                color: muiTheme.palette.primary.main,
              },
              '&:focus': {
                outline: `2px solid ${muiTheme.palette.primary.main}`,
                outlineOffset: '2px',
              },
            }}
            title={t('theme.toggle')}
            aria-label={t('theme.toggleAria')}
            aria-pressed={isDarkMode}
          >
            {isDarkMode ? <Brightness7 aria-hidden="true" /> : <Brightness4 aria-hidden="true" />}
          </IconButton>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;