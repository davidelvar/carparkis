import crypto from 'crypto';
import { prisma } from '@/lib/db/prisma';
import {
  NetgiroConfirmationType,
  NetgiroPaymentStatus,
  type NetgiroCheckoutRequest,
  type NetgiroRedirectResponse,
  type NetgiroInsertCartRequest,
  type NetgiroInsertCartResponse,
  type NetgiroCheckCartResponse,
  type NetgiroConfirmCartResponse,
  type NetgiroCallbackData,
} from './types';

// Netgiro API Configuration
const NETGIRO_SANDBOX_URL = 'https://securepay.test.netgiro.is';
const NETGIRO_PRODUCTION_URL = 'https://securepay.netgiro.is/v1';
const NETGIRO_API_SANDBOX_URL = 'https://api.test.netgiro.is/v1';
const NETGIRO_API_PRODUCTION_URL = 'https://api.netgiro.is/v1';
const NETGIRO_REFUND_SANDBOX_URL = 'https://partner-api.test.netgiro.is';
const NETGIRO_REFUND_PRODUCTION_URL = 'https://api.netgiro.is/partner';

const NETGIRO_APPLICATION_ID = process.env.NETGIRO_APPLICATION_ID || '';
const NETGIRO_SECRET_KEY = process.env.NETGIRO_SECRET_KEY || '';

// Get the current Netgiro URL based on settings
async function getNetgiroUrls(): Promise<{
  checkoutUrl: string;
  apiUrl: string;
  refundUrl: string;
  isTestMode: boolean;
}> {
  try {
    const setting = await prisma.setting.findUnique({
      where: { key: 'paymentTestMode' },
    });
    const isTestMode = setting?.value !== false && setting?.value !== 'false';
    return {
      checkoutUrl: isTestMode ? NETGIRO_SANDBOX_URL : NETGIRO_PRODUCTION_URL,
      apiUrl: isTestMode ? NETGIRO_API_SANDBOX_URL : NETGIRO_API_PRODUCTION_URL,
      refundUrl: isTestMode ? NETGIRO_REFUND_SANDBOX_URL : NETGIRO_REFUND_PRODUCTION_URL,
      isTestMode,
    };
  } catch {
    return {
      checkoutUrl: NETGIRO_SANDBOX_URL,
      apiUrl: NETGIRO_API_SANDBOX_URL,
      refundUrl: NETGIRO_REFUND_SANDBOX_URL,
      isTestMode: true,
    };
  }
}

/**
 * Generate SHA256 signature for Netgiro requests
 * Netgiro uses simple concatenation: SHA256(SecretKey + ReferenceNumber + TotalAmount + ApplicationId)
 */
export function generateCheckoutSignature(
  referenceNumber: string,
  totalAmount: number,
  applicationId: string = NETGIRO_APPLICATION_ID
): string {
  const signString = NETGIRO_SECRET_KEY + referenceNumber + totalAmount.toString() + applicationId;
  console.log('[Netgiro] Generating signature with:', {
    secretKeyLength: NETGIRO_SECRET_KEY.length,
    referenceNumber,
    totalAmount,
    applicationId,
    signString: signString.substring(0, 20) + '...',
  });
  return crypto.createHash('sha256').update(signString, 'utf8').digest('hex');
}

/**
 * Generate SHA256 signature for response verification
 * SHA256(SecretKey + ReferenceNumber + TransactionId + InvoiceNumber + TotalAmount + Status)
 */
export function generateResponseSignature(
  referenceNumber: string,
  transactionId: string,
  invoiceNumber: number,
  totalAmount: number,
  status: NetgiroPaymentStatus
): string {
  const signString = 
    NETGIRO_SECRET_KEY + 
    referenceNumber + 
    transactionId + 
    invoiceNumber.toString() + 
    totalAmount.toString() + 
    status.toString();
  return crypto.createHash('sha256').update(signString, 'utf8').digest('hex');
}

/**
 * Verify Netgiro response signature
 */
export function verifyResponseSignature(response: NetgiroRedirectResponse | NetgiroCallbackData): boolean {
  const expectedSignature = generateResponseSignature(
    response.ReferenceNumber,
    response.TransactionId,
    response.InvoiceNumber,
    response.TotalAmount,
    response.Status
  );
  return response.NetgiroSignature.toLowerCase() === expectedSignature.toLowerCase();
}

/**
 * Create Netgiro checkout form data for redirect/iframe
 * This creates the parameters needed to submit to Netgiro's secure payment page
 */
export interface CreateCheckoutOptions {
  amount: number;
  referenceNumber: string;
  description?: string;
  successUrl: string;
  cancelUrl: string;
  confirmUrl?: string;
  confirmationType?: NetgiroConfirmationType;
  customerId?: string;
  useIframe?: boolean;
  message?: string;
  items?: Array<{
    name: string;
    unitPrice: number;
    quantity: number;
    productNo?: string;
  }>;
}

export interface NetgiroCheckoutResult {
  checkoutUrl: string;
  formData: Record<string, string>;
  method: 'POST';
}

/**
 * Generate checkout form data for Netgiro payment
 * The customer should be redirected to checkoutUrl with the formData as POST parameters
 */
export async function createCheckout(options: CreateCheckoutOptions): Promise<NetgiroCheckoutResult> {
  const urls = await getNetgiroUrls();
  
  const signature = generateCheckoutSignature(
    options.referenceNumber,
    options.amount
  );

  const formData: Record<string, string> = {
    ApplicationID: NETGIRO_APPLICATION_ID,
    Signature: signature,
    ReferenceNumber: options.referenceNumber,
    TotalAmount: options.amount.toString(),
    PaymentSuccessfulURL: options.successUrl,
    PaymentCancelledURL: options.cancelUrl,
    ConfirmationType: (options.confirmationType ?? NetgiroConfirmationType.Automatic).toString(),
  };

  console.log('[Netgiro] Checkout request:', {
    checkoutUrl: urls.checkoutUrl,
    applicationId: NETGIRO_APPLICATION_ID,
    referenceNumber: options.referenceNumber,
    totalAmount: options.amount,
    signature: signature.substring(0, 20) + '...',
    isTestMode: urls.isTestMode,
  });

  if (options.confirmUrl) {
    formData.PaymentConfirmedURL = options.confirmUrl;
  }

  if (options.description) {
    formData.Description = options.description;
  }

  if (options.customerId) {
    formData.CustomerId = options.customerId;
  }

  if (options.message) {
    formData.Message = options.message;
  }

  if (options.useIframe) {
    formData.Iframe = 'true';
  }

  // Add cart items if provided
  if (options.items && options.items.length > 0) {
    options.items.forEach((item, index) => {
      formData[`Items[${index}].Name`] = item.name;
      formData[`Items[${index}].UnitPrice`] = item.unitPrice.toString();
      formData[`Items[${index}].Amount`] = (item.quantity * 1000).toString(); // Convert to 1/1000 units
      if (item.productNo) {
        formData[`Items[${index}].ProductNo`] = item.productNo;
      }
    });
  }

  return {
    checkoutUrl: urls.checkoutUrl,
    formData,
    method: 'POST',
  };
}

/**
 * Make authenticated API request to Netgiro
 * Used for API checkout flow (InsertCart, CheckCart, ConfirmCart, CancelCart)
 */
async function netgiroApiRequest<T>(
  endpoint: string,
  body: Record<string, any>,
  useRefundApi: boolean = false
): Promise<T> {
  const urls = await getNetgiroUrls();
  const baseUrl = useRefundApi ? urls.refundUrl : urls.apiUrl;

  // Add authentication headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'Netgiro-AppKey': NETGIRO_APPLICATION_ID,
    'Netgiro-Signature': generateApiSignature(body),
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  });

  const data = await response.json();
  return data as T;
}

/**
 * Generate signature for API requests
 */
function generateApiSignature(body: Record<string, any>): string {
  // For API requests, the signature is calculated differently
  // Typically: SHA256(SecretKey + JSON body or specific fields)
  const signString = NETGIRO_SECRET_KEY + JSON.stringify(body);
  return crypto.createHash('sha256').update(signString, 'utf8').digest('hex');
}

/**
 * API Checkout - Insert a new cart (for mobile/API checkout flow)
 */
export async function insertCart(options: {
  amount: number;
  reference: string;
  customerId: string;
  confirmationType?: NetgiroConfirmationType;
  callbackUrl?: string;
  callbackCancelUrl?: string;
  description?: string;
  items?: Array<{
    name: string;
    unitPrice: number;
    quantity: number;
    productNo?: string;
  }>;
}): Promise<NetgiroInsertCartResponse> {
  const body: NetgiroInsertCartRequest = {
    Amount: options.amount,
    Reference: options.reference,
    CustomerId: options.customerId,
    ConfirmationType: options.confirmationType ?? NetgiroConfirmationType.ServerCallback,
    CallbackUrl: options.callbackUrl,
    CallbackCancelUrl: options.callbackCancelUrl,
    Description: options.description,
    CartItemRequests: options.items?.map(item => ({
      Name: item.name,
      UnitPrice: item.unitPrice,
      Amount: item.quantity * 1000,
      ProductNo: item.productNo,
    })),
  };

  return netgiroApiRequest<NetgiroInsertCartResponse>('/Checkout/InsertCart', body);
}

/**
 * API Checkout - Check cart status
 */
export async function checkCart(transactionId: string): Promise<NetgiroCheckCartResponse> {
  return netgiroApiRequest<NetgiroCheckCartResponse>('/Checkout/CheckCart', {
    TransactionId: transactionId,
  });
}

/**
 * API Checkout - Confirm cart (manual confirmation)
 */
export async function confirmCart(transactionId: string): Promise<NetgiroConfirmCartResponse> {
  return netgiroApiRequest<NetgiroConfirmCartResponse>('/Checkout/ConfirmCart', {
    TransactionId: transactionId,
  });
}

/**
 * API Checkout - Cancel cart
 */
export async function cancelCart(transactionId: string): Promise<{ Success: boolean; ResultCode: number }> {
  return netgiroApiRequest('/Checkout/CancelCart', {
    TransactionId: transactionId,
  });
}

/**
 * Request a refund for a payment
 */
export async function refundPayment(
  invoiceNumber: string,
  amount?: number,
  reason?: string
): Promise<{ Success: boolean; ResultCode: number; RefundId?: string }> {
  const body: Record<string, any> = {
    InvoiceNumber: invoiceNumber,
  };

  if (amount !== undefined) {
    body.Amount = amount;
  }

  if (reason) {
    body.Reason = reason;
  }

  return netgiroApiRequest('/Refund/Create', body, true);
}

/**
 * Check if Netgiro is configured
 */
export function isNetgiroConfigured(): boolean {
  return !!(NETGIRO_APPLICATION_ID && NETGIRO_SECRET_KEY);
}

/**
 * Get Netgiro configuration status for admin
 */
export async function getNetgiroStatus(): Promise<{
  configured: boolean;
  testMode: boolean;
  checkoutUrl: string;
}> {
  const urls = await getNetgiroUrls();
  return {
    configured: isNetgiroConfigured(),
    testMode: urls.isTestMode,
    checkoutUrl: urls.checkoutUrl,
  };
}

// Re-export types
export {
  NetgiroConfirmationType,
  NetgiroPaymentStatus,
  type NetgiroRedirectResponse,
  type NetgiroCallbackData,
};
