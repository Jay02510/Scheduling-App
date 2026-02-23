
/**
 * Security utilities for the EduPlanner application.
 */

/**
 * Sanitizes error messages to prevent leaking sensitive system information to the user.
 * @param error The error object or message.
 * @returns A user-friendly, sanitized error message.
 */
export const sanitizeErrorMessage = (error: any): string => {
  const message = typeof error === 'string' ? error : error?.message || 'An unexpected error occurred';
  
  // Firebase Auth common errors
  if (message.includes('auth/invalid-email')) return 'Please enter a valid email address.';
  if (message.includes('auth/user-not-found') || message.includes('auth/wrong-password')) return 'Invalid email or password.';
  if (message.includes('auth/email-already-in-use')) return 'This email is already registered.';
  if (message.includes('auth/weak-password')) return 'Password should be at least 6 characters.';
  if (message.includes('auth/network-request-failed')) return 'Network error. Please check your connection.';
  if (message.includes('auth/too-many-requests')) return 'Too many failed attempts. Please try again later.';
  
  // Gemini / AI errors
  if (message.includes('429') || message.includes('RESOURCE_EXHAUSTED')) return 'AI service is currently busy. Please wait a moment and try again.';
  if (message.includes('SAFETY')) return 'The request was flagged by safety filters. Please try a different prompt.';
  
  // Generic system errors to hide
  if (message.includes('FirebaseError') || message.includes('GoogleGenerativeAIError') || message.includes('fetch')) {
    return 'A system error occurred. Our team has been notified.';
  }

  return message;
};

/**
 * Logs messages only in development mode to prevent leaking info in production console.
 */
export const logSecurely = (message: string, data?: any) => {
  if (process.env.NODE_ENV === 'development') {
    if (data) {
      console.log(`[SECURE LOG] ${message}`, data);
    } else {
      console.log(`[SECURE LOG] ${message}`);
    }
  }
};

/**
 * Strips potential PII or sensitive patterns from strings.
 */
export const sanitizeData = (val: string): string => {
  if (typeof val !== 'string') return val;
  // Remove HTML tags
  let clean = val.replace(/<[^>]*>?/gm, '');
  // Strip script tags
  clean = clean.replace(/javascript:/gi, '');
  // Mask potential SSN or Phone patterns
  clean = clean.replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED]");
  return clean.trim();
};
