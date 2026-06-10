(() => {
  'use strict';

  const ready = (callback) => {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', callback, { once: true });
      return;
    }

    callback();
  };

  ready(() => {
    const easeOutCubic = (value) => 1 - Math.pow(1 - value, 3);

    const animateScroll = (track, targetLeft, duration = 450) => {
      const startLeft = track.scrollLeft;
      const distance = targetLeft - startLeft;

      if (Math.abs(distance) < 1) {
        track.scrollLeft = targetLeft;
        return;
      }

      const startTime = performance.now();

      const step = (currentTime) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        track.scrollLeft = startLeft + distance * easeOutCubic(progress);

        if (progress < 1) {
          track.__productReelsScrollId = window.requestAnimationFrame(step);
        }
      };

      window.cancelAnimationFrame(track.__productReelsScrollId);
      track.__productReelsScrollId = window.requestAnimationFrame(step);
    };

    const getScrollAmount = (track) => Math.max(210, Math.round(track.clientWidth * 0.75));

    document.querySelectorAll('.reels-wrap').forEach((wrap) => {
      const grid = wrap.querySelector('.reels-grid');

      if (!grid) {
        return;
      }

      wrap.querySelector('.reels-control--prev')?.addEventListener('click', () => {
        animateScroll(grid, Math.max(0, grid.scrollLeft - getScrollAmount(grid)));
      });

      wrap.querySelector('.reels-control--next')?.addEventListener('click', () => {
        animateScroll(grid, grid.scrollLeft + getScrollAmount(grid));
      });

      let isDragging = false;
      let didDrag = false;
      let startX = 0;
      let startScrollLeft = 0;

      const endDrag = () => {
        if (!isDragging) {
          return;
        }

        isDragging = false;
        grid.classList.remove('is-dragging');
      };

      grid.addEventListener('pointerdown', (event) => {
        if (event.button !== 0) {
          return;
        }

        isDragging = true;
        didDrag = false;
        grid.dataset.productReelsDragged = '0';
        startX = event.clientX;
        startScrollLeft = grid.scrollLeft;
        grid.classList.add('is-dragging');
      });

      grid.addEventListener('pointermove', (event) => {
        if (!isDragging) {
          return;
        }

        const deltaX = event.clientX - startX;

        if (Math.abs(deltaX) > 6) {
          didDrag = true;
          grid.dataset.productReelsDragged = '1';
        }

        grid.scrollLeft = startScrollLeft - deltaX;
        event.preventDefault();
      });

      grid.addEventListener('pointerup', endDrag);
      grid.addEventListener('pointercancel', endDrag);

      grid.addEventListener('dragstart', (event) => {
        event.preventDefault();
      });

      grid.addEventListener('click', (event) => {
        if (!didDrag) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        didDrag = false;
        grid.dataset.productReelsDragged = '0';
      }, true);
    });

    const lightbox = document.createElement('div');
    lightbox.className = 'reel-lightbox';
    lightbox.setAttribute('role', 'dialog');
    lightbox.setAttribute('aria-modal', 'true');
    lightbox.setAttribute('aria-hidden', 'true');
    lightbox.innerHTML = '<div class="reel-lightbox__backdrop" aria-hidden="true"></div><div class="reel-lightbox__stage" aria-label="Reel em destaque"></div>';
    document.body.appendChild(lightbox);

    const stage = lightbox.querySelector('.reel-lightbox__stage');
    let activeVideo = null;

    const closeLightbox = () => {
      if (!activeVideo) {
        return;
      }

      activeVideo.pause();
      activeVideo.removeAttribute('src');
      activeVideo.load();
      activeVideo.remove();
      activeVideo = null;

      lightbox.classList.remove('is-open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = lightbox.dataset.previousBodyOverflow || '';
    };

    const getFullSrc = (videoWrap) => {
      const preview = videoWrap.querySelector('video');

      return videoWrap.getAttribute('data-full-src')
        || preview?.getAttribute('data-full-src')
        || videoWrap.closest('.reel-card')?.getAttribute('data-full-src')
        || preview?.currentSrc
        || preview?.getAttribute('src')
        || '';
    };

    const openLightbox = (src) => {
      if (!src) {
        return;
      }

      closeLightbox();

      activeVideo = document.createElement('video');
      activeVideo.src = src;
      activeVideo.controls = true;
      activeVideo.autoplay = true;
      activeVideo.playsInline = true;

      stage.replaceChildren(activeVideo);
      lightbox.dataset.previousBodyOverflow = document.body.style.overflow || '';
      document.body.style.overflow = 'hidden';
      lightbox.classList.add('is-open');
      lightbox.setAttribute('aria-hidden', 'false');
      activeVideo.play().catch(() => {});
    };

    document.querySelectorAll('.reel-video').forEach((videoWrap) => {
      videoWrap.addEventListener('click', (event) => {
        if (event.target.closest('a, button, input, select, textarea, label')) {
          return;
        }

        const grid = videoWrap.closest('.reels-grid');

        if (grid?.dataset.productReelsDragged === '1') {
          return;
        }

        const src = getFullSrc(videoWrap);

        if (!src) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        openLightbox(src);
      });
    });

    lightbox.addEventListener('click', (event) => {
      if (event.target === lightbox || event.target.classList.contains('reel-lightbox__backdrop')) {
        closeLightbox();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closeLightbox();
      }
    });

    if ('IntersectionObserver' in window) {
      const previews = Array.from(document.querySelectorAll('.reel-video__preview[src]'));

      if (previews.length) {
        const observer = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            const video = entry.target;

            if (entry.isIntersecting) {
              video.play().catch(() => {});
            } else {
              video.pause();
            }
          });
        }, { threshold: 0.25 });

        previews.forEach((video) => observer.observe(video));
      }
    }
  });
})();
