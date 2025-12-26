// ─────────────────────────────────────────────────────────────
// API RESPONSE TYPES
// ─────────────────────────────────────────────────────────────

export interface MethodResult {
  Success: boolean;
  ErrorCode?: number;
  ErrorMessage?: string;
}

export interface APIResponse<T = unknown> {
  Result: MethodResult;
  Returned?: T;
  OutParameters?: Record<string, unknown>;
  timeRun?: number;
}

// ─────────────────────────────────────────────────────────────
// DOMAIN TYPES
// ─────────────────────────────────────────────────────────────

export interface ReglaCustomer {
  CustomerNumber?: string;
  Name: string;
  Kennitala?: string;
  Email?: string;
  Phone?: string;
  Address?: string;
  PostCode?: string;
  City?: string;
  Country?: string;
}

export interface ReglaProduct {
  ProductNumber: string;
  Name: string;
  Price: number;
  VATCode?: string;
}

export interface ReglaInvoiceLine {
  ProductNumber?: string;
  Description: string;
  Quantity: number;
  UnitPrice: number;
  VATCode?: string;
  DiscountPercent?: number;
}

export interface ReglaInvoice {
  CustomerNumber: string;
  InvoiceDate?: string;
  DueDate?: string;
  Reference?: string;
  Comment?: string;
  Lines: ReglaInvoiceLine[];
}

export interface ReglaPaymentMethod {
  PaymentMethodNumber: string;
  Name: string;
}

export interface ReglaCreatedInvoice {
  InvoiceNumber: string;
  Total: number;
  TotalWithVAT: number;
}
