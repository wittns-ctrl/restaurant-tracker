import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Calendar, Clock, Users, ArrowRight } from 'lucide-react';
import Button from '../../components/Button/Button';
import Dropdown from '../../components/Input/Dropdown';
import './SearchBar.css';

const SearchBar = () => {
  const [guests, setGuests] = useState('2 Guests');
  const navigate = useNavigate();
  const guestOptions = ['1 Guest', '2 Guests', '3 Guests', '4 Guests', '5+ Guests'];

  const handleFindTable = () => {
    navigate('/book-table');
  };

  return (
    <section className="search-section">
      <div className="container">
        <div className="search-card">
          <div className="search-fields">
            <div className="search-field">
              <label>Restaurant</label>
              <div className="input-wrapper">
                <Search size={18} className="text-muted" />
                <input type="text" placeholder="Restaurants or dishes..." />
              </div>
            </div>
            
            <div className="search-divider"></div>
            
            <div className="search-field">
              <label>Date</label>
              <div className="input-wrapper">
                <Calendar size={18} className="text-muted" />
                <input type="date" placeholder="Select date" />
              </div>
            </div>
            
            <div className="search-divider"></div>
            
            <div className="search-field">
              <label>Time</label>
              <div className="input-wrapper">
                <Clock size={18} className="text-muted" />
                <input type="time" placeholder="Select time" />
              </div>
            </div>
            
            <div className="search-divider"></div>
            
            <div className="search-field">
              <label>Guests</label>
              <div className="input-wrapper">
                <Users size={18} className="text-muted" />
                <Dropdown 
                  options={guestOptions} 
                  value={guests} 
                  onChange={setGuests} 
                />
              </div>
            </div>
            
            <div className="search-button-wrapper">
              <Button variant="primary" className="search-btn" onClick={handleFindTable}>
                Find a Table <ArrowRight size={18} />
              </Button>
            </div>
          </div>
          
          <div className="search-footer">
            <span><span className="text-primary">•</span> Instant confirmation</span>
            <span><span className="text-primary">•</span> No hidden fees</span>
            <span><span className="text-primary">•</span> Easy & secure booking</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SearchBar;
