import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Menu, X, Bell, ChevronRight, LogOut, Home, Search,
  ChevronDown, User, CheckCircle, Package, Truck, CalendarCheck, Heart, UtensilsCrossed
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { notificationsApi, usersApi } from '../../services/api';
import Logo from '../../components/Logo/Logo';
import './DashboardLayout.css';

const SEARCH_TARGETS = [
  { id: 'menu', label: 'Order Food / Menu', icon: UtensilsCrossed, type: 'Page' },
  { id: 'cart', label: 'View Cart', icon: Package, type: 'Page' },
  { id: 'book-table', label: 'Book a Table', icon: CalendarCheck, type: 'Action' },
  { id: 'bookings', label: 'My Bookings', icon: CalendarCheck, type: 'Page' },
  { id: 'orders', label: 'My Orders', icon: Truck, type: 'Page' },
  { id: 'favorites', label: 'Favorite Restaurants', icon: Heart, type: 'Page' },
  { id: 'profile', label: 'Edit Profile & Settings', icon: User, type: 'Settings' },
];

const getAvatarLabel = (name) => {
  if (!name) return 'U';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

const UserAvatar = ({ user, className = 'user-avatar-sm' }) => {
  const avatarSrc = user?.profile?.imageurl || user?.imageurl || '';
  const label = getAvatarLabel(user?.name);

  return (
    <div className={className}>
      {avatarSrc ? (
        <img className="user-avatar-image" src={avatarSrc} alt={user?.name || 'User avatar'} />
      ) : (
        label
      )}
    </div>
  );
};

const SidebarItem = ({ item, activeTab, setActiveTab, setSidebarOpen }) => {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = item.icon;

  const isActive = activeTab === item.id || (item.subItems && item.subItems.some(sub => sub.id === activeTab));

  const handleClick = () => {
    if (item.subItems) {
      setIsOpen(!isOpen);
    } else {
      setActiveTab(item.id);
      setSidebarOpen(false);
    }
  };

  return (
    <div className="sidebar-item-container">
      <button 
        className={`sidebar-nav-item ${isActive && !item.subItems ? 'active' : ''}`}
        onClick={handleClick}
      >
        <div className="nav-item-left">
          <Icon size={20} />
          <span>{item.label}</span>
          {item.badge && <span className="nav-badge">{item.badge}</span>}
        </div>
        {item.subItems && (
          <ChevronDown size={16} className={`dropdown-arrow ${isOpen ? 'open' : ''}`} />
        )}
      </button>

      {item.subItems && isOpen && (
        <div className="sidebar-subitems">
          {item.subItems.map(sub => (
            <button
              key={sub.id}
              className={`sidebar-subitem ${activeTab === sub.id ? 'active' : ''}`}
              onClick={() => {
                setActiveTab(sub.id);
                setSidebarOpen(false);
              }}
            >
              {sub.label}
              {sub.badge && <span className="nav-badge">{sub.badge}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DashboardLayout = ({ children, activeTab, setActiveTab, sidebarConfig, roleName }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchPopover, setShowSearchPopover] = useState(false);

  // Notification State
  const [showNotifPopover, setShowNotifPopover] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  // Load user notifications and activities
  useEffect(() => {
    let isMounted = true;
    const loadNotifsAndActivities = async () => {
      if (!user?.id) return;
      try {
        const stats = await usersApi.getDashboardStats(user.id);
        if (isMounted && stats) {
          if (stats.notifications && stats.notifications.length > 0) {
            setNotifications(stats.notifications);
          } else {
            // Default welcome notification if empty
            setNotifications([
              {
                id: 'notif-welcome',
                title: 'Welcome to SupaMeal! 👋',
                text: 'Your account is ready. Explore our menu or book a table!',
                time: 'Just now',
                unread: true,
              },
            ]);
          }

          if (stats.activities && stats.activities.length > 0) {
            setActivities(stats.activities);
          }
        }
      } catch (err) {
        console.error('Failed to load user notifications:', err);
      }
    };

    loadNotifsAndActivities();
    return () => { isMounted = false; };
  }, [user?.id]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const markAllRead = async () => {
    try {
      await notificationsApi.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    } catch {
      setNotifications(prev => prev.map(n => ({ ...n, unread: false })));
    }
  };

  const unreadCount = notifications.filter(n => n.unread).length;

  // Filter search results
  const searchResults = searchQuery.trim()
    ? SEARCH_TARGETS.filter(t => t.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  // Find current breadcrumb
  let currentBreadcrumb = 'Overview';
  sidebarConfig.forEach(item => {
    if (item.id === activeTab) currentBreadcrumb = item.label;
    if (item.subItems) {
      item.subItems.forEach(sub => {
        if (sub.id === activeTab) currentBreadcrumb = `${item.label} / ${sub.label}`;
      });
    }
  });

  return (
    <div className="dashboard-shell">
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}

      {/* LEFT SIDEBAR */}
      <aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : ''}`}>
        
        <div className="sidebar-brand-top">
          <Logo />
        </div>

        <div className="sidebar-user">
          <UserAvatar user={user} />
          <div className="user-info-sm">
            <span className="user-name-sm">{user?.name || 'User'}</span>
            <span className="user-role-sm">{roleName}</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          <p className="nav-group-label">MAIN MENU</p>
          {sidebarConfig.map(item => (
            <SidebarItem 
              key={item.id} 
              item={item} 
              activeTab={activeTab} 
              setActiveTab={setActiveTab} 
              setSidebarOpen={setSidebarOpen} 
            />
          ))}
        </nav>

        <div className="sidebar-footer">
          <button className="sidebar-nav-item home-link" onClick={() => navigate('/')}>
            <Home size={20} />
            <span>Back to Home</span>
          </button>
          <button className="sidebar-nav-item logout-link-prominent" onClick={handleLogout}>
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* MAIN AREA */}
      <div className="dashboard-main">
        <header className="dashboard-topbar">
          <div className="topbar-left">
            <button className="mobile-menu-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <nav className="topbar-breadcrumb" aria-label="Breadcrumb">
              <span className="breadcrumb-item">Dashboard</span>
              <ChevronRight size={14} className="breadcrumb-sep" />
              <span className="breadcrumb-current">{currentBreadcrumb}</span>
            </nav>
          </div>

          <div className="topbar-right">
            {/* SEARCH INPUT */}
            <div className="topbar-search" style={{ position: 'relative' }}>
              <Search size={16} />
              <input 
                type="text" 
                placeholder="Search feature or page..." 
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  setShowSearchPopover(true);
                }}
                onFocus={() => setShowSearchPopover(true)}
              />
              {showSearchPopover && searchQuery.trim() && (
                <div className="topbar-popover" style={{ left: 0, right: 'auto' }}>
                  <div className="popover-header">
                    <h4>Search Results</h4>
                    <button className="link-btn" onClick={() => setShowSearchPopover(false)}>Close</button>
                  </div>
                  <div className="popover-body">
                    {searchResults.length === 0 ? (
                      <div style={{ padding: '1rem', color: 'var(--dash-muted)', fontSize: '0.85rem' }}>
                        No matching features found
                      </div>
                    ) : (
                      searchResults.map(item => {
                        const Icon = item.icon;
                        return (
                          <div 
                            key={item.id} 
                            className="popover-item"
                            onClick={() => {
                              setActiveTab(item.id);
                              setShowSearchPopover(false);
                              setSearchQuery('');
                            }}
                          >
                            <Icon size={18} color="var(--dash-accent)" />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.88rem', color: 'var(--dash-text)' }}>{item.label}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--dash-muted)' }}>{item.type}</div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* NOTIFICATION BELL BUTTON */}
            <div style={{ position: 'relative' }}>
              <button 
                className="topbar-icon-btn notif-btn" 
                aria-label="Notifications"
                onClick={() => setShowNotifPopover(!showNotifPopover)}
              >
                <Bell size={18} />
                {unreadCount > 0 && <span className="notif-badge-count">{unreadCount}</span>}
              </button>

              {/* NOTIFICATION DROPDOWN POPOVER */}
              {showNotifPopover && (
                <div className="topbar-popover">
                  <div className="popover-header">
                    <h4>Notifications</h4>
                    {unreadCount > 0 && (
                      <button className="link-btn" style={{ fontSize: '0.75rem' }} onClick={markAllRead}>
                        Mark all read
                      </button>
                    )}
                  </div>
                  <div className="popover-body">
                    {notifications.length === 0 ? (
                      <div style={{ padding: '1.5rem', textAlign: 'center', color: 'var(--dash-muted)', fontSize: '0.85rem' }}>
                        No notifications
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`popover-item ${n.unread ? 'unread' : ''}`}>
                          <div className="notif-icon-circle">
                            <Bell size={14} color="var(--dash-accent)" />
                          </div>
                          <div className="notif-body">
                            <p><strong>{n.title || 'Notice'}</strong>: {n.text}</p>
                            <span>{n.time}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* USER PROFILE SHORTCUT */}
            <div className="topbar-user" onClick={() => setActiveTab(sidebarConfig.some(i => i.id === 'profile') ? 'profile' : 'overview')}>
              <UserAvatar user={user} />
              <span>{user?.name || 'User'}</span>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          {children}
        </div>
      </div>

      {/* RIGHT SIDEBAR (Notifications / Activities) */}
      <aside className="dashboard-right-sidebar">
        <div className="right-sidebar-section">
          <h4>Notifications</h4>
          {notifications.slice(0, 4).map(n => (
            <div key={n.id} className={`notif-item ${n.unread ? 'unread' : ''}`}>
              <div className="notif-icon-circle"><Bell size={16} /></div>
              <div className="notif-body">
                <p><strong>{n.title}</strong> {n.text}</p>
                <span>{n.time}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="right-sidebar-section">
          <h4>Recent Activities</h4>
          <div className="activities-list">
            {activities.length === 0 ? (
              <p style={{ color: 'var(--dash-muted)', fontSize: '0.8rem' }}>No recent activities.</p>
            ) : (
              activities.map(a => (
                <div key={a.id} className="activity-item">
                  <div className="activity-avatar">{a.avatar}</div>
                  <div className="activity-body">
                    <p><strong>{a.user}</strong> {a.action}</p>
                    <span>{a.time}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>
    </div>
  );
};

export default DashboardLayout;
