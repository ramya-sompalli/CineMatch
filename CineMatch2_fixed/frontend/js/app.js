/**
 * CineMatch — App Controller
 */

window.currentView = 'discover';

document.addEventListener('DOMContentLoaded', async () => {
  // Setup user display
  const uname = AUTH.username || 'Guest';
  document.getElementById('userName').textContent = uname;
  document.getElementById('userAvatar').textContent = uname[0]?.toUpperCase() || 'G';
  document.getElementById('signoutBtn').addEventListener('click', () => AUTH.logout());

  await initData();
  await loadFilters();
  await loadDiscover();
  await loadDirectors();
  setupNav();
  setupSearch();
  setupModal();
  setupMoods();
  setupTabs();
  setupDirectorSearch();
});

// ── NAV ──
function setupNav() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', e => { e.preventDefault(); switchView(link.dataset.view); });
  });
}

function switchView(name) {
  window.currentView = name;
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById(`view-${name}`)?.classList.add('active');
  document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.view === name));
  if (name === 'watchlist') loadWatchlist();
}

// ── FILTERS ──
async function loadFilters() {
  try {
    const f = await DATA.getFilters();
    const gsel = document.getElementById('discoverGenre');
    const esel = document.getElementById('discoverEra');
    f.genres?.forEach(g => { const o = document.createElement('option'); o.value=g; o.textContent=g; gsel.appendChild(o); });
    f.eras?.forEach(era => { const o = document.createElement('option'); o.value=era; o.textContent=era; esel.appendChild(o); });
    gsel.addEventListener('change', loadDiscover);
    esel.addEventListener('change', loadDiscover);
    document.getElementById('discoverSort').addEventListener('change', loadDiscover);
  } catch {}
}

// ── DISCOVER ──
async function loadDiscover() {
  const sort  = document.getElementById('discoverSort')?.value || 'rating';
  const genre = document.getElementById('discoverGenre')?.value || '';
  const era   = document.getElementById('discoverEra')?.value || '';
  document.getElementById('discoverGrid').innerHTML = `<div class="loading"><span>◈</span> Loading…</div>`;
  try {
    const d = await DATA.getMovies({ sort, genre, era });
    renderGrid(d.movies, 'discoverGrid');
  } catch {
    document.getElementById('discoverGrid').innerHTML = `<div class="empty-state"><p>Could not load films.</p></div>`;
  }
}

// ── SEARCH ──
function setupSearch() {
  let timer;
  document.getElementById('searchInput')?.addEventListener('input', () => {
    clearTimeout(timer);
    timer = setTimeout(runSearch, 280);
  });
}

async function runSearch() {
  const q = document.getElementById('searchInput')?.value?.trim() || '';
  const grid = document.getElementById('searchGrid');
  if (!q) { grid.innerHTML = `<div class="empty-state"><p class="empty-icon">◎</p><p>Start typing to search</p></div>`; return; }
  grid.innerHTML = `<div class="loading"><span>◎</span> Searching…</div>`;
  try {
    const d = await DATA.search(q);
    if (!d.movies.length) grid.innerHTML = `<div class="empty-state"><p class="empty-icon">◎</p><p>No results for "<em>${q}</em>"</p></div>`;
    else renderGrid(d.movies, 'searchGrid');
  } catch { grid.innerHTML = `<div class="empty-state"><p>Search failed.</p></div>`; }
}

// ── MOODS ──
function setupMoods() {
  document.querySelectorAll('.mood-card').forEach(card => {
    card.addEventListener('click', async () => {
      document.querySelectorAll('.mood-card').forEach(c => c.classList.remove('active'));
      card.classList.add('active');
      const mood = card.dataset.mood;
      document.getElementById('moodPickerSection').style.display = 'none';
      document.getElementById('moodResultsSection').style.display = 'block';
      document.getElementById('moodTitle').textContent = `${mood} Films`;
      document.getElementById('moodGrid').innerHTML = `<div class="loading"><span>◑</span> Finding ${mood.toLowerCase()} films…</div>`;
      const d = await DATA.recommendMood({ mood });
      renderGrid(d.recommendations, 'moodGrid');
    });
  });

  document.getElementById('clearMoodBtn')?.addEventListener('click', () => {
    document.getElementById('moodResultsSection').style.display = 'none';
    document.getElementById('moodPickerSection').style.display = 'block';
    document.querySelectorAll('.mood-card').forEach(c => c.classList.remove('active'));
  });
}

// ── DIRECTOR ──
async function loadDirectors() {
  const grid = document.getElementById('directorGrid');
  if (!grid) return;
  grid.innerHTML = `<div class="loading"><span>◈</span></div>`;
  try {
    const d = await DATA.getDirectors();
    if (!d.directors?.length) { grid.innerHTML = ''; return; }
    grid.innerHTML = d.directors.map(dir => `
      <div class="dir-card" onclick="loadDirectorFilms('${dir.director.replace(/'/g,"\\'")}')">
        <div class="dir-name">${dir.director}</div>
        <div class="dir-meta">★ ${(+dir.avg_rating).toFixed(2)} · ${dir.count} films</div>
      </div>`).join('');
  } catch { grid.innerHTML = ''; }
}

function setupDirectorSearch() {
  let timer;
  document.getElementById('directorInput')?.addEventListener('input', e => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const q = e.target.value.trim();
      if (q.length > 1) loadDirectorFilms(q);
      else {
        document.getElementById('directorResults').style.display = 'none';
        document.getElementById('directorGrid').style.display = 'grid';
      }
    }, 280);
  });

  document.getElementById('clearDirBtn')?.addEventListener('click', () => {
    document.getElementById('directorResults').style.display = 'none';
    document.getElementById('directorGrid').style.display = 'grid';
    document.getElementById('directorInput').value = '';
  });
}

async function loadDirectorFilms(director) {
  document.getElementById('directorGrid').style.display = 'none';
  const res = document.getElementById('directorResults');
  res.style.display = 'block';
  document.getElementById('directorTitle').textContent = `Films by ${director}`;
  document.getElementById('directorMovies').innerHTML = `<div class="loading"><span>◈</span></div>`;
  try {
    const d = await DATA.recommendDirector(director);
    if (!d.movies?.length) {
      document.getElementById('directorMovies').innerHTML = `<div class="empty-state"><p>No films found for "${director}"</p></div>`;
    } else {
      renderGrid(d.movies, 'directorMovies');
    }
    if (d.similar_style?.length) {
      document.getElementById('dnaSection').style.display = 'block';
      renderGrid(d.similar_style, 'dnaGrid');
    } else {
      document.getElementById('dnaSection').style.display = 'none';
    }
  } catch {
    document.getElementById('directorMovies').innerHTML = `<div class="empty-state"><p>Error loading films.</p></div>`;
  }
}

// ── WATCHLIST / TABS ──
function setupTabs() {
  document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      document.querySelectorAll('.tab-pane').forEach(p => p.classList.add('hidden'));
      document.getElementById(`tab-${tab.dataset.tab}`)?.classList.remove('hidden');
      if (tab.dataset.tab === 'foryou') loadHybrid();
      if (tab.dataset.tab === 'rated') loadRated();
    });
  });
}

async function loadWatchlist() {
  document.getElementById('watchlistGrid').innerHTML = `<div class="loading"><span>◻</span></div>`;
  try {
    const d = await DATA.getWatchlist();
    if (!d.watchlist.length) document.getElementById('watchlistGrid').innerHTML = `<div class="empty-state"><p class="empty-icon">◻</p><p>No films saved yet.</p></div>`;
    else renderGrid(d.watchlist, 'watchlistGrid');
  } catch {}
}

async function loadRated() {
  const rated = backendOnline
    ? []
    : Object.keys(LOCAL.ratings).map(id => LOCAL.ratings[id] ? fmtLocal(MOVIES_MAP[+id]) : null).filter(Boolean);
  if (!rated.length) document.getElementById('ratedGrid').innerHTML = `<div class="empty-state"><p class="empty-icon">★</p><p>Rate some films first.</p></div>`;
  else renderGrid(rated, 'ratedGrid');
}

async function loadHybrid() {
  document.getElementById('hybridGrid').innerHTML = `<div class="loading"><span>◬</span> Analyzing taste…</div>`;
  try {
    const d = await DATA.recommendHybrid();
    if (!d.recommendations?.length) document.getElementById('hybridGrid').innerHTML = `<div class="empty-state"><p class="empty-icon">◬</p><p>Rate films to get personalized picks.</p></div>`;
    else renderGrid(d.recommendations, 'hybridGrid');
  } catch {}
}

// ── MODAL ──
function setupModal() {
  document.getElementById('modalX')?.addEventListener('click', closeModal);
  document.getElementById('modalBg')?.addEventListener('click', e => {
    if (e.target === document.getElementById('modalBg')) closeModal();
  });
  document.addEventListener('keydown', e => { if (e.key==='Escape') closeModal(); });
}
