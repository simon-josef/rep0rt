// Discussion thread (demo data, client-side only — nothing here is
// persisted; new comments and flags reset on reload) and the "Flag this
// Rep0rt" dialog. Called from report.js once a report is found via
// REP0RT_COMMENTS.init(authorName).
(function () {
  var AVATAR_SVG = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" ' +
    'stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/>' +
    '<path d="M4 20c0-4.4 3.6-7 8-7s8 2.6 8 7"/></svg>';

  function avatarEl() {
    var div = document.createElement("div");
    div.className = "avatar";
    div.innerHTML = AVATAR_SVG;
    return div;
  }

  function commentEl(opts) {
    var wrap = document.createElement("div");
    wrap.className = "comment" + (opts.isReply ? " reply" : "");

    var head = document.createElement("div");
    head.className = "comment-head";
    var nameEl = document.createElement("span");
    nameEl.className = "comment-name";
    nameEl.textContent = opts.name;
    if (opts.isAuthor) {
      var badge = document.createElement("span");
      badge.className = "author-badge";
      badge.textContent = "Author";
      nameEl.appendChild(badge);
    }
    var dateEl = document.createElement("span");
    dateEl.className = "comment-date";
    dateEl.textContent = opts.date;
    head.appendChild(nameEl);
    head.appendChild(dateEl);

    var textEl = document.createElement("p");
    textEl.className = "comment-text";
    textEl.textContent = opts.text;

    var body = document.createElement("div");
    body.className = "comment-body";
    body.appendChild(head);
    body.appendChild(textEl);

    wrap.appendChild(avatarEl());
    wrap.appendChild(body);
    return wrap;
  }

  function demoThreads(authorName) {
    return [
      {
        name: "R. Castillo",
        date: "Apr 2, 2026",
        text: "Could this null result be a power issue rather than a true absence of an effect? What sample size would you have needed to detect the smallest effect size you'd still consider meaningful?",
        reply: {
          name: authorName,
          date: "Apr 3, 2026",
          text: "Fair point — power here was computed post hoc from the observed effect, not planned a priori around a smallest effect of interest. That's a real limitation. Happy to share the power curve if it's useful for planning a follow-up."
        }
      },
      {
        name: "M. Okonkwo",
        date: "Mar 20, 2026",
        text: "Is the underlying dataset or analysis notebook available anywhere?",
        reply: {
          name: authorName,
          date: "Mar 21, 2026",
          text: "Not yet — we're planning to archive the dataset and notebook alongside a revised version of this report."
        }
      }
    ];
  }

  function renderComments(authorName) {
    var list = document.getElementById("comments-list");
    demoThreads(authorName).forEach(function (t) {
      list.appendChild(commentEl({ name: t.name, date: t.date, text: t.text }));
      list.appendChild(commentEl({
        name: t.reply.name, date: t.reply.date, text: t.reply.text,
        isAuthor: true, isReply: true
      }));
    });
  }

  // No real auth here (static site, no backend) — "Log in" just swaps the
  // gate for the composer, standing in for an account-gated post flow.
  function wireLoginGate() {
    var gate = document.getElementById("ask-gate");
    var form = document.getElementById("ask-form");
    var loginBtn = document.getElementById("login-btn");
    loginBtn.addEventListener("click", function () {
      gate.hidden = true;
      form.hidden = false;
      document.getElementById("ask-text").focus();
    });
  }

  function wireAskForm() {
    var form = document.getElementById("ask-form");
    var textEl = document.getElementById("ask-text");
    var status = document.getElementById("ask-status");
    var list = document.getElementById("comments-list");

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var text = textEl.value.trim();
      if (!text) {
        status.className = "status err";
        status.textContent = "Write a question or comment first.";
        return;
      }
      list.appendChild(commentEl({ name: "You", date: "just now", text: text }));
      textEl.value = "";
      status.className = "status ok";
      status.textContent = "Posted. (Demo: not saved — resets on reload.)";
    });
  }

  function wireFlagDialog() {
    var btn = document.getElementById("flag-btn");
    var dialog = document.getElementById("flag-dialog");
    if (!btn || !dialog) return;

    var form = document.getElementById("flag-form");
    var confirmEl = document.getElementById("flag-confirm");
    var errorEl = document.getElementById("flag-error");
    var cancelBtn = document.getElementById("flag-cancel");
    var closeBtn = document.getElementById("flag-close");

    btn.addEventListener("click", function () {
      form.hidden = false;
      confirmEl.hidden = true;
      errorEl.hidden = true;
      dialog.showModal();
    });
    cancelBtn.addEventListener("click", function () { dialog.close(); });
    closeBtn.addEventListener("click", function () { dialog.close(); });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var checked = form.querySelectorAll('input[name="reason"]:checked');
      var detail = document.getElementById("flag-detail").value.trim();
      if (!checked.length && !detail) {
        errorEl.hidden = false;
        return;
      }
      errorEl.hidden = true;
      form.hidden = true;
      confirmEl.hidden = false;
    });
  }

  window.REP0RT_COMMENTS = {
    init: function (authorName) {
      renderComments(authorName);
      wireLoginGate();
      wireAskForm();
      wireFlagDialog();
    }
  };
})();
