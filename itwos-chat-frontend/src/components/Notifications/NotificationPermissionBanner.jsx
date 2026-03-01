import { useState, useEffect, useCallback, useRef } from 'react'
import { Box, Button, HStack, Text, useToast } from '@chakra-ui/react'
import { Bell } from 'lucide-react'
import { useGetVapidPublicKeyQuery, useSavePushSubscriptionMutation } from '../../store/api/userApi'
import { urlBase64ToUint8Array } from '../../utils/pushUtils'

const DISMISSED_KEY = 'notification-prompt-dismissed'
const DISMISSED_AGAIN_AFTER_MS = 7 * 24 * 60 * 60 * 1000 // Show again after 7 days if still default

export default function NotificationPermissionBanner() {
  const [visible, setVisible] = useState(false)
  const [checkDone, setCheckDone] = useState(false)
  const toast = useToast()
  const { data: vapidData, isError: vapidError, error: vapidErrorDetail } = useGetVapidPublicKeyQuery(undefined, { skip: false })
  const [saveSubscription, { isLoading: isSaving }] = useSavePushSubscriptionMutation()
  const ensuredRef = useRef(false)
  const vapidWarnShown = useRef(false)

  const subscribeAndSend = useCallback(
    async (publicKey) => {
      if (!publicKey) return false
      try {
        let reg = await navigator.serviceWorker.getRegistration()
        if (!reg) {
          reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
          await new Promise((resolve) => {
            if (reg.installing) reg.installing.addEventListener('statechange', () => { if (reg.waiting || reg.active) resolve() })
            else resolve()
          })
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        })
        const json = sub.toJSON()
        await saveSubscription({
          endpoint: json.endpoint,
          keys: json.keys,
        }).unwrap()
        return true
      } catch (e) {
        console.warn('[Notifications] Subscribe failed:', e)
        return false
      }
    },
    [saveSubscription]
  )

  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      setCheckDone(true)
      return
    }
    const standalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true
    setIsStandalone(standalone)
    const permission = Notification.permission
    if (permission === 'granted' || permission === 'denied') {
      setVisible(false)
      setCheckDone(true)
      return
    }
    const dismissed = localStorage.getItem(DISMISSED_KEY)
    const dismissedTime = dismissed ? parseInt(dismissed, 10) : 0
    // Always show in standalone (Add to Home Screen) so user can enable mobile notifications; otherwise show if not dismissed or dismissed long ago
    if (standalone) {
      setVisible(true)
    } else if (!dismissed || Date.now() - dismissedTime > DISMISSED_AGAIN_AFTER_MS) {
      setVisible(true)
    }
    setCheckDone(true)
  }, [])

  // When permission already granted, ensure push subscription is registered and stored in MongoDB (on load and when app becomes visible again)
  const lastEnsureRef = useRef(0)
  const ENSURE_THROTTLE_MS = 60 * 1000
  const runEnsure = useCallback(async () => {
    if (!('Notification' in window) || !('serviceWorker' in navigator) || Notification.permission !== 'granted' || !vapidData?.data?.publicKey) return
    if (Date.now() - lastEnsureRef.current < ENSURE_THROTTLE_MS) return
    lastEnsureRef.current = Date.now()
    try {
      let reg = await navigator.serviceWorker.getRegistration()
      if (!reg) {
        reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' })
        await new Promise((resolve) => {
          if (reg.installing) reg.installing.addEventListener('statechange', () => { if (reg.waiting || reg.active) resolve() })
          else resolve()
        })
      }
      const sub = await reg.pushManager.getSubscription()
      if (sub) {
        const json = sub.toJSON()
        await saveSubscription({ endpoint: json.endpoint, keys: json.keys }).unwrap()
      } else {
        await subscribeAndSend(vapidData.data.publicKey)
      }
    } catch (e) {
      console.warn('[Notifications] Ensure subscription failed:', e)
    }
  }, [vapidData?.data?.publicKey, saveSubscription, subscribeAndSend])

  useEffect(() => {
    if (!checkDone || !vapidData?.data?.publicKey) return
    ensuredRef.current = true
    runEnsure()
  }, [checkDone, vapidData?.data?.publicKey, runEnsure])

  // Re-sync subscription when user reopens app (e.g. PWA from home screen) so DB stays in sync
  useEffect(() => {
    if (!checkDone || !('document' in globalThis)) return
    const onVisible = () => runEnsure()
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [checkDone, runEnsure])

  // Tell user when VAPID request fails: 503 = server not configured; other = network/server issue
  useEffect(() => {
    if (!vapidError || vapidWarnShown.current || !(visible || checkDone)) return
    vapidWarnShown.current = true
    const status = vapidErrorDetail?.status
    const msg = (vapidErrorDetail?.data?.message || '').toLowerCase()
    const is503 = status === 503 || msg.includes('not configured')
    const isNetwork = status === 'FETCH_ERROR' || status === 'PARSING_ERROR' || status === 'TIMEOUT_ERROR'
    toast({
      title: 'System notifications unavailable',
      description: is503
        ? 'Server is not configured for push. Ask your admin to set VAPID keys.'
        : isNetwork
          ? 'Could not reach the server. Check your connection and try again.'
          : 'Could not load notification settings. Check that the server is running and try again.',
      status: 'warning',
      duration: 6000,
      isClosable: true,
    })
  }, [vapidError, vapidErrorDetail, visible, checkDone, toast])

  const handleEnable = async () => {
    if (!('Notification' in window)) return
    const publicKey = vapidData?.data?.publicKey
    if (!publicKey) {
      toast({
        title: 'Notifications not available',
        description: 'Server push is not configured (missing VAPID keys). You will still get in-app alerts.',
        status: 'warning',
        duration: 5000,
        isClosable: true,
      })
      setVisible(false)
      return
    }
    try {
      const permission = await Notification.requestPermission()
      if (permission === 'granted') {
        const ok = await subscribeAndSend(publicKey)
        if (ok) {
          toast({ title: 'Notifications enabled', description: "You'll get alerts when someone messages you (even when app is closed).", status: 'success', duration: 4000, isClosable: true })
        } else {
          toast({ title: 'Could not enable push', description: 'Try again. Use HTTPS and allow notifications in browser settings.', status: 'warning', duration: 5000, isClosable: true })
        }
        setVisible(false)
      } else {
        setVisible(false)
      }
    } catch (e) {
      console.warn('[Notifications] Request permission failed:', e)
      toast({ title: 'Permission request failed', description: e?.message || 'Check browser settings.', status: 'error', duration: 4000, isClosable: true })
    }
  }

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()))
    setVisible(false)
  }

  if (!checkDone || !visible) return null

  return (
    <Box
      position="fixed"
      bottom={{ base: 4, md: 6 }}
      left={{ base: 4, md: 6 }}
      right={{ base: 4, md: 6 }}
      maxW="420px"
      mx={{ md: 'auto' }}
      zIndex={9999}
      bg="gray.800"
      color="white"
      p={4}
      borderRadius="xl"
      boxShadow="lg"
      borderWidth="1px"
      borderColor="whiteAlpha.200"
    >
      <HStack spacing={3} align="flex-start">
        <Box mt={0.5}>
          <Bell size={22} />
        </Box>
        <Box flex={1}>
          <Text fontWeight="600" fontSize="sm" mb={1}>
            {isStandalone ? 'Get notifications on your phone' : 'Get message notifications'}
          </Text>
          <Text fontSize="xs" color="whiteAlpha.800" mb={3}>
            {isStandalone
              ? "When someone chats or messages you, you'll see a notification even when the app is closed. Tap Enable to turn on."
              : "When someone messages you, we'll notify you on this device."}
          </Text>
          <HStack spacing={2}>
            <Button size="sm" colorScheme="blue" onClick={handleEnable} isLoading={isSaving} leftIcon={<Bell size={14} />}>
              Enable
            </Button>
            <Button size="sm" variant="ghost" color="whiteAlpha.800" onClick={handleDismiss}>
              Not now
            </Button>
          </HStack>
        </Box>
      </HStack>
    </Box>
  )
}
