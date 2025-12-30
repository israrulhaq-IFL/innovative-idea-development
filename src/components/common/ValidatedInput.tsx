// Validated Input Component
// src/components/common/ValidatedInput.tsx

import React, { useEffect, useState, useRef, useMemo } from "react";
import { ValidationRule } from "../../utils/validation";

interface ValidatedInputProps {
  id: string;
  label?: string;
  type?: string;
  value: string;
  placeholder?: string;
  validationRules?: ValidationRule[];
  onChange: (value: string, isValid: boolean) => void;
  onBlur?: () => void;
  disabled?: boolean;
  className?: string;
  required?: boolean;
  autoComplete?: string;
  maxLength?: number;
  rows?: number;
  readOnly?: boolean;
}

/**
 * Reusable validated input component with built-in validation feedback
 */
export const ValidatedInput: React.FC<ValidatedInputProps> = ({
  id,
  label,
  type = "text",
  value,
  placeholder,
  validationRules = [],
  onChange,
  onBlur,
  disabled = false,
  className = "",
  required = false,
  autoComplete,
  maxLength,
  rows,
  readOnly = false,
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

  // Validate input on change - only update internal state, don't call onChange
  useEffect(() => {
    const rules = validationRulesRef.current;
    const newErrors: string[] = [];

    for (const rule of rules) {
      if (!rule.validator(value)) {
        newErrors.push(rule.message);
      }
    }

    setErrors(newErrors);
    const valid = newErrors.length === 0;
    setIsValid(valid);
    // Don't call onChange here to avoid loops - only call on user input
  }, [value]);

  const handleBlur = () => {
    setTouched(true);
    onBlur?.();
  };

  const showErrors = touched && errors.length > 0;
  const inputClassName = `form-control ${
    showErrors ? "is-invalid" : isValid && touched ? "is-valid" : ""
  } ${className}`.trim();

  return (
    <div className="mb-3">
      {label && (
        <label htmlFor={id} className="form-label">
          {label}
          {required && <span className="text-danger ms-1">*</span>}
        </label>
      )}

      {type === "textarea" ? (
        <textarea
          id={id}
          value={value}
          placeholder={placeholder}
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
          readOnly={readOnly}
          className={inputClassName}
          autoComplete={autoComplete}
          maxLength={maxLength}
          rows={rows || 3}
          aria-describedby={showErrors ? `${id}-errors` : undefined}
          aria-invalid={showErrors}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          placeholder={placeholder}
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
          readOnly={readOnly}
          className={inputClassName}
          autoComplete={autoComplete}
          maxLength={maxLength}
          aria-describedby={showErrors ? `${id}-errors` : undefined}
          aria-invalid={showErrors}
        />
      )}

      {showErrors && (
        <div id={`${id}-errors`} className="invalid-feedback d-block">
          <ul className="mb-0">
            {errors.map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      )}

      {maxLength && (
        <div className="form-text">
          {value.length}/{maxLength} characters
        </div>
      )}
    </div>
  );
};
