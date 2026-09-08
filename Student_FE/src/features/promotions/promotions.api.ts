import { api, cleanParams } from '../../lib/api';
import type { PromotionResponse, PromotionUpsertRequest } from '../../types/yoedu';

export interface PromotionSearchParams {
  search?: string;
  keyword?: string;
}

const mapRequest = (data: PromotionUpsertRequest): any => {
  let discountTypeMapped = data.discountType;
  if (discountTypeMapped === 'PERCENTAGE' || discountTypeMapped === 'PERCENT') {
    discountTypeMapped = 'PERCENT' as any;
  } else if (discountTypeMapped === 'FIXED' || discountTypeMapped === 'AMOUNT' || discountTypeMapped === 'FIXED_AMOUNT') {
    discountTypeMapped = 'AMOUNT' as any;
  }
  return {
    ...data,
    discountType: discountTypeMapped
  };
};

const mapResponse = (data: any): PromotionResponse => {
  if (!data) return data;
  let discountTypeMapped = data.discountType;
  if (discountTypeMapped === 'PERCENT') {
    discountTypeMapped = 'PERCENTAGE';
  } else if (discountTypeMapped === 'AMOUNT' || discountTypeMapped === 'FIXED_AMOUNT') {
    discountTypeMapped = 'FIXED';
  }
  return {
    ...data,
    discountType: discountTypeMapped
  };
};

export const promotionsApi = {
  getAll: async (params?: PromotionSearchParams): Promise<PromotionResponse[]> => {
    const searchVal = params?.search || params?.keyword;
    const reqParameters = cleanParams({ search: searchVal });
    const res = await api.get('/api/promotions', { params: reqParameters }) as any;
    return (Array.isArray(res) ? res : []).map(mapResponse);
  },

  getById: async (id: number): Promise<PromotionResponse> => {
    const res = await api.get(`/api/promotions/${id}`);
    return mapResponse(res);
  },

  create: async (data: PromotionUpsertRequest): Promise<PromotionResponse> => {
    const mapped = mapRequest(data);
    const res = await api.post('/api/promotions', mapped);
    return mapResponse(res);
  },

  update: async (id: number, data: PromotionUpsertRequest): Promise<PromotionResponse> => {
    const mapped = mapRequest(data);
    const res = await api.put(`/api/promotions/${id}`, mapped);
    return mapResponse(res);
  },

  delete: async (id: number): Promise<void> => {
    return api.delete(`/api/promotions/${id}`);
  }
};
export default promotionsApi;
