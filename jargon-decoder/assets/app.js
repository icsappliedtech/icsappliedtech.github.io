/* ============================================================ */
/* THE WORDS WE USE — JARGON DECODER                              */
/* Main application logic                                         */
/* ============================================================ */

(function() {
  'use strict';

  // ==== STATE =================================================
  let DATA = null;        // jargon-data.json
  let FW_DATA = null;     // framework-standards-data.json
  let CURRENT_TAB = 'decode';
  let HEALTH_MODE = 'quick';
  let HEALTH_ANSWERS = {};
  let FW_SEARCH_QUERY = '';
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

    setupTabs();
    setupDecode();
    setupEncode();
    setupBrowse();
    setupFrameworks();
    setupHealth();
    setupAbout();

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
    const picks = shuffled.slice(0, 8).map(e => e.word);
    const container = document.getElementById('quickpick-tags');
    container.innerHTML = picks.map(w =>
      `<button class="quickpick-tag" data-word="${escapeAttr(w)}">${escapeHtml(w)}</button>`
    ).join('');
    container.querySelectorAll('.quickpick-tag').forEach(btn => {
      btn.addEventListener('click', () => selectDecodeWord(btn.dataset.word));
    });
  }

  // ==== ENCODE TAB ============================================
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
  }

  function clearEncode() {
    ['comp-1','comp-2','comp-3'].forEach(id => document.getElementById(id).value = '');
    document.getElementById('encode-type').value = '';
    document.getElementById('encode-cluster').value = '';
    document.getElementById('encode-result').innerHTML = '';
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
    const input = document.getElementById('fw-search');
    if (input) {
      input.addEventListener('input', () => {
        FW_SEARCH_QUERY = input.value.trim().toLowerCase();
        renderFrameworksList();
      });
    }
    renderFrameworksList();
  }

  function renderFrameworksList() {
    if (!FW_DATA) return;
    let entries = [...FW_DATA.entries];

    if (FW_SEARCH_QUERY) {
      entries = entries.filter(e =>
        e.word.toLowerCase().includes(FW_SEARCH_QUERY) ||
        (e.acronym && e.acronym.toLowerCase().includes(FW_SEARCH_QUERY)) ||
        e.definition.toLowerCase().includes(FW_SEARCH_QUERY)
      );
    }

    entries.sort((a, b) => a.word.localeCompare(b.word));

    const grid = document.getElementById('fw-grid');
    if (!grid) return;

    if (entries.length === 0) {
      grid.innerHTML = '<div class="encode-empty">No frameworks match your search.</div>';
      return;
    }

    grid.innerHTML = entries.map(e => `
      <button class="fw-card" data-word="${escapeAttr(e.word)}">
        <div class="fw-card-word">${escapeHtml(e.word)}</div>
        ${e.acronym ? `<div class="fw-card-acronym">${escapeHtml(e.acronym)}</div>` : ''}
        ${e.origin ? `<div class="fw-card-origin">${escapeHtml(e.origin)}</div>` : ''}
      </button>`).join('');

    grid.querySelectorAll('.fw-card').forEach(card => {
      card.addEventListener('click', () => selectFramework(card.dataset.word));
    });
  }

  function selectFramework(word) {
    if (!FW_DATA) return;
    const entry = FW_DATA.entries.find(e => e.word === word);
    if (!entry) return;
    document.getElementById('fw-search').value = word;
    renderFrameworkResult(entry);
    scrollToEl(document.getElementById('fw-result'));
  }

  function renderFrameworkResult(entry) {
    const componentsBlock = entry.components && entry.components.length > 0 ? `
      <div class="result-section">
        <div class="section-label">Components</div>
        <div class="components-list">
          ${entry.components.map(c => `<span class="component-chip">${escapeHtml(c)}</span>`).join('')}
        </div>
      </div>` : '';

    const relatedBlock = entry.related && entry.related.length > 0 ? `
      <div class="result-section">
        <div class="section-label">Related in the decoder</div>
        <div class="fw-related-list">
          ${entry.related.map(r => {
            const exists = DATA && DATA.entries.some(e => e.word === r);
            return exists
              ? `<button class="fw-related-link" data-word="${escapeAttr(r)}">${escapeHtml(r)}</button>`
              : `<span class="fw-related-plain">${escapeHtml(r)}</span>`;
          }).join('')}
        </div>
      </div>` : '';

    const html = `
      <div class="result-card result-card-framework">
        <div class="result-header">
          <div class="result-word-block">
            <div class="result-word">${escapeHtml(entry.word)}</div>
            <div class="result-tags">
              <span class="tag tag-framework">Framework &amp; Standard</span>
              ${entry.acronym ? `<span class="tag tag-acronym">${escapeHtml(entry.acronym)}</span>` : ''}
            </div>
          </div>
        </div>

        ${entry.origin ? `
        <div class="fw-origin-block">
          <span class="fw-origin-label">Origin</span>
          <span class="fw-origin-text">${escapeHtml(entry.origin)}</span>
        </div>` : ''}

        <div class="result-section">
          <div class="section-label">Definition</div>
          <div class="section-content">${escapeHtml(entry.definition)}</div>
        </div>

        ${componentsBlock}

        <div class="result-section">
          <div class="section-label">Used for</div>
          <div class="section-content">${escapeHtml(entry.used_for)}</div>
        </div>

        ${relatedBlock}
      </div>`;

    document.getElementById('fw-result').innerHTML = html;

    document.querySelectorAll('.fw-related-link').forEach(btn => {
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
        <div class="health-question-text">Do all five components above hold on an ordinary Tuesday — not just on the best day?</div>
        ${isDeep ? '<div class="health-question-deep-text">Consistency is what separates organizational health from good days. An organization that achieves all five components inconsistently has not achieved any of them. It has demonstrated them occasionally. If Consistency is zero, the formula produces zero. This is not a metaphor. It is the math.</div>' : ''}
        <div class="health-answers">
          ${[
            { val: 4, label: 'Every Tuesday' },
            { val: 3, label: 'Most Tuesdays' },
            { val: 2, label: 'Some Tuesdays' },
            { val: 1, label: 'Rarely' },
            { val: 0, label: 'Good days only' }
          ].map(ans => `
            <button class="health-answer ${HEALTH_ANSWERS.consistency === ans.val ? 'selected' : ''}"
                    data-key="consistency" data-val="${ans.val}">${ans.label}</button>
          `).join('')}
        </div>
      </div>

      <button id="health-submit-btn" class="health-submit" ${isReadyToSubmit() ? '' : 'disabled'}>
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

    const submitBtn = document.getElementById('health-submit-btn');
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

    const components = [
      { key: 'clarity',       label: 'Clarity',       cluster: 'Direction' },
      { key: 'capability',    label: 'Capability',    cluster: 'People' },
      { key: 'resources',     label: 'Resources',     cluster: 'Resources' },
      { key: 'efficiency',    label: 'Efficiency',    cluster: 'Process' },
      { key: 'accountability',label: 'Accountability',cluster: 'Results' }
    ];

    const diagnosis = generateDiagnosis(HEALTH_ANSWERS, base, final);

    const html = `
      <div class="health-result-card">
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
        <button class="health-reset" onclick="location.reload()">Start over</button>
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
    const weakest = Object.entries(comps).sort((a, b) => a[1] - b[1])[0];
    const weakestName = weakest[0].charAt(0).toUpperCase() + weakest[0].slice(1);

    if (answers.consistency === 0) {
      return `<strong>Consistency is zero.</strong> The formula produced zero regardless of how well the other components scored. This is not a metaphor. An organization that achieves all five components inconsistently has not achieved any of them. It has demonstrated them occasionally. Before working on any other component, Consistency is the work.`;
    } else if (final >= 60) {
      return `<strong>Strong organizational health.</strong> All five components are substantially present and Consistency is multiplying rather than collapsing them. This is a rare result. Keep the Consistency multiplier protected — it is what separates your organization from lucky ones. The weakest component was <strong>${weakestName}</strong>. That is where the next round of focused work lives.`;
    } else if (final >= 30) {
      return `<strong>Moderate organizational health.</strong> The base score of ${base} out of 20 suggests most components are partially present. Consistency is multiplying at ${answers.consistency} out of 4. The honest question is whether Consistency is the bottleneck or whether <strong>${weakestName}</strong> is the weaker signal the multiplier is amplifying. Most organizations at this level benefit from fixing the weakest component first and protecting Consistency second.`;
    } else if (final >= 10) {
      return `<strong>Low organizational health.</strong> Either multiple components are weak or Consistency is collapsing what would otherwise be stronger scores. The weakest component is <strong>${weakestName}</strong>. That is the honest place to start. Do not try to fix all five at once. Pick one, restore it, then move to the next.`;
    } else {
      return `<strong>Critical organizational health.</strong> The score suggests fundamental issues across multiple components compounded by low Consistency. The weakest named component is <strong>${weakestName}</strong>. Before pursuing strategy, initiatives, or transformation, the basics require repair. That is not a criticism of the organization. It is a starting point.`;
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

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
