// Research page area filter. Single-select; clicking the active pill clears
// back to All. Chips on each paper are labels only; they just highlight.
// Without this script every paper stays visible and the filter bar stays hidden.
(function () {
  var nav = document.querySelector('.area-filter');
  if (!nav) return;

  var pubs = Array.prototype.slice.call(document.querySelectorAll('article.pub'));
  var sections = Array.prototype.slice.call(document.querySelectorAll('[data-section]'));
  var pills = Array.prototype.slice.call(nav.querySelectorAll('.area-pill'));
  var current = null;

  function areasOf(pub) {
    return (pub.getAttribute('data-areas') || '').split(' ').filter(Boolean);
  }

  pills.forEach(function (pill) {
    var slug = pill.getAttribute('data-area');
    var n = slug ? pubs.filter(function (p) { return areasOf(p).indexOf(slug) !== -1; }).length : pubs.length;
    var out = pill.querySelector('.n');
    if (out) { out.textContent = String(n); out.setAttribute('aria-label', ' (' + n + (n === 1 ? ' entry)' : ' entries)')); }
    // An area with no visible paper (e.g. while some entries are unpublished) is not offered.
    if (n === 0) pill.hidden = true;
    pill._n = n;
  });

  // Most-used areas first; All stays first and ties keep the data-file order.
  var box = nav.querySelector('.area-pills');
  pills.slice(1)
    .map(function (pill, i) { return { pill: pill, i: i }; })
    .sort(function (a, b) { return (b.pill._n - a.pill._n) || (a.i - b.i); })
    .forEach(function (o) { box.appendChild(o.pill); });

  var status = nav.querySelector('[data-filter-status]');

  function apply(slug) {
    current = slug;

    pills.forEach(function (pill) {
      var on = (pill.getAttribute('data-area') || null) === slug;
      pill.classList.toggle('is-on', on);
      pill.setAttribute('aria-pressed', on ? 'true' : 'false');
    });

    pubs.forEach(function (pub) {
      pub.hidden = slug !== null && areasOf(pub).indexOf(slug) === -1;
      pub.classList.remove('is-last');
      pub.querySelectorAll('.pub-areas .chip').forEach(function (chip) {
        chip.classList.toggle('is-on', slug !== null && chip.getAttribute('data-area') === slug);
      });
    });

    if (status) {
      var shownCount = pubs.filter(function (p) { return !p.hidden; }).length;
      var pill = slug ? nav.querySelector('.area-pill[data-area="' + slug + '"]') : null;
      var name = pill ? pill.firstChild.textContent : 'all areas';
      status.textContent = 'Showing ' + shownCount + ' of ' + pubs.length + ' entries: ' + name;
    }

    var firstShown = true;
    sections.forEach(function (section) {
      var shown = Array.prototype.slice.call(section.querySelectorAll('article.pub'))
        .filter(function (p) { return !p.hidden; });
      section.hidden = shown.length === 0;
      section.classList.remove('is-first');
      if (shown.length) {
        shown[shown.length - 1].classList.add('is-last');
        if (firstShown) { section.classList.add('is-first'); firstShown = false; }
      }
    });
  }

  document.addEventListener('click', function (e) {
    var btn = e.target.closest('.area-pill');
    if (!btn) return;
    var slug = btn.getAttribute('data-area') || null;
    apply(slug === null || slug === current ? null : slug);
  });

  nav.hidden = false;
  apply(null);
})();
