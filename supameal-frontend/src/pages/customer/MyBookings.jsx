import React, { useState, useEffect } from 'react';
import { Calendar, Users, MapPin, XCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { bookingsApi } from '../../services/api';
import './dashboard.css';

const BookingCard = ({ booking, status, onCancel }) => (
  <div className="list-row" style={{ alignItems: 'flex-start', padding: '1.25rem 0' }}>
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
        <div className="list-row-title">{booking.restaurant}</div>
        <span className={`status-badge status-${status}`}>{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.25rem', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Calendar size={14} /> {booking.date} · {booking.time}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><Users size={14} /> {booking.guests} Guests</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}><MapPin size={14} /> {booking.address}</span>
      </div>
      {booking.reason && (
        <div style={{ marginTop: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#e05555', fontSize: '0.83rem' }}>
          <XCircle size={14} /> {booking.reason}
        </div>
      )}
    </div>
    <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
      {status === 'pending' && <button className="dash-btn-danger" onClick={() => onCancel(booking.id)}>Cancel</button>}
      {status === 'confirmed' && <button className="dash-btn-outline" style={{ padding: '0.5rem 1rem', fontSize: '0.82rem' }}>Modify</button>}
    </div>
  </div>
);

const MyBookings = () => {
  const [tab, setTab] = useState('confirmed');
  const [bookings, setBookings] = useState({ confirmed: [], pending: [], rejected: [] });
  const { user } = useAuth();

  const loadBookings = async () => {
    if (!user?.id) return;
    try {
      const data = await bookingsApi.list({ customerId: user.id });
      const grouped = { confirmed: [], pending: [], rejected: [] };
      data.forEach(b => {
        const key = b.status === 'rejected' ? 'rejected' : b.status === 'pending' ? 'pending' : 'confirmed';
        grouped[key].push(b);
      });
      setBookings(grouped);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { loadBookings(); }, [user?.id]);

  const handleCancel = async (id) => {
    await bookingsApi.cancel(id);
    loadBookings();
  };

  const counts = {
    confirmed: bookings.confirmed.length,
    pending: bookings.pending.length,
    rejected: bookings.rejected.length,
  };

  return (
    <>
      <div className="page-header">
        <h1>My Bookings</h1>
        <p>Track and manage all your table reservations.</p>
      </div>

      <div className="dash-panel">
        <div className="tab-bar">
          {['confirmed', 'pending', 'rejected'].map(t => (
            <button key={t} className={`tab-btn ${tab === t ? 'active' : ''}`} onClick={() => setTab(t)}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
              <span style={{ marginLeft: '0.5rem', background: tab === t ? 'var(--dash-accent, #C6F135)' : 'rgba(255,255,255,0.1)', color: tab === t ? '#000' : 'var(--dash-muted, #8a8a8a)', borderRadius: '10px', padding: '1px 8px', fontSize: '0.75rem', fontWeight: 700 }}>
                {counts[t]}
              </span>
            </button>
          ))}
        </div>

        {bookings[tab].length === 0 ? (
          <div className="empty-state">
            <Calendar size={48} />
            <p>No {tab} bookings found.</p>
          </div>
        ) : (
          bookings[tab].map(b => <BookingCard key={b.id} booking={b} status={tab} onCancel={handleCancel} />)
        )}
      </div>
    </>
  );
};

export default MyBookings;
