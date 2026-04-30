(function () {
  const term = document.getElementById('hero-terminal');
  const body = document.getElementById('term-body');
  const input = document.getElementById('term-input');
  const typedEl = document.getElementById('term-typed');
  if (!term || !body || !input) return;

  let history = [], histIdx = -1, locked = false;
  let installFlow = null;

  const COMMANDS = ['help', 'clear', 'whoami', 'ls', 'projects', 'github', 'docs', 'install',
    'neofetch', 'docker ps',
    'open traefik-manager', 'open traefik-manager-mobile', 'open traefik-stack',
    'open ntfy-adapter', 'open jellyfin-widget-proxy'];

  // ─── Output helpers ───────────────────────────────────────────────────────

  function print(text, cls = '') {
    const line = document.createElement('div');
    line.className = 'term-line' + (cls ? ' ' + cls : '');
    line.textContent = text;
    body.insertBefore(line, body.querySelector('.term-input-row'));
    scrollBottom();
  }

  function printHTML(html, cls = '') {
    const line = document.createElement('div');
    line.className = 'term-line' + (cls ? ' ' + cls : '');
    line.innerHTML = html;
    body.insertBefore(line, body.querySelector('.term-input-row'));
    scrollBottom();
  }

  function blank() { print(''); }

  function ok(text)   { print('  ✔  ' + text, 'term-success'); }
  function warn(text) { print('  ⚠  ' + text, 'term-warn'); }
  function info(text) { print('  ℹ  ' + text, 'term-dim'); }
  function step(text) { print('▸ ' + text, 'term-cyan term-bold'); }

  function scrollBottom() {
    body.scrollTop = body.scrollHeight;
  }

  function lock()   { locked = true;  input.disabled = true; }
  function unlock() { locked = false; input.disabled = false; input.focus(); }

  function delay(ms) { return new Promise(r => setTimeout(r, ms)); }


  // ─── Commands ─────────────────────────────────────────────────────────────

  const CMD = {

    help() {
      blank();
      printHTML('<span class="term-cyan term-bold">available commands</span>');
      [
        ['help',      'show this message'],
        ['whoami',    'about chr0nzz'],
        ['ls',        'list projects'],
        ['open [name]', 'scroll to a project card'],
        ['install',   'mock traefik-stack installer'],
        ['neofetch',  'system info'],
        ['docker ps', 'show running containers'],
        ['github',    'open github profile'],
        ['docs',      'open traefik manager docs'],
        ['clear',     'clear terminal'],
      ].forEach(([cmd, desc]) => {
        printHTML(`  <span class="term-accent">${cmd.padEnd(18)}</span><span class="term-dim">${desc}</span>`);
      });
      blank();
    },

    whoami() {
      blank();
      printHTML('<span class="term-cyan term-bold">chr0nzz</span>');
      info('self-hosted enthusiast. building open source tools for');
      info('homelab and docker setups. traefik, docker, linux.');
      blank();
      printHTML(`  <span class="term-dim">→ </span><span class="term-accent">github.com/chr0nzz</span>`);
      printHTML(`  <span class="term-dim">→ </span><span class="term-accent">xyzlab.dev</span>`);
      blank();
    },

    ls() {
      blank();
      const repos = [
        ['traefik-manager',       'web UI for managing traefik'],
        ['traefik-manager-mobile','react native companion app'],
        ['traefik-stack',         'traefik + TM one-command installer'],
        ['ntfy-adapter',          'ntfy → homepage widget bridge'],
        ['jellyfin-widget-proxy', 'jellyfin data proxy for dashboards'],
      ];
      repos.forEach(([name, desc]) => {
        printHTML(`  <span class="term-accent">${name.padEnd(28)}</span><span class="term-dim">${desc}</span>`);
      });
      blank();
      info('use "open <name>" to jump to a project card');
      blank();
    },

    open(arg) {
      if (!arg) { warn('usage: open <project-name>'); return; }
      const slugMap = {
        'traefik-manager': 'traefik-manager',
        'traefik-manager-mobile': 'traefik-manager-mobile',
        'traefik-stack': 'traefik-stack',
        'ntfy-adapter': 'ntfy-adapter',
        'jellyfin-widget-proxy': 'jellyfin-widget-proxy',
      };
      const slug = slugMap[arg.trim().toLowerCase()];
      if (!slug) { warn(`project "${arg}" not found. try "ls" to see all projects.`); return; }
      const card = [...document.querySelectorAll('.app-name')]
        .find(el => el.textContent.toLowerCase().replace(/\s+/g, '-') === slug ||
                    el.closest('.app-card')?.querySelector('[data-repo-stars="' + slug + '"]'));
      if (card) {
        ok(`opening ${slug}`);
        card.closest('.app-card')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        warn(`could not find card for "${slug}"`);
      }
    },

    github() {
      ok('opening github.com/chr0nzz');
      window.open('https://github.com/chr0nzz', '_blank');
    },

    docs() {
      ok('opening traefik-manager docs');
      window.open('https://traefik-manager.xyzlab.dev', '_blank');
    },

    clear() {
      const inputRow = body.querySelector('.term-input-row');
      body.innerHTML = '';
      body.appendChild(inputRow);
    },

    neofetch() {
      const updays = Math.floor(Math.random() * 300) + 30;
      blank();
      const logo = [
        '   ██╗  ██╗██╗   ██╗███████╗',
        '   ╚██╗██╔╝╚██╗ ██╔╝╚══███╔╝',
        '    ╚███╔╝  ╚████╔╝   ███╔╝ ',
        '    ██╔██╗   ╚██╔╝   ███╔╝  ',
        '   ██╔╝ ██╗   ██║   ███████╗',
        '   ╚═╝  ╚═╝   ╚═╝   ╚══════╝',
      ];
      const info = [
        ['', '<span class="term-accent term-bold">chr0nzz</span><span class="term-dim">@</span><span class="term-cyan term-bold">xyzlab.dev</span>'],
        ['', '<span class="term-dim">─────────────────────</span>'],
        ['OS', 'Debian GNU/Linux 12 (bookworm)'],
        ['Kernel', '6.1.0-21-amd64'],
        ['Shell', 'bash 5.2.15'],
        ['Uptime', `${updays} days, 4 hrs`],
        ['Docker', '27.3.1'],
        ['Packages', '312 (dpkg)'],
        ['Terminal', 'xyzlab.dev/terminal'],
        ['', ''],
        ['Projects', '<span class="term-accent">5</span> open source'],
        ['Stars', `<span class="term-accent">${document.querySelector('[data-stat="stars"]')?.textContent || '368'}★</span>`],
        ['', ''],
        ['', '<span style="display:inline-flex;gap:4px">' +
          ['#ef4444','#f59e0b','#22c55e','#60a5fa','#8b5cf6','#ec4899']
            .map(c => `<span style="background:${c};width:14px;height:14px;border-radius:2px;display:inline-block"></span>`)
            .join('') + '</span>'],
      ];
      const maxLogoLen = Math.max(...logo.map(l => l.length));
      logo.forEach((l, i) => {
        const right = info[i];
        let html = `<span class="term-cyan">${l}</span>`;
        if (right) {
          const pad = maxLogoLen - l.length + 2;
          const label = right[0] ? `<span class="term-accent">${right[0]}</span><span class="term-dim">: </span>` : '';
          html += ' '.repeat(pad) + label + `<span class="term-dim">${right[1]}</span>`;
        }
        printHTML(html);
      });
      for (let i = logo.length; i < info.length; i++) {
        const right = info[i];
        const indent = ' '.repeat(maxLogoLen + 2);
        const label = right[0] ? `<span class="term-accent">${right[0]}</span><span class="term-dim">: </span>` : '';
        printHTML(indent + label + `<span class="term-dim">${right[1]}</span>`);
      }
      blank();
    },

    'docker ps'() {
      blank();
      printHTML('<span class="term-dim">CONTAINER ID   IMAGE                                    STATUS          PORTS                    NAMES</span>');
      const containers = [
        ['a3f1d2e4b8c0', 'traefik:latest',                       'Up 47 days',  '0.0.0.0:80->80/tcp, 443->443/tcp', 'traefik'],
        ['b9e7c3a1f056', 'ghcr.io/chr0nzz/traefik-manager:beta', 'Up 47 days',  '0.0.0.0:5000->5000/tcp',           'traefik-manager'],
        ['c4d8f2b6e190', 'jellyfin/jellyfin:latest',             'Up 12 days',  '0.0.0.0:8096->8096/tcp',           'jellyfin'],
        ['d1a5e9c7b342', 'ntfy-adapter:latest',                  'Up 47 days',  '',                                 'ntfy-adapter'],
        ['e6b0f4d2a817', 'portainer/portainer-ce:latest',        'Up 47 days',  '0.0.0.0:9000->9000/tcp',           'portainer'],
        ['f2c9e1d5b603', 'tecnativa/docker-socket-proxy',        'Up 47 days',  '',                                 'socket-proxy'],
      ];
      containers.forEach(([id, image, status, ports, name]) => {
        printHTML(
          `<span class="term-dim">${id}</span>   ` +
          `<span class="term-cyan">${image.padEnd(40)}</span>` +
          `<span class="term-success">${status.padEnd(15)}</span>` +
          `<span class="term-dim">${(ports || '').padEnd(28)}</span>` +
          `<span class="term-accent">${name}</span>`
        );
      });
      blank();
    },

    async install() {
      blank();
      printHTML('<span class="term-cyan term-bold">  ████████╗██████╗   █████╗  ███████╗███████╗██╗██╗  ██╗</span>');
      printHTML('<span class="term-cyan term-bold">     ██╔══╝██╔══██╗ ██╔══██╗ ██╔════╝██╔════╝██║██║ ██╔╝</span>');
      printHTML('<span class="term-cyan term-bold">     ██║   ██████╔╝ ███████║ █████╗  █████╗  ██║█████╔╝ </span>');
      printHTML('<span class="term-cyan term-bold">     ██║   ██╔══██╗ ██╔══██║ ██╔══╝  ██╔══╝  ██║██╔═██╗ </span>');
      printHTML('<span class="term-cyan term-bold">     ██║   ██║  ██║ ██║  ██║ ███████╗██║     ██║██║  ██╗</span>');
      printHTML('<span class="term-cyan term-bold">     ╚═╝   ╚═╝  ╚═╝ ╚═╝  ╚═╝ ╚══════╝╚═╝     ╚═╝╚═╝  ╚═╝</span>');
      blank();
      info('Traefik Manager - Interactive Setup  (mock demo)');
      blank();
      startInstallFlow();
    },
  };

  // ─── Install flow ─────────────────────────────────────────────────────────

  const FLOW = {
    answers: {},

    steps: [
      {
        id: 'mode',
        fn() {
          step('What would you like to install?');
          print('    1)  Traefik + Traefik Manager (full stack)', 'term-dim');
          print('    2)  Traefik Manager only', 'term-dim');
          print('  Choice [1]: ', 'term-prompt-inline');
        },
        parse(val) {
          const v = val.trim() || '1';
          return v === '2' ? 'tm-only' : 'full';
        },
        next(val) { return val === 'tm-only' ? 'deploy-method' : 'install-dir'; },
      },
      {
        id: 'deploy-method',
        show(a) { return a.mode === 'tm-only'; },
        fn() {
          blank();
          step('Deployment method');
          print('    1)  Docker', 'term-dim');
          print('    2)  Linux service (systemd)', 'term-dim');
          print('  Choice [1]: ', 'term-prompt-inline');
        },
        parse(val) { return (val.trim() || '1') === '2' ? 'native' : 'docker'; },
        next() { return 'install-dir'; },
      },
      {
        id: 'install-dir',
        fn(a) {
          blank();
          step('General');
          info('Press Enter to accept defaults shown in brackets.');
          blank();
          const def = a.mode === 'full' ? '~/traefik-stack' : '~/traefik-manager';
          print(`  Install directory [${def}]: `, 'term-prompt-inline');
        },
        parse(val, a) {
          const def = a.mode === 'full' ? '~/traefik-stack' : '~/traefik-manager';
          return val.trim() || def;
        },
        next(_val, a) { return a.mode === 'full' ? 'deploy-type' : (a['deploy-method'] === 'native' ? 'port' : 'network'); },
      },
      {
        id: 'deploy-type',
        fn() {
          blank();
          info('Internal = LAN/VPN only.  External = internet-facing.');
          step('Where will this be accessed from?');
          print('    1)  External (internet-facing)', 'term-dim');
          print('    2)  Internal only (LAN / VPN / Tailscale)', 'term-dim');
          print('  Choice [1]: ', 'term-prompt-inline');
        },
        parse(val) { return (val.trim() || '1') === '2' ? 'internal' : 'external'; },
        next() { return 'domain'; },
      },
      {
        id: 'domain',
        fn() {
          blank();
          printHTML('  <span class="term-bold">-- Domain --</span>');
          print('  Your domain (e.g. example.com): ', 'term-prompt-inline');
        },
        parse(val) { return val.trim() || 'example.com'; },
        next() { return 'tls'; },
      },
      {
        id: 'tls',
        fn() {
          blank();
          printHTML('  <span class="term-bold">-- TLS / Certificates --</span>');
          step('Certificate method');
          print("    1)  Let's Encrypt - HTTP challenge", 'term-dim');
          print("    2)  Let's Encrypt - DNS challenge: Cloudflare", 'term-dim');
          print("    3)  Let's Encrypt - DNS challenge: Route 53 (AWS)", 'term-dim');
          print("    4)  Let's Encrypt - DNS challenge: DigitalOcean", 'term-dim');
          print("    5)  No TLS (HTTP only)", 'term-dim');
          print('  Choice [1]: ', 'term-prompt-inline');
        },
        parse(val) {
          const v = val.trim() || '1';
          const map = { '1': 'http', '2': 'cloudflare', '3': 'route53', '4': 'digitalocean', '5': 'none' };
          return map[v] || 'http';
        },
        next(val) { return val === 'none' ? 'config-layout' : 'acme-email'; },
      },
      {
        id: 'acme-email',
        show(a) { return a.tls !== 'none'; },
        fn() { print("  Email for Let's Encrypt: ", 'term-prompt-inline'); },
        parse(val) { return val.trim() || 'you@example.com'; },
        next() { return 'config-layout'; },
      },
      {
        id: 'config-layout',
        fn() {
          blank();
          printHTML('  <span class="term-bold">-- Dynamic Config --</span>');
          info('Single file is simpler. Directory is easier at scale.');
          step('Dynamic config layout');
          print('    1)  Single file (dynamic.yml)', 'term-dim');
          print('    2)  Directory - one .yml file per service', 'term-dim');
          print('  Choice [1]: ', 'term-prompt-inline');
        },
        parse(val) { return (val.trim() || '1') === '2' ? 'directory' : 'single'; },
        next() { return null; },
      },
      {
        id: 'network',
        show(a) { return a.mode === 'tm-only' && a['deploy-method'] === 'docker'; },
        fn() {
          blank();
          printHTML('  <span class="term-bold">-- Network --</span>');
          print('  Connect to existing Traefik Docker network? (y/n) [y]: ', 'term-prompt-inline');
        },
        parse(val) { return (val.trim().toLowerCase() || 'y').startsWith('y') ? 'yes' : 'no'; },
        next() { return 'config-layout'; },
      },
      {
        id: 'port',
        show(a) { return a.mode === 'tm-only' && a['deploy-method'] === 'native'; },
        fn() {
          blank();
          print('  Port [5000]: ', 'term-prompt-inline');
        },
        parse(val) { return val.trim() || '5000'; },
        next() { return 'config-layout'; },
      },
    ],
  };

  function getSteps(answers) {
    return FLOW.steps.filter(s => !s.show || s.show(answers));
  }

  function startInstallFlow() {
    FLOW.answers = {};
    const steps = getSteps({});
    installFlow = { steps, idx: 0 };
    runInstallStep();
  }

  function runInstallStep() {
    const { steps, idx } = installFlow;
    if (idx >= steps.length) {
      installFlow = null;
      runMockInstall();
      return;
    }
    const step = steps[idx];
    step.fn(FLOW.answers);
    scrollBottom();
    lock();
    input.disabled = false;
    input.focus();
  }

  function handleInstallInput(val) {
    const { steps, idx } = installFlow;
    const s = steps[idx];
    const parsed = s.parse(val, FLOW.answers);
    FLOW.answers[s.id] = parsed;
    installFlow.idx++;
    const newSteps = getSteps(FLOW.answers);
    installFlow.steps = newSteps;
    runInstallStep();
  }

  async function runMockInstall() {
    lock();
    const a = FLOW.answers;
    const domain = a.domain || 'example.com';
    const dir = a['install-dir'] || '~/traefik-stack';
    const full = a.mode === 'full';
    const native = a['deploy-method'] === 'native';

    blank();
    step('Checking Docker');
    await delay(400);
    ok('curl found');
    await delay(200);
    ok('Docker found and running');
    await delay(200);
    ok('docker compose (v2) found');

    if (full) {
      blank();
      step(`Creating directory structure at ${dir}`);
      await delay(500);
      ok('Directories and seed files created');
      await delay(200);
      ok('traefik/traefik.yml written');
      await delay(200);
      ok(`traefik/config/dynamic.yml created`);
      await delay(300);
      ok('docker-compose.yml written');
    } else if (!native) {
      blank();
      step(`Creating directory structure at ${dir}`);
      await delay(400);
      ok('Directories created');
      await delay(200);
      ok('docker-compose.yml written');
    } else {
      blank();
      step('Installing Traefik Manager');
      await delay(600);
      ok('Repository cloned');
      await delay(500);
      ok('Python dependencies installed');
      await delay(300);
      ok('Data directories created');
      await delay(400);
      ok('systemd unit written');
      await delay(300);
      ok('Service enabled and started');
    }

    if (!native) {
      blank();
      step('Pulling images');
      await delay(300);
      info('traefik:latest');
      await delay(800);
      info('ghcr.io/chr0nzz/traefik-manager:latest');
      await delay(1000);
      ok('Images pulled');
      blank();
      step('Starting services');
      await delay(600);
      ok('Services started');
    }

    blank();
    step('Waiting for Traefik Manager to generate temporary password');
    await delay(1200);
    ok('Temporary password retrieved');

    const tmpPass = Math.random().toString(36).slice(2, 10).toUpperCase();
    blank();
    printHTML('<span class="term-success term-bold">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>');
    printHTML('<span class="term-success term-bold">  Setup complete!</span>');
    printHTML('<span class="term-success term-bold">━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━</span>');
    blank();
    const scheme = a.tls !== 'none' ? 'https' : 'http';
    if (full) {
      printHTML(`  Traefik dashboard   <span class="term-cyan">${scheme}://traefik.${domain}</span>`);
      printHTML(`  Traefik Manager     <span class="term-cyan">${scheme}://manager.${domain}</span>`);
    } else {
      printHTML(`  Traefik Manager     <span class="term-cyan">${scheme}://${domain}:${a.port || '5000'}</span>`);
    }
    blank();
    printHTML(`  <span class="term-warn term-bold">Temporary password  ${tmpPass}</span>`);
    printHTML(`  <span class="term-dim">Install dir         ${dir}</span>`);
    blank();
    info('this was a demo - visit get-traefik.xyzlab.dev to run the real installer');
    blank();

    unlock();
  }

  // ─── Input handling ────────────────────────────────────────────────────────

  function submitLine(val) {
    const inputRow = body.querySelector('.term-input-row');
    const echo = document.createElement('div');
    echo.className = 'term-line';
    echo.innerHTML = `<span class="term-accent">$</span> ${val}`;
    body.insertBefore(echo, inputRow);
    typedEl.textContent = '';
    input.value = '';
    histIdx = -1;

    if (installFlow) {
      handleInstallInput(val);
      return;
    }

    const parts = val.trim().split(/\s+/);
    const cmd = parts[0]?.toLowerCase();
    const args = parts.slice(1).join(' ');

    if (!cmd) return;
    const full = val.trim().toLowerCase();
    if (CMD[full]) {
      CMD[full]();
    } else if (CMD[cmd]) {
      CMD[cmd](args);
    } else if (cmd === 'open') {
      CMD.open(args);
    } else {
      warn(`command not found: ${cmd}. type "help" for available commands.`);
    }
  }

  term.addEventListener('click', () => input.focus());

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      if (locked && !installFlow) return;
      const val = input.value;
      if (val.trim()) history.unshift(val);
      submitLine(val);
      e.preventDefault();
    } else if (e.key === 'ArrowUp') {
      if (history.length) {
        histIdx = Math.min(histIdx + 1, history.length - 1);
        input.value = history[histIdx];
        typedEl.textContent = history[histIdx];
      }
      e.preventDefault();
    } else if (e.key === 'ArrowDown') {
      histIdx = Math.max(histIdx - 1, -1);
      const val = histIdx >= 0 ? history[histIdx] : '';
      input.value = val;
      typedEl.textContent = val;
      e.preventDefault();
    } else if (e.key === 'Tab') {
      const partial = input.value;
      const matches = COMMANDS.filter(c => c.startsWith(partial.toLowerCase()));
      if (matches.length === 1) {
        input.value = matches[0];
        typedEl.textContent = matches[0];
      } else if (matches.length > 1) {
        blank();
        print(matches.join('   '), 'term-dim');
      }
      e.preventDefault();
    } else if (e.key === 'c' && e.ctrlKey) {
      if (installFlow) { installFlow = null; unlock(); blank(); }
      input.value = '';
      typedEl.textContent = '';
    }
  });

  input.addEventListener('input', () => {
    const val = input.value;
    typedEl.textContent = val;
    typedEl.style.direction = 'ltr';
    typedEl.style.unicodeBidi = 'plaintext';
  });

  // ─── Boot sequence then hand off ──────────────────────────────────────────

  async function boot() {
    lock();
    await delay(150);
    printHTML('<span class="term-cyan term-bold">  xyz<span style="color:var(--accent)">lab</span>.dev</span>');
    blank();
    await delay(300);

    const steps = [
      { text: 'connecting to cloudflare pages...', pause: 400 },
      { text: 'loading project index...', pause: 350 },
      { text: 'fetching github stats...', pause: 500 },
      { text: 'syncing release versions...', pause: 400 },
      { text: 'building commit feed...', pause: 350 },
    ];

    for (const s of steps) {
      const line = document.createElement('div');
      line.className = 'term-line term-dim';
      line.textContent = '  ' + s.text;
      body.insertBefore(line, body.querySelector('.term-input-row'));
      scrollBottom();
      await delay(s.pause);
      line.className = 'term-line term-success';
      line.textContent = '  ✔  ' + s.text.replace('...', '');
      scrollBottom();
    }

    blank();
    await delay(200);
    printHTML('  <span class="term-accent term-bold">ready</span>  <span class="term-dim">—  type "help" to explore or "install" to run setup</span>');
    blank();
    unlock();
  }

  boot();
})();
