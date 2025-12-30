// Input Validation System
// src/utils/validation.ts

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface ValidationRule {
  name: string;
  validator: (_value: any) => boolean;
  message: string;
}

export interface ValidationSchema {
  [key: string]: ValidationRule[];
}

/**
 * Common validation rules
 */
export const validationRules = {
  required: (message = "This field is required"): ValidationRule => ({
    name: "required",
    validator: (_value) =>
      _value !== null && _value !== undefined && _value !== "",
    message,
  }),

  minLength: (min: number, message?: string): ValidationRule => ({
    name: "minLength",
    validator: (value) => typeof value === "string" && value.length >= min,
    message: message || `Must be at least ${min} characters long`,
  }),

  maxLength: (max: number, message?: string): ValidationRule => ({
    name: "maxLength",
    validator: (value) => typeof value === "string" && value.length <= max,
    message: message || `Must be no more than ${max} characters long`,
  }),

  email: (message = "Please enter a valid email address"): ValidationRule => ({
    name: "email",
    validator: (value) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return typeof value === "string" && emailRegex.test(value);
    },
    message,
  }),

  numeric: (message = "Please enter a valid number"): ValidationRule => ({
    name: "numeric",
    validator: (value) => {
      const num = Number(value);
      return !isNaN(num) && isFinite(num);
    },
    message,
  }),

  min: (min: number, message?: string): ValidationRule => ({
    name: "min",
    validator: (value) => {
      const num = Number(value);
      return !isNaN(num) && num >= min;
    },
    message: message || `Must be at least ${min}`,
  }),

  max: (max: number, message?: string): ValidationRule => ({
    name: "max",
    validator: (value) => {
      const num = Number(value);
      return !isNaN(num) && num <= max;
    },
    message: message || `Must be no more than ${max}`,
  }),

  pattern: (regex: RegExp, message = "Invalid format"): ValidationRule => ({
    name: "pattern",
    validator: (value) => typeof value === "string" && regex.test(value),
    message,
  }),

  alphanumeric: (
    message = "Only letters and numbers are allowed",
  ): ValidationRule => ({
    name: "alphanumeric",
    validator: (value) =>
      typeof value === "string" && /^[a-zA-Z0-9]+$/.test(value),
    message,
  }),

  noSpecialChars: (
    message = "Special characters are not allowed",
  ): ValidationRule => ({
    name: "noSpecialChars",
    validator: (value) =>
      typeof value === "string" && /^[a-zA-Z0-9\s\-_.]+$/.test(value),
    message,
  }),

  safeString: (
    message = "Input contains potentially unsafe characters",
  ): ValidationRule => ({
    name: "safeString",
    validator: (value) => {
      if (typeof value !== "string") return false;
      // Check for common XSS patterns
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /on\w+\s*=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
        /expression\s*\(/i,
        /vbscript:/i,
        /data:text\/html/i,
      ];
      return !dangerousPatterns.some((pattern) => pattern.test(value));
    },
    message,
  }),

  date: (message = "Please enter a valid date"): ValidationRule => ({
    name: "date",
    validator: (value) => {
      if (!value) return true; // Allow empty values
      const date = new Date(value);
      return !isNaN(date.getTime());
    },
    message,
  }),

  futureDate: (message = "Date must be in the future"): ValidationRule => ({
    name: "futureDate",
    validator: (value) => {
      if (!value) return true; // Allow empty values
      const date = new Date(value);
      const now = new Date();
      return !isNaN(date.getTime()) && date > now;
    },
    message,
  }),

  pastDate: (message = "Date must be in the past"): ValidationRule => ({
    name: "pastDate",
    validator: (value) => {
      if (!value) return true; // Allow empty values
      const date = new Date(value);
      const now = new Date();
      return !isNaN(date.getTime()) && date < now;
    },
    message,
  }),
};

/**
 * Validate a single value against a set of rules
 */
export const validateValue = (
  value: any,
  rules: ValidationRule[],
): ValidationResult => {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.validator(value)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate an object against a validation schema
 */
export const validateObject = (
  data: Record<string, any>,
  schema: ValidationSchema,
): ValidationResult => {
  const allErrors: string[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const result = validateValue(data[field], rules);
    if (!result.isValid) {
      allErrors.push(...result.errors.map((error) => `${field}: ${error}`));
    }
  }

  return {
    isValid: allErrors.length === 0,
    errors: allErrors,
  };
};

/**
 * Create a custom validation rule
 */
export const createRule = (
  name: string,
  validator: (value: any) => boolean,
  message: string,
): ValidationRule => ({
  name,
  validator,
  message,
});

/**
 * Common validation patterns
 */
export const patterns = {
  phone: /^\+?[\d\s\-\(\)]+$/,
  zipCode: /^\d{5}(-\d{4})?$/,
  url: /^https?:\/\/.+/,
  ipAddress:
    /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/,
};
