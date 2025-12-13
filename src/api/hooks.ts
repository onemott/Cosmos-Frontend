import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, tokenStorage } from './client';
import type {
  LoginRequest,
  LoginResponse,
  ClientProfile,
  PortfolioSummary,
  Account,
  AccountDetail,
  AllocationData,
  Document,
  Task,
  ClientModule,
  ProductRequestCreate,
  ProductRequestResponse,
} from '../types/api';

// Auth - Client endpoints
export const useLogin = () => {
  return useMutation({
    mutationFn: async (credentials: LoginRequest) => {
      const response = await apiClient.post<LoginResponse>('/client/auth/login', credentials);
      return response.data;
    },
  });
};

export const useLogout = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      try {
        await apiClient.post('/client/auth/logout');
      } catch {
        // Ignore logout API errors, still clear local tokens
      }
      await tokenStorage.clearTokens();
    },
    onSuccess: () => {
      queryClient.clear();
    },
  });
};

export const useClientProfile = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['clientProfile'],
    queryFn: async () => {
      const response = await apiClient.get<ClientProfile>('/client/auth/me');
      return response.data;
    },
    enabled,
  });
};

// Portfolio
export const usePortfolioSummary = () => {
  return useQuery({
    queryKey: ['portfolioSummary'],
    queryFn: async () => {
      const response = await apiClient.get<PortfolioSummary>('/client/portfolio/summary');
      return response.data;
    },
  });
};

export const useAccounts = () => {
  return useQuery({
    queryKey: ['accounts'],
    queryFn: async () => {
      const response = await apiClient.get<{ accounts: Account[]; total_count: number }>('/client/accounts');
      return response.data.accounts; // Extract accounts array from response
    },
  });
};

export const useAccountDetail = (accountId: string) => {
  return useQuery({
    queryKey: ['account', accountId],
    queryFn: async () => {
      const response = await apiClient.get<AccountDetail>(`/client/accounts/${accountId}`);
      return response.data;
    },
    enabled: !!accountId,
  });
};

/**
 * MVP: Hardcoded FX rates to normalize multi-currency portfolios to USD.
 * TODO: Replace with real-time FX rates from backend API in Phase 2.
 */
const FX_TO_USD: Record<string, number> = {
  USD: 1.0,
  CHF: 1.12,  // ~1 CHF = 1.12 USD
  EUR: 1.08,  // ~1 EUR = 1.08 USD
  GBP: 1.27,  // ~1 GBP = 1.27 USD
  JPY: 0.0067, // ~1 JPY = 0.0067 USD
  HKD: 0.128,  // ~1 HKD = 0.128 USD
  SGD: 0.74,   // ~1 SGD = 0.74 USD
};

const toUSD = (amount: number, currency: string): number => {
  const rate = FX_TO_USD[currency] || 1.0;
  return amount * rate;
};

/**
 * Portfolio Allocation - aggregated from all account details.
 * 
 * TODO (Phase 2): This is a frontend shim that makes N+1 API calls.
 * Replace with a dedicated `/client/portfolio/allocation` backend endpoint
 * that returns pre-aggregated data with proper FX conversion.
 */
export const usePortfolioAllocation = () => {
  const { data: accountsList } = useAccounts();
  
  return useQuery({
    queryKey: ['portfolioAllocation', accountsList?.map(a => a.id)],
    queryFn: async (): Promise<AllocationData> => {
      if (!accountsList || accountsList.length === 0) {
        return { assetClass: [], currency: [], topHoldings: [] };
      }
      
      // Fetch all account details in parallel
      // TODO: Replace with single backend endpoint to avoid N+1 calls
      const accountDetails = await Promise.all(
        accountsList.map(acc => 
          apiClient.get<AccountDetail>(`/client/accounts/${acc.id}`).then(r => r.data)
        )
      );
      
      // Aggregate asset class allocation (normalized to USD for accurate comparison)
      const assetClassMap: Record<string, number> = {};
      const currencyMap: Record<string, number> = {}; // Keep original currency values for display
      const allHoldings: Array<{
        ticker: string;
        name: string;
        value: number; // in USD for sorting
        originalValue: number;
        originalCurrency: string;
        weight: number;
        pnlPercent: number;
      }> = [];
      
      accountDetails.forEach(account => {
        const accValue = parseFloat(account.total_value);
        const accValueUSD = toUSD(accValue, account.currency);
        
        // Currency breakdown: keep original values for display
        currencyMap[account.currency] = (currencyMap[account.currency] || 0) + accValue;
        
        // Add cash as asset class (normalized to USD)
        const cashBalance = parseFloat(account.cash_balance);
        if (cashBalance > 0) {
          assetClassMap['Cash'] = (assetClassMap['Cash'] || 0) + toUSD(cashBalance, account.currency);
        }
        
        // Aggregate holdings (normalize to USD for asset class aggregation)
        account.holdings?.forEach(holding => {
          const marketValue = parseFloat(holding.market_value);
          const marketValueUSD = toUSD(marketValue, holding.currency);
          const assetClass = holding.asset_class || 'Other';
          
          assetClassMap[assetClass] = (assetClassMap[assetClass] || 0) + marketValueUSD;
          
          allHoldings.push({
            ticker: holding.instrument_ticker,
            name: holding.instrument_name,
            value: marketValueUSD, // For sorting
            originalValue: marketValue,
            originalCurrency: holding.currency,
            weight: holding.weight,
            pnlPercent: holding.unrealized_pnl_percent,
          });
        });
      });
      
      // Convert to arrays and sort by USD value
      const assetClass = Object.entries(assetClassMap)
        .map(([label, value]) => ({ label, value }))
        .sort((a, b) => b.value - a.value);
      
      // Currency breakdown: convert to USD for accurate percentage display
      const currencyInUSD = Object.entries(currencyMap)
        .map(([label, value]) => ({ 
          label, 
          value: toUSD(value, label), // Normalize for percentage calculation
          originalValue: value 
        }))
        .sort((a, b) => b.value - a.value);
      
      const currency = currencyInUSD.map(c => ({ label: c.label, value: c.value }));
      
      // Top 5 holdings by USD value
      const topHoldings = allHoldings
        .sort((a, b) => b.value - a.value)
        .slice(0, 5)
        .map(h => ({
          ticker: h.ticker,
          name: h.name,
          value: h.value, // USD value for display
          weight: h.weight,
          pnlPercent: h.pnlPercent,
        }));
      
      return { assetClass, currency, topHoldings };
    },
    enabled: !!accountsList && accountsList.length > 0,
  });
};

// Documents
export const useDocuments = (documentType?: string) => {
  return useQuery({
    queryKey: ['documents', documentType],
    queryFn: async () => {
      const params = documentType ? { document_type: documentType } : {};
      const response = await apiClient.get<Document[]>('/client/documents', { params });
      return response.data;
    },
  });
};

// Tasks
export const useTasks = (status?: string) => {
  return useQuery({
    queryKey: ['tasks', status],
    queryFn: async () => {
      const params = status ? { status } : {};
      const response = await apiClient.get<Task[]>('/client/tasks', { params });
      return response.data;
    },
  });
};

export const useTaskDetail = (taskId: string) => {
  return useQuery({
    queryKey: ['task', taskId],
    queryFn: async () => {
      const response = await apiClient.get<Task>(`/client/tasks/${taskId}`);
      return response.data;
    },
    enabled: !!taskId,
  });
};

export const useApproveTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, comment }: { taskId: string; comment: string }) => {
      const response = await apiClient.post(`/client/tasks/${taskId}/approve`, { comment });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

export const useDeclineTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ taskId, comment }: { taskId: string; comment: string }) => {
      const response = await apiClient.post(`/client/tasks/${taskId}/decline`, { comment });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

// Modules
export const useClientModules = () => {
  return useQuery({
    queryKey: ['clientModules'],
    queryFn: async () => {
      const response = await apiClient.get<ClientModule[]>('/client/modules');
      return response.data;
    },
  });
};

export const useRequestModuleAccess = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ moduleCode, message }: { moduleCode: string; message?: string }) => {
      const response = await apiClient.post('/modules/requests', {
        module_code: moduleCode,
        message: message || '',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientModules'] });
    },
  });
};

// Product Request (Allocation Lab)
export const useSubmitProductRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (request: ProductRequestCreate) => {
      const response = await apiClient.post<ProductRequestResponse>(
        '/client/tasks/product-request',
        request
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate tasks so they refresh with the new request
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });
};

