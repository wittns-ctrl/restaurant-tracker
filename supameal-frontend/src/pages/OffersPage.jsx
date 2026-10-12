import { useState } from 'react';
import { ArrowRight, Check, Clock3, MapPin, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import Button from '../components/Button/Button';
import promoPasta from '../assets/images/promo_pasta.png';
import heroFood from '../assets/images/hero_food.png';
import restaurantInterior from '../assets/images/restaurant_interior.png';
import './OffersPage.css';

// Sample offers show the production listing layout until restaurants publish
// live offers through the platform.
const sampleOffers = [
  {
    id: 'offer-1', restaurant: 'Kigali Garden Bistro', cuisine: 'Rwandan · International',
    area: 'Kigali Heights', title: 'A little more lunch for less', detail: 'Enjoy a relaxed lunch with a discount on your food bill.',
    discount: '20% OFF', code: 'GARDEN20', condition: 'Minimum order RWF 15,000', category: 'Dining', image: restaurantInterior,
    daysLeft: 5,
  },
  {
    id: 'offer-2', restaurant: 'The Copper Table', cuisine: 'Grill · Contemporary',
    area: 'Nyarutarama', title: 'Dinner for two, made special', detail: 'Save on a dinner booking for two or more guests.',
    discount: '15% OFF', code: 'COPPER15', condition: 'Dine-in · 2+ guests', category: 'Dining', image: heroFood,
    daysLeft: 8,
  },
  {
    id: 'offer-3', restaurant: 'Saffron & Sage', cuisine: 'Indian · Vegetarian options',
    area: 'Kimihurura', title: 'A fresh take on your favourites', detail: 'Take a little off your next order of house favourites.',
    discount: 'RWF 3,000 OFF', code: 'SAGE3000', condition: 'Minimum order RWF 20,000', category: 'Delivery', image: promoPasta,
    daysLeft: 3,
  },
  {
    id: 'offer-4', restaurant: 'Maison du Goût', cuisine: 'French · Bakery',
    area: 'Kiyovu', title: 'Make your coffee break sweeter', detail: 'A special price on a pastry and coffee pairing.',
    discount: '10% OFF', code: 'BONJOUR10', condition: 'Available for takeaway', category: 'Takeout', image: promoPasta,
    daysLeft: 11,
  },
  {
    id: 'offer-5', restaurant: 'Urban Fork Kigali', cuisine: 'Burgers · Street food',
    area: 'Remera', title: 'Your favourites, delivered', detail: 'Get a discount on an easy night-in order.',
    discount: '25% OFF', code: 'URBAN25', condition: 'Minimum order RWF 25,000', category: 'Delivery', image: heroFood,
    daysLeft: 6,
  },
  {
    id: 'offer-6', restaurant: 'Lakeview Kitchen', cuisine: 'East African · Seafood',
    area: 'Kibagabaga', title: 'A table with a view', detail: 'Book ahead and enjoy a discount on your dining bill.',
    discount: '15% OFF', code: 'LAKE15', condition: 'Dine-in · Advance booking', category: 'Dining', image: restaurantInterior,
    daysLeft: 9,
  },
];

const categories = ['All offers', 'Dining', 'Delivery', 'Takeout'];

export default function OffersPage() {
  const [category, setCategory] = useState('All offers');
  const [copiedCode, setCopiedCode] = useState('');
  const offers = category === 'All offers'
    ? sampleOffers
    : sampleOffers.filter((offer) => offer.category === category);

  const copyCode = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      window.setTimeout(() => setCopiedCode(''), 1800);
    } catch {
      setCopiedCode('');
    }
  };

  return (
    <main className="offers-page">
      <div className="offers-container">
        <header className="offers-header">
          <div>
            <p className="offers-eyebrow">SAVOUR SOMETHING SPECIAL</p>
            <h1>Offers worth <span>sharing</span></h1>
            <p className="offers-intro">Discover dining and delivery deals from restaurants around Kigali.</p>
          </div>
          <Link to="/restaurants" className="offers-browse-link">Browse restaurants <ArrowRight size={17} /></Link>
        </header>

        <div className="offers-note"><Tag size={17} /> Sample offers preview how restaurant deals will appear on SupaMeal.</div>

        <nav className="offers-filters" aria-label="Filter offers">
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? 'active' : ''}
              aria-pressed={category === item}
              onClick={() => setCategory(item)}
            >{item}</button>
          ))}
        </nav>

        <section className="offers-grid" aria-label="Available offers">
          {offers.map((offer) => (
            <article className="offer-card" key={offer.id}>
              <div className="offer-image-wrap">
                <img src={offer.image} alt={`${offer.restaurant} dining`} className="offer-image" />
                <span className="offer-discount">{offer.discount}</span>
              </div>
              <div className="offer-card-body">
                <div className="offer-restaurant-line">
                  <span>{offer.restaurant}</span>
                  <span className="offer-category">{offer.category}</span>
                </div>
                <p className="offer-cuisine">{offer.cuisine}</p>
                <h2>{offer.title}</h2>
                <p className="offer-detail">{offer.detail}</p>
                <div className="offer-meta">
                  <span><MapPin size={15} /> {offer.area}</span>
                  <span><Clock3 size={15} /> {offer.daysLeft} days left</span>
                </div>
                <div className="offer-code-row">
                  <div>
                    <span className="offer-code-label">OFFER CODE</span>
                    <strong>{offer.code}</strong>
                  </div>
                  <button type="button" onClick={() => copyCode(offer.code)} aria-label={`Copy offer code ${offer.code}`}>
                    {copiedCode === offer.code ? <><Check size={16} /> Copied</> : 'Copy code'}
                  </button>
                </div>
                <p className="offer-condition">{offer.condition}</p>
              </div>
            </article>
          ))}
        </section>

        <div className="offers-bottom-cta">
          <div><h2>Ready to find your next favourite?</h2><p>Explore restaurants and plan your next meal.</p></div>
          <Link to="/restaurants"><Button variant="primary">Explore restaurants <ArrowRight size={17} /></Button></Link>
        </div>
      </div>
    </main>
  );
}
