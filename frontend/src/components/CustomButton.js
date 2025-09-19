import React from 'react';
import { Button } from '@mui/material';
import { styled } from '@mui/material/styles';

// Botón personalizado Twenty One Pilots
const StyledButton = styled(Button)(({ theme }) => ({
  borderRadius: 0,
  textTransform: 'uppercase',
  letterSpacing: '1px',
  fontWeight: 500,
  padding: '12px 24px',
  fontSize: '0.9rem',
  transition: 'all 0.2s ease',
  border: `1px solid ${theme.palette.primary.main}`,
  color: theme.palette.primary.main,
  backgroundColor: 'transparent',
  '&:hover': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    transform: 'translateY(-1px)',
    boxShadow: `0 4px 8px rgba(255, 0, 0, 0.3)`,
  },
  '&.MuiButton-contained': {
    backgroundColor: theme.palette.primary.main,
    color: theme.palette.primary.contrastText,
    '&:hover': {
      backgroundColor: theme.palette.primary.dark,
    },
  },
  '&.MuiButton-outlined': {
    borderColor: theme.palette.primary.main,
    color: theme.palette.primary.main,
    '&:hover': {
      backgroundColor: theme.palette.primary.main,
      color: theme.palette.primary.contrastText,
    },
  },
}));

const CustomButton = ({ children, variant = 'outlined', ...props }) => {
  return (
    <StyledButton variant={variant} {...props}>
      {children}
    </StyledButton>
  );
};

export default CustomButton;