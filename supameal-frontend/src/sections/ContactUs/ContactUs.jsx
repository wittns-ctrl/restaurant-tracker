import React, { useState } from 'react';
import { MapPin, Phone, Mail, Send } from 'lucide-react';
import Button from '../../components/Button/Button';
import { mailApi } from '../../services/api';
import './ContactUs.css';

const ContactUs = () => {
  const [form, setForm] = useState({ fullName: '', email: '', message: '' });
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    await mailApi.contact(form);
    setSent(true);
    setForm({ fullName: '', email: '', message: '' });
  };

  return (
    <section id="contact" className="contact-us">
      <div className="container">
        <div className="contact-grid">
          <div className="contact-info">
            <p className="section-subtitle text-primary">GET IN TOUCH</p>
            <h2 className="section-title">We'd Love to Hear <span className="text-primary">From You</span></h2>
            <p className="contact-description">
              Have a question about our services, want to partner with us, or just want to say hi? Drop us a message and we'll get back to you as soon as possible.
            </p>
            
            <div className="contact-details">
              <div className="contact-detail-item">
                <div className="contact-icon-wrapper">
                  <MapPin className="text-primary" size={20} />
                </div>
                <div>
                  <strong>Office Location</strong>
                  <p>123 SupaMeal Ave, Kigali, Rwanda</p>
                </div>
              </div>
              
              <div className="contact-detail-item">
                <div className="contact-icon-wrapper">
                  <Phone className="text-primary" size={20} />
                </div>
                <div>
                  <strong>Phone Number</strong>
                  <p>+250 788 123 456</p>
                </div>
              </div>
              
              <div className="contact-detail-item">
                <div className="contact-icon-wrapper">
                  <Mail className="text-primary" size={20} />
                </div>
                <div>
                  <strong>Email Address</strong>
                  <p>hello@supameal.com</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="contact-form-wrapper">
            <form className="contact-form" onSubmit={handleSubmit}>
              <h3>Send us a message</h3>
              {sent && <p style={{ color: '#4caf80', marginBottom: '1rem' }}>Message sent successfully!</p>}
              
              <div className="form-group">
                <label>Full Name</label>
                <input type="text" placeholder="John Doe" className="form-input" required value={form.fullName} onChange={e => setForm(p => ({ ...p, fullName: e.target.value }))} />
              </div>
              
              <div className="form-group">
                <label>Email Address</label>
                <input type="email" placeholder="john@example.com" className="form-input" required value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} />
              </div>
              
              <div className="form-group">
                <label>Message</label>
                <textarea placeholder="How can we help you?" className="form-input" rows="5" required value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}></textarea>
              </div>
              
              <Button variant="primary" type="submit" className="contact-submit-btn">
                <Send size={18} /> Send Message
              </Button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactUs;
