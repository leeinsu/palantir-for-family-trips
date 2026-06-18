import { useState } from 'react'
import { createLocalSession, writeLocalSession } from './session.js'

export default function AuthPage({ onAuthenticated }) {
  const [mode, setMode] = useState('login')
  const [email, setEmail] = useState('family@example.com')
  const [displayName, setDisplayName] = useState('Family Planner')
  const [error, setError] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    setError('')

    try {
      const session = createLocalSession({ email, displayName })
      writeLocalSession(session)
      onAuthenticated(session)
    } catch (authError) {
      setError(authError.message || 'Unable to start a local session')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070a] px-6 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/90 p-8 shadow-2xl shadow-cyan-950/20">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Auth MVP</p>
        <h1 className="mt-4 text-3xl font-semibold">Family Trip Command Center</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          Use the local session fallback now; the form shape follows the planned `/api/auth/login` and `/api/auth/register` endpoints.
        </p>

        <div className="mt-6 grid grid-cols-2 rounded-2xl border border-slate-800 bg-slate-900/70 p-1 text-sm">
          {['login', 'register'].map((nextMode) => (
            <button
              key={nextMode}
              className={`rounded-xl px-4 py-2 font-medium transition ${mode === nextMode ? 'bg-cyan-400 text-slate-950' : 'text-slate-400 hover:text-slate-100'}`}
              type="button"
              onClick={() => setMode(nextMode)}
            >
              {nextMode === 'login' ? 'Login' : 'Register'}
            </button>
          ))}
        </div>

        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <label className="block text-sm font-medium text-slate-300">
            Email
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          {mode === 'register' ? (
            <label className="block text-sm font-medium text-slate-300">
              Display name
              <input
                className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
                value={displayName}
                onChange={(event) => setDisplayName(event.target.value)}
                required
              />
            </label>
          ) : null}
          <label className="block text-sm font-medium text-slate-300">
            Password
            <input
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              type="password"
              placeholder="Local MVP accepts any non-empty password"
              minLength={1}
              required
            />
          </label>
          {error ? <p className="rounded-xl border border-red-900/60 bg-red-950/50 px-4 py-3 text-sm text-red-200">{error}</p> : null}
          <button className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300" type="submit">
            {mode === 'login' ? 'Login with local session' : 'Register local session'}
          </button>
        </form>
      </section>
    </main>
  )
}
