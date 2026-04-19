import { useState, useEffect } from 'react'
import { supabase } from './supabaseClient'
import FriendProfile from './FriendProfile'
import './Friends.css'

function Friends({ user, profile }) {
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [friends, setFriends] = useState([])
  const [searching, setSearching] = useState(false)
  const [activeView, setActiveView] = useState('friends')
  const [selectedFriend, setSelectedFriend] = useState(null)

  useEffect(() => {
    loadFriends()
  }, [])

  const loadFriends = async () => {
    const { data: myFriendships } = await supabase
      .from('friendships')
      .select('friend_id')
      .eq('user_id', user.id)

    if (!myFriendships || myFriendships.length === 0) {
      setFriends([])
      return
    }

    const friendIds = myFriendships.map(f => f.friend_id)

    const { data: friendProfiles } = await supabase
      .from('profiles')
      .select('*')
      .in('id', friendIds)

    const friendsWithCounts = await Promise.all(
      (friendProfiles || []).map(async (friend) => {
        const { count } = await supabase
          .from('recommendations')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', friend.id)
          .eq('is_public', true)

        return { ...friend, recommendation_count: count || 0 }
      })
    )

    setFriends(friendsWithCounts)
  }

  const searchUsers = async (query) => {
    if (!query || query.length < 2) {
      setSearchResults([])
      return
    }

    setSearching(true)

    const { data } = await supabase
      .from('profiles')
      .select('*')
      .ilike('username', `%${query}%`)
      .neq('id', user.id)
      .limit(10)

    setSearchResults(data || [])
    setSearching(false)
  }

  const handleSearchChange = (value) => {
    setSearchQuery(value)
    clearTimeout(window.userSearchTimeout)
    window.userSearchTimeout = setTimeout(() => searchUsers(value), 300)
  }

  const addFriend = async (friendId) => {
    const { error } = await supabase
      .from('friendships')
      .insert({ user_id: user.id, friend_id: friendId })

    if (error) {
      alert('Error adding friend: ' + error.message)
    } else {
      loadFriends()
      setSearchQuery('')
      setSearchResults([])
      setActiveView('friends')
    }
  }

  const removeFriend = async (friendId) => {
    if (!confirm('Remove this friend?')) return

    const { error } = await supabase
      .from('friendships')
      .delete()
      .eq('user_id', user.id)
      .eq('friend_id', friendId)

    if (error) {
      alert('Error removing friend: ' + error.message)
    } else {
      loadFriends()
    }
  }

  const isFriend = (userId) => {
    return friends.some(f => f.id === userId)
  }

  if (selectedFriend) {
    return (
      <FriendProfile 
        friend={selectedFriend} 
        onBack={() => setSelectedFriend(null)}
        currentUserId={user.id}
      />
    )
  }

  return (
    <div className="friends-container">
      <div className="friends-header">
        <h2>Friends</h2>
        <p className="subtitle">{friends.length} friends</p>
      </div>

      <div className="view-tabs">
        <button
          className={`view-tab ${activeView === 'friends' ? 'active' : ''}`}
          onClick={() => setActiveView('friends')}
        >
          My Friends
        </button>
        <button
          className={`view-tab ${activeView === 'search' ? 'active' : ''}`}
          onClick={() => setActiveView('search')}
        >
          Add Friends
        </button>
      </div>

      {activeView === 'search' && (
        <div className="search-section">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by username..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="search-input"
            />
            {searching && <span className="searching">Searching...</span>}
          </div>

          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((result) => (
                <div key={result.id} className="user-result">
                  <div className="user-avatar">{result.username[0].toUpperCase()}</div>
                  <div className="user-info">
                    <strong>@{result.username}</strong>
                    <span>{result.full_name || 'No name'}</span>
                  </div>
                  {isFriend(result.id) ? (
                    <span className="already-friend">✓ Friends</span>
                  ) : (
                    <button onClick={() => addFriend(result.id)} className="add-friend-btn">
                      Add Friend
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}

          {searchQuery.length >= 2 && searchResults.length === 0 && !searching && (
            <p className="no-results">No users found</p>
          )}
        </div>
      )}

      {activeView === 'friends' && (
        <div className="friends-list">
          {friends.length === 0 ? (
            <div className="empty-state">
              <p>No friends yet!</p>
              <p className="hint">Search for users to add them as friends</p>
              <button onClick={() => setActiveView('search')} className="search-prompt-btn">
                Find Friends
              </button>
            </div>
          ) : (
            friends.map((friend) => (
              <div 
                key={friend.id} 
                className="friend-card clickable"
                onClick={() => setSelectedFriend(friend)}
              >
                <div className="friend-avatar">{friend.username[0].toUpperCase()}</div>
                <div className="friend-info">
                  <strong>@{friend.username}</strong>
                  <span>{friend.full_name || 'No name'}</span>
                  <span className="rec-count">{friend.recommendation_count} public recommendations</span>
                </div>
                <span className="view-arrow">→</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

export default Friends