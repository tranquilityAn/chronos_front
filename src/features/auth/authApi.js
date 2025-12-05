import api from '../../app/api.js';

export const loginRequest = async ({ email, password }) => {
  const { data } = await api.post('api/auth/login', { email, password });
  return data;
};

export const registerRequest = async ({ email, password }) => {
  const trimmedEmail = email?.trim() || '';
  if (!trimmedEmail) {
    throw new Error('Email is required');
  }
  if (!password || !password.trim()) {
    throw new Error('Password is required');
  }
  
  const normalizedEmail = trimmedEmail.toLowerCase();
  
  if (!normalizedEmail) {
    throw new Error('Email cannot be empty');
  }
  
  const { data } = await api.post('api/auth/register', { 
    email: normalizedEmail, 
    password 
  });
  
  return data;
};

export const verifyEmailRequest = async (token) => {
  const normalizedToken = String(token || '').trim();

  if (!normalizedToken) {
    throw new Error('Verification token is required');
  }

  const { data } = await api.get('api/auth/verify-email', {
    params: { token: normalizedToken },
  });

  return data;
};