import apiClient from './axios';

export const getMessages = async (user1, targetId, isGroup = false) => {
  const response = await apiClient.get(`/messages/${user1}/${targetId}?isGroup=${isGroup}`);
  return response.data;
};

export const getChats = async () => {
  const response = await apiClient.get('/messages/chats');
  return response.data;
};

export const sendMessage = async (messageData) => {
  const formData = new FormData();
  if (messageData.receiverId) formData.append('receiverId', messageData.receiverId);
  if (messageData.groupId) formData.append('groupId', messageData.groupId);
  if (messageData.text) formData.append('text', messageData.text);
  if (messageData.media) formData.append('media', messageData.media);
  if (messageData.isForwarded) formData.append('isForwarded', messageData.isForwarded);

  const response = await apiClient.post('/messages', formData, {
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  });
  return response.data;
};

export const editMessage = async (messageId, text) => {
  const response = await apiClient.put(`/messages/${messageId}`, { text });
  return response.data;
};

export const deleteMessage = async (messageId, type) => {
  const response = await apiClient.delete(`/messages/${messageId}?type=${type}`);
  return response.data;
};

export const updateMessageStatus = async (messageId, status) => {
  const response = await apiClient.put(`/messages/${messageId}/status`, { status });
  return response.data;
};

export const deleteChat = async (targetId, isGroup = false) => {
  const response = await apiClient.delete(`/messages/chat/${targetId}?isGroup=${isGroup}`);
  return response.data;
};
