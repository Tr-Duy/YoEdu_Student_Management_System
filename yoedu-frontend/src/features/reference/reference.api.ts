import { api } from '../../lib/api';
import type { TeacherResponse, RoomResponse, ScheduleSlotResponse, PromotionResponse } from '../../types/yoedu';

export const referenceApi = {
  getTeachers: async (): Promise<TeacherResponse[]> => {
    return (api.get('/api/reference/teachers') as Promise<TeacherResponse[]>).catch(async () => {
      // Fallback to searching all active teachers
      const res = await api.get('/api/teachers', { params: { size: 100 } }) as any;
      return res?.content || [];
    });
  },

  getRooms: async (): Promise<RoomResponse[]> => {
    return (api.get('/api/reference/rooms') as Promise<RoomResponse[]>).catch(() => {
      return api.get('/api/rooms') as Promise<RoomResponse[]>;
    });
  },

  getScheduleSlots: async (): Promise<ScheduleSlotResponse[]> => {
    return (api.get('/api/reference/schedule-slots') as Promise<ScheduleSlotResponse[]>).catch(() => {
      return api.get('/api/schedule-slots') as Promise<ScheduleSlotResponse[]>;
    });
  },

  getPromotions: async (): Promise<PromotionResponse[]> => {
    return (api.get('/api/reference/promotions') as Promise<PromotionResponse[]>).catch(() => {
      return api.get('/api/promotions') as Promise<PromotionResponse[]>;
    }).then((res) => {
      return (Array.isArray(res) ? res : []).map(promo => {
        let discountTypeMapped = promo.discountType;
        if (discountTypeMapped === 'PERCENT') {
          discountTypeMapped = 'PERCENTAGE' as any;
        } else if (discountTypeMapped === 'AMOUNT' || discountTypeMapped === 'FIXED_AMOUNT') {
          discountTypeMapped = 'FIXED' as any;
        }
        return {
          ...promo,
          discountType: discountTypeMapped
        };
      });
    });
  }
};
export default referenceApi;
