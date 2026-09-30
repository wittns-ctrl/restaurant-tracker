import React, { useState, useEffect } from 'react';
import { Calendar, Clock, Users, MessageSquare, CheckCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { restaurantsApi, bookingsApi } from '../../services/api';
import './dashboard.css';

const BookTableDash = ({ setActiveTab }) => {
  const [submitted, setSubmitted] = useState(false);
  const [restaurants, setRestaurants] = useState([]);
  const [form, setForm] = useState({ restaurantId: '', date: '', time: '', guests: 2, specialRequest: '' });
  const { user } = useAuth();

  useEffect(() => {
    restaurantsApi.list().then(setRestaurants).catch(console.error);
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user?.id || !form.restaurantId) return;
    await bookingsApi.create({
      customerId: user.id,
      restaurantId: form.restaurantId,
      bookingDate: form.date,
      bookingTime: form.time,
      guests: Number(form.guests),
      specialRequest: form.specialRequest || '',
    });
    setSubmitted(true);
  };

  return (
    <>
      <div className="page-header">
        <h1>Book a Table</h1>
        <p>Reserve your perfect dining experience in seconds.</p>
      </div>

      {submitted ? (
        <div className="dash-panel" style={{ textAlign: 'center', padding: '4rem' }}>
          <CheckCircle size={64} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
          <h2 style={{ color: 'var(--text-main)', marginBottom: '0.75rem' }}>Booking Request Sent!</h2>
          <p style={{ color: 'var(--text-muted)', maxWidth: 400, margin: '0 auto 2rem' }}>
            Your table reservation request has been submitted. You'll receive a confirmation once the restaurant approves it.
          </p>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button className="dash-btn-primary" onClick={() => setSubmitted(false)}>
              Make Another Booking
            </button>
            <button className="dash-btn-outline" onClick={() => setActiveTab('bookings')}>
              View Bookings
            </button>
          </div>
        </div>
      ) : (
        <div className="dash-grid-sidebar">
          <div className="dash-panel">
            <h3 style={{ color: 'var(--text-main)', marginBottom: '1.75rem', fontWeight: 600 }}>Reservation Details</h3>
            <form onSubmit={handleSubmit}>
              <div className="dash-form-group">
                <label>Restaurant</label>
                <select className="dash-input" required value={form.restaurantId} onChange={e => setForm(p => ({ ...p, restaurantId: e.target.value }))}>
                  <option value="">Select restaurant</option>
                  {restaurants.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </div>

              <div className="form-row">
                <div className="dash-form-group">
                  <label><Calendar size={14} style={{marginRight:6}} />Date</label>
                  <input className="dash-input" type="date" required value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} />
                </div>
                <div className="dash-form-group">
                  <label><Clock size={14} style={{marginRight:6}} />Time</label>
                  <input className="dash-input" type="time" required value={form.time} onChange={e => setForm(p => ({ ...p, time: e.target.value }))} />
                </div>
              </div>

              <div className="dash-form-group">
                <label><Users size={14} style={{marginRight:6}} />Number of Guests</label>
                <select className="dash-input" required value={form.guests} onChange={e => setForm(p => ({ ...p, guests: e.target.value }))}>
                  {[1,2,3,4,5,6,7,8,10,12,15,20].map(n => (
                    <option key={n} value={n}>{n} {n === 1 ? 'Guest' : 'Guests'}</option>
                  ))}
                </select>
              </div>

              <div className="dash-form-group">
                <label><MessageSquare size={14} style={{marginRight:6}} />Special Requirements (Optional)</label>
                <textarea
                  className="dash-input"
                  rows={4}
                  placeholder="E.g. Anniversary dinner, dietary restrictions, wheelchair access..."
                  style={{ resize: 'vertical' }}
                  value={form.specialRequest}
                  onChange={e => setForm(p => ({ ...p, specialRequest: e.target.value }))}
                />
              </div>

              <button className="dash-btn-primary" type="submit" style={{ width: '100%' }}>
                Confirm Reservation
              </button>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default BookTableDash;
