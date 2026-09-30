import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { restaurantsApi, bookingsApi, ordersApi, menusApi, uploadsApi, resolveImageUrl } from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout/DashboardLayout';
import {
  BarChart2, ShoppingBag, BookOpen, Camera, Plus, Trash2,
  Edit3, Check, X, Clock, Settings, TrendingUp,
  CheckCircle, AlertCircle, Star, DollarSign
} from 'lucide-react';
import '../customer/dashboard.css';
import img1 from '../../assets/images/restaurant_interior.png';
import promoPasta from '../../assets/images/promo_pasta.png';

// ── Sidebar Config ─────────────────────────────────────────────────────────
const ownerSidebarConfig = [
  { id: 'overview', label: 'Dashboard Overview', icon: BarChart2 },
  {
    id: 'restaurant-group',
    label: 'My Restaurant',
    icon: Settings,
    subItems: [
      { id: 'profile', label: 'Restaurant Profile' },
      { id: 'gallery', label: 'Gallery' },
    ],
  },
  {
    id: 'operations-group',
    label: 'Operations',
    icon: ShoppingBag,
    subItems: [
      { id: 'menu', label: 'Menu Management' },
      { id: 'bookings', label: 'Booking Management' },
      { id: 'orders', label: 'Order Management' },
    ],
  },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
  { id: 'settings', label: 'Settings', icon: Settings },
];

// ── SVG Charts (shared) ────────────────────────────────────────────────────
const BarChartSVG = ({ data, color = '#d78a26' }) => {
  const max = Math.max(...data.map(d => d.value));
  const w = 420, h = 150, padL = 40, padB = 28, barW = 34, gap = 8;
  return (
    <svg viewBox={`0 0 ${w} ${h + padB}`} style={{ width: '100%', height: 'auto' }}>
      {[0.33, 0.66, 1].map(pct => (
        <line key={pct} x1={padL} y1={h - h * pct} x2={w} y2={h - h * pct}
          stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {data.map((d, i) => {
        const bh = (d.value / max) * (h - 8);
        const x = padL + i * (barW + gap);
        return (
          <g key={i}>
            <rect x={x} y={h - bh} width={barW} height={bh}
              fill={color} rx="4" opacity={i === data.length - 1 ? 1 : 0.55} />
            <text x={x + barW / 2} y={h + 18} textAnchor="middle"
              fill="rgba(255,255,255,0.4)" fontSize="10">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};// ── Toast ──────────────────────────────────────────────────────────────────
const Toast = ({ message, type = 'success', onClose }) => (
  <div style={{
    position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
    background: type === 'success' ? '#4caf80' : type === 'error' ? '#e05555' : '#d78a26',
    color: '#fff', padding: '0.85rem 1.25rem', borderRadius: '12px',
    fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    animation: 'fadeInUp 0.3s ease',
  }}>
    {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
    {message}
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: '0.5rem' }}>✕</button>
  </div>
);

// ── Menu Dialog (Add / Edit) ───────────────────────────────────────────────
const CATEGORIES = ['Starters', 'Main Course', 'Desserts', 'Beverages', 'Salads', 'Sides'];

const MenuDialog = ({ item, onSave, onClose }) => {
  const isEdit = !!item;
  const [form, setForm] = useState({
    name: item?.name || '',
    category: item?.category || 'Main Course',
    price: item?.price || '',
    description: item?.description || '',
    available: item?.available ?? true,
    spicy: item?.spicy ?? false,
    veg: item?.veg ?? false,
    image: item?.rawImage || item?.image || '',
  });
  const [uploading, setUploading] = useState(false);
  const photoRef = useRef(null);

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be under 5 MB');
      return;
    }
    setUploading(true);
    try {
      const { url } = await uploadsApi.upload(file);
      setForm(p => ({ ...p, image: url }));
    } catch (err) {
      console.error(err);
      alert(err.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.price) return;
    onSave({ ...form, price: parseFloat(form.price) });
  };

  const photoPreview = resolveImageUrl(form.image);

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#181818', borderRadius: '20px', padding: '2rem',
        width: '100%', maxWidth: 520, border: '1px solid rgba(255,255,255,0.08)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6)', animation: 'fadeInUp 0.25s ease',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ margin: 0, fontSize: '1.25rem' }}>{isEdit ? 'Edit Menu Item' : 'Add New Menu Item'}</h2>
          <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', color: '#fff', cursor: 'pointer', padding: '0.4rem', borderRadius: '8px', display: 'flex' }}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="dash-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Photo</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 12, background: '#1a1a1a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  overflow: 'hidden', flexShrink: 0, fontSize: '1.6rem',
                  border: '1px solid rgba(255,255,255,0.08)',
                }}>
                  {photoPreview
                    ? <img src={photoPreview} alt="Item preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    : (form.image || '🍽️')}
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                  <button type="button" className="dash-btn-outline" style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}
                    disabled={uploading} onClick={() => photoRef.current?.click()}>
                    {uploading ? 'Uploading…' : 'Upload photo'}
                  </button>
                  {form.image && form.image.startsWith('/uploads/') && (
                    <button type="button" style={{ background: 'none', border: 'none', color: '#e05555', cursor: 'pointer', fontSize: '0.78rem', textAlign: 'left', padding: 0 }}
                      onClick={() => setForm(p => ({ ...p, image: '' }))}>
                      Remove photo
                    </button>
                  )}
                </div>
                <input ref={photoRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoUpload} style={{ display: 'none' }} />
              </div>
            </div>
            <div className="dash-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Item Name *</label>
              <input className="dash-input" placeholder="e.g. Truffle Burger"
                value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="dash-form-group">
              <label>Category</label>
              <select className="dash-input" value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                style={{ cursor: 'pointer' }}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="dash-form-group">
              <label>Price (USD) *</label>
              <input className="dash-input" type="number" min="0" step="0.01" placeholder="0.00"
                value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))} required />
            </div>
            <div className="dash-form-group" style={{ gridColumn: '1 / -1' }}>
              <label>Description</label>
              <textarea className="dash-input" rows={3} placeholder="Brief description of the item..."
                value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                style={{ resize: 'vertical' }} />
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
            {[
              { key: 'available', label: '✓ Available', activeColor: '#4caf80' },
              { key: 'spicy', label: '🌶 Spicy', activeColor: '#e05555' },
              { key: 'veg', label: '🥦 Vegetarian', activeColor: '#4caf80' },
            ].map(toggle => (
              <button
                key={toggle.key}
                type="button"
                onClick={() => setForm(p => ({ ...p, [toggle.key]: !p[toggle.key] }))}
                style={{
                  padding: '0.5rem 1rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer',
                  border: `1px solid ${form[toggle.key] ? toggle.activeColor : 'rgba(255,255,255,0.15)'}`,
                  background: form[toggle.key] ? `${toggle.activeColor}20` : 'transparent',
                  color: form[toggle.key] ? toggle.activeColor : 'var(--text-muted)',
                  transition: 'all 0.2s',
                }}
              >{toggle.label}</button>
            ))}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <button type="button" className="dash-btn-outline" style={{ padding: '0.65rem 1.5rem' }} onClick={onClose}>Cancel</button>
            <button type="submit" className="dash-btn-primary" style={{ padding: '0.65rem 1.5rem' }}>
              {isEdit ? <><Check size={16} style={{ marginRight: 6 }} />Update Item</> : <><Plus size={16} style={{ marginRight: 6 }} />Add Item</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Delete Confirm Dialog ──────────────────────────────────────────────────
const DeleteDialog = ({ item, onConfirm, onClose }) => (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', zIndex: 1000,
    display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem',
  }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
    <div style={{
      background: '#181818', borderRadius: '20px', padding: '2rem',
      width: '100%', maxWidth: 400, border: '1px solid rgba(224,85,85,0.2)',
      boxShadow: '0 20px 60px rgba(0,0,0,0.6)', textAlign: 'center',
      animation: 'fadeInUp 0.25s ease',
    }}>
      <div style={{ width: 56, height: 56, background: 'rgba(224,85,85,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem' }}>
        <Trash2 size={24} color="#e05555" />
      </div>
      <h3 style={{ margin: '0 0 0.5rem' }}>Delete "{item.name}"?</h3>
      <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem', fontSize: '0.9rem' }}>This action cannot be undone.</p>
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
        <button className="dash-btn-outline" style={{ padding: '0.65rem 1.5rem' }} onClick={onClose}>Cancel</button>
        <button className="dash-btn-primary"
          style={{ padding: '0.65rem 1.5rem', background: '#e05555', borderColor: '#e05555' }}
          onClick={onConfirm}>Delete</button>
      </div>
    </div>
  </div>
);

// ── Dashboard Overview ─────────────────────────────────────────────────────
const DashboardOverview = ({ setActiveTab, orders, bookings }) => {
  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const activeOrders = orders.filter(o => o.status === 'preparing').length;

  return (
    <>
      <div className="page-header">
        <h1>Dashboard Overview</h1>
        <p>Your restaurant's performance at a glance.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        {[
          { label: "Today's Revenue", value: '$1,245.50', sub: '+12% from yesterday', color: '#d78a26', icon: DollarSign },
          { label: 'New Orders', value: activeOrders || 3, sub: `${activeOrders} active now`, color: '#C6F135', icon: ShoppingBag },
          { label: 'Table Bookings', value: pendingBookings || 12, sub: `${pendingBookings} pending`, color: '#4caf80', icon: BookOpen },
          { label: 'Avg. Rating', value: '4.8', sub: 'Based on 342 reviews', color: '#ffc107', icon: Star },
        ].map((stat, i) => (
          <div key={i} className="dash-panel" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{stat.label}</div>
              <div style={{ width: 34, height: 34, background: `${stat.color}20`, borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <stat.icon size={16} color={stat.color} />
              </div>
            </div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem' }}>
        <div className="dash-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Recent Orders</h3>
            <button className="dash-btn-outline" style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem' }} onClick={() => setActiveTab('orders')}>View All</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {orders.slice(0, 3).map(order => (
              <div key={order.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.85rem 1rem', background: 'var(--dash-bg)', borderRadius: '10px' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>Order #{order.id}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{order.items}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 700, color: 'var(--dash-accent)', marginBottom: '0.2rem' }}>${order.total}</div>
                  <span style={{
                    fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600,
                    background: order.status === 'delivered' ? '#4caf8020' : order.status === 'ready' ? '#C6F13520' : '#ffa50020',
                    color: order.status === 'delivered' ? '#4caf80' : order.status === 'ready' ? '#C6F135' : '#ffa500',
                  }}>{order.status.toUpperCase()}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="dash-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <h3 style={{ margin: 0 }}>Upcoming Bookings</h3>
            <button className="dash-btn-outline" style={{ padding: '0.35rem 0.9rem', fontSize: '0.8rem' }} onClick={() => setActiveTab('bookings')}>View</button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {bookings.filter(b => b.status === 'confirmed' || b.status === 'pending').slice(0, 3).map(booking => (
              <div key={booking.id} style={{ padding: '0.85rem 1rem', background: 'var(--dash-bg)', borderRadius: '10px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem' }}>
                  {booking.name} <span style={{ color: 'var(--text-muted)', fontWeight: 400, fontSize: '0.8rem' }}>({booking.guests} guests)</span>
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--dash-accent)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <Clock size={12} /> {booking.date} at {booking.time}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

// ── Restaurant Profile ─────────────────────────────────────────────────────
const RestaurantProfile = ({ showToast }) => (
  <>
    <div className="page-header">
      <h1>Restaurant Profile</h1>
      <p>Manage your public restaurant details and settings.</p>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem' }}>
      <div className="dash-panel">
        <h3 style={{ marginBottom: '1.5rem' }}>General Information</h3>
        <div className="dash-form-group"><label>Restaurant Name</label><input className="dash-input" defaultValue="The Golden Plate" /></div>
        <div className="dash-form-group"><label>Cuisine Type</label>
          <select className="dash-input" defaultValue="Continental" style={{ cursor: 'pointer' }}>
            {['Continental', 'Italian', 'Japanese', 'Indian', 'American', 'Chinese'].map(c => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="dash-form-group"><label>Description</label><textarea className="dash-input" rows={3} defaultValue="Fine dining experience offering the best culinary delights." /></div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="dash-form-group"><label>Location</label><input className="dash-input" defaultValue="123 Culinary Ave" /></div>
          <div className="dash-form-group"><label>Phone</label><input className="dash-input" defaultValue="+1 (555) 123-4567" /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="dash-form-group"><label>Opening Hours</label><input className="dash-input" type="time" defaultValue="10:00" /></div>
          <div className="dash-form-group"><label>Closing Hours</label><input className="dash-input" type="time" defaultValue="22:00" /></div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          <div className="dash-form-group"><label>Seating Capacity</label><input className="dash-input" type="number" defaultValue={50} /></div>
          <div className="dash-form-group"><label>Average Price (per person)</label><input className="dash-input" type="number" defaultValue={35} /></div>
        </div>
        <button className="dash-btn-primary" onClick={() => showToast('Restaurant profile saved!')}>Save Changes</button>
      </div>
      <div>
        <div className="dash-panel" style={{ marginBottom: '1.25rem' }}>
          <h3 style={{ marginBottom: '1rem' }}>Cover Photo</h3>
          <div style={{ position: 'relative', width: '100%', height: 160, borderRadius: '12px', overflow: 'hidden', marginBottom: '0.75rem' }}>
            <img src={img1} alt="Restaurant" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button onClick={() => showToast('Photo upload would open here.', 'info')} style={{ position: 'absolute', bottom: '0.75rem', right: '0.75rem', background: 'var(--dash-accent)', border: 'none', padding: '0.5rem', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Camera size={16} color="#000" />
            </button>
          </div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textAlign: 'center' }}>Recommended: 1200×800px</p>
        </div>
        <div className="dash-panel">
          <h3 style={{ marginBottom: '1rem' }}>Amenities</h3>
          {['Free WiFi', 'Parking Available', 'Outdoor Seating', 'Wheelchair Access', 'Live Music', 'Takeaway'].map(a => (
            <label key={a} style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.6rem', cursor: 'pointer', fontSize: '0.88rem', color: 'var(--text-muted)' }}>
              <input type="checkbox" defaultChecked={['Free WiFi', 'Parking Available', 'Takeaway'].includes(a)} style={{ accentColor: 'var(--dash-accent)', width: 15, height: 15 }} />
              {a}
            </label>
          ))}
        </div>
      </div>
    </div>
  </>
);

// ── Gallery ────────────────────────────────────────────────────────────────
const Gallery = ({ showToast, restaurantId }) => {
  const [photos, setPhotos] = useState([]);
  const [busy, setBusy] = useState(false);
  const fileRef = useRef(null);

  useEffect(() => {
    if (!restaurantId) return;
    restaurantsApi.get(restaurantId)
      .then(r => setPhotos(r.images || []))
      .catch(console.error);
  }, [restaurantId]);

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      showToast('Image must be under 5 MB', 'error');
      return;
    }
    setBusy(true);
    try {
      const { url } = await uploadsApi.upload(file);
      const updated = await restaurantsApi.addImages(restaurantId, [url]);
      setPhotos(updated.images || []);
      showToast('Photo uploaded!');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Upload failed', 'error');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (url) => {
    try {
      const updated = await restaurantsApi.removeImage(restaurantId, url);
      setPhotos(updated.images || []);
      showToast('Photo removed.', 'error');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Could not remove photo', 'error');
    }
  };

  return (
    <>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>Gallery</h1><p>Manage your restaurant's photo gallery.</p></div>
        <button className="dash-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }} disabled={busy} onClick={() => fileRef.current?.click()}>
          <Plus size={16} /> {busy ? 'Uploading…' : 'Upload Photo'}
        </button>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handleUpload} style={{ display: 'none' }} />
      </div>
      <div className="dash-panel">
        {photos.length === 0 ? (
          <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>
            No photos yet — upload your first one (JPEG, PNG, or WebP, up to 5 MB).
          </p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
            {photos.map((photo, i) => {
              const src = resolveImageUrl(photo);
              return (
                <div key={photo} style={{ position: 'relative', borderRadius: '12px', overflow: 'hidden', aspectRatio: '4/3' }}>
                  {src && <img src={src} alt={`Gallery ${i + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                  <div style={{
                    position: 'absolute', inset: 0, background: 'rgba(0,0,0,0)', transition: 'background 0.2s',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(0,0,0,0.6)'; e.currentTarget.querySelectorAll('button').forEach(b => b.style.opacity = '1'); }}
                    onMouseLeave={e => { e.currentTarget.style.background = 'rgba(0,0,0,0)'; e.currentTarget.querySelectorAll('button').forEach(b => b.style.opacity = '0'); }}
                  >
                    <button onClick={() => handleRemove(photo)} style={{ opacity: 0, background: '#e05555', border: 'none', color: '#fff', padding: '0.4rem', borderRadius: '8px', cursor: 'pointer', transition: 'opacity 0.2s', display: 'flex', alignItems: 'center', gap: '0.3rem', fontSize: '0.8rem' }}>
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

// ── Menu Management ────────────────────────────────────────────────────────
const MenuManagement = ({ showToast, restaurantId }) => {
  const [items, setItems] = useState([]);

  useEffect(() => {
    if (!restaurantId) return;
    menusApi.list(restaurantId).then(data => {
      setItems(data.map(m => ({
        id: m.id, name: m.name, category: m.category, price: m.price,
        available: m.available, spicy: m.spicy, veg: m.veg,
        description: m.description,
        img: resolveImageUrl(m.image) || promoPasta,
        rawImage: m.image,
      })));
    }).catch(console.error);
  }, [restaurantId]);
  const [dialog, setDialog] = useState(null); // null | { mode: 'add'|'edit', item?: {...} }
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [filterCat, setFilterCat] = useState('All');

  const categories = ['All', ...Array.from(new Set(items.map(i => i.category)))];
  const filtered = filterCat === 'All' ? items : items.filter(i => i.category === filterCat);

  const handleSave = async (form) => {
    if (!restaurantId) return;
    if (dialog.mode === 'add') {
      const created = await menusApi.create({
        restaurant: restaurantId, name: form.name, category: form.category,
        price: form.price, description: form.description || '',
        isAvailable: form.available, spicy: form.spicy, veg: form.veg,
        image: form.image || '🍽️',
      });
      setItems(prev => [...prev, {
        ...form, id: created.id,
        img: resolveImageUrl(created.image) || promoPasta,
        rawImage: created.image,
      }]);
      showToast(`"${form.name}" added to menu!`);
    } else {
      const updated = await menusApi.update(dialog.item.id, {
        name: form.name, category: form.category, price: form.price,
        description: form.description, isAvailable: form.available, spicy: form.spicy, veg: form.veg,
        ...(form.image ? { image: form.image } : {}),
      });
      setItems(prev => prev.map(i => i.id === dialog.item.id ? {
        ...i, ...form,
        img: resolveImageUrl(updated.image) || promoPasta,
        rawImage: updated.image,
      } : i));
      showToast(`"${form.name}" updated!`);
    }
    setDialog(null);
  };

  const handleDelete = async () => {
    await menusApi.delete(deleteTarget.id);
    setItems(prev => prev.filter(i => i.id !== deleteTarget.id));
    showToast(`"${deleteTarget.name}" removed from menu.`, 'error');
    setDeleteTarget(null);
  };

  const handleToggleAvailability = async (id) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    await menusApi.update(id, { isAvailable: !item.available });
    setItems(prev => prev.map(i => i.id === id ? { ...i, available: !i.available } : i));
  };

  return (
    <>
      {dialog && <MenuDialog item={dialog.item} onSave={handleSave} onClose={() => setDialog(null)} />}
      {deleteTarget && <DeleteDialog item={deleteTarget} onConfirm={handleDelete} onClose={() => setDeleteTarget(null)} />}

      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div><h1>Menu Management</h1><p>Add, edit, or remove meals from your menu.</p></div>
        <button className="dash-btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          onClick={() => setDialog({ mode: 'add' })}>
          <Plus size={18} /> Add Meal
        </button>
      </div>

      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {categories.map(cat => (
          <button key={cat}
            onClick={() => setFilterCat(cat)}
            style={{
              padding: '0.4rem 1rem', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 600,
              border: `1px solid ${filterCat === cat ? 'var(--dash-accent)' : 'rgba(255,255,255,0.12)'}`,
              background: filterCat === cat ? 'var(--dash-accent)' : 'transparent',
              color: filterCat === cat ? '#000' : 'var(--text-muted)',
              cursor: 'pointer', transition: 'all 0.2s',
            }}>{cat}</button>
        ))}
      </div>

      <div className="dash-panel">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {filtered.map(item => (
            <div key={item.id} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: '14px', overflow: 'hidden', background: 'var(--dash-bg)', transition: 'border-color 0.2s' }}
              onMouseEnter={e => e.currentTarget.style.borderColor = 'rgba(215,138,38,0.3)'}
              onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'}>
              <div style={{ height: 140, overflow: 'hidden', position: 'relative' }}>
                <img src={item.img} alt={item.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                {!item.available && (
                  <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.65)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                    UNAVAILABLE
                  </div>
                )}
                <div style={{ position: 'absolute', top: '0.5rem', left: '0.5rem', display: 'flex', gap: '0.3rem' }}>
                  {item.spicy && <span style={{ background: '#e05555', color: '#fff', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>🌶 SPICY</span>}
                  {item.veg && <span style={{ background: '#4caf80', color: '#fff', padding: '0.15rem 0.4rem', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>🥦 VEG</span>}
                </div>
              </div>
              <div style={{ padding: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{item.name}</div>
                  <div style={{ color: 'var(--dash-accent)', fontWeight: 700, fontSize: '0.95rem' }}>${item.price.toFixed(2)}</div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--dash-accent)', opacity: 0.7, marginBottom: '0.3rem' }}>{item.category}</div>
                {item.description && <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '0.75rem', lineHeight: 1.4 }}>{item.description}</div>}

                {/* Availability toggle */}
                <button onClick={() => handleToggleAvailability(item.id)}
                  style={{
                    width: '100%', padding: '0.4rem', marginBottom: '0.6rem',
                    background: item.available ? '#4caf8015' : '#e0555515',
                    border: `1px solid ${item.available ? '#4caf8030' : '#e0555530'}`,
                    color: item.available ? '#4caf80' : '#e05555',
                    borderRadius: '8px', cursor: 'pointer', fontSize: '0.78rem', fontWeight: 600,
                  }}>
                  {item.available ? '✓ Available — click to hide' : '✕ Unavailable — click to show'}
                </button>

                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="dash-btn-outline"
                    style={{ flex: 1, padding: '0.4rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', fontSize: '0.82rem' }}
                    onClick={() => setDialog({ mode: 'edit', item })}>
                    <Edit3 size={14} /> Edit
                  </button>
                  <button className="dash-btn-outline"
                    style={{ padding: '0.4rem 0.7rem', color: '#e05555', borderColor: '#e0555540', display: 'flex', alignItems: 'center' }}
                    onClick={() => setDeleteTarget(item)}>
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// ── Booking Management ─────────────────────────────────────────────────────
const BookingManagement = ({ bookings, onAccept, onReject }) => (
  <>
    <div className="page-header">
      <h1>Booking Management</h1>
      <p>Review and respond to table reservation requests.</p>
    </div>

    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
      {[
        { label: 'All', count: bookings.length, color: '#fff' },
        { label: 'Pending', count: bookings.filter(b => b.status === 'pending').length, color: '#ffa500' },
        { label: 'Confirmed', count: bookings.filter(b => b.status === 'confirmed').length, color: '#4caf80' },
        { label: 'Rejected', count: bookings.filter(b => b.status === 'rejected').length, color: '#e05555' },
      ].map(s => (
        <div key={s.label} className="dash-panel" style={{ padding: '1rem 1.25rem', textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.count}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
        </div>
      ))}
    </div>

    <div className="dash-panel">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
        {bookings.map(booking => (
          <div key={booking.id} className="list-row" style={{ alignItems: 'center', padding: '1.25rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                <div style={{ fontWeight: 700 }}>{booking.name}</div>
                <span style={{
                  fontSize: '0.72rem', padding: '0.2rem 0.5rem', borderRadius: '4px', fontWeight: 600,
                  background: booking.status === 'confirmed' ? '#4caf8020' : booking.status === 'rejected' ? '#e0555520' : '#ffa50020',
                  color: booking.status === 'confirmed' ? '#4caf80' : booking.status === 'rejected' ? '#e05555' : '#ffa500',
                }}>{booking.status.toUpperCase()}</span>
              </div>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', gap: '1.25rem', flexWrap: 'wrap' }}>
                <span><BookOpen size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />{booking.date}</span>
                <span><Clock size={13} style={{ marginRight: 4, verticalAlign: 'middle' }} />{booking.time}</span>
                <span>👥 {booking.guests} guests</span>
                {booking.note && <span>📝 "{booking.note}"</span>}
              </div>
            </div>
            {booking.status === 'pending' && (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button className="dash-btn-primary" style={{ padding: '0.5rem 1rem', background: '#4caf80', borderColor: '#4caf80', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                  onClick={() => onAccept(booking.id)}>
                  <Check size={15} /> Accept
                </button>
                <button className="dash-btn-outline" style={{ padding: '0.5rem 0.9rem', color: '#e05555', borderColor: '#e05555', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem' }}
                  onClick={() => onReject(booking.id)}>
                  <X size={15} /> Reject
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  </>
);

// ── Order Management ───────────────────────────────────────────────────────
const OrderManagement = ({ orders, onMarkReady, onMarkDelivered }) => (
  <>
    <div className="page-header">
      <h1>Order Management</h1>
      <p>Manage and track all incoming orders.</p>
    </div>

    <div style={{ display: 'flex', gap: '1rem', marginBottom: '1.5rem' }}>
      {[
        { label: 'All Orders', count: orders.length, color: '#fff' },
        { label: 'Preparing', count: orders.filter(o => o.status === 'preparing').length, color: '#ffa500' },
        { label: 'Ready', count: orders.filter(o => o.status === 'ready').length, color: '#C6F135' },
        { label: 'Delivered', count: orders.filter(o => o.status === 'delivered').length, color: '#4caf80' },
      ].map(s => (
        <div key={s.label} className="dash-panel" style={{ padding: '1rem 1.25rem', textAlign: 'center', flex: 1 }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 700, color: s.color }}>{s.count}</div>
          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{s.label}</div>
        </div>
      ))}
    </div>

    <div className="dash-panel">
      {orders.map(order => (
        <div key={order.id} className="list-row" style={{ alignItems: 'center', padding: '1.25rem 0', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 700, marginBottom: '0.25rem' }}>Order #{order.id} — {order.customer}</div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{order.items}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <span style={{ color: 'var(--dash-accent)', fontWeight: 700 }}>${order.total}</span>
            <span style={{
              fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600,
              background: order.status === 'delivered' ? '#4caf8020' : order.status === 'ready' ? '#C6F13520' : '#ffa50020',
              color: order.status === 'delivered' ? '#4caf80' : order.status === 'ready' ? '#C6F135' : '#ffa500',
            }}>{order.status.toUpperCase()}</span>
            {order.status === 'preparing' && (
              <button className="dash-btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem' }}
                onClick={() => onMarkReady(order.id)}>Mark Ready</button>
            )}
            {order.status === 'ready' && (
              <button className="dash-btn-primary" style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', background: '#4caf80', borderColor: '#4caf80' }}
                onClick={() => onMarkDelivered(order.id)}>Mark Delivered</button>
            )}
          </div>
        </div>
      ))}
    </div>
  </>
);

// ── Analytics ──────────────────────────────────────────────────────────────
const OwnerAnalytics = () => {
  const revenueData = [
    { label: 'Mon', value: 820 }, { label: 'Tue', value: 1140 },
    { label: 'Wed', value: 970 }, { label: 'Thu', value: 1350 },
    { label: 'Fri', value: 1820 }, { label: 'Sat', value: 2100 },
    { label: 'Sun', value: 1640 },
  ];
  const ordersData = [
    { label: 'Mon', value: 28 }, { label: 'Tue', value: 42 },
    { label: 'Wed', value: 35 }, { label: 'Thu', value: 50 },
    { label: 'Fri', value: 68 }, { label: 'Sat', value: 80 },
    { label: 'Sun', value: 61 },
  ];
  const peakHours = [
    { label: '10', value: 5 }, { label: '11', value: 12 }, { label: '12', value: 45 },
    { label: '13', value: 62 }, { label: '14', value: 38 }, { label: '15', value: 20 },
    { label: '16', value: 18 }, { label: '17', value: 28 }, { label: '18', value: 55 },
    { label: '19', value: 80 }, { label: '20', value: 100 }, { label: '21', value: 72 },
  ];

  return (
    <>
      <div className="page-header">
        <h1>Analytics</h1>
        <p>Detailed insights and performance reports.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'This Week Revenue', value: '$9,840', change: '+18%', up: true },
          { label: 'Total Orders', value: '364', change: '+22%', up: true },
          { label: 'Avg. Order Value', value: '$27.03', change: '+5%', up: true },
          { label: 'Customer Rating', value: '4.8 ⭐', change: '+0.2', up: true },
        ].map((kpi, i) => (
          <div key={i} className="dash-panel" style={{ padding: '1.25rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.4rem' }}>{kpi.label}</div>
            <div style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--dash-accent)' }}>{kpi.value}</div>
            <div style={{ fontSize: '0.78rem', color: kpi.up ? '#4caf80' : '#e05555', marginTop: '0.3rem' }}>{kpi.change} vs last week</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="dash-panel">
          <h3 style={{ marginBottom: '1.25rem' }}>Daily Revenue This Week</h3>
          <BarChartSVG data={revenueData} color="#d78a26" />
        </div>
        <div className="dash-panel">
          <h3 style={{ marginBottom: '1.25rem' }}>Daily Orders This Week</h3>
          <BarChartSVG data={ordersData} color="#4caf80" />
        </div>
      </div>

      <div className="dash-panel">
        <h3 style={{ marginBottom: '1.25rem' }}>Peak Hours (Today)</h3>
        <BarChartSVG data={peakHours} color="#C6F135" />
        <div style={{ marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
          🔥 Peak hours: 19:00–21:00 — consider adding more staff during these times.
        </div>
      </div>
    </>
  );
};

// ── Owner Settings ─────────────────────────────────────────────────────────
const OwnerSettings = ({ showToast }) => (
  <>
    <div className="page-header">
      <h1>Settings</h1>
      <p>Manage account and notification preferences.</p>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <div className="dash-panel">
        <h3 style={{ marginBottom: '1.5rem' }}>Account Settings</h3>
        <div className="dash-form-group"><label>Display Name</label><input className="dash-input" defaultValue="Maria Santos" /></div>
        <div className="dash-form-group"><label>Email Address</label><input className="dash-input" type="email" defaultValue="maria@goldenplate.com" /></div>
        <div className="dash-form-group"><label>Phone Number</label><input className="dash-input" defaultValue="+1 (555) 987-6543" /></div>
        <div className="dash-form-group"><label>New Password</label><input className="dash-input" type="password" placeholder="Leave blank to keep current" /></div>
        <button className="dash-btn-primary" onClick={() => showToast('Account settings saved!')}>Save Changes</button>
      </div>
      <div className="dash-panel">
        <h3 style={{ marginBottom: '1.5rem' }}>Notification Preferences</h3>
        {[
          { label: 'New Order Notifications', desc: 'Get alerted for new orders', default: true },
          { label: 'Booking Requests', desc: 'Notified when a table is booked', default: true },
          { label: 'Review Alerts', desc: 'Get notified for new reviews', default: true },
          { label: 'Promotional Emails', desc: 'Receive marketing emails', default: false },
          { label: 'Weekly Reports', desc: 'Weekly performance summary', default: true },
        ].map((pref, i) => (
          <label key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', cursor: 'pointer' }}>
            <div>
              <div style={{ fontSize: '0.88rem', fontWeight: 600 }}>{pref.label}</div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{pref.desc}</div>
            </div>
            <input type="checkbox" defaultChecked={pref.default} style={{ accentColor: 'var(--dash-accent)', width: 16, height: 16 }} />
          </label>
        ))}
        <button className="dash-btn-outline" style={{ width: '100%', marginTop: '0.5rem' }} onClick={() => showToast('Notification preferences saved!')}>Save Preferences</button>
      </div>
    </div>
  </>
);

// ── Main Owner Dashboard ───────────────────────────────────────────────────
const OwnerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);

  const [restaurantId, setRestaurantId] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [orders, setOrders] = useState([]);

  const { user, isAuthenticated } = useAuth();

  const loadOwnerData = async (ownerId, restId) => {
    if (!restId) return;
    try {
      const [bookingData, orderData] = await Promise.all([
        bookingsApi.list({ restaurantId: restId }),
        ordersApi.list({ restaurantId: restId }),
      ]);
      setBookings(bookingData.map(b => ({
        id: b.id, name: b.name, date: b.date, time: b.time, guests: b.guests,
        status: b.status, note: b.note || b.specialRequest || '',
      })));
      setOrders(orderData.map(o => ({
        id: o.orderId || o.id?.slice(-4), orderDbId: o.id,
        customer: o.customer, items: o.itemsSummary, total: Number(o.total).toFixed(2), status: o.status,
      })));
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    const init = async () => {
      const ownerId = user?.id;
      if (!ownerId) return;
      try {
        const rests = await restaurantsApi.byOwner(ownerId);
        if (rests?.length) {
          setRestaurantId(rests[0].id);
          loadOwnerData(ownerId, rests[0].id);
        }
      } catch (err) {
        console.error(err);
      }
    };
    init();
  }, [user?.id, isAuthenticated]);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleAcceptBooking = async (id) => {
    try {
      await bookingsApi.update(id, { status: 'confirmed' });
      if (restaurantId) loadOwnerData(user?.id, restaurantId);
      showToast('Booking confirmed!');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Could not confirm booking', 'error');
    }
  };

  const handleRejectBooking = async (id) => {
    try {
      await bookingsApi.update(id, { status: 'rejected', rejectionReason: 'Not available' });
      if (restaurantId) loadOwnerData(user?.id, restaurantId);
      showToast('Booking rejected.', 'error');
    } catch (err) {
      console.error(err);
      showToast(err.message || 'Could not reject booking', 'error');
    }
  };

  const handleMarkReady = async (id) => {
    const order = orders.find(o => o.id === id);
    if (order?.orderDbId) await ordersApi.updateStatus(order.orderDbId, 'ready');
    if (restaurantId) loadOwnerData(user?.id, restaurantId);
    showToast('Order marked as ready!');
  };

  const handleMarkDelivered = async (id) => {
    const order = orders.find(o => o.id === id);
    if (order?.orderDbId) await ordersApi.updateStatus(order.orderDbId, 'delivered');
    if (restaurantId) loadOwnerData(user?.id, restaurantId);
    showToast('Order marked as delivered!');
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <DashboardOverview setActiveTab={setActiveTab} orders={orders} bookings={bookings} />;
      case 'profile': return <RestaurantProfile showToast={showToast} />;
      case 'gallery': return <Gallery showToast={showToast} restaurantId={restaurantId} />;
      case 'menu': return <MenuManagement showToast={showToast} restaurantId={restaurantId} />;
      case 'bookings': return <BookingManagement bookings={bookings} onAccept={handleAcceptBooking} onReject={handleRejectBooking} />;
      case 'orders': return <OrderManagement orders={orders} onMarkReady={handleMarkReady} onMarkDelivered={handleMarkDelivered} />;
      case 'analytics': return <OwnerAnalytics />;
      case 'settings': return <OwnerSettings showToast={showToast} />;
      default: return <DashboardOverview setActiveTab={setActiveTab} orders={orders} bookings={bookings} />;
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .dash-form-group select.dash-input option {
          background: #181818;
          color: #fff;
        }
      `}</style>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <DashboardLayout sidebarConfig={ownerSidebarConfig} activeTab={activeTab} setActiveTab={setActiveTab} roleName="Restaurant Owner">
        {renderContent()}
      </DashboardLayout>
    </>
  );
};

export default OwnerDashboard;
