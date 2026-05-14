// app/page.js  — Landing page / login
import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function HomePage({ searchParams }) {
  const user = await getSession();
  if (user) redirect('/dashboard');

  const error = searchParams?.error;
  const errorMessages = {
    steam_invalid:  'Steam verification failed. Please try again.',
    steam_id_parse: 'Could not read Steam ID. Please try again.',
    steam_profile:  'Could not fetch your Steam profile.',
    user_create:    'Account creation failed. Please try again.',
  };

  return (
    <div className="login-page">
      <div className="login-bg" />
      <div className="login-box">
        <div className="login-top">
          <img
            src="https://play-lh.googleusercontent.com/MFSbgPkTDJFzHDejLAXCQbTOM-RCjLmqCJqBNVFm7giXhGADPeDxcZVKnHF8sTQKVA"
            alt="RaidZone"
            style={{ width: 80, height: 80, borderRadius: 16, marginBottom: 12 }}
          />
          <div className="login-title">RAIDZONE</div>
          <div className="login-sub">ONCE HUMAN — CRAFTING TRACKER</div>
        </div>
        <div className="login-body">
          {error && (
            <div className="alert alert-err">
              {errorMessages[error] || 'An error occurred. Please try again.'}
            </div>
          )}

          <div className="alert alert-info" style={{ fontSize: 12, lineHeight: 1.5 }}>
            Log in with your Steam account to track your personal inventory and join a clan.
            All crafting recipes and material data are shared globally.
          </div>

          
            href="/api/auth/steam"
            className="btn-steam"
            style={{ justifyContent: 'center', borderRadius: 4, textDecoration: 'none', display: 'flex' }}
          >
            <svg width="24" height="24" viewBox="0 0 233 233" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path fillRule="evenodd" clipRule="evenodd" d="M116.5 0C52.1 0 0 52.1 0 116.5c0 55.5 38.8 101.9 90.8 113.5l34.6-85.5c-2.9-1.2-5.6-2.9-7.9-5.1-9.4-9.4-9.4-24.6 0-33.9 9.4-9.4 24.6-9.4 33.9 0 9.4 9.4 9.4 24.6 0 33.9-1.2 1.2-2.5 2.2-3.9 3.1l-83.9 34.1C74.8 188.2 94.4 197 116.5 197 180.9 197 233 144.9 233 80.5S180.9 0 116.5 0z" fill="#66c0f4"/>
            </svg>
            Sign in through Steam
          </a>

          <div className="muted" style={{ textAlign: 'center', fontSize: 11, lineHeight: 1.6 }}>
            Your Steam profile name and avatar will be used.<br />
            No password required — Steam handles authentication.
          </div>
        </div>
      </div>
    </div>
  );
}
