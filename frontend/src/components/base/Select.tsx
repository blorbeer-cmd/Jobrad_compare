import { type SelectHTMLAttributes, forwardRef } from 'react';
import './Select.css';

interface SelectOption {
  value: string;
  label: string;
}

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  placeholder?: string;
  fullWidth?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, placeholder, fullWidth = false, className = '', id, ...rest }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className={`select-group ${fullWidth ? 'select-group--full' : ''} ${className}`}>
        {label && (
          <label className="select-group__label" htmlFor={selectId}>
            {label}
          </label>
        )}
        <div className="select-group__wrapper">
          <select
            ref={ref}
            id={selectId}
            className="select-group__select"
            {...rest}
          >
            {placeholder && (
              <option value="" disabled>
                {placeholder}
              </option>
            )}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="select-group__chevron" aria-hidden="true">
            &#9662;
          </span>
        </div>
      </div>
    );
  },
);

Select.displayName = 'Select';
