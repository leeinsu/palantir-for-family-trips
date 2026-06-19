import { useState } from 'react'
import { createPasswordSession, createSsoSession, writeLocalSession } from './session.js'

const SSO_PROVIDERS = [
  { id: 'google', label: 'Google SSO' },
  { id: 'apple', label: 'Apple SSO' },
  { id: 'microsoft', label: 'Microsoft SSO' },
]

export default function AuthPage({ onAuthenticated }) {
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function completeAuthentication(session) {
    writeLocalSession(session)
    onAuthenticated(session)
  }

  function handlePasswordLogin(event) {
    event.preventDefault()
    setError('')

    try {
      completeAuthentication(createPasswordSession({ id: loginId, password }))
    } catch (authError) {
      setError(authError.message || 'Unable to sign in')
    }
  }

  function handleSsoLogin(provider) {
    setError('')

    try {
      completeAuthentication(createSsoSession({ provider }))
    } catch (authError) {
      setError(authError.message || 'Unable to start SSO login')
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#05070a] px-6 text-slate-100">
      <section className="w-full max-w-md rounded-3xl border border-slate-800 bg-slate-950/90 p-8 shadow-2xl shadow-cyan-950/20">
        <p className="text-xs uppercase tracking-[0.35em] text-cyan-300">Authentication</p>
        <h1 className="mt-4 text-3xl font-semibold">로그인</h1>
        <p className="mt-3 text-sm leading-6 text-slate-400">
          여행 데이터를 보려면 ID/password로 인증하거나 SSO 로그인을 사용하세요.
        </p>

        <form className="mt-8 space-y-5" onSubmit={handlePasswordLogin}>
          <label className="block text-sm font-medium text-slate-300">
            ID
            <input
              autoComplete="username"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              placeholder="ID를 입력하세요"
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium text-slate-300">
            Password
            <input
              autoComplete="current-password"
              className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 text-slate-100 outline-none focus:border-cyan-400"
              placeholder="Password를 입력하세요"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error ? <p className="rounded-xl border border-red-900/60 bg-red-950/50 px-4 py-3 text-sm text-red-200">{error}</p> : null}
          <button className="w-full rounded-xl bg-cyan-400 px-4 py-3 font-semibold text-slate-950 transition hover:bg-cyan-300" type="submit">
            ID / Password 로그인
          </button>
        </form>

        <div className="my-7 flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-500">
          <span className="h-px flex-1 bg-slate-800" />
          or sso
          <span className="h-px flex-1 bg-slate-800" />
        </div>

        <div className="grid gap-3">
          {SSO_PROVIDERS.map((provider) => (
            <button
              key={provider.id}
              className="w-full rounded-xl border border-slate-700 bg-slate-900 px-4 py-3 font-semibold text-slate-100 transition hover:border-cyan-400 hover:text-cyan-200"
              type="button"
              onClick={() => handleSsoLogin(provider.id)}
            >
              {provider.label}
            </button>
          ))}
        </div>
      </section>
    </main>
  )
}
