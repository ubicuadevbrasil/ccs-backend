import moment from 'moment';

/**
 * Format date to DD/MM/YYYY format
 * 
 * @param dateValue - Date value (Date object, string, or any date-compatible value)
 * @returns Formatted date string in DD/MM/YYYY format
 * 
 * @example
 * formatDateToDDMMYYYY(new Date(2025, 9, 10)) // Returns: "10/10/2025"
 * formatDateToDDMMYYYY("2025-10-10") // Returns: "10/10/2025"
 * formatDateToDDMMYYYY("2025-10-10T00:00:00.000Z") // Returns: "10/10/2025"
 */
export function formatDateToDDMMYYYY(dateValue: any): string {
  if (!dateValue) {
    return '';
  }
  
  const momentDate = moment(dateValue);
  
  if (!momentDate.isValid()) {
    return '';
  }
  
  return momentDate.format('DD/MM/YYYY');
}

/**
 * Format date to YYYY-MM-DD format
 * 
 * @param dateValue - Date value (Date object, string, or any date-compatible value)
 * @returns Formatted date string in YYYY-MM-DD format
 * 
 * @example
 * formatDateToYYYYMMDD(new Date(2025, 9, 10)) // Returns: "2025-10-10"
 */
export function formatDateToYYYYMMDD(dateValue: any): string {
  if (!dateValue) {
    return '';
  }
  
  const momentDate = moment(dateValue);
  
  if (!momentDate.isValid()) {
    return '';
  }
  
  return momentDate.format('YYYY-MM-DD');
}

/**
 * Get month name in Portuguese from date
 * 
 * @param dateValue - Date value (Date object, string, or any date-compatible value)
 * @returns Month name in Portuguese
 * 
 * @example
 * getMonthNamePortuguese(new Date(2025, 0, 10)) // Returns: "Janeiro"
 * getMonthNamePortuguese(new Date(2025, 9, 10)) // Returns: "Outubro"
 */
export function getMonthNamePortuguese(dateValue: any): string {
  if (!dateValue) {
    return 'Unknown';
  }
  
  const momentDate = moment(dateValue);
  
  if (!momentDate.isValid()) {
    return 'Unknown';
  }
  
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  return monthNames[momentDate.month()] || 'Unknown';
}

/**
 * Get month name in Portuguese from month number (1-12)
 * 
 * @param monthNumber - Month number (1-12, where 1 = January)
 * @returns Month name in Portuguese
 * 
 * @example
 * getMonthNameFromNumber(1) // Returns: "Janeiro"
 * getMonthNameFromNumber(10) // Returns: "Outubro"
 */
export function getMonthNameFromNumber(monthNumber: number): string {
  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];
  
  // Ensure month number is within valid range (1-12)
  const monthIndex = Math.max(0, Math.min(11, monthNumber - 1));
  
  return monthNames[monthIndex] || 'Unknown';
}

