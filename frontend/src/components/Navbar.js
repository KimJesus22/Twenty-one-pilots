import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../contexts/AuthContext';
import { useCart } from '../contexts/CartContext';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  useTheme,
  Menu,
  MenuItem
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
  ShoppingCart,
  LibraryMusic,
  AccountCircle,
  ExitToApp
} from '@mui/icons-material';
import { useTheme as useCustomTheme } from '../ThemeProvider';
import LanguageSelector from './LanguageSelector';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const muiTheme = useTheme();
  const { isDarkMode, toggleTheme } = useCustomTheme();
  const { user, logout, isAuthenticated, isAdmin } = useAuth();
  const { itemCount } = useCart();
  const { t } = useTranslation();

  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);

  // Menú items dinámicos basado en el rol del usuario
  const getMenuItems = () => {
    const baseItems = [
      { path: '/', label: t('nav.home'), icon: MusicNote },
      { path: '/discography', label: t('nav.discography'), icon: Album },
      { path: '/videos', label: t('nav.videos'), icon: VideoLibrary },
      { path: '/concerts', label: t('nav.concerts'), icon: Event },
      { path: '/forum', label: t('nav.forum'), icon: Forum },
      { path: '/spotify', label: 'Spotify', icon: LibraryMusic },
      { path: '/store', label: t('nav.store'), icon: ShoppingCart },
    ];

    // Agregar playlists solo si está autenticado
    if (isAuthenticated()) {
      baseItems.splice(5, 0, { path: '/playlists', label: t('nav.playlists'), icon: QueueMusic });
    }

    // Agregar admin solo si es admin
    if (isAdmin()) {
      baseItems.push({ path: '/admin', label: 'Admin', icon: '⚙️' });
    }

    return baseItems;
  };

  const menuItems = getMenuItems();

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleClose();
    navigate('/');
  };


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

          {/* Carrito - solo mostrar si hay items */}
          {itemCount > 0 && (
            <Button
              component={Link}
              to="/store"
              startIcon={<ShoppingCart aria-hidden="true" />}
              sx={{
                color: muiTheme.palette.text.primary,
                '&:hover': {
                  color: muiTheme.palette.primary.main,
                },
              }}
              aria-label={`Carrito de compras (${itemCount} items)`}
            >
              {itemCount}
            </Button>
          )}

          {/* Autenticación */}
          {isAuthenticated() ? (
            <div>
              <IconButton
                onClick={handleMenu}
                sx={{
                  color: muiTheme.palette.text.primary,
                  '&:hover': {
                    color: muiTheme.palette.primary.main,
                  },
                }}
                aria-label="Cuenta de usuario"
                aria-controls="user-menu"
                aria-haspopup="true"
              >
                <AccountCircle aria-hidden="true" />
              </IconButton>
              <Menu
                id="user-menu"
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                anchorOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
                transformOrigin={{
                  vertical: 'top',
                  horizontal: 'right',
                }}
              >
                <MenuItem disabled>
                  <Typography variant="body2">
                    {user.username} {user.role === 'admin' && '(Admin)'}
                  </Typography>
                </MenuItem>
                <MenuItem onClick={handleLogout}>
                  <ExitToApp sx={{ mr: 1 }} aria-hidden="true" />
                  Cerrar sesión
                </MenuItem>
              </Menu>
            </div>
          ) : (
            <Button
              component={Link}
              to="/login"
              variant="outlined"
              sx={{
                color: muiTheme.palette.primary.main,
                borderColor: muiTheme.palette.primary.main,
                '&:hover': {
                  backgroundColor: muiTheme.palette.primary.main,
                  color: muiTheme.palette.primary.contrastText,
                },
              }}
            >
              Iniciar sesión
            </Button>
          )}

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