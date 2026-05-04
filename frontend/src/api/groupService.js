import apiClient from './axios';

export const createGroup = async (groupData) => {
  const response = await apiClient.post('/groups', groupData);
  return response.data;
};

export const getGroups = async () => {
  const response = await apiClient.get('/groups');
  return response.data;
};

export const updateGroup = async (groupId, groupData) => {
  const response = await apiClient.put(`/groups/${groupId}`, groupData);
  return response.data;
};

export const addMembers = async (groupId, members) => {
  const response = await apiClient.post(`/groups/${groupId}/members`, { members });
  return response.data;
};

export const removeMember = async (groupId, userId) => {
  const response = await apiClient.delete(`/groups/${groupId}/members/${userId}`);
  return response.data;
};

export const exitGroup = async (groupId) => {
  const response = await apiClient.post(`/groups/${groupId}/exit`);
  return response.data;
};

export const deleteGroup = async (groupId) => {
  const response = await apiClient.delete(`/groups/${groupId}`);
  return response.data;
};
