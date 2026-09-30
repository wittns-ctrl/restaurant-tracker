import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowLeft } from 'lucide-react';
import Navbar from '../../sections/Navbar/Navbar';
import Footer from '../../sections/Footer/Footer';
import Button from '../../components/Button/Button';
import Dropdown from '../../components/Input/Dropdown';
import RestaurantCard from '../../components/RestaurantCard/RestaurantCard';
import { restaurantsApi, resolveImageUrl } from '../../services/api';
import './Restaurants.css';

import img1 from '../../assets/images/restaurant_interior.png';

const Restaurants = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [cuisine, setCuisine] = useState('');
  const [location, setLocation] = useState('');
  const [rating, setRating] = useState('');
  const [restaurants, setRestaurants] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadRestaurants = async () => {
    setLoading(true);
    try {
      const data = await restaurantsApi.list({
        search: searchTerm || undefined,
        cuisine: cuisine || undefined,
        location: location || undefined,
        rating: rating || undefined,
      });
      setRestaurants(data.map(r => ({
        ...r,
        image: resolveImageUrl(r.image) || img1,
      })));
    } catch (err) {
      console.error('Failed to load restaurants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRestaurants(); }, []);

  const handleApplyFilters = () => loadRestaurants();

  return (
    <>
      <Navbar />
      <main className="restaurants-page">
        <div className="container">
          <div className="restaurants-header">
            <div className="restaurants-title-row">
              <Link to="/" className="back-link">
                <ArrowLeft size={20} /> Back to Home
              </Link>
              <h1>All Restaurants</h1>
              <p>Find exactly what you're craving</p>
            </div>
            
            <div className="search-filter-bar">
              <div className="search-input-wrapper">
                <Search className="search-icon" size={20} />
                <input 
                  type="text" 
                  placeholder="Search restaurants, cuisines, or dishes..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="filter-dropdowns">
                <Dropdown 
                  placeholder="Location" 
                  options={['Downtown', 'Uptown']}
                  onChange={(val) => setLocation(val)}
                />
                <Dropdown 
                  placeholder="Cuisine" 
                  options={['Italian', 'Japanese', 'American', 'Fine Dining']}
                  onChange={(val) => setCuisine(val)}
                />
                <Dropdown 
                  placeholder="Rating" 
                  options={['4+ Stars', '3+ Stars']}
                  onChange={(val) => setRating(val.startsWith('4') ? '4' : val.startsWith('3') ? '3' : '')}
                />
                <Button variant="primary" className="filter-btn" onClick={handleApplyFilters}>
                  <Filter size={18} /> Apply
                </Button>
              </div>
            </div>
          </div>

          {loading ? (
            <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '3rem' }}>Loading restaurants...</p>
          ) : (
            <div className="restaurants-grid">
              {restaurants.map((restaurant) => (
                <Link to={`/restaurants/${restaurant.id}`} key={restaurant.id} style={{ textDecoration: 'none' }}>
                  <RestaurantCard restaurant={restaurant} />
                </Link>
              ))}
              {restaurants.length === 0 && (
                <p style={{ gridColumn: '1 / -1', textAlign: 'center', color: 'var(--text-muted)' }}>No restaurants found.</p>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
};

export default Restaurants;
