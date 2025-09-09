/**
 * Date and time formatting utilities for the application
 * All dates are formatted as dd/mm/yyyy
 * All times are formatted as 12-hour clock with AM/PM
 */

/**
 * Format a date as dd/mm/yyyy
 * @param date - Date object, timestamp, or string date
 * @returns Formatted date string in dd/mm/yyyy format
 */
export function formatDate(date: Date | number | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'number' || typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Format a date and time as dd/mm/yyyy hh:mm AM/PM
 * @param date - Date object, timestamp, or string date
 * @returns Formatted datetime string in dd/mm/yyyy hh:mm AM/PM format
 */
export function formatDateTime(date: Date | number | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'number' || typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format time as hh:mm AM/PM
 * @param date - Date object, timestamp, or string date
 * @returns Formatted time string in hh:mm AM/PM format
 */
export function formatTime(date: Date | number | string | null | undefined): string {
  if (!date) return '';
  
  const dateObj = typeof date === 'number' || typeof date === 'string' ? new Date(date) : date;
  
  // Check if date is valid
  if (isNaN(dateObj.getTime())) return '';
  
  return dateObj.toLocaleString('en-GB', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true
  });
}

/**
 * Format a Firestore timestamp to date string
 * @param timestamp - Firestore timestamp with toDate() method or date object
 * @returns Formatted date string in dd/mm/yyyy format
 */
export function formatFirestoreDate(timestamp: { toDate?: () => Date } | Date | null | undefined): string {
  if (!timestamp) return '';
  
  let date: Date | undefined;
  
  if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return '';
  }
  
  return formatDate(date);
}

/**
 * Format a Firestore timestamp to datetime string
 * @param timestamp - Firestore timestamp with toDate() method or date object
 * @returns Formatted datetime string in dd/mm/yyyy hh:mm AM/PM format
 */
export function formatFirestoreDateTime(timestamp: { toDate?: () => Date } | Date | null | undefined): string {
  if (!timestamp) return '';
  
  let date: Date | undefined;
  
  if (typeof timestamp === 'object' && 'toDate' in timestamp && typeof timestamp.toDate === 'function') {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return '';
  }
  
  return formatDateTime(date);
}

/**
 * Format a date string from API response (could be string or Date object)
 * @param dateString - Date string or Date object
 * @returns Formatted date string in dd/mm/yyyy format
 */
export function formatApiDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  
  return formatDate(dateString);
}

/**
 * Format a datetime string from API response (could be string or Date object)
 * @param dateString - Date string or Date object
 * @returns Formatted datetime string in dd/mm/yyyy hh:mm AM/PM format
 */
export function formatApiDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '';
  
  return formatDateTime(dateString);
}