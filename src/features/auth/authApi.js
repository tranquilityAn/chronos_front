import api from '../../app/api.js';

// POST /auth/login  { email, password }
export const loginRequest = async ({ email, password }) => {
  const { data } = await api.post('api/auth/login', { email, password });
  return data; // ожидается { user, token } или подобное
};

// POST /auth/register  { email, password }
export const registerRequest = async ({ email, password }) => {
  // Валидация перед отправкой
  const trimmedEmail = email?.trim() || '';
  if (!trimmedEmail) {
    throw new Error('Email is required');
  }
  if (!password || !password.trim()) {
    throw new Error('Password is required');
  }
  
  // Нормализуем email (trim и lowercase)
  const normalizedEmail = trimmedEmail.toLowerCase();
  
  // Проверяем, что email не пустой перед отправкой
  if (!normalizedEmail) {
    throw new Error('Email cannot be empty');
  }
  
  const { data } = await api.post('api/auth/register', { 
    email: normalizedEmail, 
    password 
  });
  
  return data; // ожидается { user, token }/message — зависит от бэка
};
