import React, { useState, useEffect } from 'react';
import { Heart, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../services/api';
import img1 from '../../assets/images/restaurant_interior.png';
import './dashboard.css';

const FavoritesPage = ({ setActiveTab }) => {
  const [favorites, setFavorites] = useState([]);
  const { user } = useAuth();

  const loadFavorites = async () => {
    if (!user?.id) return;
    try {
      const data = await usersApi.favorites(user.id);
      setFavorites(data.map(r => ({ ...r, image: r.image?.startsWith('http') ? r.image : img1, price: '$$' })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadFavorites(); }, [user?.id]);

  const handleRemove = async (restaurantId) => {
    await usersApi.removeFavorite(user.id, restaurantId);
    loadFavorites();
  };

  return (
    <>
      <div className="page-header">
        <h1>My Favorites</h1>
        <p>Your hand-picked collection of go-to restaurants.</p>
      </div>

      {favorites.length === 0 ? (
        <div className="dash-panel empty-state">
          <Heart size={56} />
          <p>You haven't saved any restaurants yet.</p>
          <button className="dash-btn-primary" style={{ marginTop: '1.5rem' }} onClick={() => setActiveTab('overview')}>Browse Restaurants</button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
          {favorites.map(r => (
            <div key={r.id} className="dash-panel" style={{ padding: 0, overflow: 'hidden', cursor: 'pointer', transition: 'transform 0.2s, border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
            >
              <div style={{ position: 'relative' }}>
                <img src={r.image} alt={r.name} style={{ width: '100%', height: 160, objectFit: 'cover' }} />
                <button
                  style={{ position: 'absolute', top: '0.75rem', right: '0.75rem', width: 36, height: 36, borderRadius: '50%', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  onClick={e => { e.stopPropagation(); handleRemove(r.id); }}
                >
                  <Heart size={16} fill="var(--dash-accent, #C6F135)" color="var(--dash-accent, #C6F135)" />
                </button>
              </div>
              <div style={{ padding: '1.25rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '1.05rem' }}>{r.name}</span>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{r.price}</span>
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>{r.cuisine}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ffc107', fontSize: '0.85rem' }}>
                  <Star size={14} fill="currentColor" /> {r.rating} ({r.reviews} reviews)
                </div>
                <button className="dash-btn-outline" style={{ width: '100%', marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
                  Order Now <ArrowRight size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
};

export default FavoritesPage;
