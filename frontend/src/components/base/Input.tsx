import { type InputHTMLAttributes, forwardRef } from 'react';
import './Input.css';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, fullWidth = false, className = '', id, ...rest }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={`input-group ${fullWidth ? 'input-group--full' : ''} ${className}`}>
        {label && (
          <label className="input-group__label" htmlFor={inputId}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={`input-group__input ${error ? 'input-group__input--error' : ''}`}
          {...rest}
        />
        {error && <span className="input-group__error">{error}</span>}
      </div>
    );
  },
);

Input.displayName = 'Input';
