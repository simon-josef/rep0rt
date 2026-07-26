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

  // The brand's zero is meant to stand out (colored, from the wordmark) —
  // this keeps that consistent anywhere "Rep0rt" appears in running prose
  // instead of the numeral just reading as a stray, unstyled "0".
  function rep0rtHtml(text) {
    var div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML.replace(/Rep0rt/g, 'Rep<span class="zero-inline">0</span>rt');
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

  // --- Printable version -----------------------------------------------
  // Built once into #print-doc (styling lives in report.html's
  // @media print block). "Download PDF" just calls window.print() so the
  // reader saves it via their browser's own print dialog — that uses the
  // browser's real layout/pagination engine instead of rasterizing HTML
  // through html2canvas, which is what caused every previous rendering
  // bug (blank pages, clipped text, corrupted margins). No third-party
  // dependency, no WASM, nothing left to break here.
  function buildPdfDoc() {
    var doc = document.createElement("div");

    var bar = document.createElement("div");
    bar.className = "pdf-accent-bar";
    doc.appendChild(bar);

    var mast = document.createElement("div");
    mast.className = "pdf-mast";
    mast.innerHTML = '<span class="wordmark">Rep<span class="zero">0</span>rt</span>' +
      '<span class="disc"></span>';
    mast.querySelector(".disc").textContent = DISCIPLINE_NAMES[report.discipline] || report.discipline;
    doc.appendChild(mast);

    var tagline = document.createElement("p");
    tagline.className = "pdf-tagline";
    tagline.textContent = "An open, community-moderated record of results that would otherwise go unwritten";
    doc.appendChild(tagline);

    var titleBlock = document.createElement("div");
    titleBlock.className = "pdf-title-block";

    var titleEl = document.createElement("h1");
    titleEl.className = "pdf-title";
    titleEl.textContent = report.title;
    titleBlock.appendChild(titleEl);

    var pdfAffil = buildAffiliations(report.authors);

    var authorEl = document.createElement("p");
    authorEl.className = "pdf-author";
    authorEl.innerHTML = authorsWithSuperscripts(report.authors, pdfAffil.indexOf);
    titleBlock.appendChild(authorEl);

    var affilEl = document.createElement("p");
    affilEl.className = "pdf-affil";
    var pdfCorresponding = report.authors.filter(function (a) { return a.corresponding; })[0];
    var pdfAffilHtml = pdfAffil.list.map(function (name, i) {
      return "<sup>" + (i + 1) + "</sup> " + escapeHtml(name) + "<br>";
    }).join("");
    if (pdfCorresponding) {
      pdfAffilHtml += "<sup>" + CORRESPONDING_MARK + "</sup> Corresponding author: " +
        escapeHtml(pdfCorresponding.name) + " (" + escapeHtml(pdfCorresponding.email) + ")";
    }
    affilEl.innerHTML = pdfAffilHtml;
    titleBlock.appendChild(affilEl);

    doc.appendChild(titleBlock);

    var infoRow = document.createElement("div");
    infoRow.className = "pdf-info-row";

    var infoCol = document.createElement("div");
    infoCol.className = "pdf-info-col";
    infoCol.innerHTML = '<p class="info-heading">Article info</p>' +
      '<p class="info-line-label">Submitted</p><p class="info-line"></p>' +
      '<p class="info-line-label">Data and code</p><p class="info-line"></p>' +
      '<p class="info-line-label">Keywords</p><p class="info-line"></p>';
    var infoLines = infoCol.querySelectorAll(".info-line");
    infoLines[0].textContent = formatDateLong(report.date);
    infoLines[1].textContent = report.dataAvailable ? "Yes — available" : "No — not shared";
    infoLines[1].classList.add(report.dataAvailable ? "data-yes" : "data-no");
    infoLines[2].textContent = report.tags.join(", ");
    infoRow.appendChild(infoCol);

    var abstractCol = document.createElement("div");
    abstractCol.className = "pdf-info-col right";
    abstractCol.innerHTML = '<p class="info-heading">Abstract</p><p class="abstract-text"></p>';
    abstractCol.querySelector(".abstract-text").textContent = body.abstract || "";
    infoRow.appendChild(abstractCol);

    doc.appendChild(infoRow);

    var howCite = document.createElement("p");
    howCite.className = "pdf-howcite";
    var citeStr = apaAuthors(report.authors) + " (" + report.date.slice(0, 4) + "). " +
      report.title + ". Rep0rt. " + window.location.href;
    howCite.innerHTML = "<b>How to cite:</b> " + rep0rtHtml(citeStr);
    doc.appendChild(howCite);

    [
      ["Theory and Expectations", body.theory],
      ["Hypothesis", body.hypothesis],
      ["Results", body.results],
      ["Reflections", body.reflections]
    ].forEach(function (s) {
      var h = document.createElement("h3");
      h.textContent = s[0];
      var p = document.createElement("div");
      p.className = "body";
      p.textContent = s[1] || "";
      doc.appendChild(h);
      doc.appendChild(p);
    });

    if ((body.figures || []).length) {
      var figH = document.createElement("h3");
      figH.textContent = "Figures";
      doc.appendChild(figH);
      body.figures.forEach(function (caption, i) {
        var block = document.createElement("div");
        block.className = "fig-block";
        var label = document.createElement("p");
        label.className = "fig-label";
        label.textContent = "Figure " + (i + 1);
        var cap = document.createElement("p");
        cap.className = "fig-caption";
        cap.textContent = caption;
        var ph = document.createElement("div");
        ph.className = "ph";
        block.appendChild(label);
        block.appendChild(cap);
        block.appendChild(ph);
        doc.appendChild(block);
      });
    }

    var refH = document.createElement("h3");
    refH.textContent = "References";
    doc.appendChild(refH);

    var refs = body.literature || [];
    var refColumns = document.createElement("div");
    refColumns.className = "ref-columns";
    var leftCol = document.createElement("div");
    leftCol.className = "ref-col";
    var rightCol = document.createElement("div");
    rightCol.className = "ref-col right";
    var splitAt = Math.ceil(refs.length / 2);
    refs.forEach(function (ref, i) {
      var p = document.createElement("p");
      p.className = "ref-entry";
      p.textContent = ref;
      (i < splitAt ? leftCol : rightCol).appendChild(p);
    });
    refColumns.appendChild(leftCol);
    refColumns.appendChild(rightCol);
    doc.appendChild(refColumns);

    var aboutBox = document.createElement("div");
    aboutBox.className = "pdf-about";
    var aboutLabel = document.createElement("p");
    aboutLabel.className = "about-label";
    aboutLabel.innerHTML = rep0rtHtml("About Rep0rt");
    var aboutText = document.createElement("p");
    aboutText.className = "about-text";
    aboutText.innerHTML = rep0rtHtml("Rep0rt is an open archive for results that would otherwise go " +
      "unwritten. Reports are not peer-reviewed — they are moderated by the Rep0rt community. " +
      "This document reflects the author's own account of their work.");
    aboutBox.appendChild(aboutLabel);
    aboutBox.appendChild(aboutText);
    doc.appendChild(aboutBox);

    return doc;
  }

  var printDoc = document.getElementById("print-doc");
  printDoc.appendChild(buildPdfDoc());
  if (window.renderMathInElement) renderMathInElement(printDoc, KATEX_OPTS);

  document.getElementById("download-pdf").addEventListener("click", function () {
    window.print();
  });
})();
