import { io } from 'socket.io-client'
import { getUserInfo, getAdminInfo, getAuthToken } from './auth'
import Cookies from 'js-cookie'
import { getApiUrl } from './apiUrl'

let socket = null

export const initializeSocket = () => {
  if (socket?.connected) {
    return socket
  }

  const userInfo = getUserInfo()
  const adminInfo = getAdminInfo()
  const role = userInfo?.role || adminInfo?.role
  // Cookie may be missing in PWA after reopen; use stored token so socket still authenticates
  const token = (role === 'admin'
    ? Cookies.get('adminToken')
    : Cookies.get('userToken')) || getAuthToken()

  // Use explicit backend URL for Socket.IO (doesn't work well with Vite proxy)
  const API_URL = getApiUrl()

  socket = io(API_URL, {
    auth: {
      token: token
    },
    withCredentials: true,
    transports: ['websocket', 'polling']
  })

  socket.on('connect', () => {
    console.log('Socket connected:', socket.id)
    
    // Join admin room if admin
    if (role === 'admin') {
      socket.emit('join-admin-room')
    }
  })

  socket.on('disconnect', (reason) => {
    console.log('Socket disconnected:', reason)
  })

  socket.on('connect_error', (error) => {
    // Only log if it's not a manual disconnect
    if (error.message !== 'Authentication failed' && !socket.disconnected) {
      console.error('Socket connection error:', error)
    }
  })

  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
  }
}

export const getSocket = () => {
  if (!socket || !socket.connected) {
    return initializeSocket()
  }
  return socket
}

export default socket

