import { api } from '../../lib/api';
import type { PaymentResponse } from '../../types/yoedu';

export const paymentsApi = {
  getByStudentId: async (studentId: number): Promise<PaymentResponse[]> => {
    // If backend has dedicated /api/payments, use it. Otherwise fallback to billing payment history
    return (api.get(`/api/payments/student/${studentId}`) as Promise<PaymentResponse[]>).catch(() => {
      return api.get(`/api/billing/students/${studentId}/payment-history`) as Promise<PaymentResponse[]>;
    });
  },

  getAll: async (): Promise<PaymentResponse[]> => {
    return api.get('/api/payments/all');
  },

  getById: async (id: number): Promise<PaymentResponse> => {
    return api.get(`/api/payments/${id}`);
  }
};
export default paymentsApi;
