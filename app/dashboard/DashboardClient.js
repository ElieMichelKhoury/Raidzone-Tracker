'use client';
import { useState, useCallback } from 'react';
import { resolveRaws } from '@/lib/crafting';

// ── Helpers ────────────────────────────────────────────────────────────────
function uid() { return '_' + Math.random().toString(36).slice(2, 9); }
function RarityTag({ r }) {
  const cls = { Common: 'tc', Uncommon: 'tu', Rare: 'tr', Epic: 'te' }[r] || 'tc';
  return <span className={`tag ${cls}`}>{r}</span>;
}

// ── Sidebar ────────────────────────────────────────────────────────────────
const PAGES = [
  { id: 'dashboard', label: 'Dashboard',    icon: '🏠', sec: 'OVERVIEW' },
  { id: 'planner',   label: 'Craft Planner',icon: '⚙️', sec: '' },
  { id: 'inventory', label: 'My Inventory', icon: '📦', sec: 'TRACKING' },
  { id: 'clan',      label: 'Clan',         icon: '🛡️', sec: '' },
  { id: 'recipes',   label: 'Recipe DB',    icon: '📋', sec: 'DATA' },
  { id: 'admin',     label: 'Admin Panel',  icon: '🔐', sec: '' },
];

function Sidebar({ user, page, setPage, clan }) {
  const pages = user?.is_admin ? PAGES : PAGES.filter(p => p.id !== 'admin');
  return (
    <div className="sidebar">
      <div className="logo">
        <div style={{ fontSize: 28 }}>☢️</div>
        <div className="logo-t">RAIDZONE</div>
        <div className="logo-s">CRAFTING TRACKER</div>
      </div>
      <div className="nav">
        {pages.map(p => (
          <div key={p.id}>
            {p.sec && <div className="nav-sec">{p.sec}</div>}
            <div
              className={`nav-item ${page === p.id ? 'active' : ''}`}
              onClick={() => setPage(p.id)}
            >
              <span>{p.icon}</span>
              {p.label}
              {p.id === 'clan' && clan && (
                <span className="badge" style={{ marginLeft: 'auto', fontSize: 9 }}>{clan.tag}</span>
              )}
            </div>
          </div>
        ))}
      </div>
      <div className="sidebar-foot">
        <div className="user-badge">
          <div className="avatar">
            {user.avatar_url
              ? <img src={user.avatar_url} alt={user.username} />
              : user.username[0].toUpperCase()
            }
          </div>
          <div>
            <div className="uname">{user.username}</div>
            <div className="urole">{user.is_admin ? 'ADMIN' : 'PLAYER'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Dashboard overview ─────────────────────────────────────────────────────
function DashboardOverview({ user, materials, recipes, clan }) {
  const stocked = materials.filter(m => m.owned > 0).length;
  const craftable = recipes.filter(r =>
    r.ingredients.every(i => {
      const m = materials.find(x => x.id === i.material_id);
      return m && m.owned >= i.qty;
    })
  ).length;
  const cats = [...new Set(materials.map(m => m.category))];
  const empty = materials.filter(m => m.owned === 0);

  return (
    <div className="col gap20">
      <div className="row gap12">
        <div style={{ fontSize: 22 }}>👋</div>
        <div>
          <div style={{ fontFamily: 'var(--fhead)', fontSize: 16 }}>Welcome back, {user.username}</div>
          <div className="muted">{clan ? `Clan: [${clan.tag}] ${clan.name}` : 'Not in a clan — join or create one'}</div>
        </div>
      </div>

      <div className="g4">
        <div className="stat"><div className="stat-v">{materials.length}</div><div className="stat-l">MATERIALS</div></div>
        <div className="stat"><div className="stat-v">{recipes.length}</div><div className="stat-l">RECIPES</div></div>
        <div className="stat"><div className="stat-v">{stocked}</div><div className="stat-l">STOCKED</div></div>
        <div className="stat"><div className="stat-v" style={{ color: 'var(--green)' }}>{craftable}</div><div className="stat-l">CRAFTABLE NOW</div></div>
      </div>

      <div className="g2">
        <div className="card">
          <div className="card-h"><span className="card-t">CATEGORIES</span></div>
          <div className="card-b col gap12">
            {cats.map(c => {
              const n = materials.filter(m => m.category === c).length;
              return (
                <div key={c}>
                  <div className="row jbet mb8"><span className="bold">{c}</span><span className="muted">{n}</span></div>
                  <div className="pbar"><div className="pfill" style={{ width: `${(n / materials.length) * 100}%`, background: 'var(--accent)' }} /></div>
                </div>
              );
            })}
          </div>
        </div>
        <div className="card">
          <div className="card-h"><span className="card-t">EMPTY STOCK</span></div>
          <div className="card-b">
            {empty.length === 0
              ? <div className="alert alert-ok">All materials stocked ✓</div>
              : <div className="col gap8">{empty.slice(0, 9).map(m => (
                  <div key={m.id} className="row jbet"><span>{m.icon} {m.name}</span><span className="red bold mono">0</span></div>
                ))}</div>
            }
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Craft Planner ──────────────────────────────────────────────────────────
function Planner({ materials, recipes }) {
  const [recId, setRecId] = useState('');
  const [qty, setQty] = useState(1);
  const [result, setResult] = useState(null);
  const getMat = id => materials.find(m => m.id === id);

  function calc() {
    const rec = recipes.find(r => r.id === recId);
    if (!rec) return;
    const { raws, steps } = resolveRaws(rec.output_id, qty, recipes);
    setResult({ rec, qty, raws, steps });
  }

  const selRec = recipes.find(r => r.id === recId);
  return (
    <div className="g2" style={{ alignItems: 'start' }}>
      <div className="card">
        <div className="card-h"><span className="card-t">CRAFT CALCULATOR</span></div>
        <div className="card-b col gap14">
          <div className="field">
            <label>SELECT RECIPE</label>
            <select className="inp" value={recId} onChange={e => { setRecId(e.target.value); setResult(null); }}>
              <option value="">— choose recipe —</option>
              {recipes.map(r => { const m = getMat(r.output_id); return <option key={r.id} value={r.id}>{m?.icon || '🔧'} {r.name}</option>; })}
            </select>
          </div>
          <div className="field">
            <label>QUANTITY TO CRAFT</label>
            <input className="inp" type="number" min={1} value={qty} onChange={e => setQty(Math.max(1, parseInt(e.target.value) || 1))} />
          </div>
          <button className="btn btn-p" onClick={calc} style={{ opacity: recId ? 1 : .4 }}>⚙️ CALCULATE</button>
          {selRec && <>
            <hr className="divider" />
            <div className="muted mb8">Direct ingredients (per craft):</div>
            {selRec.ingredients.map(i => {
              const m = getMat(i.material_id);
              return (
                <div key={i.material_id} className="row jbet mb8">
                  <span>{m?.icon} {m?.name || i.material_id}</span>
                  <span className="mono acc">×{i.qty}</span>
                </div>
              );
            })}
            <div className="muted text-sm">Station: {selRec.station} · Output: ×{selRec.output_qty} · Time: {selRec.craft_time}</div>
          </>}
        </div>
      </div>

      {result && (
        <div className="col gap14">
          <div className="card">
            <div className="card-h">
              <span className="card-t">RAW MATERIALS NEEDED</span>
              <span className="muted mono" style={{ fontSize: 10 }}>for ×{result.qty} {result.rec.name}</span>
            </div>
            <div className="card-b col gap8">
              {Object.entries(result.raws).map(([id, need]) => {
                const mat = getMat(id);
                const owned = mat?.owned || 0;
                const missing = Math.max(0, need - owned);
                const pct = Math.min(100, (owned / need) * 100);
                return (
                  <div key={id} className="raw-item">
                    <div className="row gap8">
                      <span style={{ fontSize: 18 }}>{mat?.icon || '📦'}</span>
                      <div>
                        <div className="bold">{mat?.name || id}</div>
                        <div className="pbar mt8" style={{ width: 110 }}>
                          <div className="pfill" style={{ width: `${pct}%`, background: missing > 0 ? 'var(--red)' : 'var(--green)' }} />
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className={`mono bold ${missing > 0 ? 'red' : 'green'}`}>×{need}</div>
                      {missing > 0
                        ? <div className="muted text-sm">have {owned} · need {missing} more</div>
                        : <div className="green text-sm">✓ stocked ({owned})</div>
                      }
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="card">
            <div className="card-h"><span className="card-t">CRAFTING STEPS</span></div>
            <div className="card-b col gap8">
              {result.steps.map((s, i) => (
                <div key={i} className="step-item">
                  <strong>{s.name}</strong> — ×{s.batches} batch{s.batches > 1 ? 'es' : ''} at <span className="acc">{s.station}</span> → ×{s.totalOut}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Inventory ──────────────────────────────────────────────────────────────
function Inventory({ materials, setMaterials }) {
  const [search, setSearch] = useState('');
  const [catF, setCatF] = useState('All');
  const [saving, setSaving] = useState({});
  const cats = ['All', ...new Set(materials.map(m => m.category))];

  async function updateOwned(id, newVal) {
    setMaterials(ms => ms.map(m => m.id === id ? { ...m, owned: newVal } : m));
    setSaving(s => ({ ...s, [id]: true }));
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ material_id: id, owned: newVal }),
    });
    setSaving(s => ({ ...s, [id]: false }));
  }

  function adj(id, d) {
    const m = materials.find(x => x.id === id);
    if (!m) return;
    updateOwned(id, Math.max(0, m.owned + d));
  }

  const list = materials.filter(m =>
    (catF === 'All' || m.category === catF) &&
    m.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="col gap14">
      <div className="row gap12">
        <input className="inp f1" placeholder="🔍 Search…" value={search} onChange={e => setSearch(e.target.value)} />
        <select className="inp" style={{ width: 150 }} value={catF} onChange={e => setCatF(e.target.value)}>
          {cats.map(c => <option key={c}>{c}</option>)}
        </select>
      </div>
      <div className="card">
        <div className="tw">
          <table>
            <thead><tr><th>MATERIAL</th><th>CATEGORY</th><th>RARITY</th><th>OWNED</th><th>ADJUST</th></tr></thead>
            <tbody>
              {list.map(m => (
                <tr key={m.id}>
                  <td><span style={{ fontSize: 18, marginRight: 8 }}>{m.icon}</span><strong>{m.name}</strong></td>
                  <td className="muted">{m.category}</td>
                  <td><RarityTag r={m.rarity} /></td>
                  <td>
                    <div className="row gap8">
                      <input className="inp" type="number" style={{ width: 75 }}
                        value={m.owned}
                        onChange={e => updateOwned(m.id, Math.max(0, parseInt(e.target.value) || 0))} />
                      {saving[m.id] && <span className="muted text-sm">saving…</span>}
                    </div>
                  </td>
                  <td>
                    <div className="row gap4">
                      <button className="btn btn-s btn-xs" onClick={() => adj(m.id, -10)}>−10</button>
                      <button className="btn btn-s btn-xs" onClick={() => adj(m.id, -1)}>−1</button>
                      <button className="btn btn-p btn-xs" onClick={() => adj(m.id, 1)}>+1</button>
                      <button className="btn btn-p btn-xs" onClick={() => adj(m.id, 10)}>+10</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Clan ───────────────────────────────────────────────────────────────────
function ClanPage({ user, clan, clanRole, materials }) {
  const [view, setView] = useState('overview');
  const [createForm, setCreateForm] = useState({ name: '', tag: '' });
  const [joinCode, setJoinCode] = useState('');
  const [clanInv, setClanInv] = useState([]);
  const [clanData, setClanData] = useState(null);
  const [msg, setMsg] = useState(null);

  async function loadClan() {
    const res = await fetch('/api/clan');
    const data = await res.json();
    setClanData(data);
    setClanInv(data.inventory || []);
  }

  useState(() => { if (clan) loadClan(); }, []);

  async function createClan() {
    const res = await fetch('/api/clan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(createForm),
    });
    const data = await res.json();
    if (data.error) { setMsg({ t: 'err', m: data.error }); return; }
    window.location.reload();
  }

  async function joinClan() {
    const res = await fetch('/api/clan/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invite_code: joinCode }),
    });
    const data = await res.json();
    if (data.error) { setMsg({ t: 'err', m: data.error }); return; }
    window.location.reload();
  }

  async function updateClanInv(material_id, owned) {
    setClanInv(inv => {
      const ex = inv.find(i => i.material_id === material_id);
      if (ex) return inv.map(i => i.material_id === material_id ? { ...i, owned } : i);
      return [...inv, { material_id, owned }];
    });
    await fetch('/api/clan/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clan_id: clan.id, material_id, owned }),
    });
  }

  if (!clan) {
    return (
      <div className="g2" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="card-h"><span className="card-t">CREATE CLAN</span></div>
          <div className="card-b col gap14">
            {msg && <div className={`alert alert-${msg.t === 'ok' ? 'ok' : 'err'}`}>{msg.m}</div>}
            <div className="field"><label>CLAN NAME</label><input className="inp" value={createForm.name} onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))} /></div>
            <div className="field"><label>TAG (2-5 chars, e.g. RZ)</label><input className="inp" maxLength={5} value={createForm.tag} onChange={e => setCreateForm(f => ({ ...f, tag: e.target.value }))} /></div>
            <button className="btn btn-p" onClick={createClan}>🛡️ Create Clan</button>
          </div>
        </div>
        <div className="card">
          <div className="card-h"><span className="card-t">JOIN CLAN</span></div>
          <div className="card-b col gap14">
            <div className="muted">Enter an invite code shared by a clan member.</div>
            <div className="field"><label>INVITE CODE</label><input className="inp" value={joinCode} onChange={e => setJoinCode(e.target.value)} placeholder="e.g. a3f8b21c" /></div>
            <button className="btn btn-s" onClick={joinClan}>🔗 Join Clan</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="col gap20">
      <div className="card">
        <div className="card-h">
          <div className="row gap12">
            <div style={{ fontFamily: 'var(--fhead)', fontSize: 18, color: 'var(--accent)' }}>[{clan.tag}]</div>
            <div>
              <div className="bold" style={{ fontSize: 16 }}>{clan.name}</div>
              <div className="muted text-sm">Your role: <span className="acc">{clanRole}</span></div>
            </div>
          </div>
          {(clanRole === 'owner' || clanRole === 'officer') && (
            <div className="row gap8">
              <span className="muted text-sm">Invite code:</span>
              <code className="mono" style={{ background: 'var(--bg)', padding: '3px 8px', borderRadius: 3, fontSize: 12, color: 'var(--accent2)' }}>{clan.invite_code}</code>
            </div>
          )}
        </div>
      </div>

      <div className="tabs">
        {[['overview', '👥 Members'], ['inventory', '📦 Clan Inventory']].map(([k, l]) => (
          <div key={k} className={`tab ${view === k ? 'active' : ''}`} onClick={() => { setView(k); if (k !== 'overview') loadClan(); }}>{l}</div>
        ))}
      </div>

      {view === 'overview' && clanData && (
        <div className="g2" style={{ flexWrap: 'wrap' }}>
          {(clanData.members || []).map(m => (
            <div key={m.user_id} className="member-card">
              <div className="member-avatar">
                {m.profiles?.avatar_url ? <img src={m.profiles.avatar_url} alt={m.profiles.username} /> : null}
              </div>
              <div>
                <div className="bold">{m.profiles?.username || 'Unknown'}</div>
                <div className="muted text-sm">{m.role}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {view === 'inventory' && (
        <div className="card">
          <div className="card-h"><span className="card-t">SHARED CLAN INVENTORY</span></div>
          <div className="tw">
            <table>
              <thead><tr><th>MATERIAL</th><th>CATEGORY</th><th>CLAN STOCK</th><th>ADJUST</th></tr></thead>
              <tbody>
                {materials.map(m => {
                  const inv = clanInv.find(i => i.material_id === m.id);
                  const owned = inv?.owned || 0;
                  return (
                    <tr key={m.id}>
                      <td><span style={{ fontSize: 18, marginRight: 8 }}>{m.icon}</span><strong>{m.name}</strong></td>
                      <td className="muted">{m.category}</td>
                      <td>
                        <input className="inp" type="number" style={{ width: 80 }} value={owned}
                          onChange={e => updateClanInv(m.id, Math.max(0, parseInt(e.target.value) || 0))} />
                      </td>
                      <td>
                        <div className="row gap4">
                          <button className="btn btn-s btn-xs" onClick={() => updateClanInv(m.id, Math.max(0, owned - 10))}>−10</button>
                          <button className="btn btn-s btn-xs" onClick={() => updateClanInv(m.id, Math.max(0, owned - 1))}>−1</button>
                          <button className="btn btn-p btn-xs" onClick={() => updateClanInv(m.id, owned + 1)}>+1</button>
                          <button className="btn btn-p btn-xs" onClick={() => updateClanInv(m.id, owned + 10)}>+10</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Recipe DB ──────────────────────────────────────────────────────────────
function RecipeDB({ recipes, materials }) {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(null);
  const getMat = id => materials.find(m => m.id === id);
  const list = recipes.filter(r => r.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="col gap14">
      <input className="inp" placeholder="🔍 Search recipes…" value={search} onChange={e => setSearch(e.target.value)} />
      <div className="card">
        <div className="tw">
          <table>
            <thead><tr><th>RECIPE</th><th>OUTPUT QTY</th><th>STATION</th><th>TIME</th><th>CAT</th><th></th></tr></thead>
            <tbody>
              {list.map(r => {
                const out = getMat(r.output_id);
                const isOpen = open === r.id;
                return [
                  <tr key={r.id}>
                    <td><strong>{out?.icon} {r.name}</strong></td>
                    <td className="mono acc">×{r.output_qty}</td>
                    <td className="muted">{r.station}</td>
                    <td className="mono">{r.craft_time}</td>
                    <td><span className="badge">{r.category}</span></td>
                    <td><button className="btn btn-s btn-xs" onClick={() => setOpen(isOpen ? null : r.id)}>{isOpen ? '▲ Hide' : '▼ Show'}</button></td>
                  </tr>,
                  isOpen && (
                    <tr key={r.id + '_exp'}>
                      <td colSpan={6} style={{ background: 'var(--bg)', padding: '10px 14px' }}>
                        <div className="row gap8 wrap">
                          {r.ingredients.map(ing => {
                            const m = getMat(ing.material_id);
                            return (
                              <div key={ing.material_id} className="row gap8" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 4, padding: '5px 10px' }}>
                                <span>{m?.icon}</span><span className="bold">{m?.name || ing.material_id}</span><span className="mono acc">×{ing.qty}</span>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )
                ];
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ── Admin Panel ────────────────────────────────────────────────────────────
function AdminPanel({ materials, setMaterials, recipes, setRecipes }) {
  const [tab, setTab] = useState('materials');
  const [matModal, setMatModal] = useState(null);
  const [recModal, setRecModal] = useState(null);
  const [saving, setSaving] = useState(false);

  async function saveMaterial(m) {
    setSaving(true);
    await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert_material', ...m }),
    });
    setMaterials(ms => {
      const i = ms.findIndex(x => x.id === m.id);
      if (i >= 0) { const n = [...ms]; n[i] = { ...n[i], ...m }; return n; }
      return [...ms, { ...m, owned: 0 }];
    });
    setSaving(false);
    setMatModal(null);
  }

  async function deleteMaterial(id) {
    if (!confirm('Delete material?')) return;
    await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_material', id }),
    });
    setMaterials(ms => ms.filter(m => m.id !== id));
  }

  async function saveRecipe(r) {
    setSaving(true);
    await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'upsert_recipe', ...r }),
    });
    setRecipes(rs => {
      const i = rs.findIndex(x => x.id === r.id);
      if (i >= 0) { const n = [...rs]; n[i] = r; return n; }
      return [...rs, r];
    });
    setSaving(false);
    setRecModal(null);
  }

  async function deleteRecipe(id) {
    if (!confirm('Delete recipe?')) return;
    await fetch('/api/recipes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'delete_recipe', id }),
    });
    setRecipes(rs => rs.filter(r => r.id !== id));
  }

  return (
    <div className="col gap20">
      {matModal && <MatModal mat={matModal === 'new' ? null : matModal} onSave={saveMaterial} onClose={() => setMatModal(null)} />}
      {recModal && <RecModal rec={recModal === 'new' ? null : recModal} materials={materials} onSave={saveRecipe} onClose={() => setRecModal(null)} />}

      <div className="tabs">
        {[['materials', '📦 Materials'], ['recipes', '⚙️ Recipes']].map(([k, l]) => (
          <div key={k} className={`tab ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>{l}</div>
        ))}
      </div>

      {tab === 'materials' && (
        <div className="col gap12">
          <div className="row jend"><button className="btn btn-p" onClick={() => setMatModal('new')}>+ Add Material</button></div>
          <div className="card"><div className="tw"><table>
            <thead><tr><th>ICON</th><th>NAME</th><th>CATEGORY</th><th>RARITY</th><th>ACTIONS</th></tr></thead>
            <tbody>{materials.map(m => (
              <tr key={m.id}>
                <td style={{ fontSize: 20 }}>{m.icon}</td><td><strong>{m.name}</strong></td>
                <td className="muted">{m.category}</td><td><RarityTag r={m.rarity} /></td>
                <td><div className="row gap8">
                  <button className="btn btn-s btn-xs" onClick={() => setMatModal(m)}>Edit</button>
                  <button className="btn btn-d btn-xs" onClick={() => deleteMaterial(m.id)}>Delete</button>
                </div></td>
              </tr>
            ))}</tbody>
          </table></div></div>
        </div>
      )}

      {tab === 'recipes' && (
        <div className="col gap12">
          <div className="row jend"><button className="btn btn-p" onClick={() => setRecModal('new')}>+ Add Recipe</button></div>
          <div className="card"><div className="tw"><table>
            <thead><tr><th>NAME</th><th>OUTPUT</th><th>QTY</th><th>STATION</th><th>INGS</th><th>ACTIONS</th></tr></thead>
            <tbody>{recipes.map(r => {
              const out = materials.find(m => m.id === r.output_id);
              return (
                <tr key={r.id}>
                  <td><strong>{out?.icon} {r.name}</strong></td>
                  <td className="muted">{out?.name || r.output_id}</td>
                  <td className="mono acc">×{r.output_qty}</td>
                  <td className="muted">{r.station}</td>
                  <td><span className="badge">{r.ingredients?.length || 0}</span></td>
                  <td><div className="row gap8">
                    <button className="btn btn-s btn-xs" onClick={() => setRecModal(r)}>Edit</button>
                    <button className="btn btn-d btn-xs" onClick={() => deleteRecipe(r.id)}>Delete</button>
                  </div></td>
                </tr>
              );
            })}</tbody>
          </table></div></div>
        </div>
      )}
    </div>
  );
}

// ── Modals ─────────────────────────────────────────────────────────────────
function MatModal({ mat, onSave, onClose }) {
  const [f, setF] = useState(mat || { id: '', name: '', category: 'Raw', rarity: 'Common', icon: '📦' });
  const s = (k, v) => setF(x => ({ ...x, [k]: v }));
  function save() {
    if (!f.name.trim()) return;
    const id = f.id || f.name.toLowerCase().replace(/\s+/g, '_') + uid();
    onSave({ ...f, id });
  }
  return (
    <div className="overlay">
      <div className="modal">
        <div className="modal-h"><span className="modal-t">{mat ? 'EDIT MATERIAL' : 'ADD MATERIAL'}</span><button className="btn btn-s btn-xs" onClick={onClose}>✕</button></div>
        <div className="modal-b">
          <div className="g2">
            <div className="field"><label>NAME</label><input className="inp" value={f.name} onChange={e => s('name', e.target.value)} /></div>
            <div className="field"><label>ICON (emoji)</label><input className="inp" value={f.icon} onChange={e => s('icon', e.target.value)} /></div>
          </div>
          <div className="g2">
            <div className="field"><label>CATEGORY</label>
              <select className="inp" value={f.category} onChange={e => s('category', e.target.value)}>
                {['Raw','Refined','Ammo','Throwable','Medical','Structural','Other'].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="field"><label>RARITY</label>
              <select className="inp" value={f.rarity} onChange={e => s('rarity', e.target.value)}>
                {['Common','Uncommon','Rare','Epic'].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
          </div>
        </div>
        <div className="modal-f"><button className="btn btn-s" onClick={onClose}>Cancel</button><button className="btn btn-p" onClick={save}>💾 Save</button></div>
      </div>
    </div>
  );
}

function RecModal({ rec, materials, onSave, onClose }) {
  const [f, setF] = useState(rec || { id: '', name: '', output_id: '', output_qty: 1, craft_time: '30s', category: 'Refined', station: 'Workbench', ingredients: [] });
  const s = (k, v) => setF(x => ({ ...x, [k]: v }));
  const addIng = () => setF(x => ({ ...x, ingredients: [...x.ingredients, { material_id: '', qty: 1 }] }));
  const setIng = (i, k, v) => setF(x => { const a = [...x.ingredients]; a[i] = { ...a[i], [k]: k === 'qty' ? (parseInt(v) || 1) : v }; return { ...x, ingredients: a }; });
  const remIng = i => setF(x => ({ ...x, ingredients: x.ingredients.filter((_, j) => j !== i) }));
  function save() {
    if (!f.name.trim() || !f.output_id || f.ingredients.length === 0) { alert('Fill in name, output, and at least one ingredient.'); return; }
    onSave({ ...f, id: f.id || 'r' + uid(), output_qty: parseInt(f.output_qty) || 1 });
  }
  return (
    <div className="overlay">
      <div className="modal" style={{ width: 560 }}>
        <div className="modal-h"><span className="modal-t">{rec ? 'EDIT RECIPE' : 'ADD RECIPE'}</span><button className="btn btn-s btn-xs" onClick={onClose}>✕</button></div>
        <div className="modal-b">
          <div className="g2">
            <div className="field"><label>RECIPE NAME</label><input className="inp" value={f.name} onChange={e => s('name', e.target.value)} /></div>
            <div className="field"><label>OUTPUT MATERIAL</label>
              <select className="inp" value={f.output_id} onChange={e => s('output_id', e.target.value)}>
                <option value="">— select —</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
              </select>
            </div>
          </div>
          <div className="g3">
            <div className="field"><label>OUTPUT QTY</label><input className="inp" type="number" min={1} value={f.output_qty} onChange={e => s('output_qty', e.target.value)} /></div>
            <div className="field"><label>CRAFT TIME</label><input className="inp" value={f.craft_time} onChange={e => s('craft_time', e.target.value)} /></div>
            <div className="field"><label>STATION</label>
              <select className="inp" value={f.station} onChange={e => s('station', e.target.value)}>
                {['Workbench','Furnace','Electric Furnace','Lab Bench','Campfire','Forge','Other'].map(st => <option key={st}>{st}</option>)}
              </select>
            </div>
          </div>
          <div className="field"><label>CATEGORY</label>
            <select className="inp" value={f.category} onChange={e => s('category', e.target.value)}>
              {['Raw','Refined','Ammo','Throwable','Medical','Structural','Other'].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <hr className="divider" />
          <div className="row jbet mb8">
            <span className="mono" style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>INGREDIENTS</span>
            <button className="btn btn-s btn-xs" onClick={addIng}>+ Add</button>
          </div>
          {f.ingredients.length === 0 && <div className="muted">No ingredients yet.</div>}
          {f.ingredients.map((ing, i) => (
            <div key={i} className="ing">
              <select className="inp f1" value={ing.material_id} onChange={e => setIng(i, 'material_id', e.target.value)}>
                <option value="">— material —</option>
                {materials.map(m => <option key={m.id} value={m.id}>{m.icon} {m.name}</option>)}
              </select>
              <input className="inp" type="number" min={1} style={{ width: 70 }} value={ing.qty} onChange={e => setIng(i, 'qty', e.target.value)} />
              <button className="btn btn-d btn-xs" onClick={() => remIng(i)}>✕</button>
            </div>
          ))}
        </div>
        <div className="modal-f"><button className="btn btn-s" onClick={onClose}>Cancel</button><button className="btn btn-p" onClick={save}>💾 Save</button></div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════
// ROOT CLIENT COMPONENT
// ══════════════════════════════════════════════════════════════════════════
export default function DashboardClient({ user, materials: initMats, recipes: initRecs, clan, clanRole }) {
  const [materials, setMaterials] = useState(initMats);
  const [recipes, setRecipes] = useState(initRecs);
  const [page, setPage] = useState('dashboard');

  const pageLabel = PAGES.find(p => p.id === page)?.label || '';

  async function signOut() {
    await fetch('/api/auth/signout', { method: 'POST' });
    window.location.href = '/';
  }

  return (
    <div className="app">
      <Sidebar user={user} page={page} setPage={setPage} clan={clan} />
      <div className="main">
        <div className="topbar">
          <div>
            <div className="topbar-t">{pageLabel}</div>
            <div className="topbar-s">ONCE HUMAN — RAIDZONE PVP</div>
          </div>
          <div className="row gap12">
            <span className="mono muted" style={{ fontSize: 11 }}>{materials.length} mats · {recipes.length} recipes</span>
            <button className="btn btn-d btn-sm" onClick={signOut}>Sign Out</button>
          </div>
        </div>
        <div className="content">
          {page === 'dashboard' && <DashboardOverview user={user} materials={materials} recipes={recipes} clan={clan} />}
          {page === 'planner'   && <Planner materials={materials} recipes={recipes} />}
          {page === 'inventory' && <Inventory materials={materials} setMaterials={setMaterials} />}
          {page === 'clan'      && <ClanPage user={user} clan={clan} clanRole={clanRole} materials={materials} />}
          {page === 'recipes'   && <RecipeDB recipes={recipes} materials={materials} />}
          {page === 'admin'     && user.is_admin && <AdminPanel materials={materials} setMaterials={setMaterials} recipes={recipes} setRecipes={setRecipes} />}
        </div>
      </div>
    </div>
  );
}
