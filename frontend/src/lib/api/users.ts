import apiClient from './client';

export interface UpdateProfileRequest {
  name: string;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  role: string;
  companyId: string | null;
}

export const usersApi = {
  updateProfile: async (data: UpdateProfileRequest): Promise<UserProfile> => {
    const { data: response } = await apiClient.patch('/users/me', data);
    return response;
  },
};
