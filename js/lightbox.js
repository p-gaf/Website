(function () {
  "use strict";

  var overlay, imgEl, captionEl;
  var current = { images: [], idx: 0 };

  function ensureOverlay() {
    if (overlay) return;
    overlay = document.createElement("div");
    overlay.className = "lb-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.setAttribute("aria-label", "Image viewer");
    overlay.innerHTML = '<img alt=""><div class="lb-caption"></div>';
    document.body.appendChild(overlay);
    imgEl = overlay.querySelector("img");
    captionEl = overlay.querySelector(".lb-caption");

    overlay.addEventListener("click", close);
    imgEl.addEventListener("click", function (e) { e.stopPropagation(); next(1); });

    document.addEventListener("keydown", function (e) {
      if (!overlay.classList.contains("open")) return;
      if (e.key === "Escape") close();
      else if (e.key === "ArrowRight") next(1);
      else if (e.key === "ArrowLeft") next(-1);
    });
  }

  function show(idx) {
    var item = current.images[idx];
    if (!item) return;
    current.idx = idx;
    imgEl.src = item.src;
    imgEl.alt = item.caption || "";
    captionEl.textContent = item.caption || "";
  }

  function next(delta) {
    if (!current.images.length) return;
    var n = current.images.length;
    show((current.idx + delta + n) % n);
  }

  function open(images, idx) {
    ensureOverlay();
    current.images = images;
    show(idx);
    overlay.classList.add("open");
    document.documentElement.style.overflow = "hidden";
  }

  function close() {
    if (!overlay) return;
    overlay.classList.remove("open");
    imgEl.src = "";
    document.documentElement.style.overflow = "";
  }

  // Build gallery context from a clicked .lb image.
  // Images sharing the same data-gallery value form one gallery.
  // Images with no data-gallery use all .lb images on the page that also lack one
  // (typical for a project subpage).
  function galleryFor(img) {
    var key = img.getAttribute("data-gallery");
    var nodes;
    if (key) {
      nodes = document.querySelectorAll('.lb[data-gallery="' + key + '"]');
    } else {
      nodes = document.querySelectorAll(".lb:not([data-gallery])");
    }
    var list = [];
    var startIdx = 0;
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      list.push({ src: n.getAttribute("src"), caption: n.getAttribute("alt") || "" });
      if (n === img) startIdx = i;
    }
    return { images: list, idx: startIdx };
  }

  document.addEventListener("click", function (e) {
    var img = e.target.closest("img.lb");
    if (!img) return;
    e.preventDefault();
    var g = galleryFor(img);
    open(g.images, g.idx);
  });
})();
