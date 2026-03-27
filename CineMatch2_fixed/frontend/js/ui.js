/**
 * CineMatch — UI Rendering (with real TMDB poster images)
 */

const GENRE_SYMBOLS = { Drama:'◎', Crime:'◈', Action:'⬡', 'Sci-Fi':'◬', Horror:'◑', Romance:'◇', Animation:'◻', Thriller:'◈', Biography:'◎', Comedy:'⬡', History:'◇', Fantasy:'◬', Music:'◎', Adventure:'⬡', Mystery:'◑', War:'◈', Western:'◬' };

function hue(id) { return (id * 47 + 120) % 360; }

// ── CARD ──
function renderCard(movie) {
  const sym = GENRE_SYMBOLS[movie.genres[0]] || '◎';
  const h   = hue(movie.id);
  const saved = movie.in_watchlist;
  const stars = [1,2,3,4,5].map(n =>
    `<span class="star ${movie.user_rating && n <= movie.user_rating ? 'on':''}` +
    `" onclick="rateCard(event,${movie.id},${n})">★</span>`
  ).join('');

  const posterHtml = movie.poster_url
    ? `<img src="${movie.poster_url}" alt="${movie.title}" loading="lazy" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
    : '';
  const fallbackStyle = movie.poster_url ? 'display:none' : '';

  return `
  <div class="movie-card" data-id="${movie.id}" onclick="openModal(${movie.id})">
    <div class="card-poster">
      ${posterHtml}
      <div class="poster-fallback" style="${fallbackStyle};background:linear-gradient(160deg,hsl(${h},20%,10%),hsl(${h},10%,6%))">
        <span class="poster-symbol" style="color:hsl(${h},50%,50%)">${sym}</span>
        <span class="poster-title-fb">${movie.title}</span>
      </div>
      <div class="poster-overlay"></div>
      <span class="card-badge">★ ${movie.rating.toFixed(1)}</span>
      <button class="card-bm ${saved?'saved':''}" onclick="toggleWL(event,${movie.id})" title="${saved?'Remove':'Save'}">
        ${saved ? '◻' : '+'}</button>
    </div>
    <div class="card-info">
      <div class="card-title">${movie.title}</div>
      <div class="card-dir">${movie.director}</div>
      <div class="card-meta"><span>${movie.year}</span><span>${movie.runtime}m</span><span>${movie.language}</span></div>
      <div class="tags">${movie.genres.slice(0,2).map(g=>`<span class="tag">${g}</span>`).join('')}</div>
      <div class="card-stars">${stars}</div>
      ${movie.user_rating ? `<div class="user-r">You: ${movie.user_rating}/5 ★</div>` : ''}
    </div>
  </div>`;
}

function renderGrid(movies, containerId) {
  const el = document.getElementById(containerId);
  if (!el) return;
  if (!movies?.length) {
    el.innerHTML = `<div class="empty-state"><p class="empty-icon">◎</p><p>No films found.</p></div>`;
    return;
  }
  el.innerHTML = movies.map(renderCard).join('');
}

// ── MODAL ──
async function openModal(id) {
  const bg = document.getElementById('modalBg');
  const body = document.getElementById('modalBody');
  bg.classList.add('open');
  body.innerHTML = `<div style="padding:60px;text-align:center;color:var(--text-m);font-family:var(--fm);font-size:12px">Loading…</div>`;

  try {
    const m = await DATA.getMovie(id);
    const h = hue(m.id);
    const sym = GENRE_SYMBOLS[m.genres[0]] || '◎';

    const posterHtml = m.poster_url
      ? `<img src="${m.poster_url}" alt="${m.title}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">`
      : '';

    const allTags = [...m.genres, ...m.mood].map(t=>`<span class="tag">${t}</span>`).join('');
    const starHtml = [1,2,3,4,5].map(n=>
      `<span class="mstar ${m.user_rating&&n<=m.user_rating?'on':''}" onclick="rateModal(${m.id},${n})"  data-n="${n}">★</span>`
    ).join('');

    const simHtml = (m.similar||[]).map(s => {
      const sp = s.poster_url
        ? `<img src="${s.poster_url}" alt="${s.title}" style="width:100%;height:100%;object-fit:cover" onerror="this.style.display='none'">`
        : '';
      return `<div class="sim-card" onclick="openModal(${s.id})">
        <div class="sim-poster" style="background:linear-gradient(160deg,hsl(${hue(s.id)},20%,10%),hsl(${hue(s.id)},10%,6%))">
          ${sp}<div class="sim-poster-fb" style="color:hsl(${hue(s.id)},50%,50%)">${GENRE_SYMBOLS[s.genres[0]]||'◎'}</div>
        </div>
        <div class="sim-ttl">${s.title}</div>
      </div>`;
    }).join('');

    body.innerHTML = `
      <div class="modal-hero">
        <div class="modal-poster-wrap" style="background:linear-gradient(160deg,hsl(${h},20%,10%),hsl(${h},10%,6%))">
          ${posterHtml}
          <div class="modal-poster-fb" style="color:hsl(${h},50%,50%)">${sym}</div>
        </div>
        <div class="modal-info">
          <div class="modal-mlabel">${m.era} · ${m.style}</div>
          <div class="modal-title">${m.title}</div>
          <div class="modal-director">Directed by ${m.director}</div>
          <div style="display:flex;gap:5px;flex-wrap:wrap">${allTags}</div>
          <div class="modal-stats">
            <div class="ms"><span class="ms-k">IMDB</span><span class="ms-v">★ ${m.rating}</span></div>
            <div class="ms"><span class="ms-k">YEAR</span><span class="ms-v">${m.year}</span></div>
            <div class="ms"><span class="ms-k">RUNTIME</span><span class="ms-v">${m.runtime}m</span></div>
            <div class="ms"><span class="ms-k">LANG</span><span class="ms-v">${m.language}</span></div>
            <div class="ms"><span class="ms-k">COUNTRY</span><span class="ms-v">${m.country}</span></div>
          </div>
          <div class="modal-actions">
            <button class="btn-p" id="wlBtn" onclick="toggleWL(event,${m.id},true)">${m.in_watchlist?'◻ Saved':'+ Watchlist'}</button>
            <button class="btn-s" onclick="loadSimilarView(${m.id})">Similar →</button>
          </div>
        </div>
      </div>
      <p class="modal-plot">${m.plot}</p>
      <div class="modal-rate">
        <span class="rate-lbl">YOUR RATING</span>
        <div class="mstars" id="mstars">${starHtml}</div>
        ${m.user_rating ? `<span style="font-family:var(--fm);font-size:11px;color:var(--amber);margin-left:8px">${m.user_rating}/5</span>` : ''}
      </div>
      ${simHtml ? `<div class="modal-sim"><div class="sim-lbl">YOU MIGHT ALSO ENJOY</div><div class="sim-row">${simHtml}</div></div>` : ''}
    `;
    document.getElementById('modal').dataset.mid = m.id;
  } catch(e) {
    body.innerHTML = `<div style="padding:40px;text-align:center;color:var(--text-m)">Could not load film.</div>`;
  }
  updateStats();
}

function closeModal() { document.getElementById('modalBg').classList.remove('open'); }

async function rateModal(id, n) {
  await DATA.rateMovie(id, n);
  document.querySelectorAll('#mstars .mstar').forEach((s,i) => s.classList.toggle('on', i < n));
  showToast(`Rated ${n}/5 ★`);
  refreshCard(id);
  updateStats();
}

async function rateCard(e, id, n) {
  e.stopPropagation();
  await DATA.rateMovie(id, n);
  showToast(`Rated ${n}/5 ★`);
  refreshCard(id);
  updateStats();
}

async function toggleWL(e, id, fromModal=false) {
  e.stopPropagation();
  const m = await DATA.getMovie(id);
  if (!m) return;
  if (m.in_watchlist) { await DATA.removeWatchlist(id); showToast('Removed from watchlist'); }
  else { await DATA.addWatchlist(id); showToast('Saved ◻'); }
  refreshCard(id);
  if (fromModal) {
    const btn = document.getElementById('wlBtn');
    if (btn) btn.textContent = m.in_watchlist ? '+ Watchlist' : '◻ Saved';
  }
  if (window.currentView === 'watchlist') loadWatchlist();
  updateStats();
}

async function refreshCard(id) {
  const m = await DATA.getMovie(id).catch(()=>null);
  if (!m) return;
  document.querySelectorAll(`.movie-card[data-id="${id}"]`).forEach(card => {
    const tmp = document.createElement('div');
    tmp.innerHTML = renderCard(m);
    card.replaceWith(tmp.firstElementChild);
  });
}

async function loadSimilarView(id) {
  closeModal();
  switchView('discover');
  const d = document.getElementById('discoverGrid');
  d.innerHTML = `<div class="loading"><span>◈</span> Finding similar films…</div>`;
  const res = await DATA.recommendSimilar(id);
  renderGrid(res.recommendations, 'discoverGrid');
}

// ── TOAST ──
function showToast(msg, ms=2500) {
  const t = document.getElementById('toast');
  t.textContent = msg; t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), ms);
}

// ── STATS ──
async function updateStats() {
  try {
    const s = await DATA.getStats();
    // update nav user badge area if needed
  } catch {}
}
