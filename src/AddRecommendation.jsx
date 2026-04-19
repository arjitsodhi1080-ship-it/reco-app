import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import axios from 'axios'
import './AddRecommendation.css'

function AddRecommendation({ user, editingRec, onClose, onAdded }) {
  const [category, setCategory] = useState('movie')
  const [title, setTitle] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [selectedItem, setSelectedItem] = useState(null)
  const [rating, setRating] = useState(0)
  const [note, setNote] = useState('')
  const [isPublic, setIsPublic] = useState(true)
  const [loading, setLoading] = useState(false)
  const [searching, setSearching] = useState(false)
  const [isWishlist, setIsWishlist] = useState(false)

  const TMDB_API_KEY = import.meta.env.VITE_TMDB_API_KEY

  useEffect(() => {
    if (editingRec) {
      setCategory(editingRec.category)
      setTitle(editingRec.title)
      setSearchQuery(editingRec.title)
      setRating(editingRec.rating || 0)
      setNote(editingRec.note || '')
      setIsPublic(editingRec.is_public)
      setIsWishlist(editingRec.is_wishlist || false)
      setSelectedItem(null)
      setSearchResults([])
    } else {
      // Reset form when not editing (adding new)
      setCategory('movie')
      setTitle('')
      setSearchQuery('')
      setRating(0)
      setNote('')
      setIsPublic(true)
      setIsWishlist(false)
      setSelectedItem(null)
      setSearchResults([])
    }
  }, [editingRec])

  const searchMoviesTV = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)
    try {
      const endpoint = category === 'movie' 
        ? 'https://api.themoviedb.org/3/search/movie'
        : 'https://api.themoviedb.org/3/search/tv'

      const response = await axios.get(endpoint, {
        params: {
          api_key: TMDB_API_KEY,
          query: query,
          language: 'en-US',
          page: 1
        }
      })

      const results = response.data.results.slice(0, 5).map(item => ({
        id: item.id,
        title: item.title || item.name,
        year: item.release_date?.split('-')[0] || item.first_air_date?.split('-')[0],
        overview: item.overview
      }))

      setSearchResults(results)
    } catch (error) {
      console.error('Search error:', error)
      setSearchResults([])
    }
    setSearching(false)
  }

  const handleSearchChange = (value) => {
    setSearchQuery(value)
    setSelectedItem(null)
    
    clearTimeout(window.searchTimeout)
    window.searchTimeout = setTimeout(() => {
      if (category !== 'restaurant') {
        searchMoviesTV(value)
      }
    }, 300)
  }

  const selectResult = (item) => {
    setSelectedItem(item)
    setTitle(item.title)
    setSearchQuery(item.title)
    setSearchResults([])
  }

  const handleCategoryChange = (newCategory) => {
    setCategory(newCategory)
    setSearchQuery('')
    setTitle('')
    setSelectedItem(null)
    setSearchResults([])
  }

  const handleSave = async () => {
    console.log('Saving - editingRec:', editingRec)
    
    const finalTitle = category === 'restaurant' ? searchQuery : title
    if (!finalTitle || (!isWishlist && (rating === 0 || rating > 10))) {
      alert('Please enter a title' + (isWishlist ? '' : ' and rating'))
      return
    }

    setLoading(true)

    const dataToSave = {
      user_id: user.id,
      title: finalTitle,
      category,
      rating: isWishlist ? null : rating,
      note,
      is_public: isPublic,
      is_wishlist: isWishlist,
      metadata: selectedItem ? {
        tmdb_id: selectedItem.id,
        year: selectedItem.year,
        overview: selectedItem.overview
      } : (editingRec?.metadata || {})
    }

    let error

    if (editingRec) {
      const result = await supabase
        .from('recommendations')
        .update(dataToSave)
        .eq('id', editingRec.id)
      error = result.error
    } else {
      const result = await supabase
        .from('recommendations')
        .insert([dataToSave])
      error = result.error
    }

    setLoading(false)

    if (error) {
      alert('Error saving recommendation: ' + error.message)
    } else {
      onAdded()
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={(e) => e.stopPropagation()}>
        <div className="modal-handle"></div>
        <h2>{editingRec ? 'Edit Reco' : 'Add a Reco'}</h2>

        <div className="category-picker">
          <button
            className={`cat-btn ${category === 'movie' ? 'selected' : ''}`}
            onClick={() => handleCategoryChange('movie')}
          >
            🎬 Movie
          </button>
          <button
            className={`cat-btn ${category === 'tv' ? 'selected' : ''}`}
            onClick={() => handleCategoryChange('tv')}
          >
            📺 TV
          </button>
          <button
            className={`cat-btn ${category === 'restaurant' ? 'selected' : ''}`}
            onClick={() => handleCategoryChange('restaurant')}
          >
            🍜 Restaurant
          </button>
        </div>

        <div className="wishlist-toggle">
          <button
            className={`wishlist-btn ${isWishlist ? 'selected' : ''}`}
            onClick={() => setIsWishlist(!isWishlist)}
          >
            {isWishlist ? '⭐ Wishlist - Want to Try' : '✅ Already Tried'}
          </button>
        </div>

        <div className="search-container">
          <input
            type="text"
            placeholder={
              category === 'restaurant' 
                ? 'Restaurant name...' 
                : 'Search for a title...'
            }
            value={searchQuery}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="input-field"
          />
          {searching && <span className="searching-indicator">Searching...</span>}
        </div>

        {searchResults.length > 0 && category !== 'restaurant' && (
          <div className="search-results">
            {searchResults.map((result) => (
              <div
                key={result.id}
                className="search-result-item"
                onClick={() => selectResult(result)}
              >
                <div className="result-info">
                  <strong>{result.title}</strong>
                  {result.year && <span> ({result.year})</span>}
                </div>
              </div>
            ))}
          </div>
        )}

        {category === 'restaurant' && searchQuery && (
          <div className="manual-entry-note">
            Will save as: "{searchQuery}"
          </div>
        )}

        {!isWishlist && (
          <div className="rating-section">
            <label>Your Rating (out of 10)</label>
            <div className="rating-input-container">
              <input
                type="number"
                min="1"
                max="10"
                value={rating || ''}
                onChange={(e) => {
                  const val = e.target.value
                  if (val === '') {
                    setRating(0)
                  } else {
                    const numVal = parseInt(val)
                    if (!isNaN(numVal) && numVal >= 0 && numVal <= 10) {
                      setRating(numVal)
                    }
                  }
                }}
                placeholder="Rate 1-10"
                className="rating-number-input"
              />
              <span className="rating-display">
                {rating > 0 && `${rating}/10`}
              </span>
            </div>
          </div>
        )}

        <textarea
          placeholder="Add a note (optional)..."
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="textarea-field"
        />

        <div className="visibility-row">
          <button
            className={`vis-btn ${isPublic ? 'selected' : ''}`}
            onClick={() => setIsPublic(true)}
          >
            👁 Public
          </button>
          <button
            className={`vis-btn ${!isPublic ? 'selected' : ''}`}
            onClick={() => setIsPublic(false)}
          >
            🔒 Private
          </button>
        </div>

        <button
          onClick={handleSave}
          disabled={loading || (!isWishlist && rating === 0)}
          className="save-btn"
        >
          {loading ? 'Saving...' : 'Save to Reco'}
        </button>
      </div>
    </div>
  )
}

export default AddRecommendation