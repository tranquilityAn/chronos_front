import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { loginRequest, registerRequest } from './authApi';

// --- Thunks ---
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      return await loginRequest({ email, password });
    } catch (err) {
      return rejectWithValue(err?.response?.data?.message || err.message || 'Login failed');
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async ({ email, password }, { rejectWithValue }) => {
    try {
      // Валидация и нормализация email перед вызовом API
      const trimmedEmail = email?.trim() || '';
      if (!trimmedEmail) {
        return rejectWithValue('Email is required');
      }
      if (!password || !password.trim()) {
        return rejectWithValue('Password is required');
      }
      
      // Передаем нормализованный email
      return await registerRequest({ email: trimmedEmail, password });
    } catch (err) {
      const errorMessage = err?.response?.data?.message || 
                          err?.response?.data?.error || 
                          err?.message || 
                          'Register failed';
      return rejectWithValue(errorMessage);
    }
  }
);

// --- Slice ---
const initialState = {
  user: null,
  token: localStorage.getItem('token') || null,
  status: 'idle',
  error: null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      localStorage.removeItem('token');
    },
  },
  extraReducers: (builder) => {
    // login
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload?.user ?? null;
        state.token = action.payload?.token ?? null;
        if (state.token) localStorage.setItem('token', state.token);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed';
      });

    // register
    builder
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload?.user ?? null;
        state.token = action.payload?.token ?? null;
        if (state.token) localStorage.setItem('token', state.token);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Register failed';
      });
  },
});

export const { logout } = authSlice.actions;
export default authSlice.reducer;
