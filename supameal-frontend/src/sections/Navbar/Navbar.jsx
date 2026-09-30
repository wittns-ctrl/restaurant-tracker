import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, LogIn } from 'lucide-react';
import Button from '../../components/Button/Button';
import Logo from '../../components/Logo/Logo';
import './Navbar.css';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (location.hash) {
      const el = document.getElementById(location.hash.replace('#', ''));
      if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
    }
    setIsMobileMenuOpen(false);
  }, [location]);

  const goToSection = (hash) => {
    if (location.pathname === '/') {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
      else navigate(`/#${hash}`);
    } else {
      navigate(`/#${hash}`);
    }
  };

  const navLinks = [
    { name: 'Home', action: () => navigate('/') },
    {
      name: 'Services',
      dropdown: [
        { name: 'Restaurants', to: '/restaurants' },
        { name: 'Book a Table', to: '/book-table' },
        { name: 'Order Online', to: '/customer/dashboard' },
        { name: 'For Owners', to: '/owner-login' },
      ],
    },
    { name: 'About Us', action: () => goToSection('about') },
    { name: 'FAQ', action: () => goToSection('faq') },
    { name: 'Contact Us', action: () => goToSection('contact') },
  ];

  return (
    <nav className={`navbar ${isScrolled ? 'scrolled' : ''}`}>
      <div className="container navbar-container">
        <Link to="/" className="navbar-logo-link">
          <Logo />
        </Link>

        <div className={`navbar-links ${isMobileMenuOpen ? 'open' : ''}`}>
          {navLinks.map((link, index) => (
            <div key={index} className="nav-item">
              {link.dropdown ? (
                <>
                  <span className="nav-link nav-link-dropdown">{link.name}</span>
                  <div className="nav-dropdown">
                    {link.dropdown.map((sublink) => (
                      <Link key={sublink.name} to={sublink.to} className="dropdown-link">
                        {sublink.name}
                      </Link>
                    ))}
                  </div>
                </>
              ) : (
                <button type="button" className="nav-link nav-link-btn" onClick={link.action}>
                  {link.name}
                </button>
              )}
            </div>
          ))}
          <div className="navbar-actions-mobile">
            <Link to="/login" style={{ width: '100%' }} onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="outline" style={{ width: '100%' }}>
                <LogIn size={16} /> Sign In
              </Button>
            </Link>
            <Link to="/signup" style={{ width: '100%' }} onClick={() => setIsMobileMenuOpen(false)}>
              <Button variant="primary" style={{ width: '100%' }}>Sign Up</Button>
            </Link>
          </div>
        </div>

        <div className="navbar-actions-desktop">
          <Link to="/login">
            <Button variant="outline"><LogIn size={16} /> Sign In</Button>
          </Link>
          <Link to="/signup">
            <Button variant="primary">Sign Up</Button>
          </Link>
        </div>

        <button
          type="button"
          className="mobile-menu-toggle"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
