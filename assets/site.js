(() => {
  "use strict";

  document.documentElement.classList.add("js");

  // The links still work normally when JavaScript is unavailable.
  const menuToggle = document.getElementById("menu-toggle");
  const navigation = document.getElementById("site-nav");

  if (menuToggle && navigation) {
    const closeMenu = (returnFocus = false) => {
      const wasOpen = menuToggle.getAttribute("aria-expanded") === "true";
      menuToggle.setAttribute("aria-expanded", "false");
      menuToggle.classList.remove("is-open");
      navigation.classList.remove("is-open");
      if (returnFocus && wasOpen) menuToggle.focus();
    };

    menuToggle.addEventListener("click", () => {
      const open = menuToggle.getAttribute("aria-expanded") !== "true";
      menuToggle.setAttribute("aria-expanded", String(open));
      menuToggle.classList.toggle("is-open", open);
      navigation.classList.toggle("is-open", open);
    });

    navigation.addEventListener("click", (event) => {
      if (event.target.closest("a")) closeMenu();
    });

    document.addEventListener("click", (event) => {
      if (
        !navigation.contains(event.target) &&
        !menuToggle.contains(event.target)
      ) {
        closeMenu();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMenu(true);
    });

    const desktop = window.matchMedia("(min-width: 900px)");
    desktop.addEventListener("change", (event) => {
      if (event.matches) closeMenu();
    });
  }

  const filterButtons = [...document.querySelectorAll("[data-filter]")];
  const galleryItems = [
    ...document.querySelectorAll(".gallery-item[data-category]"),
  ];
  const galleryStatus = document.getElementById("gallery-status");

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      let count = 0;

      galleryItems.forEach((item) => {
        item.hidden = filter !== "all" && item.dataset.category !== filter;
        if (!item.hidden) count += 1;
      });

      filterButtons.forEach((candidate) => {
        const selected = candidate === button;
        candidate.setAttribute("aria-pressed", String(selected));
        candidate.classList.toggle("is-active", selected);
      });

      if (galleryStatus)
        galleryStatus.textContent = `${count}件の作品を表示しています`;
    });
  });

  const dialog = document.getElementById("image-dialog");
  const dialogImage = document.getElementById("dialog-image");
  const dialogTitle = document.getElementById("dialog-title");
  const dialogCounter = document.getElementById("dialog-counter");
  const dialogError = document.getElementById("dialog-error");
  const previousButton = document.getElementById("dialog-prev");
  const nextButton = document.getElementById("dialog-next");
  const closeButton = document.getElementById("dialog-close");
  const lightboxTriggers = [...document.querySelectorAll("[data-lightbox]")];
  let activeItems = [];
  let activeIndex = 0;
  let originalTrigger = null;

  const renderImage = () => {
    const item = activeItems[activeIndex];
    if (!item || !dialogImage) return;

    const title =
      item.dataset.title || item.querySelector("img")?.alt || "制作作品";
    if (dialogTitle) dialogTitle.textContent = title;
    if (dialogCounter)
      dialogCounter.textContent = `${activeIndex + 1} / ${activeItems.length}`;
    if (dialogError) dialogError.hidden = true;

    dialogImage.hidden = false;
    dialogImage.alt = title;
    dialogImage.src = item.dataset.full;
    if (previousButton) previousButton.disabled = activeItems.length < 2;
    if (nextButton) nextButton.disabled = activeItems.length < 2;
  };

  const changeImage = (direction) => {
    if (!dialog?.open || activeItems.length < 2) return;
    activeIndex =
      (activeIndex + direction + activeItems.length) % activeItems.length;
    renderImage();
  };

  lightboxTriggers.forEach((trigger) => {
    trigger.addEventListener("click", (event) => {
      if (
        event.button !== 0 ||
        event.ctrlKey ||
        event.metaKey ||
        event.shiftKey ||
        event.altKey
      )
        return;
      const imageUrl = trigger.dataset.full;
      if (!imageUrl) return;
      event.preventDefault();

      if (!dialog || !dialogImage || typeof dialog.showModal !== "function") {
        window.location.assign(imageUrl);
        return;
      }

      activeItems = lightboxTriggers.filter(
        (item) => !item.hidden && !item.closest(".gallery-item")?.hidden,
      );
      activeIndex = activeItems.indexOf(trigger);
      if (activeIndex < 0) return;
      originalTrigger = trigger;
      renderImage();
      dialog.showModal();
      document.body.classList.add("dialog-open");
      closeButton?.focus();
    });
  });

  if (dialog && dialogImage) {
    dialogImage.addEventListener("error", () => {
      dialogImage.hidden = true;
      if (dialogError) dialogError.hidden = false;
    });

    closeButton?.addEventListener("click", () => dialog.close());
    previousButton?.addEventListener("click", () => changeImage(-1));
    nextButton?.addEventListener("click", () => changeImage(1));

    dialog.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        changeImage(event.key === "ArrowLeft" ? -1 : 1);
      }
    });

    const isBackdrop = (event) => {
      const bounds = dialog.getBoundingClientRect();
      return (
        event.target === dialog &&
        (event.clientX < bounds.left ||
          event.clientX > bounds.right ||
          event.clientY < bounds.top ||
          event.clientY > bounds.bottom)
      );
    };
    let beganOnBackdrop = false;
    dialog.addEventListener("pointerdown", (event) => {
      beganOnBackdrop = isBackdrop(event);
    });
    dialog.addEventListener("click", (event) => {
      if (beganOnBackdrop && isBackdrop(event)) dialog.close();
      beganOnBackdrop = false;
    });
    dialog.addEventListener("close", () => {
      document.body.classList.remove("dialog-open");
      if (
        originalTrigger?.isConnected &&
        !originalTrigger.closest(".gallery-item")?.hidden
      ) {
        originalTrigger.focus({ preventScroll: true });
      }
    });
  }

  // Highlight the section in view without changing native anchor navigation.
  if (navigation && "IntersectionObserver" in window) {
    const links = [...navigation.querySelectorAll('a[href^="#"]')];
    const sections = links
      .map((link) => document.getElementById(link.hash.slice(1)))
      .filter(Boolean);
    const visibleSections = new Set();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) visibleSections.add(entry.target);
          else visibleSections.delete(entry.target);
        });
        const active = [...visibleSections].sort(
          (a, b) =>
            Math.abs(a.getBoundingClientRect().top) -
            Math.abs(b.getBoundingClientRect().top),
        )[0];
        links.forEach((link) => {
          if (active && link.hash === `#${active.id}`)
            link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      },
      { rootMargin: "-15% 0px -55% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
  }
})();
