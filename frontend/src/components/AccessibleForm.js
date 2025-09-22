import React, { useState, useEffect } from 'react';
import { useAccessibleForm } from '../hooks/useAccessibility';
import './AccessibleForm.css';

const AccessibleForm = ({
  children,
  onSubmit,
  validationRules = {},
  initialValues = {},
  submitButtonText = 'Enviar',
  cancelButtonText = 'Cancelar',
  onCancel,
  className = '',
  ...props
}) => {
  const {
    errors,
    touched,
    getFieldProps,
    getFieldErrorProps,
    handleFieldChange,
    handleFieldBlur,
    isFormValid,
    setErrors
  } = useAccessibleForm();

  const [values, setValues] = useState(initialValues);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitCount, setSubmitCount] = useState(0);

  // Actualizar valores cuando cambien los initialValues
  useEffect(() => {
    setValues(initialValues);
  }, [initialValues]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    // Marcar todos los campos como tocados para mostrar errores
    const allFields = Object.keys(validationRules);
    allFields.forEach(field => handleFieldBlur(field));

    // Verificar si hay errores
    const hasErrors = allFields.some(field => {
      const fieldErrors = validateField(field, values[field], validationRules[field]);
      return fieldErrors.length > 0;
    });

    if (hasErrors) {
      // Enfocar el primer campo con error
      const firstErrorField = allFields.find(field => errors[field]?.length > 0);
      if (firstErrorField) {
        const element = document.getElementById(firstErrorField);
        if (element) {
          element.focus();
        }
      }
      return;
    }

    setIsSubmitting(true);
    setSubmitCount(prev => prev + 1);

    try {
      await onSubmit(values);
      // Resetear formulario en caso de éxito
      setValues(initialValues);
      setErrors({});
    } catch (error) {
      // Manejar errores del servidor
      if (error.errors) {
        setErrors(error.errors);
      } else {
        setErrors({ general: [error.message || 'Error al enviar el formulario'] });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    handleFieldChange(field, value, validationRules[field]);
  };

  const handleBlur = (field) => {
    handleFieldBlur(field);
  };

  const validateField = (name, value, rules = {}) => {
    const fieldErrors = [];

    if (rules.required && (!value || value.toString().trim() === '')) {
      fieldErrors.push(`${rules.label || name} es requerido`);
    }

    if (rules.minLength && value && value.length < rules.minLength) {
      fieldErrors.push(`${rules.label || name} debe tener al menos ${rules.minLength} caracteres`);
    }

    if (rules.maxLength && value && value.length > rules.maxLength) {
      fieldErrors.push(`${rules.label || name} no puede tener más de ${rules.maxLength} caracteres`);
    }

    if (rules.pattern && value && !rules.pattern.test(value)) {
      fieldErrors.push(rules.patternMessage || `${rules.label || name} tiene un formato inválido`);
    }

    if (rules.email && value) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        fieldErrors.push('Correo electrónico inválido');
      }
    }

    if (rules.min && value && parseFloat(value) < rules.min) {
      fieldErrors.push(`${rules.label || name} debe ser mayor o igual a ${rules.min}`);
    }

    if (rules.max && value && parseFloat(value) > rules.max) {
      fieldErrors.push(`${rules.label || name} debe ser menor o igual a ${rules.max}`);
    }

    return fieldErrors;
  };

  const renderField = (fieldName, fieldConfig) => {
    const {
      type = 'text',
      label,
      placeholder,
      required,
      options = [],
      rows = 3,
      helpText,
      ...fieldProps
    } = fieldConfig;

    const fieldErrors = errors[fieldName] || [];
    const hasError = fieldErrors.length > 0 && touched[fieldName];
    const fieldId = fieldName;

    return (
      <div className={`form-field ${hasError ? 'has-error' : ''}`} key={fieldName}>
        <label htmlFor={fieldId} className="form-label">
          {label}
          {required && <span className="required-indicator" aria-label="requerido">*</span>}
        </label>

        {type === 'textarea' ? (
          <textarea
            {...getFieldProps(fieldName, validationRules[fieldName])}
            {...fieldProps}
            id={fieldId}
            placeholder={placeholder}
            rows={rows}
            value={values[fieldName] || ''}
            onChange={(e) => handleChange(fieldName, e.target.value)}
            onBlur={() => handleBlur(fieldName)}
            aria-describedby={hasError ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined}
            aria-invalid={hasError}
          />
        ) : type === 'select' ? (
          <select
            {...getFieldProps(fieldName, validationRules[fieldName])}
            {...fieldProps}
            id={fieldId}
            value={values[fieldName] || ''}
            onChange={(e) => handleChange(fieldName, e.target.value)}
            onBlur={() => handleBlur(fieldName)}
            aria-describedby={hasError ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined}
            aria-invalid={hasError}
          >
            <option value="">{placeholder || 'Seleccionar...'}</option>
            {options.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        ) : type === 'checkbox' ? (
          <div className="checkbox-group">
            <input
              {...getFieldProps(fieldName, validationRules[fieldName])}
              {...fieldProps}
              type="checkbox"
              id={fieldId}
              checked={values[fieldName] || false}
              onChange={(e) => handleChange(fieldName, e.target.checked)}
              onBlur={() => handleBlur(fieldName)}
              aria-describedby={hasError ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined}
              aria-invalid={hasError}
            />
            <label htmlFor={fieldId} className="checkbox-label">
              {label}
            </label>
          </div>
        ) : (
          <input
            {...getFieldProps(fieldName, validationRules[fieldName])}
            {...fieldProps}
            type={type}
            id={fieldId}
            placeholder={placeholder}
            value={values[fieldName] || ''}
            onChange={(e) => handleChange(fieldName, e.target.value)}
            onBlur={() => handleBlur(fieldName)}
            aria-describedby={hasError ? `${fieldId}-error` : helpText ? `${fieldId}-help` : undefined}
            aria-invalid={hasError}
          />
        )}

        {helpText && !hasError && (
          <div id={`${fieldId}-help`} className="form-help">
            {helpText}
          </div>
        )}

        {hasError && (
          <div {...getFieldErrorProps(fieldId)} className="form-errors">
            {fieldErrors.map((error, index) => (
              <div key={index} className="form-error">
                {error}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  const renderChildren = () => {
    return React.Children.map(children, child => {
      if (React.isValidElement(child) && child.type === AccessibleField) {
        const { name, ...fieldConfig } = child.props;
        return renderField(name, fieldConfig);
      }
      return child;
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className={`accessible-form ${className}`}
      noValidate
      aria-labelledby="form-title"
      {...props}
    >
      {errors.general && (
        <div role="alert" className="form-general-error">
          {errors.general.map((error, index) => (
            <div key={index}>{error}</div>
          ))}
        </div>
      )}

      <div className="form-fields">
        {renderChildren()}
      </div>

      <div className="form-actions">
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {cancelButtonText}
          </button>
        )}

        <button
          type="submit"
          className="btn btn-primary"
          disabled={isSubmitting || !isFormValid()}
          aria-describedby="submit-status"
        >
          {isSubmitting ? 'Enviando...' : submitButtonText}
        </button>

        <div id="submit-status" className="sr-only">
          {isSubmitting ? 'Enviando formulario...' : `Formulario ${isFormValid() ? 'válido' : 'con errores'}`}
        </div>
      </div>

      {/* Mensaje de estado para lectores de pantalla */}
      {submitCount > 0 && (
        <div aria-live="polite" className="sr-only">
          {isSubmitting
            ? 'Enviando formulario...'
            : errors.general
              ? 'Error al enviar el formulario. Por favor revise los errores.'
              : 'Formulario enviado exitosamente.'
          }
        </div>
      )}
    </form>
  );
};

// Componente auxiliar para campos del formulario
export const AccessibleField = ({ name, ...props }) => {
  // Este componente es solo para configuración, el renderizado se hace en AccessibleForm
  return null;
};

export default AccessibleForm;