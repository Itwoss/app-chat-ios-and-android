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

export const adminRuleApi = createApi({
  reducerPath: 'adminRuleApi',
  baseQuery,
  tagTypes: ['Rules'],
  endpoints: (builder) => ({
    // Get rules
    getRules: builder.query({
      query: () => '/api/admin/rules',
      providesTags: ['Rules'],
    }),

    // Update rules
    updateRules: builder.mutation({
      query: (data) => ({
        url: '/api/admin/rules',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Rules'],
    }),

    // Toggle rule
    toggleRule: builder.mutation({
      query: (data) => ({
        url: '/api/admin/rules/toggle',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Rules'],
    }),
  }),
});

export const {
  useGetRulesQuery,
  useUpdateRulesMutation,
  useToggleRuleMutation,
} = adminRuleApi;

