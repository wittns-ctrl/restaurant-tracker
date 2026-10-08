import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { FaFacebookF, FaInstagram, FaTwitter, FaLinkedinIn } from 'react-icons/fa';
import Button from '../../components/Button/Button';
import Logo from '../../components/Logo/Logo';
import { mailApi } from '../../services/api';
import './Footer.css';

const Footer = () => {
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterState, setNewsletterState] = useState(null);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!newsletterEmail.trim() || newsletterState === 'loading') return;
    setNewsletterState('loading');
    try {
      await mailApi.contact({
        fullName: 'Newsletter subscription',
        email: newsletterEmail.trim(),
        message: 'Please add me to the SupaMeal newsletter.',
      });
      setNewsletterState('done');
      setNewsletterEmail('');
    } catch {
      setNewsletterState('error');
    }
  };

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-content">
          <div className="footer-brand">
            <Link to="/" className="footer-logo-link">
              <Logo />
            </Link>
            <p className="footer-description">
              Making every meal special with the best<br />
              restaurants and seamless bookings.
            </p>
            <div className="social-links">
              <a href="#" className="social-link"><FaFacebookF size={16} /></a>
              <a href="#" className="social-link"><FaInstagram size={16} /></a>
              <a href="#" className="social-link"><FaTwitter size={16} /></a>
              <a href="#" className="social-link"><FaLinkedinIn size={16} /></a>
            </div>
          </div>
          
          <div className="footer-links-group">
            <h4 className="footer-heading">COMPANY</h4>
            <ul className="footer-links">
              <li><Link to="/#about">About Us</Link></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Press</a></li>
            </ul>
          </div>
          
          <div className="footer-links-group">
            <h4 className="footer-heading">SUPPORT</h4>
            <ul className="footer-links">
              <li><a href="#">Help Center</a></li>
              <li><Link to="/#contact">Contact Us</Link></li>
              <li><a href="#">Terms & Conditions</a></li>
              <li><a href="#">Privacy Policy</a></li>
            </ul>
          </div>
          
          <div className="footer-links-group">
            <h4 className="footer-heading">FOR RESTAURANTS</h4>
            <ul className="footer-links">
              <li><Link to="/register-restaurant">Partner with Us</Link></li>
              <li><Link to="/owner-login">Restaurant Login</Link></li>
              <li><a href="#">Resources</a></li>
            </ul>
          </div>
          
          <div className="footer-newsletter">
            <h4 className="footer-heading">NEWSLETTER</h4>
            <p className="newsletter-text">Subscribe to get the latest updates and exclusive offers.</p>
            <div className="newsletter-input-wrapper">
              <form onSubmit={handleSubscribe} style={{ display: 'contents' }}>
                <input
                  type="email"
                  required
                  placeholder="Enter your email"
                  className="newsletter-input"
                  value={newsletterEmail}
                  onChange={e => setNewsletterEmail(e.target.value)}
                />
                <button className="newsletter-btn" type="submit" aria-label="Subscribe to newsletter">
                  <ArrowRight size={18} />
                </button>
              </form>
              {newsletterState === 'done' && <p className="newsletter-text" style={{ color: '#7ddf64', marginTop: '0.5rem' }}>Subscribed! Check your inbox.</p>}
              {newsletterState === 'error' && <p className="newsletter-text" style={{ color: '#ff6b6b', marginTop: '0.5rem' }}>Subscription failed. Try again.</p>}
            </div>
          </div>
        </div>
        
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} SupaMeal. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
