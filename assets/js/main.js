/**
 * Portfolio — vanilla JS (no dependencies)
 */
(function () {
  "use strict";

  var header = document.getElementById("site-header");
  var navToggle = document.getElementById("nav-toggle");
  var mobileNav = document.getElementById("mobile-nav");
  var mobileBackdrop = document.getElementById("mobile-nav-backdrop");
  var scrollTopBtn = document.getElementById("scroll-top");
  var contactForm = document.getElementById("contact-form");
  var projectsGrid = document.getElementById("projects-grid");
  var themesLoadMoreWrap = document.getElementById("themes-load-more-wrap");
  var themesLoadMoreBtn = document.getElementById("themes-load-more-btn");

  var navLinks = document.querySelectorAll(
    ".site-nav__link, .mobile-nav__link"
  );
  var sections = document.querySelectorAll("section[id]");
  var filterBtns = document.querySelectorAll(".filter-tabs__btn");

  var currentFilter = "all";
  var themesVisibleLimit = 12;
  var themesPerPage = 12;
  var themeFallbackImage =
    "assets/images/banner/hero-developer-workstation.jpeg";

  var sectionIds = Array.prototype.map.call(sections, function (s) {
    return s.id;
  });

  function getProjectCards() {
    return document.querySelectorAll(".project-card");
  }

  function isThemeCard(card) {
    var cats = (card.getAttribute("data-category") || "").split(" ");
    return cats.indexOf("themes") !== -1;
  }

  function getThemeIndex(card) {
    return parseInt(card.getAttribute("data-theme-index") || "0", 10);
  }

  function cardMatchesFilter(card, filter) {
    var cats = (card.getAttribute("data-category") || "").split(" ");
    var theme = isThemeCard(card);
    var themeVisible = getThemeIndex(card) < themesVisibleLimit;

    if (filter === "all") {
      return !theme || themeVisible;
    }
    if (filter === "themes") {
      return theme && themeVisible;
    }
    if (filter === "wordpress") {
      return cats.indexOf("wordpress") !== -1 && (!theme || themeVisible);
    }
    return cats.indexOf(filter) !== -1;
  }

  function updateLoadMoreButton() {
    if (!themesLoadMoreWrap || !window.THEME_DEMOS) return;

    var total = window.THEME_DEMOS.length;
    var paginatedFilter =
      currentFilter === "all" ||
      currentFilter === "themes" ||
      currentFilter === "wordpress";

    themesLoadMoreWrap.hidden =
      !paginatedFilter || themesVisibleLimit >= total;
  }

  function applyFilter(filter) {
    currentFilter = filter;

    getProjectCards().forEach(function (card) {
      card.classList.toggle("is-hidden", !cardMatchesFilter(card, filter));
    });

    updateLoadMoreButton();
  }

  function createEl(tag, className, text) {
    var el = document.createElement(tag);
    if (className) el.className = className;
    if (text) el.textContent = text;
    return el;
  }

  function renderThemeCards() {
    if (!projectsGrid || !window.THEME_DEMOS) return;

    window.THEME_DEMOS.forEach(function (theme, index) {
      var article = createEl("article", "project-card theme-card");
      article.setAttribute("data-category", "themes wordpress");
      article.setAttribute("data-theme-index", String(index));

      var thumb = createEl("div", "project-card__thumb");
      var img = document.createElement("img");
      img.src = theme.image;
      img.alt = theme.name + " WordPress theme demo";
      img.loading = "lazy";
      img.width = 640;
      img.height = 400;

      img.addEventListener("error", function onImgError() {
        img.removeEventListener("error", onImgError);
        if (img.src.indexOf(themeFallbackImage) === -1) {
          img.src = themeFallbackImage;
          return;
        }
        thumb.classList.add("project-card__thumb--fallback");
        thumb.setAttribute("data-label", theme.name);
        img.style.display = "none";
      });

      thumb.appendChild(img);

      var body = createEl("div", "project-card__body");
      body.appendChild(
        createEl("span", "project-card__category", "ThemeForest · Live demo")
      );
      body.appendChild(createEl("h3", "project-card__title", theme.name));
      body.appendChild(
        createEl(
          "p",
          "project-card__desc",
          "Premium WordPress theme—responsive layouts, niche demo, and production-ready frontend craft."
        )
      );

      var tags = createEl("ul", "project-card__tags");
      ["WordPress", "Theme"].forEach(function (label) {
        var li = document.createElement("li");
        li.appendChild(createEl("span", "tag", label));
        tags.appendChild(li);
      });
      body.appendChild(tags);

      var actions = createEl("div", "project-card__actions");
      var link = createEl("a", "project-card__link project-card__link--primary", "Live site");
      link.href = theme.url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      actions.appendChild(link);
      body.appendChild(actions);

      article.appendChild(thumb);
      article.appendChild(body);
      projectsGrid.appendChild(article);
    });
  }

  function onScroll() {
    var y = window.scrollY || document.documentElement.scrollTop;

    if (header) {
      header.classList.toggle("is-scrolled", y > 24);
    }

    if (scrollTopBtn) {
      scrollTopBtn.classList.toggle("is-visible", y > 400);
    }

    updateActiveNav();
  }

  function updateActiveNav() {
    var scrollPos = (window.scrollY || document.documentElement.scrollTop) + 120;
    var current = "home";

    sectionIds.forEach(function (id) {
      var el = document.getElementById(id);
      if (el && el.offsetTop <= scrollPos) {
        current = id;
      }
    });

    navLinks.forEach(function (link) {
      var href = link.getAttribute("href");
      var isActive = href === "#" + current;
      link.classList.toggle("is-active", isActive);
      if (link.closest(".mobile-nav")) {
        link.setAttribute("aria-current", isActive ? "page" : null);
      }
    });
  }

  function openMobileNav() {
    mobileNav.classList.add("is-open");
    mobileNav.setAttribute("aria-hidden", "false");
    navToggle.setAttribute("aria-expanded", "true");
    document.body.style.overflow = "hidden";
  }

  function closeMobileNav() {
    mobileNav.classList.remove("is-open");
    mobileNav.setAttribute("aria-hidden", "true");
    navToggle.setAttribute("aria-expanded", "false");
    document.body.style.overflow = "";
  }

  if (navToggle) {
    navToggle.addEventListener("click", function () {
      if (mobileNav.classList.contains("is-open")) {
        closeMobileNav();
      } else {
        openMobileNav();
      }
    });
  }

  if (mobileBackdrop) {
    mobileBackdrop.addEventListener("click", closeMobileNav);
  }

  navLinks.forEach(function (link) {
    link.addEventListener("click", closeMobileNav);
  });

  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      closeMobileNav();
    }
  });

  document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener("click", function (e) {
      var targetId = this.getAttribute("href");
      if (!targetId || targetId === "#") return;

      var target = document.querySelector(targetId);
      if (!target) return;

      e.preventDefault();
      var offset = header ? header.offsetHeight : 0;
      var top =
        target.getBoundingClientRect().top + window.pageYOffset - offset;

      window.scrollTo({ top: top, behavior: "smooth" });
      history.pushState(null, "", targetId);
    });
  });

  if (scrollTopBtn) {
    scrollTopBtn.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  filterBtns.forEach(function (btn) {
    btn.addEventListener("click", function () {
      var filter = btn.getAttribute("data-filter");

      filterBtns.forEach(function (b) {
        var active = b === btn;
        b.classList.toggle("is-active", active);
        b.setAttribute("aria-selected", active ? "true" : "false");
      });

      applyFilter(filter);
    });
  });

  if (themesLoadMoreBtn) {
    themesLoadMoreBtn.addEventListener("click", function () {
      themesVisibleLimit += themesPerPage;
      applyFilter(currentFilter);
    });
  }

  if (contactForm) {
    contactForm.addEventListener("submit", function (e) {
      e.preventDefault();
      if (!contactForm.checkValidity()) {
        contactForm.reportValidity();
        return;
      }

      var nameEl = document.getElementById("name");
      var emailEl = document.getElementById("email");
      var messageEl = document.getElementById("message");
      var name = nameEl ? nameEl.value.trim() : "";
      var email = emailEl ? emailEl.value.trim() : "";
      var message = messageEl ? messageEl.value.trim() : "";
      var subject = encodeURIComponent("Portfolio inquiry from " + name);
      var body = encodeURIComponent(
        "Name: " + name + "\nEmail: " + email + "\n\n" + message
      );

      window.location.href =
        "mailto:mdabubakkers99@gmail.com?subject=" + subject + "&body=" + body;
    });
  }

  renderThemeCards();
  applyFilter("all");

  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
})();
