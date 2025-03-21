import { format, isValid, parseISO } from 'date-fns';

// Date format constants
export const DATE_FORMAT = {
  DEFAULT: 'MMM d, yyyy',
  SHORT: 'MM/dd/yyyy',
  LONG: 'MMMM d, yyyy',
  WITH_TIME: 'MMM d, yyyy h:mm a',
};

/**
 * Checks if a date string or object is valid
 */
export const isValidDate = (date: string | Date | null | undefined): boolean => {
  if (!date) return false;
  
  if (typeof date === 'string') {
    // Try to parse ISO string
    return isValid(parseISO(date));
  }
  
  return isValid(date);
};

/**
 * Formats a date consistently using the specified format
 */
export const formatDate = (
  date: Date | string | null | undefined,
  formatStr = DATE_FORMAT.DEFAULT
): string => {
  if (!date) return 'No date';
  
  try {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    
    if (!isValid(dateObj)) {
      return 'Invalid date';
    }
    
    return format(dateObj, formatStr);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid date';
  }
};

/**
 * Formats a date range for events
 */
export const formatEventDate = (
  startDate: Date | string | null | undefined,
  endDate: Date | string | null | undefined,
  isRange = false
): string => {
  if (!startDate) return 'No date';
  
  const formattedStart = formatDate(startDate);
  
  if (!isRange || !endDate) {
    return formattedStart;
  }
  
  const formattedEnd = formatDate(endDate);
  return `${formattedStart} - ${formattedEnd}`;
};

/**
 * Sorts events by date
 */
export const sortEventsByDate = (events: any[], ascending = true): any[] => {
  return [...events].sort((a, b) => {
    const dateA = a.date?.start ? new Date(a.date.start).getTime() : 0;
    const dateB = b.date?.start ? new Date(b.date.start).getTime() : 0;
    return ascending ? dateA - dateB : dateB - dateA;
  });
};