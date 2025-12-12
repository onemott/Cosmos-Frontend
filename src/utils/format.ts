import { format } from 'date-fns';

export const formatCurrency = (amount: number | string, currency: string = 'USD'): string => {
  // Normalize currency code to uppercase to prevent Intl.NumberFormat errors
  const normalizedCurrency = currency?.toUpperCase() || 'USD';
  // Parse string amounts from backend (Decimal fields come as strings)
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  if (isNaN(numericAmount)) {
    return `${normalizedCurrency} 0.00`;
  }
  
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalizedCurrency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(numericAmount);
  } catch {
    // Fallback for invalid currency codes
    return `${normalizedCurrency} ${numericAmount.toFixed(2)}`;
  }
};

export const formatPercentage = (value: number | null): string => {
  if (value === null) return 'N/A';
  const sign = value >= 0 ? '+' : '';
  return `${sign}${value.toFixed(2)}%`;
};

export const formatDate = (dateString: string): string => {
  return format(new Date(dateString), 'MMM dd, yyyy');
};

export const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const maskAccountNumber = (accountNumber: string): string => {
  if (accountNumber.length <= 4) return accountNumber;
  return `****${accountNumber.slice(-4)}`;
};

