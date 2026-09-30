import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Calendar, Clock, Users, Utensils, MessageSquare, CheckCircle } from 'lucide-react';
import AuthLayout from '../../layouts/AuthLayout';
import Button from '../../components/Button/Button';
import Loader from '../../components/Loader/Loader';
import '../auth/AuthForm.css';

const BookTable = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const navigate = useNavigate();

  const handleBooking = (e) => {
    e.preventDefault();
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setConfirmed(true);
    }, 1200);
  };

  if (isLoading) return <Loader text="Reserving your table..." />;

  if (confirmed) {
    return (
      <AuthLayout title="Reservation Confirmed" subtitle="Your table request has been submitted.">
        <div style={{ textAlign: 'center', padding: '1rem 0' }}>
          <CheckCircle size={64} color="var(--primary)" style={{ marginBottom: '1.5rem' }} />
          <h3 style={{ color: 'var(--text-main)', marginBottom: '0.75rem' }}>Booking Request Sent!</h3>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', lineHeight: 1.6 }}>
            You'll receive a confirmation once the restaurant approves your reservation.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Button variant="primary" onClick={() => navigate('/customer/dashboard')}>
              View in Customer Dashboard
            </Button>
            <Button variant="outline" onClick={() => navigate('/restaurants')}>
              Browse Restaurants
            </Button>
            <Link to="/" style={{ color: 'var(--primary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Back to Home</Link>
          </div>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout 
      title="Reserve a Table" 
      subtitle="Book your perfect dining experience."
    >
      <div className="auth-form-header">
        <Utensils size={32} className="auth-form-icon" />
        <h3>Find a Table</h3>
        <p>Fill in the details below</p>
      </div>

      <form onSubmit={handleBooking}>
        <div className="auth-input-group">
          <label>Restaurant</label>
          <div className="auth-input-wrapper">
            <Utensils size={18} className="auth-input-icon" />
            <select className="auth-input" required style={{ background: 'transparent' }}>
              <option>The Golden Plate</option>
              <option>Sushi Master</option>
              <option>Pasta Bella</option>
              <option>Burger Joint</option>
            </select>
          </div>
        </div>

        <div className="auth-input-group">
          <label>Date</label>
          <div className="auth-input-wrapper">
            <Calendar size={18} className="auth-input-icon" />
            <input type="date" className="auth-input" required />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div className="auth-input-group" style={{ flex: 1 }}>
            <label>Time</label>
            <div className="auth-input-wrapper">
              <Clock size={18} className="auth-input-icon" />
              <input type="time" className="auth-input" required />
            </div>
          </div>
          <div className="auth-input-group" style={{ flex: 1 }}>
            <label>Guests</label>
            <div className="auth-input-wrapper">
              <Users size={18} className="auth-input-icon" />
              <input type="number" min="1" max="20" placeholder="2" className="auth-input" required />
            </div>
          </div>
        </div>

        <div className="auth-input-group">
          <label>Special Requests (Optional)</label>
          <div className="auth-input-wrapper" style={{ alignItems: 'flex-start' }}>
            <MessageSquare size={18} className="auth-input-icon" style={{ top: '1rem' }} />
            <textarea 
              placeholder="Anniversary, allergies, etc." 
              className="auth-input" 
              style={{ minHeight: '80px', resize: 'vertical' }}
            />
          </div>
        </div>

        <Button variant="primary" className="auth-submit-btn" type="submit">
          Confirm Reservation
        </Button>
      </form>
    </AuthLayout>
  );
};

export default BookTable;
