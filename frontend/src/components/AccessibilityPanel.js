import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  AccessibilityNew,
  Contrast,
  TextFields,
  Visibility,
  Close
} from '@mui/icons-material';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Switch,
  Typography,
  Box,
  IconButton,
  Tooltip
} from '@mui/material';
import { useTheme } from '../ThemeProvider';
import useAccessibility from '../hooks/useAccessibility';

const AccessibilityPanel = ({ open, onClose }) => {
  const { t } = useTranslation();
  const { isDarkMode, toggleTheme } = useTheme();
  const {
    highContrast,
    reducedMotion,
    fontSize,
    toggleHighContrast,
    toggleReducedMotion,
    changeFontSize
  } = useAccessibility();

  const [tempSettings, setTempSettings] = useState({
    highContrast,
    reducedMotion,
    fontSize,
    darkMode: isDarkMode
  });

  const handleSave = () => {
    if (tempSettings.highContrast !== highContrast) {
      toggleHighContrast();
    }
    if (tempSettings.reducedMotion !== reducedMotion) {
      toggleReducedMotion();
    }
    if (tempSettings.fontSize !== fontSize) {
      changeFontSize(tempSettings.fontSize);
    }
    if (tempSettings.darkMode !== isDarkMode) {
      toggleTheme();
    }
    onClose();
  };

  const handleCancel = () => {
    setTempSettings({
      highContrast,
      reducedMotion,
      fontSize,
      darkMode: isDarkMode
    });
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={handleCancel}
      maxWidth="sm"
      fullWidth
      aria-labelledby="accessibility-dialog-title"
      aria-describedby="accessibility-dialog-description"
    >
      <DialogTitle id="accessibility-dialog-title">
        <Box display="flex" alignItems="center" gap={1}>
          <AccessibilityNew />
          <Typography variant="h6" component="span">
            Configuración de Accesibilidad
          </Typography>
        </Box>
        <IconButton
          aria-label="Cerrar panel de accesibilidad"
          onClick={handleCancel}
          sx={{ position: 'absolute', right: 8, top: 8 }}
        >
          <Close />
        </IconButton>
      </DialogTitle>

      <DialogContent id="accessibility-dialog-description">
        <Box sx={{ mt: 2 }}>
          {/* Tema Oscuro/Claro */}
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">
              <Box display="flex" alignItems="center" gap={1}>
                <Visibility />
                <Typography variant="subtitle1">Tema</Typography>
              </Box>
            </FormLabel>
            <FormControlLabel
              control={
                <Switch
                  checked={tempSettings.darkMode}
                  onChange={(e) => setTempSettings(prev => ({
                    ...prev,
                    darkMode: e.target.checked
                  }))}
                  aria-describedby="theme-description"
                />
              }
              label={tempSettings.darkMode ? "Tema Oscuro" : "Tema Claro"}
            />
            <Typography id="theme-description" variant="body2" color="text.secondary">
              Cambia entre tema claro y oscuro para mayor comodidad visual
            </Typography>
          </FormControl>

          {/* Alto Contraste */}
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">
              <Box display="flex" alignItems="center" gap={1}>
                <Contrast />
                <Typography variant="subtitle1">Alto Contraste</Typography>
              </Box>
            </FormLabel>
            <FormControlLabel
              control={
                <Switch
                  checked={tempSettings.highContrast}
                  onChange={(e) => setTempSettings(prev => ({
                    ...prev,
                    highContrast: e.target.checked
                  }))}
                  aria-describedby="contrast-description"
                />
              }
              label={tempSettings.highContrast ? "Activado" : "Desactivado"}
            />
            <Typography id="contrast-description" variant="body2" color="text.secondary">
              Aumenta el contraste para mejor legibilidad
            </Typography>
          </FormControl>

          {/* Tamaño de Fuente */}
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">
              <Box display="flex" alignItems="center" gap={1}>
                <TextFields />
                <Typography variant="subtitle1">Tamaño de Fuente</Typography>
              </Box>
            </FormLabel>
            <RadioGroup
              value={tempSettings.fontSize}
              onChange={(e) => setTempSettings(prev => ({
                ...prev,
                fontSize: e.target.value
              }))}
              aria-describedby="font-size-description"
            >
              <FormControlLabel
                value="small"
                control={<Radio />}
                label="Pequeño"
              />
              <FormControlLabel
                value="medium"
                control={<Radio />}
                label="Mediano"
              />
              <FormControlLabel
                value="large"
                control={<Radio />}
                label="Grande"
              />
            </RadioGroup>
            <Typography id="font-size-description" variant="body2" color="text.secondary">
              Ajusta el tamaño del texto para mejor legibilidad
            </Typography>
          </FormControl>

          {/* Movimiento Reducido */}
          <FormControl component="fieldset" sx={{ mb: 3 }}>
            <FormLabel component="legend">
              <Typography variant="subtitle1">Movimiento Reducido</Typography>
            </FormLabel>
            <FormControlLabel
              control={
                <Switch
                  checked={tempSettings.reducedMotion}
                  onChange={(e) => setTempSettings(prev => ({
                    ...prev,
                    reducedMotion: e.target.checked
                  }))}
                  aria-describedby="motion-description"
                />
              }
              label={tempSettings.reducedMotion ? "Activado" : "Desactivado"}
            />
            <Typography id="motion-description" variant="body2" color="text.secondary">
              Reduce animaciones y transiciones para evitar mareos
            </Typography>
          </FormControl>

          {/* Información de accesibilidad */}
          <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="h6" gutterBottom>
              Atajos de Teclado
            </Typography>
            <Typography variant="body2" component="div">
              <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
                <li><strong>Ctrl/Cmd + 1-5:</strong> Navegar a secciones principales</li>
                <li><strong>Tab:</strong> Navegar entre elementos interactivos</li>
                <li><strong>Enter/Espacio:</strong> Activar elementos</li>
                <li><strong>Escape:</strong> Cerrar menús y modales</li>
              </ul>
            </Typography>
          </Box>
        </Box>
      </DialogContent>

      <DialogActions>
        <Button
          onClick={handleCancel}
          aria-label="Cancelar cambios y cerrar panel"
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSave}
          variant="contained"
          aria-label="Guardar configuración de accesibilidad"
        >
          Guardar Cambios
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default AccessibilityPanel;