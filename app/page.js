import { getSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export default async function HomePage({ searchParams }) {
  const user = await getSession();
  if (user) redirect('/dashboard');

  const error = searchParams?.error;
  const errorMessages = {
    steam_invalid: 'Steam verification failed. Please try again.',
    steam_id_parse: 'Could not read Steam ID. Please try again.',
    steam_profile: 'Could not fetch your Steam profile.',
    user_create: 'Account creation failed. Please try again.',
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
          </div>
          
            href="/api/auth/steam"
            style={{ justifyContent: 'center', borderRadius: 4, textDecoration: 'none', display: 'flex', background: '#1b2838', padding: '12px 20px', border: '1px solid #4c6b8a', color: '#c6d4df', fontWeight: 700, fontSize: 15, gap: 10, alignItems: 'center' }}
          >
            🎮 Sign in through Steam
          </a>
          <div className="muted" style={{ textAlign: 'center', fontSize: 11, lineHeight: 1.6 }}>
            Your Steam profile name and avatar will be used.
            No password required.
          </div>
        </div>
      </div>
    </div>
  );
}
