import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: 'http://localhost:3000/api',
    prepareHeaders: (headers, { getState }) => {
      // Extract the JWT token from the Redux state (assuming it's at auth.token)
      const token = getState().auth?.token;
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User', 'Asset', 'Department', 'Category', 'Allocation', 'Booking', 'Maintenance', 'Transfer', 'Notification'],
  endpoints: (builder) => ({
    // Auth
    login: builder.mutation({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    signup: builder.mutation({
      query: (userData) => ({
        url: '/auth/signup',
        method: 'POST',
        body: userData,
      }),
    }),

    // Dashboard
    getDashboardStats: builder.query({
      query: () => '/dashboard',
      providesTags: ['Asset', 'Allocation', 'Maintenance'],
    }),

    // Assets
    getAssets: builder.query({
      query: (params) => ({
        url: '/assets',
        params,
      }),
      providesTags: ['Asset'],
    }),
    createAsset: builder.mutation({
      query: (newAsset) => ({
        url: '/assets',
        method: 'POST',
        body: newAsset,
      }),
      invalidatesTags: ['Asset'],
    }),
    updateAsset: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/assets/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Asset'],
    }),
    deleteAsset: builder.mutation({
      query: (id) => ({
        url: `/assets/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Asset'],
    }),

    // Allocations
    getAllocations: builder.query({
      query: (params) => ({
        url: '/allocations',
        params,
      }),
      providesTags: ['Allocation'],
    }),
    createAllocation: builder.mutation({
      query: (newAllocation) => ({
        url: '/allocations',
        method: 'POST',
        body: newAllocation,
      }),
      invalidatesTags: ['Allocation', 'Asset'],
    }),
    updateAllocation: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/allocations/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Allocation', 'Asset'],
    }),
    returnAllocation: builder.mutation({
      query: (id) => ({
        url: `/allocations/${id}/return`,
        method: 'POST',
      }),
      invalidatesTags: ['Allocation', 'Asset'],
    }),

    // Transfers
    getTransfers: builder.query({
      query: (params) => ({
        url: '/transfers',
        params,
      }),
      providesTags: ['Transfer'],
    }),
    createTransfer: builder.mutation({
      query: (newTransfer) => ({
        url: '/transfers',
        method: 'POST',
        body: newTransfer,
      }),
      invalidatesTags: ['Transfer', 'Asset', 'Allocation'],
    }),

    // Maintenance
    getMaintenanceRequests: builder.query({
      query: (params) => ({
        url: '/maintenance',
        params,
      }),
      providesTags: ['Maintenance'],
    }),
    createMaintenanceRequest: builder.mutation({
      query: (newRequest) => ({
        url: '/maintenance',
        method: 'POST',
        body: newRequest,
      }),
      invalidatesTags: ['Maintenance', 'Asset'],
    }),
    updateMaintenanceRequest: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/maintenance/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['Maintenance', 'Asset'],
    }),

    // Bookings
    getBookings: builder.query({
      query: (params) => ({
        url: '/bookings',
        params,
      }),
      providesTags: ['Booking'],
    }),
    createBooking: builder.mutation({
      query: (newBooking) => ({
        url: '/bookings',
        method: 'POST',
        body: newBooking,
      }),
      invalidatesTags: ['Booking'],
    }),
    cancelBooking: builder.mutation({
      query: (id) => ({
        url: `/bookings/${id}/cancel`,
        method: 'POST',
      }),
      invalidatesTags: ['Booking'],
    }),

    // Admin (Users, Departments, Categories)
    getUsers: builder.query({
      query: () => '/users',
      providesTags: ['User'],
    }),
    createUser: builder.mutation({
      query: (newUser) => ({
        url: '/users',
        method: 'POST',
        body: newUser,
      }),
      invalidatesTags: ['User'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...patch }) => ({
        url: `/users/${id}`,
        method: 'PUT',
        body: patch,
      }),
      invalidatesTags: ['User'],
    }),
    
    getDepartments: builder.query({
      query: () => '/departments',
      providesTags: ['Department'],
    }),
    createDepartment: builder.mutation({
      query: (newDept) => ({
        url: '/departments',
        method: 'POST',
        body: newDept,
      }),
      invalidatesTags: ['Department'],
    }),
    
    getCategories: builder.query({
      query: () => '/categories',
      providesTags: ['Category'],
    }),
    createCategory: builder.mutation({
      query: (newCat) => ({
        url: '/categories',
        method: 'POST',
        body: newCat,
      }),
      invalidatesTags: ['Category'],
    }),
  }),
});

export const {
  useLoginMutation,
  useSignupMutation,
  useGetDashboardStatsQuery,
  useGetAssetsQuery,
  useCreateAssetMutation,
  useUpdateAssetMutation,
  useDeleteAssetMutation,
  useGetAllocationsQuery,
  useCreateAllocationMutation,
  useUpdateAllocationMutation,
  useReturnAllocationMutation,
  useGetTransfersQuery,
  useCreateTransferMutation,
  useGetMaintenanceRequestsQuery,
  useCreateMaintenanceRequestMutation,
  useUpdateMaintenanceRequestMutation,
  useGetBookingsQuery,
  useCreateBookingMutation,
  useCancelBookingMutation,
  useGetUsersQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useGetDepartmentsQuery,
  useCreateDepartmentMutation,
  useGetCategoriesQuery,
  useCreateCategoryMutation,
} = apiSlice;
