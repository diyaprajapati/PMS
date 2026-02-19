import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { z } from "zod"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Zod schema for parsing dates in DD-MM-YYYY format or ISO format
 */
const dateSchema = z.preprocess(
  (val) => {
    if (!val) return undefined;
    if (val instanceof Date) return val;
    
    const dateStr = String(val).trim();
    if (!dateStr) return undefined;

    // Try parsing DD-MM-YYYY format (e.g., "20-02-2026")
    const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }

    // Try standard Date parsing (ISO format, etc.)
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;

    return undefined;
  },
  z.date().optional()
);

/**
 * Parses a date value from string (DD-MM-YYYY or ISO format) or Date object
 * @param dateValue - The date value to parse (string, Date, or undefined)
 * @returns Parsed Date object or undefined if invalid/empty
 */
export function parseDate(dateValue: string | Date | undefined): Date | undefined {
  const result = dateSchema.safeParse(dateValue);
  return result.success ? result.data : undefined;
}

/**
 * Zod schema for validating date strings (DD-MM-YYYY or ISO format)
 * Returns a Date object or throws an error if invalid
 */
export const dateStringSchema = z.preprocess(
  (val) => {
    if (!val) return undefined;
    if (val instanceof Date) return val;
    
    const dateStr = String(val).trim();
    if (!dateStr) return undefined;

    // Try parsing DD-MM-YYYY format (e.g., "20-02-2026")
    const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/);
    if (ddmmyyyyMatch) {
      const [, day, month, year] = ddmmyyyyMatch;
      const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
      if (!isNaN(date.getTime())) return date;
    }

    // Try standard Date parsing (ISO format, etc.)
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) return date;

    return undefined;
  },
  z.date()
);

/**
 * Validates and parses a date string with error handling
 * @param dateValue - The date value to validate
 * @returns Object with success status and parsed date or error message
 */
export function validateDate(dateValue: string | Date | undefined): {
  success: boolean;
  data?: Date;
  error?: string;
} {
  const result = dateStringSchema.safeParse(dateValue);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return {
    success: false,
    error: "Invalid date format. Use DD-MM-YYYY or ISO format",
  };
}
