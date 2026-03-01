import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

const getBaseUrl = () => {
  // CRITICAL: iOS blocks HTTP - must use HTTPS in production
  if (import.meta.env.VITE_API_URL) {
    const url = String(import.meta.env.VITE_API_URL).trim()
    // In development mode, allow HTTP (localhost)
    if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
      return url
    }
    if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
      return url.startsWith('https://') ? url : url.replace('http://', 'https://')
    }
    return url
  }
  // Development: use localhost fallback
  if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
    return 'http://localhost:5001'
  }
  console.error('[CRITICAL] VITE_API_URL not set! Using fallback HTTPS URL.')
  return 'https://plankton-app-ymi7p.ondigitalocean.app'
};

const baseQuery = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  credentials: 'include',
});

export const countApi = createApi({
  reducerPath: 'countApi',
  baseQuery,
  tagTypes: ['Count', 'CountLogs'],
  endpoints: (builder) => ({
    // Get user's count summary
    getUserCount: builder.query({
      query: () => '/api/count/me',
      providesTags: ['Count'],
    }),

    // Get user's count logs
    getCountLogs: builder.query({
      query: ({ page = 1, limit = 50, monthYear, actionType }) => ({
        url: '/api/count/me/logs',
        params: { page, limit, monthYear, actionType },
      }),
      providesTags: ['CountLogs'],
    }),

    // Admin: Adjust user count
    adjustUserCount: builder.mutation({
      query: (data) => ({
        url: '/api/count/admin/adjust',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Count'],
    }),

    // Admin: Reset monthly count
    resetMonthlyCount: builder.mutation({
      query: (userId) => ({
        url: `/api/count/admin/reset-monthly/${userId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Count'],
    }),

    // Admin: Toggle count freeze
    toggleCountFreeze: builder.mutation({
      query: ({ userId, frozen }) => ({
        url: `/api/count/admin/toggle-freeze/${userId}`,
        method: 'POST',
        body: { frozen },
      }),
      invalidatesTags: ['Count'],
    }),

    // Admin: Get dashboard stats
    getCountDashboardStats: builder.query({
      query: () => '/api/count/admin/dashboard-stats',
      providesTags: ['Count'],
    }),
  }),
});

export const {
  useGetUserCountQuery,
  useGetCountLogsQuery,
  useAdjustUserCountMutation,
  useResetMonthlyCountMutation,
  useToggleCountFreezeMutation,
  useGetCountDashboardStatsQuery,
} = countApi;

