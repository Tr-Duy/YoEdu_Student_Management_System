import { api, cleanParams } from '../../lib/api';
import type { RoomResponse, RoomUpsertRequest } from '../../types/yoedu';

export interface RoomSearchParams {
  search?: string;
  keyword?: string;
}

export const roomsApi = {
  getAll: async (params?: RoomSearchParams): Promise<RoomResponse[]> => {
    const searchVal = params?.search || params?.keyword;
    const reqParameters = cleanParams({ search: searchVal });
    return api.get('/api/rooms', { params: reqParameters });
  },

  getById: async (id: number): Promise<RoomResponse> => {
    return api.get(`/api/rooms/${id}`);
  },

  create: async (data: RoomUpsertRequest): Promise<RoomResponse> => {
    // Backend controller uses save()
    return api.post('/api/rooms', data);
  },

  update: async (id: number, data: RoomUpsertRequest): Promise<RoomResponse> => {
    return api.put(`/api/rooms/${id}`, data);
  },

  delete: async (id: number): Promise<void> => {
    return api.delete(`/api/rooms/${id}`);
  }
};
export default roomsApi;
