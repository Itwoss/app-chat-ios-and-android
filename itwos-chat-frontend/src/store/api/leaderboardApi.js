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

export const leaderboardApi = createApi({
  reducerPath: 'leaderboardApi',
  baseQuery,
  tagTypes: ['Leaderboard', 'RankHistory'],
  endpoints: (builder) => ({
    // Get leaderboard
    getLeaderboard: builder.query({
      query: ({ type = 'monthly', region = 'global', country, state, district, page = 1, limit = 100 }) => ({
        url: '/api/leaderboard',
        params: { type, region, country, state, district, page, limit },
      }),
      providesTags: ['Leaderboard'],
    }),

    // Get leaderboard snapshot
    getLeaderboardSnapshot: builder.query({
      query: ({ snapshotType = 'monthly', period, region = 'global', country, state, district }) => ({
        url: '/api/leaderboard/snapshot',
        params: { snapshotType, period, region, country, state, district },
      }),
      providesTags: ['Leaderboard'],
    }),

    // Get user's rank history
    getUserRankHistory: builder.query({
      query: ({ type = 'monthly' } = {}) => ({
        url: '/api/leaderboard/me/history',
        params: { type },
      }),
      providesTags: ['RankHistory'],
    }),
  }),
});

export const {
  useGetLeaderboardQuery,
  useGetLeaderboardSnapshotQuery,
  useGetUserRankHistoryQuery,
} = leaderboardApi;

