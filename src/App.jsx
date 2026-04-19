import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import Home from './Home'
import ProfileSetup from './ProfileSetup'
import './App.css'

function App() {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authLoading, setAuthLoading] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      if (session) {
        loadProfile(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      if (session) {
        loadProfile(session.user.id)
      } else {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const loadProfile = async (userId) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    setProfile(data)
    setLoading(false)
  }

  const handleSignUp = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signUp({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    } else {
      setMessage('Check your email for the confirmation link!')
    }
    setAuthLoading(false)
  }

  const handleSignIn = async (e) => {
    e.preventDefault()
    setAuthLoading(true)
    setMessage('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setMessage(error.message)
    }
    setAuthLoading(false)
  }

  if (loading) {
    return <div className="container"><p>Loading...</p></div>
  }

  if (session) {
    if (!profile || !profile.username) {
      return <ProfileSetup user={session.user} onProfileComplete={() => loadProfile(session.user.id)} />
    }
    return <Home user={session.user} profile={profile} />
  }

  return (
    <div className="container">
      <div className="auth-card">
        <h1>Reco</h1>
        <p className="subtitle">Save what you love. Trust who you know.</p>

        <form onSubmit={handleSignIn}>
          <input
            type="email"
            placeholder="Your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit" disabled={authLoading} className="btn-primary">
            {authLoading ? 'Loading...' : 'Sign In'}
          </button>

          <button
            type="button"
            onClick={handleSignUp}
            disabled={authLoading}
            className="btn-secondary"
          >
            Sign Up
          </button>
        </form>

        {message && <p className="message">{message}</p>}
      </div>
    </div>
  )
}

export default App