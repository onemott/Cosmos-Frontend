// Auth
export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user_type: string;
}

export interface ClientProfile {
  id: string;
  client_id: string;
  tenant_id: string;
  email: string;
  is_active: boolean;
  client_name: string;
  last_login_at?: string;
  mfa_enabled: boolean;
  created_at: string;
  // Extended from backend joins (if available)
  tenant_name?: string;
  risk_profile?: string;
}

// Portfolio
export interface PortfolioSummary {
  net_worth: string; // Backend sends decimal string
  currency: string;
  total_accounts: number;
  total_holdings: number;
  cash_balance: string;
  invested_value: string;
  performance: {
    '1M': number | null;
    '3M': number | null;
    '6M': number | null;
    'YTD': number | null;
    '1Y': number | null;
  };
  last_updated: string;
  is_estimated?: boolean; // Optional in backend response
}

// Derived allocation data (computed client-side from accounts/holdings)
export interface AllocationData {
  assetClass: { label: string; value: number }[];
  currency: { label: string; value: number }[];
  topHoldings: {
    ticker: string;
    name: string;
    value: number;
    weight: number;
    pnlPercent: number;
  }[];
}

export interface Account {
  id: string;
  account_name: string;
  account_number_masked: string;
  bank_name: string;
  account_type: string;
  currency: string;
  total_value: string;
  cash_balance: string;
  performance_1y?: number | null;
  is_active: boolean;
}

export interface AccountsResponse {
  accounts: Account[];
  total_count: number;
}

// Account Detail includes holdings
export interface AccountDetail extends Account {
  invested_value: string;
  holdings_count: number;
  holdings: Holding[];
  allocation: Record<string, number> | null;
  last_updated: string;
}

export interface Holding {
  id: string;
  account_id: string;
  instrument_name: string;
  instrument_ticker: string;
  instrument_type: string;
  asset_class: string;
  quantity: string;
  current_price: string;
  cost_basis: string;
  market_value: string;
  currency: string;
  unrealized_pnl: string;
  unrealized_pnl_percent: number;
  weight: number;
  as_of_date: string;
}

// Documents
export interface Document {
  id: string;
  name: string;
  document_type: string;
  file_size: number;
  created_at: string;
}

// Tasks
export interface Task {
  id: string;
  title: string;
  description: string;
  task_type: string;
  status: string;
  workflow_state: string;
  priority: string;
  due_date: string | null;
  created_at: string;
  requires_action: boolean;
  proposal_data?: Record<string, unknown>;
}

export interface TaskActionRequest {
  comment: string;
}

// Modules
export interface ClientModule {
  id: string;
  code: string;
  name: string;
  name_zh: string;
  description: string;
  description_zh: string;
  category: string;
  is_enabled: boolean;
  is_tenant_enabled: boolean;
  is_core: boolean;
}

// Products (Allocation Lab)
export interface Product {
  id: string;
  moduleCode: string;
  name: string;
  description: string;
  assetClass: string;
  riskLevel: 'low' | 'medium' | 'high';
  minInvestment: number;
  currency: string;
  expectedReturn: string;
  tags: string[];
}

export interface ProductModule {
  code: string;
  name: string;
  description: string;
  isEnabled: boolean; // Client has access
  products: Product[];
}

export interface CartItem {
  product: Product;
  addedAt: Date;
  notes?: string;
}

export interface OrderSubmission {
  items: { productId: string; notes?: string }[];
  clientNotes: string;
}

// Product Request (Allocation Lab submission)
export interface ProductRequestItem {
  product_id: string;
  product_name: string;
  module_code: string;
  min_investment: number;
  currency: string;
}

export interface ProductRequestCreate {
  products: ProductRequestItem[];
  client_notes?: string;
}

export interface ProductRequestResponse {
  task_id: string;
  message: string;
  products_count: number;
}

