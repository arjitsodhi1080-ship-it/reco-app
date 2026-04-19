import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import './FriendProfile.css'

function FriendProfile({ friend, onBack, currentUserId }) {
  const [recommendations, setRecommendations] = useState([])
  const [myRecommendations, setMyRecommendations] = useState([])
  const [compatibility, setCompatibility] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [friend.id])

  const loadData = async () => {
    // Load friend's public recommendations
    const { data: friendRecs } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', friend.id)
      .eq('is_public', true)
      .order('created_at', { ascending: false })

    // Load my recommendations to calculate compatibility
    const { data: myRecs } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', currentUserId)

    setRecommendations(friendRecs || [])
    setMyRecommendations(myRecs || [])
    
    if (friendRecs && myRecs) {
      calculateCompatibility(friendRecs, myRecs)
    }
    
    setLoading(false)
  }

  const calculateCompatibility = (friendRecs, myRecs) => {
    const friendTitles = friendRecs.map(r => r.title.toLowerCase())
    const myTitles = myRecs.map(r => r.title.toLowerCase())
    
    const commonTitles = friendTitles.filter(title => myTitles.includes(title))
    
    const totalUnique = new Set([...friendTitles, ...myTitles]).size
    const compatScore = totalUnique > 0 ? Math.round((commonTitles.length / totalUnique) * 100) : 0
    
    setCompatibility({
      score: compatScore,
      commonCount: commonTitles.length,
      commonTitles: commonTitles
    })
  }

  const getCategoryEmoji = (category) => {
    const emojis = {
      movie: '🎬',
      tv: '📺',
      restaurant: '🍜',
      book: '📚'
    }
    return emojis[category] || '⭐'
  }

  const renderRating = (rating) => {
    return rating ? `${rating}/10` : 'Not rated'
  }

  const isCommon = (title) => {
    if (!compatibility) return false
    return compatibility.commonTitles.includes(title.toLowerCase())
  }

  if (loading) {
    return (
      <div className="friend-profile-container">
        <button onClick={onBack} className="back-btn">← Back</button>
        <p>Loading...</p>
      </div>
    )
  }

  return (
    <div className="friend-profile-container">
      <button onClick={onBack} className="back-btn">← Back to Friends</button>
      
      <div className="profile-header">
        <div className="profile-avatar">{friend.username[0].toUpperCase()}</div>
        <div className="profile-info">
          <h2>@{friend.username}</h2>
          <p>{friend.full_name || 'No name'}</p>
        </div>
      </div>

      {compatibility && (
        <div className="compatibility-card">
          <div className="compat-score">{compatibility.score}%</div>
          <div className="compat-label">Taste Match</div>
          <p className="compat-detail">
            {compatibility.commonCount} recommendations in common
          </p>
        </div>
      )}

      <div className="recommendations-section">
        <h3>Public Recommendations ({recommendations.length})</h3>
        
        {recommendations.length === 0 ? (
          <p className="no-recs">No public recommendations yet</p>
        ) : (
          <div className="recs-list">
            {recommendations.map((rec) => (
              <div key={rec.id} className={`rec-card ${isCommon(rec.title) ? 'common' : ''}`}>
                {isCommon(rec.title) && (
                  <div className="common-badge">✓ You both like this</div>
                )}
                <div className="rec-header">
                  <span className="rec-emoji">{getCategoryEmoji(rec.category)}</span>
                  <div className="rec-info">
                    <h4>{rec.title}</h4>
                    <div className="rec-meta">
                      {rec.is_wishlist ? (
                        <span className="badge-wishlist">⭐ Wishlist</span>
                      ) : (
                        <span className="rating-badge">{renderRating(rec.rating)}</span>
                      )}
                    </div>
                  </div>
                </div>
                {rec.note && <p className="rec-note">"{rec.note}"</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default FriendProfile