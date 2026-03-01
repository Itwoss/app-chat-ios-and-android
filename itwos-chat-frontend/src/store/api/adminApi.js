import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getBaseUrl, runFormDataFetch } from './baseApi'

const baseQuery = fetchBaseQuery({ baseUrl: getBaseUrl(), credentials: 'include' })

const baseQueryWithFormData = async (args, api, extraOptions) => {
  if (args.body instanceof FormData) return runFormDataFetch(args, () => null)
  return baseQuery(args, api, extraOptions)
}

export const adminApi = createApi({
  reducerPath: 'adminApi',
  baseQuery: baseQueryWithFormData,
  tagTypes: ['Admin', 'Users', 'Teams', 'Projects', 'Bookings', 'ClientProjects', 'Notifications', 'Meetings', 'UserFriends', 'UserChats', 'Subscriptions', 'Banners', 'Fonts', 'Stories', 'ChatThemes'],
  endpoints: (builder) => ({
    loginAdmin: builder.mutation({
      query: (data) => ({
        url: '/api/admin/login',
        method: 'POST',
        body: data,
      }),
    }),
    getCurrentAdmin: builder.query({
      query: () => '/api/admin/me',
      providesTags: ['Admin'],
    }),
    getAdminStats: builder.query({
      query: () => '/api/admin/stats',
      providesTags: ['Users', 'Projects', 'Teams', 'Bookings', 'ClientProjects', 'Meetings'],
    }),
    logoutAdmin: builder.mutation({
      query: () => ({
        url: '/api/admin/logout',
        method: 'POST',
      }),
    }),
    updateAdminProfile: builder.mutation({
      query: (data) => {
        const formData = new FormData()
        if (data.name) formData.append('name', data.name)
        if (data.email) formData.append('email', data.email)
        if (data.password) formData.append('password', data.password)
        if (data.file) formData.append('file', data.file)
        if (data.profileImage) formData.append('profileImage', data.profileImage)
        
        return {
          url: '/api/admin/profile',
          method: 'PUT',
          body: formData,
        }
      },
      invalidatesTags: ['Admin'],
    }),
    // User management endpoints
    getAllUsers: builder.query({
      query: (params) => ({
        url: '/api/admin/users',
        params,
      }),
      providesTags: ['Users'],
    }),
    getUserById: builder.query({
      query: (id) => `/api/admin/users/${id}`,
      providesTags: ['Users'],
    }),
    createUser: builder.mutation({
      query: (data) => ({
        url: '/api/admin/users',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),
    updateUser: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/admin/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),
    deleteUser: builder.mutation({
      query: (id) => ({
        url: `/api/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),
    toggleUserStatus: builder.mutation({
      query: (id) => ({
        url: `/api/admin/users/${id}/toggle-status`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Users'],
    }),
    // Team management endpoints
    getAllTeams: builder.query({
      query: (params) => ({
        url: '/api/admin/teams',
        params,
      }),
      providesTags: ['Teams'],
    }),
    getTeamById: builder.query({
      query: (id) => `/api/admin/teams/${id}`,
      providesTags: ['Teams'],
    }),
    createTeam: builder.mutation({
      query: (formData) => {
        // If formData is already FormData, use it directly
        const body = formData instanceof FormData ? formData : (() => {
          const fd = new FormData()
          Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
              if (key === 'socialLinks' && typeof formData[key] === 'object') {
                fd.append(key, JSON.stringify(formData[key]))
              } else {
                fd.append(key, formData[key])
              }
            }
          })
          return fd
        })()
        return {
          url: '/api/admin/teams',
          method: 'POST',
          body,
        }
      },
      invalidatesTags: ['Teams'],
    }),
    updateTeam: builder.mutation({
      query: ({ id, formData }) => {
        const body = formData instanceof FormData ? formData : (() => {
          const fd = new FormData()
          Object.keys(formData).forEach(key => {
            if (formData[key] !== null && formData[key] !== undefined) {
              if (key === 'socialLinks' && typeof formData[key] === 'object') {
                fd.append(key, JSON.stringify(formData[key]))
              } else {
                fd.append(key, formData[key])
              }
            }
          })
          return fd
        })()
        return {
          url: `/api/admin/teams/${id}`,
          method: 'PUT',
          body,
        }
      },
      invalidatesTags: ['Teams'],
    }),
    deleteTeam: builder.mutation({
      query: (id) => ({
        url: `/api/admin/teams/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Teams'],
    }),
    // Project management endpoints
    getAllProjects: builder.query({
      query: (params) => ({
        url: '/api/admin/projects',
        params,
      }),
      providesTags: ['Projects'],
    }),
    getProjectById: builder.query({
      query: (id) => `/api/admin/projects/${id}`,
      providesTags: ['Projects'],
    }),
    createProject: builder.mutation({
      query: (formData) => {
        // formData should already be FormData instance
        return {
          url: '/api/admin/projects',
          method: 'POST',
          body: formData,
        }
      },
      invalidatesTags: ['Projects'],
    }),
    updateProject: builder.mutation({
      query: ({ id, formData }) => {
        // formData should already be FormData instance
        return {
          url: `/api/admin/projects/${id}`,
          method: 'PUT',
          body: formData,
        }
      },
      invalidatesTags: ['Projects'],
    }),
    deleteProject: builder.mutation({
      query: (id) => ({
        url: `/api/admin/projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Projects'],
    }),
    deleteProjectFile: builder.mutation({
      query: ({ projectId, fileUrl }) => ({
        url: `/api/admin/projects/${projectId}/files/${encodeURIComponent(fileUrl)}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Projects'],
    }),
    // Booking management endpoints
    getAllBookings: builder.query({
      query: (params) => ({
        url: '/api/admin/bookings',
        params,
      }),
      providesTags: ['Bookings'],
    }),
    getBookingById: builder.query({
      query: (id) => `/api/admin/bookings/${id}`,
      providesTags: ['Bookings'],
    }),
    updateBookingStatus: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/admin/bookings/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Bookings'],
    }),
    deleteBooking: builder.mutation({
      query: (id) => ({
        url: `/api/admin/bookings/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Bookings'],
    }),
    // Client Project management endpoints
    convertBookingToProject: builder.mutation({
      query: (data) => ({
        url: '/api/admin/client-projects/convert',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Bookings', 'ClientProjects'],
    }),
    assignEmployeesToProject: builder.mutation({
      query: ({ projectId, ...data }) => ({
        url: `/api/admin/client-projects/${projectId}/assign-employees`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ClientProjects'],
    }),
    addWorkStep: builder.mutation({
      query: ({ projectId, ...data }) => ({
        url: `/api/admin/client-projects/${projectId}/work-steps`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['ClientProjects'],
    }),
    updateWorkStep: builder.mutation({
      query: ({ projectId, stepNumber, ...data }) => ({
        url: `/api/admin/client-projects/${projectId}/work-steps/${stepNumber}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ClientProjects'],
    }),
    getAllClientProjects: builder.query({
      query: (params) => ({
        url: '/api/admin/client-projects',
        params,
      }),
      providesTags: ['ClientProjects'],
    }),
    getClientProjectById: builder.query({
      query: (id) => `/api/admin/client-projects/${id}`,
      providesTags: ['ClientProjects'],
    }),
    updateClientProject: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/admin/client-projects/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['ClientProjects'],
    }),
    deleteClientProject: builder.mutation({
      query: (id) => ({
        url: `/api/admin/client-projects/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ClientProjects'],
    }),
    // Notification endpoints
    getAdminNotifications: builder.query({
      query: (params) => ({
        url: '/api/notifications',
        params,
      }),
      providesTags: ['Notifications'],
    }),
    markAsRead: builder.mutation({
      query: (id) => ({
        url: `/api/notifications/${id}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),
    markAllAsRead: builder.mutation({
      query: () => ({
        url: '/api/notifications/read-all',
        method: 'PUT',
      }),
      invalidatesTags: ['Notifications'],
    }),
    deleteNotification: builder.mutation({
      query: (id) => ({
        url: `/api/notifications/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Notifications'],
    }),
    // Meeting endpoints
    getAllMeetings: builder.query({
      query: (params) => ({
        url: '/api/meetings/all',
        params,
      }),
      providesTags: ['Meetings'],
    }),
    getProjectMeetings: builder.query({
      query: (projectId) => `/api/meetings/project/${projectId}`,
      providesTags: ['Meetings'],
    }),
    scheduleMeeting: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/meetings/${id}/schedule`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Meetings', 'ClientProjects', 'Notifications'],
    }),
    cancelMeeting: builder.mutation({
      query: (id) => ({
        url: `/api/meetings/${id}/cancel`,
        method: 'PUT',
      }),
      invalidatesTags: ['Meetings'],
    }),
    // Admin chat/friends endpoints
    getUserFriendsAdmin: builder.query({
      query: (userId) => `/api/admin/chat/users/${userId}/friends`,
      providesTags: ['UserFriends'],
    }),
    getUserChatsAdmin: builder.query({
      query: (userId) => `/api/admin/chat/users/${userId}/chats`,
      providesTags: ['UserChats'],
    }),
    getChatMessagesAdmin: builder.query({
      query: ({ chatId, page = 1, limit = 50 }) => ({
        url: `/api/admin/chat/chats/${chatId}/messages`,
        params: { page, limit },
      }),
      providesTags: ['UserChats'],
    }),
    // Admin Subscription endpoints
    getAllSubscriptionsAdmin: builder.query({
      query: (params) => ({
        url: '/api/admin/subscriptions',
        params,
      }),
      providesTags: ['Subscriptions'],
    }),
    getSubscriptionByIdAdmin: builder.query({
      query: (id) => `/api/admin/subscriptions/${id}`,
      providesTags: (result, error, id) => [{ type: 'Subscriptions', id }],
    }),
    updateSubscriptionAdmin: builder.mutation({
      query: ({ id, ...data }) => ({
        url: `/api/admin/subscriptions/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Subscriptions', id }, 'Subscriptions'],
    }),
    revokeSubscriptionAdmin: builder.mutation({
      query: (id) => ({
        url: `/api/admin/subscriptions/${id}/revoke`,
        method: 'POST',
      }),
      invalidatesTags: ['Subscriptions'],
    }),
    extendSubscriptionAdmin: builder.mutation({
      query: ({ id, additionalMonths }) => ({
        url: `/api/admin/subscriptions/${id}/extend`,
        method: 'POST',
        body: { additionalMonths },
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Subscriptions', id }, 'Subscriptions'],
    }),
    getSubscriptionStatsAdmin: builder.query({
      query: () => '/api/admin/subscriptions/stats',
      providesTags: ['Subscriptions'],
    }),
    exportSubscriptionsAdmin: builder.query({
      query: () => ({
        url: '/api/admin/subscriptions/export',
        responseHandler: (response) => response.text(),
      }),
    }),
    // Admin Banner endpoints
    getAllBannersAdmin: builder.query({
      query: (params) => ({
        url: '/api/admin/banners',
        params,
      }),
      providesTags: ['Banners'],
    }),
    getBannerByIdAdmin: builder.query({
      query: (id) => `/api/admin/banners/${id}`,
      providesTags: (result, error, id) => [{ type: 'Banners', id }],
    }),
    getBannerStatsAdmin: builder.query({
      query: () => '/api/admin/banners/stats',
      providesTags: ['Banners'],
    }),
    getBannerPaymentsAdmin: builder.query({
      query: (params) => ({
        url: '/api/admin/banners/payments',
        params: params || {},
      }),
      providesTags: ['Banners'],
    }),
    createBannerAdmin: builder.mutation({
      query: (formData) => ({
        url: '/api/admin/banners',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Banners'],
    }),
    updateBannerAdmin: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/api/admin/banners/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Banners', id }, 'Banners'],
    }),
    deleteBannerAdmin: builder.mutation({
      query: (id) => ({
        url: `/api/admin/banners/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Banners'],
    }),
    syncBannerInventoryAdmin: builder.mutation({
      query: () => ({
        url: '/api/admin/banners/sync-inventory',
        method: 'POST',
      }),
      invalidatesTags: ['Banners'],
    }),
    // Admin Chat Themes
    getAllChatThemesAdmin: builder.query({
      query: (params) => ({
        url: '/api/admin/chat-themes',
        params: params || {},
      }),
      providesTags: ['ChatThemes'],
    }),
    getChatThemeByIdAdmin: builder.query({
      query: (id) => `/api/admin/chat-themes/${id}`,
      providesTags: (result, error, id) => [{ type: 'ChatThemes', id }],
    }),
    createChatThemeAdmin: builder.mutation({
      query: (formData) => ({
        url: '/api/admin/chat-themes',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['ChatThemes'],
    }),
    updateChatThemeAdmin: builder.mutation({
      query: ({ id, formData }) => ({
        url: `/api/admin/chat-themes/${id}`,
        method: 'PUT',
        body: formData,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'ChatThemes', id }, 'ChatThemes'],
    }),
    deleteChatThemeAdmin: builder.mutation({
      query: (id) => ({
        url: `/api/admin/chat-themes/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ChatThemes'],
    }),
    // Admin Font endpoints
    getAllFontsAdmin: builder.query({
      query: () => '/api/admin/fonts',
      providesTags: ['Fonts'],
    }),
    createFontAdmin: builder.mutation({
      query: (data) => ({
        url: '/api/admin/fonts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Fonts'],
    }),
    updateFontAdmin: builder.mutation({
      query: ({ id, data }) => ({
        url: `/api/admin/fonts/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: (result, error, { id }) => [{ type: 'Fonts', id }, 'Fonts'],
    }),
    deleteFontAdmin: builder.mutation({
      query: (id) => ({
        url: `/api/admin/fonts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Fonts'],
    }),
    // Admin Story endpoints
    getAllStoriesAdmin: builder.query({
      query: (params) => ({
        url: '/api/admin/stories',
        params,
      }),
      providesTags: ['Stories'],
    }),
    getStoryByIdAdmin: builder.query({
      query: (id) => `/api/admin/stories/${id}`,
      providesTags: (result, error, id) => [{ type: 'Stories', id }],
    }),
    getStoryStats: builder.query({
      query: () => '/api/admin/stories/stats',
      providesTags: ['Stories'],
    }),
    deleteStoryAdmin: builder.mutation({
      query: (id) => ({
        url: `/api/admin/stories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Stories'],
    }),
    blockUserFromStories: builder.mutation({
      query: ({ userId, blocked }) => ({
        url: `/api/admin/stories/${userId}/block`,
        method: 'POST',
        body: { blocked },
      }),
      invalidatesTags: ['Stories', 'Users'],
    }),
    getStoryInteractions: builder.query({
      query: (id) => `/api/admin/stories/${id}/interactions`,
      providesTags: (result, error, id) => [{ type: 'Stories', id: `${id}-interactions` }],
    }),
    removeStoryAdmin: builder.mutation({
      query: ({ id, reason, warnUser }) => ({
        url: `/api/admin/stories/${id}/remove`,
        method: 'POST',
        body: { reason, warnUser },
      }),
      invalidatesTags: ['Stories'],
    }),
    // Admin Post endpoints
    getAllPostsAdmin: builder.query({
      query: (params) => ({
        url: '/api/admin/posts',
        params,
      }),
      providesTags: ['Posts'],
    }),
    getPostByIdAdmin: builder.query({
      query: (id) => `/api/admin/posts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Posts', id }],
    }),
    getPostStatsAdmin: builder.query({
      query: () => '/api/admin/posts/stats',
      providesTags: ['Posts'],
    }),
    removePostAdmin: builder.mutation({
      query: ({ id, reason, warnUser }) => ({
        url: `/api/admin/posts/${id}/remove`,
        method: 'POST',
        body: { reason, warnUser },
      }),
      invalidatesTags: ['Posts'],
    }),
    restorePostAdmin: builder.mutation({
      query: (id) => ({
        url: `/api/admin/posts/${id}/restore`,
        method: 'POST',
      }),
      invalidatesTags: ['Posts'],
    }),
    deletePostPermanentlyAdmin: builder.mutation({
      query: (id) => ({
        url: `/api/admin/posts/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Posts'],
    }),
    warnUserForPostAdmin: builder.mutation({
      query: ({ id, reason }) => ({
        url: `/api/admin/posts/${id}/warn`,
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['Posts', 'Users'],
    }),
  }),
})

export const {
  useLoginAdminMutation,
  useGetCurrentAdminQuery,
  useLogoutAdminMutation,
  useGetAllUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useToggleUserStatusMutation,
  useGetAllTeamsQuery,
  useGetTeamByIdQuery,
  useCreateTeamMutation,
  useUpdateTeamMutation,
  useDeleteTeamMutation,
  useGetAllProjectsQuery,
  useGetProjectByIdQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
  useDeleteProjectFileMutation,
  useUpdateAdminProfileMutation,
  useGetAllBookingsQuery,
  useGetBookingByIdQuery,
  useUpdateBookingStatusMutation,
  useDeleteBookingMutation,
  useConvertBookingToProjectMutation,
  useGetAllClientProjectsQuery,
  useGetClientProjectByIdQuery,
  useUpdateClientProjectMutation,
  useDeleteClientProjectMutation,
  useAssignEmployeesToProjectMutation,
  useAddWorkStepMutation,
  useUpdateWorkStepMutation,
  useGetAdminNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useGetAllMeetingsQuery,
  useGetProjectMeetingsQuery,
  useScheduleMeetingMutation,
  useCancelMeetingMutation,
  useGetUserFriendsAdminQuery,
  useGetUserChatsAdminQuery,
  useGetChatMessagesAdminQuery,
  useGetAdminStatsQuery,
  useGetAllSubscriptionsAdminQuery,
  useGetSubscriptionByIdAdminQuery,
  useUpdateSubscriptionAdminMutation,
  useRevokeSubscriptionAdminMutation,
  useExtendSubscriptionAdminMutation,
  useGetSubscriptionStatsAdminQuery,
  useExportSubscriptionsAdminQuery,
  // Admin Banner hooks
  useGetAllBannersAdminQuery,
  useGetBannerByIdAdminQuery,
  useGetBannerStatsAdminQuery,
  useGetBannerPaymentsAdminQuery,
  useCreateBannerAdminMutation,
  useUpdateBannerAdminMutation,
  useDeleteBannerAdminMutation,
  useSyncBannerInventoryAdminMutation,
  // Chat Themes hooks
  useGetAllChatThemesAdminQuery,
  useGetChatThemeByIdAdminQuery,
  useCreateChatThemeAdminMutation,
  useUpdateChatThemeAdminMutation,
  useDeleteChatThemeAdminMutation,
  // Font hooks
  useGetAllFontsAdminQuery,
  useCreateFontAdminMutation,
  useUpdateFontAdminMutation,
  useDeleteFontAdminMutation,
  // Admin Story hooks
  useGetAllStoriesAdminQuery,
  useGetStoryByIdAdminQuery,
  useGetStoryStatsQuery,
  useDeleteStoryAdminMutation,
  useBlockUserFromStoriesMutation,
  useGetStoryInteractionsQuery,
  useRemoveStoryAdminMutation,
  // Admin Post hooks
  useGetAllPostsAdminQuery,
  useGetPostByIdAdminQuery,
  useGetPostStatsAdminQuery,
  useRemovePostAdminMutation,
  useRestorePostAdminMutation,
  useDeletePostPermanentlyAdminMutation,
  useWarnUserForPostAdminMutation,
} = adminApi

