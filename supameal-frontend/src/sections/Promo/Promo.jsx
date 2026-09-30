import React from 'react';
import { ArrowRight } from 'lucide-react';
import Button from '../../components/Button/Button';
import promoImg from '../../assets/images/promo_pasta.png';
import './Promo.css';

const Promo = () => {
  return (
    <section className="promo-section">
      <div className="container">
        <div className="promo-card">
          <div className="promo-background">
            <img src={promoImg} alt="Exclusive Deals" className="promo-image" />
            <div className="promo-overlay"></div>
          </div>
          
          <div className="promo-content">
            <div className="promo-badge-text">
              <span className="text-primary">🔥</span> LIMITED TIME OFFER
            </div>
            
            <h2 className="promo-title">
              Exclusive Dining<br />
              <span className="text-primary">Deals Await!</span>
            </h2>
            
            <p className="promo-description">
              Enjoy up to 30% off at selected restaurants.<br />
              Great food for less, for a limited time only.
            </p>
            
            <Button variant="outline" className="promo-btn">
              Explore Offers <ArrowRight size={18} />
            </Button>
          </div>
          
          <div className="promo-discount-badge">
            <span className="discount-up-to">UP TO</span>
            <span className="discount-amount">30%</span>
            <span className="discount-off">OFF</span>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Promo;
