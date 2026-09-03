load('tests/helpers.js');
load('src/checker.js');
load('src/problems.js');
load('src/generators.js');
load('src/figures.js');

// figures.js builds strings, so it runs under jsc like everything else. The
// failure it exists to catch is a coordinate coming out NaN: the SVG still
// renders, just with the offending line or arc silently missing.
function bad(svg) {
  return /NaN|undefined|Infinity/.test(svg);
}

check('no figure renders as empty string', renderFigure(null), '');
check('an unknown shape renders nothing', renderFigure({ shape: 'nope' }), '');

// --- every authored figure draws cleanly and names its own points
var broken = 0, missingLabel = 0, notSvg = 0;
for (var i = 0; i < PROBLEMS.length; i++) {
  var p = PROBLEMS[i];
  if (!p.figure) continue;
  var svg = renderFigure(p.figure);
  if (bad(svg)) { broken += 1; print('  bad coordinates: ' + p.id); }
  if (svg.indexOf('<svg') !== 0) notSvg += 1;

  // Every letter the figure is supposed to label must appear in the output.
  var want = [];
  if (p.figure.names) want = want.concat(p.figure.names);
  if (p.figure.left && p.figure.left.join) want = want.concat(p.figure.left);
  if (p.figure.right && p.figure.right.join) want = want.concat(p.figure.right);
  if (p.figure.vertex) want.push(p.figure.vertex);
  if (p.figure.rays) {
    for (var r = 0; r < p.figure.rays.length; r++) {
      if (p.figure.rays[r].label) want.push(p.figure.rays[r].label);
    }
  }
  for (var w = 0; w < want.length; w++) {
    if (svg.indexOf('>' + want[w] + '<') === -1) {
      missingLabel += 1;
      print('  label missing from ' + p.id + ': ' + want[w]);
    }
  }
}
check('authored figures have clean coordinates', broken, 0);
check('authored figures are svg elements', notSvg, 0);
check('authored figures label every named point', missingLabel, 0);

// --- and so does every figure the generators can produce
var genBroken = 0, genEmpty = 0;
for (var t = 0; t < TYPES.length; t++) {
  var rng = makeRng(300 + t);
  for (var n = 0; n < 120; n++) {
    var gp = generate(TYPES[t], rng);
    if (!gp.figure) continue;
    var gsvg = renderFigure(gp.figure);
    if (bad(gsvg)) {
      genBroken += 1;
      print('  bad coordinates: ' + TYPES[t] + ' ' + JSON.stringify(gp.figure));
    }
    if (gsvg === '') genEmpty += 1;
  }
}
check('generated figures have clean coordinates', genBroken, 0);
check('every generated figure renders something', genEmpty, 0);

// --- the three shapes each draw their distinguishing marks
var seg = renderFigure({ shape: 'segment', names: ['K', 'L', 'M'], at: 0.45,
                         left: '2x − 2', right: '2x − 7', total: '11' });
check('segment draws three points', (seg.match(/class="dot"/g) || []).length, 3);
check('segment shows the total', seg.indexOf('>11<') !== -1, true);
check('segment shows both pieces',
      seg.indexOf('2x − 2') !== -1 && seg.indexOf('2x − 7') !== -1, true);

var rays = renderFigure({ shape: 'rays', vertex: 'B',
  rays: [{ deg: 105, label: 'C' }, { deg: 62, label: 'W' }, { deg: -58, label: 'A' }],
  arcs: [{ from: 0, to: 1, label: '48°' }, { from: 1, to: 2, label: 'x' }] });
check('three rays are drawn', (rays.match(/class="fray"/g) || []).length, 3);
check('two arcs are drawn', (rays.match(/class="farc"/g) || []).length, 2);
check('arc labels appear', rays.indexOf('48°') !== -1, true);
check('the vertex is labelled', rays.indexOf('>B<') !== -1, true);

// A bisector gets a dashed middle ray, so the picture says which ray does the
// bisecting rather than leaving the reader to guess from the arcs.
var bis = renderFigure({ shape: 'rays', vertex: 'D',
  rays: [{ deg: 100, label: 'B' }, { deg: 50, label: 'P' }, { deg: 0, label: 'C' }],
  arcs: [{ from: 0, to: 1, label: '1' }, { from: 1, to: 2, label: '2' }],
  bisected: true });
check('the bisecting ray is marked', bis.indexOf('fbisector') !== -1, true);
check('a plain angle has no bisector mark', rays.indexOf('fbisector'), -1);

// A straight angle is the degenerate case: 180 degrees apart, still one arc.
var straight = renderFigure({ shape: 'rays',
  rays: [{ deg: 0 }, { deg: 180 }], arcs: [{ from: 0, to: 1 }] });
check('a straight angle still draws its arc',
      (straight.match(/class="farc"/g) || []).length, 1);
check('a straight angle has clean coordinates', bad(straight), false);

var tri = renderFigure({ shape: 'triangles',
                         left: ['D', 'E', 'C'], right: ['L', 'K', 'M'] });
check('two triangles are drawn', (tri.match(/<polygon/g) || []).length, 2);
// 1 + 2 + 3 ticks per triangle, both triangles: the marks that carry the
// correspondence. If these ever stop matching, the question is unanswerable.
check('twelve side ticks', (tri.match(/class="ftick"/g) || []).length, 12);
check('twelve angle arcs', (tri.match(/class="farc"/g) || []).length, 12);
check('all six vertices are labelled',
      ['D', 'E', 'C', 'L', 'K', 'M'].filter(function (c) {
        return tri.indexOf('>' + c + '<') !== -1;
      }).length, 6);

// --- the two triangles must really be congruent, not merely captioned so.
// The right one is the left one rotated, so the three side lengths match.
function sides(polygon) {
  var pts = polygon.split('"')[1].split(' ').map(function (p) {
    return p.split(',').map(Number);
  });
  var out = [];
  for (var i = 0; i < 3; i++) {
    var a = pts[i], b = pts[(i + 1) % 3];
    out.push(Math.round(Math.sqrt(Math.pow(a[0] - b[0], 2) +
                                  Math.pow(a[1] - b[1], 2))));
  }
  return out;
}
var polys = tri.match(/<polygon points="[^"]+"/g);
check('left and right triangles are congruent',
      sides(polys[0]).join(','), sides(polys[1]).join(','));

// --- labels are escaped, not injected. Letters come from data files today,
// but nothing about the renderer should depend on that staying true.
var evil = renderFigure({ shape: 'segment', names: ['<b>', 'L', 'M'],
                          left: '1', right: '2', total: '3' });
check('labels are escaped', evil.indexOf('<b>'), -1);
check('escaped form is present', evil.indexOf('&lt;b&gt;') !== -1, true);

// --- no label may run outside its own viewBox. A ray pointing straight down
// puts its label at the very bottom of the box, and two pixels over the edge
// is a clipped letter in the browser and nothing at all in a test that only
// looks for NaN. Text width is approximated -- the point is to catch a label
// that escapes by a lot, and the near-misses that were actually happening.
function labelEscapes(svg) {
  var vb = /viewBox="0 0 (\d+) (\d+)"/.exec(svg);
  if (!vb) return 1;
  var W = parseInt(vb[1], 10), H = parseInt(vb[2], 10);
  var re = /<text x="([-\d.]+)" y="([-\d.]+)" class="([^"]*)">([^<]*)<\/text>/g;
  var m, bad = 0;
  while ((m = re.exec(svg)) !== null) {
    var x = parseFloat(m[1]), y = parseFloat(m[2]);
    var size = m[3].indexOf('fmeasure') !== -1 ? 14 : 15;
    var half = m[4].length * size * 0.28;   // middle-anchored
    if (x - half < 0 || x + half > W) bad += 1;
    if (y - size > H || y - size < -2 || y + 3 > H) bad += 1;
  }
  return bad;
}

var escaped = 0;
for (var e = 0; e < PROBLEMS.length; e++) {
  if (!PROBLEMS[e].figure) continue;
  var n = labelEscapes(renderFigure(PROBLEMS[e].figure));
  if (n) { escaped += n; print('  label outside the viewBox: ' + PROBLEMS[e].id); }
}
check('authored figures keep their labels inside the box', escaped, 0);

var genEscaped = 0;
for (var gt = 0; gt < TYPES.length; gt++) {
  var grng = makeRng(500 + gt);
  for (var gn = 0; gn < 80; gn++) {
    var gpp = generate(TYPES[gt], grng);
    if (!gpp.figure) continue;
    var gnn = labelEscapes(renderFigure(gpp.figure));
    if (gnn) {
      genEscaped += gnn;
      print('  label outside the viewBox: ' + TYPES[gt] + ' ' +
            JSON.stringify(gpp.figure).slice(0, 120));
    }
  }
}
check('generated figures keep their labels inside the box', genEscaped, 0);

done('figures');
