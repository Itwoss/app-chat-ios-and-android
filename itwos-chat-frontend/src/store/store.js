import { configureStore } from '@reduxjs/toolkit'
import { userApi } from './api/userApi'
import { adminApi } from './api/adminApi'
import { employeeApi } from './api/employeeApi'
import { supportApi } from './api/supportApi'
import { abuseApi } from './api/abuseApi'
import { eventApi } from './api/eventApi'
import { countApi } from './api/countApi'
import { leaderboardApi } from './api/leaderboardApi'
import { adminRuleApi } from './api/adminRuleApi'
import userSlice from './slices/userSlice'
import adminSlice from './slices/adminSlice'

export const store = configureStore({
  reducer: {
    user: userSlice,
    admin: adminSlice,
    [userApi.reducerPath]: userApi.reducer,
    [adminApi.reducerPath]: adminApi.reducer,
    [employeeApi.reducerPath]: employeeApi.reducer,
    [supportApi.reducerPath]: supportApi.reducer,
    [abuseApi.reducerPath]: abuseApi.reducer,
    [eventApi.reducerPath]: eventApi.reducer,
    [countApi.reducerPath]: countApi.reducer,
    [leaderboardApi.reducerPath]: leaderboardApi.reducer,
    [adminRuleApi.reducerPath]: adminRuleApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      userApi.middleware,
      adminApi.middleware,
      employeeApi.middleware,
      supportApi.middleware,
      abuseApi.middleware,
      eventApi.middleware,
      countApi.middleware,
      leaderboardApi.middleware,
      adminRuleApi.middleware
    ),
})

