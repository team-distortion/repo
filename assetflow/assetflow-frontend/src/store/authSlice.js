import { createSlice } from '@reduxjs/toolkit';

const storedToken = localStorage.getItem('token');
const storedUser = localStorage.getItem('user');
const storedRole = localStorage.getItem('role');

const initialState = {
  user: storedUser ? JSON.parse(storedUser) : null,
  isAuthenticated: !!storedToken,
  role: storedRole || null, // 'Admin', 'Asset Manager', 'Department Head', 'Employee'
  token: storedToken || null,
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    loginSuccess(state, action) {
      let mappedRole = action.payload.role || action.payload.user?.role;
      if (mappedRole === 'AssetManager') mappedRole = 'Asset Manager';
      if (mappedRole === 'DepartmentHead') mappedRole = 'Department Head';
      
      state.user = action.payload.user;
      state.isAuthenticated = true;
      state.role = mappedRole;
      state.token = action.payload.token;
      
      localStorage.setItem('token', action.payload.token);
      localStorage.setItem('user', JSON.stringify(action.payload.user));
      localStorage.setItem('role', mappedRole);
    },
    logout(state) {
      state.user = null;
      state.isAuthenticated = false;
      state.role = null;
      state.token = null;
      
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
    }
  }
});

export const { loginSuccess, logout } = authSlice.actions;
export default authSlice.reducer;
