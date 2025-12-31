// Validated Select Component
// src/components/common/ValidatedSelect.tsx

import React, { useEffect, useState, useRef, useMemo } from "react";
import { ValidationRule } from "../../utils/validation";

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface ValidatedSelectProps {
  id: string;
  label?: string;
  value: string;
  options: SelectOption[];
  validationRules?: ValidationRule[];
  onChange: (value: string, isValid: boolean) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  placeholder?: string;
}

/**
 * Reusable validated select component with built-in validation feedback
 * Enterprise-ready with custom styling, no Bootstrap dependencies
 */
export const ValidatedSelect: React.FC<ValidatedSelectProps> = ({
  id,
  label,
  value,
  options,
  validationRules = [],
  onChange,
  onBlur,
  disabled = false,
  className = "",
  required = false,
  placeholder,
}) => {
  const [errors, setErrors] = useState<string[]>([]);
  const [touched, setTouched] = useState(false);
  const [isValid, setIsValid] = useState(true);

  // Store validation rules in a ref to avoid re-running useEffect on every render
  // when validationRules prop is a new array reference
  const validationRulesRef = useRef(validationRules);

  // Update ref when rules actually change (based on rule count and messages)
  useMemo(() => {
    validationRulesRef.current = validationRules;
  }, [validationRules.length, validationRules.map((r) => r.message).join(",")]);

  // Validate selection on change - only update internal state, don't call onChange
  useEffect(() => {
    const rules = validationRulesRef.current;
    const newErrors: string[] = [];

    for (const rule of rules) {
      const isValid = rule.validator(value);
      if (!isValid) {
        newErrors.push(rule.message);
      }
    }

    setErrors(newErrors);
    const valid = newErrors.length === 0;
    setIsValid(valid);
    // Don't call onChange here to avoid loops
  }, [value, id]);

  const handleBlur = () => {
    setTouched(true);
    onBlur?.();
  };

  const showErrors = touched && errors.length > 0;
  const selectClassName = `validated-select ${
    showErrors
      ? "validated-select--error"
      : isValid && touched
        ? "validated-select--success"
        : ""
  } ${disabled ? "validated-select--disabled" : ""} ${className}`.trim();

  return (
    <div className="validated-select-container">
      {label && (
        <label htmlFor={id} className="validated-select-label">
          {label}
          {required && <span style={{color: '#d13438', marginLeft: '2px', fontWeight: 'bold'}}>*</span>}
        </label>
      )}

      <div className="validated-select-wrapper">
        <select
          id={id}
          value={value}
          onChange={(e) => {
            const newValue = e.target.value;
            // Calculate validity for the new value
            const newErrors: string[] = [];
            for (const rule of validationRules) {
              if (!rule.validator(newValue)) {
                newErrors.push(rule.message);
              }
            }
            const newIsValid = newErrors.length === 0;
            onChange(newValue, newIsValid);
          }}
          onBlur={handleBlur}
          disabled={disabled}
          className={selectClassName}
          aria-describedby={showErrors ? `${id}-errors` : undefined}
          aria-invalid={showErrors}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {(options || []).map((option) => (
            <option
              key={option.value}
              value={option.value}
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
      </div>

      {showErrors && (
        <div id={`${id}-errors`} className="validated-select-errors">
          <ul className="validated-select-error-list">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default React.memo(ValidatedSelect);
