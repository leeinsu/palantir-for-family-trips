import { useEffect, useState } from 'react'
import App from './App.jsx'
import AuthPage from './auth/AuthPage.jsx'
import { clearLocalSession, getInitialSession, LOCAL_SESSION_STORAGE_KEY, readLocalSession } from './auth/session.js'

let authCompletedInThisRuntime = false

export default function Root() {
  const [session, setSession] = useState(() => getInitialSession())

  useEffect(() => {
    function handleStorage(event) {
      if (!event.key || event.key === LOCAL_SESSION_STORAGE_KEY) {
        const nextSession = readLocalSession()
        authCompletedInThisRuntime = Boolean(nextSession)
        setSession(nextSession)
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  function handleAuthenticated(nextSession) {
    authCompletedInThisRuntime = true
    setSession(nextSession)
  }

  if (!authCompletedInThisRuntime || !session) return <AuthPage onAuthenticated={handleAuthenticated} />

  return (
    <>
      <div className="fixed right-4 top-4 z-[1000] flex items-center gap-3 rounded-full border border-slate-700 bg-slate-950/90 px-4 py-2 text-xs text-slate-300 shadow-lg backdrop-blur">
        <span>{session.user.displayName}</span>
        <button
          className="rounded-full border border-slate-700 px-3 py-1 text-slate-200 hover:border-cyan-400 hover:text-cyan-200"
          type="button"
          onClick={() => {
            authCompletedInThisRuntime = false
            clearLocalSession()
            setSession(null)
          }}
        >
          Sign out
        </button>
      </div>
      <App />
    </>
  )
}
