/* ============================================================ */
/* THE WORDS WE USE — JARGON DECODER                              */
/* Main application logic                                         */
/* ============================================================ */

(function() {
  'use strict';

  // ==== STATE =================================================
  let DATA = null;
  let FW_DATA = null;
  let CONTENT = {};  // loaded from content.json
  let CURRENT_TAB = 'decode';
  let HEALTH_MODE = 'quick';
  let HEALTH_ANSWERS = {};
  let FW_SEARCH_QUERY = '';
  let FW_SUBTYPE_FILTER = '';
  let FW_OPEN_WORD = null;
  let OPEN_CLUSTER = null; // tracks which browse cluster is open

  // Cluster questions
  const CLUSTER_QUESTIONS = {
    Direction: 'Where are you going?',
    People: 'Who is going with you?',
    Resources: 'What do you have to work with?',
    Process: 'How will you get there?',
    Results: 'How will you know?'
  };

  // Health check component mapping
  const HEALTH_COMPONENTS = [
    {
      key: 'clarity',
      cluster: 'Direction',
      title: 'Clarity',
      question: 'Does the organization know where it is going and can it say so plainly?',
      deepText: 'Clarity is the Direction component. An organization with real clarity can state its direction in one sentence that everyone understands the same way. Ambiguity in direction shows up downstream as wasted effort, duplicated work, and polite disagreement about what the strategy actually means.'
    },
    {
      key: 'capability',
      cluster: 'People',
      title: 'Capability',
      question: 'Do the people have the skills, authority, and conditions to do what the direction requires?',
      deepText: 'Capability is the People component. Not headcount. Not talent on paper. The actual ability of the people inside the organization to do what the direction requires. Capability gaps are usually skill gaps, authority gaps, or condition gaps. All three matter.'
    },
    {
      key: 'resources',
      cluster: 'Resources',
      title: 'Resources',
      question: 'Have available resources been honestly matched to what matters most?',
      deepText: 'Resources is the Resources cluster component. Not the amount available but whether what is available has been honestly matched to what matters most. Abundant resources with scattered priorities produces less than modest resources with clear priorities.'
    },
    {
      key: 'efficiency',
      cluster: 'Process',
      title: 'Efficiency',
      question: 'Are processes producing consistent, accurate, quality output at the right pace?',
      deepText: 'Efficiency is the Process component. Not speed alone. Speed plus quality plus accuracy plus consistency, all four present at the same time. Efficiency without accuracy is fast failure. Efficiency without consistency is occasional success.'
    },
    {
      key: 'accountability',
      cluster: 'Results',
      title: 'Accountability',
      question: 'Are responsibilities assigned, consequences known in advance, and results visible?',
      deepText: 'Accountability is the Results component. Responsibility plus consequences times visibility. Accountability without consequences is responsibility with a better name. Accountability without visibility is private and therefore unreliable.'
    }
  ];

  // ==== INIT ==================================================
  async function init() {
    // Try window globals first — set by <script> tags, works from file:// URLs
    if (typeof window.JARGON_DATA !== 'undefined') {
      DATA = window.JARGON_DATA;
    }
    if (typeof window.FRAMEWORKS_DATA !== 'undefined') {
      FW_DATA = window.FRAMEWORKS_DATA;
    }

    // Fall back to fetch — works when served via HTTP/HTTPS
    try {
      if (!DATA) {
        const r = await fetch('jargon-data.json');
        DATA = await r.json();
      }
      if (!FW_DATA) {
        const r = await fetch('framework-standards-data.json');
        FW_DATA = await r.json();
      }
    } catch (err) {
      if (!DATA) {
        document.body.innerHTML = `
          <div style="padding:60px 40px;text-align:center;font-family:Georgia,serif;max-width:600px;margin:0 auto;">
            <h1 style="font-size:32px;margin-bottom:16px;">Data failed to load</h1>
            <p style="color:#555;font-size:16px;line-height:1.7;margin-bottom:24px;">
              If opening from a desktop folder, run <code style="background:#f5f5f5;padding:2px 6px;border-radius:3px;">python3 sync_data.py</code>
              first to generate the companion data files. Then open index.html again.
            </p>
            <p style="color:#888;font-size:14px;">
              If hosted on a server, ensure <code>jargon-data.json</code> and
              <code>framework-standards-data.json</code> are in the same folder as index.html.
            </p>
          </div>`;
        return;
      }
    }

    // Load content — window global first (file://), fetch fallback (server)
    try {
      let contentData = null;
      if (typeof window.SITE_CONTENT !== 'undefined') {
        contentData = window.SITE_CONTENT;
      } else {
        const r = await fetch('content.json');
        contentData = await r.json();
      }
      CONTENT = contentData;
      Object.entries(CONTENT).forEach(([key, value]) => {
        if (key.startsWith('_')) return;
        const el = document.getElementById('ct-' + key);
        if (el) el.textContent = value;
      });
    } catch (err) {
      // content failed — static HTML text remains as-is
    }

    setupTabs();
    setupDecode();
    setupEncode();
    setupBrowse();
    setupFrameworks();
    setupHealth();
    setupAbout();
    setupBottomSections();

    const hash = window.location.hash.replace('#', '');
    if (hash && document.getElementById('tab-' + hash)) {
      switchTab(hash);
    }
  }

  // ==== TAB NAVIGATION ========================================
  function setupTabs() {
    document.querySelectorAll('.nav-link, .footer-nav-link').forEach(link => {
      link.addEventListener('click', (e) => {
        e.preventDefault();
        switchTab(link.dataset.tab);
      });
    });

    // More dropdown
    const moreBtn = document.getElementById('nav-more-btn');
    const moreDropdown = document.getElementById('nav-more-dropdown');
    if (moreBtn && moreDropdown) {
      moreBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        moreDropdown.classList.toggle('open');
      });
      document.addEventListener('click', () => moreDropdown.classList.remove('open'));
      moreDropdown.querySelectorAll('.nav-more-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.preventDefault();
          moreDropdown.classList.remove('open');
          switchTab(item.dataset.tab);
        });
      });
    }

    const brandBtn = document.getElementById('brand-mark-btn');
    if (brandBtn) {
      brandBtn.addEventListener('click', () => {
        document.getElementById('decode-search').value = '';
        document.getElementById('decode-result').innerHTML = '';
        document.getElementById('search-dropdown').classList.remove('active');
        switchTab('decode');
      });
    }
  }

  function switchTab(tab) {
    CURRENT_TAB = tab;
    document.querySelectorAll('.nav-link').forEach(l => l.classList.toggle('active', l.dataset.tab === tab));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.toggle('active', p.id === 'tab-' + tab));
    const hero = document.getElementById('hero');
    if (hero) hero.style.display = tab === 'decode' ? 'block' : 'none';
    // Highlight More button if a collapsed tab is active
    const moreBtn = document.getElementById('nav-more-btn');
    const collapsedTabs = ['frameworks', 'about'];
    if (moreBtn) moreBtn.classList.toggle('active', collapsedTabs.includes(tab));
    window.scrollTo({ top: 0, behavior: 'smooth' });
    history.replaceState(null, null, '#' + tab);
  }

  // ==== DECODE TAB ============================================
  function setupDecode() {
    populateSelect('filter-cluster', DATA.metadata.clusters.map(c => ({ value: c, label: c })));
    populateSelect('filter-type', DATA.metadata.formula_types.map(t => ({ value: t.type, label: t.type })));

    const input = document.getElementById('decode-search');
    const dropdown = document.getElementById('search-dropdown');

    input.addEventListener('input', () => handleDecodeSearch(input.value));
    input.addEventListener('focus', () => {
      if (input.value.trim()) handleDecodeSearch(input.value);
    });
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.search-wrap')) dropdown.classList.remove('active');
    });

    ['filter-cluster', 'filter-type', 'filter-status'].forEach(id => {
      document.getElementById(id).addEventListener('change', () => {
        if (input.value.trim()) handleDecodeSearch(input.value);
      });
    });

    // Filters toggle
    const toggleBtn = document.getElementById('filters-toggle');
    const filtersEl = document.getElementById('decode-filters');
    if (toggleBtn && filtersEl) {
      toggleBtn.addEventListener('click', () => {
        const isOpen = !filtersEl.hidden;
        filtersEl.hidden = isOpen;
        toggleBtn.setAttribute('aria-expanded', !isOpen);
        toggleBtn.classList.toggle('active', !isOpen);
        toggleBtn.querySelector('.filters-toggle-icon').textContent = isOpen ? '▾' : '▴';
      });
    }

    renderQuickpick();
  }

  function handleDecodeSearch(query) {
    const dropdown = document.getElementById('search-dropdown');
    const q = query.trim().toLowerCase();
    if (!q) { dropdown.classList.remove('active'); return; }

    const cf = document.getElementById('filter-cluster').value;
    const tf = document.getElementById('filter-type').value;
    const sf = document.getElementById('filter-status').value;

    let matches = DATA.entries.filter(e => {
      const wl = e.word.toLowerCase();
      const matchesQ = wl.includes(q) || wl.startsWith(q);
      const matchesC = !cf || e.cluster === cf;
      const matchesT = !tf || e.formula_type === tf;
      let matchesS = true;
      if (sf === 'metaphor') matchesS = !!e.is_metaphor;
      else if (sf) matchesS = e.status === sf;
      return matchesQ && matchesC && matchesT && matchesS;
    });

    matches.sort((a, b) => {
      const al = a.word.toLowerCase(), bl = b.word.toLowerCase();
      if (al.startsWith(q) && !bl.startsWith(q)) return -1;
      if (!al.startsWith(q) && bl.startsWith(q)) return 1;
      return al.localeCompare(bl);
    });

    matches = matches.slice(0, 8);

    if (matches.length === 0) {
      dropdown.innerHTML = '<div class="search-dropdown-empty">No match. Try a different word.</div>';
    } else {
      dropdown.innerHTML = matches.map(m => {
        const isRedirect = m.status === 'alternative' && m.primary;
        const metaRight = isRedirect
          ? `<span>${m.cluster}</span><span>·</span><span>→ ${escapeHtml(m.primary)}</span>`
          : `<span>${m.cluster}</span><span>·</span><span>${m.formula_type || 'Alternative'}</span>`;
        const metaphorDot = m.is_metaphor ? '<span class="dropdown-metaphor-dot" title="Metaphor"></span>' : '';
        return `
          <div class="search-dropdown-item" data-word="${escapeAttr(m.word)}">
            <span class="search-dropdown-word">${escapeHtml(m.word)}${metaphorDot}</span>
            <span class="search-dropdown-meta">${metaRight}</span>
          </div>`;
      }).join('');
      dropdown.querySelectorAll('.search-dropdown-item').forEach(el => {
        el.addEventListener('click', () => {
          selectDecodeWord(el.dataset.word);
          dropdown.classList.remove('active');
        });
      });
    }
    dropdown.classList.add('active');
  }

  function selectDecodeWord(word) {
    const entry = DATA.entries.find(e => e.word === word);
    if (!entry) return;
    document.getElementById('decode-search').value = entry.word;
    const isRedirect = entry.status === 'alternative' && entry.primary;
    if (isRedirect) {
      renderAlternativeResult(entry);
    } else {
      renderDecodeResult(entry);
    }
    renderQuickpick(entry.word);
    scrollToEl(document.getElementById('decode-result'));
  }

  function renderDecodeResult(entry) {
    const statusLabel = {
      core: 'Core entry',
      extended: 'Extended term',
      alternative: 'Alternative word'
    }[entry.status] || entry.status;

    const metaphorTag = entry.is_metaphor
      ? `<span class="tag tag-metaphor">Metaphor</span>`
      : '';

    const formulaBlock = entry.formula_type ? `
      <div class="formula-display">
        <div class="formula-notation">Formula type: ${entry.formula_type}</div>
        <div class="formula-expression">${escapeHtml(entry.formula)}</div>
      </div>` : '';

    const componentsBlock = entry.components && entry.components.length > 0 ? `
      <div class="result-section">
        <div class="section-label">Components</div>
        <div class="components-list">
          ${entry.components.map(c => `<span class="component-chip">${escapeHtml(c)}</span>`).join('')}
        </div>
      </div>` : '';

    const alternativesBlock = entry.alternatives && entry.alternatives.length > 0 ? `
      <div class="result-section">
        <div class="section-label">Plain-language alternatives</div>
        <div class="alternatives-list">
          ${entry.alternatives.map(a => `<div class="alternative-item">"${escapeHtml(a)}"</div>`).join('')}
        </div>
      </div>` : '';

    const html = `
      <div class="result-card">
        <div class="result-header">
          <div class="result-word-block">
            <div class="result-word">${escapeHtml(entry.word)}</div>
            <div class="result-tags">
              <span class="tag tag-cluster">${entry.cluster}</span>
              ${entry.formula_type ? `<span class="tag tag-type">${entry.formula_type}</span>` : ''}
              <span class="tag tag-status-${entry.status}">${statusLabel}</span>
              ${metaphorTag}
            </div>
          </div>
        </div>

        ${formulaBlock}
        ${componentsBlock}

        <div class="result-section">
          <div class="section-label">Official definition</div>
          <div class="section-content">${escapeHtml(entry.definition)}</div>
        </div>

        <div class="result-section">
          <div class="section-label">What it really means</div>
          <div class="section-content">${escapeHtml(entry.what_it_really_means)}</div>
        </div>

        <div class="result-section">
          <div class="section-label">Why the formula is shaped this way</div>
          <div class="section-content">${escapeHtml(entry.why)}</div>
        </div>

        ${alternativesBlock}
      </div>`;

    document.getElementById('decode-result').innerHTML = html;
  }

  function renderAlternativeResult(entry) {
    const metaphorTag = entry.is_metaphor
      ? `<span class="tag tag-metaphor">Metaphor</span>`
      : '';

    const html = `
      <div class="result-card result-card-alt">
        <div class="result-header">
          <div class="result-word-block">
            <div class="result-word">${escapeHtml(entry.word)}</div>
            <div class="result-tags">
              <span class="tag tag-cluster">${entry.cluster}</span>
              <span class="tag tag-status-alternative">Alternative</span>
              ${metaphorTag}
            </div>
          </div>
        </div>

        <div class="alt-redirect-block">
          <div class="alt-redirect-label">This word points to</div>
          <button class="alt-redirect-target" data-word="${escapeAttr(entry.primary)}">
            ${escapeHtml(entry.primary)} →
          </button>
        </div>

        <div class="result-section">
          <div class="section-label">Definition</div>
          <div class="section-content">${escapeHtml(entry.definition)}</div>
        </div>

        <div class="result-section">
          <div class="section-label">What it really means</div>
          <div class="section-content">${escapeHtml(entry.what_it_really_means)}</div>
        </div>

        <div class="result-section">
          <div class="section-label">Why it points there</div>
          <div class="section-content">${escapeHtml(entry.why)}</div>
        </div>
      </div>`;

    document.getElementById('decode-result').innerHTML = html;

    document.querySelector('.alt-redirect-target')?.addEventListener('click', function() {
      selectDecodeWord(this.dataset.word);
    });
  }

  function renderQuickpick(excludeWord) {
    // Pool: core entries only — gives the best variety
    const pool = DATA.entries.filter(e => e.status === 'core' && e.word !== excludeWord);
    // Fisher-Yates shuffle, take 8
    const shuffled = pool.slice();
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    const picks = shuffled.slice(0, 12).map(e => e.word);
    const container = document.getElementById('quickpick-tags');
    container.innerHTML = picks.map(w =>
      `<button class="quickpick-tag" data-word="${escapeAttr(w)}">${escapeHtml(w)}</button>`
    ).join('');
    container.querySelectorAll('.quickpick-tag').forEach(btn => {
      btn.addEventListener('click', () => selectDecodeWord(btn.dataset.word));
    });
  }

  // ==== ENCODE TAB ============================================
  // ==== ENCODE DATA ===========================================
  const ENCODE_SCENARIOS = [
    {
      label: 'My team isn\'t aligned',
      cluster: 'Direction',
      components: ['shared direction', 'consistent communication', 'agreed priorities']
    },
    {
      label: 'We\'re moving too slowly',
      cluster: 'Process',
      components: ['decision speed', 'removal of blockers', 'clear ownership']
    },
    {
      label: 'Results aren\'t sticking',
      cluster: 'Results',
      components: ['accountability', 'visible consequences', 'consistent follow-through']
    },
    {
      label: 'People aren\'t engaged',
      cluster: 'People',
      components: ['meaningful work', 'recognition', 'psychological safety']
    },
    {
      label: 'We don\'t have enough resources',
      cluster: 'Resources',
      components: ['budget constraints', 'competing priorities', 'capacity gaps']
    },
    {
      label: 'We keep repeating mistakes',
      cluster: 'Process',
      components: ['root cause analysis', 'lessons learned', 'corrective action']
    },
    {
      label: 'Strategy isn\'t translating to action',
      cluster: 'Direction',
      components: ['clear goals', 'ownership', 'measurable milestones']
    },
    {
      label: 'Culture feels broken',
      cluster: 'People',
      components: ['trust', 'shared values', 'behavioural consistency']
    },
    {
      label: 'We\'re losing good people',
      cluster: 'People',
      components: ['career growth', 'competitive compensation', 'sense of belonging']
    },
    {
      label: 'Our meetings are a waste of time',
      cluster: 'Process',
      components: ['clear agenda', 'right people in the room', 'decisions that stick']
    },
    {
      label: 'We\'re spending money in the wrong places',
      cluster: 'Resources',
      components: ['resource allocation', 'return on investment', 'strategic priorities']
    },
    {
      label: 'No one knows what success looks like',
      cluster: 'Results',
      components: ['defined targets', 'shared metrics', 'progress visibility']
    }
  ];

  const WORD_BANK = {
    Direction: [
      'clear vision', 'shared goals', 'strategic alignment', 'long-term thinking',
      'prioritisation', 'decision-making clarity', 'change readiness', 'innovation culture',
      'risk appetite', 'competitive positioning', 'market awareness', 'purpose',
      'transformation agenda', 'north star', 'strategic intent', 'roadmap',
      'scenario planning', 'stakeholder alignment', 'mission clarity', 'growth strategy'
    ],
    People: [
      'trust', 'psychological safety', 'collaboration', 'clear ownership',
      'capability building', 'recognition', 'engagement', 'feedback culture',
      'diverse perspectives', 'leadership clarity', 'team cohesion', 'accountability',
      'talent development', 'succession planning', 'coaching', 'communication',
      'inclusion', 'empowerment', 'morale', 'conflict resolution'
    ],
    Resources: [
      'budget', 'headcount', 'technology', 'time',
      'capital allocation', 'data access', 'tools and systems', 'cash flow',
      'intellectual property', 'vendor relationships', 'infrastructure', 'capacity',
      'return on investment', 'cost reduction', 'procurement', 'supply chain',
      'financial planning', 'asset management', 'funding', 'operational efficiency'
    ],
    Process: [
      'clear steps', 'consistent execution', 'quality control', 'speed',
      'root cause analysis', 'automation', 'documentation', 'decision speed',
      'cross-functional coordination', 'continuous improvement', 'risk management', 'agile delivery',
      'governance', 'change management', 'workflow', 'compliance',
      'project management', 'escalation path', 'standardisation', 'testing'
    ],
    Results: [
      'measurable outcomes', 'accountability', 'tracking mechanisms', 'customer satisfaction',
      'revenue growth', 'efficiency gains', 'data-driven decisions', 'performance metrics',
      'forecast accuracy', 'return on investment', 'retention', 'conversion rate',
      'net promoter score', 'market share', 'profit margin', 'employee satisfaction',
      'delivery on time', 'quality scores', 'cost savings', 'growth rate'
    ]
  };

  let WORD_BANK_ACTIVE_CLUSTER = 'Direction';

  function setupEncode() {
    populateSelect('encode-type', DATA.metadata.formula_types.map(t => ({ value: t.type, label: t.type + ' (' + t.notation + ')' })));
    populateSelect('encode-cluster', DATA.metadata.clusters.map(c => ({ value: c, label: c + ' — ' + CLUSTER_QUESTIONS[c] })));

    document.getElementById('encode-btn').addEventListener('click', runEncode);
    document.getElementById('encode-clear').addEventListener('click', clearEncode);

    ['comp-1', 'comp-2', 'comp-3'].forEach(id => {
      document.getElementById(id).addEventListener('keypress', (e) => {
        if (e.key === 'Enter') runEncode();
      });
    });

    renderScenarios();
    renderWordBank();
  }

  function renderScenarios() {
    const list = document.getElementById('encode-scenarios-list');
    if (!list) return;
    list.innerHTML = ENCODE_SCENARIOS.map(s => `
      <button class="scenario-btn" data-label="${escapeAttr(s.label)}"
              data-c1="${escapeAttr(s.components[0])}"
              data-c2="${escapeAttr(s.components[1])}"
              data-c3="${escapeAttr(s.components[2])}"
              data-cluster="${escapeAttr(s.cluster)}">
        <span class="scenario-btn-label">${escapeHtml(s.label)}</span>
        <span class="scenario-btn-cluster">${escapeHtml(s.cluster)}</span>
      </button>`).join('');

    list.querySelectorAll('.scenario-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.getElementById('comp-1').value = btn.dataset.c1;
        document.getElementById('comp-2').value = btn.dataset.c2;
        document.getElementById('comp-3').value = btn.dataset.c3;
        document.getElementById('encode-cluster').value = btn.dataset.cluster;
        // Highlight selected scenario
        list.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        runEncode();
        scrollToEl(document.getElementById('encode-result'));
      });
    });
  }

  function renderWordBank() {
    const tabsEl = document.getElementById('word-bank-tabs');
    const wordsEl = document.getElementById('word-bank-words');
    if (!tabsEl || !wordsEl) return;

    // Cluster tabs
    tabsEl.innerHTML = Object.keys(WORD_BANK).map(cluster => `
      <button class="word-bank-tab ${cluster === WORD_BANK_ACTIVE_CLUSTER ? 'active' : ''}"
              data-cluster="${escapeAttr(cluster)}">${escapeHtml(cluster)}</button>`).join('');

    tabsEl.querySelectorAll('.word-bank-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        WORD_BANK_ACTIVE_CLUSTER = tab.dataset.cluster;
        renderWordBank();
      });
    });

    // Words for active cluster
    const words = WORD_BANK[WORD_BANK_ACTIVE_CLUSTER] || [];
    wordsEl.innerHTML = words.map(w => `
      <button class="word-bank-word" data-word="${escapeAttr(w)}">${escapeHtml(w)}</button>`
    ).join('');

    wordsEl.querySelectorAll('.word-bank-word').forEach(btn => {
      btn.addEventListener('click', () => {
        // Fill next empty component field
        const fields = ['comp-1', 'comp-2', 'comp-3'];
        const target = fields.find(id => !document.getElementById(id).value.trim());
        if (target) {
          document.getElementById(target).value = btn.dataset.word;
          btn.classList.add('used');
          setTimeout(() => btn.classList.remove('used'), 600);
        } else {
          // All full — flash all fields to signal
          fields.forEach(id => {
            const el = document.getElementById(id);
            el.classList.add('flash');
            setTimeout(() => el.classList.remove('flash'), 500);
          });
        }
      });
    });
  }

  function clearEncode() {
    ['comp-1','comp-2','comp-3'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('encode-type').value = '';
    document.getElementById('encode-cluster').value = '';
    document.getElementById('encode-result').innerHTML = '';
    // Clear active scenario highlight
    document.querySelectorAll('.scenario-btn').forEach(b => b.classList.remove('active'));
  }

  function runEncode() {
    const c1 = document.getElementById('comp-1').value.trim().toLowerCase();
    const c2 = document.getElementById('comp-2').value.trim().toLowerCase();
    const c3 = document.getElementById('comp-3').value.trim().toLowerCase();
    const tf = document.getElementById('encode-type').value;
    const cf = document.getElementById('encode-cluster').value;

    const userComponents = [c1, c2, c3].filter(Boolean);

    if (userComponents.length === 0 && !tf && !cf) {
      document.getElementById('encode-result').innerHTML =
        '<div class="encode-empty">Enter at least one component or pick a formula type or cluster to find matches.</div>';
      return;
    }

    // Only encode against entries that have real formulas (not redirect alternatives)
    let pool = DATA.entries.filter(e => {
      if (!e.formula_type) return false;
      if (tf && e.formula_type !== tf) return false;
      if (cf && e.cluster !== cf) return false;
      return true;
    });

    const scored = pool.map(entry => {
      let score = 0;
      const matchDetails = [];
      const entryText = (
        entry.components.join(' ') + ' ' +
        entry.formula + ' ' +
        entry.definition + ' ' +
        entry.what_it_really_means
      ).toLowerCase();

      userComponents.forEach(uc => {
        entry.components.forEach(ec => {
          const ecl = ec.toLowerCase();
          if (ecl === uc) { score += 10; matchDetails.push({ user: uc, matched: ec, type: 'exact' }); return; }
          if (ecl.includes(uc) || uc.includes(ecl)) { score += 6; matchDetails.push({ user: uc, matched: ec, type: 'substring' }); return; }
          const ucWords = uc.split(/\s+/).filter(w => w.length > 2);
          const ecWords = ecl.split(/\s+/).filter(w => w.length > 2);
          const shared = ucWords.filter(w => ecWords.some(ew => ew.includes(w) || w.includes(ew)));
          if (shared.length > 0) {
            score += 3 * shared.length;
            matchDetails.push({ user: uc, matched: ec, type: 'partial', words: shared });
          }
        });
        uc.split(/\s+/).filter(w => w.length > 2).forEach(w => {
          if (entryText.includes(w)) score += 1;
        });
      });

      if (tf && entry.formula_type === tf) score += 2;
      if (cf && entry.cluster === cf) score += 2;

      return { entry, score, matchDetails };
    });

    let results = scored.filter(s => s.score > 0);
    if (results.length === 0 && (tf || cf) && userComponents.length === 0) {
      results = pool.slice(0, 12).map(e => ({ entry: e, score: 1, matchDetails: [] }));
    }
    results.sort((a, b) => b.score - a.score);

    const top = results.slice(0, 3);

    if (top.length === 0) {
      document.getElementById('encode-result').innerHTML =
        '<div class="encode-empty">No strong matches found. Try different component words, or broaden the filters above.</div>';
      return;
    }

    renderEncodeResults(top, userComponents);
  }

  function renderEncodeResults(results, userComponents) {
    const maxScore = results[0].score;
    const html = `
      <h4 style="font-family:Georgia,serif;font-size:20px;margin-bottom:16px;">
        Top ${results.length} match${results.length > 1 ? 'es' : ''}
      </h4>
      <div class="match-list">
        ${results.map((r, i) => {
          const pct = Math.round((r.score / maxScore) * 100);
          const matchedWords = [...new Set(r.matchDetails.map(d => d.matched))];
          return `
            <div class="match-card" data-word="${escapeAttr(r.entry.word)}">
              <div class="match-rank">${i + 1}</div>
              <div class="match-word">${escapeHtml(r.entry.word)}</div>
              <div class="match-tags">
                <span class="tag tag-cluster">${r.entry.cluster}</span>
                <span class="tag tag-type">${r.entry.formula_type}</span>
                ${r.entry.is_metaphor ? '<span class="tag tag-metaphor">Metaphor</span>' : ''}
              </div>
              <div class="match-formula">${escapeHtml(r.entry.formula)}</div>
              <div class="match-score">
                <strong>${pct}% component alignment</strong>
                ${matchedWords.length > 0 ? ' — matched on: ' + matchedWords.map(w => '<span class="match-highlight">' + escapeHtml(w) + '</span>').join(', ') : ''}
              </div>
            </div>`;
        }).join('')}
      </div>
      <p style="margin-top:24px;color:#888;font-size:14px;font-style:italic;">
        Click any match to see the full entry, or use the Decode tab to explore the word in depth.
      </p>`;

    document.getElementById('encode-result').innerHTML = html;

    document.querySelectorAll('.match-card').forEach(card => {
      card.addEventListener('click', () => {
        switchTab('decode');
        setTimeout(() => selectDecodeWord(card.dataset.word), 100);
      });
    });
  }

  // ==== BROWSE TAB ============================================
  function setupBrowse() {
    renderBrowse();
    document.getElementById('browse-search').addEventListener('input', renderBrowse);
    document.getElementById('browse-status').addEventListener('change', renderBrowse);
  }

  function renderBrowse() {
    const q = document.getElementById('browse-search').value.trim().toLowerCase();
    const sf = document.getElementById('browse-status').value;
    const grid = document.getElementById('browse-grid');

    // When searching or filtering, open all matching clusters automatically
    const isFiltering = q || sf;

    let html = '';
    let totalVisible = 0;

    DATA.metadata.clusters.forEach((cluster, idx) => {
      let entries = DATA.entries.filter(e => e.cluster === cluster);

      if (sf === 'metaphor') {
        entries = entries.filter(e => e.is_metaphor);
      } else if (sf) {
        entries = entries.filter(e => e.status === sf);
      }

      if (q) entries = entries.filter(e => e.word.toLowerCase().includes(q));
      if (entries.length === 0) return;

      totalVisible++;

      entries.sort((a, b) => {
        const order = { core: 0, extended: 1, alternative: 2 };
        if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
        return a.word.localeCompare(b.word);
      });

      const isOpen = isFiltering || OPEN_CLUSTER === cluster;

      html += `
        <div class="cluster-accordion ${isOpen ? 'open' : ''}" data-cluster="${escapeAttr(cluster)}">
          <button class="cluster-accordion-header" data-cluster="${escapeAttr(cluster)}">
            <div class="cluster-header-left">
              <span class="cluster-num">Part ${idx + 1}</span>
              <span class="cluster-name">${cluster}</span>
              <span class="cluster-question">${CLUSTER_QUESTIONS[cluster]}</span>
            </div>
            <div class="cluster-header-right">
              <span class="cluster-count">${entries.length} word${entries.length !== 1 ? 's' : ''}</span>
              <span class="cluster-chevron">${isOpen ? '▲' : '▼'}</span>
            </div>
          </button>
          <div class="cluster-accordion-body">
            <div class="cluster-words">
              ${entries.map(e => {
                const isRedirect = e.status === 'alternative' && e.primary;
                const typeLabel = isRedirect
                  ? `→ ${escapeHtml(e.primary)}`
                  : (e.formula_type || 'Alternative');
                const metaphorDot = e.is_metaphor
                  ? `<span class="word-card-status-dot dot-metaphor" title="Metaphor"></span>`
                  : '';
                return `
                  <button class="word-card" data-word="${escapeAttr(e.word)}">
                    <div class="word-card-title">
                      <span class="word-card-status-dot dot-${e.status}"></span>
                      ${metaphorDot}
                      ${escapeHtml(e.word)}
                    </div>
                    <div class="word-card-type">${typeLabel}</div>
                  </button>`;
              }).join('')}
            </div>
          </div>
        </div>`;
    });

    if (!html) html = '<div class="encode-empty">No words match your filter.</div>';
    grid.innerHTML = html;

    // Accordion click handlers
    grid.querySelectorAll('.cluster-accordion-header').forEach(header => {
      header.addEventListener('click', () => {
        const cluster = header.dataset.cluster;
        OPEN_CLUSTER = OPEN_CLUSTER === cluster ? null : cluster;
        renderBrowse();
      });
    });

    // Word card click handlers
    grid.querySelectorAll('.word-card').forEach(card => {
      card.addEventListener('click', () => {
        switchTab('decode');
        setTimeout(() => selectDecodeWord(card.dataset.word), 100);
      });
    });
  }

  // ==== FRAMEWORKS & STANDARDS TAB ============================
  function setupFrameworks() {
    if (!FW_DATA) return;

    // Search input
    const input = document.getElementById('fw-search');
    if (input) {
      input.addEventListener('input', () => {
        FW_SEARCH_QUERY = input.value.trim().toLowerCase();
        renderFrameworksList();
      });
    }

    // Sub-type filter tabs
    document.querySelectorAll('.fw-filter-tab').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.fw-filter-tab').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        FW_SUBTYPE_FILTER = btn.dataset.subtype;
        FW_OPEN_WORD = null;
        renderFrameworksList();
      });
    });

    renderFrameworksList();
  }

  function renderFrameworksList() {
    if (!FW_DATA) return;
    let entries = [...FW_DATA.entries];

    if (FW_SUBTYPE_FILTER) {
      entries = entries.filter(e => e.subtype === FW_SUBTYPE_FILTER);
    }

    if (FW_SEARCH_QUERY) {
      entries = entries.filter(e =>
        e.word.toLowerCase().includes(FW_SEARCH_QUERY) ||
        (e.acronym && e.acronym.toLowerCase().includes(FW_SEARCH_QUERY)) ||
        e.definition.toLowerCase().includes(FW_SEARCH_QUERY)
      );
      // When searching, open the first match automatically
      if (entries.length > 0 && !FW_OPEN_WORD) {
        FW_OPEN_WORD = entries[0].word;
      }
    }

    entries.sort((a, b) => a.word.localeCompare(b.word));

    const grid = document.getElementById('fw-grid');
    if (!grid) return;

    if (entries.length === 0) {
      grid.innerHTML = '<div class="encode-empty">No frameworks match your search.</div>';
      return;
    }

    grid.innerHTML = entries.map(e => {
      const isOpen = FW_OPEN_WORD === e.word;

      const componentsBlock = e.components && e.components.length > 0 ? `
        <div class="result-section">
          <div class="section-label">Components</div>
          <div class="components-list">
            ${e.components.map(c => `<span class="component-chip">${escapeHtml(c)}</span>`).join('')}
          </div>
        </div>` : '';

      const relatedBlock = e.related && e.related.length > 0 ? `
        <div class="result-section">
          <div class="section-label">Related in the decoder</div>
          <div class="fw-related-list">
            ${e.related.map(r => {
              const exists = DATA && DATA.entries.some(d => d.word === r);
              return exists
                ? `<button class="fw-related-link" data-word="${escapeAttr(r)}">${escapeHtml(r)}</button>`
                : `<span class="fw-related-plain">${escapeHtml(r)}</span>`;
            }).join('')}
          </div>
        </div>` : '';

      return `
        <div class="fw-card-wrap ${isOpen ? 'open' : ''}" data-word="${escapeAttr(e.word)}">
          <button class="fw-card fw-card-trigger" data-word="${escapeAttr(e.word)}">
            <div class="fw-card-top">
              <div>
                <div class="fw-card-word">${escapeHtml(e.word)}</div>
                ${e.acronym ? `<div class="fw-card-acronym">${escapeHtml(e.acronym)}</div>` : ''}
              </div>
              <div class="fw-card-right">
                <span class="fw-card-subtype">${escapeHtml(e.subtype)}</span>
                <span class="fw-card-chevron">${isOpen ? '▲' : '▼'}</span>
              </div>
            </div>
          </button>
          <div class="fw-card-detail">
            <div class="fw-card-detail-inner">
              ${e.origin ? `
              <div class="fw-origin-block">
                <span class="fw-origin-label">Origin</span>
                <span class="fw-origin-text">${escapeHtml(e.origin)}</span>
              </div>` : ''}
              <div class="result-section">
                <div class="section-label">Definition</div>
                <div class="section-content">${escapeHtml(e.definition)}</div>
              </div>
              ${componentsBlock}
              <div class="result-section">
                <div class="section-label">Used for</div>
                <div class="section-content">${escapeHtml(e.used_for)}</div>
              </div>
              ${relatedBlock}
            </div>
          </div>
        </div>`;
    }).join('');

    // Card click — toggle open
    grid.querySelectorAll('.fw-card-trigger').forEach(btn => {
      btn.addEventListener('click', () => {
        const word = btn.dataset.word;
        FW_OPEN_WORD = FW_OPEN_WORD === word ? null : word;
        renderFrameworksList();
        if (FW_OPEN_WORD) {
          setTimeout(() => {
            const openCard = grid.querySelector(`.fw-card-wrap.open`);
            if (openCard) scrollToEl(openCard);
          }, 50);
        }
      });
    });

    // Related links — jump to jargon decoder
    grid.querySelectorAll('.fw-related-link').forEach(btn => {
      btn.addEventListener('click', () => {
        switchTab('decode');
        setTimeout(() => selectDecodeWord(btn.dataset.word), 100);
      });
    });
  }

  // ==== HEALTH CHECK TAB ======================================
  function setupHealth() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.mode-btn').forEach(b => b.classList.toggle('active', b === btn));
        HEALTH_MODE = btn.dataset.mode;
        document.querySelectorAll('.health-panel').forEach(p => p.classList.remove('active'));
        document.getElementById('health-' + HEALTH_MODE).classList.add('active');
        HEALTH_ANSWERS = {};
        renderHealth();
        document.getElementById('health-result').innerHTML = '';
      });
    });
    renderHealth();
  }

  function renderHealth() {
    const isDeep = HEALTH_MODE === 'deep';
    let html = '';

    HEALTH_COMPONENTS.forEach((comp, i) => {
      const answered = HEALTH_ANSWERS[comp.key] !== undefined;
      html += `
        <div class="health-question ${answered ? 'answered' : ''}" data-key="${comp.key}">
          <div class="health-question-header">
            <span class="health-question-num">${i + 1} of 5</span>
            <span class="health-question-cluster">${comp.cluster}</span>
          </div>
          <div class="health-question-title">${comp.title}</div>
          <div class="health-question-text">${escapeHtml(comp.question)}</div>
          ${isDeep ? `<div class="health-question-deep-text">${escapeHtml(comp.deepText)}</div>` : ''}
          <div class="health-answers">
            ${[
              { val: 4, label: 'Clearly yes' },
              { val: 3, label: 'Mostly yes' },
              { val: 2, label: 'Partially' },
              { val: 1, label: 'Mostly no' },
              { val: 0, label: 'Clearly no' }
            ].map(ans => `
              <button class="health-answer ${HEALTH_ANSWERS[comp.key] === ans.val ? 'selected' : ''}"
                      data-key="${comp.key}" data-val="${ans.val}">${ans.label}</button>
            `).join('')}
          </div>
        </div>`;
    });

    const cAnswered = HEALTH_ANSWERS.consistency !== undefined;
    html += `
      <div class="health-consistency-box">
        <h4>The final question — the multiplier</h4>
        <p style="color:#444;font-size:15px;margin-bottom:16px;">
          Consistency sits outside the formula and multiplies everything inside. This is the hardest question.
        </p>
      </div>
      <div class="health-question ${cAnswered ? 'answered' : ''}" data-key="consistency">
        <div class="health-question-header">
          <span class="health-question-num">The multiplier</span>
          <span class="health-question-cluster">Consistency</span>
        </div>
        <div class="health-question-title">Consistency</div>
        <div class="health-question-text">Do all five components above hold during an ordinary week, not just on the best day?</div>
        ${isDeep ? '<div class="health-question-deep-text">Consistency is what separates organizational health from good days. An organization that achieves all five components inconsistently has not achieved any of them. It has demonstrated them occasionally. If Consistency is zero, the formula produces zero. This is not a metaphor. It is the math.</div>' : ''}
        <div class="health-answers">
          ${[
            { val: 4, label: 'Every week' },
            { val: 3, label: 'Most weeks' },
            { val: 2, label: 'Some weeks' },
            { val: 1, label: 'Rarely' },
            { val: 0, label: 'Good days only' }
          ].map(ans => `
            <button class="health-answer ${HEALTH_ANSWERS.consistency === ans.val ? 'selected' : ''}"
                    data-key="consistency" data-val="${ans.val}">${ans.label}</button>
          `).join('')}
        </div>
      </div>

      <button class="health-submit health-submit-btn" ${isReadyToSubmit() ? '' : 'disabled'}>
        Calculate Organizational Health
      </button>`;

    const panel = document.getElementById('health-' + HEALTH_MODE);
    panel.innerHTML = html;

    panel.querySelectorAll('.health-answer').forEach(btn => {
      btn.addEventListener('click', () => {
        HEALTH_ANSWERS[btn.dataset.key] = parseInt(btn.dataset.val, 10);
        renderHealth();
      });
    });

    // Fix: scope submit button to the active panel, not document-wide
    const submitBtn = panel.querySelector('.health-submit-btn');
    if (submitBtn) submitBtn.addEventListener('click', renderHealthResult);
  }

  function isReadyToSubmit() {
    return ['clarity','capability','resources','efficiency','accountability','consistency'].every(k => HEALTH_ANSWERS[k] !== undefined);
  }

  function renderHealthResult() {
    if (!isReadyToSubmit()) return;

    const base = HEALTH_ANSWERS.clarity + HEALTH_ANSWERS.capability + HEALTH_ANSWERS.resources
               + HEALTH_ANSWERS.efficiency + HEALTH_ANSWERS.accountability;
    const final = base * HEALTH_ANSWERS.consistency;
    const maxScore = 20 * 4;
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const components = [
      { key: 'clarity',       label: 'Clarity',       cluster: 'Direction' },
      { key: 'capability',    label: 'Capability',    cluster: 'People' },
      { key: 'resources',     label: 'Resources',     cluster: 'Resources' },
      { key: 'efficiency',    label: 'Efficiency',    cluster: 'Process' },
      { key: 'accountability',label: 'Accountability',cluster: 'Results' }
    ];

    const diagnosis = generateDiagnosis(HEALTH_ANSWERS, base, final);

    const html = `
      <div class="health-result-card" id="health-report">

        <div class="health-report-header">
          <div class="health-report-brand">
            <span class="health-report-j">j</span>
            <div class="health-report-brand-text">
              <div class="health-report-title">Organizational Health Report</div>
              <div class="health-report-sub">The Words We Use — Jason Weimer</div>
            </div>
          </div>
          <div class="health-report-date">${today}</div>
        </div>

        <div class="health-score-display">
          <div class="health-score-num">${final}</div>
          <div class="health-score-label">Organizational Health Score — out of ${maxScore}</div>
        </div>

        <div class="health-breakdown">
          ${components.map(c => {
            const val = HEALTH_ANSWERS[c.key];
            const pct = (val / 4) * 100;
            return `
              <div class="health-row">
                <div class="health-row-label">${c.label}</div>
                <div class="health-row-bar"><div class="health-row-bar-fill" style="width:${pct}%"></div></div>
                <div class="health-row-value">${val} / 4</div>
              </div>`;
          }).join('')}
          <div class="health-row" style="border-left-color:#0a0a0a;background:#fff4c4;">
            <div class="health-row-label">× Consistency</div>
            <div class="health-row-bar"><div class="health-row-bar-fill" style="width:${(HEALTH_ANSWERS.consistency/4)*100}%;background:#0a0a0a"></div></div>
            <div class="health-row-value">× ${HEALTH_ANSWERS.consistency}</div>
          </div>
        </div>

        <div class="health-diagnosis">${diagnosis}</div>

        <div class="health-formula-reminder">
          <div class="health-formula-reminder-label">The master formula</div>
          <div class="health-formula-reminder-expr">Organizational Health = (Clarity + Capability + Resources + Efficiency + Accountability) × Consistency</div>
        </div>

        <div class="health-report-footer">
          <div>Generated by the Jargon Decoder — jasonweimer.com/jargon-decoder</div>
          <div>Based on <em>The Words We Use</em> by Jason Weimer</div>
        </div>

        <div class="health-result-actions no-print">
          <button class="health-print-btn" onclick="printHealthReport()">
            ↓ Save or print this report
          </button>
          <button class="health-reset" onclick="window.resetHealthCheck()">Start over</button>
        </div>

      </div>`;

    const resultEl = document.getElementById('health-result');
    resultEl.innerHTML = html;
    scrollToEl(resultEl);
  }

  function generateDiagnosis(answers, base, final) {
    const comps = {
      clarity: answers.clarity, capability: answers.capability,
      resources: answers.resources, efficiency: answers.efficiency,
      accountability: answers.accountability
    };
    const sorted = Object.entries(comps).sort((a, b) => a[1] - b[1]);
    const lowestScore = sorted[0][1];
    const weakest = sorted[0];
    const weakestName = weakest[0].charAt(0).toUpperCase() + weakest[0].slice(1);

    // Check if all five components scored the same (a tie)
    const allEqual = Object.values(comps).every(v => v === lowestScore);

    if (answers.consistency === 0) {
      return `<strong>Consistency is zero.</strong> The formula produced zero regardless of how well the other components scored. This is not a metaphor. An organization that achieves all five components inconsistently has not achieved any of them. It has demonstrated them occasionally. Before working on any other component, Consistency is the work.`;
    } else if (final >= 60) {
      const weakestLine = allEqual
        ? `All five components scored equally. Maintain what is working and protect the Consistency multiplier — it is what separates your organization from lucky ones.`
        : `The weakest component was <strong>${weakestName}</strong>. That is where the next round of focused work lives. Keep the Consistency multiplier protected.`;
      return `<strong>Strong organizational health.</strong> All five components are substantially present and Consistency is multiplying rather than collapsing them. This is a rare result. ${weakestLine}`;
    } else if (final >= 30) {
      const weakestLine = allEqual
        ? `All five components scored equally. Consistency is the primary lever — strengthening it will amplify every component simultaneously.`
        : `The honest question is whether Consistency is the bottleneck or whether <strong>${weakestName}</strong> is the weaker signal the multiplier is amplifying. Most organizations at this level benefit from fixing the weakest component first and protecting Consistency second.`;
      return `<strong>Moderate organizational health.</strong> The base score of ${base} out of 20 suggests most components are partially present. Consistency is multiplying at ${answers.consistency} out of 4. ${weakestLine}`;
    } else if (final >= 10) {
      const weakestLine = allEqual
        ? `All five components scored equally low. Pick one to focus on first. Restore it before moving to the next.`
        : `The weakest component is <strong>${weakestName}</strong>. That is the honest place to start. Do not try to fix all five at once. Pick one, restore it, then move to the next.`;
      return `<strong>Low organizational health.</strong> Either multiple components are weak or Consistency is collapsing what would otherwise be stronger scores. ${weakestLine}`;
    } else {
      const weakestLine = allEqual
        ? `All five components need attention. Start with whichever one, if improved, would have the most immediate effect on daily operations.`
        : `The weakest named component is <strong>${weakestName}</strong>. Before pursuing strategy, initiatives, or transformation, the basics require repair. That is not a criticism of the organization. It is a starting point.`;
      return `<strong>Critical organizational health.</strong> The score suggests fundamental issues across multiple components compounded by low Consistency. ${weakestLine}`;
    }
  }

  // ==== ABOUT TAB =============================================
  function setupAbout() {
    const typesHtml = DATA.metadata.formula_types.map(t => `
      <div class="type-card">
        <div class="type-card-header">
          <span class="type-card-name">${t.type}</span>
          <span class="type-card-notation">${t.notation}</span>
        </div>
        <div class="type-card-desc">${escapeHtml(t.description)}</div>
      </div>`).join('');
    document.getElementById('formula-types-grid').innerHTML = typesHtml;

    const clustersHtml = DATA.metadata.clusters.map((c, i) => `
      <div class="cluster-card">
        <div class="cluster-card-num">Part ${i + 1}</div>
        <div class="cluster-card-name">${c}</div>
        <div class="cluster-card-q">${CLUSTER_QUESTIONS[c]}</div>
      </div>`).join('');
    document.getElementById('clusters-grid').innerHTML = clustersHtml;

    // Frameworks & Standards categories
    const FW_CATEGORIES = [
      {
        name: 'Frameworks',
        subtype: 'Framework',
        description: 'Named strategic and organizational frameworks — tools designed to structure thinking, planning, and decision-making. From the Ansoff Matrix to the Balanced Scorecard.',
        examples: ['Ansoff Matrix', 'BCG Matrix', 'SWOT', 'OKR', 'Design Thinking', 'Kotter Model']
      },
      {
        name: 'Accounting & Finance',
        subtype: 'Accounting & Finance',
        description: 'The financial standards, ratios, and accounting concepts that govern how organizations record, report, and evaluate their financial performance.',
        examples: ['EBITDA', 'GAAP', 'IFRS', 'Depreciation', 'Net Present Value', 'Zero-Based Budgeting']
      },
      {
        name: 'Quality & Process',
        subtype: 'Quality & Process',
        description: 'Tools and methodologies for measuring, improving, and controlling the quality of processes and outputs — rooted in manufacturing, engineering, and operations.',
        examples: ['5 Whys', 'DMAIC', 'Control Chart', 'Kanban', 'A3 Report', 'VOC']
      },
      {
        name: 'Audit & Legal',
        subtype: 'Audit & Legal',
        description: 'Standards and instruments that govern formal review, compliance, and contractual obligations — including audit opinion types and procurement tools.',
        examples: ['Unqualified Opinion', 'Qualified Opinion', 'Adverse Opinion', 'SLA', 'RFP']
      },
      {
        name: 'Digital & Marketing',
        subtype: 'Digital & Marketing',
        description: 'Measurement and optimization frameworks used in digital channels — from search visibility to conversion testing.',
        examples: ['SEO', 'SEM', 'A/B Testing']
      }
    ];

    const fwCatHtml = FW_CATEGORIES.map(cat => {
      const count = FW_DATA
        ? FW_DATA.entries.filter(e => e.subtype === cat.subtype).length
        : null;
      return `
        <div class="fw-cat-card">
          <div class="fw-cat-card-header">
            <span class="fw-cat-card-name">${cat.name}</span>
            ${count !== null ? `<span class="fw-cat-card-count">${count}</span>` : ''}
          </div>
          <div class="fw-cat-card-desc">${escapeHtml(cat.description)}</div>
          <div class="fw-cat-card-examples">${cat.examples.map(e =>
            `<span class="fw-cat-example">${escapeHtml(e)}</span>`
          ).join('')}</div>
        </div>`;
    }).join('');
    document.getElementById('fw-categories-grid').innerHTML = fwCatHtml;
  }

  // ==== BOOK CTA (injected into all non-book tabs) ============
  function setupBottomSections() {
    const TABS = ['decode','encode','browse','frameworks','health','about'];

    const c = CONTENT;
    const shareLabel = c.share_label || 'Know someone who speaks too much jargon?';
    const shareTitle = c.share_title || 'Share this tool with a friend.';
    const waitlistEyebrow = c.waitlist_eyebrow || 'The book is coming.';
    const waitlistTitle = c.waitlist_title || 'Be the first to know when it launches.';
    const waitlistDesc = c.waitlist_desc || 'Join the waitlist and we will contact you first when the book is available.';

    // 1 — Share this tool
    const SHARE_HTML = `
      <div class="bottom-section share-section">
        <div class="share-inner">
          <div class="share-text">
            <div class="share-label">${shareLabel}</div>
            <h3 class="share-title">${shareTitle}</h3>
          </div>
          <div class="share-actions">
            <button class="share-btn share-btn-main" id="share-btn">
              <span class="share-btn-icon">↗</span>
              Share this tool
            </button>
            <button class="share-btn share-btn-copy" id="copy-link-btn">
              <span class="share-btn-icon">⎘</span>
              <span id="copy-link-label">Copy link</span>
            </button>
          </div>
        </div>
      </div>`;

    // 2 — Stay in the loop
    const EMAIL_HTML = `
      <div class="bottom-section email-capture">
        <div class="email-capture-inner">
          <div class="email-capture-text">
            <div class="email-capture-label">Stay in the loop</div>
            <p class="email-capture-sub">No spam. Updates only. Unsubscribe anytime.</p>
          </div>
          <form class="email-capture-form"
                action="https://app.kit.com/forms/9367995/subscriptions"
                method="post"
                target="_blank">
            <div class="email-capture-fields">
              <div class="email-capture-field">
                <label>First name</label>
                <input type="text" name="fields[first_name]" placeholder="Your first name" autocomplete="given-name" required>
              </div>
              <div class="email-capture-field">
                <label>Email address</label>
                <input type="email" name="email_address" placeholder="you@example.com" autocomplete="email" required>
              </div>
              <button type="submit" class="email-capture-btn">Subscribe</button>
            </div>
          </form>
        </div>
      </div>`;

    // 3 — Buy book
    const BOOK_HTML = `
      <div class="bottom-section tab-waitlist-cta">
        <div class="tab-waitlist-cover">
          <img src="images/the-words-we-use-cover.png"
               alt="The Words We Use by Jason Weimer"
               class="tab-cta-cover-img"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">
          <div class="tab-cta-cover-fallback" style="display:none;">
            <div class="tab-cta-j">j</div>
            <div class="tab-cta-cover-title">The Words We Use</div>
            <div class="tab-cta-cover-sub">The Hidden Formulas Behind Organizational Jargon</div>
          </div>
        </div>
        <div class="tab-waitlist-body">
          <div class="tab-waitlist-heading">
            <div class="tab-waitlist-eyebrow">${waitlistEyebrow}</div>
            <h3 class="tab-waitlist-title">${waitlistTitle}</h3>
          </div>
          <p class="tab-waitlist-desc">${waitlistDesc}</p>
          <form class="tab-waitlist-form"
                action="https://app.kit.com/forms/9367995/subscriptions"
                method="post"
                target="_blank">
            <div class="tab-waitlist-fields">
              <div class="tab-waitlist-field">
                <input type="text" name="fields[first_name]" placeholder="First name" autocomplete="given-name" required>
              </div>
              <div class="tab-waitlist-field">
                <input type="email" name="email_address" placeholder="Email address" autocomplete="email" required>
              </div>
              <button type="submit" class="tab-waitlist-btn">Put me on the waitlist</button>
            </div>
          </form>
        </div>
      </div>`;

    TABS.forEach(tab => {
      const panel = document.getElementById('tab-' + tab);
      if (!panel) return;
      panel.insertAdjacentHTML('beforeend', BOOK_HTML + /* EMAIL_HTML + */ SHARE_HTML);
    });

    // Share button logic — Web Share API with clipboard fallback
    document.querySelectorAll('#share-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        const shareData = {
          title: 'The Words We Use — Jargon Decoder',
          text: 'Decode organizational jargon using the formula system from The Words We Use by Jason Weimer.',
          url: 'https://jasonweimer.com/jargon-decoder'
        };
        if (navigator.share) {
          try { await navigator.share(shareData); } catch (e) {}
        } else {
          copyToClipboard('https://jasonweimer.com/jargon-decoder', btn.closest('.share-section').querySelector('#copy-link-label'));
        }
      });
    });

    // Copy link button logic
    document.querySelectorAll('#copy-link-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        copyToClipboard('https://jasonweimer.com/jargon-decoder', btn.querySelector('#copy-link-label'));
      });
    });
  }

  function copyToClipboard(text, labelEl) {
    navigator.clipboard.writeText(text).then(() => {
      if (labelEl) {
        const orig = labelEl.textContent;
        labelEl.textContent = 'Copied!';
        setTimeout(() => labelEl.textContent = orig, 2000);
      }
    }).catch(() => {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      if (labelEl) {
        const orig = labelEl.textContent;
        labelEl.textContent = 'Copied!';
        setTimeout(() => labelEl.textContent = orig, 2000);
      }
    });
  }

  // ==== PRINT HEALTH REPORT ==================================
  function printHealthReport() {
    const today = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

    const base = HEALTH_ANSWERS.clarity + HEALTH_ANSWERS.capability + HEALTH_ANSWERS.resources
               + HEALTH_ANSWERS.efficiency + HEALTH_ANSWERS.accountability;
    const final = base * HEALTH_ANSWERS.consistency;

    const diagnosisEl = document.querySelector('.health-diagnosis');
    const diagnosisHTML = diagnosisEl ? diagnosisEl.innerHTML : '';

    const rowsHTML = [
      { key: 'clarity',        label: 'Clarity' },
      { key: 'capability',     label: 'Capability' },
      { key: 'resources',      label: 'Resources' },
      { key: 'efficiency',     label: 'Efficiency' },
      { key: 'accountability', label: 'Accountability' }
    ].map(c => `
      <div class="row">
        <div class="row-label">${c.label}</div>
        <div class="bar-wrap"><div class="bar-fill" style="width:${(HEALTH_ANSWERS[c.key]/4)*100}%"></div></div>
        <div class="row-val">${HEALTH_ANSWERS[c.key]} / 4</div>
      </div>`).join('') + `
      <div class="row consistency">
        <div class="row-label">× Consistency</div>
        <div class="bar-wrap"><div class="bar-fill dark" style="width:${(HEALTH_ANSWERS.consistency/4)*100}%"></div></div>
        <div class="row-val">× ${HEALTH_ANSWERS.consistency}</div>
      </div>`;

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title>Organizational Health Report</title>
<style>
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#0a0a0a;background:#fff;padding:32px;font-size:13px;line-height:1.5;}
  .header{display:flex;align-items:center;justify-content:space-between;padding-bottom:12px;margin-bottom:16px;border-bottom:3px solid #FBC02D;}
  .brand{display:flex;align-items:center;gap:10px;}
  .brand-j{width:36px;height:36px;background:#0a0a0a;color:#FBC02D;font-family:Georgia,serif;font-size:20px;font-style:italic;font-weight:900;display:flex;align-items:center;justify-content:center;border-radius:3px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .brand-title{font-size:14px;font-weight:700;}
  .brand-sub{font-size:10px;color:#999;font-style:italic;}
  .report-date{font-size:11px;color:#aaa;font-style:italic;}
  .score-block{background:#0a0a0a;color:#fff;padding:14px 20px;margin-bottom:14px;display:flex;align-items:center;gap:18px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .score-num{font-size:48px;font-weight:900;color:#FBC02D;line-height:1;font-family:Georgia,serif;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .score-label{font-size:13px;color:#aaa;}
  .score-max{font-size:11px;color:#666;margin-top:2px;}
  .breakdown{margin-bottom:14px;}
  .row{display:flex;align-items:center;gap:10px;padding:7px 10px;margin-bottom:3px;border-left:3px solid #FBC02D;background:#f9f9f9;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .row.consistency{border-left-color:#0a0a0a;background:#fff4c4;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .row-label{width:105px;font-size:12px;font-weight:600;flex-shrink:0;}
  .bar-wrap{flex:1;height:9px;background:#e5e5e5;border-radius:2px;}
  .bar-fill{height:100%;background:#FBC02D;border-radius:2px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .bar-fill.dark{background:#0a0a0a;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .row-val{width:32px;text-align:right;font-size:12px;font-weight:700;flex-shrink:0;}
  .diagnosis{background:#f5f5f5;padding:12px 14px;font-size:12px;line-height:1.65;margin-bottom:12px;border-left:3px solid #0a0a0a;}
  .formula-block{background:#0a0a0a;padding:10px 14px;margin-bottom:12px;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .formula-label{font-size:8px;text-transform:uppercase;letter-spacing:0.12em;color:#666;margin-bottom:4px;}
  .formula-text{font-family:'Courier New',monospace;font-size:10px;color:#FBC02D;line-height:1.5;-webkit-print-color-adjust:exact;print-color-adjust:exact;}
  .footer{border-top:1px solid #eee;padding-top:8px;font-size:9px;color:#bbb;font-style:italic;}
  @page{margin:0.4in;size:letter portrait;}
</style>
</head>
<body>
<div class="header">
  <div class="brand">
    <div class="brand-j">j</div>
    <div><div class="brand-title">Organizational Health Report</div><div class="brand-sub">The Words We Use — Jason Weimer</div></div>
  </div>
  <div class="report-date">${today}</div>
</div>
<div class="score-block">
  <div class="score-num">${final}</div>
  <div><div class="score-label">Organizational Health Score</div><div class="score-max">out of 80</div></div>
</div>
<div class="breakdown">${rowsHTML}</div>
<div class="diagnosis">${diagnosisHTML}</div>
<div class="formula-block">
  <div class="formula-label">The master formula</div>
  <div class="formula-text">Organizational Health = (Clarity + Capability + Resources + Efficiency + Accountability) × Consistency</div>
</div>
<div class="footer">Generated by the Jargon Decoder — jasonweimer.com/jargon-decoder &nbsp;·&nbsp; Based on The Words We Use by Jason Weimer</div>
</body>
</html>`;

    // Remove any existing print iframe
    const existing = document.getElementById('health-print-frame');
    if (existing) existing.remove();

    const iframe = document.createElement('iframe');
    iframe.id = 'health-print-frame';
    iframe.style.cssText = 'position:fixed;top:-9999px;left:-9999px;width:1px;height:1px;border:none;';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow.document;
    doc.open();
    doc.write(html);
    doc.close();

    let printed = false;
    iframe.contentWindow.onload = function() {
      if (printed) return;
      printed = true;
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
    };

    // Fallback if onload already fired
    setTimeout(() => {
      if (printed) return;
      printed = true;
      try { iframe.contentWindow.focus(); iframe.contentWindow.print(); } catch(e) {}
    }, 500);
  }

  function resetHealthCheck() {
    HEALTH_ANSWERS = {};
    document.getElementById('health-result').innerHTML = '';
    renderHealth();
    scrollToEl(document.getElementById('tab-health'));
  }

  // ==== UTILS =================================================
  function populateSelect(id, options) {
    const sel = document.getElementById(id);
    options.forEach(o => {
      const el = document.createElement('option');
      el.value = o.value;
      el.textContent = o.label;
      sel.appendChild(el);
    });
  }
  function scrollToEl(el) {
    if (!el) return;
    const header = document.querySelector('.site-header');
    const headerHeight = header ? header.offsetHeight : 0;
    const PADDING = 20;
    const top = el.getBoundingClientRect().top + window.pageYOffset - headerHeight - PADDING;
    window.scrollTo({ top, behavior: 'smooth' });
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }
  function escapeAttr(s) {
    return String(s).replace(/"/g, '&quot;');
  }

  // ==== START =================================================
  const yearEl = document.getElementById('footer-year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Expose functions called from inline HTML onclick attributes
  window.printHealthReport = printHealthReport;
  window.resetHealthCheck = resetHealthCheck;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
