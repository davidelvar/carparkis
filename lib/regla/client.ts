import {
  APIResponse,
  ReglaCustomer,
  ReglaInvoice,
  ReglaCreatedInvoice,
  ReglaPaymentMethod,
} from './types';

const REGLA_BASE_URL = 'https://www.regla.is/fibs/RestAPI2019';

export class ReglaClient {
  private token: string | null = null;
  private tokenExpiry: Date | null = null;
  private username: string;
  private password: string;

  constructor(username: string, password: string) {
    this.username = username;
    this.password = password;
  }

  // ─────────────────────────────────────────────────────────────
  // CORE HTTP METHOD
  // ─────────────────────────────────────────────────────────────

  private async request<T>(
    method: string,
    params: Record<string, unknown>
  ): Promise<APIResponse<T>> {
    const response = await fetch(`${REGLA_BASE_URL}/${method}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      throw new Error(`Regla API error: ${response.status} ${response.statusText}`);
    }

    const data: APIResponse<T> = await response.json();

    if (!data.Result?.Success) {
      throw new Error(
        `Regla error ${data.Result?.ErrorCode}: ${data.Result?.ErrorMessage}`
      );
    }

    return data;
  }

  // ─────────────────────────────────────────────────────────────
  // AUTHENTICATION
  // ─────────────────────────────────────────────────────────────

  async login(): Promise<string> {
    if (this.token && this.tokenExpiry && new Date() < this.tokenExpiry) {
      return this.token;
    }

    const response = await this.request<string>('Login', {
      username: this.username,
      password: this.password,
    });

    this.token = response.Returned!;
    this.tokenExpiry = new Date(Date.now() + 60 * 60 * 1000);

    return this.token;
  }

  private async getToken(): Promise<string> {
    if (!this.token) {
      await this.login();
    }
    return this.token!;
  }

  // ─────────────────────────────────────────────────────────────
  // CUSTOMER METHODS
  // ─────────────────────────────────────────────────────────────

  async getCustomer(customerNumber: string): Promise<ReglaCustomer | null> {
    const token = await this.getToken();

    try {
      const response = await this.request<ReglaCustomer>('GetCustomer', {
        token,
        CustomerNumber: customerNumber,
      });
      return response.Returned ?? null;
    } catch {
      return null;
    }
  }

  async getCustomerByKennitala(kennitala: string): Promise<ReglaCustomer | null> {
    const token = await this.getToken();

    try {
      const response = await this.request<ReglaCustomer>('GetCustomerByKennitala', {
        token,
        Kennitala: kennitala,
      });
      return response.Returned ?? null;
    } catch {
      return null;
    }
  }

  async createCustomer(customer: ReglaCustomer): Promise<string> {
    const token = await this.getToken();

    const response = await this.request<string>('CreateCustomer', {
      token,
      Customer: customer,
    });

    return response.Returned!;
  }

  async updateCustomer(customer: ReglaCustomer): Promise<void> {
    const token = await this.getToken();

    await this.request('UpdateCustomer', {
      token,
      Customer: customer,
    });
  }

  // ─────────────────────────────────────────────────────────────
  // INVOICE METHODS
  // ─────────────────────────────────────────────────────────────

  async createInvoice(invoice: ReglaInvoice): Promise<ReglaCreatedInvoice> {
    const token = await this.getToken();

    const response = await this.request<ReglaCreatedInvoice>('CreateInvoice', {
      token,
      Invoice: invoice,
    });

    return response.Returned!;
  }

  async getInvoice(invoiceNumber: string): Promise<ReglaInvoice | null> {
    const token = await this.getToken();

    try {
      const response = await this.request<ReglaInvoice>('GetInvoice', {
        token,
        InvoiceNumber: invoiceNumber,
      });
      return response.Returned ?? null;
    } catch {
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PAYMENT METHODS
  // ─────────────────────────────────────────────────────────────

  async getPaymentMethods(): Promise<ReglaPaymentMethod[]> {
    const token = await this.getToken();

    const response = await this.request<ReglaPaymentMethod[]>('GetPaymentMethod', {
      token,
    });

    return response.Returned ?? [];
  }

  async registerPayment(
    invoiceNumber: string,
    amount: number,
    paymentMethodNumber: string,
    paymentDate?: string
  ): Promise<void> {
    const token = await this.getToken();

    await this.request('RegisterPayment', {
      token,
      InvoiceNumber: invoiceNumber,
      Amount: amount,
      PaymentMethodNumber: paymentMethodNumber,
      PaymentDate: paymentDate ?? new Date().toISOString().split('T')[0],
    });
  }
}

// Singleton instance
let reglaClient: ReglaClient | null = null;

export function getReglaClient(): ReglaClient {
  if (!reglaClient) {
    const username = process.env.REGLA_USERNAME;
    const password = process.env.REGLA_PASSWORD;

    if (!username || !password) {
      throw new Error('REGLA_USERNAME and REGLA_PASSWORD must be set');
    }

    reglaClient = new ReglaClient(username, password);
  }

  return reglaClient;
}
