import { api } from '../../lib/api';
import type {
  InvoiceResponse,
  InvoiceCreateRequest,
  BulkInvoiceRequest,
  PaymentResponse,
  PaymentCreateRequest,
  OverdueWarningResponse,
  InvoiceStatsResponse,
  PageResponse
} from '../../types/yoedu';

export const billingApi = {
  createInvoice: async (data: InvoiceCreateRequest): Promise<InvoiceResponse> => {
    return api.post('/api/billing/invoices', data);
  },

  createInvoicesBulk: async (data: BulkInvoiceRequest): Promise<InvoiceResponse[]> => {
    return api.post('/api/billing/invoices/bulk', data);
  },

  getInvoicesByStudent: async (studentId: number): Promise<InvoiceResponse[]> => {
    return api.get(`/api/billing/students/${studentId}/invoices`);
  },

  recordPayment: async (data: PaymentCreateRequest): Promise<PaymentResponse> => {
    return api.post('/api/billing/payments', data);
  },

  getPaymentHistory: async (studentId: number): Promise<PaymentResponse[]> => {
    return api.get(`/api/billing/students/${studentId}/payment-history`);
  },

  getOverdueWarnings: async (): Promise<OverdueWarningResponse[]> => {
    return api.get('/api/billing/invoices/overdue-warnings');
  },

  searchInvoices: async (params: {
    page?: number;
    size?: number;
    search?: string;
    studentId?: number;
    classId?: number;
    status?: string;
    month?: string;
  }): Promise<PageResponse<InvoiceResponse>> => {
    return api.get('/api/billing/invoices/search', { params });
  },

  getInvoiceStats: async (params: {
    search?: string;
    studentId?: number;
    classId?: number;
    status?: string;
    month?: string;
  }): Promise<InvoiceStatsResponse> => {
    return api.get('/api/billing/invoices/stats', { params });
  }
};
export default billingApi;
