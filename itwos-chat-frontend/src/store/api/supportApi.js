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

export const supportApi = createApi({
  reducerPath: 'supportApi',
  baseQuery,
  tagTypes: ['SupportTicket'],
  endpoints: (builder) => ({
    // User: Create support ticket
    createSupportTicket: builder.mutation({
      query: (data) => ({
        url: '/api/support',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SupportTicket'],
    }),

    // User: Get their tickets
    getUserTickets: builder.query({
      query: ({ status, page = 1, limit = 20 } = {}) => ({
        url: '/api/support/me',
        params: { status, page, limit },
      }),
      providesTags: ['SupportTicket'],
    }),

    // User: Get single ticket
    getTicketById: builder.query({
      query: (ticketId) => `/api/support/me/${ticketId}`,
      providesTags: ['SupportTicket'],
    }),

    // User: Add response to ticket
    addTicketResponse: builder.mutation({
      query: ({ ticketId, ...data }) => ({
        url: `/api/support/${ticketId}/response`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SupportTicket'],
    }),

    // Admin: Get all tickets
    getAllTickets: builder.query({
      query: ({ status, priority, category, search, page = 1, limit = 50 } = {}) => ({
        url: '/api/support/admin/all',
        params: { status, priority, category, search, page, limit },
      }),
      providesTags: ['SupportTicket'],
    }),

    // Admin: Get single ticket
    getAdminTicketById: builder.query({
      query: (ticketId) => `/api/support/admin/${ticketId}`,
      providesTags: ['SupportTicket'],
    }),

    // Admin: Add response
    addAdminResponse: builder.mutation({
      query: ({ ticketId, ...data }) => ({
        url: `/api/support/admin/${ticketId}/response`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['SupportTicket'],
    }),

    // Admin: Update ticket status
    updateTicketStatus: builder.mutation({
      query: ({ ticketId, ...data }) => ({
        url: `/api/support/admin/${ticketId}/status`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['SupportTicket'],
    }),
  }),
});

export const {
  useCreateSupportTicketMutation,
  useGetUserTicketsQuery,
  useGetTicketByIdQuery,
  useAddTicketResponseMutation,
  useGetAllTicketsQuery,
  useGetAdminTicketByIdQuery,
  useAddAdminResponseMutation,
  useUpdateTicketStatusMutation,
} = supportApi;


