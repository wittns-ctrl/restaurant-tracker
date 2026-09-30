import React from 'react';
import { Link } from 'react-router-dom';
import Logo from '../components/Logo/Logo';
import { ArrowLeft } from 'lucide-react';
import './AuthLayout.css';
import bgImage from '../assets/images/hero_food.png';

const AuthLayout = ({ children, title, subtitle }) => {
  return (
    <div className="auth-layout">
      <div className="auth-card">
        <div className="auth-left">
          <div 
            className="auth-bg" 
            style={{ backgroundImage: `url(${bgImage})` }}
          ></div>
          <div className="auth-overlay"></div>
          
          <div className="auth-left-content">
            <div className="auth-welcome-text">
              {title && <h2>{title}</h2>}
              {subtitle && <p>{subtitle}</p>}
            </div>
          </div>
        </div>
        
        <div className="auth-right">
          <div className="auth-right-header">
            <Link to="/" className="auth-logo-link">
              <Logo />
            </Link>
            <Link to="/" className="auth-back-home">
              <ArrowLeft size={16} />
              <span>Back</span>
            </Link>
          </div>
          
          <div className="auth-form-container">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
