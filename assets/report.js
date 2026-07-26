(function () {
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
  document.getElementById("r-date").textContent = new Date(report.date + "T00:00:00")
    .toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

  var tagsEl = document.getElementById("r-tags");
  report.tags.forEach(function (t) {
    var span = document.createElement("span");
    span.className = "tag";
    span.textContent = t;
    tagsEl.appendChild(span);
  });

  var sectionIds = ["r-abstract", "r-theory", "r-hypothesis", "r-results", "r-reflections", "r-literature"];
  var sectionKeys = ["abstract", "theory", "hypothesis", "results", "reflections", "literature"];
  sectionIds.forEach(function (elId, i) {
    var el = document.getElementById(elId);
    el.textContent = body[sectionKeys[i]] || "";
    if (window.REP0RT_DECOY) REP0RT_DECOY.surround(el);
  });

  var figuresEl = document.getElementById("r-figures");
  var figIcon = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="8.5" cy="9.5" r="1.5"/><path d="M21 16l-5-5L5 20"/></svg>';
  (body.figures || []).forEach(function (caption) {
    var fig = document.createElement("div");
    fig.className = "figure";
    fig.innerHTML = '<div class="ph">' + figIcon + '</div><div class="cap"></div>';
    fig.querySelector(".cap").textContent = caption;
    figuresEl.appendChild(fig);
  });
  if (!(body.figures || []).length) {
    figuresEl.parentElement.hidden = true;
  }

  if (window.REP0RT_COMMENTS) REP0RT_COMMENTS.init(report.author);

  if (window.renderMathInElement) {
    renderMathInElement(document.getElementById("pdf-content"), {
      delimiters: [
        { left: "$$", right: "$$", display: true },
        { left: "\\[", right: "\\]", display: true },
        { left: "$", right: "$", display: false },
        { left: "\\(", right: "\\)", display: false }
      ],
      throwOnError: false
    });
  }

  var button = document.getElementById("download-pdf");
  button.addEventListener("click", function () {
    var original = button.textContent;
    button.textContent = "Preparing PDF…";
    button.disabled = true;

    var opt = {
      margin: [12, 14],
      filename: "rep0rt-" + report.id + ".pdf",
      html2canvas: { scale: 2, backgroundColor: "#FBFAF7" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    var container = document.createElement("div");
    container.style.fontFamily = "Inter, system-ui, sans-serif";
    container.style.color = "#1B1A17";
    container.style.padding = "0";

    var titleEl = document.createElement("h1");
    titleEl.style.fontFamily = "'EB Garamond', Georgia, serif";
    titleEl.style.fontStyle = "italic";
    titleEl.style.fontWeight = "500";
    titleEl.style.fontSize = "22px";
    titleEl.textContent = report.title;
    container.appendChild(titleEl);

    var metaEl = document.createElement("p");
    metaEl.style.fontSize = "12px";
    metaEl.style.color = "#6E6C64";
    metaEl.textContent = "Rep0rt." + report.discipline + " · " + report.author + " · " +
      document.getElementById("r-date").textContent;
    container.appendChild(metaEl);

    container.appendChild(document.getElementById("pdf-content").cloneNode(true));

    html2pdf().set(opt).from(container).save().then(function () {
      button.textContent = original;
      button.disabled = false;
    }).catch(function () {
      button.textContent = original;
      button.disabled = false;
    });
  });
})();
