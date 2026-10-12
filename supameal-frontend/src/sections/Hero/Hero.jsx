import React, { useEffect, useState } from 'react';
import { ArrowRight, CheckCircle2, Clock, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../../components/Button/Button';
import heroImage from '../../assets/images/hero_food.png';
import './Hero.css';

const heroSlides = [
  { src: '/images/hero-slides/supameal-hero-01.png', alt: 'A beautifully plated restaurant dish' },
  { src: '/images/hero-slides/supameal-hero-02.png', alt: 'Freshly prepared food served at a restaurant' },
  { src: '/images/hero-slides/supameal-hero-03.png', alt: 'A warm meal ready to enjoy' },
  { src: '/images/hero-slides/supameal-hero-04.png', alt: 'A chef-crafted dining experience' },
  { src: '/images/hero-slides/supameal-hero-05.png', alt: 'A colorful spread of fresh ingredients' },
  { src: '/images/hero-slides/supameal-hero-06.png', alt: 'A delicious meal served fresh' },
  { src: '/images/hero-slides/supameal-hero-07.png', alt: 'A restaurant favorite plated for guests' },
  { src: '/images/hero-slides/supameal-hero-08.png', alt: 'A freshly prepared dish with rich flavors' },
  { src: '/images/hero-slides/supameal-hero-09.png', alt: 'A welcoming restaurant table with food' },
  { src: '/images/hero-slides/supameal-hero-10.png', alt: 'A vibrant meal to share' },
];

const Hero = () => {
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setActiveSlide((current) => (current + 1) % heroSlides.length);
    }, 10_000);

    return () => window.clearInterval(interval);
  }, []);

  return (
    <section className="hero">
      <div className="hero-background">
        <div className="hero-gradient"></div>
        {heroSlides.map((slide, index) => (
          <img
            key={slide.src}
            src={slide.src}
            alt={index === activeSlide ? slide.alt : ''}
            className={`hero-image${index === activeSlide ? ' hero-image--active' : ''}`}
            aria-hidden={index !== activeSlide}
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = heroImage;
            }}
          />
        ))}
      </div>
      
      <div className="container hero-container">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-icon">🔥</span> DISCOVER, BOOK, ENJOY
          </div>
          
          <h1 className="hero-title">
            Dine In or<br />
            Order for<br />
            <span className="text-primary">Delivery</span>
          </h1>
          
          <p className="hero-subtitle">
            Explore the best restaurants, book your favorite tables, 
            or order delicious meals with real-time tracking right to your door.
          </p>
          
          <div className="hero-actions">
            <Link to="/book-table">
              <Button variant="primary">Find a Table</Button>
            </Link>
            <Link to="/customer/dashboard">
              <Button variant="outline">
                Order Now <ArrowRight size={18} />
              </Button>
            </Link>
          </div>
          
          <div className="hero-features">
            <div className="feature-item">
              <CheckCircle2 className="feature-icon text-primary" size={20} />
              <div>
                <strong>No Booking Fees</strong>
                <p>100% free to book</p>
              </div>
            </div>
            <div className="feature-item">
              <Clock className="feature-icon text-primary" size={20} />
              <div>
                <strong>Instant Confirmation</strong>
                <p>Quick & easy bookings</p>
              </div>
            </div>
            <div className="feature-item">
              <ShieldCheck className="feature-icon text-primary" size={20} />
              <div>
                <strong>Secure & Reliable</strong>
                <p>Your data is protected</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
