import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, Clock, Users, Phone, Navigation } from 'lucide-react';
import Navbar from '../../sections/Navbar/Navbar';
import Footer from '../../sections/Footer/Footer';
import Button from '../../components/Button/Button';
import { restaurantsApi, reviewsApi, resolveImageUrl } from '../../services/api';
import { useCart } from '../../context/CartContext';
import img1 from '../../assets/images/restaurant_interior.png';
import './RestaurantDetails.css';

const RestaurantDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('menu');
  const [restaurant, setRestaurant] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const { selectRestaurant } = useCart();

  useEffect(() => {
    const load = async () => {
      try {
        const data = await restaurantsApi.get(id);
        setRestaurant({
          ...data,
          image: resolveImageUrl(data.image) || img1,
        });
        const rev = await reviewsApi.list(id);
        setReviews(rev);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  const menuByCategory = (restaurant?.menu || []).reduce((acc, item) => {
    const cat = item.category || 'Other';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {});

  if (loading) {
    return (
      <>
        <Navbar />
        <main className="restaurant-details-page"><div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Loading...</div></main>
        <Footer />
      </>
    );
  }

  if (!restaurant) {
    return (
      <>
        <Navbar />
        <main className="restaurant-details-page"><div className="container" style={{ padding: '4rem', textAlign: 'center' }}>Restaurant not found</div></main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="restaurant-details-page">
        <div className="restaurant-hero" style={{ backgroundImage: `url(${restaurant.image})` }}>
          <div className="restaurant-hero-overlay"></div>
          <div className="container restaurant-hero-content">
            <Link to="/restaurants" className="back-btn-glass">
              <ArrowLeft size={20} /> Back to Directory
            </Link>
            
            <div className="restaurant-hero-info glass-panel">
              <div className="restaurant-badges">
                <span className="badge cuisine-badge">{restaurant.cuisine}</span>
                <span className="badge rating-badge"><Star size={14} fill="currentColor" /> {restaurant.rating} ({restaurant.reviews} Reviews)</span>
              </div>
              <h1>{restaurant.name}</h1>
              <p className="restaurant-address"><MapPin size={18} /> {restaurant.address}</p>
            </div>
          </div>
        </div>

        <div className="container restaurant-content-layout">
          <div className="restaurant-info-col">
            <section className="info-section">
              <h3>About</h3>
              <p>{restaurant.description}</p>
            </section>

            <section className="info-section">
              <h3>Details</h3>
              <ul className="details-list">
                <li><Clock size={20} className="text-primary"/> <span><strong>Working Hours:</strong> {restaurant.hours || restaurant.opening}</span></li>
                <li><Users size={20} className="text-primary"/> <span><strong>Capacity:</strong> {restaurant.capacity} Guests</span></li>
                <li><Phone size={20} className="text-primary"/> <span><strong>Contact:</strong> {restaurant.phone}</span></li>
                <li><Navigation size={20} className="text-primary"/> <span><strong>Get Directions</strong></span></li>
              </ul>
            </section>
          </div>

          <div className="restaurant-action-col">
            <div className="action-card">
              <div className="action-buttons">
                <Button 
                  variant="primary" 
                  className="full-width-btn"
                  onClick={() => navigate('/book-table', { state: { restaurantId: id } })}
                >
                  Book a Table
                </Button>
                <Button variant="outline" className="full-width-btn" onClick={() => { selectRestaurant(id); navigate('/customer/dashboard'); }}>
                  Order Food Delivery
                </Button>
              </div>

              <div className="menu-preview">
                <div className="menu-tabs">
                  <button className={`menu-tab ${activeTab === 'menu' ? 'active' : ''}`} onClick={() => setActiveTab('menu')}>Menu</button>
                  <button className={`menu-tab ${activeTab === 'reviews' ? 'active' : ''}`} onClick={() => setActiveTab('reviews')}>Reviews</button>
                </div>

                {activeTab === 'menu' && (
                  <div className="menu-list">
                    {Object.entries(menuByCategory).map(([category, items]) => (
                      <div key={category} className="menu-category">
                        <h4>{category}</h4>
                        {items.map(item => (
                          <div key={item.id} className="menu-item">
                            <div className="menu-item-info">
                              <span className="item-name">{item.name}</span>
                              <span className="item-desc">{item.desc || item.description}</span>
                            </div>
                            <span className="item-price">${item.price}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                    {Object.keys(menuByCategory).length === 0 && (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>Menu coming soon</p>
                    )}
                  </div>
                )}
                
                {activeTab === 'reviews' && (
                  <div className="reviews-list">
                    {reviews.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', textAlign: 'center', padding: '2rem 0' }}>No reviews yet</p>
                    ) : (
                      reviews.map(r => (
                        <div key={r.id} style={{ padding: '1rem 0', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <Star size={14} fill="#ffc107" color="#ffc107" />
                            <strong>{r.rating}</strong>
                            <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{r.customerName}</span>
                          </div>
                          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>{r.comment}</p>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
};

export default RestaurantDetails;
