import React from 'react';
import { Link, useLocation } from 'react-router-dom';
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

const Navbar = () => {
  const location = useLocation();
  const muiTheme = useTheme();
  const { isDarkMode, toggleTheme } = useCustomTheme();

  const menuItems = [
    { path: '/', label: 'Inicio', icon: MusicNote },
    { path: '/discography', label: 'Discografía', icon: Album },
    { path: '/videos', label: 'Videos', icon: VideoLibrary },
    { path: '/concerts', label: 'Conciertos', icon: Event },
    { path: '/forum', label: 'Foro', icon: Forum },
    { path: '/playlists', label: 'Playlists', icon: QueueMusic },
    { path: '/store', label: 'Tienda', icon: ShoppingCart },
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

        <IconButton
          onClick={toggleTheme}
          sx={{
            color: muiTheme.palette.text.primary,
            '&:hover': {
              color: muiTheme.palette.primary.main,
            },
          }}
        >
          {isDarkMode ? <Brightness7 /> : <Brightness4 />}
        </IconButton>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;