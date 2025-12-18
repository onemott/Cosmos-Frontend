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
  ProductModule,
  Product,
  ProductDocument,
  ClientProductModuleApiResponse,
  ClientProductApiResponse,
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

export const useChangePassword = () => {
  return useMutation({
    mutationFn: async (data: { current_password: string; new_password: string }) => {
      const response = await apiClient.post<{ message: string; success: boolean }>(
        '/client/auth/change-password',
        data
      );
      return response.data;
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
interface DocumentListResponse {
  documents: Document[];
  total_count: number;
}

export const useDocuments = (documentType?: string) => {
  return useQuery({
    queryKey: ['documents', documentType],
    queryFn: async () => {
      const params = documentType ? { document_type: documentType } : {};
      const response = await apiClient.get<DocumentListResponse>('/client/documents', { params });
      return response.data.documents; // Extract documents array from response
    },
  });
};

// Document Download Info
export interface DocumentDownloadInfo {
  document_id: string;
  file_name: string;
  mime_type: string;
  file_size: number;
  download_url: string | null;
  expires_at: string | null;
}

export const useDocumentDownloadInfo = (documentId: string) => {
  return useQuery({
    queryKey: ['documentDownload', documentId],
    queryFn: async (): Promise<DocumentDownloadInfo> => {
      const response = await apiClient.get<DocumentDownloadInfo>(
        `/client/documents/${documentId}/download-info`
      );
      return response.data;
    },
    enabled: !!documentId,
    staleTime: 10 * 60 * 1000, // 10 minutes (less than presigned URL expiry)
  });
};

/**
 * Get the document download URL with auth header.
 * For local storage, this returns the API endpoint URL.
 * For S3 storage, the backend redirects to presigned URL.
 */
export const getDocumentDownloadUrl = (documentId: string): string => {
  return `${apiClient.defaults.baseURL}/client/documents/${documentId}/download`;
};

/**
 * Get the current access token for authenticated downloads.
 */
export const getAccessToken = async (): Promise<string | null> => {
  return tokenStorage.getAccessToken();
};

// Product Documents
export const useProductDocuments = (productId: string) => {
  return useQuery({
    queryKey: ['productDocuments', productId],
    queryFn: async (): Promise<ProductDocument[]> => {
      const response = await apiClient.get<ProductDocument[]>(
        `/client/products/${productId}/documents`
      );
      return response.data;
    },
    enabled: !!productId,
  });
};

/**
 * Get the product document download URL.
 */
export const getProductDocumentDownloadUrl = (productId: string, documentId: string): string => {
  return `${apiClient.defaults.baseURL}/client/products/${productId}/documents/${documentId}/download`;
};

// Tasks
export const useTasks = (status?: string, isArchived?: boolean) => {
  return useQuery({
    queryKey: ['tasks', status, isArchived],
    queryFn: async () => {
      const params: any = {};
      if (status) params.status = status;
      if (isArchived !== undefined) params.is_archived = isArchived;
      
      const response = await apiClient.get<Task[]>('/client/tasks', { params });
      return response.data;
    },
    // Auto-refresh every 30 seconds to catch EAM updates
    refetchInterval: 30000,
    // Consider data stale after 10 seconds
    staleTime: 10000,
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
    // Auto-refresh every 30 seconds
    refetchInterval: 30000,
    staleTime: 10000,
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

export const useArchiveTask = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (taskId: string) => {
      const response = await apiClient.post(`/client/tasks/${taskId}/archive`);
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

// ============================================================================
// Products (Allocation Lab)
// ============================================================================

/**
 * Map backend risk_level to frontend riskLevel
 */
const mapRiskLevel = (riskLevel: string): 'low' | 'medium' | 'high' => {
  switch (riskLevel.toLowerCase()) {
    case 'conservative':
      return 'low';
    case 'moderate':
    case 'balanced':
      return 'medium';
    case 'growth':
    case 'aggressive':
      return 'high';
    default:
      return 'medium';
  }
};

/**
 * Transform API product response to frontend Product type
 */
const transformProduct = (apiProduct: ClientProductApiResponse, moduleCode: string): Product => ({
  id: apiProduct.id,
  moduleCode,
  name: apiProduct.name,
  nameZh: apiProduct.name_zh,
  description: apiProduct.description || '',
  descriptionZh: apiProduct.description_zh,
  assetClass: apiProduct.category,
  riskLevel: mapRiskLevel(apiProduct.risk_level),
  minInvestment: apiProduct.min_investment,
  currency: apiProduct.currency,
  expectedReturn: apiProduct.expected_return || '',
  tags: apiProduct.tags || [],
});

/**
 * Transform API module response to frontend ProductModule type
 */
const transformProductModule = (apiModule: ClientProductModuleApiResponse): ProductModule => ({
  code: apiModule.code,
  name: apiModule.name,
  nameZh: apiModule.name_zh,
  description: apiModule.description || '',
  descriptionZh: apiModule.description_zh,
  isEnabled: apiModule.is_enabled,
  products: apiModule.products.map(p => transformProduct(p, apiModule.code)),
});

/**
 * Fetch all products grouped by module for the current client.
 * Returns products from enabled modules only.
 */
export const useClientProducts = () => {
  return useQuery({
    queryKey: ['clientProducts'],
    queryFn: async (): Promise<ProductModule[]> => {
      const response = await apiClient.get<ClientProductModuleApiResponse[]>('/client/products');
      return response.data.map(transformProductModule);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

/**
 * Fetch products for a specific module.
 */
export const useModuleProducts = (moduleCode: string) => {
  return useQuery({
    queryKey: ['moduleProducts', moduleCode],
    queryFn: async (): Promise<Product[]> => {
      const response = await apiClient.get<ClientProductApiResponse[]>(`/client/products/${moduleCode}`);
      return response.data.map(p => transformProduct(p, moduleCode));
    },
    enabled: !!moduleCode,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

// ============================================================================
// Invitation / Registration (Public endpoints - no auth required)
// ============================================================================

import type {
  InvitationValidateResponse,
  ClientRegistrationRequest,
  ClientRegistrationResponse,
} from '../types/api';

/**
 * Validate an invitation code before showing registration form.
 */
export const useValidateInvitation = (code: string) => {
  return useQuery({
    queryKey: ['invitation', 'validate', code],
    queryFn: async (): Promise<InvitationValidateResponse> => {
      const response = await apiClient.get<InvitationValidateResponse>(
        `/invitations/public/${code}/validate`
      );
      return response.data;
    },
    enabled: !!code && code.length >= 9, // Only fetch if code looks complete
    retry: false, // Don't retry on invalid codes
  });
};

/**
 * Register a new client using an invitation code.
 */
export const useRegisterWithInvitation = () => {
  return useMutation({
    mutationFn: async ({
      code,
      data,
    }: {
      code: string;
      data: ClientRegistrationRequest;
    }): Promise<ClientRegistrationResponse> => {
      const response = await apiClient.post<ClientRegistrationResponse>(
        `/invitations/public/${code}/register`,
        data
      );
      return response.data;
    },
  });
};

