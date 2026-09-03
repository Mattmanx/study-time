// SVG for the three kinds of picture this test asks about. Test #1's figures
// were all coordinate planes; none of that is reusable here.
//
// Every figure is built from a spec the generators can vary, so a drilled
// variant gets a real picture rather than the study guide's one drawing:
//   { shape: 'segment',   names, at, left, right, total }
//   { shape: 'rays',      vertex, rays: [{deg,label}], arcs: [{from,to,label}] }
//   { shape: 'triangles', left: [3 letters], right: [3 letters] }
//
// Angles are in degrees, measured the way a protractor does: 0 is east and
// they increase counter-clockwise. SVG's y axis points down, so every y goes
// through a negation on the way out.
(function () {
  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function txt(x, y, s, cls) {
    return '<text x="' + r(x) + '" y="' + r(y) + '" class="' +
           (cls || 'flabel') + '">' + esc(s) + '</text>';
  }

  function r(n) { return Math.round(n * 100) / 100; }

  function svg(w, h, inner, alt) {
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" width="' + w +
           '" height="' + h + '" role="img" aria-label="' + esc(alt) + '">' +
           '<defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" ' +
           'markerWidth="6" markerHeight="6" orient="auto-start-reverse">' +
           '<path d="M 0 0 L 10 5 L 0 10 z" class="head"/></marker></defs>' +
           inner + '</svg>';
  }

  // ---- Collinear points, for the Segment Addition Postulate.
  function segmentSvg(f) {
    var W = 320, H = 150, x0 = 40, x1 = 280, y = 62;
    var at = f.at === undefined ? 0.5 : f.at;
    var xm = x0 + (x1 - x0) * at;
    var out = [];

    out.push('<line x1="' + x0 + '" y1="' + y + '" x2="' + x1 + '" y2="' + y +
             '" class="fline"/>');
    var xs = [x0, xm, x1];
    for (var i = 0; i < 3; i++) {
      out.push('<circle cx="' + r(xs[i]) + '" cy="' + y + '" r="4" class="dot"/>');
      out.push(txt(xs[i], y - 14, f.names[i], 'flabel mid'));
    }
    // Piece measures sit above their own piece, the total below the whole.
    if (f.left) out.push(txt((x0 + xm) / 2, y - 32, f.left, 'fmeasure mid'));
    if (f.right) out.push(txt((xm + x1) / 2, y - 32, f.right, 'fmeasure mid'));
    if (f.total) {
      var yb = y + 34;
      out.push('<line x1="' + x0 + '" y1="' + yb + '" x2="' + x1 + '" y2="' + yb +
               '" class="fmeasureline" marker-start="url(#ah)" marker-end="url(#ah)"/>');
      out.push('<line x1="' + x0 + '" y1="' + y + '" x2="' + x0 + '" y2="' + (yb + 6) + '" class="ftick"/>');
      out.push('<line x1="' + x1 + '" y1="' + y + '" x2="' + x1 + '" y2="' + (yb + 6) + '" class="ftick"/>');
      out.push(txt((x0 + x1) / 2, yb + 24, f.total, 'fmeasure mid'));
    }
    return svg(W, H, out.join(''), 'Points ' + f.names.join(', ') +
               ' on a line');
  }

  // ---- Rays from one vertex. Covers naming, classifying, the Angle
  // Addition Postulate and bisectors -- they differ only in labels and arcs.
  var CX = 165, CY = 160, RAY = 118;

  function px(deg, len) { return CX + Math.cos(deg * Math.PI / 180) * len; }
  function py(deg, len) { return CY - Math.sin(deg * Math.PI / 180) * len; }

  // Counter-clockwise sweep from a to b, always in [0, 360).
  function sweep(a, b) {
    var d = (b - a) % 360;
    return d < 0 ? d + 360 : d;
  }

  function raysSvg(f) {
    // H leaves room for a ray label pointing straight down: those sit at
    // RAY + 16 from a centre 160 down, and the text baseline is 5 lower again.
    var W = 330, H = 316, out = [], i;
    var rays = f.rays, arcs = f.arcs || [];

    for (i = 0; i < rays.length; i++) {
      var deg = rays[i].deg;
      var cls = 'fray' + (f.bisected && i === 1 ? ' fbisector' : '');
      out.push('<line x1="' + CX + '" y1="' + CY + '" x2="' + r(px(deg, RAY)) +
               '" y2="' + r(py(deg, RAY)) + '" class="' + cls +
               '" marker-end="url(#ah)"/>');
      if (rays[i].label) {
        out.push(txt(px(deg, RAY + 16), py(deg, RAY + 16) + 5,
                     rays[i].label, 'flabel mid'));
      }
    }

    // Each arc sits a little further out than the last so two adjacent
    // angles at the same vertex do not draw on top of each other.
    for (i = 0; i < arcs.length; i++) {
      var arc = arcs[i];
      var a = rays[arc.from].deg, b = rays[arc.to].deg;
      var span = sweep(a, b);
      // Draw whichever way round is the angle actually being marked.
      if (span > 180) { var t = a; a = b; b = t; span = sweep(a, b); }
      var rad = 38 + i * 22;
      var large = span > 180 ? 1 : 0;
      out.push('<path d="M ' + r(px(a, rad)) + ' ' + r(py(a, rad)) +
               ' A ' + rad + ' ' + rad + ' 0 ' + large + ' 0 ' +
               r(px(b, rad)) + ' ' + r(py(b, rad)) + '" class="farc"/>');
      if (arc.label) {
        var midDeg = a + span / 2;
        // A label sits on the bisector of its arc, so half of it has to fit
        // inside half the arc's angle. On a narrow arc that is only possible
        // further out: at radius r a label of half-width w needs
        // w / tan(span/2) of clearance, or it crosses one of the two rays.
        // "3x + 4" inside a 31 degree angle is the case that forces this.
        var halfWidth = String(arc.label).length * 3.75;
        var halfSpan = Math.max(span, 12) / 2 * Math.PI / 180;
        var needed = halfWidth / Math.tan(halfSpan) + 8;
        // Capped short of the rays themselves, whose own labels sit further
        // out again at RAY + 16.
        var lrad = Math.min(Math.max(rad + 18 + halfWidth, needed), 106);
        out.push(txt(px(midDeg, lrad), py(midDeg, lrad) + 4,
                     arc.label, 'fmeasure mid'));
      }
    }

    if (f.vertex) {
      out.push('<circle cx="' + CX + '" cy="' + CY + '" r="4" class="dot"/>');
      out.push(txt(CX - 14, CY + 18, f.vertex, 'flabel mid'));
    }
    return svg(W, H, out.join(''), 'An angle formed by rays from a vertex');
  }

  // ---- Two congruent triangles. The right one is the left one rotated, so
  // the picture really is congruent rather than merely captioned that way,
  // and the correspondence has to be read off the marks instead of off the
  // position on the page.
  var TRI = [[0, -58], [-56, 38], [62, 38]];
  var ROT = 145;

  function place(pts, cx, cy, deg) {
    var t = deg * Math.PI / 180, c = Math.cos(t), s = Math.sin(t);
    return pts.map(function (p) {
      return [cx + p[0] * c - p[1] * s, cy + p[0] * s + p[1] * c];
    });
  }

  // Marks run 1, 2, 3 so a reader can pair sides and angles by counting.
  function sideTicks(p, q, n) {
    var mx = (p[0] + q[0]) / 2, my = (p[1] + q[1]) / 2;
    var dx = q[0] - p[0], dy = q[1] - p[1];
    var len = Math.sqrt(dx * dx + dy * dy) || 1;
    var ux = dx / len, uy = dy / len;      // along the side
    var nx = -uy, ny = ux;                 // across it
    var out = [];
    for (var i = 0; i < n; i++) {
      var off = (i - (n - 1) / 2) * 6;
      var bx = mx + ux * off, by = my + uy * off;
      out.push('<line x1="' + r(bx - nx * 6) + '" y1="' + r(by - ny * 6) +
               '" x2="' + r(bx + nx * 6) + '" y2="' + r(by + ny * 6) +
               '" class="ftick"/>');
    }
    return out.join('');
  }

  function angleArcs(v, a, b, n) {
    function unit(p) {
      var dx = p[0] - v[0], dy = p[1] - v[1];
      var l = Math.sqrt(dx * dx + dy * dy) || 1;
      return [dx / l, dy / l];
    }
    var ua = unit(a), ub = unit(b), out = [];
    for (var i = 0; i < n; i++) {
      var rad = 13 + i * 5;
      out.push('<path d="M ' + r(v[0] + ua[0] * rad) + ' ' + r(v[1] + ua[1] * rad) +
               ' A ' + rad + ' ' + rad + ' 0 0 0 ' +
               r(v[0] + ub[0] * rad) + ' ' + r(v[1] + ub[1] * rad) +
               '" class="farc"/>');
    }
    return out.join('');
  }

  function oneTriangle(pts, names) {
    var out = [], i;
    out.push('<polygon points="' + pts.map(function (p) {
      return r(p[0]) + ',' + r(p[1]);
    }).join(' ') + '" class="ftri"/>');

    // Sides: 0-1 one tick, 0-2 two, 1-2 three.
    out.push(sideTicks(pts[0], pts[1], 1));
    out.push(sideTicks(pts[0], pts[2], 2));
    out.push(sideTicks(pts[1], pts[2], 3));

    // Angles: vertex 0 one arc, vertex 1 two, vertex 2 three.
    out.push(angleArcs(pts[0], pts[1], pts[2], 1));
    out.push(angleArcs(pts[1], pts[2], pts[0], 2));
    out.push(angleArcs(pts[2], pts[0], pts[1], 3));

    // Push each label outward from the triangle's centre so it clears the arcs.
    var gx = (pts[0][0] + pts[1][0] + pts[2][0]) / 3;
    var gy = (pts[0][1] + pts[1][1] + pts[2][1]) / 3;
    for (i = 0; i < 3; i++) {
      var dx = pts[i][0] - gx, dy = pts[i][1] - gy;
      var l = Math.sqrt(dx * dx + dy * dy) || 1;
      out.push(txt(pts[i][0] + (dx / l) * 18, pts[i][1] + (dy / l) * 18 + 5,
                   names[i], 'flabel mid'));
    }
    return out.join('');
  }

  function trianglesSvg(f) {
    var W = 380, H = 210;
    var left = place(TRI, 100, 100, 0);
    var right = place(TRI, 275, 100, ROT);
    return svg(W, H, oneTriangle(left, f.left) + oneTriangle(right, f.right),
               'Two congruent triangles, ' + f.left.join('') + ' and ' +
               f.right.join(''));
  }

  function renderFigure(f) {
    if (!f) return '';
    if (f.shape === 'segment') return segmentSvg(f);
    if (f.shape === 'rays') return raysSvg(f);
    if (f.shape === 'triangles') return trianglesSvg(f);
    return '';
  }

  globalThis.renderFigure = renderFigure;
})();
