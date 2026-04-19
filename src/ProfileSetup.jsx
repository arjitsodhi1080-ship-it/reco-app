import { useState } from 'react'
import { supabase } from './supabaseClient'
import './ProfileSetup.css'

function ProfileSetup({ user, onProfileComplete }) {
  const [username, setUsername] = useState('')
  const [fullName, setFullName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!username || username.length < 3) {
      setError('Username must be at least 3 characters')
      return
    }

    // Check if username is alphanumeric
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores')
      return
    }

    setLoading(true)

    // Check if username is taken
    const { data: existing } = await supabase
      .from('profiles')
      .select('username')
      .eq('username', username.toLowerCase())
      .single()

    if (existing) {
      setError('Username is already taken')
      setLoading(false)
      return
    }

    // Create or update profile
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        username: username.toLowerCase(),
        full_name: fullName || username,
        updated_at: new Date().toISOString()
      })

    setLoading(false)

    if (upsertError) {
      setError(upsertError.message)
    } else {
      onProfileComplete()
    }
  }

  return (
    <div className="profile-setup-container">
      <div className="profile-setup-card">
        <h1>Welcome to Reco!</h1>
        <p className="subtitle">Let's set up your profile</p>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input
              type="text"
              placeholder="Choose a username"
              value={username}
              onChange={(e) => setUsername(e.target.value.toLowerCase())}
              required
              className="input-field"
            />
            <span className="hint">Others will find you by this username</span>
          </div>

          <div className="form-group">
            <label>Display Name (optional)</label>
            <input
              type="text"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="input-field"
            />
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? 'Creating Profile...' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default ProfileSetup