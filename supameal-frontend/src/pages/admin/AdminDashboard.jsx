import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { restaurantsApi, usersApi, notificationsApi, adminApi } from '../../services/api';
import DashboardLayout from '../../layouts/DashboardLayout/DashboardLayout';
import {
  BarChart2, Users, Store, CheckCircle, XCircle, Ban, TrendingUp,
  Bell, Settings, AlertCircle, ShieldCheck, UserCheck, UserX, RefreshCw
} from 'lucide-react';
import '../customer/dashboard.css';

// ── Sidebar Config ─────────────────────────────────────────────────────────
export const adminSidebarConfig = [
  { id: 'overview', label: 'Dashboard Overview', icon: BarChart2 },
  {
    id: 'restaurants-group',
    label: 'Restaurant Management',
    icon: Store,
    subItems: [
      { id: 'approvals', label: 'Pending Approvals', badge: 2 },
      { id: 'restaurants', label: 'All Restaurants' },
    ],
  },
  {
    id: 'users-group',
    label: 'User Management',
    icon: Users,
    subItems: [
      { id: 'customers', label: 'Customers' },
      { id: 'owners', label: 'Restaurant Owners' },
    ],
  },
  { id: 'analytics', label: 'Platform Analytics', icon: TrendingUp },
  {
    id: 'system-group',
    label: 'System',
    icon: Settings,
    subItems: [
      { id: 'notifications', label: 'Notifications' },
      { id: 'settings', label: 'Settings' },
    ],
  },
];

// ── Reusable SVG Bar Chart ─────────────────────────────────────────────────
const BarChartSVG = ({ data, color = '#d78a26', label }) => {
  const max = Math.max(...data.map(d => d.value));
  const w = 420, h = 160, padL = 40, padB = 30, barW = 32, gap = 10;
  return (
    <svg viewBox={`0 0 ${w} ${h + padB}`} style={{ width: '100%', height: 'auto' }}>
      {/* Grid lines */}
      {[0.25, 0.5, 0.75, 1].map(pct => (
        <line key={pct}
          x1={padL} y1={h - h * pct} x2={w} y2={h - h * pct}
          stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      ))}
      {data.map((d, i) => {
        const bh = (d.value / max) * (h - 10);
        const x = padL + i * (barW + gap);
        return (
          <g key={i}>
            <rect x={x} y={h - bh} width={barW} height={bh}
              fill={color} rx="4" opacity={i === data.length - 1 ? 1 : 0.55} />
            <text x={x + barW / 2} y={h + 18} textAnchor="middle"
              fill="rgba(255,255,255,0.4)" fontSize="10">{d.label}</text>
          </g>
        );
      })}
    </svg>
  );
};

// ── SVG Donut Chart ────────────────────────────────────────────────────────
const DonutChart = ({ segments }) => {
  const total = segments.reduce((s, seg) => s + seg.value, 0);
  let cumulative = 0;
  const r = 70, cx = 90, cy = 90, stroke = 22;
  const circumference = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 180 180" style={{ width: 180, height: 180, flexShrink: 0 }}>
      {segments.map((seg, i) => {
        const pct = seg.value / total;
        const offset = circumference - pct * circumference;
        const rotation = (cumulative / total) * 360 - 90;
        cumulative += seg.value;
        return (
          <circle key={i} cx={cx} cy={cy} r={r}
            fill="none" stroke={seg.color} strokeWidth={stroke}
            strokeDasharray={`${pct * circumference} ${(1 - pct) * circumference}`}
            strokeDashoffset={offset}
            transform={`rotate(${rotation} ${cx} ${cy})`}
            style={{ transition: 'stroke-dasharray 0.5s ease' }} />
        );
      })}
      <text x={cx} y={cy - 6} textAnchor="middle" fill="#fff" fontSize="20" fontWeight="700">
        {total.toLocaleString()}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="10">
        Total
      </text>
    </svg>
  );
};

// ── Line Sparkline ─────────────────────────────────────────────────────────
const SparkLine = ({ data, color = '#4caf80' }) => {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const w = 200, h = 60;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / (max - min || 1)) * (h - 8);
    return `${x},${y}`;
  }).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 60 }}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2.5"
        strokeLinecap="round" strokeLinejoin="round" />
      <polyline
        points={`0,${h} ${pts} ${w},${h}`}
        fill={`${color}18`} stroke="none" />
    </svg>
  );
};

// ── Toast Notification ─────────────────────────────────────────────────────
const Toast = ({ message, type = 'success', onClose }) => (
  <div style={{
    position: 'fixed', bottom: '1.5rem', right: '1.5rem', zIndex: 9999,
    background: type === 'success' ? '#4caf80' : '#e05555',
    color: '#fff', padding: '0.85rem 1.25rem', borderRadius: '12px',
    fontWeight: 600, fontSize: '0.9rem', boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
    display: 'flex', alignItems: 'center', gap: '0.75rem',
    animation: 'fadeInUp 0.3s ease',
  }}>
    {type === 'success' ? <CheckCircle size={18} /> : <AlertCircle size={18} />}
    {message}
    <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#fff', cursor: 'pointer', marginLeft: '0.5rem' }}>✕</button>
  </div>
);

// ── Admin Overview ─────────────────────────────────────────────────────────
const AdminOverview = ({ setActiveTab, restaurants, users }) => {
  const pendingCount = restaurants.filter(r => r.status === 'pending').length;
  const activeRestaurants = restaurants.filter(r => r.status === 'active').length;
  const blockedUsers = users.filter(u => u.status === 'blocked').length;

  return (
    <>
      <div className="page-header">
        <h1>Admin Dashboard</h1>
        <p>Platform-wide overview and key metrics.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.25rem', marginBottom: '2rem' }}>
        {[
          { label: 'Total Restaurants', value: restaurants.length, sub: `${activeRestaurants} active`, color: '#d78a26' },
          { label: 'Total Users', value: users.length.toLocaleString(), sub: `${blockedUsers} blocked`, color: '#4caf80' },
          { label: 'Total Orders', value: '128K', sub: '+8% vs last month', color: '#C6F135' },
          { label: 'Pending Approvals', value: pendingCount, sub: 'Needs review', color: '#ffa500' },
        ].map((stat, i) => (
          <div key={i} className="dash-panel" style={{ padding: '1.5rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '0.5rem' }}>{stat.label}</div>
            <div style={{ fontSize: '1.8rem', fontWeight: 700, color: stat.color }}>{stat.value}</div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>{stat.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="dash-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: 0 }}>Revenue Growth (Monthly)</h3>
            <span style={{ fontSize: '0.8rem', color: '#4caf80', background: '#4caf8020', padding: '0.25rem 0.6rem', borderRadius: '20px' }}>+14.2% YoY</span>
          </div>
          <BarChartSVG
            data={[
              { label: 'Dec', value: 42000 }, { label: 'Jan', value: 55000 },
              { label: 'Feb', value: 48000 }, { label: 'Mar', value: 70000 },
              { label: 'Apr', value: 62000 }, { label: 'May', value: 85000 },
              { label: 'Jun', value: 98000 },
            ]}
            color="#d78a26"
          />
        </div>
        <div className="dash-panel">
          <h3 style={{ marginBottom: '1.25rem' }}>Pending Approvals</h3>
          {restaurants.filter(r => r.status === 'pending').length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
              <CheckCircle size={32} style={{ color: '#4caf80', marginBottom: '0.5rem' }} />
              <p>All caught up!</p>
            </div>
          ) : (
            restaurants.filter(r => r.status === 'pending').slice(0, 3).map(r => (
              <div key={r.id} style={{ padding: '0.75rem', background: 'var(--dash-bg)', borderRadius: '10px', marginBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{r.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{r.type} · {r.location}</div>
                </div>
                <button className="dash-btn-primary" style={{ padding: '0.3rem 0.7rem', fontSize: '0.78rem' }} onClick={() => setActiveTab('approvals')}>Review</button>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="dash-panel">
          <h3 style={{ marginBottom: '1.25rem' }}>Active Users (Weekly)</h3>
          <SparkLine data={[820, 932, 901, 934, 1290, 1330, 1520]} color="#4caf80" />
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '0.75rem', color: 'var(--text-muted)', fontSize: '0.78rem' }}>
            <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
          </div>
        </div>
        <div className="dash-panel">
          <h3 style={{ marginBottom: '1.25rem' }}>System Alerts</h3>
          {[
            { type: 'warning', color: '#e05555', bg: 'rgba(224,85,85,0.1)', icon: AlertCircle, text: 'High server traffic detected.' },
            { type: 'ok', color: '#4caf80', bg: '#4caf8010', icon: CheckCircle, text: 'Daily backup completed successfully.' },
            { type: 'info', color: '#ffa500', bg: '#ffa50010', icon: Bell, text: '2 new restaurant applications pending.' },
          ].map((a, i) => (
            <div key={i} style={{ padding: '0.75rem 1rem', background: a.bg, borderRadius: '10px', border: `1px solid ${a.color}30`, marginBottom: '0.75rem', display: 'flex', gap: '0.6rem', alignItems: 'flex-start' }}>
              <a.icon size={16} color={a.color} style={{ flexShrink: 0, marginTop: 2 }} />
              <span style={{ fontSize: '0.85rem', color: 'var(--text-main)' }}>{a.text}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
};

// ── Restaurant Approvals ───────────────────────────────────────────────────
const RestaurantApprovals = ({ restaurants, onApprove, onReject }) => {
  const pending = restaurants.filter(r => r.status === 'pending');
  return (
    <>
      <div className="page-header">
        <h1>Pending Approvals</h1>
        <p>Review and verify new restaurant applications.</p>
      </div>
      <div className="dash-panel">
        {pending.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
            <CheckCircle size={48} style={{ color: '#4caf80', marginBottom: '1rem' }} />
            <h3 style={{ color: '#4caf80' }}>All applications reviewed!</h3>
            <p>No pending restaurant approvals at this time.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {pending.map(req => (
              <div key={req.id} className="list-row" style={{ alignItems: 'center', padding: '1.25rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '10px', background: 'var(--dash-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000', fontSize: '1.2rem', flexShrink: 0, marginRight: '1rem' }}>
                  {req.name.charAt(0)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.4rem' }}>
                    <div style={{ fontWeight: 700, fontSize: '1rem' }}>{req.name}</div>
                    <span style={{ fontSize: '0.75rem', padding: '0.2rem 0.5rem', borderRadius: '4px', background: '#ffa50020', color: '#ffa500', fontWeight: 600 }}>PENDING</span>
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                    <span>📍 {req.location}</span>
                    <span>🍽 {req.type}</span>
                    <span>📄 Docs: <strong style={{ color: req.docs === 'Verified' ? '#4caf80' : '#ffa500' }}>{req.docs}</strong></span>
                    <span>🕐 {req.submitted}</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    className="dash-btn-primary"
                    style={{ padding: '0.5rem 1.1rem', background: '#4caf80', color: '#fff', borderColor: '#4caf80', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => onApprove(req.id)}
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button
                    className="dash-btn-outline"
                    style={{ padding: '0.5rem 1rem', color: '#e05555', borderColor: '#e05555', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                    onClick={() => onReject(req.id)}
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

// ── All Restaurants ────────────────────────────────────────────────────────
const AllRestaurants = ({ restaurants, onToggleStatus }) => (
  <>
    <div className="page-header">
      <h1>All Restaurants</h1>
      <p>Manage all active and suspended restaurants on the platform.</p>
    </div>
    <div className="dash-panel">
      <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
            {['Restaurant', 'Owner', 'Type', 'Status', 'Actions'].map(h => (
              <th key={h} style={{ padding: '0.9rem 0.75rem', fontWeight: 500, fontSize: '0.85rem' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {restaurants.filter(r => r.status !== 'pending').map(r => (
            <tr key={r.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <td style={{ padding: '1rem 0.75rem', fontWeight: 600 }}>{r.name}</td>
              <td style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)' }}>{r.owner}</td>
              <td style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)' }}>{r.type}</td>
              <td style={{ padding: '1rem 0.75rem' }}>
                <span style={{
                  fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600,
                  background: r.status === 'active' ? '#4caf8020' : r.status === 'rejected' ? '#e0555520' : '#ffa50020',
                  color: r.status === 'active' ? '#4caf80' : r.status === 'rejected' ? '#e05555' : '#ffa500',
                }}>
                  {r.status.toUpperCase()}
                </span>
              </td>
              <td style={{ padding: '1rem 0.75rem' }}>
                <button
                  className="dash-btn-outline"
                  style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: r.status === 'active' ? '#e05555' : '#4caf80', borderColor: r.status === 'active' ? '#e05555' : '#4caf80' }}
                  onClick={() => onToggleStatus(r.id)}
                >
                  {r.status === 'active' ? <><Ban size={14} /> Suspend</> : <><CheckCircle size={14} /> Activate</>}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  </>
);

// ── User Table (customers or owners) ──────────────────────────────────────
const UserTable = ({ users, type, onToggleBlock }) => {
  const filtered = users.filter(u => u.type === type);
  return (
    <>
      <div className="page-header">
        <h1>{type === 'customer' ? 'Customer' : 'Restaurant Owner'} Management</h1>
        <p>Manage {type === 'customer' ? 'customer' : 'owner'} accounts on the platform.</p>
      </div>
      <div className="dash-panel">
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.1)', color: 'var(--text-muted)' }}>
              {['Name', 'Email', 'Joined', 'Status', 'Actions'].map(h => (
                <th key={h} style={{ padding: '0.9rem 0.75rem', fontWeight: 500, fontSize: '0.85rem' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtered.map(u => (
              <tr key={u.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <td style={{ padding: '1rem 0.75rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'linear-gradient(135deg, #d78a26, #ffa500)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: '#000', fontSize: '0.85rem', flexShrink: 0 }}>
                      {u.name.charAt(0)}
                    </div>
                    <span style={{ fontWeight: 600 }}>{u.name}</span>
                  </div>
                </td>
                <td style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)' }}>{u.email}</td>
                <td style={{ padding: '1rem 0.75rem', color: 'var(--text-muted)' }}>{u.joined}</td>
                <td style={{ padding: '1rem 0.75rem' }}>
                  <span style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem', borderRadius: '4px', fontWeight: 600, background: u.status === 'active' ? '#4caf8020' : '#e0555520', color: u.status === 'active' ? '#4caf80' : '#e05555' }}>
                    {u.status.toUpperCase()}
                  </span>
                </td>
                <td style={{ padding: '1rem 0.75rem' }}>
                  <button
                    className="dash-btn-outline"
                    style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', display: 'flex', alignItems: 'center', gap: '0.4rem', color: u.status === 'active' ? '#e05555' : '#4caf80', borderColor: u.status === 'active' ? '#e05555' : '#4caf80' }}
                    onClick={() => onToggleBlock(u.id)}
                  >
                    {u.status === 'active' ? <><UserX size={14} /> Block</> : <><UserCheck size={14} /> Unblock</>}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

// ── Platform Analytics ─────────────────────────────────────────────────────
const PlatformAnalytics = () => {
  const monthlyData = [
    { label: 'Nov', value: 38000 }, { label: 'Dec', value: 52000 },
    { label: 'Jan', value: 46000 }, { label: 'Feb', value: 68000 },
    { label: 'Mar', value: 74000 }, { label: 'Apr', value: 82000 },
    { label: 'May', value: 91000 }, { label: 'Jun', value: 107000 },
  ];
  const orderData = [
    { label: 'Mon', value: 2300 }, { label: 'Tue', value: 3100 },
    { label: 'Wed', value: 2800 }, { label: 'Thu', value: 4200 },
    { label: 'Fri', value: 5100 }, { label: 'Sat', value: 6300 },
    { label: 'Sun', value: 4800 },
  ];
  const donutSegments = [
    { label: 'Delivery', value: 6820, color: '#d78a26' },
    { label: 'Dine-In', value: 3240, color: '#4caf80' },
    { label: 'Takeaway', value: 2160, color: '#ffa500' },
  ];

  return (
    <>
      <div className="page-header">
        <h1>Platform Analytics</h1>
        <p>Comprehensive reports and performance metrics.</p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Monthly Revenue', value: '$107K', change: '+17%', up: true },
          { label: 'New Users', value: '2,340', change: '+23%', up: true },
          { label: 'Orders Today', value: '1,284', change: '+8%', up: true },
          { label: 'Avg Order Value', value: '$34.20', change: '-2%', up: false },
        ].map((kpi, i) => (
          <div key={i} className="dash-panel" style={{ padding: '1.25rem' }}>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginBottom: '0.4rem' }}>{kpi.label}</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--dash-accent)' }}>{kpi.value}</div>
            <div style={{ fontSize: '0.78rem', color: kpi.up ? '#4caf80' : '#e05555', marginTop: '0.3rem' }}>{kpi.change} vs last month</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: '1.5rem', marginBottom: '1.5rem' }}>
        <div className="dash-panel">
          <h3 style={{ marginBottom: '1.25rem' }}>Monthly Revenue</h3>
          <BarChartSVG data={monthlyData} color="#d78a26" />
        </div>
        <div className="dash-panel">
          <h3 style={{ marginBottom: '1.25rem' }}>Order Type Breakdown</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <DonutChart segments={donutSegments} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {donutSegments.map((seg, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: seg.color, flexShrink: 0 }} />
                  <div>
                    <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>{seg.label}</div>
                    <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>{seg.value.toLocaleString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="dash-panel">
        <h3 style={{ marginBottom: '1.25rem' }}>Daily Orders This Week</h3>
        <BarChartSVG data={orderData} color="#4caf80" />
      </div>
    </>
  );
};

// ── Notifications Center ───────────────────────────────────────────────────
const NotificationsCenter = ({ notifications, onDismiss }) => (
  <>
    <div className="page-header">
      <h1>Notifications Center</h1>
      <p>System alerts and administrative requests.</p>
    </div>
    <div className="dash-panel">
      {notifications.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
          <Bell size={48} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p>No notifications.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {notifications.map(n => (
            <div key={n.id} style={{ padding: '1rem 1.25rem', background: 'var(--dash-bg)', borderRadius: '12px', borderLeft: `4px solid ${n.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, color: n.color, marginBottom: '0.25rem', fontSize: '0.85rem' }}>{n.type}</div>
                <div style={{ color: 'var(--text-main)', marginBottom: '0.3rem', fontSize: '0.9rem' }}>{n.text}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{n.time}</div>
              </div>
              <button onClick={() => onDismiss(n.id)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.25rem', flexShrink: 0 }}>✕</button>
            </div>
          ))}
        </div>
      )}
    </div>
  </>
);

// ── Settings ───────────────────────────────────────────────────────────────
const AdminSettings = ({ showToast }) => (
  <>
    <div className="page-header">
      <h1>Settings</h1>
      <p>Configure platform-wide settings and preferences.</p>
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      <div className="dash-panel">
        <h3 style={{ marginBottom: '1.5rem' }}>Platform Configuration</h3>
        {[
          { label: 'Platform Name', value: 'SupaMeal' },
          { label: 'Support Email', value: 'support@supameal.com' },
          { label: 'Commission Rate (%)', value: '12' },
          { label: 'Max Restaurants Per Owner', value: '5' },
        ].map((field, i) => (
          <div key={i} className="dash-form-group">
            <label>{field.label}</label>
            <input className="dash-input" defaultValue={field.value} />
          </div>
        ))}
        <button className="dash-btn-primary" onClick={() => showToast('Settings saved successfully!')}>Save Changes</button>
      </div>
      <div className="dash-panel">
        <h3 style={{ marginBottom: '1.5rem' }}>Maintenance</h3>
        {[
          { label: 'Clear Cache', desc: 'Remove all cached data from servers', color: '#ffa500', icon: RefreshCw },
          { label: 'Backup Database', desc: 'Create a full database backup now', color: '#4caf80', icon: CheckCircle },
          { label: 'Maintenance Mode', desc: 'Take the platform offline temporarily', color: '#e05555', icon: AlertCircle },
        ].map((action, i) => (
          <div key={i} style={{ padding: '1rem', background: 'var(--dash-bg)', borderRadius: '12px', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <action.icon size={20} color={action.color} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem' }}>{action.label}</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{action.desc}</div>
            </div>
            <button
              className="dash-btn-outline"
              style={{ padding: '0.4rem 0.9rem', fontSize: '0.8rem', color: action.color, borderColor: action.color }}
              onClick={() => showToast(`${action.label} initiated.`)}
            >Run</button>
          </div>
        ))}
      </div>
    </div>
  </>
);

// ── Main Admin Dashboard ───────────────────────────────────────────────────
const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast] = useState(null);

  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [notifications, setNotifications] = useState([]);

  const loadAdminData = async () => {
    try {
      const [restData, userData, notifData] = await Promise.all([
        restaurantsApi.list({ approvedOnly: 'false' }),
        usersApi.list(),
        notificationsApi.list(),
      ]);
      setRestaurants(restData.map(r => ({
        id: r.id, name: r.name, type: r.cuisine || r.type, location: r.location?.address || r.address,
        owner: r.owner, docs: r.docs, submitted: r.submitted, status: r.status,
      })));
      setUsers(userData.map(u => ({
        id: u.id, name: u.name, email: u.email, joined: u.joined, status: u.status, type: u.type,
      })));
      setNotifications(notifData.map(n => ({
        id: n.id, type: 'System', text: n.message, time: n.time, color: '#4caf80',
      })));
    } catch (err) {
      console.error(err);
    }
  };

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleApprove = async (id) => {
    await restaurantsApi.approve(id, true);
    loadAdminData();
    showToast('Restaurant approved and activated!');
  };

  const handleReject = async (id) => {
    await restaurantsApi.approve(id, false);
    loadAdminData();
    showToast('Restaurant application rejected.', 'error');
  };

  const handleToggleRestaurantStatus = async (id) => {
    const r = restaurants.find(x => x.id === id);
    const newStatus = r?.status === 'active' ? 'suspended' : 'active';
    await restaurantsApi.setStatus(id, newStatus);
    loadAdminData();
    showToast('Restaurant status updated.');
  };

  const handleToggleBlock = async (id) => {
    const u = users.find(x => x.id === id);
    const newStatus = u?.status === 'active' ? 'blocked' : 'active';
    await usersApi.setStatus(id, newStatus);
    loadAdminData();
    showToast('User status updated.');
  };

  const handleDismissNotification = async (id) => {
    await notificationsApi.dismiss(id);
    loadAdminData();
  };

  const { isAuthenticated, user } = useAuth();
  useEffect(() => {
    if (!isAuthenticated || !user) return;
    loadAdminData();
  }, [isAuthenticated, user]);

  const renderContent = () => {
    switch (activeTab) {
      case 'overview': return <AdminOverview setActiveTab={setActiveTab} restaurants={restaurants} users={users} />;
      case 'approvals': return <RestaurantApprovals restaurants={restaurants} onApprove={handleApprove} onReject={handleReject} />;
      case 'restaurants': return <AllRestaurants restaurants={restaurants} onToggleStatus={handleToggleRestaurantStatus} />;
      case 'customers': return <UserTable users={users} type="customer" onToggleBlock={handleToggleBlock} />;
      case 'owners': return <UserTable users={users} type="owner" onToggleBlock={handleToggleBlock} />;
      case 'analytics': return <PlatformAnalytics />;
      case 'notifications': return <NotificationsCenter notifications={notifications} onDismiss={handleDismissNotification} />;
      case 'settings': return <AdminSettings showToast={showToast} />;
      default: return <AdminOverview setActiveTab={setActiveTab} restaurants={restaurants} users={users} />;
    }
  };

  return (
    <>
      <style>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <DashboardLayout sidebarConfig={adminSidebarConfig} activeTab={activeTab} setActiveTab={setActiveTab} roleName="Admin">
        {renderContent()}
      </DashboardLayout>
    </>
  );
};

export default AdminDashboard;
