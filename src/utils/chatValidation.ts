/**
 * Validates chat message content to prevent sharing of phone numbers and emails
 */

// Regex patterns to detect phone numbers
const PHONE_PATTERNS = [
  // International format: +225, +33, etc.
  /\+\d{1,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}[\s.-]?\d{2,4}/g,
  // Ivorian phone numbers: 0x xx xx xx xx or xx xx xx xx
  /\b0[1-9][\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}[\s.-]?\d{2}\b/g,
  // Generic phone numbers: 8+ consecutive digits
  /\b\d{8,14}\b/g,
  // Numbers with dashes or spaces: xx-xx-xx-xx-xx
  /\b\d{2}[\s.-]\d{2}[\s.-]\d{2}[\s.-]\d{2}[\s.-]\d{2}\b/g,
  // Compact format without spaces
  /\b\d{10}\b/g,
];

// Regex pattern to detect email addresses
const EMAIL_PATTERN = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/gi;

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  sanitized?: string;
}

/**
 * Check if a message contains a phone number
 */
export const containsPhoneNumber = (text: string): boolean => {
  return PHONE_PATTERNS.some(pattern => {
    pattern.lastIndex = 0; // Reset regex state
    return pattern.test(text);
  });
};

/**
 * Check if a message contains an email address
 */
export const containsEmail = (text: string): boolean => {
  EMAIL_PATTERN.lastIndex = 0; // Reset regex state
  return EMAIL_PATTERN.test(text);
};

/**
 * Check if a message contains any contact information (phone or email)
 */
export const containsContactInfo = (text: string): boolean => {
  return containsPhoneNumber(text) || containsEmail(text);
};

/**
 * Validate a chat message
 */
export const validateChatMessage = (content: string): ValidationResult => {
  if (!content || content.trim().length === 0) {
    return {
      isValid: false,
      message: 'Le message ne peut pas être vide',
    };
  }

  if (content.length > 2000) {
    return {
      isValid: false,
      message: 'Le message est trop long (max 2000 caractères)',
    };
  }

  // Check for phone numbers
  if (containsPhoneNumber(content)) {
    return {
      isValid: false,
      message: 'Il est interdit de partager les contacts et les mails. Utilisez la messagerie sécurisée de la plateforme.',
    };
  }

  // Check for email addresses
  if (containsEmail(content)) {
    return {
      isValid: false,
      message: 'Il est interdit de partager les contacts et les mails. Utilisez la messagerie sécurisée de la plateforme.',
    };
  }

  return {
    isValid: true,
  };
};

/**
 * Sanitize message by removing phone numbers and emails
 */
export const sanitizeMessage = (content: string): string => {
  let sanitized = content;
  PHONE_PATTERNS.forEach(pattern => {
    pattern.lastIndex = 0;
    sanitized = sanitized.replace(pattern, '[numéro masqué]');
  });
  EMAIL_PATTERN.lastIndex = 0;
  sanitized = sanitized.replace(EMAIL_PATTERN, '[email masqué]');
  return sanitized;
};
