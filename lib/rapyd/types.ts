// Rapyd Types

export interface RapydCheckoutRequest {
  amount: number;
  currency: string;
  country: string;
  merchant_reference_id: string;
  complete_payment_url: string;
  error_payment_url: string;
  cancel_checkout_url?: string;
  complete_checkout_url?: string;
  description?: string;
  language?: string;
  expiration?: number;
  metadata?: Record<string, any>;
  customer?: string;
  payment_method_type_categories?: string[];
  payment_method_types_include?: string[];
  custom_elements?: {
    display_description?: boolean;
    save_card_default?: boolean;
    hide_save_card?: boolean;
    billing_address_collect?: boolean;
    payment_fees_display?: boolean;
  };
}

export interface RapydCheckoutResponse {
  id: string;
  status: 'NEW' | 'DON' | 'EXP';
  language: string;
  page_expiration: number;
  redirect_url: string;
  merchant_color?: string;
  merchant_logo?: string;
  merchant_website?: string;
  cancel_checkout_url?: string;
  complete_checkout_url?: string;
  country: string;
  currency: string;
  amount: number;
  payment: RapydPaymentInCheckout;
  customer?: string;
  timestamp: number;
}

export interface RapydPaymentInCheckout {
  id: string | null;
  amount: number;
  currency_code: string;
  country_code: string;
  status: string | null;
  description: string;
  merchant_reference_id: string;
  customer_token?: string;
  complete_payment_url: string;
  error_payment_url: string;
  paid: boolean;
  paid_at: number;
  failure_code?: string;
  failure_message?: string;
  metadata?: Record<string, any>;
}

export interface RapydPayment {
  id: string;
  amount: number;
  original_amount: number;
  currency_code: string;
  country_code: string;
  status: 'ACT' | 'CAN' | 'CLO' | 'ERR' | 'EXP' | 'NEW' | 'REV';
  description: string;
  merchant_reference_id: string;
  customer_token?: string;
  payment_method: string;
  payment_method_type: string;
  payment_method_type_category: string;
  expiration: number;
  captured: boolean;
  refunded: boolean;
  refunded_amount: number;
  receipt_email?: string;
  redirect_url?: string;
  complete_payment_url: string;
  error_payment_url: string;
  receipt_number?: string;
  flow_type?: string;
  address?: any;
  statement_descriptor?: string;
  transaction_id?: string;
  created_at: number;
  updated_at: number;
  metadata?: Record<string, any>;
  failure_code?: string;
  failure_message?: string;
  paid: boolean;
  paid_at: number;
  dispute?: any;
  refunds?: any;
  order?: any;
  outcome?: any;
  visual_codes?: Record<string, string>;
  textual_codes?: Record<string, string>;
  instructions?: any[];
  ewallet_id?: string;
  ewallets?: any[];
  payment_method_options?: Record<string, any>;
  fx_rate?: number;
  merchant_requested_currency?: string;
  merchant_requested_amount?: number;
  fixed_side?: string;
  payment_fees?: any;
  invoice?: string;
  escrow?: any;
  group_payment?: string;
  cancel_reason?: string;
  initiation_type?: string;
  mid?: string;
  next_action?: string;
}

export interface RapydRefund {
  id: string;
  payment: string;
  amount: number;
  currency: string;
  reason: string;
  status: 'Pending' | 'Completed' | 'Rejected' | 'Error';
  created_at: number;
  updated_at: number;
  merchant_reference_id?: string;
  metadata?: Record<string, any>;
  failure_reason?: string;
}

export interface RapydWebhookEvent {
  id: string;
  type: string;
  data: any;
  trigger_operation_id: string;
  status: string;
  created_at: number;
}

// Webhook event types
export type RapydWebhookType = 
  | 'PAYMENT_COMPLETED'
  | 'PAYMENT_FAILED'
  | 'PAYMENT_EXPIRED'
  | 'PAYMENT_CANCELED'
  | 'PAYMENT_DISPUTE_CREATED'
  | 'REFUND_COMPLETED'
  | 'CHECKOUT_PAGE_CREATED'
  | 'CHECKOUT_COMPLETED'
  | 'CHECKOUT_EXPIRED';

// Payment status mapping
export const RAPYD_PAYMENT_STATUS_MAP: Record<string, string> = {
  'ACT': 'active',
  'CAN': 'canceled',
  'CLO': 'closed',
  'ERR': 'error',
  'EXP': 'expired',
  'NEW': 'new',
  'REV': 'reversed',
};
