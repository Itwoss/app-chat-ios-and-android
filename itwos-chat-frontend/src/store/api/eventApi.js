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

export const eventApi = createApi({
  reducerPath: 'eventApi',
  baseQuery,
  tagTypes: ['Event', 'ActiveEvents'],
  endpoints: (builder) => ({
    // Get active events (public)
    getActiveEvents: builder.query({
      query: () => '/api/events/active',
      providesTags: ['ActiveEvents'],
    }),

    // Complete event (user)
    completeEvent: builder.mutation({
      query: (data) => ({
        url: '/api/events/complete',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ActiveEvents', 'Count'],
    }),

    // Admin: Get all events
    getEvents: builder.query({
      query: ({ isActive, page = 1, limit = 50 } = {}) => ({
        url: '/api/events/admin',
        params: { isActive, page, limit },
      }),
      providesTags: ['Event'],
    }),

    // Admin: Create event
    createEvent: builder.mutation({
      query: (data) => ({
        url: '/api/events/admin',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Event', 'ActiveEvents'],
    }),

    // Admin: Update event
    updateEvent: builder.mutation({
      query: ({ eventId, ...data }) => ({
        url: `/api/events/admin/${eventId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Event', 'ActiveEvents'],
    }),

    // Admin: Cancel event
    cancelEvent: builder.mutation({
      query: ({ eventId, reason }) => ({
        url: `/api/events/admin/${eventId}/cancel`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Event', 'ActiveEvents'],
    }),
  }),
});

export const {
  useGetActiveEventsQuery,
  useCompleteEventMutation,
  useGetEventsQuery,
  useCreateEventMutation,
  useUpdateEventMutation,
  useCancelEventMutation,
} = eventApi;

