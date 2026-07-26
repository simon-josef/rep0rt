(function () {
  var KATEX_OPTS = {
    delimiters: [
      { left: "$$", right: "$$", display: true },
      { left: "\\[", right: "\\]", display: true },
      { left: "$", right: "$", display: false },
      { left: "\\(", right: "\\)", display: false }
    ],
    throwOnError: false
  };

  var FIG_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/>' +
    '<circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5L5 20"/></svg>';

  function apaAuthorOne(name) {
    var parts = name.trim().split(/\s+/);
    var last = parts.pop();
    return last + ", " + parts.join(" ");
  }

  // APA 7: "Last, F." / "Last, F., & Last2, G." / "Last, F., Last2, G., & Last3, H."
  function apaAuthors(authors) {
    var formatted = authors.map(function (a) { return apaAuthorOne(a.name); });
    if (formatted.length === 1) return formatted[0];
    if (formatted.length === 2) return formatted[0] + ", & " + formatted[1];
    return formatted.slice(0, -1).join(", ") + ", & " + formatted[formatted.length - 1];
  }

  // Plain-prose byline: "A" / "A & B" / "A, B & C"
  function displayAuthors(authors) {
    var names = authors.map(function (a) { return a.name; });
    if (names.length === 1) return names[0];
    if (names.length === 2) return names[0] + " & " + names[1];
    return names.slice(0, -1).join(", ") + " & " + names[names.length - 1];
  }

  // Dedups affiliations across authors and assigns each a footnote number,
  // matching the superscript convention of a real journal byline.
  function buildAffiliations(authors) {
    var list = [];
    var indexOf = {};
    authors.forEach(function (a) {
      if (!(a.affiliation in indexOf)) {
        indexOf[a.affiliation] = list.length + 1;
        list.push(a.affiliation);
      }
    });
    return { list: list, indexOf: indexOf };
  }

  // "J. Okafor¹*, R. Beaumont²" — comma-separated with superscript
  // affiliation numbers, matching the actual journal convention (not the
  // "&"-joined plain-prose byline used elsewhere).
  function authorsWithSuperscripts(authors, affIndexOf) {
    return authors.map(function (a) {
      var sup = String(affIndexOf[a.affiliation]) + (a.corresponding ? "," + CORRESPONDING_MARK : "");
      return escapeHtml(a.name) + "<sup>" + sup + "</sup>";
    }).join(", ");
  }

  var CORRESPONDING_MARK = "*";

  function escapeHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  }

  function formatDateLong(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  // Matches the <option> list in submit.html's discipline picker.
  var DISCIPLINE_NAMES = {
    psy: "Psychology", cogsci: "Cognitive Science", neuro: "Neuroscience",
    physics: "Physics", chem: "Chemistry", bio: "Biology", med: "Medicine",
    cs: "Computer Science", stat: "Statistics", math: "Mathematics",
    econ: "Economics", soc: "Sociology", ling: "Linguistics", hist: "History",
    polisci: "Political Science", phil: "Philosophy", anthro: "Anthropology",
    edu: "Education", env: "Environmental Science", eng: "Engineering", other: "Other"
  };

  var params = new URLSearchParams(window.location.search);
  var id = params.get("id");
  var report = (window.REP0RT_DATA || []).find(function (r) { return r.id === id; });

  if (!report) {
    document.getElementById("notfound-state").hidden = false;
    return;
  }

  var body = window.REP0RT_CODEC.decode(report.bodyEncoded);

  document.title = "Rep0rt — " + report.title;
  document.getElementById("found-state").hidden = false;

  document.getElementById("r-discipline").textContent = "Rep0rt." + report.discipline;

  var dataBadge = document.getElementById("r-data-badge");
  dataBadge.classList.toggle("available", !!report.dataAvailable);
  document.getElementById("r-data-label").textContent = report.dataAvailable ? "Data available" : "No data shared";

  document.getElementById("r-title").textContent = report.title;
  document.getElementById("r-date").textContent = formatDateLong(report.date);

  var affil = buildAffiliations(report.authors);
  document.getElementById("r-author").innerHTML = authorsWithSuperscripts(report.authors, affil.indexOf);

  var affilEl = document.getElementById("r-affiliations");
  var correspondingAuthor = report.authors.filter(function (a) { return a.corresponding; })[0];
  var affilHtml = affil.list.map(function (name, i) {
    return '<span class="aff-line"><sup>' + (i + 1) + "</sup> " + escapeHtml(name) + "</span>";
  }).join("");
  if (correspondingAuthor) {
    affilHtml += '<span class="aff-line"><sup>' + CORRESPONDING_MARK + "</sup> Corresponding author: " +
      escapeHtml(correspondingAuthor.name) + " (" + escapeHtml(correspondingAuthor.email) + ")</span>";
  }
  affilEl.innerHTML = affilHtml;

  var tagsEl = document.getElementById("r-tags");
  report.tags.forEach(function (t) {
    var span = document.createElement("span");
    span.className = "tag";
    span.textContent = t;
    tagsEl.appendChild(span);
  });

  var sectionIds = ["r-abstract", "r-theory", "r-hypothesis", "r-results", "r-reflections"];
  var sectionKeys = ["abstract", "theory", "hypothesis", "results", "reflections"];
  sectionIds.forEach(function (elId, i) {
    var el = document.getElementById(elId);
    el.textContent = body[sectionKeys[i]] || "";
    if (window.REP0RT_DECOY) REP0RT_DECOY.surround(el);
  });

  // Literature renders as a real APA-style reference list (hanging indent
  // per entry), not a single semicolon-separated blob.
  var literatureEl = document.getElementById("r-literature");
  (body.literature || []).forEach(function (ref) {
    var p = document.createElement("p");
    p.className = "ref-entry";
    p.textContent = ref;
    literatureEl.appendChild(p);
  });
  if (window.REP0RT_DECOY) REP0RT_DECOY.surround(literatureEl);

  // Figures follow APA order: "Figure N" then an italicized caption, both
  // above the image.
  var figuresEl = document.getElementById("r-figures");
  (body.figures || []).forEach(function (caption, i) {
    var fig = document.createElement("div");
    fig.className = "figure";

    var label = document.createElement("p");
    label.className = "fig-label";
    label.textContent = "Figure " + (i + 1);

    var cap = document.createElement("p");
    cap.className = "fig-caption";
    cap.textContent = caption;

    var ph = document.createElement("div");
    ph.className = "ph";
    ph.innerHTML = FIG_ICON;

    fig.appendChild(label);
    fig.appendChild(cap);
    fig.appendChild(ph);
    figuresEl.appendChild(fig);
  });
  if (!(body.figures || []).length) {
    figuresEl.parentElement.hidden = true;
  }

  if (window.REP0RT_COMMENTS) REP0RT_COMMENTS.init(report.authors[0].name);

  if (window.renderMathInElement) {
    renderMathInElement(document.getElementById("pdf-content"), KATEX_OPTS);
  }

  // --- PDF export --------------------------------------------------------
  // Drawn directly with jsPDF's own vector text/shape primitives — no HTML,
  // no CSS, no html2canvas. Every bug this session (blank pages, clipped
  // URLs, corrupted margins) came from html2canvas re-implementing layout
  // to rasterize HTML; drawing text/boxes at coordinates I compute myself
  // has no such layer to fail. Auto-downloads via doc.save(), same as
  // before, no print dialog involved.
  var PAGE_W = 595.28, PAGE_H = 841.89, MARGIN = 72;
  var CONTENT_W = PAGE_W - MARGIN * 2;
  var COL_GAP = 16;
  var COL_W = (CONTENT_W - COL_GAP) / 2;
  var INK = [17, 17, 17], MUTED = [85, 85, 85], HINT = [119, 119, 119];
  var ACCENT = [31, 95, 166], LINE_GRAY = [153, 153, 153], BOX_BG = [247, 247, 245], PH_BG = [244, 244, 242];

  // Only ¹²³ have real glyphs in jsPDF's base WinAnsi-encoded fonts; other
  // unicode super/subscript digits (⁴⁻⁹, all of ₀-₉) don't and would
  // render as blank boxes, so anything outside that safe set falls back
  // to plain "^x" / "_x" notation instead of risking missing glyphs.
  var SAFE_SUP = { "1": "¹", "2": "²", "3": "³" };

  var MATH_SYMBOLS = {
    "\\times": "×", "\\approx": "≈", "\\pm": "±", "\\leq": "≤",
    "\\geq": "≥", "\\neq": "≠", "\\cdot": "·", "\\infty": "∞",
    "\\rightarrow": "→", "\\sim": "~", "\\%": "%", "\\&": "&"
  };
  var MATH_GREEK = {
    alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε",
    theta: "θ", lambda: "λ", mu: "μ", pi: "π", sigma: "σ",
    tau: "τ", phi: "φ", chi: "χ", psi: "ψ", omega: "ω",
    Delta: "Δ", Sigma: "Σ", Omega: "Ω", Gamma: "Γ", Lambda: "Λ",
    Pi: "Π", Phi: "Φ", Psi: "Ψ", Theta: "Θ"
  };

  function superscriptify(inner) { return SAFE_SUP[inner] || ("^" + inner); }
  function subscriptify(inner) { return "_" + inner; }

  // Converts the LaTeX snippets in report bodies ($p = 0.61$, $10^3$, ...)
  // to a clean plain-text/unicode approximation, since jsPDF draws literal
  // vector text, not typeset math. Simple exponents render as real unicode
  // superscripts (10³); anything else degrades to readable "^x" / "_x"
  // notation rather than guessing at a rendering that might not exist.
  function texToPlain(str) {
    return String(str || "").replace(
      /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([^$]+?)\$|\\\(([\s\S]+?)\\\)/g,
      function (_, a, b, c, d) {
        var s = a || b || c || d;
        Object.keys(MATH_SYMBOLS).forEach(function (k) { s = s.split(k).join(MATH_SYMBOLS[k]); });
        s = s.replace(/\\([A-Za-z]+)/g, function (_, name) { return MATH_GREEK[name] || name; });
        s = s.replace(/_\{([^}]*)\}/g, function (_, inner) { return subscriptify(inner); });
        s = s.replace(/_([A-Za-z0-9])/g, function (_, ch) { return subscriptify(ch); });
        s = s.replace(/\^\{([^}]*)\}/g, function (_, inner) { return superscriptify(inner); });
        s = s.replace(/\^([A-Za-z0-9])/g, function (_, ch) { return superscriptify(ch); });
        return s.replace(/\{|\}/g, "");
      }
    );
  }

  function makeWriter(doc) {
    return {
      doc: doc,
      y: MARGIN,
      ensure: function (h) {
        if (this.y + h > PAGE_H - MARGIN) { this.doc.addPage(); this.y = MARGIN; }
      },
      rule: function (color, weight) {
        this.doc.setDrawColor.apply(this.doc, color);
        this.doc.setLineWidth(weight);
        this.doc.line(MARGIN, this.y, PAGE_W - MARGIN, this.y);
      },
      // Wraps + draws a paragraph, paginating mid-paragraph if needed.
      paragraph: function (text, opts) {
        opts = opts || {};
        var size = opts.size || 11, style = opts.style || "normal";
        var color = opts.color || INK, align = opts.align || "left";
        var width = opts.width || CONTENT_W, x = opts.x != null ? opts.x : MARGIN;
        var lineHeight = size * (opts.leading || 1.45);
        this.doc.setFont("times", style);
        this.doc.setFontSize(size);
        var lines = text ? this.doc.splitTextToSize(texToPlain(text), width) : [];
        var self = this;
        lines.forEach(function (line) {
          self.ensure(lineHeight);
          self.doc.setFont("times", style);
          self.doc.setFontSize(size);
          self.doc.setTextColor.apply(self.doc, color);
          self.doc.text(line, align === "center" ? x + width / 2 : x, self.y, { align: align });
          self.y += lineHeight;
        });
        return lines.length * lineHeight;
      },
      heading: function (text) {
        this.ensure(28);
        this.y += 16;
        this.doc.setFont("times", "bold");
        this.doc.setFontSize(11.5);
        this.doc.setTextColor.apply(this.doc, INK);
        this.doc.text(text, MARGIN, this.y);
        this.y += 5;
        this.rule(ACCENT, 1);
        this.y += 12;
      }
    };
  }

  function drawWordmark(w, x, y, size) {
    var doc = w.doc;
    doc.setFont("times", "bolditalic");
    doc.setFontSize(size);
    doc.setTextColor.apply(doc, INK);
    doc.text("Rep", x, y);
    var wRep = doc.getTextWidth("Rep");
    doc.setTextColor.apply(doc, ACCENT);
    doc.text("0", x + wRep, y);
    var w0 = doc.getTextWidth("0");
    doc.setTextColor.apply(doc, INK);
    doc.text("rt", x + wRep + w0, y);
  }

  function generatePdf(report, body) {
    var doc = new window.jspdf.jsPDF({ unit: "pt", format: "a4" });
    var w = makeWriter(doc);

    // Masthead: accent bar, wordmark + discipline, rule.
    doc.setFillColor.apply(doc, ACCENT);
    doc.rect(MARGIN, w.y, CONTENT_W, 4, "F");
    w.y += 22;
    drawWordmark(w, MARGIN, w.y, 17);
    doc.setFont("times", "normal");
    doc.setFontSize(9);
    doc.setTextColor.apply(doc, MUTED);
    doc.text(DISCIPLINE_NAMES[report.discipline] || report.discipline, PAGE_W - MARGIN, w.y, { align: "right" });
    w.y += 8;
    w.rule(INK, 0.75);
    w.y += 24;

    w.paragraph("An open, community-moderated record of results that would otherwise go unwritten",
      { size: 8.5, style: "italic", color: MUTED, align: "center" });
    w.y += 8;

    // Title / author block, centered.
    w.paragraph(report.title, { size: 16.5, style: "bold", align: "center", leading: 1.3 });
    w.y += 4;

    var affil = buildAffiliations(report.authors);
    var authorLine = report.authors.map(function (a) {
      var num = affil.indexOf[a.affiliation];
      return a.name + (SAFE_SUP[String(num)] || num) + (a.corresponding ? ",*" : "");
    }).join(", ");
    w.paragraph(authorLine, { size: 11.5, align: "center" });
    w.y += 2;

    var corresponding = report.authors.filter(function (a) { return a.corresponding; })[0];
    affil.list.forEach(function (name, i) {
      w.paragraph((SAFE_SUP[String(i + 1)] || (i + 1)) + " " + name,
        { size: 8.5, color: MUTED, align: "center" });
    });
    if (corresponding) {
      w.paragraph("* Corresponding author: " + corresponding.name + " (" + corresponding.email + ")",
        { size: 8.5, color: MUTED, align: "center" });
    }
    w.y += 18;

    // Two-column Article Info / Abstract box (Elsevier-style front matter).
    doc.setFont("times", "normal"); doc.setFontSize(9);
    var infoValues = [
      formatDateLong(report.date),
      report.dataAvailable ? "Yes — available" : "No — not shared",
      report.tags.join(", ")
    ];
    var infoLabels = ["SUBMITTED", "DATA AND CODE", "KEYWORDS"];
    var infoLineLists = infoValues.map(function (v) { return doc.splitTextToSize(v, COL_W - 22); });
    var leftH = 34 + infoLabels.reduce(function (sum, _, i) {
      return sum + 8 * 1.7 + infoLineLists[i].length * 9 * 1.4 + 6;
    }, 0);

    doc.setFontSize(9.5);
    var abstractLines = doc.splitTextToSize(texToPlain(body.abstract || ""), COL_W - 22);
    var rightH = 34 + abstractLines.length * (9.5 * 1.5);

    var boxH = Math.max(leftH, rightH, 100);
    w.ensure(boxH + 20);
    var boxY = w.y;
    var leftX = MARGIN, rightX = MARGIN + COL_W + COL_GAP;

    doc.setFillColor.apply(doc, BOX_BG);
    doc.setDrawColor.apply(doc, LINE_GRAY);
    doc.setLineWidth(0.75);
    doc.roundedRect(leftX, boxY, COL_W, boxH, 6, 6, "FD");
    doc.roundedRect(rightX, boxY, COL_W, boxH, 6, 6, "FD");

    function boxHeading(x, y, text) {
      doc.setFont("times", "bold"); doc.setFontSize(8.5); doc.setTextColor.apply(doc, ACCENT);
      doc.text(text, x + 11, y);
      doc.setDrawColor.apply(doc, ACCENT); doc.setLineWidth(0.75);
      doc.line(x + 11, y + 5, x + COL_W - 11, y + 5);
    }

    boxHeading(leftX, boxY + 16, "ARTICLE INFO");
    var cy = boxY + 34;
    infoLabels.forEach(function (label, i) {
      doc.setFont("times", "bold"); doc.setFontSize(8); doc.setTextColor.apply(doc, MUTED);
      doc.text(label, leftX + 11, cy);
      cy += 8 * 1.7;
      doc.setFont("times", "normal"); doc.setFontSize(9);
      doc.setTextColor.apply(doc, i === 1 ? (report.dataAvailable ? ACCENT : HINT) : INK);
      infoLineLists[i].forEach(function (line) {
        doc.text(line, leftX + 11, cy);
        cy += 9 * 1.4;
      });
      cy += 6;
    });

    boxHeading(rightX, boxY + 16, "ABSTRACT");
    var ry = boxY + 34;
    doc.setFont("times", "normal"); doc.setFontSize(9.5); doc.setTextColor.apply(doc, INK);
    abstractLines.forEach(function (line) {
      doc.text(line, rightX + 11, ry);
      ry += 9.5 * 1.5;
    });

    w.y = boxY + boxH + 22;

    // How to cite.
    w.rule([204, 204, 204], 0.75);
    w.y += 14;
    var citeStr = apaAuthors(report.authors) + " (" + report.date.slice(0, 4) + "). " +
      report.title + ". Rep0rt. " + window.location.href;
    doc.setFont("times", "bold"); doc.setFontSize(8.5); doc.setTextColor.apply(doc, INK);
    doc.text("How to cite:", MARGIN, w.y);
    var citeLabelW = doc.getTextWidth("How to cite: ");
    doc.setFont("times", "normal"); doc.setTextColor.apply(doc, MUTED);
    var citeLines = doc.splitTextToSize(texToPlain(citeStr), CONTENT_W - citeLabelW);
    citeLines.forEach(function (line, i) {
      w.ensure(8.5 * 1.5);
      doc.text(line, i === 0 ? MARGIN + citeLabelW : MARGIN, w.y);
      w.y += 8.5 * 1.5;
    });
    w.y += 10;

    // Body sections.
    [
      ["Theory and Expectations", body.theory],
      ["Hypothesis", body.hypothesis],
      ["Results", body.results],
      ["Reflections", body.reflections]
    ].forEach(function (s) {
      w.heading(s[0]);
      w.paragraph(s[1] || "", { size: 11 });
    });

    // Figures: placeholder box with "Figure N" + italic caption above it.
    if ((body.figures || []).length) {
      w.heading("Figures");
      body.figures.forEach(function (caption, i) {
        w.paragraph("Figure " + (i + 1), { size: 10.5, style: "bold" });
        w.paragraph(caption, { size: 10.5, style: "italic", color: MUTED });
        w.y += 4;
        var phH = 110;
        w.ensure(phH + 14);
        doc.setFillColor.apply(doc, PH_BG);
        doc.setDrawColor.apply(doc, LINE_GRAY);
        doc.setLineWidth(0.75);
        doc.roundedRect(MARGIN, w.y, CONTENT_W, phH, 6, 6, "FD");
        w.y += phH + 14;
      });
    }

    // References, two columns.
    w.heading("References");
    var refs = body.literature || [];
    var splitAt = Math.ceil(refs.length / 2);
    var refColW = COL_W;
    var leftRefs = refs.slice(0, splitAt), rightRefs = refs.slice(splitAt);
    var startY = w.y;
    var leftEndY = startY, rightEndY = startY;

    function drawRefColumn(list, x) {
      var y = startY;
      doc.setFont("times", "normal"); doc.setFontSize(9);
      list.forEach(function (ref) {
        var lines = doc.splitTextToSize(texToPlain(ref), refColW);
        lines.forEach(function (line) {
          if (y + 9 * 1.35 > PAGE_H - MARGIN) { doc.addPage(); y = MARGIN; }
          doc.setTextColor.apply(doc, INK);
          doc.text(line, x, y);
          y += 9 * 1.35;
        });
        y += 8;
      });
      return y;
    }
    leftEndY = drawRefColumn(leftRefs, MARGIN);
    rightEndY = drawRefColumn(rightRefs, MARGIN + COL_W + COL_GAP);
    w.y = Math.max(leftEndY, rightEndY) + 12;

    // About Rep0rt box.
    var aboutText = "Rep0rt is an open archive for results that would otherwise go unwritten. " +
      "Reports are not peer-reviewed — they are moderated by the Rep0rt community. " +
      "This document reflects the author's own account of their work.";
    doc.setFont("times", "normal"); doc.setFontSize(9);
    var aboutLines = doc.splitTextToSize(aboutText, CONTENT_W - 26);
    var aboutH = 30 + aboutLines.length * (9 * 1.5);
    w.ensure(aboutH);
    doc.setFillColor.apply(doc, BOX_BG);
    doc.setDrawColor.apply(doc, LINE_GRAY);
    doc.setLineWidth(0.75);
    doc.roundedRect(MARGIN, w.y, CONTENT_W, aboutH, 6, 6, "FD");
    doc.setFont("times", "bold"); doc.setFontSize(7.5); doc.setTextColor.apply(doc, MUTED);
    doc.text("ABOUT REP0RT", MARGIN + 13, w.y + 18);
    var ay = w.y + 34;
    doc.setFont("times", "normal"); doc.setFontSize(9); doc.setTextColor.apply(doc, [34, 34, 34]);
    aboutLines.forEach(function (line) {
      doc.text(line, MARGIN + 13, ay);
      ay += 9 * 1.5;
    });

    doc.save("rep0rt-" + report.id + ".pdf");
  }

  document.getElementById("download-pdf").addEventListener("click", function () {
    generatePdf(report, body);
  });
})();
