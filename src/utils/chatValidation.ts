/**
 * Validates chat message content to prevent sharing of phone numbers
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

export interface ValidationResult {
  isValid: boolean;
  message?: string;
  sanitized?: string;
}

/**
 * Check if a message contains a phone number
 */
export const containsPhoneNumber = (text: string): boolean => {
  return PHONE_PATTERNS.some(pattern => pattern.test(text));
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
      message: 'Les numéros de téléphone ne sont pas autorisés dans le chat. Utilisez la messagerie sécurisée de la plateforme.',
    };
  }

  return {
    isValid: true,
  };
};

/**
 * Sanitize message by removing phone numbers
 */
export const sanitizeMessage = (content: string): string => {
  let sanitized = content;
  PHONE_PATTERNS.forEach(pattern => {
    sanitized = sanitized.replace(pattern, '[numéro masqué]');
  });
  return sanitized;
};
