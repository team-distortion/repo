import { createSlice } from '@reduxjs/toolkit';

const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  token: storedToken || null,
  isAuthenticated: !!storedToken,
  role: storedUser ? JSON.parse(storedUser)?.role : null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action) {
      const user = { ...action.payload.user };
      if (user.role === 'AssetManager') user.role = 'Asset Manager';
      if (user.role === 'DepartmentHead') user.role = 'Department Head';

      state.user = user;
      state.token = action.payload.token;
      state.isAuthenticated = true;
      state.role = user.role;
      
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    logout(state) {
      state.user = null;
      state.token = null;
      state.isAuthenticated = false;
      state.role = null;
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
  }
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
