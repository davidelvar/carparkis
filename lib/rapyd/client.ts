import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';

// Rapyd API Configuration
const RAPYD_SANDBOX_URL = 'https://sandboxapi.rapyd.net';
const RAPYD_PRODUCTION_URL = 'https://api.rapyd.net';
const RAPYD_ACCESS_KEY = process.env.RAPYD_ACCESS_KEY || '';
const RAPYD_SECRET_KEY = process.env.RAPYD_SECRET_KEY || '';

// Get the current Rapyd API URL based on settings
async function getRapydBaseUrl(): Promise<string> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'paymentTestMode' },
    });
    // If testMode is true (or not set), use sandbox
    const isTestMode = setting?.value !== false && setting?.value !== 'false';
    return isTestMode ? RAPYD_SANDBOX_URL : RAPYD_PRODUCTION_URL;
  } catch {
    // Default to sandbox if we can't read settings
    return RAPYD_SANDBOX_URL;
  }
}

// Synchronous version for checking configuration (uses env as fallback)
export function getRapydBaseUrlSync(): string {
  return process.env.RAPYD_API_URL || RAPYD_SANDBOX_URL;
}

// Generate random salt
function generateSalt(length: number = 12): string {
  return crypto.randomBytes(length).toString('hex').slice(0, length);
}

// Generate signature for Rapyd API request
function generateSignature(
  httpMethod: string,
  urlPath: string,
  salt: string,
  timestamp: number,
  body: string = ''
): string {
  const toSign = httpMethod.toLowerCase() + urlPath + salt + timestamp.toString() + RAPYD_ACCESS_KEY + RAPYD_SECRET_KEY + body;
  
  const hash = crypto
    .createHmac('sha256', RAPYD_SECRET_KEY)
    .update(toSign)
    .digest('hex');
  
  return Buffer.from(hash).toString('base64');
}

// Make authenticated request to Rapyd API
async function rapydRequest<T>(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  path: string,
  body?: object
): Promise<T> {
  const baseUrl = await getRapydBaseUrl();
  const salt = generateSalt();
  const timestamp = Math.floor(Date.now() / 1000);
  const bodyString = body ? JSON.stringify(body) : '';
  
  const signature = generateSignature(method, path, salt, timestamp, bodyString);
  
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'access_key': RAPYD_ACCESS_KEY,
    'salt': salt,
    'timestamp': timestamp.toString(),
    'signature': signature,
  };

  const response = await fetch(`${baseUrl}${path}`, {
    method,
    headers,
    body: bodyString || undefined,
  });

  const data = await response.json();
  
  if (data.status?.error_code) {
    throw new Error(data.status.message || 'Rapyd API error');
  }
  
  return data.data as T;
}

// Types
export interface RapydCheckoutResponse {
  id: string;
  status: string;
  redirect_url: string;
  page_expiration: number;
  payment: {
    id: string | null;
    amount: number;
    currency_code: string;
    status: string | null;
  };
}

export interface RapydPaymentResponse {
  id: string;
  amount: number;
  currency_code: string;
  status: string;
  paid: boolean;
  paid_at: number;
  failure_code: string | null;
  failure_message: string | null;
  merchant_reference_id: string;
  metadata: Record<string, any>;
}

export interface CreateCheckoutOptions {
  amount: number;
  currency: string;
  country: string;
  merchantReferenceId: string;
  description?: string;
  completePaymentUrl: string;
  errorPaymentUrl: string;
  cancelCheckoutUrl?: string;
  completeCheckoutUrl?: string;
  language?: string;
  metadata?: Record<string, any>;
  customerEmail?: string;
  customerName?: string;
  expirationMinutes?: number;
}

// Create a hosted checkout page
export async function createCheckout(options: CreateCheckoutOptions): Promise<RapydCheckoutResponse> {
  const expirationTime = options.expirationMinutes 
    ? Math.floor(Date.now() / 1000) + (options.expirationMinutes * 60)
    : Math.floor(Date.now() / 1000) + (24 * 60 * 60); // Default 24 hours

  const body: Record<string, any> = {
    amount: options.amount,
    currency: options.currency,
    country: options.country,
    merchant_reference_id: options.merchantReferenceId,
    complete_payment_url: options.completePaymentUrl,
    error_payment_url: options.errorPaymentUrl,
    language: options.language || 'en',
    expiration: expirationTime,
    metadata: {
      ...options.metadata,
      booking_reference: options.merchantReferenceId,
    },
  };

  if (options.description) {
    body.description = options.description;
    body.custom_elements = {
      display_description: true,
    };
  }

  if (options.cancelCheckoutUrl) {
    body.cancel_checkout_url = options.cancelCheckoutUrl;
  }

  if (options.completeCheckoutUrl) {
    body.complete_checkout_url = options.completeCheckoutUrl;
  }

  // For Iceland, we'll primarily use card payments
  body.payment_method_type_categories = ['card'];

  return rapydRequest<RapydCheckoutResponse>('POST', '/v1/checkout', body);
}

// Retrieve payment details
export async function getPayment(paymentId: string): Promise<RapydPaymentResponse> {
  return rapydRequest<RapydPaymentResponse>('GET', `/v1/payments/${paymentId}`);
}

// Retrieve checkout page details
export async function getCheckout(checkoutId: string): Promise<RapydCheckoutResponse> {
  return rapydRequest<RapydCheckoutResponse>('GET', `/v1/checkout/${checkoutId}`);
}

// Refund a payment
export async function refundPayment(
  paymentId: string, 
  amount?: number,
  reason?: string
): Promise<any> {
  const body: Record<string, any> = {
    payment: paymentId,
  };

  if (amount !== undefined) {
    body.amount = amount;
  }

  if (reason) {
    body.reason = reason;
  }

  return rapydRequest<any>('POST', '/v1/refunds', body);
}

// Verify webhook signature
export function verifyWebhookSignature(
  httpMethod: string,
  urlPath: string,
  salt: string,
  timestamp: string,
  body: string,
  signature: string
): boolean {
  const expectedSignature = generateSignature(
    httpMethod,
    urlPath,
    salt,
    parseInt(timestamp),
    body
  );
  
  return signature === expectedSignature;
}

// Check if Rapyd is configured
export function isRapydConfigured(): boolean {
  return !!(RAPYD_ACCESS_KEY && RAPYD_SECRET_KEY);
}
