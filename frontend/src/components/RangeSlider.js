import React, { useState, useEffect, useRef } from 'react';
import './RangeSlider.css';

const RangeSlider = ({
  min = 0,
  max = 1000,
  step = 1,
  value = [0, 1000],
  onChange,
  className = '',
  disabled = false
}) => {
  const [localValue, setLocalValue] = useState(value);
  const [isDragging, setIsDragging] = useState(null); // null, 'min', 'max'
  const sliderRef = useRef(null);

  useEffect(() => {
    setLocalValue(value);
  }, [value]);

  const handleMouseDown = (type) => (e) => {
    if (disabled) return;
    setIsDragging(type);
    e.preventDefault();
  };

  const handleMouseMove = (e) => {
    if (!isDragging || disabled) return;

    const rect = sliderRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newValue = Math.round(min + (max - min) * percentage / step) * step;

    setLocalValue(prev => {
      if (isDragging === 'min') {
        const newMin = Math.min(newValue, prev[1] - step);
        return [newMin, prev[1]];
      } else {
        const newMax = Math.max(newValue, prev[0] + step);
        return [prev[0], newMax];
      }
    });
  };

  const handleMouseUp = () => {
    if (isDragging && onChange) {
      onChange(localValue);
    }
    setIsDragging(null);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, localValue]);

  const handleInputChange = (type) => (e) => {
    if (disabled) return;
    const newValue = Number(e.target.value);

    setLocalValue(prev => {
      if (type === 'min') {
        const newMin = Math.max(min, Math.min(newValue, prev[1] - step));
        return [newMin, prev[1]];
      } else {
        const newMax = Math.min(max, Math.max(newValue, prev[0] + step));
        return [prev[0], newMax];
      }
    });
  };

  const handleInputBlur = () => {
    if (onChange) {
      onChange(localValue);
    }
  };

  const minPercentage = ((localValue[0] - min) / (max - min)) * 100;
  const maxPercentage = ((localValue[1] - min) / (max - min)) * 100;

  return (
    <div className={`range-slider ${className} ${disabled ? 'disabled' : ''}`}>
      <div className="range-slider-track" ref={sliderRef}>
        <div
          className="range-slider-range"
          style={{
            left: `${minPercentage}%`,
            width: `${maxPercentage - minPercentage}%`
          }}
        />
        <div
          className={`range-slider-thumb min ${isDragging === 'min' ? 'active' : ''}`}
          style={{ left: `${minPercentage}%` }}
          onMouseDown={handleMouseDown('min')}
        />
        <div
          className={`range-slider-thumb max ${isDragging === 'max' ? 'active' : ''}`}
          style={{ left: `${maxPercentage}%` }}
          onMouseDown={handleMouseDown('max')}
        />
      </div>

      <div className="range-slider-inputs">
        <div className="input-group">
          <label>Mínimo</label>
          <input
            type="number"
            value={localValue[0]}
            onChange={handleInputChange('min')}
            onBlur={handleInputBlur}
            min={min}
            max={localValue[1] - step}
            step={step}
            disabled={disabled}
          />
        </div>
        <div className="input-group">
          <label>Máximo</label>
          <input
            type="number"
            value={localValue[1]}
            onChange={handleInputChange('max')}
            onBlur={handleInputBlur}
            min={localValue[0] + step}
            max={max}
            step={step}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
};

export default RangeSlider;