import React from 'react';
import './Spinner.css';

const Spinner = ({
  size = 'medium',
  color = 'red',
  type = 'default',
  text = null,
  overlay = false
}) => {
  const spinnerClasses = [
    'spinner',
    `spinner-${size}`,
    `spinner-${color}`,
    `spinner-${type}`,
    overlay ? 'spinner-overlay' : ''
  ].filter(Boolean).join(' ');

  const spinnerContent = (
    <div className={spinnerClasses}>
      <div className="spinner-inner">
        {type === 'pulse' && <div className="spinner-pulse"></div>}
        {type === 'dots' && (
          <div className="spinner-dots">
            <div></div>
            <div></div>
            <div></div>
          </div>
        )}
        {type === 'ring' && <div className="spinner-ring"></div>}
        {type === 'default' && (
          <div className="spinner-circle">
            <div className="spinner-circle-inner"></div>
          </div>
        )}
      </div>
      {text && <div className="spinner-text">{text}</div>}
    </div>
  );

  if (overlay) {
    return (
      <div className="spinner-overlay-container">
        {spinnerContent}
      </div>
    );
  }

  return spinnerContent;
};

export default Spinner;