/* Token Radar dashboard: renders window.RADAR_DATA (written by main.ts beside
   this page as ../data.js). No network, no framework — filtering, sorting and
   the detail view all run locally on the sealed snapshot's numbers. */
(function () {
  'use strict';
  var D = window.RADAR_DATA;
  var state = { q: '', category: '', chain: '', watchOnly: false, sort: 'rank', selected: null };

  function el(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function money(n) {
    if (n == null) return '—';
    var abs = Math.abs(n);
    if (abs >= 1e9) return '$' + (n / 1e9).toFixed(2) + 'B';
    if (abs >= 1e6) return '$' + (n / 1e6).toFixed(1) + 'M';
    if (abs >= 1e3) return '$' + (n / 1e3).toFixed(1) + 'K';
    return '$' + Math.round(n);
  }
  function pct(x) {
    if (x == null) return '<span class="pslug">n/a</span>';
    var cls = x > 0 ? 'pos' : x < 0 ? 'neg' : '';
    return '<span class="' + cls + '">' + (x > 0 ? '+' : '') + x.toFixed(1) + '%</span>';
  }
  function ageLabel(days) {
    if (days == null) return 'untracked';
    if (days < 60) return days + 'd';
    if (days < 730) return Math.round(days / 30.4) + ' mo';
    return (days / 365.25).toFixed(1) + ' yrs';
  }

  /* Header chips + model panel */
  el('chips').innerHTML =
    '<span class="chip">Snapshot <b>' + esc(D.as_of) + '</b></span>' +
    '<span class="chip"><b>' + D.protocol_count + '</b> protocols scanned</span>' +
    '<span class="chip"><b>' + D.early_size + '</b> pre-token</span>' +
    '<span class="chip"><b>' + D.rows.length + '</b> ranked</span>' +
    '<span class="chip"><b>' + D.watchlist_size + '/' + D.watchlist_size + '</b> watchlist covered</span>' +
    '<span class="chip">Global median multiple <b>' + D.global_multiple.toFixed(2) + '×</b></span>';
  el('modelNotes').innerHTML = D.model_notes.map(function (n) { return '<div>' + esc(n) + '</div>'; }).join('');
  el('modelFormula').textContent =
    'implied value  =  TVL  ×  category median mcap/TVL  ×  momentum(7d TVL)  ×  maturity(days tracked)';
  el('footDate').textContent = D.as_of;

  /* Filter controls */
  var catSel = el('category');
  catSel.innerHTML = '<option value="">All categories</option>' + D.categories.map(function (c) {
    return '<option>' + esc(c) + '</option>';
  }).join('');
  var chainSel = el('chain');
  chainSel.innerHTML = '<option value="">All chains</option>' + D.chains.map(function (c) {
    return '<option>' + esc(c) + '</option>';
  }).join('');

  function visible() {
    var q = state.q.trim().toLowerCase();
    var rows = D.rows.filter(function (r) {
      if (state.watchOnly && !r.watchlist) return false;
      if (state.category && (r.category || 'Uncategorized') !== state.category) return false;
      if (state.chain && r.chains.indexOf(state.chain) === -1) return false;
      if (q && r.name.toLowerCase().indexOf(q) === -1 && r.slug.indexOf(q) === -1) return false;
      return true;
    });
    var by = {
      rank: function (a, b) { return a.rank - b.rank; },
      tvl: function (a, b) { return b.tvl_usd - a.tvl_usd; },
      momentum: function (a, b) { return (b.change_7d || -Infinity) - (a.change_7d || -Infinity); },
      confidence: function (a, b) { return b.confidence - a.confidence || a.rank - b.rank; },
      age: function (a, b) { return (b.age_days || -1) - (a.age_days || -1) || a.rank - b.rank; }
    };
    return rows.sort(by[state.sort] || by.rank);
  }

  function renderBoard() {
    var rows = visible();
    el('count').innerHTML = 'Showing <b>' + rows.length + '</b> of ' + D.rows.length + ' ranked protocols';
    el('empty').hidden = rows.length > 0;
    el('rows').innerHTML = rows.map(function (r) {
      var chains = r.chains.slice(0, 2).join(', ') + (r.chains.length > 2 ? ' +' + (r.chains.length - 2) : '');
      return '<tr data-slug="' + esc(r.slug) + '" tabindex="0" class="' + (state.selected === r.slug ? 'selected' : '') + '">' +
        '<td class="num rank">' + r.rank + '</td>' +
        '<td><span class="pname">' + esc(r.name) + '</span>' +
        (r.watchlist ? '<span class="badge">WATCHLIST</span>' : '') +
        '<br><span class="pslug">' + esc(r.slug) + '</span></td>' +
        '<td class="cat">' + esc(r.category || 'Uncategorized') + '</td>' +
        '<td class="chains">' + esc(chains) + '</td>' +
        '<td class="num">' + money(r.tvl_usd) + '</td>' +
        '<td class="num">' + pct(r.change_7d) + '</td>' +
        '<td class="num implied">' + money(r.implied_value_usd) + '</td>' +
        '<td><div class="conf"><div class="conf-track"><div class="conf-fill" style="width:' + r.confidence + '%"></div></div><b>' + r.confidence + '</b></div></td>' +
        '</tr>';
    }).join('');
  }

  function renderDetail(r) {
    var box = el('detail');
    if (!r) {
      box.innerHTML = '<h2>No protocol selected</h2><p class="hint">Click any row on the board to see its valuation breakdown, its tokenized comparables and its farm plan.</p>';
      return;
    }
    var base = r.tvl_usd * r.multiple;
    var peers = r.peers.length
      ? '<table class="peers"><tr><th>Tokenized peer</th><th>TVL</th><th>Mkt cap</th><th>×TVL</th></tr>' +
        r.peers.map(function (p) {
          return '<tr><td>' + esc(p.name) + (p.symbol ? ' (' + esc(p.symbol) + ')' : '') + '</td><td>' +
            money(p.tvl_usd) + '</td><td>' + money(p.mcap_usd) + '</td><td>' + p.ratio.toFixed(2) + '×</td></tr>';
        }).join('') + '</table>'
      : '<p class="hint">No tokenized protocol in this category yet — the model falls back to the global median multiple.</p>';
    box.innerHTML =
      '<h2>' + esc(r.name) + '</h2>' +
      '<div class="slug">' + esc(r.slug) + ' · rank #' + r.rank + ' of ' + D.rows.length + '</div>' +
      '<div class="badges">' +
      (r.watchlist ? '<span class="pill hot">On the watchlist</span>' : '<span class="pill">Below the $50M floor — found early</span>') +
      '<span class="pill">' + esc(r.category || 'Uncategorized') + '</span>' +
      '<span class="pill">' + r.chains.length + ' chain' + (r.chains.length === 1 ? '' : 's') + '</span></div>' +
      '<div class="stat-grid">' +
      '<div class="stat"><div class="k">TVL</div><div class="v">' + money(r.tvl_usd) + '</div></div>' +
      '<div class="stat"><div class="k">Implied value</div><div class="v">' + money(r.implied_value_usd) + '</div></div>' +
      '<div class="stat"><div class="k">7d TVL change</div><div class="v">' + (r.change_7d == null ? 'n/a' : (r.change_7d > 0 ? '+' : '') + r.change_7d.toFixed(1) + '%') + '</div></div>' +
      '<div class="stat"><div class="k">Tracked for</div><div class="v">' + ageLabel(r.age_days) + '</div></div>' +
      '<div class="stat"><div class="k">Value range</div><div class="v">' + money(r.implied_low_usd) + ' – ' + money(r.implied_high_usd) + '</div></div>' +
      '<div class="stat"><div class="k">Confidence</div><div class="v">' + r.confidence + ' / 100</div></div></div>' +
      '<h3>How this value is built</h3>' +
      '<table class="breakdown">' +
      '<tr><td>TVL × category multiple (' + r.multiple.toFixed(2) + '×)</td><td>' + money(base) + '</td></tr>' +
      '<tr><td>Momentum adjustment (7d TVL)</td><td>× ' + r.momentum_factor.toFixed(3) + '</td></tr>' +
      '<tr><td>Maturity adjustment (track record)</td><td>× ' + r.maturity_factor.toFixed(3) + '</td></tr>' +
      '<tr class="total"><td>Implied token value</td><td>' + money(r.implied_value_usd) + '</td></tr></table>' +
      '<h3>Tokenized comparables</h3>' + peers +
      '<h3>Farm plan</h3>' +
      '<ol class="plan">' + r.farm_steps.map(function (s) { return '<li>' + esc(s) + '</li>'; }).join('') + '</ol>';
  }

  function select(slug, scroll) {
    state.selected = slug;
    var r = D.rows.filter(function (x) { return x.slug === slug; })[0] || null;
    renderBoard();
    renderDetail(r);
    if (scroll) el('detail').scrollIntoView({ block: 'nearest', behavior: 'smooth' });
  }

  el('rows').addEventListener('click', function (ev) {
    var tr = ev.target.closest('tr[data-slug]');
    if (tr) select(tr.getAttribute('data-slug'), false);
  });
  el('rows').addEventListener('keydown', function (ev) {
    if (ev.key !== 'Enter') return;
    var tr = ev.target.closest('tr[data-slug]');
    if (tr) select(tr.getAttribute('data-slug'), false);
  });
  el('q').addEventListener('input', function (ev) { state.q = ev.target.value; renderBoard(); });
  catSel.addEventListener('change', function (ev) { state.category = ev.target.value; renderBoard(); });
  chainSel.addEventListener('change', function (ev) { state.chain = ev.target.value; renderBoard(); });
  el('sort').addEventListener('change', function (ev) { state.sort = ev.target.value; renderBoard(); });
  el('watchOnly').addEventListener('change', function (ev) { state.watchOnly = ev.target.checked; renderBoard(); });

  renderBoard();
  if (D.rows.length) select(D.rows[0].slug, false);
})();
