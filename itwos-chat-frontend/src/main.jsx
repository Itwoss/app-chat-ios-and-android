import React, { useEffect } from 'react'
import ReactDOM from 'react-dom/client'
import { Provider } from 'react-redux'
import { ChakraProvider } from '@chakra-ui/react'
import { BrowserRouter } from 'react-router-dom'
import { ErrorBoundary } from 'react-error-boundary'
import App from './App.jsx'
import { store } from './store/store.js'
import theme from './theme/theme.js'
import ErrorFallback from './components/ErrorBoundary/ErrorFallback.jsx'
import { AudioManagerProvider } from './contexts/AudioManagerContext.jsx'
import { SongDetailsProvider } from './contexts/SongDetailsContext.jsx'
import { FontProvider } from './contexts/FontContext.jsx'
import { CreatePostProvider } from './contexts/CreatePostContext.jsx'
import './index.css'

// Minimal error handler - keep initial load small for iOS
const errorHandler = (error, errorInfo) => {
  if (error?.response?.status === 401 || error?.status === 401 || error?.message?.includes('Authentication')) return
  console.error('ErrorBoundary caught error:', error, errorInfo)
}

// Hide loading screen after React has committed (iOS: render is async, so do this in useEffect)
function HideLoadingScreen({ children }) {
  useEffect(function hideAfterPaint() {
    if (typeof window._hideLoadingScreen === 'function') window._hideLoadingScreen()
    var el = document.getElementById('loading-screen')
    if (el) el.style.display = 'none'
    try {
      window.dispatchEvent(new Event('react-mounted'))
    } catch (_) {
      // older iOS Safari can crash on CustomEvent; Event() is safe
    }
  }, [])
  return children
}

// Mount React FIRST so iOS shows the app quickly; then attach non-critical listeners
const rootElement = document.getElementById('root')
if (!rootElement) {
  document.body.innerHTML = '<div style="padding:20px;text-align:center;font-family:system-ui;"><h2>Error</h2><p>Root not found. Refresh the page.</p><button onclick="location.reload()" style="padding:10px 20px;background:#007AFF;color:white;border:none;border-radius:8px;cursor:pointer;">Reload</button></div>'
} else {
  try {
    const root = ReactDOM.createRoot(rootElement)
    root.render(
      <>
        <Provider store={store}>
          <ChakraProvider theme={theme}>
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <ErrorBoundary FallbackComponent={ErrorFallback} onError={errorHandler} onReset={() => { window.location.href = '/login' }}>
                <HideLoadingScreen>
                  <AudioManagerProvider>
                    <SongDetailsProvider>
                      <FontProvider>
                        <CreatePostProvider>
                          <App />
                        </CreatePostProvider>
                      </FontProvider>
                    </SongDetailsProvider>
                  </AudioManagerProvider>
                </HideLoadingScreen>
              </ErrorBoundary>
            </BrowserRouter>
          </ChakraProvider>
        </Provider>
      </>
    )
  } catch (err) {
    console.error('React mount failed:', err)
    rootElement.innerHTML = '<div style="padding:20px;text-align:center;font-family:system-ui;"><h2>Load Error</h2><p>Clear cache and refresh.</p><button onclick="location.reload()" style="padding:12px 24px;background:#007AFF;color:white;border:none;border-radius:8px;cursor:pointer;">Reload</button></div>'
  }
}

// iOS PWA: suppress system context menu (Copy/Paste/Select) on non-editable content; allow in inputs
document.addEventListener('contextmenu', function (e) {
  const t = e.target
  const tag = t && t.tagName && t.tagName.toLowerCase()
  const editable = t && typeof t.isContentEditable === 'boolean' && t.isContentEditable
  if (tag === 'input' || tag === 'textarea' || editable) return
  e.preventDefault()
}, { capture: true })

// Defer YouTube/console suppressions so they don't block or break iOS first paint
setTimeout(function () {
  const origErr = console.error
  console.error = function (...args) {
    const msg = args.map(String).join(' ')
    if (msg.includes('isExternalMethodAvailable') || msg.includes('www-embed-player') || msg.includes('embed-player-pc-es6')) return
    origErr.apply(console, args)
  }
  const origWarn = console.warn
  console.warn = function (...args) {
    const msg = args.map(String).join(' ')
    if (msg.includes('isExternalMethodAvailable') || msg.includes('www-embed-player') || msg.includes('embed-player-pc-es6') || msg.includes('compute-pressure') || msg.includes('Permissions policy')) return
    origWarn.apply(console, args)
  }
  window.addEventListener('error', function (e) {
    const m = (e.message || '') + (e.filename || '') + ((e.error && e.error.stack) || '')
    if (m.includes('isExternalMethodAvailable') || m.includes('www-embed-player') || m.includes('embed-player-pc-es6')) {
      e.preventDefault()
      e.stopPropagation()
      return false
    }
  }, true)
  window.addEventListener('unhandledrejection', function (e) {
    const r = (e.reason && e.reason.message) || String(e.reason || '')
    if (r.includes('isExternalMethodAvailable') || r.includes('www-embed-player') || r.includes('embed-player-pc-es6')) {
      e.preventDefault()
      return false
    }
  })
}, 0)

// Register Service Worker for PWA (deferred to not block initial load)
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then(reg => {
        console.log("[SW] Service Worker registered:", reg.scope);
        // Only reload when a new SW takes control AND the tab is visible (avoids surprise reloads in background)
        navigator.serviceWorker.addEventListener("controllerchange", () => {
          if (document.visibilityState === "visible") {
            window.location.reload();
          }
        });
        // Check for updates less often to reduce lag and unexpected reloads (every 5 min instead of 1 min)
        setInterval(() => reg.update(), 300000);
      })
      .catch(err => {
        console.log("[SW] Service Worker registration failed:", err);
      });
  });
}
