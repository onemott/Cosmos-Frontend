/**
 * Mock product data for Allocation Lab MVP.
 * 
 * Module codes match the actual backend modules from seed_modules.py.
 * Products are stubs for now - will be replaced with real API data
 * once the backend /client/modules/{code}/products endpoint is built.
 * 
 * Current module enablement for Platform Operator tenant:
 * - ENABLED: custom_portfolio, eam_products, insurance_services, 
 *            cd_solutions, alternative_investments, macro_analysis, ai_recommendations
 * - LOCKED: private_banking, quant_investing, expert_advice, risk_assessment
 * 
 * TODO: Replace with API call to /client/modules once endpoint is available.
 */

import type { ProductModule } from '../types/api';

export const MOCK_PRODUCT_MODULES: ProductModule[] = [
  // ============================================================================
  // ENABLED MODULES (for Platform Operator tenant)
  // ============================================================================
  
  {
    code: 'custom_portfolio',
    name: 'Custom Investment Portfolio',
    description: 'Customized investment portfolio recommendations tailored to individual client needs',
    isEnabled: true,
    products: [
      {
        id: 'cp-001',
        moduleCode: 'custom_portfolio',
        name: 'Growth Portfolio Strategy',
        description: 'Aggressive growth-focused portfolio designed for long-term capital appreciation.',
        assetClass: 'Multi-Asset',
        riskLevel: 'high',
        minInvestment: 50000,
        currency: 'USD',
        expectedReturn: '10-15% p.a.',
        tags: ['Growth', 'Long-term', 'Diversified'],
      },
      {
        id: 'cp-002',
        moduleCode: 'custom_portfolio',
        name: 'Balanced Portfolio Strategy',
        description: 'Balanced approach combining growth and income with moderate risk.',
        assetClass: 'Multi-Asset',
        riskLevel: 'medium',
        minInvestment: 25000,
        currency: 'USD',
        expectedReturn: '6-9% p.a.',
        tags: ['Balanced', 'Diversified', 'Stable'],
      },
      {
        id: 'cp-003',
        moduleCode: 'custom_portfolio',
        name: 'Income Portfolio Strategy',
        description: 'Conservative income-focused portfolio for regular distributions.',
        assetClass: 'Multi-Asset',
        riskLevel: 'low',
        minInvestment: 25000,
        currency: 'USD',
        expectedReturn: '4-6% p.a.',
        tags: ['Income', 'Conservative', 'Dividends'],
      },
    ],
  },
  
  {
    code: 'eam_products',
    name: 'EAM Investment Products',
    description: 'External Asset Manager specific investment products and solutions',
    isEnabled: true,
    products: [
      {
        id: 'eam-001',
        moduleCode: 'eam_products',
        name: 'EAM Global Equity Fund',
        description: 'Diversified global equity exposure managed by our investment team.',
        assetClass: 'Equity',
        riskLevel: 'high',
        minInvestment: 10000,
        currency: 'USD',
        expectedReturn: '8-12% p.a.',
        tags: ['Global', 'Equity', 'Active'],
      },
      {
        id: 'eam-002',
        moduleCode: 'eam_products',
        name: 'EAM Fixed Income Plus',
        description: 'Enhanced yield bond portfolio with active duration management.',
        assetClass: 'Fixed Income',
        riskLevel: 'medium',
        minInvestment: 15000,
        currency: 'USD',
        expectedReturn: '5-7% p.a.',
        tags: ['Bonds', 'Income', 'Active'],
      },
      {
        id: 'eam-003',
        moduleCode: 'eam_products',
        name: 'EAM Asia Pacific Fund',
        description: 'Focused exposure to Asian markets including China, Japan, and emerging APAC.',
        assetClass: 'Equity',
        riskLevel: 'high',
        minInvestment: 10000,
        currency: 'USD',
        expectedReturn: '10-16% p.a.',
        tags: ['Asia', 'Emerging', 'Growth'],
      },
    ],
  },
  
  {
    code: 'insurance_services',
    name: 'Insurance Services',
    description: 'Life insurance, wealth protection, and insurance-linked investment solutions',
    isEnabled: true,
    products: [
      {
        id: 'ins-001',
        moduleCode: 'insurance_services',
        name: 'Whole Life Protection Plan',
        description: 'Comprehensive life insurance with cash value accumulation.',
        assetClass: 'Insurance',
        riskLevel: 'low',
        minInvestment: 5000,
        currency: 'USD',
        expectedReturn: '3-4% p.a.',
        tags: ['Protection', 'Life', 'Cash Value'],
      },
      {
        id: 'ins-002',
        moduleCode: 'insurance_services',
        name: 'Investment-Linked Policy',
        description: 'Flexible insurance policy linked to investment fund performance.',
        assetClass: 'Insurance',
        riskLevel: 'medium',
        minInvestment: 10000,
        currency: 'USD',
        expectedReturn: '5-8% p.a.',
        tags: ['ILP', 'Flexible', 'Investment'],
      },
    ],
  },
  
  {
    code: 'cd_solutions',
    name: 'CD Solutions',
    description: 'Certificate of Deposit products with competitive rates and flexible terms',
    isEnabled: true,
    products: [
      {
        id: 'cd-001',
        moduleCode: 'cd_solutions',
        name: '12-Month Fixed Deposit',
        description: 'Guaranteed returns with 12-month lock-in period.',
        assetClass: 'Cash',
        riskLevel: 'low',
        minInvestment: 10000,
        currency: 'USD',
        expectedReturn: '4.5% p.a.',
        tags: ['Fixed', 'Guaranteed', '12M'],
      },
      {
        id: 'cd-002',
        moduleCode: 'cd_solutions',
        name: '24-Month Premium CD',
        description: 'Higher yield certificate with 24-month term.',
        assetClass: 'Cash',
        riskLevel: 'low',
        minInvestment: 25000,
        currency: 'USD',
        expectedReturn: '5.0% p.a.',
        tags: ['Fixed', 'Premium', '24M'],
      },
      {
        id: 'cd-003',
        moduleCode: 'cd_solutions',
        name: 'Callable CD',
        description: 'Higher rate CD with issuer call option.',
        assetClass: 'Cash',
        riskLevel: 'low',
        minInvestment: 50000,
        currency: 'USD',
        expectedReturn: '5.5% p.a.',
        tags: ['Callable', 'High-yield', 'Structured'],
      },
    ],
  },
  
  {
    code: 'alternative_investments',
    name: 'Alternative Investments',
    description: 'Access to alternative investment opportunities including PE, hedge funds, and real assets',
    isEnabled: true,
    products: [
      {
        id: 'alt-001',
        moduleCode: 'alternative_investments',
        name: 'Private Equity Fund III',
        description: 'Direct investments in growth-stage private companies.',
        assetClass: 'Private Equity',
        riskLevel: 'high',
        minInvestment: 100000,
        currency: 'USD',
        expectedReturn: '15-20% p.a.',
        tags: ['PE', 'Illiquid', 'Long-term'],
      },
      {
        id: 'alt-002',
        moduleCode: 'alternative_investments',
        name: 'Real Estate Income Trust',
        description: 'Commercial real estate portfolio generating rental income.',
        assetClass: 'Real Estate',
        riskLevel: 'medium',
        minInvestment: 50000,
        currency: 'USD',
        expectedReturn: '7-10% p.a.',
        tags: ['Real Estate', 'Income', 'Diversified'],
      },
      {
        id: 'alt-003',
        moduleCode: 'alternative_investments',
        name: 'Hedge Fund Access',
        description: 'Multi-strategy hedge fund with absolute return focus.',
        assetClass: 'Hedge Fund',
        riskLevel: 'high',
        minInvestment: 100000,
        currency: 'USD',
        expectedReturn: '8-12% p.a.',
        tags: ['Hedge', 'Absolute Return', 'Sophisticated'],
      },
    ],
  },
  
  {
    code: 'macro_analysis',
    name: 'Macro Analysis',
    description: 'Macroeconomic analysis, market trends, and global economic outlook reports',
    isEnabled: true,
    products: [
      {
        id: 'macro-001',
        moduleCode: 'macro_analysis',
        name: 'Global Macro Strategy',
        description: 'Investment strategy based on macroeconomic trends and events.',
        assetClass: 'Multi-Asset',
        riskLevel: 'high',
        minInvestment: 25000,
        currency: 'USD',
        expectedReturn: '8-15% p.a.',
        tags: ['Macro', 'Global', 'Tactical'],
      },
      {
        id: 'macro-002',
        moduleCode: 'macro_analysis',
        name: 'Inflation Protection Portfolio',
        description: 'Portfolio designed to hedge against inflation.',
        assetClass: 'Multi-Asset',
        riskLevel: 'medium',
        minInvestment: 15000,
        currency: 'USD',
        expectedReturn: '5-8% p.a.',
        tags: ['Inflation', 'Hedge', 'TIPS'],
      },
    ],
  },
  
  {
    code: 'ai_recommendations',
    name: 'AI Recommendations',
    description: 'AI-powered investment recommendations and portfolio optimization suggestions',
    isEnabled: true,
    products: [
      {
        id: 'ai-001',
        moduleCode: 'ai_recommendations',
        name: 'AI-Optimized Growth',
        description: 'Machine learning optimized portfolio for maximum risk-adjusted returns.',
        assetClass: 'Multi-Asset',
        riskLevel: 'high',
        minInvestment: 20000,
        currency: 'USD',
        expectedReturn: '10-14% p.a.',
        tags: ['AI', 'Optimized', 'Quant'],
      },
      {
        id: 'ai-002',
        moduleCode: 'ai_recommendations',
        name: 'AI Factor Strategy',
        description: 'Factor-based investing powered by machine learning models.',
        assetClass: 'Equity',
        riskLevel: 'medium',
        minInvestment: 15000,
        currency: 'USD',
        expectedReturn: '7-11% p.a.',
        tags: ['AI', 'Factors', 'Smart Beta'],
      },
    ],
  },
  
  // ============================================================================
  // LOCKED MODULES (not enabled for tenant - shown as locked in UI)
  // ============================================================================
  
  {
    code: 'private_banking',
    name: 'Private Banking Products',
    description: 'Exclusive private banking products and services for high-net-worth clients',
    isEnabled: false,
    products: [
      {
        id: 'pb-001',
        moduleCode: 'private_banking',
        name: 'Ultra HNW Portfolio',
        description: 'Bespoke portfolio for ultra-high-net-worth individuals.',
        assetClass: 'Multi-Asset',
        riskLevel: 'medium',
        minInvestment: 1000000,
        currency: 'USD',
        expectedReturn: '8-12% p.a.',
        tags: ['UHNW', 'Bespoke', 'Exclusive'],
      },
    ],
  },
  
  {
    code: 'quant_investing',
    name: 'Quantitative Investing',
    description: 'Quantitative investment strategies powered by algorithmic trading and data analysis',
    isEnabled: false,
    products: [
      {
        id: 'quant-001',
        moduleCode: 'quant_investing',
        name: 'Systematic Alpha Fund',
        description: 'Algorithmic trading strategy seeking absolute returns.',
        assetClass: 'Multi-Asset',
        riskLevel: 'high',
        minInvestment: 50000,
        currency: 'USD',
        expectedReturn: '10-18% p.a.',
        tags: ['Quant', 'Systematic', 'Alpha'],
      },
    ],
  },
  
  {
    code: 'expert_advice',
    name: 'Industry Expert Advice',
    description: 'Expert insights and recommendations from industry specialists',
    isEnabled: false,
    products: [
      {
        id: 'exp-001',
        moduleCode: 'expert_advice',
        name: 'Expert-Curated Portfolio',
        description: 'Portfolio curated by industry experts with deep sector knowledge.',
        assetClass: 'Equity',
        riskLevel: 'medium',
        minInvestment: 25000,
        currency: 'USD',
        expectedReturn: '7-12% p.a.',
        tags: ['Expert', 'Curated', 'Sector'],
      },
    ],
  },
  
  {
    code: 'risk_assessment',
    name: 'Asset Risk Assessment',
    description: 'Comprehensive asset risk assessment, stress testing, and risk monitoring tools',
    isEnabled: false,
    products: [
      {
        id: 'risk-001',
        moduleCode: 'risk_assessment',
        name: 'Risk-Managed Portfolio',
        description: 'Portfolio with active risk management and drawdown protection.',
        assetClass: 'Multi-Asset',
        riskLevel: 'low',
        minInvestment: 20000,
        currency: 'USD',
        expectedReturn: '5-8% p.a.',
        tags: ['Risk-Managed', 'Protection', 'Defensive'],
      },
    ],
  },
];
