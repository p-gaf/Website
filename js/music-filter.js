(function () {
  "use strict";

  var songsEl = document.getElementById("songs");
  var filterEl = document.getElementById("filter");
  var emptyEl = document.getElementById("empty");
  var state = { songs: [], role: "all" };

  function escape(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function rolesLabel(roles) {
    return roles.map(function (r) { return r.charAt(0).toUpperCase() + r.slice(1); }).join(", ");
  }

  function render() {
    var role = state.role;
    var list = role === "all"
      ? state.songs
      : state.songs.filter(function (s) { return s.roles.indexOf(role) !== -1; });

    if (list.length === 0) {
      songsEl.innerHTML = "";
      emptyEl.style.display = "";
      return;
    }
    emptyEl.style.display = "none";

    songsEl.innerHTML = list.map(function (s) {
      var streams = [];
      if (s.spotify) streams.push('<a href="' + escape(s.spotify) + '" rel="noopener">Spotify</a>');
      if (s.apple_music) streams.push('<a href="' + escape(s.apple_music) + '" rel="noopener">Apple Music</a>');
      var streamsHtml = streams.join('<span class="sep">·</span>');

      return (
        '<div class="song">' +
          '<img class="cover" src="' + escape(s.cover) + '" alt="' + escape(s.title + " cover") + '" loading="lazy">' +
          '<div class="meta">' +
            '<span class="title">' + escape(s.title) + '</span> &mdash; ' +
            '<span class="artist">' + escape(s.artist) + '</span><br>' +
            '<span class="tags">' + escape(rolesLabel(s.roles)) + '</span>' +
            '<span class="year"> &middot; ' + escape(String(s.year)) + '</span>' +
          '</div>' +
          '<div class="streams">' + streamsHtml + '</div>' +
        '</div>'
      );
    }).join("");
  }

  function setRole(role) {
    state.role = role;
    var buttons = filterEl.querySelectorAll("button");
    for (var i = 0; i < buttons.length; i++) {
      buttons[i].classList.toggle("active", buttons[i].getAttribute("data-role") === role);
    }
    render();
  }

  filterEl.addEventListener("click", function (e) {
    var b = e.target.closest("button[data-role]");
    if (!b) return;
    setRole(b.getAttribute("data-role"));
  });

  fetch("data/songs.json")
    .then(function (r) {
      if (!r.ok) throw new Error("songs.json: " + r.status);
      return r.json();
    })
    .then(function (data) {
      // newest first
      data.sort(function (a, b) { return (b.year || 0) - (a.year || 0); });
      state.songs = data;
      render();
    })
    .catch(function (err) {
      songsEl.innerHTML =
        '<p style="font-style: italic; color: #a01a1a;">Could not load songs.json.' +
        ' If you are previewing locally, serve the directory (e.g. <code>python3 -m http.server</code>) instead of opening the file directly.</p>';
      console.error(err);
    });
})();
