import Friends from './Friends'
import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import AddRecommendation from './AddRecommendation'
import './Home.css'

function Home({ user, profile }) {
  const [filterCategory, setFilterCategory] = useState('all')
  const [filterWishlist, setFilterWishlist] = useState('all')  
  const [showAddModal, setShowAddModal] = useState(false)
  const [recommendations, setRecommendations] = useState([])
  const [activeTab, setActiveTab] = useState('home')
  const [editingRec, setEditingRec] = useState(null)

  useEffect(() => {
    loadRecommendations()
  }, [])

  const loadRecommendations = async () => {
    const { data, error } = await supabase
      .from('recommendations')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (data) {
      setRecommendations(data)
    }
  }

  const handleSignOut = async () => {
    await supabase.auth.signOut()
  }

  const handleRecommendationAdded = () => {
    setShowAddModal(false)
    setEditingRec(null)
    loadRecommendations()
  }

  const handleEdit = (rec) => {
    setEditingRec(rec)
    setShowAddModal(true)
  }

  const handleDelete = async (recId) => {
    if (!confirm('Are you sure you want to delete this recommendation?')) {
      return
    }

    const { error } = await supabase
      .from('recommendations')
      .delete()
      .eq('id', recId)

    if (error) {
      alert('Error deleting: ' + error.message)
    } else {
      loadRecommendations()
    }
  }

  const handleModalClose = () => {
    setShowAddModal(false)
    setEditingRec(null)
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
    return `${rating}/10`
  }
const getFilteredRecommendations = () => {
    let filtered = recommendations

    // Filter by category
    if (filterCategory !== 'all') {
      filtered = filtered.filter(rec => rec.category === filterCategory)
    }

    // Filter by wishlist status
    if (filterWishlist === 'tried') {
      filtered = filtered.filter(rec => !rec.is_wishlist)
    } else if (filterWishlist === 'wishlist') {
      filtered = filtered.filter(rec => rec.is_wishlist)
    }

    return filtered
  }
  return (
    <div className="home-container">
      <div className="top-bar">
        <div>
          <h1>Reco</h1>
          <p>{user.email}</p>
        </div>
        <button onClick={handleSignOut} className="sign-out-btn">
          Sign Out
        </button>
      </div>

      <div className="content">
        {activeTab === 'home' && (
          <div className="collection-view">
            <h2>My Collection</h2>
            <p className="subtitle">{recommendations.length} recommendations saved</p>

            {recommendations.length === 0 ? (
              <div className="empty-state">
                <p>No recommendations yet!</p>
                <p className="hint">Tap the + button below to add your first one</p>
              </div>
            ) : (
              <div className="collection-view">
            <h2>My Collection</h2>
            <p className="subtitle">{recommendations.length} recommendations saved</p>

            {/* Filter Tabs */}
            <div className="filter-section">
              <div className="filter-row">
                <button
                  className={`filter-btn ${filterCategory === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterCategory('all')}
                >
                  All
                </button>
                <button
                  className={`filter-btn ${filterCategory === 'movie' ? 'active' : ''}`}
                  onClick={() => setFilterCategory('movie')}
                >
                  🎬 Movies
                </button>
                <button
                  className={`filter-btn ${filterCategory === 'tv' ? 'active' : ''}`}
                  onClick={() => setFilterCategory('tv')}
                >
                  📺 TV
                </button>
                <button
                  className={`filter-btn ${filterCategory === 'restaurant' ? 'active' : ''}`}
                  onClick={() => setFilterCategory('restaurant')}
                >
                  🍜 Food
                </button>
              </div>
              <div className="filter-row">
                <button
                  className={`filter-btn ${filterWishlist === 'all' ? 'active' : ''}`}
                  onClick={() => setFilterWishlist('all')}
                >
                  All
                </button>
                <button
                  className={`filter-btn ${filterWishlist === 'tried' ? 'active' : ''}`}
                  onClick={() => setFilterWishlist('tried')}
                >
                  ✅ Tried
                </button>
                <button
                  className={`filter-btn ${filterWishlist === 'wishlist' ? 'active' : ''}`}
                  onClick={() => setFilterWishlist('wishlist')}
                >
                  ⭐ Wishlist
                </button>
              </div>
            </div>

            {getFilteredRecommendations().length === 0 ? (
              <div className="empty-state">
                <p>No recommendations found!</p>
                <p className="hint">Try changing your filters or add some recommendations</p>
              </div>
            ) : (
              <div className="recommendations-list">
                {getFilteredRecommendations().map((rec) => (
                  <div key={rec.id} className="rec-card">
                    <div className="rec-header">
                      <span className="rec-emoji">{getCategoryEmoji(rec.category)}</span>
                      <div className="rec-info">
                        <h3>{rec.title}</h3>
                        <div className="rec-meta">
                          {rec.is_wishlist ? (
                            <span className="badge-wishlist">⭐ Wishlist</span>
                          ) : (
                            <span className="rating-display-small">{renderRating(rec.rating)}</span>
                          )}
                          <span className={rec.is_public ? 'badge-public' : 'badge-private'}>
                            {rec.is_public ? '👁 Public' : '🔒 Private'}
                          </span>
                        </div>
                      </div>
                    </div>
                    {rec.note && <p className="rec-note">"{rec.note}"</p>}
                    <div className="rec-actions">
                      <button onClick={() => handleEdit(rec)} className="edit-btn">
                        ✏️ Edit
                      </button>
                      <button onClick={() => handleDelete(rec.id)} className="delete-btn">
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
            )}
          </div>
        )}
      </div>
{activeTab === 'friends' && (
          <Friends user={user} profile={profile} />
        )}
      <div className="bottom-nav">
        <button
          className={`nav-btn ${activeTab === 'home' ? 'active' : ''}`}
          onClick={() => setActiveTab('home')}
        >
          <span>🏠</span>
          <span>Home</span>
        </button>

        <button className="add-btn" onClick={() => setShowAddModal(true)}>
          +
        </button>

        <button
          className={`nav-btn ${activeTab === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveTab('friends')}
        >
          <span>👥</span>
          <span>Friends</span>
        </button>
      </div>

      {showAddModal && (
        <AddRecommendation
          user={user}
          editingRec={editingRec}
          onClose={handleModalClose}
          onAdded={handleRecommendationAdded}
        />
      )}
    </div>
  )
}

export default Home