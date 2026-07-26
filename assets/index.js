(function () {
  var data = (window.REP0RT_DATA || []).slice().sort(function (a, b) {
    return b.date.localeCompare(a.date);
  });

  var cardsEl = document.getElementById("cards");
  var emptyEl = document.getElementById("empty");
  var countEl = document.getElementById("count");
  var searchEl = document.getElementById("search");
  var disciplineEl = document.getElementById("discipline-filter");

  var disciplines = [];
  data.forEach(function (r) {
    if (disciplines.indexOf(r.discipline) === -1) disciplines.push(r.discipline);
  });
  disciplines.sort();
  disciplines.forEach(function (d) {
    var opt = document.createElement("option");
    opt.value = d;
    opt.textContent = "Rep0rt." + d;
    disciplineEl.appendChild(opt);
  });

  function formatDate(iso) {
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  function cardHtml(r) {
    var tags = r.tags.slice(0, 3).map(function (t) {
      return '<span class="tag"></span>';
    }).join("");
    var el = document.createElement("a");
    el.className = "card";
    el.href = "report.html?id=" + encodeURIComponent(r.id);
    el.innerHTML =
      '<div class="card-top">' +
        '<span class="disc-badge">Rep0rt.' + r.discipline + '</span>' +
        '<span class="card-meta"><span class="date"></span></span>' +
      '</div>' +
      '<h2></h2>' +
      '<div class="card-meta"><span class="author"></span></div>' +
      '<div class="card-tags"></div>';
    el.querySelector("h2").textContent = r.title;
    el.querySelector(".date").textContent = formatDate(r.date);
    el.querySelector(".author").textContent = r.author;
    var tagsWrap = el.querySelector(".card-tags");
    r.tags.slice(0, 3).forEach(function (t) {
      var span = document.createElement("span");
      span.className = "tag";
      span.textContent = t;
      tagsWrap.appendChild(span);
    });
    return el;
  }

  function render() {
    var q = searchEl.value.trim().toLowerCase();
    var disc = disciplineEl.value;
    var filtered = data.filter(function (r) {
      if (disc && r.discipline !== disc) return false;
      if (!q) return true;
      var haystack = (r.title + " " + r.author + " " + r.tags.join(" ")).toLowerCase();
      return haystack.indexOf(q) !== -1;
    });

    cardsEl.innerHTML = "";
    filtered.forEach(function (r) { cardsEl.appendChild(cardHtml(r)); });

    emptyEl.hidden = filtered.length !== 0;
    countEl.textContent = filtered.length + (filtered.length === 1 ? " report" : " reports");
  }

  searchEl.addEventListener("input", render);
  disciplineEl.addEventListener("change", render);
  render();
})();
