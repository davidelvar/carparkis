// Netgiro API Types

// Confirmation type values
export enum NetgiroConfirmationType {
  Automatic = 0, // Payment is confirmed automatically after customer approval
  ServerCallback = 1, // Server-side callback to confirm payment
  Manual = 2, // Provider must manually confirm the payment
}

// Payment status values
export enum NetgiroPaymentStatus {
  Unconfirmed = 1,
  Confirmed = 2,
  Canceled = 5,
}

// Cart item for detailed order
export interface NetgiroCartItem {
  Name: string;
  UnitPrice: number; // In ISK (integer)
  Amount: number; // Quantity in 1/1000 units (e.g., 2 items = 2000)
  ProductNo?: string;
}

// Request body for HTTP POST checkout (redirect/iframe)
export interface NetgiroCheckoutRequest {
  ApplicationID: string;
  Signature: string;
  ReferenceNumber: string;
  TotalAmount: number;
  PaymentSuccessfulURL?: string;
  PaymentCancelledURL?: string;
  PaymentConfirmedURL?: string;
  ConfirmationType?: NetgiroConfirmationType;
  Message?: string;
  CustomerId?: string; // Phone number or SSN
  Description?: string;
  Iframe?: boolean;
  PrefixUrlParameters?: boolean;
  // Item details (repeated for each item)
  'Items[0].Name'?: string;
  'Items[0].UnitPrice'?: number;
  'Items[0].Amount'?: number;
  'Items[0].ProductNo'?: string;
}

// Response from successful redirect
export interface NetgiroRedirectResponse {
  TransactionId: string;
  InvoiceNumber: number;
  ReferenceNumber: string;
  NetgiroSignature: string;
  Status: NetgiroPaymentStatus;
  TotalAmount: number;
  Address?: string;
  Address2?: string;
  City?: string;
  Country?: string;
  Zip?: string;
  CustomerMessage?: string;
  CustomerId?: string;
}

// API Checkout - InsertCart request
export interface NetgiroInsertCartRequest {
  Amount: number;
  Reference: string;
  CustomerId: string; // SSN, SMS code, AppCode or GSM number
  ConfirmationType: NetgiroConfirmationType;
  CallbackUrl?: string;
  CallbackCancelUrl?: string;
  Description?: string;
  CartItemRequests?: Array<{
    Name: string;
    UnitPrice: number;
    Amount: number; // Quantity in 1/1000 units
    ProductNo?: string;
  }>;
}

// API Checkout - InsertCart response
export interface NetgiroInsertCartResponse {
  Success: boolean;
  ResultCode: number;
  TransactionId?: string; // GUID, cart identifier
  ProcessCartCheckIntervalMiliseconds?: number;
}

// API Checkout - CheckCart response
export interface NetgiroCheckCartResponse {
  Success: boolean;
  ResultCode: number;
  CartStatus: 'Pending' | 'CustomerConfirmed' | 'Confirmed' | 'Canceled';
  PaymentId?: string;
}

// API Checkout - ConfirmCart response
export interface NetgiroConfirmCartResponse {
  Success: boolean;
  ResultCode: number;
  PaymentId?: string;
}

// Webhook callback data (POST to CallbackUrl)
export interface NetgiroCallbackData {
  TransactionId: string;
  ReferenceNumber: string;
  InvoiceNumber: number;
  TotalAmount: number;
  Status: NetgiroPaymentStatus;
  NetgiroSignature: string;
}

// Webhook event types for our internal handling
export type NetgiroWebhookType = 
  | 'PAYMENT_CONFIRMED'
  | 'PAYMENT_CANCELED'
  | 'PAYMENT_PENDING';

// Result codes from Netgiro API
export const NetgiroResultCodes = {
  Success: 200,
  GenericError: 400,
  NotACustomer: 401,
  InvalidCart: 402,
  CartExpired: 403,
  CartCanceled: 404,
  CartAlreadyConfirmed: 405,
  InvalidSignature: 406,
  InvalidAmount: 407,
  Timeout: 408,
} as const;

export type NetgiroResultCode = typeof NetgiroResultCodes[keyof typeof NetgiroResultCodes];
