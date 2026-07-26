(function () {
  var data = window.REP0RT_DATA || [];

  var cardsEl = document.getElementById("cards");
  var emptyEl = document.getElementById("empty");
  var countEl = document.getElementById("count");
  var searchEl = document.getElementById("search");
  var fieldListEl = document.getElementById("field-list");
  var sortTabsEl = document.getElementById("sort-tabs");

  var params = new URLSearchParams(window.location.search);
  var state = {
    sort: "recent",
    discipline: params.get("discipline") || ""
  };

  // "A" / "A & B" / "A, B & C"
  function displayAuthors(authors) {
    var names = authors.map(function (a) { return a.name; });
    if (names.length === 1) return names[0];
    if (names.length === 2) return names[0] + " & " + names[1];
    return names.slice(0, -1).join(", ") + " & " + names[names.length - 1];
  }

  function formatDate(iso) {
    var d = new Date(iso + "T00:00:00");
    return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  }

  function daysSince(iso) {
    var ms = Date.now() - new Date(iso + "T00:00:00").getTime();
    return Math.max(0, ms / 86400000);
  }

  function trendingScore(r) {
    return r.stats.comments * 5 + r.stats.views * 0.1 - daysSince(r.date) * 3;
  }

  var SORTERS = {
    recent: function (a, b) { return b.date.localeCompare(a.date); },
    discussed: function (a, b) { return b.stats.comments - a.stats.comments; },
    read: function (a, b) { return b.stats.views - a.stats.views; },
    trending: function (a, b) { return trendingScore(b) - trendingScore(a); }
  };

  // --- Discipline sidebar --------------------------------------------
  var disciplineCounts = {};
  data.forEach(function (r) {
    disciplineCounts[r.discipline] = (disciplineCounts[r.discipline] || 0) + 1;
  });
  var disciplines = Object.keys(disciplineCounts).sort();

  function renderFieldList() {
    fieldListEl.innerHTML = "";
    var allItem = document.createElement("li");
    var allLink = document.createElement("a");
    allLink.className = "field-item" + (state.discipline === "" ? " active" : "");
    allLink.href = "index.html";
    allLink.innerHTML = '<span>All fields</span><span class="field-count"></span>';
    allLink.querySelector(".field-count").textContent = data.length;
    allItem.appendChild(allLink);
    fieldListEl.appendChild(allItem);

    disciplines.forEach(function (d) {
      var li = document.createElement("li");
      var a = document.createElement("a");
      a.className = "field-item" + (state.discipline === d ? " active" : "");
      a.href = "index.html?discipline=" + encodeURIComponent(d);
      a.innerHTML = '<span>Rep0rt.' + d + '</span><span class="field-count"></span>';
      a.querySelector(".field-count").textContent = disciplineCounts[d];
      li.appendChild(a);
      fieldListEl.appendChild(li);
    });
  }

  // --- Sort tabs --------------------------------------------------------
  sortTabsEl.addEventListener("click", function (e) {
    var btn = e.target.closest(".sort-tab");
    if (!btn) return;
    state.sort = btn.dataset.sort;
    Array.from(sortTabsEl.querySelectorAll(".sort-tab")).forEach(function (t) {
      var active = t === btn;
      t.classList.toggle("active", active);
      t.setAttribute("aria-selected", active ? "true" : "false");
    });
    render();
  });

  // --- Cards --------------------------------------------------------
  function cardHtml(r) {
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
    el.querySelector(".author").textContent = displayAuthors(r.authors);
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
    var filtered = data.filter(function (r) {
      if (state.discipline && r.discipline !== state.discipline) return false;
      if (!q) return true;
      var authorNames = r.authors.map(function (a) { return a.name; }).join(" ");
      var haystack = (r.title + " " + authorNames + " " + r.tags.join(" ")).toLowerCase();
      return haystack.indexOf(q) !== -1;
    });

    filtered.sort(SORTERS[state.sort] || SORTERS.recent);

    cardsEl.innerHTML = "";
    filtered.forEach(function (r) { cardsEl.appendChild(cardHtml(r)); });

    emptyEl.hidden = filtered.length !== 0;
    countEl.textContent = filtered.length + (filtered.length === 1 ? " report" : " reports");
  }

  // --- Profile popover (demo only — no real auth/backend) ---------------
  var profileBtn = document.getElementById("profile-btn");
  var profilePop = document.getElementById("profile-pop");
  var profileLogin = document.getElementById("profile-login");
  var loggedIn = false;

  profileBtn.addEventListener("click", function (e) {
    e.stopPropagation();
    var willShow = profilePop.hidden;
    profilePop.hidden = !willShow;
    profileBtn.setAttribute("aria-expanded", willShow ? "true" : "false");
  });
  document.addEventListener("click", function (e) {
    if (!profilePop.hidden && !profilePop.contains(e.target) && e.target !== profileBtn) {
      profilePop.hidden = true;
      profileBtn.setAttribute("aria-expanded", "false");
    }
  });
  profileLogin.addEventListener("click", function () {
    loggedIn = true;
    profileBtn.classList.add("logged-in");
    profileBtn.title = "Signed in (demo)";
    profilePop.hidden = true;
    profileBtn.setAttribute("aria-expanded", "false");
  });

  renderFieldList();
  searchEl.addEventListener("input", render);
  render();
})();
