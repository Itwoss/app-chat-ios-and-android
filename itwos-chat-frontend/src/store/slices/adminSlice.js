import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  id: null,
  name: null,
  email: null,
  role: null,
  isAuthenticated: false,
}

const adminSlice = createSlice({
  name: 'admin',
  initialState,
  reducers: {
    setAdmin: (state, action) => {
      state.id = action.payload.id
      state.name = action.payload.name
      state.email = action.payload.email
      state.role = action.payload.role
      state.isAuthenticated = true
    },
    clearAdmin: (state) => {
      state.id = null
      state.name = null
      state.email = null
      state.role = null
      state.isAuthenticated = false
    },
  },
})

export const { setAdmin, clearAdmin } = adminSlice.actions
export default adminSlice.reducer

