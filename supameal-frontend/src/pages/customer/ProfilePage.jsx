import { useEffect, useRef, useState } from 'react';
import { User, Lock, Camera } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { usersApi } from '../../services/api';
import './dashboard.css';

const getProfileForm = (user) => ({
  firstName: user?.name?.split(' ')[0] || '',
  lastName: user?.name?.split(' ').slice(1).join(' ') || '',
  email: user?.email || '',
  phone: user?.phone ? String(user.phone) : '',
  deliveryAddress: user?.deliveryAddress?.street || '',
});

const getAvatarLabel = (name) => {
  if (!name) return 'U';
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return `${parts[0].charAt(0)}${parts[1].charAt(0)}`.toUpperCase();
};

const ProfilePage = () => {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);
  const [tab, setTab] = useState('profile');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState(() => getProfileForm(user));
  const [avatarPreview, setAvatarPreview] = useState(user?.profile?.imageurl || user?.imageurl || '');
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const displayName = `${profile.firstName} ${profile.lastName}`.trim() || user?.name || 'Customer';
  const avatarLabel = getAvatarLabel(displayName);

  useEffect(() => {
    setProfile(getProfileForm(user));
    setAvatarPreview(user?.profile?.imageurl || user?.imageurl || '');
  }, [user]);

  const handleAvatarChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Please choose a valid image file.');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setError('Profile picture must be 2MB or smaller.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(typeof reader.result === 'string' ? reader.result : '');
      setError('');
      setMessage('Profile picture ready. Save changes to keep it.');
    };
    reader.readAsDataURL(file);
  };

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const newName = `${profile.firstName} ${profile.lastName}`.trim();
      const nextProfile = {
        ...(user?.profile || {}),
        imageurl: avatarPreview || '',
      };
      const updated = await usersApi.update(user.id, {
        name: newName,
        email: profile.email,
        phone: profile.phone.trim(),
        deliveryAddress: { street: profile.deliveryAddress },
        profile: nextProfile,
      });
      updateUser({
        ...updated,
        name: newName,
        email: profile.email,
        phone: profile.phone,
        deliveryAddress: { street: profile.deliveryAddress },
        profile: nextProfile,
      });
      setMessage('Profile updated successfully!');
    } catch (err) {
      setError(err?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    setMessage('');
    setError('');
    if (passwords.newPassword !== passwords.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (!passwords.currentPassword || !passwords.newPassword) {
      setError('Please fill in all password fields');
      return;
    }
    setLoading(true);
    try {
      await usersApi.changePassword(user.id, {
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });
      setMessage('Password changed successfully!');
      setPasswords({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      setError(err?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Manage your personal information and security settings.</p>
      </div>

      {message && <p style={{ color: '#4caf80', marginBottom: '1rem', fontWeight: 600 }}>{message}</p>}
      {error && <p style={{ color: '#f44336', marginBottom: '1rem', fontWeight: 600 }}>{error}</p>}

      <div style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' }}>
        <div>
          <div className="dash-panel" style={{ textAlign: 'center' }}>
            <div style={{ position:'relative', display:'inline-block', marginBottom:'1rem' }}>
              <div className="profile-summary-avatar">
                {avatarPreview ? (
                  <img className="profile-avatar-image" src={avatarPreview} alt={`${displayName} avatar`} />
                ) : (
                  avatarLabel
                )}
              </div>
              <button
                type="button"
                style={{ position:'absolute', bottom:0, right:0, width:30, height:30, borderRadius:'50%', background:'var(--dash-accent,#C6F135)', border:'none', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }}
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera size={14} color="#000" />
              </button>
            </div>
            <div style={{ fontWeight:700, color:'var(--text-main)', fontSize:'1.1rem' }}>{displayName}</div>
            <div style={{ color:'var(--text-muted)', fontSize:'0.85rem', marginTop:'0.25rem' }}>{profile.email || user?.email}</div>
            <div style={{ marginTop:'0.75rem', background:'var(--dash-accent-dim,rgba(198,241,53,0.12))', borderRadius:8, padding:'0.4rem 0.8rem', display:'inline-block', color:'var(--dash-accent,#C6F135)', fontSize:'0.8rem', fontWeight:600 }}>Customer</div>
            <div style={{ marginTop:'1rem', color:'var(--text-muted)', fontSize:'0.8rem' }}>Member since {user?.joined || '2026'}</div>
          </div>

          <div className="dash-panel">
            <div className="tab-bar" style={{ flexDirection:'column', border:'none' }}>
              <button className={`tab-btn ${tab==='profile'?'active':''}`} style={{ textAlign:'left', borderBottom:'none', borderLeft: tab==='profile' ? '2px solid var(--dash-accent,#C6F135)' : '2px solid transparent', borderRadius:0, paddingLeft:'1rem' }} onClick={() => setTab('profile')}>
                <User size={16} style={{marginRight:8}} /> Edit Profile
              </button>
              <button className={`tab-btn ${tab==='password'?'active':''}`} style={{ textAlign:'left', borderBottom:'none', borderLeft: tab==='password' ? '2px solid var(--dash-accent,#C6F135)' : '2px solid transparent', borderRadius:0, paddingLeft:'1rem' }} onClick={() => setTab('password')}>
                <Lock size={16} style={{marginRight:8}} /> Change Password
              </button>
            </div>
          </div>
        </div>

        <div className="dash-panel">
          {tab === 'profile' && (
            <>
              <h3 style={{ color:'var(--text-main)', marginBottom:'1.75rem', fontWeight:600 }}>Update Profile Information</h3>
              <div className="dash-form-group">
                <label>Profile Picture</label>
                <div className="profile-avatar-editor">
                  <div className="profile-avatar-preview">
                    {avatarPreview ? (
                      <img className="profile-avatar-image" src={avatarPreview} alt={`${displayName} avatar`} />
                    ) : (
                      avatarLabel
                    )}
                  </div>
                  <div className="profile-avatar-actions">
                    <button
                      type="button"
                      className="dash-btn-outline"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={loading}
                    >
                      Upload Picture
                    </button>
                    <p>PNG, JPG or WEBP up to 2MB.</p>
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarChange}
                  style={{ display: 'none' }}
                />
              </div>
              <div className="form-row">
                <div className="dash-form-group">
                  <label>First Name</label>
                  <input className="dash-input" value={profile.firstName} onChange={e => setProfile(p => ({ ...p, firstName: e.target.value }))} />
                </div>
                <div className="dash-form-group">
                  <label>Last Name</label>
                  <input className="dash-input" value={profile.lastName} onChange={e => setProfile(p => ({ ...p, lastName: e.target.value }))} />
                </div>
              </div>
              <div className="dash-form-group">
                <label>Email Address</label>
                <input className="dash-input" type="email" value={profile.email} onChange={e => setProfile(p => ({ ...p, email: e.target.value }))} />
              </div>
              <div className="dash-form-group">
                <label>Phone Number</label>
                <input className="dash-input" type="tel" value={profile.phone} onChange={e => setProfile(p => ({ ...p, phone: e.target.value }))} />
              </div>
              <div className="dash-form-group">
                <label>Delivery Address</label>
                <input className="dash-input" value={profile.deliveryAddress} onChange={e => setProfile(p => ({ ...p, deliveryAddress: e.target.value }))} />
              </div>
              <button className="dash-btn-primary" onClick={handleSaveProfile} disabled={loading}>
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </>
          )}
          {tab === 'password' && (
            <>
              <h3 style={{ color:'var(--text-main)', marginBottom:'1.75rem', fontWeight:600 }}>Change Password</h3>
              <div className="dash-form-group">
                <label>Current Password</label>
                <input className="dash-input" type="password" value={passwords.currentPassword} onChange={e => setPasswords(p => ({ ...p, currentPassword: e.target.value }))} />
              </div>
              <div className="dash-form-group">
                <label>New Password</label>
                <input className="dash-input" type="password" value={passwords.newPassword} onChange={e => setPasswords(p => ({ ...p, newPassword: e.target.value }))} />
              </div>
              <div className="dash-form-group">
                <label>Confirm New Password</label>
                <input className="dash-input" type="password" value={passwords.confirmPassword} onChange={e => setPasswords(p => ({ ...p, confirmPassword: e.target.value }))} />
              </div>
              <button className="dash-btn-primary" onClick={handleChangePassword} disabled={loading}>
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
};

export default ProfilePage;
