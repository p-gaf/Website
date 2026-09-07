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

  // Records credit an artist; scored films/commercials credit a director.
  function byline(s) {
    if (s.artist) return s.artist;
    if (s.director) return "Dir. " + s.director;
    return "";
  }

  // Cover art, or a 16:9 video thumbnail for scoring credits. Scored work has a
  // single destination, so the thumbnail itself links to the video; records have
  // two streaming links, so their cover stays a plain image.
  function coverHtml(s) {
    var video = s.youtube || s.vimeo;
    var img = '<img class="cover' + (s.director ? ' wide' : '') + '"' +
              ' src="' + escape(s.cover) + '"' +
              ' alt="' + escape(s.title + (s.director ? " thumbnail" : " cover")) + '"' +
              ' loading="lazy">';
    if (!video) return img;
    var where = s.youtube ? "YouTube" : "Vimeo";
    return '<a class="cover-link" href="' + escape(video) + '" target="_blank"' +
           ' rel="noopener noreferrer" title="' + escape("Watch " + s.title + " on " + where) + '">' +
           img + '</a>';
  }

  // Optional non-filterable aside, e.g. "(album cover)". When note_link is set
  // the text becomes a link to the related page, with a hover tooltip.
  function noteHtml(s) {
    if (!s.note) return "";
    var inner = escape(s.note);
    if (s.note_link) {
      inner = '<a href="' + escape(s.note_link) + '"' +
              (s.note_title ? ' title="' + escape(s.note_title) + '"' : '') +
              '>' + inner + '</a>';
    }
    return ' <span class="note">(' + inner + ')</span>';
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
      function link(url, label) {
        return '<a href="' + escape(url) + '" target="_blank" rel="noopener noreferrer">' + label + '</a>';
      }
      if (s.spotify) streams.push(link(s.spotify, "Spotify"));
      if (s.apple_music) streams.push(link(s.apple_music, "Apple Music"));
      if (s.youtube) streams.push(link(s.youtube, "YouTube"));
      if (s.vimeo) streams.push(link(s.vimeo, "Vimeo"));
      var streamsHtml = streams.join('<span class="sep">·</span>');

      return (
        '<div class="song">' +
          coverHtml(s) +
          '<div class="meta">' +
            '<span class="title">' + escape(s.title) + '</span> &mdash; ' +
            '<span class="artist">' + escape(byline(s)) + '</span><br>' +
            '<span class="tags">' + escape(rolesLabel(s.roles)) + noteHtml(s) + '</span>' +
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

  fetch("/data/songs.json")
    .then(function (r) {
      if (!r.ok) throw new Error("songs.json: " + r.status);
      return r.json();
    })
    .then(function (data) {
      // Display order == file order. Deliberate: release dates don't always
      // match how the work groups (same-day EP tracks, production order), so
      // the order is curated by hand in data/songs.json rather than sorted.
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
