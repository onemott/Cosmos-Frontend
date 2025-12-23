/**
 * Internationalization utilities for the client app.
 * Provides translation functions and localized date formatting.
 */

import { useCallback } from 'react';
import { useLanguage, Language } from '../contexts/LanguageContext';
import en from './translations/en.json';
import zhCN from './translations/zh-CN.json';

// Type-safe translations
type TranslationKeys = typeof en;

const translations: Record<Language, TranslationKeys> = {
  en,
  'zh-CN': zhCN as TranslationKeys,
};

/**
 * Get nested value from object using dot notation
 * e.g., getNestedValue(obj, "sidebar.dashboard") returns obj.sidebar.dashboard
 */
function getNestedValue(obj: unknown, path: string): string {
  const keys = path.split('.');
  let current: unknown = obj;

  for (const key of keys) {
    if (current && typeof current === 'object' && key in current) {
      current = (current as Record<string, unknown>)[key];
    } else {
      return path; // Return the key itself if not found
    }
  }

  return typeof current === 'string' ? current : path;
}

/**
 * Hook to get translation function
 */
export function useTranslation() {
  const { language } = useLanguage();

  /**
   * Translate a key to the current language
   * @param key - Dot-notation key (e.g., "home.totalNetWorth")
   * @param params - Optional parameters for interpolation
   */
  function t(key: string, params?: Record<string, string | number>): string {
    const translation = getNestedValue(translations[language], key);

    if (params) {
      return Object.entries(params).reduce(
        (acc, [paramKey, value]) =>
          acc.replace(new RegExp(`{{${paramKey}}}`, 'g'), String(value)),
        translation
      );
    }

    return translation;
  }

  return { t, language };
}

/**
 * Get localized field from an object that has both English and Chinese versions
 * e.g., getLocalizedField(module, "name", "zh-CN") returns module.name_zh || module.name
 */
export function getLocalizedField(
  obj: Record<string, unknown> | null | undefined,
  fieldName: string,
  language: Language
): string {
  if (!obj) return '';

  const record = obj as Record<string, unknown>;

  if (language === 'zh-CN') {
    const zhField = `${fieldName}_zh`;
    const zhValue = record[zhField];
    if (zhValue && typeof zhValue === 'string') {
      return zhValue;
    }
  }

  const value = record[fieldName];
  return typeof value === 'string' ? value : '';
}

/**
 * Hook to get localized field helper bound to current language
 */
export function useLocalizedField() {
  const { language } = useLanguage();

  return useCallback(
    (obj: Record<string, unknown> | null | undefined, fieldName: string): string => {
      return getLocalizedField(obj, fieldName, language);
    },
    [language]
  );
}

/**
 * Format dates according to the current language
 */
export function useLocalizedDate() {
  const { language } = useLanguage();

  return {
    /**
     * Format date as short format (e.g., "Dec 23, 2024" or "2024年12月23日")
     */
    formatDate: (dateString: string | Date) => {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (language === 'zh-CN') {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        return `${year}年${month}月${day}日`;
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    },

    /**
     * Format date with time (e.g., "Dec 23, 10:30 AM" or "12月23日 10:30")
     */
    formatDateTime: (dateString: string | Date) => {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (language === 'zh-CN') {
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${month}月${day}日 ${hours}:${minutes}`;
      }
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    },

    /**
     * Format month and year (e.g., "Dec 2024" or "2024年12月")
     */
    formatMonthYear: (dateString: string | Date) => {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (language === 'zh-CN') {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        return `${year}年${month}月`;
      }
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      });
    },

    /**
     * Format full date with time (e.g., "Dec 23, 2024 at 10:30 AM" or "2024年12月23日 10:30")
     */
    formatFullDateTime: (dateString: string | Date) => {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      if (language === 'zh-CN') {
        const year = date.getFullYear();
        const month = date.getMonth() + 1;
        const day = date.getDate();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${year}年${month}月${day}日 ${hours}:${minutes}`;
      }
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    },

    /**
     * Format relative time (e.g., "2 days ago" or "2天前")
     */
    formatRelativeTime: (dateString: string | Date) => {
      const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      const diffMinutes = Math.floor(diffMs / (1000 * 60));

      if (language === 'zh-CN') {
        if (diffMinutes < 1) return '刚刚';
        if (diffMinutes < 60) return `${diffMinutes}分钟前`;
        if (diffHours < 24) return `${diffHours}小时前`;
        if (diffDays < 30) return `${diffDays}天前`;
        return `${Math.floor(diffDays / 30)}个月前`;
      }

      if (diffMinutes < 1) return 'just now';
      if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
      if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
      if (diffDays < 30) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) > 1 ? 's' : ''} ago`;
    },
  };
}

