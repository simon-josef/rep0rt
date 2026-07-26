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
  // Built as an independent document (not a clone of the on-screen DOM),
  // laid out like a LaTeX article: centered title/author/date block, an
  // indented abstract, numbered sections, unnumbered references. Forces
  // a formal serif type and fixed light-mode colors regardless of the
  // reader's dark-mode setting.
  //
  // PDF_WIDTH_PX must match html2canvas's windowWidth below — mismatched
  // values are what caused long unbreakable strings (DOI URLs) to run
  // past the page edge and get clipped instead of wrapping.
  //
  // Page breaks: html2pdf's CSS break-inside detection is unreliable on
  // its own, so PAGEBREAK_AVOID_SELECTORS is passed straight to its
  // pagebreak.avoid option, which is the mechanism it documents as
  // authoritative for "don't split this element across a page".
  var PDF_WIDTH_PX = 720;
  var PAGEBREAK_AVOID_SELECTORS = [
    ".pdf-mast", ".pdf-title-block", ".pdf-cite", ".pdf-abstract",
    "h3", ".fig-block", ".ref-entry", ".pdf-about"
  ];

  function buildPdfDoc() {
    var doc = document.createElement("div");
    doc.className = "pdf-doc";

    var style = document.createElement("style");
    style.textContent = [
      ".pdf-doc { font-family: Georgia, 'Times New Roman', Times, serif; font-size: 11pt; line-height: 1.5; color: #111111; background: #ffffff; }",
      ".pdf-doc, .pdf-doc * { box-sizing: border-box; overflow-wrap: break-word; word-break: break-word; }",
      ".pdf-doc .pdf-mast { border-top: 1.5pt solid #111111; border-bottom: 0.75pt solid #111111; padding: 8pt 0; margin: 0 0 30pt; overflow: hidden; }",
      ".pdf-doc .pdf-mast .wordmark { float: left; font-family: 'EB Garamond', Georgia, serif; font-style: italic; font-weight: 500; font-size: 17pt; color: #111111; }",
      ".pdf-doc .pdf-mast .wordmark .zero { color: #1F5FA6; }",
      ".pdf-doc .pdf-mast .disc { float: right; font-size: 9pt; letter-spacing: 0.03em; color: #444444; font-family: Georgia, serif; padding-top: 3pt; }",
      ".pdf-doc .pdf-title-block { text-align: center; margin: 0 0 20pt; }",
      ".pdf-doc .pdf-title { font-size: 16.5pt; font-weight: 700; margin: 0 0 12pt; line-height: 1.35; }",
      ".pdf-doc .pdf-author { font-size: 11.5pt; margin: 0 0 3pt; }",
      ".pdf-doc .pdf-subline { font-size: 9.5pt; color: #444444; margin: 0 0 3pt; }",
      ".pdf-doc .pdf-tags { font-size: 9pt; font-style: italic; color: #555555; margin: 8pt 0 0; }",
      ".pdf-doc .pdf-cite { border-top: 0.75pt solid #999999; border-bottom: 0.75pt solid #999999; padding: 8pt 0; margin: 0 0 22pt; }",
      ".pdf-doc .cite-label { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 4pt; color: #444444; }",
      ".pdf-doc .cite-text { margin: 0; font-size: 9.5pt; line-height: 1.45; }",
      ".pdf-doc .pdf-abstract { margin: 0 0 24pt; }",
      ".pdf-doc .abstract-label { text-align: center; font-size: 10.5pt; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin: 0 0 8pt; }",
      ".pdf-doc .abstract-text { font-size: 10.5pt; line-height: 1.5; text-align: justify; margin: 0 32pt; }",
      ".pdf-doc h3 { font-size: 11.5pt; font-weight: 700; margin: 20pt 0 8pt; }",
      ".pdf-doc h3 .num { margin-right: 6pt; }",
      ".pdf-doc .body { font-size: 11pt; line-height: 1.5; white-space: pre-wrap; text-align: justify; }",
      ".pdf-doc .fig-block { margin: 0 0 14pt; }",
      ".pdf-doc .fig-label { font-weight: 700; margin: 12pt 0 2pt; }",
      ".pdf-doc .fig-caption { font-style: italic; margin: 0 0 6pt; }",
      ".pdf-doc .ph { border: 0.75pt solid #999999; background: #f4f4f2; min-height: 110pt; }",
      ".pdf-doc .ref-entry { margin: 0 0 10pt; font-size: 10pt; line-height: 1.45; text-align: justify; }",
      ".pdf-doc .pdf-about { border: 0.75pt solid #999999; background: #f7f7f5; padding: 11pt 13pt; margin: 26pt 0 0; }",
      ".pdf-doc .about-label { font-size: 7.5pt; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin: 0 0 5pt; color: #444444; }",
      ".pdf-doc .about-text { margin: 0; font-size: 9pt; line-height: 1.5; color: #222222; }"
    ].join("\n");
    doc.appendChild(style);

    var mast = document.createElement("div");
    mast.className = "pdf-mast";
    mast.innerHTML = '<span class="wordmark">Rep<span class="zero">0</span>rt</span>' +
      '<span class="disc">Rep0rt.' + report.discipline + '</span>';
    doc.appendChild(mast);

    var titleBlock = document.createElement("div");
    titleBlock.className = "pdf-title-block";

    var titleEl = document.createElement("h1");
    titleEl.className = "pdf-title";
    titleEl.textContent = report.title;
    titleBlock.appendChild(titleEl);

    var authorEl = document.createElement("p");
    authorEl.className = "pdf-author";
    authorEl.textContent = report.author;
    titleBlock.appendChild(authorEl);

    var submittedEl = document.createElement("p");
    submittedEl.className = "pdf-subline";
    submittedEl.textContent = "Submitted " + formatDateLong(report.date);
    titleBlock.appendChild(submittedEl);

    var dataEl = document.createElement("p");
    dataEl.className = "pdf-subline";
    dataEl.textContent = report.dataAvailable ? "Data and code available" : "No data or code shared";
    titleBlock.appendChild(dataEl);

    var tagsP = document.createElement("p");
    tagsP.className = "pdf-tags";
    tagsP.textContent = "Keywords: " + report.tags.join(", ");
    titleBlock.appendChild(tagsP);

    doc.appendChild(titleBlock);

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

    var abstractBlock = document.createElement("div");
    abstractBlock.className = "pdf-abstract";
    var abstractLabel = document.createElement("p");
    abstractLabel.className = "abstract-label";
    abstractLabel.textContent = "Abstract";
    var abstractText = document.createElement("p");
    abstractText.className = "abstract-text";
    abstractText.textContent = body.abstract || "";
    abstractBlock.appendChild(abstractLabel);
    abstractBlock.appendChild(abstractText);
    doc.appendChild(abstractBlock);

    var sectionNum = 0;
    [
      ["Theory and Expectations", body.theory],
      ["Hypothesis", body.hypothesis],
      ["Results", body.results],
      ["Reflections", body.reflections]
    ].forEach(function (s) {
      sectionNum++;
      var h = document.createElement("h3");
      h.innerHTML = '<span class="num">' + sectionNum + '.</span>' + s[0];
      var p = document.createElement("div");
      p.className = "body";
      p.textContent = s[1] || "";
      doc.appendChild(h);
      doc.appendChild(p);
    });

    if ((body.figures || []).length) {
      sectionNum++;
      var figH = document.createElement("h3");
      figH.innerHTML = '<span class="num">' + sectionNum + '.</span>Figures';
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
    (body.literature || []).forEach(function (ref) {
      var p = document.createElement("p");
      p.className = "ref-entry";
      p.textContent = ref;
      doc.appendChild(p);
    });

    var aboutBox = document.createElement("div");
    aboutBox.className = "pdf-about";
    var aboutLabel = document.createElement("p");
    aboutLabel.className = "about-label";
    aboutLabel.textContent = "About Rep0rt";
    var aboutText = document.createElement("p");
    aboutText.className = "about-text";
    aboutText.textContent = "Rep0rt is an open, community-run archive for results that would " +
      "otherwise go unwritten — not only findings that failed to confirm a hypothesis, but any " +
      "result that never made it into the record, often simply because it came out " +
      "statistically nonsignificant. Reports on Rep0rt are not peer-reviewed. They are " +
      "moderated by the Rep0rt community against a set of content guidelines, and readers " +
      "should weigh them accordingly. This document reflects the author's own account of " +
      "their work at the time of submission.";
    aboutBox.appendChild(aboutLabel);
    aboutBox.appendChild(aboutText);
    doc.appendChild(aboutBox);

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
    container.style.width = PDF_WIDTH_PX + "px";

    if (window.renderMathInElement) renderMathInElement(container, KATEX_OPTS);

    var opt = {
      margin: 25.4,
      filename: "rep0rt-" + report.id + ".pdf",
      html2canvas: { scale: 2, backgroundColor: "#ffffff", windowWidth: PDF_WIDTH_PX },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
      pagebreak: { mode: ["css", "legacy"], avoid: PAGEBREAK_AVOID_SELECTORS }
    };

    function reset() {
      button.textContent = original;
      button.disabled = false;
    }

    html2pdf().set(opt).from(container).save().then(reset).catch(reset);
  });
})();
