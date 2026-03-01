import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'
import { getAuthToken } from '../../utils/auth'
import { getBaseUrl, runFormDataFetch } from './baseApi'

const baseQuery = fetchBaseQuery({
  baseUrl: getBaseUrl(),
  credentials: 'include',
  prepareHeaders: (headers) => {
    const token = getAuthToken()
    if (token) headers.set('Authorization', `Bearer ${token}`)
    return headers
  },
})

const baseQueryWithFormData = async (args, api, extraOptions) => {
  if (args.body instanceof FormData) return runFormDataFetch(args, getAuthToken)
  const result = await baseQuery(args, api, extraOptions)
  const path = typeof args.url === 'string' ? args.url : args.url?.url || ''
  if (result.error?.status === 404) {
    if (path.includes('/api/user/posts/saved') && !path.includes('/folder')) return { data: { data: { savedPosts: [] } } }
    if (path.includes('/api/user/posts/') && path.endsWith('/view')) return { data: { data: { counted: false, viewCount: 0 } } }
    if (path.includes('/api/search')) return { data: { success: true, data: { results: { users: [], posts: [], tickets: [] }, counts: { total: 0, users: 0, posts: 0, tickets: 0 } } } }
  }
  if (result.error?.status === 403) {
    if (path.includes('/api/user/posts/user/')) return { data: { data: [], success: true, isPrivateProfile: true } }
    if (path.includes('/api/user/chat/chat/') && !path.includes('/messages') && !path.includes('/settings') && !path.includes('/read')) return { data: { privateAccount: true, message: result.error?.data?.message } }
  }
  return result
}

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: baseQueryWithFormData,
  tagTypes: ['User', 'Projects', 'DemoBookings', 'ClientProjects', 'Notifications', 'Meetings', 'Friends', 'Chats', 'Messages', 'ChatSettings', 'ChatThemes', 'ChatPrefs', 'Posts', 'Memories', 'Subscriptions', 'Banners', 'Fonts', 'Stories', 'Search'],
  endpoints: (builder) => ({
    registerUser: builder.mutation({
      query: (data) => ({
        url: '/api/user/register',
        method: 'POST',
        body: data,
      }),
    }),
    loginUser: builder.mutation({
      query: (data) => ({
        url: '/api/user/login',
        method: 'POST',
        body: data,
      }),
    }),
    getCurrentUser: builder.query({
      query: () => '/api/user/me',
      providesTags: ['User'],
    }),
    getVapidPublicKey: builder.query({
      query: () => '/api/user/push-subscription/vapid-public-key',
      extraOptions: { maxRetries: 2 },
    }),
    savePushSubscription: builder.mutation({
      query: (body) => ({
        url: '/api/user/push-subscription',
        method: 'POST',
        body,
      }),
    }),
    sendTestPush: builder.mutation({
      query: () => ({
        url: '/api/user/push-subscription/test',
        method: 'POST',
      }),
    }),
    getUserById: builder.query({
      query: (userId) => `/api/user/${userId}`,
      providesTags: (result, error, userId) => [{ type: 'User', id: userId }],
    }),
    logoutUser: builder.mutation({
      query: () => ({
        url: '/api/user/logout',
        method: 'POST',
      }),
    }),
    updateUserProfile: builder.mutation({
      query: (data) => ({
        url: '/api/user/profile',
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['User'],
    }),
    // Project endpoints
    getAllActiveProjects: builder.query({
      query: (params) => ({
        url: '/api/user/projects',
        params,
      }),
      providesTags: ['Projects'],
    }),
    getProjectById: builder.query({
      query: (id) => `/api/user/projects/${id}`,
      providesTags: ['Projects'],
    }),
    // Demo booking endpoints
    createDemoBooking: builder.mutation({
      query: (data) => ({
        url: '/api/user/demo-bookings',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['DemoBookings'],
    }),
    getUserBookings: builder.query({
      query: (params) => ({
        url: '/api/user/demo-bookings',
        params,
      }),
      providesTags: ['DemoBookings'],
    }),
    // Client Project endpoints
    getUserClientProjects: builder.query({
      query: (params) => ({
        url: '/api/user/client-projects',
        params,
      }),
      providesTags: ['ClientProjects'],
    }),
    getClientProjectById: builder.query({
      query: (id) => `/api/user/client-projects/${id}`,
      providesTags: ['ClientProjects'],
    }),
    addClientNote: builder.mutation({
      query: ({ id, note }) => ({
        url: `/api/user/client-projects/${id}/notes`,
        method: 'POST',
        body: { note },
      }),
      invalidatesTags: ['ClientProjects'],
    }),
    // Notification endpoints
    getUserNotifications: builder.query({
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
    requestMeeting: builder.mutation({
      query: (data) => ({
        url: '/api/meetings/request',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Meetings', 'ClientProjects'],
    }),
    getProjectMeetings: builder.query({
      query: (projectId) => `/api/meetings/project/${projectId}`,
      providesTags: ['Meetings'],
    }),
    // Friends endpoints
    getUserSuggestions: builder.query({
      query: (params) => ({
        url: '/api/user/friends/suggestions',
        params,
      }),
      providesTags: ['Friends'],
    }),
    getUsersNearYou: builder.query({
      query: (params) => ({
        url: '/api/user/friends/near-you',
        params,
      }),
      providesTags: ['Friends'],
    }),
    // Global search
    globalSearch: builder.query({
      query: ({ q, type, limit = 10 }) => ({
        url: '/api/search',
        params: { q, type, limit },
      }),
      providesTags: ['Search'],
    }),
    getFriendRequests: builder.query({
      query: (type = 'received') => ({
        url: '/api/user/friends/requests',
        params: { type },
      }),
      providesTags: ['Friends'],
    }),
    getUserFriends: builder.query({
      query: () => '/api/user/friends/friends',
      providesTags: ['Friends'],
    }),
    sendFriendRequest: builder.mutation({
      query: (data) => ({
        url: '/api/user/friends/send',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Friends'],
    }),
    acceptFriendRequest: builder.mutation({
      query: (requestId) => ({
        url: `/api/user/friends/accept/${requestId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Friends', 'Chats'],
    }),
    rejectFriendRequest: builder.mutation({
      query: (requestId) => ({
        url: `/api/user/friends/reject/${requestId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Friends'],
    }),
    cancelFriendRequest: builder.mutation({
      query: (requestId) => ({
        url: `/api/user/friends/cancel/${requestId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['Friends'],
    }),
    unfriend: builder.mutation({
      query: (friendId) => ({
        url: `/api/user/friends/unfriend/${friendId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Friends', 'Chats'],
    }),
    // Follow/Unfollow endpoints
    followUser: builder.mutation({
      query: (userId) => ({
        url: `/api/user/friends/follow/${userId}`,
        method: 'POST',
      }),
      invalidatesTags: (result, error, userId) => ['Friends', { type: 'User', id: userId }],
    }),
    unfollowUser: builder.mutation({
      query: (userId) => ({
        url: `/api/user/friends/unfollow/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, userId) => ['Friends', { type: 'User', id: userId }],
    }),
    getFollowers: builder.query({
      query: (params = {}) => ({
        url: '/api/user/friends/followers',
        params,
      }),
      providesTags: ['Friends'],
    }),
    getFollowing: builder.query({
      query: (params = {}) => ({
        url: '/api/user/friends/following',
        params,
      }),
      providesTags: ['Friends'],
    }),
    getFollowStats: builder.query({
      query: () => '/api/user/friends/stats',
      providesTags: ['Friends'],
    }),
    // Chat endpoints
    getOrCreateChat: builder.query({
      query: (userId) => `/api/user/chat/chat/${userId}`,
      providesTags: ['Chats'],
    }),
    getUserChats: builder.query({
      query: () => '/api/user/chat/chats',
      providesTags: ['Chats'],
    }),
    getChatMessages: builder.query({
      query: ({ chatId, page = 1, limit = 50 }) => ({
        url: `/api/user/chat/chat/${chatId}/messages`,
        params: { page, limit },
      }),
      providesTags: ['Messages'],
    }),
    sendMessage: builder.mutation({
      query: (data) => ({
        url: '/api/user/chat/message',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Messages', 'Chats'],
    }),
    deleteMessage: builder.mutation({
      query: ({ messageId, deleteFor = 'me' }) => ({
        url: `/api/user/chat/message/${messageId}`,
        method: 'DELETE',
        params: { deleteFor },
        body: { deleteFor },
      }),
      invalidatesTags: ['Messages', 'Chats'],
    }),
    getChatThemes: builder.query({
      query: () => '/api/user/chat/chat-themes',
      providesTags: ['ChatThemes'],
    }),
    createChatThemeOrder: builder.mutation({
      query: (body) => ({
        url: '/api/user/chat/chat-themes/create-order',
        method: 'POST',
        body,
      }),
    }),
    verifyChatThemePayment: builder.mutation({
      query: (body) => ({
        url: '/api/user/chat/chat-themes/verify-payment',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ChatThemes'],
    }),
    purchaseChatTheme: builder.mutation({
      query: (body) => ({
        url: '/api/user/chat/chat-themes/purchase',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['ChatThemes'],
    }),
    getChatSettings: builder.query({
      query: (chatId) => `/api/user/chat/chat/${chatId}/settings`,
      providesTags: (result, error, chatId) => [{ type: 'ChatSettings', id: chatId }],
    }),
    updateChatSettings: builder.mutation({
      query: ({ chatId, ...body }) => ({
        url: `/api/user/chat/chat/${chatId}/settings`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: (result, error, { chatId }) => [{ type: 'ChatSettings', id: chatId }],
    }),
    markMessagesAsRead: builder.mutation({
      query: (chatId) => ({
        url: `/api/user/chat/chat/${chatId}/read`,
        method: 'PUT',
      }),
      invalidatesTags: ['Messages'],
    }),
    getUnreadCount: builder.query({
      query: () => '/api/user/chat/unread-count',
      providesTags: ['Messages'],
    }),
    deleteChat: builder.mutation({
      query: (chatId) => ({
        url: `/api/user/chat/chat/${chatId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Chats'],
    }),
    getChatPrefs: builder.query({
      query: () => '/api/user/chat/prefs',
      providesTags: ['ChatPrefs'],
    }),
    updateArchive: builder.mutation({
      query: (body) => ({
        url: '/api/user/chat/prefs/archive',
        method: 'PUT',
        body: { userIds: body.userIds ?? (body.userId ? [body.userId] : []) },
      }),
      invalidatesTags: ['ChatPrefs'],
    }),
    unarchiveChat: builder.mutation({
      query: (userId) => ({
        url: `/api/user/chat/prefs/archive/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ChatPrefs'],
    }),
    setChatCleared: builder.mutation({
      query: (userId) => ({
        url: `/api/user/chat/prefs/cleared/${userId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['ChatPrefs'],
    }),
    unclearChat: builder.mutation({
      query: (userId) => ({
        url: `/api/user/chat/prefs/cleared/${userId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['ChatPrefs'],
    }),
    toggleBlockUser: builder.mutation({
      query: (userId) => ({
        url: `/api/user/chat/prefs/block/${userId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['ChatPrefs'],
    }),
    togglePinChat: builder.mutation({
      query: (userId) => ({
        url: `/api/user/chat/prefs/pin/${userId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['ChatPrefs'],
    }),
    toggleMuteChat: builder.mutation({
      query: (userId) => ({
        url: `/api/user/chat/prefs/mute/${userId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['ChatPrefs'],
    }),
    toggleCloseFriend: builder.mutation({
      query: (userId) => ({
        url: `/api/user/chat/prefs/close-friend/${userId}`,
        method: 'PUT',
      }),
      invalidatesTags: ['ChatPrefs'],
    }),
    createChatGroup: builder.mutation({
      query: (body) => ({
        url: '/api/user/chat/prefs/groups',
        method: 'POST',
        body: { name: body.name, memberIds: body.memberIds ?? [] },
      }),
      invalidatesTags: ['ChatPrefs'],
    }),
    // Post endpoints
    getFeed: builder.query({
      query: (params = {}) => ({
        url: '/api/user/posts/feed',
        params,
      }),
      providesTags: ['Posts'],
    }),
    getTrendingSections: builder.query({
      query: () => '/api/user/posts/trending-sections',
      providesTags: ['Posts'],
    }),
    getFollowingFeed: builder.query({
      query: (params = {}) => ({
        url: '/api/user/posts/following',
        params,
      }),
      providesTags: ['Posts'],
    }),
    getUserPosts: builder.query({
      query: ({ userId, archived = false, ...params }) => ({
        url: `/api/user/posts/user/${userId}`,
        params: { ...params, archived: archived.toString() },
      }),
      providesTags: ['Posts'],
    }),
    createPost: builder.mutation({
      query: (data) => ({
        url: '/api/user/posts',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Posts'],
    }),
    updatePost: builder.mutation({
      query: ({ postId, data }) => ({
        url: `/api/user/posts/${postId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Posts'],
    }),
    getPost: builder.query({
      query: (postId) => ({
        url: `/api/user/posts/${postId}`,
        method: 'GET',
      }),
      providesTags: (result, error, postId) => [{ type: 'Posts', id: postId }],
    }),
    toggleLike: builder.mutation({
      query: (postId) => ({
        url: `/api/user/posts/${postId}/like`,
        method: 'POST',
      }),
      invalidatesTags: ['Posts'],
    }),
    addComment: builder.mutation({
      query: ({ postId, content }) => ({
        url: `/api/user/posts/${postId}/comment`,
        method: 'POST',
        body: { content },
      }),
      invalidatesTags: ['Posts'],
    }),
    incrementPostView: builder.mutation({
      query: ({ postId, viewDuration = 0 }) => ({
        url: `/api/user/posts/${postId}/view`,
        method: 'POST',
        body: { viewDuration },
      }),
      // Don't invalidate Posts tag - view count updates don't need to refetch all posts
      // View count is updated locally via setTotalViewCount in usePostViewTracker hook
    }),
    deletePost: builder.mutation({
      query: (postId) => ({
        url: `/api/user/posts/${postId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Posts'],
    }),
    archivePost: builder.mutation({
      query: (postId) => ({
        url: `/api/user/posts/${postId}/archive`,
        method: 'POST',
      }),
      invalidatesTags: ['Posts'],
    }),
    unarchivePost: builder.mutation({
      query: (postId) => ({
        url: `/api/user/posts/${postId}/unarchive`,
        method: 'POST',
      }),
      invalidatesTags: ['Posts'],
    }),
    savePost: builder.mutation({
      query: ({ postId, folderTitle }) => ({
        url: `/api/user/posts/${postId}/save`,
        method: 'POST',
        body: { folderTitle },
      }),
      invalidatesTags: ['Posts'],
    }),
    unsavePost: builder.mutation({
      query: (postId) => ({
        url: `/api/user/posts/${postId}/unsave`,
        method: 'POST',
      }),
      invalidatesTags: ['Posts'],
    }),
    getSavedPosts: builder.query({
      query: ({ sort, folderTitle } = {}) => ({
        url: '/api/user/posts/saved',
        params: { sort, folderTitle },
      }),
      providesTags: ['Posts'],
    }),
    updateSavedPostFolder: builder.mutation({
      query: ({ postId, folderTitle }) => ({
        url: `/api/user/posts/saved/${postId}/folder`,
        method: 'PUT',
        body: { folderTitle },
      }),
      invalidatesTags: ['Posts'],
    }),
    unarchivePost: builder.mutation({
      query: (postId) => ({
        url: `/api/user/posts/${postId}/unarchive`,
        method: 'POST',
      }),
      invalidatesTags: ['Posts'],
    }),
    // Memories (private to user, not in feed)
    getMemories: builder.query({
      query: (params = {}) => ({
        url: '/api/user/memories',
        params,
      }),
      providesTags: ['Memories'],
    }),
    createMemory: builder.mutation({
      query: (data) => ({
        url: '/api/user/memories',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Memories'],
    }),
    updateMemory: builder.mutation({
      query: ({ memoryId, data }) => ({
        url: `/api/user/memories/${memoryId}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Memories'],
    }),
    deleteMemory: builder.mutation({
      query: (memoryId) => ({
        url: `/api/user/memories/${memoryId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Memories'],
    }),
    // Subscription endpoints
    getPlans: builder.query({
      query: () => '/api/user/subscriptions/plans',
      providesTags: ['Subscriptions'],
    }),
    getMySubscription: builder.query({
      query: () => '/api/user/subscriptions/my-subscription',
      providesTags: ['Subscriptions'],
    }),
    createOrder: builder.mutation({
      query: (data) => ({
        url: '/api/user/subscriptions/create-order',
        method: 'POST',
        body: data,
      }),
    }),
    verifyPayment: builder.mutation({
      query: (data) => ({
        url: '/api/user/subscriptions/verify-payment',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Subscriptions', 'User'],
    }),
    cancelSubscription: builder.mutation({
      query: () => ({
        url: '/api/user/subscriptions/cancel',
        method: 'POST',
      }),
      invalidatesTags: ['Subscriptions', 'User'],
    }),
    // Banner endpoints
    getAllBanners: builder.query({
      query: (params) => ({
        url: '/api/banners',
        params,
      }),
      providesTags: ['Banners'],
    }),
    getBannerById: builder.query({
      query: (id) => `/api/banners/${id}`,
      providesTags: (result, error, id) => [{ type: 'Banners', id }],
    }),
    getUserEquippedBanner: builder.query({
      query: (userId) => `/api/banners/user/${userId}/equipped`,
      providesTags: (result, error, userId) => [
        { type: 'Banners', id: 'EQUIPPED' },
        { type: 'User', id: userId },
      ],
    }),
    getUserInventory: builder.query({
      query: () => '/api/banners/user/inventory',
      providesTags: ['Banners'],
    }),
    getMyBannerPayments: builder.query({
      query: () => '/api/banners/user/payments',
      providesTags: ['Banners'],
    }),
    createBannerOrder: builder.mutation({
      query: (body) => ({
        url: '/api/banners/user/create-order',
        method: 'POST',
        body,
      }),
    }),
    verifyBannerPayment: builder.mutation({
      query: (body) => ({
        url: '/api/banners/user/verify-payment',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Banners', 'User'],
    }),
    claimFreeBanner: builder.mutation({
      query: (body) => ({
        url: '/api/banners/user/claim-free',
        method: 'POST',
        body: typeof body === 'string' ? { bannerId: body } : body,
      }),
      invalidatesTags: ['Banners', 'User'],
    }),
    // Direct purchase is disabled; ownership is via Razorpay only. This mutation redirects to payment.
    purchaseBanner: builder.mutation({
      async queryFn(bannerId, api, extraOptions, baseQuery) {
        const result = await baseQuery({ url: `/api/banners/${bannerId}` });
        const banner = result.data?.data;
        if (banner) {
          try {
            sessionStorage.setItem('bannerPayment_banner', JSON.stringify(banner));
          } catch (_) {}
          if (typeof window !== 'undefined') {
            window.location.href = '/user/banner-store/payment';
          }
          return { data: { redirected: true } };
        }
        return {
          error: {
            status: 404,
            data: { message: 'Banner not found', code: 'BANNER_PAYMENT_REQUIRED' },
          },
        };
      },
      invalidatesTags: ['Banners', 'User'],
    }),
    equipBanner: builder.mutation({
      query: (id) => ({
        url: `/api/banners/user/equip/${id}`,
        method: 'POST',
      }),
      invalidatesTags: [
        'Banners',
        { type: 'Banners', id: 'EQUIPPED' },
        'User',
      ],
    }),
    unequipBanner: builder.mutation({
      query: () => ({
        url: '/api/banners/user/unequip',
        method: 'POST',
      }),
      invalidatesTags: [
        'Banners',
        { type: 'Banners', id: 'EQUIPPED' },
        'User',
      ],
    }),
    // Font endpoints
    getAllFonts: builder.query({
      query: (params) => ({
        url: '/api/fonts',
        params,
      }),
      providesTags: ['Fonts'],
    }),
    getFontById: builder.query({
      query: (id) => `/api/fonts/${id}`,
      providesTags: (result, error, id) => [{ type: 'Fonts', id }],
    }),
    getUserFontInventory: builder.query({
      query: () => '/api/fonts/user/inventory',
      providesTags: ['Fonts'],
    }),
    purchaseFont: builder.mutation({
      query: (id) => ({
        url: `/api/fonts/user/purchase/${id}`,
        method: 'POST',
      }),
      invalidatesTags: ['Fonts', 'User'],
    }),
    equipFont: builder.mutation({
      query: (id) => ({
        url: `/api/fonts/user/equip/${id}`,
        method: 'POST',
      }),
      invalidatesTags: ['Fonts', 'User'],
    }),
    unequipFont: builder.mutation({
      query: () => ({
        url: '/api/fonts/user/unequip',
        method: 'POST',
      }),
      invalidatesTags: ['Fonts', 'User'],
    }),
    // Story endpoints
    getStoriesFeed: builder.query({
      query: () => '/api/user/stories/feed',
      providesTags: ['Stories'],
    }),
    getMyStories: builder.query({
      query: () => '/api/user/stories/my-stories',
      providesTags: ['Stories'],
    }),
    getStoryById: builder.query({
      query: (id) => `/api/user/stories/${id}`,
      providesTags: (result, error, id) => [{ type: 'Stories', id }],
    }),
    createStory: builder.mutation({
      query: (formData) => ({
        url: '/api/user/stories',
        method: 'POST',
        body: formData,
      }),
      invalidatesTags: ['Stories'],
    }),
    viewStory: builder.mutation({
      query: ({ id, duration }) => ({
        url: `/api/user/stories/${id}/view`,
        method: 'POST',
        body: { duration },
      }),
      invalidatesTags: (result, error, arg) =>
        arg?.id ? [{ type: 'Stories', id: `${arg.id}-viewers` }, 'Stories'] : ['Stories'],
    }),
    reactToStory: builder.mutation({
      query: ({ id, emoji }) => ({
        url: `/api/user/stories/${id}/react`,
        method: 'POST',
        body: { emoji },
      }),
      invalidatesTags: ['Stories'],
    }),
    replyToStory: builder.mutation({
      query: ({ id, message }) => ({
        url: `/api/user/stories/${id}/reply`,
        method: 'POST',
        body: { message },
      }),
      invalidatesTags: ['Stories'],
    }),
    getStoryViewers: builder.query({
      query: (id) => `/api/user/stories/${id}/viewers`,
      providesTags: (result, error, id) => [{ type: 'Stories', id: `${id}-viewers` }],
    }),
    deleteStory: builder.mutation({
      query: (id) => ({
        url: `/api/user/stories/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Stories'],
    }),
  }),
})

export const {
  useRegisterUserMutation,
  useLoginUserMutation,
  useGetCurrentUserQuery,
  useGetVapidPublicKeyQuery,
  useSavePushSubscriptionMutation,
  useSendTestPushMutation,
  useGetUserByIdQuery,
  useLogoutUserMutation,
  useUpdateUserProfileMutation,
  useGetAllActiveProjectsQuery,
  useGetProjectByIdQuery,
  useCreateDemoBookingMutation,
  useGetUserBookingsQuery,
  useGetUserClientProjectsQuery,
  useGetClientProjectByIdQuery,
  useAddClientNoteMutation,
  useGetUserNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllAsReadMutation,
  useDeleteNotificationMutation,
  useRequestMeetingMutation,
  useGetProjectMeetingsQuery,
  // Friends hooks
  useGetUserSuggestionsQuery,
  useGetFriendRequestsQuery,
  useGetUserFriendsQuery,
  useSendFriendRequestMutation,
  useAcceptFriendRequestMutation,
  useRejectFriendRequestMutation,
  useCancelFriendRequestMutation,
  useUnfriendMutation,
  useFollowUserMutation,
  useUnfollowUserMutation,
  useGetFollowersQuery,
  useGetFollowingQuery,
  useGetFollowStatsQuery,
  // Chat hooks
  useGetOrCreateChatQuery,
  useGetUserChatsQuery,
  useGetChatMessagesQuery,
  useSendMessageMutation,
  useDeleteMessageMutation,
  useGetChatThemesQuery,
  useCreateChatThemeOrderMutation,
  useVerifyChatThemePaymentMutation,
  usePurchaseChatThemeMutation,
  useGetChatSettingsQuery,
  useUpdateChatSettingsMutation,
  useMarkMessagesAsReadMutation,
  useGetUnreadCountQuery,
  useDeleteChatMutation,
  useGetChatPrefsQuery,
  useUpdateArchiveMutation,
  useUnarchiveChatMutation,
  useSetChatClearedMutation,
  useUnclearChatMutation,
  useToggleBlockUserMutation,
  useTogglePinChatMutation,
  useToggleMuteChatMutation,
  useToggleCloseFriendMutation,
  useCreateChatGroupMutation,
  // Post hooks
  useGetFeedQuery,
  useGetTrendingSectionsQuery,
  useGetFollowingFeedQuery,
  useGetUserPostsQuery,
  useGetPostQuery,
  useCreatePostMutation,
  useUpdatePostMutation,
  useToggleLikeMutation,
  useSavePostMutation,
  useUnsavePostMutation,
  useGetSavedPostsQuery,
  useUpdateSavedPostFolderMutation,
  useAddCommentMutation,
  useIncrementPostViewMutation,
  useDeletePostMutation,
  useArchivePostMutation,
  useUnarchivePostMutation,
  useGetMemoriesQuery,
  useCreateMemoryMutation,
  useUpdateMemoryMutation,
  useDeleteMemoryMutation,
  useGetPlansQuery,
  useGetMySubscriptionQuery,
  useCreateOrderMutation,
  useVerifyPaymentMutation,
  useCancelSubscriptionMutation,
  // Banner hooks
  useGetAllBannersQuery,
  useGetBannerByIdQuery,
  useGetUserEquippedBannerQuery,
  useGetUserInventoryQuery,
  useGetMyBannerPaymentsQuery,
  useCreateBannerOrderMutation,
  useVerifyBannerPaymentMutation,
  useClaimFreeBannerMutation,
  usePurchaseBannerMutation,
  useEquipBannerMutation,
  useUnequipBannerMutation,
  useGetAllFontsQuery,
  useGetFontByIdQuery,
  useGetUserFontInventoryQuery,
  usePurchaseFontMutation,
  useEquipFontMutation,
  useUnequipFontMutation,
  // Story hooks
  useGetStoriesFeedQuery,
  useGetMyStoriesQuery,
  useGetStoryByIdQuery,
  useCreateStoryMutation,
  useViewStoryMutation,
  useReactToStoryMutation,
  useReplyToStoryMutation,
  useGetStoryViewersQuery,
  useDeleteStoryMutation,
  useGetUsersNearYouQuery,
    // Search
    useGlobalSearchQuery,
} = userApi

