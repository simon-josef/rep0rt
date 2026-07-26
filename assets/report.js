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

  function apaAuthor(name) {
    var parts = name.trim().split(/\s+/);
    var last = parts.pop();
    return last + ", " + parts.join(" ");
  }

  function formatDateLong(iso) {
    return new Date(iso + "T00:00:00").toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

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
  document.getElementById("r-author").textContent = report.author;
  document.getElementById("r-date").textContent = formatDateLong(report.date);

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

  if (window.REP0RT_COMMENTS) REP0RT_COMMENTS.init(report.author);

  if (window.renderMathInElement) {
    renderMathInElement(document.getElementById("pdf-content"), KATEX_OPTS);
  }

  // --- PDF export -----------------------------------------------------
  // Built as an independent document (not a clone of the on-screen DOM):
  // forces a formal serif type and fixed light-mode colors regardless of
  // the reader's dark-mode setting, uses full 1-inch APA margins, and
  // adds an APA "suggested citation" block plus a real reference list —
  // none of which the live page's own styling is meant to carry.
  function buildPdfDoc() {
    var doc = document.createElement("div");
    doc.className = "pdf-doc";

    var style = document.createElement("style");
    style.textContent = [
      ".pdf-doc { font-family: Georgia, 'Times New Roman', Times, serif; font-size: 12pt; line-height: 1.9; color: #111111; background: #ffffff; }",
      ".pdf-doc .pdf-title { font-size: 17pt; font-weight: 700; margin: 0 0 6pt; line-height: 1.35; }",
      ".pdf-doc .pdf-meta { font-size: 10.5pt; color: #333333; margin: 0 0 4pt; }",
      ".pdf-doc .pdf-tags { font-size: 10pt; color: #555555; margin: 0 0 16pt; }",
      ".pdf-doc .pdf-cite { border: 0.75pt solid #999999; padding: 10pt 12pt; margin: 0 0 20pt; }",
      ".pdf-doc .cite-label { font-size: 8.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; margin: 0 0 5pt; color: #333333; }",
      ".pdf-doc .cite-text { margin: 0; padding-left: 1.27cm; text-indent: -1.27cm; font-size: 10.5pt; line-height: 1.5; }",
      ".pdf-doc h3 { font-size: 12pt; font-weight: 700; margin: 20pt 0 8pt; padding-bottom: 3pt; border-bottom: 0.75pt solid #999999; }",
      ".pdf-doc .body { font-size: 12pt; line-height: 1.9; white-space: pre-wrap; }",
      ".pdf-doc .fig-label { font-weight: 700; margin: 14pt 0 2pt; }",
      ".pdf-doc .fig-caption { font-style: italic; margin: 0 0 8pt; }",
      ".pdf-doc .ph { border: 0.75pt solid #999999; background: #f2f2f0; min-height: 110pt; }",
      ".pdf-doc .ref-entry { padding-left: 1.27cm; text-indent: -1.27cm; margin: 0 0 9pt; font-size: 11.5pt; line-height: 1.6; }"
    ].join("\n");
    doc.appendChild(style);

    var titleEl = document.createElement("h1");
    titleEl.className = "pdf-title";
    titleEl.textContent = report.title;
    doc.appendChild(titleEl);

    var metaEl = document.createElement("p");
    metaEl.className = "pdf-meta";
    metaEl.textContent = "Rep0rt." + report.discipline + "  ·  " + report.author + "  ·  " + formatDateLong(report.date);
    doc.appendChild(metaEl);

    var tagsP = document.createElement("p");
    tagsP.className = "pdf-tags";
    tagsP.textContent = "Keywords: " + report.tags.join(", ");
    doc.appendChild(tagsP);

    var citeBox = document.createElement("div");
    citeBox.className = "pdf-cite";
    var citeLabel = document.createElement("p");
    citeLabel.className = "cite-label";
    citeLabel.textContent = "Suggested citation";
    var citeText = document.createElement("p");
    citeText.className = "cite-text";
    citeText.textContent = apaAuthor(report.author) + " (" + report.date.slice(0, 4) + "). " +
      report.title + ". Rep0rt. " + window.location.href;
    citeBox.appendChild(citeLabel);
    citeBox.appendChild(citeText);
    doc.appendChild(citeBox);

    [
      ["Abstract", body.abstract],
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
        var label = document.createElement("p");
        label.className = "fig-label";
        label.textContent = "Figure " + (i + 1);
        var cap = document.createElement("p");
        cap.className = "fig-caption";
        cap.textContent = caption;
        var ph = document.createElement("div");
        ph.className = "ph";
        doc.appendChild(label);
        doc.appendChild(cap);
        doc.appendChild(ph);
      });
    }

    var refH = document.createElement("h3");
    refH.textContent = "References";
    doc.appendChild(refH);
    (body.literature || []).forEach(function (ref) {
      var p = document.createElement("p");
      p.className = "ref-entry";
      p.textContent = ref;
      doc.appendChild(p);
    });

    return doc;
  }

  var button = document.getElementById("download-pdf");
  button.addEventListener("click", function () {
    var original = button.textContent;
    button.textContent = "Preparing PDF…";
    button.disabled = true;

    // Deliberately left detached from the live document: html2canvas
    // clones whatever document a source element belongs to, and an
    // attached-but-offscreen container (position:fixed; left:-9999px)
    // gets cloned along with that offscreen position, so the capture
    // ends up empty. Building it detached and handing it straight to
    // html2pdf avoids that.
    var container = buildPdfDoc();
    container.style.width = "700px";

    if (window.renderMathInElement) renderMathInElement(container, KATEX_OPTS);

    var opt = {
      margin: 25.4,
      filename: "rep0rt-" + report.id + ".pdf",
      html2canvas: { scale: 2, backgroundColor: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    function reset() {
      button.textContent = original;
      button.disabled = false;
    }

    html2pdf().set(opt).from(container).save().then(reset).catch(reset);
  });
})();
