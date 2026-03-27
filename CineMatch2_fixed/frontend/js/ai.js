/**
 * CineMatch — AI Film Adviser (Claude-powered)
 */

const AI_SYS = `You are a passionate, knowledgeable film adviser for CineMatch. You have encyclopedic knowledge of world cinema across all eras and genres. Help users discover films they'll love — make recommendations, compare directors, explain what makes films special. Be warm, specific, and concise (2-3 paragraphs max). Our library includes 50 curated films: The Shawshank Redemption, The Godfather, The Dark Knight, Schindler's List, Pulp Fiction, Fight Club, Inception, The Matrix, Goodfellas, Forrest Gump, Interstellar, The Silence of the Lambs, Parasite, Spirited Away, Whiplash, La La Land, No Country for Old Men, Mad Max Fury Road, Her, The Grand Budapest Hotel, Moonlight, Get Out, Princess Mononoke, Eternal Sunshine of the Spotless Mind, Taxi Driver, Blade Runner 2049, Oldboy, The Truman Show, Amélie, 2001 A Space Odyssey, The Prestige, City of God, Django Unchained, Gone Girl, Memento, Pan's Labyrinth, Everything Everywhere All at Once, Oppenheimer, Dune, About Time, Knives Out, Soul, Coco, The Wolf of Wall Street, Catch Me If You Can, Black Swan, Portrait of a Lady on Fire, The Banshees of Inisherin, The Pianist.`;

const aiHistory = [];

async function sendAI() {
  const inp = document.getElementById('aiInput');
  const msg = inp.value.trim();
  if (!msg) return;
  inp.value = '';
  addMsg('user', msg);
  const lid = addLoading();
  aiHistory.push({ role:'user', content: msg });
  try {
    const reply = await callClaude();
    removeLoading(lid);
    addMsg('bot', reply);
    aiHistory.push({ role:'assistant', content: reply });
  } catch {
    removeLoading(lid);
    addMsg('bot', fallback(msg));
  }
}

async function callClaude() {
  const messages = aiHistory.map(m => ({ role: m.role==='bot'?'assistant':m.role, content: m.content }));
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method:'POST',
    headers:{'Content-Type':'application/json'},
    body:JSON.stringify({ model:'claude-sonnet-4-20250514', max_tokens:1000, system:AI_SYS, messages })
  });
  if (!res.ok) throw new Error('API error');
  const d = await res.json();
  return d.content?.[0]?.text || 'Could not generate a response.';
}

function suggest(text) {
  document.getElementById('aiInput').value = text;
  sendAI();
}

function fallback(q) {
  const ql = q.toLowerCase();
  if (ql.includes('inception')||ql.includes('mind')) return `For mind-bending narratives, **Memento** (2000) is essential — told entirely in reverse. **Eternal Sunshine of the Spotless Mind** adds emotional depth to fractured reality. **Oldboy** from South Korea delivers shocking twists alongside genuine tension.`;
  if (ql.includes('parasite')||ql.includes('class')) return `**Parasite** merges genre thrills with sharp class critique. Similar territory: **Get Out** uses horror to dissect race in America, **The Truman Show** skewers authenticity and performance, **City of God** presents class and survival with kinetic energy.`;
  if (ql.includes('scorsese')||ql.includes('crime')) return `Scorsese's films pulse with moral complexity and propulsive energy. **Goodfellas** is his most purely pleasurable work; **Taxi Driver** shows his darker expressionist side. **The Wolf of Wall Street** takes excess to its logical extreme. Try **City of God** for similar DNA from another director.`;
  if (ql.includes('emotional')||ql.includes('cry')||ql.includes('heartwarming')) return `**Coco** and **Soul** are emotionally devastating while remaining accessible — rare in cinema. **About Time** earns its sentiment through accumulation. **Moonlight** is perhaps the most quietly devastating film of the last decade — a masterclass in what's left unsaid.`;
  if (ql.includes('nolan')||ql.includes('director')) return `Nolan is cinema's great puzzle-builder — each film engineers the sensation of time and perception unraveling. His arc from **Memento** → **The Prestige** → **Inception** → **Interstellar** shows growing ambition. Compare to **Kubrick**: also drawn to grand ideas, but colder and more formal, treating character as instrument.`;
  if (ql.includes('miyazaki')||ql.includes('anime')||ql.includes('animated')) return `Miyazaki's films offer something irreplaceable: total visual imagination combined with profound moral complexity. **Spirited Away** is the perfect entry point — a child's adventure and a meditation on labor, identity and belonging. **Princess Mononoke** is more epic and morally ambiguous. Both reward repeated viewing.`;
  return `Tell me more about what you're looking for — a specific mood, a director you love, a film that moved you. I can point you toward something that'll genuinely click.`;
}

// ── DOM helpers ──
function addMsg(role, text) {
  const chat = document.getElementById('aiChat');
  const div = document.createElement('div');
  div.className = `ai-msg ${role}`;
  const fmt = text.replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>').replace(/\n/g,'<br>');
  div.innerHTML = `
    ${role==='bot'?'<div class="ai-av">◈</div>':''}
    <div class="ai-bubble">${fmt}</div>
    ${role==='user'?'<div class="ai-av" style="background:var(--surface2)">◎</div>':''}
  `;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return div;
}

function addLoading() {
  const id = 'ld-'+Date.now();
  const chat = document.getElementById('aiChat');
  const div = document.createElement('div');
  div.className = 'ai-msg bot'; div.id = id;
  div.innerHTML = `<div class="ai-av">◈</div><div class="ai-bubble"><div class="ai-dots"><div class="dot"></div><div class="dot"></div><div class="dot"></div></div></div>`;
  chat.appendChild(div);
  chat.scrollTop = chat.scrollHeight;
  return id;
}
function removeLoading(id) { document.getElementById(id)?.remove(); }

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('aiInput')?.addEventListener('keydown', e => {
    if (e.key==='Enter') { e.preventDefault(); sendAI(); }
  });
});
