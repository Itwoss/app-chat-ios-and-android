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

export const abuseApi = createApi({
  reducerPath: 'abuseApi',
  baseQuery,
  tagTypes: ['AbuseLog', 'UserActivity'],
  endpoints: (builder) => ({
    // Get abuse logs
    getAbuseLogs: builder.query({
      query: ({ status = 'pending', severity, abuseType, userId, page = 1, limit = 50 } = {}) => ({
        url: '/api/admin/abuse/logs',
        params: { status, severity, abuseType, userId, page, limit },
      }),
      providesTags: ['AbuseLog'],
    }),

    // Review abuse log
    reviewAbuseLog: builder.mutation({
      query: ({ logId, ...data }) => ({
        url: `/api/admin/abuse/logs/${logId}/review`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AbuseLog'],
    }),

    // Flag user
    flagUser: builder.mutation({
      query: (data) => ({
        url: '/api/admin/abuse/flag',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['AbuseLog'],
    }),

    // Get user activity logs
    getUserActivityLogs: builder.query({
      query: ({ userId, monthYear, page = 1, limit = 100 }) => ({
        url: `/api/admin/abuse/user/${userId}/activity`,
        params: { monthYear, page, limit },
      }),
      providesTags: ['UserActivity'],
    }),

    // Toggle leaderboard visibility
    toggleLeaderboardVisibility: builder.mutation({
      query: ({ userId, hidden }) => ({
        url: `/api/admin/abuse/user/${userId}/leaderboard-visibility`,
        method: 'POST',
        body: { hidden },
      }),
      invalidatesTags: ['UserActivity'],
    }),
  }),
});

export const {
  useGetAbuseLogsQuery,
  useReviewAbuseLogMutation,
  useFlagUserMutation,
  useGetUserActivityLogsQuery,
  useToggleLeaderboardVisibilityMutation,
} = abuseApi;

