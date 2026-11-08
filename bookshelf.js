// Fits the 3D bookshelf to any screen. The shelf is laid out at its natural
// size and scaled down to the available width; when that would make the
// spines too small to read, the books are split across several shelves.
// Without this script, narrow screens fall back to a row of covers (style.css).
(function () {
  var shelf = document.querySelector('.bookshelf');
  if (!shelf || !window.getComputedStyle) {
    return;
  }

  var MIN_SCALE = 0.7;
  var row = shelf.querySelector('.bookshelf__row');
  var items = Array.prototype.slice.call(row.children);

  // the empty shell (frame, floor, row, board) each shelf is cloned from
  var template = shelf.cloneNode(true);
  template.querySelector('.bookshelf__row').innerHTML = '';
  template.classList.add('is-3d');

  var fit = document.createElement('div');
  fit.className = 'bookshelf-fit';
  var scaler = document.createElement('div');
  scaler.className = 'bookshelf-scaler';
  fit.appendChild(scaler);
  shelf.parentNode.replaceChild(fit, shelf);

  // natural widths, measured once inside a full-width 3D shelf
  var probe = template.cloneNode(true);
  probe.style.width = '4000px';
  scaler.appendChild(probe);
  var probeRow = probe.querySelector('.bookshelf__row');
  items.forEach(function (item) {
    probeRow.appendChild(item);
  });
  var widths = items.map(function (item) {
    var cs = getComputedStyle(item);
    return item.offsetWidth + parseFloat(cs.marginLeft) + parseFloat(cs.marginRight);
  });
  var ps = getComputedStyle(probe);
  var frame = parseFloat(ps.paddingLeft) + parseFloat(ps.paddingRight) +
    parseFloat(ps.borderLeftWidth) + parseFloat(ps.borderRightWidth);
  scaler.removeChild(probe);

  function pack(cap) {
    var rows = [[]];
    var used = 0;
    widths.forEach(function (w, i) {
      if (used + w > cap && rows[rows.length - 1].length) {
        rows.push([]);
        used = 0;
      }
      rows[rows.length - 1].push(i);
      used += w;
    });
    return rows;
  }

  function rowWidth(r) {
    return r.reduce(function (sum, i) { return sum + widths[i]; }, 0);
  }

  // fewest shelves that keep the scale readable, then even them out
  function plan(avail) {
    var total = rowWidth(widths.map(function (w, i) { return i; }));
    if (avail / (total + frame) >= MIN_SCALE) {
      return pack(Infinity);
    }
    var n = pack(Math.max(avail / MIN_SCALE - frame, Math.max.apply(null, widths))).length;
    var lo = Math.max.apply(null, widths);
    var hi = total;
    while (hi - lo > 1) {
      var mid = (lo + hi) / 2;
      if (pack(mid).length <= n) {
        hi = mid;
      } else {
        lo = mid;
      }
    }
    return pack(hi);
  }

  var lastKey = '';

  function layout() {
    var avail = fit.clientWidth;
    if (!avail) {
      return;
    }
    var rows = plan(avail);
    var key = rows.map(function (r) { return r.join(','); }).join('|');
    if (key !== lastKey) {
      lastKey = key;
      scaler.innerHTML = '';
      rows.forEach(function (r) {
        var s = template.cloneNode(true);
        var target = s.querySelector('.bookshelf__row');
        r.forEach(function (i) {
          target.appendChild(items[i]);
        });
        scaler.appendChild(s);
      });
    }
    var natural = Math.max.apply(null, rows.map(rowWidth)) + frame;
    var scale = Math.min(1, avail / natural);
    scaler.style.width = natural + 'px';
    scaler.style.transform = 'translateX(' + (avail - natural * scale) / 2 + 'px) scale(' + scale + ')';
    fit.style.height = scaler.offsetHeight * scale + 'px';
  }

  layout();
  if (window.ResizeObserver) {
    new ResizeObserver(layout).observe(fit);
  } else {
    window.addEventListener('resize', layout);
  }
})();
