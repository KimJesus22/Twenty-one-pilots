import React from 'react';
import { Card, CardContent, CardMedia, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';

// Card personalizado Twenty One Pilots
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: 0,
  border: `1px solid ${theme.palette.divider}`,
  backgroundColor: theme.palette.background.paper,
  transition: 'all 0.2s ease',
  '&:hover': {
    borderColor: theme.palette.primary.main,
    transform: 'translateY(-2px)',
  },
}));

const StyledCardMedia = styled(CardMedia)(({ theme }) => ({
  height: 200,
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.background.default} 100%)`,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  '& img': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
  },
}));

const NoImage = styled('div')(({ theme }) => ({
  fontSize: '3rem',
  opacity: 0.7,
  color: theme.palette.primary.main,
}));

const CustomCard = ({
  title,
  description,
  image,
  children,
  onClick,
  ...props
}) => {
  return (
    <StyledCard onClick={onClick} {...props}>
      {image && (
        <StyledCardMedia>
          <img src={image} alt={title} />
        </StyledCardMedia>
      )}
      {!image && (
        <StyledCardMedia>
          <NoImage>🎵</NoImage>
        </StyledCardMedia>
      )}
      <CardContent>
        {title && (
          <Typography variant="h6" component="h3" gutterBottom>
            {title}
          </Typography>
        )}
        {description && (
          <Typography variant="body2" color="text.secondary">
            {description}
          </Typography>
        )}
        {children}
      </CardContent>
    </StyledCard>
  );
};

export default CustomCard;