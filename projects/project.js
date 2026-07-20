// Shared behavior for project pages. Each page defines a PROJECT_DATA
// object before loading this script.

(function () {
  const data = window.PROJECT_DATA || { stills: [], photobook: null };
  const viewMode = data.viewMode || null;
  const isFilmView = viewMode === "film";
  const isWorksView = viewMode === "works";

  initBackLink();

  if (isFilmView) {
    initVideo(data);
    hideSection("stillViewer");
    hideSection("photobookSection");
  } else if (isWorksView) {
    hideSection("projectVideo");
    initStillViewer(data.stills || []);
    initPhotobook(data.photobook);
  } else {
    initVideo(data);
    initStillViewer(data.stills || []);
    initPhotobook(data.photobook);
  }

  function hideSection(id) {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  }

  function initVideo(data) {
    const frame = document.getElementById("videoFrame");
    const vimeoId = data && data.vimeoId;
    const poster = data && (data.poster || data.vimeoPoster);
    if (!frame || !vimeoId) return;

    function loadPlayer() {
      frame.classList.remove("video-poster");
      frame.innerHTML = "";
      const iframe = document.createElement("iframe");
      iframe.src =
        "https://player.vimeo.com/video/" +
        vimeoId +
        "?autoplay=1&title=0&byline=0&portrait=0";
      iframe.allow = "autoplay; fullscreen; picture-in-picture";
      iframe.allowFullscreen = true;
      iframe.title = document.title;
      frame.appendChild(iframe);
    }

    if (poster) {
      frame.classList.add("video-poster");
      const img = document.createElement("img");
      img.src = poster;
      img.alt = "";
      frame.appendChild(img);

      const playBtn = document.createElement("button");
      playBtn.className = "play-button";
      playBtn.setAttribute("aria-label", "Play video");
      frame.appendChild(playBtn);

      playBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        loadPlayer();
      });
      frame.addEventListener("click", loadPlayer);
      return;
    }

    loadPlayer();
  }

  function initBackLink() {
    const link = document.createElement("a");
    link.className = "back-link";
    link.href = "../../";
    link.textContent = "BACK";
    document.body.insertBefore(link, document.body.firstChild);
  }

  function initStillViewer(stills) {
    const frame = document.getElementById("stillFrame");
    if (!frame) return;

    if (stills.length === 0) {
      frame.innerHTML =
        '<div class="still-empty">Add images to <code>media/stills/</code> ' +
        "and list them in this page's <code>PROJECT_DATA.stills</code> array.</div>";
      const caption = document.getElementById("stillCaption");
      if (caption) caption.style.display = "none";
      return;
    }

    const hasCaptions = stills.some((item) => item.time || item.label);
    if (!hasCaptions && stills.length < 2) {
      const caption = document.getElementById("stillCaption");
      if (caption) caption.style.display = "none";
    }

    let index = 0;
    let mediaEl = null;

    const timeEl = document.getElementById("stillTime");
    const labelEl = document.getElementById("stillLabel");
    const prevBtn = document.getElementById("stillPrev");
    const nextBtn = document.getElementById("stillNext");

    render();

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        index = (index - 1 + stills.length) % stills.length;
        render();
      });
      prevBtn.disabled = stills.length < 2;
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        index = (index + 1) % stills.length;
        render();
      });
      nextBtn.disabled = stills.length < 2;
    }

    function render() {
      const still = stills[index];
      const isVimeo = still.type === "vimeo" || still.vimeoId;
      const isVideo =
        !isVimeo &&
        (still.type === "video" || /\.(mp4|webm|mov)$/i.test(still.src || ""));

      if (isVimeo) {
        frame.innerHTML = "";
        mediaEl = null;
        renderVimeoSlide(still, frame);
      } else if (
        !mediaEl ||
        (isVideo && mediaEl.tagName !== "VIDEO") ||
        (!isVideo && mediaEl.tagName !== "IMG")
      ) {
        frame.innerHTML = "";
        mediaEl = document.createElement(isVideo ? "video" : "img");
        if (isVideo) {
          mediaEl.controls = false;
          mediaEl.autoplay = true;
          mediaEl.muted = true;
          mediaEl.loop = true;
          mediaEl.playsInline = true;
        }
        frame.appendChild(mediaEl);
      }

      if (isVimeo) {
        if (timeEl) timeEl.textContent = still.time ? still.time + " " : "";
        if (labelEl) labelEl.textContent = still.label || "";
        return;
      }

      if (isVideo) {
        if (mediaEl.getAttribute("src") !== still.src) {
          mediaEl.src = still.src;
          mediaEl.load();
        }
        mediaEl.alt = still.label || "";
      } else {
        mediaEl.src = still.src;
        mediaEl.alt = still.label || "";
      }

      if (timeEl) timeEl.textContent = still.time ? still.time + " " : "";
      if (labelEl) labelEl.textContent = still.label || "";
    }

    function renderVimeoSlide(still, frame) {
      const vimeoId = still.vimeoId;
      const poster = still.poster || still.vimeoPoster;
      const wrapper = document.createElement("div");
      wrapper.className = "video-frame";

      function loadPlayer() {
        wrapper.className = "video-frame";
        wrapper.innerHTML = "";
        const iframe = document.createElement("iframe");
        iframe.src =
          "https://player.vimeo.com/video/" +
          vimeoId +
          "?autoplay=1&title=0&byline=0&portrait=0";
        iframe.allow = "autoplay; fullscreen; picture-in-picture";
        iframe.allowFullscreen = true;
        iframe.title = document.title;
        wrapper.appendChild(iframe);
      }

      if (poster) {
        wrapper.classList.add("video-poster");
        const img = document.createElement("img");
        img.src = poster;
        img.alt = "";
        wrapper.appendChild(img);

        const playBtn = document.createElement("button");
        playBtn.className = "play-button";
        playBtn.setAttribute("aria-label", "Play video");
        wrapper.appendChild(playBtn);

        playBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          loadPlayer();
        });
        wrapper.addEventListener("click", loadPlayer);
      } else {
        loadPlayer();
      }

      frame.appendChild(wrapper);
    }
  }

  function initPhotobook(photobook) {
    const section = document.getElementById("photobookSection");
    const captionEl = document.getElementById("photobookCaption");
    const inlineFrame = document.getElementById("photobookFrame");

    if (!section) return;

    const spreads = (photobook && photobook.spreads) || [];
    const stripeUrl = photobook && photobook.stripeUrl;
    const caption = (photobook && photobook.caption) || "";
    const price = (photobook && photobook.price) || "";
    const hasLegacyThumbs = document.getElementById("photobookThumbs");

    if (!spreads.length && !stripeUrl && !caption && !hasLegacyThumbs) {
      section.style.display = "none";
      return;
    }

    if (captionEl) {
      if (caption && stripeUrl) {
        captionEl.innerHTML =
          caption +
          "<br>" +
          (price ? price + " " : "") +
          '— <a href="' +
          stripeUrl +
          '" target="_blank" rel="noopener">[order here]</a>';
      } else if (caption) {
        captionEl.textContent = caption;
      }
    }

    if (inlineFrame) {
      initPhotobookViewer(spreads);
      return;
    }

    initLegacyPhotobook(photobook, spreads, stripeUrl);
  }

  function initPhotobookViewer(spreads) {
    const frame = document.getElementById("photobookFrame");
    const prevBtn = document.getElementById("photobookPrev");
    const nextBtn = document.getElementById("photobookNext");
    const nav = document.getElementById("photobookNav");

    if (!frame || spreads.length === 0) {
      if (frame) {
        frame.innerHTML =
          '<div class="photobook-empty">Add spread images to <code>PROJECT_DATA.photobook.spreads</code>.</div>';
      }
      if (nav) nav.style.display = "none";
      return;
    }

    let index = 0;
    const img = document.createElement("img");
    img.alt = "Photobook spread";
    frame.appendChild(img);

    function render() {
      img.src = spreads[index];
    }

    render();

    if (prevBtn) {
      prevBtn.addEventListener("click", () => {
        index = (index - 1 + spreads.length) % spreads.length;
        render();
      });
      prevBtn.disabled = spreads.length < 2;
    }

    if (nextBtn) {
      nextBtn.addEventListener("click", () => {
        index = (index + 1) % spreads.length;
        render();
      });
      nextBtn.disabled = spreads.length < 2;
    }
  }

  function initLegacyPhotobook(photobook, spreads, stripeUrl) {
    const thumbWrap = document.getElementById("photobookThumbs");
    const hasCover = photobook && (photobook.cover || photobook.wrapped);

    if (!hasCover) {
      if (thumbWrap) thumbWrap.style.display = "none";
    } else if (thumbWrap) {
      const coverSrc = photobook.cover || photobook.wrapped;
      const wrappedSrc = photobook.wrapped || photobook.cover;
      const buttons = thumbWrap.querySelectorAll("[data-open-lightbox]");
      const imgs = thumbWrap.querySelectorAll("img");

      if (imgs[0]) {
        imgs[0].src = coverSrc;
        imgs[0].alt = "Photobook cover";
      }
      if (imgs[1]) {
        imgs[1].src = wrappedSrc;
        imgs[1].alt = "Photobook";
      }

      buttons.forEach((btn) => btn.addEventListener("click", () => openLightbox(0)));
    }

    setupLightbox(spreads, stripeUrl);
  }

  function setupLightbox(spreads, stripeUrl) {
    const overlay = document.getElementById("lightbox");
    if (!overlay) return;

    const imageWrap = document.getElementById("lightboxImageWrap");
    const counter = document.getElementById("lightboxCounter");
    const prevBtn = document.getElementById("lightboxPrev");
    const nextBtn = document.getElementById("lightboxNext");
    const closeBtn = document.getElementById("lightboxClose");
    const buyEl = document.getElementById("lightboxBuy");
    let index = 0;

    if (buyEl) {
      buyEl.innerHTML = stripeUrl
        ? '<a class="lightbox-buy" href="' + stripeUrl + '" target="_blank" rel="noopener">Order photobook →</a>'
        : "";
    }

    window.openLightbox = function (startIndex) {
      index = startIndex || 0;
      render();
      overlay.classList.add("open");
      document.addEventListener("keydown", onKeydown);
    };

    function close() {
      overlay.classList.remove("open");
      document.removeEventListener("keydown", onKeydown);
    }

    function onKeydown(e) {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    }

    function step(delta) {
      if (spreads.length === 0) return;
      index = (index + delta + spreads.length) % spreads.length;
      render();
    }

    function render() {
      if (spreads.length === 0) {
        imageWrap.innerHTML =
          '<div class="lightbox-empty">Add spread images to <code>PROJECT_DATA.photobook.spreads</code>.</div>';
      } else {
        imageWrap.innerHTML = '<img src="' + spreads[index] + '" alt="">';
      }
      if (counter) {
        counter.textContent = spreads.length ? index + 1 + " / " + spreads.length : "";
      }
      if (prevBtn) prevBtn.disabled = spreads.length < 2;
      if (nextBtn) nextBtn.disabled = spreads.length < 2;
    }

    if (prevBtn) prevBtn.addEventListener("click", () => step(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => step(1));
    if (closeBtn) closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
  }
})();
