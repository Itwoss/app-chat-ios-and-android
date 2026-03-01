import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

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
}

const baseQuery = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  credentials: 'include',
})

export const employeeApi = createApi({
  reducerPath: 'employeeApi',
  baseQuery,
  tagTypes: ['EmployeeProjects', 'WorkSteps'],
  endpoints: (builder) => ({
    // Get employee's assigned projects
    getEmployeeProjects: builder.query({
      query: (params) => ({
        url: '/api/employee/me/projects',
        params,
      }),
      providesTags: ['EmployeeProjects'],
    }),
    // Get work steps for a project
    getEmployeeWorkSteps: builder.query({
      query: (projectId) => ({
        url: `/api/employee/projects/${projectId}/work-steps`,
      }),
      providesTags: ['WorkSteps'],
    }),
    // Update work step (employee can update their assigned steps)
    updateWorkStep: builder.mutation({
      query: ({ projectId, stepNumber, ...data }) => ({
        url: `/api/admin/client-projects/${projectId}/work-steps/${stepNumber}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['WorkSteps', 'EmployeeProjects'],
    }),
  }),
})

export const {
  useGetEmployeeProjectsQuery,
  useGetEmployeeWorkStepsQuery,
  useUpdateWorkStepMutation,
} = employeeApi











