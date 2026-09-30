import React from 'react';
import { Star, MapPin } from 'lucide-react';
import './RestaurantCard.css';

const RestaurantCard = ({ image, name, location, rating, reviews, priceLevel }) => {
  return (
    <div className="restaurant-card">
      <div className="card-image-wrapper">
        <img src={image} alt={name} className="card-image" />
        <div className="card-badge">
          <Star size={12} fill="currentColor" /> {rating}
        </div>
      </div>
      <div className="card-content">
        <h3 className="card-title">{name}</h3>
        <div className="card-details">
          <span className="card-location">
            <MapPin size={14} /> {location}
          </span>
          <span className="card-price">{priceLevel}</span>
        </div>
        <div className="card-reviews">
          <span className="star-rating">
            <Star size={14} fill="var(--primary)" color="var(--primary)" /> {rating}
          </span>
          <span className="review-count">({reviews})</span>
        </div>
      </div>
    </div>
  );
};

export default RestaurantCard;
