/**
 * github.js - client-side GitHub API fetching for xyzlab.dev
 *
 * All fetches hit the public GitHub API (unauthenticated, 60 req/hr per IP).
 * Contribution graph uses jogruber's free proxy since GitHub has no public API for it.
 */

const GH = 'https://api.github.com';
const USER = 'chr0nzz';

const TM_ICON = 'https://github.com/chr0nzz/traefik-manager/raw/main/docs/public/images/icon.png';

const REPOS = [
  {
    slug: 'traefik-manager',
    displayName: 'Traefik Manager',
    icon: TM_ICON,
    desc: 'Web UI for managing your Traefik instance. Live dashboard, TLS certs, access logs, plugins - all from your browser.',
    features: ['live dashboard', 'TLS cert viewer', 'access log stream', 'plugin viewer', 'auto backups', 'mobile companion'],
    badges: ['stable', 'github'],
    links: { docs: 'https://traefik-manager.xyzlab.dev', github: 'https://github.com/chr0nzz/traefik-manager' },
    featured: true,
  },
  {
    slug: 'traefik-manager-mobile',
    displayName: 'Traefik Manager Mobile',
    icon: TM_ICON,
    desc: 'React Native companion app for Traefik Manager. Browse routes, middlewares, and services from your phone.',
    features: ['browse routes', 'enable/disable routes', 'middleware editor', 'dark/light theme'],
    badges: ['beta', 'android'],
    links: { github: 'https://github.com/chr0nzz/traefik-manager-mobile' },
    featured: false,
  },
  {
    slug: 'jellyfin-widget-proxy',
    displayName: 'jellyfin-widget-proxy',
    icon: null,
    desc: 'Lightweight proxy server that fetches Jellyfin data for use in dashboards and Homepage widgets.',
    features: ['jellyfin API', 'homepage widget', 'lightweight', 'docker native'],
    badges: ['stable'],
    links: { github: 'https://github.com/chr0nzz/jellyfin-widget-proxy' },
    featured: false,
  },
  {
    slug: 'ntfy-adapter',
    displayName: 'ntfy-adapter',
    icon: null,
    desc: 'Docker adapter bridging ntfy notifications into Homepage\'s customapi widget as a dynamic list.',
    features: ['ntfy integration', 'homepage widget', 'priority expiry', 'docker native'],
    badges: ['stable'],
    links: { github: 'https://github.com/chr0nzz/ntfy-adapter' },
    featured: false,
  },
  {
    slug: 'traefik-stack',
    displayName: 'traefik-stack',
    icon: TM_ICON,
    desc: 'One-command installer that sets up Traefik + Traefik Manager via an interactive bash script. Generates docker-compose.yml and traefik.yml from your answers.',
    features: ['one command', 'interactive setup', 'config generation', 'docker compose'],
    badges: ['new'],
    links: { github: 'https://github.com/chr0nzz/traefik-stack' },
    featured: false,
    wide: true,
    installCmd: 'curl -fsSL https://get-traefik.xyzlab.dev | bash',
  },
];

// ─── Helpers ─────────────────────────────────────────────────────────────────

const GH_TOKEN = document.querySelector('meta[name="gh-token"]')?.content || '';

async function ghFetch(path) {
  const headers = { Accept: 'application/vnd.github.v3+json' };
  if (GH_TOKEN) headers['Authorization'] = `Bearer ${GH_TOKEN}`;
  const res = await fetch(`${GH}${path}`, { headers });
  if (!res.ok) throw new Error(`GitHub API ${path} → ${res.status}`);
  return res.json();
}

async function ghGraphQL(query) {
  const headers = { 'Content-Type': 'application/json' };
  if (GH_TOKEN) headers['Authorization'] = `Bearer ${GH_TOKEN}`;
  const res = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers,
    body: JSON.stringify({ query }),
  });
  if (!res.ok) throw new Error(`GraphQL → ${res.status}`);
  return res.json();
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days < 7) return `${days}d ago`;
  const weeks = Math.floor(days / 7);
  return `${weeks}w ago`;
}

function el(tag, attrs = {}, ...children) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (k === 'class') e.className = v;
    else if (k === 'style') e.style.cssText = v;
    else e.setAttribute(k, v);
  }
  for (const child of children) {
    if (typeof child === 'string') e.insertAdjacentHTML('beforeend', child);
    else if (child) e.appendChild(child);
  }
  return e;
}

// ─── Version Badges ──────────────────────────────────────────────────────────

async function loadVersions() {
  await Promise.all(
    REPOS.map(async r => {
      const container = document.querySelector(`[data-repo-badges="${r.slug}"]`);
      if (!container) return;
      try {
        const releases = await ghFetch(`/repos/${USER}/${r.slug}/releases?per_page=10`);
        const latest = releases.find(r => !r.prerelease);
        if (latest) {
          const b = document.createElement('span');
          b.className = 'badge version';
          b.textContent = latest.tag_name;
          container.appendChild(b);
        }
      } catch {}
    })
  );
}

// ─── Stats Bar ───────────────────────────────────────────────────────────────

async function loadStats() {
  try {
    const repoData = await Promise.all(
      REPOS.map(r => ghFetch(`/repos/${USER}/${r.slug}`).catch(() => null))
    );

    const totalStars = repoData.reduce((acc, r) => acc + (r?.stargazers_count || 0), 0);
    const totalForks = repoData.reduce((acc, r) => acc + (r?.forks_count || 0), 0);

    const statEls = document.querySelectorAll('[data-stat]');
    statEls.forEach(el => {
      const key = el.dataset.stat;
      if (key === 'stars') el.textContent = totalStars;
      if (key === 'forks') el.textContent = totalForks;
    });

    // Also inject per-repo stars into app cards
    repoData.forEach((repo, i) => {
      if (!repo) return;
      const starEl = document.querySelector(`[data-repo-stars="${REPOS[i].slug}"]`);
      if (starEl) starEl.textContent = repo.stargazers_count;
    });
  } catch (e) {
    console.warn('Stats load failed:', e);
  }
}

// ─── Contribution Graph ───────────────────────────────────────────────────────

async function loadContribGraph() {
  const wrap = document.getElementById('contrib-graph');
  if (!wrap) return;

  try {
    const res = await fetch(`https://github-contributions-api.jogruber.de/v4/${USER}?y=last`);
    const data = await res.json();

    const weeks = data.contributions.reduce((acc, day) => {
      const d = new Date(day.date);
      const week = Math.floor((d - new Date(data.contributions[0].date)) / (7 * 86400000));
      if (!acc[week]) acc[week] = [];
      acc[week].push(day);
      return acc;
    }, {});

    const totalContribs = data.total?.lastYear || data.contributions.reduce((a, d) => a + d.count, 0);
    const countEl = document.getElementById('contrib-count');
    if (countEl) countEl.textContent = totalContribs;

    wrap.innerHTML = '';
    const graph = el('div', { style: 'display:flex;gap:3px;overflow-x:auto;padding-bottom:4px' });

    Object.values(weeks).forEach(week => {
      const weekDiv = el('div', { style: 'display:flex;flex-direction:column;gap:3px' });
      week.forEach(day => {
        const cell = el('div', {
          style: `width:12px;height:12px;border-radius:2px;flex-shrink:0`,
          title: `${day.date}: ${day.count} contributions`,
        });
        const level = day.count === 0 ? 0 : day.count < 3 ? 1 : day.count < 6 ? 2 : day.count < 10 ? 3 : 4;
        const colors = [
          'var(--bg-tertiary)',
          'rgba(34,197,94,0.2)',
          'rgba(34,197,94,0.4)',
          'rgba(34,197,94,0.65)',
          '#22c55e',
        ];
        cell.style.background = colors[level];
        weekDiv.appendChild(cell);
      });
      graph.appendChild(weekDiv);
    });

    wrap.appendChild(graph);

    // Legend
    const legend = el('div', { style: 'display:flex;align-items:center;gap:6px;margin-top:8px;justify-content:flex-end' });
    legend.insertAdjacentHTML('beforeend', '<span class="mono" style="font-size:10px;color:var(--text-tertiary)">less</span>');
    ['var(--bg-tertiary)', 'rgba(34,197,94,0.2)', 'rgba(34,197,94,0.4)', 'rgba(34,197,94,0.65)', '#22c55e'].forEach(c => {
      const s = el('div', { style: `width:12px;height:12px;border-radius:2px;background:${c}` });
      legend.appendChild(s);
    });
    legend.insertAdjacentHTML('beforeend', '<span class="mono" style="font-size:10px;color:var(--text-tertiary)">more</span>');
    wrap.appendChild(legend);

    wrap.classList.add('fade-in');
  } catch (e) {
    console.warn('Contribution graph failed:', e);
    wrap.innerHTML = '<p style="color:var(--text-tertiary);font-size:13px">Could not load contribution graph.</p>';
  }
}

// ─── Recent Commits ───────────────────────────────────────────────────────────

async function loadCommits() {
  const list = document.getElementById('commits-list');
  if (!list) return;

  try {
    const all = await Promise.all(
      REPOS.map(r =>
        ghFetch(`/repos/${USER}/${r.slug}/commits?per_page=5`)
          .then(commits => commits.map(c => ({
            repo: r.slug,
            message: c.commit.message.split('\n')[0],
            sha: c.sha.slice(0, 7),
            time: c.commit.author.date,
            url: c.html_url,
          })))
          .catch(() => [])
      )
    );

    const commits = all
      .flat()
      .sort((a, b) => new Date(b.time) - new Date(a.time))
      .slice(0, 6);

    list.innerHTML = '';
    if (!commits.length) {
      list.innerHTML = '<p style="color:var(--text-tertiary);font-size:13px;padding:12px 0">No recent commits found.</p>';
      return;
    }
    commits.forEach(commit => {
      const item = el('a', {
        href: commit.url,
        target: '_blank',
        rel: 'noopener',
        class: 'commit-item fade-in',
        style: 'display:flex;align-items:center;gap:10px;padding:8px 14px;text-decoration:none;color:inherit;font-family:var(--font-mono);font-size:12px;transition:background 0.12s',
      });
      item.innerHTML = `
        <span style="color:var(--accent);flex-shrink:0;user-select:none">$</span>
        <span style="color:var(--accent);opacity:0.75;flex-shrink:0">${commit.sha}</span>
        <span style="color:#60a5fa;flex-shrink:0">${commit.repo}</span>
        <span style="color:var(--text);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${commit.message}</span>
        <span style="color:var(--text-tertiary);flex-shrink:0;margin-left:auto">${timeAgo(commit.time)}</span>
      `;
      item.addEventListener('mouseenter', () => item.style.background = 'var(--bg-tertiary)');
      item.addEventListener('mouseleave', () => item.style.background = '');
      list.appendChild(item);
    });
  } catch (e) {
    console.warn('Commits load failed:', e);
    list.innerHTML = '<p style="color:var(--text-tertiary);font-size:13px;padding:12px 0">Could not load recent commits.</p>';
  }
}

// ─── Open Issues ─────────────────────────────────────────────────────────────

async function loadIssues() {
  const grid = document.getElementById('issues-grid');
  const countEl = document.getElementById('issues-count');
  if (!grid) return;

  try {
    const allIssues = await Promise.all(
      REPOS.map(r =>
        ghFetch(`/repos/${USER}/${r.slug}/issues?state=open&per_page=10`)
          .then(issues => issues.map(i => ({ ...i, repoSlug: r.slug })))
          .catch(() => [])
      )
    );

    const flat = allIssues
      .flat()
      .filter(i => !i.pull_request)
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6);

    if (countEl) countEl.textContent = flat.length;

    grid.innerHTML = '';
    flat.forEach(issue => {
      const labelNames = issue.labels.map(l => l.name.toLowerCase());
      const labelType =
        labelNames.find(l => l.includes('bug')) ? 'bug' :
        labelNames.find(l => l.includes('enhancement') || l.includes('feature') || l.includes('feat')) ? 'feat' :
        labelNames.find(l => l.includes('help')) ? 'help' : 'default';

      const labelText =
        labelType === 'bug' ? 'bug' :
        labelType === 'feat' ? 'enhancement' :
        labelType === 'help' ? 'help wanted' : 'open';

      const iconColor = labelType === 'bug' ? '#f87171' : labelType === 'help' ? '#60a5fa' : 'var(--accent)';
      const labelColors = {
        bug:     'background:rgba(239,68,68,0.12);color:#f87171;border:1px solid rgba(239,68,68,0.25)',
        feat:    'background:var(--accent-dim);color:var(--accent);border:1px solid var(--accent-border)',
        help:    'background:rgba(59,130,246,0.12);color:#60a5fa;border:1px solid rgba(59,130,246,0.25)',
        default: 'background:var(--bg-tertiary);color:var(--text-secondary);border:1px solid var(--border)',
      };
      const item = el('a', {
        href: issue.html_url,
        target: '_blank',
        rel: 'noopener',
        class: 'issue-item fade-in',
        style: 'display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-bottom:1px solid var(--border);text-decoration:none;color:inherit;background:var(--bg-secondary);transition:background 0.12s',
      });
      item.innerHTML = `
        <svg style="flex-shrink:0;margin-top:2px;color:${iconColor}" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 9.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z"/>
          <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0ZM1.5 8a6.5 6.5 0 1 0 13 0 6.5 6.5 0 0 0-13 0Z"/>
        </svg>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-size:14px;font-weight:600;color:var(--text)">${issue.title}</span>
            <span style="font-size:11px;padding:2px 8px;border-radius:99px;font-weight:500;${labelColors[labelType]}">${labelText}</span>
          </div>
          <div style="font-size:12px;color:var(--text-tertiary);font-family:var(--font-mono)">
            #${issue.number} · ${issue.repoSlug} · opened ${timeAgo(issue.created_at)} · ${issue.comments} comment${issue.comments !== 1 ? 's' : ''}
          </div>
        </div>
      `;
      item.addEventListener('mouseenter', () => item.style.background = 'var(--bg-tertiary)');
      item.addEventListener('mouseleave', () => item.style.background = 'var(--bg-secondary)');
      grid.appendChild(item);
    });
  } catch (e) {
    console.warn('Issues load failed:', e);
    grid.innerHTML = '<p style="color:var(--text-tertiary);font-size:13px">Could not load issues.</p>';
  }
}

// ─── Typewriter ──────────────────────────────────────────────────────────────

function typewriter(el, lines, speed = 38) {
  let lineIdx = 0;
  let charIdx = 0;

  const cursor = document.createElement('span');
  cursor.className = 'cursor';
  el.appendChild(cursor);

  function tick() {
    if (lineIdx >= lines.length) return;

    const line = lines[lineIdx];
    const lineEl = el.querySelector(`[data-tw-line="${lineIdx}"]`);

    if (!lineEl) {
      const newLine = document.createElement('div');
      newLine.className = 'term-line';
      newLine.setAttribute('data-tw-line', lineIdx);
      newLine.innerHTML = line.prefix || '';
      el.insertBefore(newLine, cursor);
      charIdx = 0;
    }

    const target = el.querySelector(`[data-tw-line="${lineIdx}"]`);
    if (charIdx < line.text.length) {
      target.innerHTML = (line.prefix || '') + line.text.slice(0, ++charIdx);
      setTimeout(tick, speed);
    } else {
      lineIdx++;
      charIdx = 0;
      if (line.delay) setTimeout(tick, line.delay);
      else setTimeout(tick, speed);
    }
  }

  tick();
}

// ─── Pull Requests ───────────────────────────────────────────────────────────

async function loadPullRequests() {
  const grid = document.getElementById('prs-grid');
  const countEl = document.getElementById('prs-count');
  if (!grid) return;

  try {
    const all = await Promise.all(
      REPOS.map(r =>
        ghFetch(`/repos/${USER}/${r.slug}/pulls?state=open&per_page=10`)
          .then(prs => prs.map(p => ({ ...p, repoSlug: r.slug })))
          .catch(() => [])
      )
    );

    const flat = all
      .flat()
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .slice(0, 6);

    if (countEl) countEl.textContent = flat.length;
    grid.innerHTML = '';

    if (!flat.length) {
      grid.innerHTML = '<p style="color:var(--text-tertiary);font-size:13px;padding:14px 16px">No open pull requests.</p>';
      return;
    }

    flat.forEach(pr => {
      const isDraft = pr.draft;
      const iconColor = isDraft ? 'var(--text-tertiary)' : 'var(--accent)';
      const item = el('a', {
        href: pr.html_url,
        target: '_blank',
        rel: 'noopener',
        class: 'issue-item fade-in',
        style: 'display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-bottom:1px solid var(--border);text-decoration:none;color:inherit;background:var(--bg-secondary);transition:background 0.12s',
      });
      item.innerHTML = `
        <svg style="flex-shrink:0;margin-top:2px;color:${iconColor}" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1.5 3.25a2.25 2.25 0 1 1 3 2.122v5.256a2.251 2.251 0 1 1-1.5 0V5.372A2.25 2.25 0 0 1 1.5 3.25Zm5.677-.177L9.573.677A.25.25 0 0 1 10 .854V2.5h1A2.5 2.5 0 0 1 13.5 5v5.628a2.251 2.251 0 1 1-1.5 0V5a1 1 0 0 0-1-1h-1v1.646a.25.25 0 0 1-.427.177L7.177 3.427a.25.25 0 0 1 0-.354ZM3.75 2.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm0 9.5a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5Zm8.25.75a.75.75 0 1 0 1.5 0 .75.75 0 0 0-1.5 0Z"/>
        </svg>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-size:14px;font-weight:600;color:var(--text)">${pr.title}</span>
            ${isDraft ? `<span style="font-size:11px;padding:2px 8px;border-radius:99px;font-weight:500;background:var(--bg-tertiary);color:var(--text-secondary);border:1px solid var(--border)">draft</span>` : ''}
          </div>
          <div style="font-size:12px;color:var(--text-tertiary);font-family:var(--font-mono)">
            #${pr.number} · ${pr.repoSlug} · opened ${timeAgo(pr.created_at)} · ${pr.comments} comment${pr.comments !== 1 ? 's' : ''}
          </div>
        </div>
      `;
      item.addEventListener('mouseenter', () => item.style.background = 'var(--bg-tertiary)');
      item.addEventListener('mouseleave', () => item.style.background = 'var(--bg-secondary)');
      grid.appendChild(item);
    });
  } catch (e) {
    console.warn('PRs load failed:', e);
    grid.innerHTML = '<p style="color:var(--text-tertiary);font-size:13px;padding:14px 16px">Could not load pull requests.</p>';
  }
}

// ─── Discussions ─────────────────────────────────────────────────────────────

async function loadDiscussions() {
  const grid = document.getElementById('discussions-grid');
  const countEl = document.getElementById('discussions-count');
  if (!grid) return;
  if (!GH_TOKEN) {
    grid.innerHTML = '<p style="color:var(--text-tertiary);font-size:13px;padding:14px 16px">GitHub token required to load discussions.</p>';
    return;
  }

  try {
    const aliases = REPOS.map(r => {
      const key = r.slug.replace(/-/g, '_');
      return `${key}: repository(owner: "${USER}", name: "${r.slug}") {
        discussions(first: 5, orderBy: {field: CREATED_AT, direction: DESC}) {
          nodes {
            number title url createdAt
            comments { totalCount }
            category { name }
            author { login }
          }
        }
      }`;
    }).join('\n');

    const data = await ghGraphQL(`{ ${aliases} }`);

    const all = REPOS.flatMap(r => {
      const key = r.slug.replace(/-/g, '_');
      const nodes = data?.data?.[key]?.discussions?.nodes || [];
      return nodes.map(d => ({ ...d, repoSlug: r.slug }));
    })
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 6);

    if (countEl) countEl.textContent = all.length;
    grid.innerHTML = '';

    if (!all.length) {
      grid.innerHTML = '<p style="color:var(--text-tertiary);font-size:13px;padding:14px 16px">No discussions found.</p>';
      return;
    }

    all.forEach(d => {
      const item = el('a', {
        href: d.url,
        target: '_blank',
        rel: 'noopener',
        class: 'issue-item fade-in',
        style: 'display:flex;align-items:flex-start;gap:12px;padding:14px 16px;border-bottom:1px solid var(--border);text-decoration:none;color:inherit;background:var(--bg-secondary);transition:background 0.12s',
      });
      const emoji = d.category?.emojiHTML || '💬';
      item.innerHTML = `
        <svg style="flex-shrink:0;margin-top:2px;color:var(--accent)" width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
          <path d="M1.75 1h8.5c.966 0 1.75.784 1.75 1.75v5.5A1.75 1.75 0 0 1 10.25 10H7.061l-2.574 2.561A1.75 1.75 0 0 1 1.5 11.25V1.75C1.5 1.784 1.75 1 1.75 1ZM1 1.75v9.5c0 .138.112.25.25.25.068 0 .135-.028.183-.076l2.75-2.673A.25.25 0 0 1 4.363 8.5H10.25a.25.25 0 0 0 .25-.25v-5.5a.25.25 0 0 0-.25-.25h-8.5a.25.25 0 0 0-.25.25Z"/>
        </svg>
        <div style="flex:1;min-width:0">
          <div style="display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:4px">
            <span style="font-size:14px;font-weight:600;color:var(--text)">${d.title}</span>
            <span style="font-size:11px;padding:2px 8px;border-radius:99px;font-weight:500;background:var(--accent-dim);color:var(--accent);border:1px solid var(--accent-border)">${d.category?.name || 'General'}</span>
          </div>
          <div style="font-size:12px;color:var(--text-tertiary);font-family:var(--font-mono)">
            #${d.number} · ${d.repoSlug} · opened ${timeAgo(d.createdAt)} · ${d.comments.totalCount} comment${d.comments.totalCount !== 1 ? 's' : ''}
          </div>
        </div>
      `;
      item.addEventListener('mouseenter', () => item.style.background = 'var(--bg-tertiary)');
      item.addEventListener('mouseleave', () => item.style.background = 'var(--bg-secondary)');
      grid.appendChild(item);
    });
  } catch (e) {
    console.warn('Discussions load failed:', e);
    grid.innerHTML = '<p style="color:var(--text-tertiary);font-size:13px;padding:14px 16px">Could not load discussions.</p>';
  }
}

// ─── Init ─────────────────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
  loadStats();
  loadVersions();
  loadContribGraph();
  loadCommits();
  loadPullRequests();
  loadIssues();
  loadDiscussions();
});