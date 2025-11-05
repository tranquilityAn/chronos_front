import api from '../../app/api.js';

// POST /auth/login  { email, password }
export const loginRequest = async ({ email, password }) => {
  const { data } = await api.post('api/auth/login', { email, password });
  return data; // ожидается { user, token } или подобное
};

// POST /auth/register  { email, password }
export const registerRequest = async ({ email, password }) => {
  const { data } = await api.post('api/auth/register', { email, password });
  return data; // ожидается { user, token }/message — зависит от бэка
};
