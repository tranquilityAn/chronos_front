import api from '../../app/api.js';

// GET /api/users/me - получить текущего пользователя
export const getCurrentUser = async () => {
  const { data } = await api.get('api/users/me');
  return data;
};

// PUT /api/users/me - обновить данные пользователя
export const updateUser = async (userData) => {
  const { data } = await api.put('api/users/me', userData);
  return data;
};

// POST /api/users/me/avatar - обновить аватар пользователя
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

// GET /api/users/:id - получить пользователя по ID
export const getUserById = async (userId) => {
  const { data } = await api.get(`api/users/${userId}`);
  return data;
};

// GET /api/users/mail/:email - получить пользователя по email
export const getUserByEmail = async (email) => {
  const { data } = await api.get(`api/users/mail/${email}`);
  return data;
};

// DELETE /api/auth/ - удалить текущего пользователя
export const deleteCurrentUser = async () => {
  const { data } = await api.delete('api/auth/');
  return data;
};

