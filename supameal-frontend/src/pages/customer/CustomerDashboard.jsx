import React, { useState } from 'react';
import { LayoutDashboard, CalendarCheck, UtensilsCrossed, User } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import DashboardLayout from '../../layouts/DashboardLayout/DashboardLayout';

import DashboardHome from './DashboardHome';
import ProfilePage from './ProfilePage';
import BookTableDash from './BookTableDash';
import MyBookings from './MyBookings';
import MenuPage from './MenuPage';
import CartPage from './CartPage';
import CheckoutPage from './CheckoutPage';
import MyOrders from './MyOrders';
import FavoritesPage from './FavoritesPage';
import OrderTracking from './OrderTracking';

const customerSidebarConfig = [
  { id: 'overview', label: 'Dashboard Home', icon: LayoutDashboard },
  {
    id: 'dining',
    label: 'Order Food',
    icon: UtensilsCrossed,
    subItems: [
      { id: 'menu', label: 'Menu' },
      { id: 'cart', label: 'Cart' },
      { id: 'checkout', label: 'Checkout' },
    ],
  },
  {
    id: 'activity',
    label: 'Bookings & Orders',
    icon: CalendarCheck,
    subItems: [
      { id: 'book-table', label: 'Book Table' },
      { id: 'bookings', label: 'My Bookings' },
      { id: 'orders', label: 'My Orders' },
      { id: 'order-tracking', label: 'Order Tracking' },
      { id: 'favorites', label: 'Favorites' },
    ],
  },
  { id: 'profile', label: 'Profile', icon: User },
];

const CustomerDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [trackingOrderId, setTrackingOrderId] = useState('2452');
  const { isAuthenticated } = useAuth();
  const { cartCount } = useCart();

  const sidebarWithBadges = customerSidebarConfig.map(item => {
    if (item.subItems) {
      return {
        ...item,
        subItems: item.subItems.map(sub =>
          sub.id === 'cart' ? { ...sub, badge: cartCount || undefined } : sub
        ),
      };
    }
    return item;
  });

  const handleSetActiveTab = (tab, orderId) => {
    if (orderId) setTrackingOrderId(orderId);
    setActiveTab(tab);
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <DashboardHome setActiveTab={setActiveTab} />;
      case 'menu': return <MenuPage setActiveTab={setActiveTab} />;
      case 'cart': return <CartPage setActiveTab={setActiveTab} />;
      case 'checkout': return <CheckoutPage setActiveTab={setActiveTab} />;
      case 'book-table': return <BookTableDash setActiveTab={setActiveTab} />;
      case 'bookings': return <MyBookings setActiveTab={setActiveTab} />;
      case 'orders': return <MyOrders setActiveTab={handleSetActiveTab} />;
      case 'order-tracking': return <OrderTracking orderId={trackingOrderId} setActiveTab={setActiveTab} />;
      case 'favorites': return <FavoritesPage setActiveTab={setActiveTab} />;
      case 'profile': return <ProfilePage setActiveTab={setActiveTab} />;
      default: return <DashboardHome setActiveTab={setActiveTab} />;
    }
  };

  return (
    <DashboardLayout
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      sidebarConfig={sidebarWithBadges}
      roleName="Customer"
    >
      {renderContent()}
    </DashboardLayout>
  );
};

export default CustomerDashboard;
