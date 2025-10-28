(function () {
  if (window.__inlaGlobalNavMounted) {
    return;
  }
  window.__inlaGlobalNavMounted = true;

  var navGroups = [
    { label: 'Home', path: 'index.html' },
    {
      label: 'Learn',
      children: [
        { label: 'What is INLA?', path: 'whatisinla/index.html' },
        { label: 'Learn More Overview', path: 'learnmore/index.html' },
        { label: 'Documentation (pkgdown)', path: 'learnmore/docs/index.html' },
        { label: 'Function Reference', path: 'learnmore/docs/reference/index.html' },
        { label: 'Books & Guides', path: 'learnmore/books/index.html' }
      ]
    },
    {
      label: 'Use INLA',
      children: [
        { label: 'Download & Install', path: 'download/index.html' },
        { label: 'Examples & Tutorials', path: 'examples/index.html' },
        { label: 'Support & Issues', path: 'issues/index.html' }
      ]
    },
    {
      label: 'Resources',
      children: [
        { label: 'INLA Publications', path: 'papers/index.html' },
        { label: 'Citations Map', path: 'map/index.html' },
        { label: 'Related Projects', path: 'relatedprojects/index.html' }
      ]
    },
    {
      label: 'Community',
      children: [
        { label: 'Our Team', path: 'ourteam/index.html' },
        { label: 'News & Updates', path: 'https://x.com/bayescomp_inla', external: true }
      ]
    }
  ];

  function flattenNavGroups(groups) {
    var items = [];
    groups.forEach(function (group) {
      if (group.children && group.children.length) {
        group.children.forEach(function (child) {
          items.push(child);
        });
      } else {
        items.push(group);
      }
    });
    return items;
  }

  var navItems = flattenNavGroups(navGroups);

  function computePrefix() {
    var segments = window.location.pathname.split('/').filter(Boolean);
    var depth = segments.length;
    if (depth && segments[depth - 1].indexOf('.') !== -1) {
      depth -= 1;
    }
    return depth > 0 ? '../'.repeat(depth) : '';
  }

  function normalizePath(path) {
    var cleaned = path.replace(/^\/+/, '');
    if (!cleaned) {
      return 'index.html';
    }
    if (cleaned.endsWith('/')) {
      cleaned += 'index.html';
    } else if (cleaned.indexOf('.') === -1) {
      cleaned += '/index.html';
    }
    return cleaned;
  }

  var currentNormalized = normalizePath(window.location.pathname);
  var prefix = computePrefix();

  function resolveHref(path, external) {
    return external ? path : prefix + path;
  }

  function isActive(path, external) {
    if (external) {
      return false;
    }
    var target = normalizePath(path);
    if (currentNormalized === target) {
      return true;
    }
    var targetDir = target.replace(/index\.html$/, '');
    if (!targetDir) {
      return false;
    }
    return currentNormalized.indexOf(targetDir) === 0;
  }

  function createLeftNav() {
    if (!document.body) {
      return;
    }

    var nav = document.createElement('nav');
    nav.className = 'inla-left-nav';
    nav.setAttribute('aria-label', 'Site navigation');

    var hotspot = document.createElement('div');
    hotspot.className = 'inla-left-nav__hotspot';

    var listMarkup = navItems
      .map(function (item) {
        var activeClass = isActive(item.path, item.external) ? ' class="is-active"' : '';
        var targetAttrs = item.external ? ' target="_blank" rel="noopener noreferrer"' : '';
        return '<li><a' + activeClass + targetAttrs + ' href="' + resolveHref(item.path, item.external) + '">' + item.label + '</a></li>';
      })
      .join('');

    var panel = document.createElement('div');
    panel.className = 'inla-left-nav__panel';
    panel.innerHTML = [
      '<div class="inla-left-nav__brand"><a href="' + resolveHref('index.html') + '">INLA Project</a></div>',
      '<button class="inla-left-nav__close" type="button" aria-label="Close navigation">Close</button>',
      '<ul class="inla-left-nav__list">' + listMarkup + '</ul>'
    ].join('');

    nav.appendChild(hotspot);
    nav.appendChild(panel);

    var closeButton = panel.querySelector('.inla-left-nav__close');
    var firstLink = panel.querySelector('.inla-left-nav__list a');

    function openMenu() {
      document.body.classList.add('inla-left-nav-open');
    }

    function closeMenu() {
      document.body.classList.remove('inla-left-nav-open');
    }

    nav.addEventListener('mouseenter', openMenu);
    nav.addEventListener('mouseleave', closeMenu);
    hotspot.addEventListener('mouseenter', openMenu);
    hotspot.addEventListener('click', function () {
      document.body.classList.toggle('inla-left-nav-open');
    });

    nav.addEventListener('focusin', openMenu);
    nav.addEventListener('focusout', function () {
      setTimeout(function () {
        if (!nav.contains(document.activeElement)) {
          closeMenu();
        }
      }, 0);
    });

    if (closeButton) {
      closeButton.addEventListener('click', function () {
        closeMenu();
        if (firstLink) {
          firstLink.focus();
        }
      });
    }

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && document.body.classList.contains('inla-left-nav-open')) {
        closeMenu();
      }
    });

    document.body.classList.add('has-inla-left-nav');
    document.body.appendChild(nav);
  }

  var style = document.createElement('style');
  style.textContent = [
    'nav.inla-left-nav .inla-left-nav__list a:focus-visible,',
    'nav.inla-left-nav .inla-left-nav__close:focus-visible {',
    '  outline: 2px solid #bbcf32;',
    '  outline-offset: 2px;',
    '}',
    'body.has-inla-left-nav {',
    '  margin: 0;',
    '  transition: margin-left 0.25s ease;',
    '}',
    'body.has-inla-left-nav {',
    '  margin-left: 0;',
    '}',
    'body.has-inla-left-nav.inla-left-nav-open {',
    '  margin-left: 0;',
    '}',
    'nav.inla-left-nav {',
    '  position: fixed;',
    '  top: 0;',
    '  left: 0;',
    '  width: 24px;',
    '  height: 100vh;',
    '  z-index: 1400;',
    '  font-family: "Inter", sans-serif;',
    '}',
    'nav.inla-left-nav * {',
    '  box-sizing: border-box;',
    '}',
    'nav.inla-left-nav .inla-left-nav__hotspot {',
    '  position: absolute;',
    '  top: 0;',
    '  left: 0;',
    '  width: 24px;',
    '  height: 100%;',
    '  cursor: pointer;',
    '  background: rgba(15, 39, 67, 0.08);',
    '  transition: background 0.2s ease;',
    '}',
    'nav.inla-left-nav:hover .inla-left-nav__hotspot,',
    'nav.inla-left-nav:focus-within .inla-left-nav__hotspot,',
    'body.inla-left-nav-open nav.inla-left-nav .inla-left-nav__hotspot {',
    '  background: rgba(15, 39, 67, 0.18);',
    '}',
    'nav.inla-left-nav .inla-left-nav__panel {',
    '  position: absolute;',
    '  top: 0;',
    '  left: 0;',
    '  height: 100%;',
    '  width: 260px;',
    '  padding: 28px 22px 32px;',
    '  background: #0f2743;',
    '  color: #f6f7fb;',
    '  transform: translateX(-100%);',
    '  transition: transform 0.25s ease;',
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: 24px;',
    '  box-shadow: 4px 0 16px rgba(15, 39, 67, 0.35);',
    '}',
    'nav.inla-left-nav:hover .inla-left-nav__panel,',
    'nav.inla-left-nav:focus-within .inla-left-nav__panel,',
    'body.inla-left-nav-open nav.inla-left-nav .inla-left-nav__panel {',
    '  transform: translateX(0);',
    '}',
    '.inla-left-nav__brand a {',
    '  color: #bbcf32;',
    '  text-decoration: none;',
    '  font-weight: 700;',
    '  font-size: 1.15rem;',
    '  letter-spacing: 0.3px;',
    '}',
    '.inla-left-nav__close {',
    '  margin-left: auto;',
    '  display: none;',
    '  padding: 6px 12px;',
    '  border: 1px solid rgba(255, 255, 255, 0.35);',
    '  border-radius: 6px;',
    '  background: transparent;',
    '  color: #f6f7fb;',
    '  font-size: 0.85rem;',
    '  cursor: pointer;',
    '}',
    '.inla-left-nav__close:hover {',
    '  background: rgba(255, 255, 255, 0.08);',
    '}',
    '.inla-left-nav__list {',
    '  list-style: none;',
    '  margin: 0;',
    '  padding: 0;',
    '  display: flex;',
    '  flex-direction: column;',
    '  gap: 10px;',
    '  overflow-y: auto;',
    '}',
    '.inla-left-nav__list li {',
    '  margin: 0;',
    '}',
    '.inla-left-nav__list a {',
    '  display: block;',
    '  padding: 10px 12px;',
    '  border-radius: 8px;',
    '  color: inherit;',
    '  text-decoration: none;',
    '  font-weight: 500;',
    '  transition: background 0.2s ease, color 0.2s ease;',
    '}',
    '.inla-left-nav__list a:hover {',
    '  background: rgba(255, 255, 255, 0.1);',
    '}',
    '.inla-left-nav__list a.is-active {',
    '  background: rgba(187, 207, 50, 0.22);',
    '  color: #bbcf32;',
    '}',
    '@media (max-width: 1024px) {',
    '  nav.inla-left-nav {',
    '    width: 32px;',
    '  }',
    '  nav.inla-left-nav .inla-left-nav__hotspot {',
    '    width: 32px;',
    '  }',
    '}',
    '@media (max-width: 900px) {',
    '  nav.inla-left-nav {',
    '    width: 0;',
    '  }',
    '  nav.inla-left-nav .inla-left-nav__hotspot {',
    '    width: 44px;',
    '  }',
    '  nav.inla-left-nav .inla-left-nav__panel {',
    '    width: min(320px, 85vw);',
    '  }',
    '  .inla-left-nav__close {',
    '    display: inline-flex;',
    '    align-items: center;',
    '    gap: 4px;',
    '  }',
    '}',
    '@media (max-width: 640px) {',
    '  nav.inla-left-nav .inla-left-nav__panel {',
    '    width: min(360px, 92vw);',
    '  }',
    '}',
    '@media (prefers-reduced-motion: reduce) {',
    '  nav.inla-left-nav .inla-left-nav__panel,',
    '  nav.inla-left-nav .inla-left-nav__hotspot {',
    '    transition: none;',
    '  }',
    '}'
  ].join('\n');

  document.head.appendChild(style);

  function init() {
    createLeftNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
