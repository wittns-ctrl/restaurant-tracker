import React, { useState, useEffect } from 'react';
import { Package, Clock } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { ordersApi } from '../../services/api';
import './dashboard.css';

const MyOrders = ({ setActiveTab }) => {
  const [tab, setTab] = useState('current');
  const [orders, setOrders] = useState({ current: [], history: [] });
  const { user } = useAuth();

  useEffect(() => {
    const load = async () => {
      if (!user?.id) return;
      try {
        const data = await ordersApi.list({ customerId: user.id });
        const current = data.filter(o => !['delivered', 'cancelled', 'rejected'].includes(o.status));
        const history = data.filter(o => ['delivered', 'cancelled', 'rejected'].includes(o.status));
        setOrders({ current, history });
      } catch (err) {
        console.error(err);
      }
    };
    load();
  }, [user?.id]);

  const handleReorder = async (id) => {
    await ordersApi.reorder(id);
    setActiveTab('orders');
  };

  return (
    <>
      <div className="page-header">
        <h1>My Orders</h1>
        <p>Track current orders and browse your order history.</p>
      </div>

      <div className="dash-panel">
        <div className="tab-bar">
          <button className={`tab-btn ${tab === 'current' ? 'active' : ''}`} onClick={() => setTab('current')}>
            Current Orders
            {orders.current.length > 0 && <span style={{ marginLeft: '0.5rem', background: 'var(--dash-accent, #C6F135)', color: '#000', borderRadius: '10px', padding: '1px 7px', fontSize: '0.72rem', fontWeight: 700 }}>{orders.current.length}</span>}
          </button>
          <button className={`tab-btn ${tab === 'history' ? 'active' : ''}`} onClick={() => setTab('history')}>Order History</button>
        </div>

        {tab === 'current' && orders.current.length === 0 && (
          <div className="empty-state"><Package size={48} /><p>No active orders right now.</p></div>
        )}

        {orders[tab].map(order => (
          <div key={order.id} className="list-row" style={{ alignItems: 'center', padding: '1.25rem 0' }}>
            <div className="list-row-left" style={{ flex: 1 }}>
              <div style={{ width: 52, height: 52, borderRadius: 12, background: '#1a1a1a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem' }}>
                <Package size={24} color="rgba(255,255,255,0.5)" />
              </div>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                  <div className="list-row-title">Order #{order.orderId || order.id?.slice(-4)}</div>
                  <span className={`status-badge status-${order.status}`}>{order.statusLabel}</span>
                </div>
                <div className="list-row-sub">{order.restaurant} · {order.itemsSummary || order.items?.map(i => i.name).join(', ')}</div>
                <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <Clock size={13} /> {order.eta}
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.5rem', flexShrink: 0 }}>
              <span style={{ color: 'var(--dash-accent, #C6F135)', fontWeight: 700 }}>${Number(order.total).toFixed(2)}</span>
              {['on-way', 'preparing', 'ready', 'accepted', 'pending'].includes(order.status) && (
                <button className="dash-btn-primary" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }} onClick={() => setActiveTab('order-tracking', order.id)}>
                  Track Order
                </button>
              )}
              {order.status === 'delivered' && (
                <button className="dash-btn-outline" style={{ padding: '0.45rem 1rem', fontSize: '0.82rem' }} onClick={() => handleReorder(order.id)}>Reorder</button>
              )}
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default MyOrders;
