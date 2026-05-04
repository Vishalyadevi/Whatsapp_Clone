import apiClient from './axios';

export const registerUser = async (userData) => {
  const response = await apiClient.post('/users/register', userData);
  return response.data;
};

export const loginUser = async (userData) => {
  const response = await apiClient.post('/users/login', userData);
  return response.data;
};

export const logoutUser = async () => {
  const response = await apiClient.post('/users/logout');
  return response.data;
};

export const getMe = async () => {
  const response = await apiClient.get('/users/me');
  return response.data;
};

export const getAllUsers = async () => {
  const response = await apiClient.get('/users');
  return response.data;
};

export const updateProfile = async (profileData) => {
  const formData = new FormData();
  if (profileData.username) formData.append('username', profileData.username);
  if (profileData.status) formData.append('status', profileData.status);
  if (profileData.profilePic) formData.append('profilePic', profileData.profilePic);

  const response = await apiClient.put('/users/profile', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const blockUser = async (userId) => {
  const response = await apiClient.post(`/users/block/${userId}`);
  return response.data;
};

export const unblockUser = async (userId) => {
  const response = await apiClient.post(`/users/unblock/${userId}`);
  return response.data;
};

export const reportUser = async (userId) => {
  const response = await apiClient.post(`/users/report/${userId}`);
  return response.data;
};
