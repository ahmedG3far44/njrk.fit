import { Shield, Mail, User, Calendar } from 'lucide-react';
import { useAdminAuth } from '../context/AdminAuthProvider';

export const AdminSettingsPage = () => {
  const { admin } = useAdminAuth();

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-title text-summit-black font-extrabold">Settings & Admin Preferences</h1>
      </div>

      <div className="bg-peak-white rounded-card border border-limestone p-6">
        <div className="flex items-center gap-4 pb-5 border-b border-limestone mb-5">
          <div className="w-14 h-14 rounded-full bg-forest-floor flex items-center justify-center">
            <span className="text-xl font-bold text-forest-canopy">
              {admin?.name?.charAt(0)?.toUpperCase() || 'A'}
            </span>
          </div>
          <div>
            <h2 className="text-heading text-summit-black">{admin?.name || 'Admin'}</h2>
            <p className="text-body text-gravel">{admin?.role === 'super_admin' ? 'Super Admin' : 'Administrator'}</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone flex items-center justify-center shrink-0">
              <Mail className="w-4 h-4 text-trail-gray" />
            </div>
            <div>
              <p className="text-label text-dust">Email</p>
              <p className="text-sm text-summit-black font-medium">{admin?.email || '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4 text-trail-gray" />
            </div>
            <div>
              <p className="text-label text-dust">Role</p>
              <p className="text-sm text-summit-black font-medium capitalize">{admin?.role || '—'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-stone flex items-center justify-center shrink-0">
              <User className="w-4 h-4 text-trail-gray" />
            </div>
            <div>
              <p className="text-label text-dust">Admin ID</p>
              <p className="text-sm text-summit-black font-medium font-mono">{admin?._id || '—'}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
