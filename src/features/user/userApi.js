import api from '../../app/api.js';

export const getCurrentUser = async () => {
  const { data } = await api.get('api/users/me');
  return data;
};

export const updateUser = async (userData) => {
  const { data } = await api.put('api/users/me', userData);
  return data;
};

export const updateUserAvatar = async (avatarFile) => {
  const formData = new FormData();
  formData.append('avatar', avatarFile);
  const { data } = await api.post('api/users/me/avatar', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return data;
};

export const getUserById = async (userId) => {
  const { data } = await api.get(`api/users/${userId}`);
  return data;
};

export const getUserByEmail = async (email) => {
  const { data } = await api.get(`api/users/mail/${email}`);
  return data;
};

export const deleteCurrentUser = async () => {
  const { data } = await api.delete('api/auth/');
  return data;
};

