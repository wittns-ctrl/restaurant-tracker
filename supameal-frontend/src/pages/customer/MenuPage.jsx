import { useState } from 'react';
import { Search, ShoppingCart, Star, Filter, Package } from 'lucide-react';
import { useCart } from '../../context/CartContext';
import { resolveImageUrl } from '../../services/api';
import './dashboard.css';

const CATEGORIES = ['All', 'Starters', 'Main Course', 'Burgers', 'Pasta', 'Sushi', 'Desserts', 'Drinks'];

const MenuPage = ({ setActiveTab }) => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const { cart, cartCount, addToCart, removeFromCart, menuItems } = useCart();

  const filtered = menuItems.filter(item =>
    (category === 'All' || item.category === category) &&
    item.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <h1>Menu</h1>
          <p>Browse meals and add items to your cart.</p>
        </div>
        {cartCount > 0 && (
          <button className="dash-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} onClick={() => setActiveTab('cart')}>
            <ShoppingCart size={18} /> View Cart ({cartCount})
          </button>
        )}
      </div>

      <div className="dash-panel" style={{ padding: '1rem 1.5rem', marginBottom: '1.5rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.75rem', background: '#1a1a1a', borderRadius: 10, padding: '0.7rem 1rem', border: '1px solid rgba(255,255,255,0.08)' }}>
          <Search size={18} style={{ color: 'var(--dash-muted, #8a8a8a)' }} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search meals..." style={{ background: 'none', border: 'none', color: 'var(--dash-text, #fff)', width: '100%', fontSize: '0.92rem' }} />
        </div>
        <Filter size={20} style={{ color: 'var(--dash-muted, #8a8a8a)' }} />
      </div>

      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '1.5rem' }}>
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setCategory(cat)} className={`category-pill ${category === cat ? 'active' : ''}`}>
            {cat}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '1.25rem' }}>
        {filtered.map(item => {
          const imgSrc = resolveImageUrl(item.image);
          return (
          <div key={item.id} className="dash-panel" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', marginBottom: 0 }}>
            <div style={{ marginBottom: '0.75rem', textAlign: 'center', background: '#1a1a1a', borderRadius: 12, padding: '1rem' }}>
              {imgSrc ? (
                <img src={imgSrc} alt={item.name} loading="lazy" style={{ width: '100%', height: 140, objectFit: 'cover', borderRadius: 8 }} />
              ) : (
                <Package size={40} color="var(--dash-accent)" />
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
              <span style={{ fontWeight: 600, color: 'var(--dash-text, #fff)', fontSize: '0.95rem' }}>{item.name}</span>
              <span style={{ color: 'var(--dash-accent, #C6F135)', fontWeight: 700, fontSize: '0.95rem', flexShrink: 0 }}>${item.price}</span>
            </div>
            <p style={{ color: 'var(--dash-muted, #8a8a8a)', fontSize: '0.8rem', marginBottom: '0.5rem', lineHeight: 1.5, flex: 1 }}>{item.desc}</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#ffc107', fontSize: '0.8rem', marginBottom: '1rem' }}>
              <Star size={13} fill="currentColor" /> {item.rating}
            </div>

            {cart[item.id] ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center' }}>
                <button className="qty-btn qty-btn-minus" onClick={() => removeFromCart(item.id)}>−</button>
                <span style={{ color: 'var(--dash-text, #fff)', fontWeight: 700, minWidth: 24, textAlign: 'center' }}>{cart[item.id]}</span>
                <button className="qty-btn qty-btn-plus" onClick={() => addToCart(item.id)}>+</button>
              </div>
            ) : (
              <button className="dash-btn-outline" style={{ width: '100%', padding: '0.65rem' }} onClick={() => addToCart(item.id)}>
                Add to Cart
              </button>
            )}
          </div>
          );
        })}
      </div>
    </>
  );
};

export default MenuPage;
