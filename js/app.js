
    /**************************************************************
     * 1. CONFIG.JS — API KEYS PLACEHOLDERS & DEFAULT SETTINGS
     * تقدر تعمر السوارت ديالك هنا مباشرة فـ الكود أولا من نافذة 🔑 الفوق!
     **************************************************************/
    // STUDIO_CONFIG is loaded from js/config.js

    /**************************************************************
     * 2. APPLICATION STATE (Starts 100% Neutral as Recommended)
     **************************************************************/
    const state = {
      film: {
        title: "",
        year: "",
        director: "",
        genre: "",
        tmdbId: "",
        imdbId: "",
        posterUrl: "",
        backdropUrl: STUDIO_CONFIG.DEFAULT_BACKDROP,
        clearLogoUrl: "",
        source: "Manual Entry"
      },
      rating: null,       // Neutral start (null = Unrated)
      liked: false,       // Neutral start
      elements: {},       // Neutral start (empty = No opinion)
      vibes: new Set(),
      fanartAssets: [],   // Stores backdrops, thumbs, and logos from Fanart.tv & TMDB
      csvMovies: [],
      dna: {
        favFilms: "",
        criticalFocus: "",
        samples: "",
        avoidWords: ""
      },
      generatedVariations: [],
      selectedVariationIndex: 0
    };

    const CINEMATIC_ELEMENTS = [
      { id: "story", label: "القصة والسيناريو (Story & Script)" },
      { id: "direction", label: "الإخراج والرؤية (Direction)" },
      { id: "acting", label: "التمثيل والأداء (Acting & Cast)" },
      { id: "cinematography", label: "التصوير والإضاءة (Cinematography)" },
      { id: "pacing", label: "الإيقاع (Pacing — واش داز دغيا ولا ثقيل)" },
      { id: "score", label: "الموسيقى والصوت (Score & Sound Design)" },
      { id: "editing", label: "المونتاج والتقطيع (Editing)" },
      { id: "dialogue", label: "الحوارات (Dialogue)" },
      { id: "worldbuilding", label: "الديكور والأجواء (Production Design & Atmosphere)" },
      { id: "ending", label: "النهاية ديال الفيلم (The Ending)" }
    ];

    const VIBE_OPTIONS = [
      "تحفة فنية (Masterpiece) 🏆",
      "خلاني نفكر بزاف 🧠",
      "شدني من اللول حتى اللخر ⚡",
      "متعة بصرية خيالية 🎨",
      "أجواء مظلمة ونفسية 🌑",
      "كلاسيكية ما كتموتش 🎞️",
      "ضحكني ووسع خاطري 😂",
      "قاصح ومؤثر عاطفياً 💔",
      "غريب وفريد من نوعو 🌀",
      "أوفرريتد شوية (Overrated)  overrated",
      "مظلوم إعلامياً (Underrated) 💎",
      "فيلم ديال نص الليل 🌙"
    ];

    /**************************************************************
     * 3. INITIALIZATION & SAFE DOM BUILDERS
     **************************************************************/
    window.addEventListener("DOMContentLoaded", () => {
      loadSavedConfigAndDNA();
      renderStarButtons();
      renderElementsMatrix();
      renderVibeChips();
      renderJournalCount();
      updateMasterPromptPreview();
      initDesignEnhancements();
      initCinematikWizard();
    });

    /* ══════════════════════════════════════════════════════════════
       CINÉMATIK WIZARD — 5 phases façon Netflix / Apple TV
       (vissage visuel : ما كيبدل والو فـ الـ logic ولا الـ IDs)
       ══════════════════════════════════════════════════════════════ */
    let wizCurrentStep = 1;
    const WIZ_TOTAL_STEPS = 5;
    const WIZ_HINTS = {
      1: "▶ المرحلة 1 من 5 — قلب أولًا على الفيلم (بحث · RSS · CSV)، البوستر والخلفيات كتجي أوتوماتيكياً",
      2: "▶ المرحلة 2 من 5 — عطي النجمات ديالك وحدد سياق المشاهدة (كلشي اختياري ومحايد بالبداية)",
      3: "▶ المرحلة 3 من 5 — حلّل العناصر اللي عاجباك، وضيف tags الـ Vibe والفكرة الحرة ديالك",
      4: "▶ المرحلة 4 من 5 — اضبط النبرة، الطول، اللغة، والـ Sliders ديال الـ AI",
      5: "▶ المرحلة 5 من 5 — ولّد المراجعة، عدّل النسخ، وصدّر كلشي (Markdown · ZIP)"
    };

    function isPhaseComplete(step) {
      switch (step) {
        case 1: return !!(state.film.title && state.film.title.trim());
        case 2: return state.rating !== null || state.liked;
        case 3: return Object.keys(state.elements).length > 0 || state.vibes.size > 0;
        case 4: return true; // réglages toujours valides (neutres par défaut)
        case 5: return state.generatedVariations.length > 0;
        default: return false;
      }
    }

    function goToStep(n, opts = {}) {
      n = Math.max(1, Math.min(WIZ_TOTAL_STEPS, n));
      wizCurrentStep = n;

      // Panels visibility + relance de l'animation d'entrée
      document.querySelectorAll(".wiz-panel").forEach((p) => {
        const active = Number(p.dataset.step) === n;
        p.classList.toggle("hidden", !active);
        if (active && !opts.silent) {
          p.style.animation = "none";
          void p.offsetWidth; // reflow
          p.style.animation = "";
        }
      });

      // Step buttons states
      for (let i = 1; i <= WIZ_TOTAL_STEPS; i++) {
        const btn = document.querySelector(`[data-step-btn="${i}"]`);
        if (!btn) continue;
        btn.classList.toggle("is-active", i === n);
        btn.classList.toggle("is-done", i < n && isPhaseComplete(i));
      }

      // Hint + progress bar (Netflix-style red bar)
      const hint = document.getElementById("wizardHint");
      if (hint) hint.textContent = WIZ_HINTS[n];
      const doneCount = Array.from({ length: WIZ_TOTAL_STEPS }, (_, k) => k + 1).filter(isPhaseComplete).length;
      const pct = Math.round(((doneCount + (n - 1)) / (WIZ_TOTAL_STEPS * 2 - 1)) * 100);
      const bar = document.getElementById("wizardProgressBar");
      if (bar) bar.style.width = `${Math.min(100, pct)}%`;

      // Scroll to wizard nav top (sauf au chargement silencieux)
      if (!opts.silent) {
        const nav = document.getElementById("wizardNav");
        if (nav) nav.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }

    function nextStep() {
      // Guide l'utilisateur : si phase courante incomplète, on le lui dit joliment
      if (!isPhaseComplete(wizCurrentStep) && wizCurrentStep < WIZ_TOTAL_STEPS) {
        const msgs = {
          1: "⚠️ قلب أولًا على الفيلم ولا كتب سميته يدوياً فالبوكس ديال فوق قبل ما تكمل!",
          2: "💡 نصيحة: عطي غير نجمة ولا Liked قبل ما تمشي للمرحلة الجاية (ولا تجاوز إلا بغيتي).",
          3: "💡 حلّل عنصر واحد على الأقل ولا ضيف tag ديال الـ Vibe باش تخرج المراجعة بشخصيتك."
        };
        showToast(msgs[wizCurrentStep] || "كمّل هاد المرحلة ولا تجاوزها.", true);
      }
      goToStep(wizCurrentStep + 1);
    }

    function prevStep() { goToStep(wizCurrentStep - 1); }

    function initCinematikWizard() {
      goToStep(1, { silent: true });
      // Refresh des états à chaque interaction (rating, vibes, sélection film…)
      document.addEventListener("click", () => requestAnimationFrame(() => goToStep(wizCurrentStep, { silent: true })));
      document.addEventListener("change", () => requestAnimationFrame(() => goToStep(wizCurrentStep, { silent: true })));
      document.addEventListener("input", () => requestAnimationFrame(() => goToStep(wizCurrentStep, { silent: true })));
    }

    /* ---- UI v4.1 "Aurora Cinema" design enhancements (visual-only) ---- */
    function initDesignEnhancements() {
      // 1) Cursor spotlight tracking on glass cards (--mx/--my for CSS glow)
      let rafPending = false;
      document.querySelectorAll(".cinema-glass").forEach((card) => {
        card.addEventListener("pointermove", (e) => {
          if (rafPending) return;
          rafPending = true;
          requestAnimationFrame(() => {
            rafPending = false;
            const r = card.getBoundingClientRect();
            card.style.setProperty("--mx", `${e.clientX - r.left}px`);
            card.style.setProperty("--my", `${e.clientY - r.top}px`);
          });
        });
      });

      // 2) Scroll-reveal entrance animation for main sections
      const revealEls = document.querySelectorAll("main section, main .grid > div > section");
      if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        const io = new IntersectionObserver((entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("is-visible");
              io.unobserve(entry.target);
            }
          });
        }, { threshold: 0.06, rootMargin: "0px 0px -40px 0px" });
        revealEls.forEach((el) => { el.classList.add("reveal"); io.observe(el); });
      }

      // 3) Close modals with Escape key & backdrop click (UX polish)
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") {
          ["apiModal", "dnaModal", "journalModal"].forEach((id) => {
            const m = document.getElementById(id);
            if (m && !m.classList.contains("hidden")) toggleModal(id);
          });
        }
      });
      ["apiModal", "dnaModal", "journalModal"].forEach((id) => {
        const modal = document.getElementById(id);
        if (!modal) return;
        modal.addEventListener("click", (e) => {
          if (e.target === modal) toggleModal(id);
        });
      });
    }

    function showToast(msg, isWarning = false) {
      const box = document.getElementById("toastBox");
      box.textContent = msg;
      box.className = `fixed bottom-5 left-5 z-50 px-5 py-3 rounded-2xl font-black text-xs shadow-2xl transition-all ${
        isWarning ? "bg-amber-400 text-black" : "bg-lx-teal text-black"
      }`;
      box.classList.remove("hidden");
      setTimeout(() => box.classList.add("hidden"), 3400);
    }

    function toggleModal(id) {
      const el = document.getElementById(id);
      if (!el) return;
      el.classList.toggle("hidden");
      if (id === "journalModal" && !el.classList.contains("hidden")) {
        renderJournalModalList();
      }
    }

    function getActiveKey(keyName) {
      const saved = JSON.parse(localStorage.getItem("lb_studio_api_keys") || "{}");
      return (saved[keyName] || STUDIO_CONFIG.API_KEYS[keyName] || "").trim();
    }

    function loadSavedConfigAndDNA() {
      const savedKeys = JSON.parse(localStorage.getItem("lb_studio_api_keys") || "{}");
      document.getElementById("cfgFanartKey").value = savedKeys.FANART_TV_API_KEY || STUDIO_CONFIG.API_KEYS.FANART_TV_API_KEY || "";
      document.getElementById("cfgTmdbKey").value = savedKeys.TMDB_API_KEY || STUDIO_CONFIG.API_KEYS.TMDB_API_KEY || "";
      document.getElementById("cfgOmdbKey").value = savedKeys.OMDB_API_KEY || STUDIO_CONFIG.API_KEYS.OMDB_API_KEY || "";
      document.getElementById("cfgGeminiKey").value = savedKeys.GEMINI_API_KEY || STUDIO_CONFIG.API_KEYS.GEMINI_API_KEY || "";
      updateApiBadge();

      const savedDNA = JSON.parse(localStorage.getItem("lb_studio_writing_dna") || "{}");
      state.dna = {
        favFilms: savedDNA.favFilms || "",
        criticalFocus: savedDNA.criticalFocus || "",
        samples: savedDNA.samples || "",
        avoidWords: savedDNA.avoidWords || ""
      };
      document.getElementById("dnaFavFilms").value = state.dna.favFilms;
      document.getElementById("dnaCriticalFocus").value = state.dna.criticalFocus;
      document.getElementById("dnaSamples").value = state.dna.samples;
      document.getElementById("dnaAvoidWords").value = state.dna.avoidWords;
    }

    function saveApiKeysFromModal() {
      const keys = {
        FANART_TV_API_KEY: document.getElementById("cfgFanartKey").value.trim(),
        TMDB_API_KEY: document.getElementById("cfgTmdbKey").value.trim(),
        OMDB_API_KEY: document.getElementById("cfgOmdbKey").value.trim(),
        GEMINI_API_KEY: document.getElementById("cfgGeminiKey").value.trim()
      };
      localStorage.setItem("lb_studio_api_keys", JSON.stringify(keys));
      updateApiBadge();
      toggleModal("apiModal");
      showToast("✅ تم حفظ مفاتيح الـ API بنجاح!");
    }

    function clearApiKeys() {
      localStorage.removeItem("lb_studio_api_keys");
      document.getElementById("cfgFanartKey").value = "";
      document.getElementById("cfgTmdbKey").value = "";
      document.getElementById("cfgOmdbKey").value = "";
      document.getElementById("cfgGeminiKey").value = "";
      updateApiBadge();
      showToast("🗑️ تم مسح المفاتيح من المتصفح.");
    }

    function togglePasswordVisibility(show) {
      const type = show ? "text" : "password";
      ["cfgFanartKey", "cfgTmdbKey", "cfgOmdbKey", "cfgGeminiKey"].forEach(id => {
        document.getElementById(id).type = type;
      });
    }

    function updateApiBadge() {
      const hasFanart = !!getActiveKey("FANART_TV_API_KEY");
      const hasTmdb = !!getActiveKey("TMDB_API_KEY");
      const badge = document.getElementById("apiStatusBadge");
      if (hasFanart && hasTmdb) {
        badge.className = "w-2.5 h-2.5 rounded-full bg-lx-teal shadow-[0_0_8px_#2dd4bf]";
      } else if (hasFanart || hasTmdb) {
        badge.className = "w-2.5 h-2.5 rounded-full bg-lx-teal";
      } else {
        badge.className = "w-2.5 h-2.5 rounded-full bg-amber-400";
      }
    }

    function saveWritingDNA() {
      state.dna = {
        favFilms: document.getElementById("dnaFavFilms").value.trim(),
        criticalFocus: document.getElementById("dnaCriticalFocus").value.trim(),
        samples: document.getElementById("dnaSamples").value.trim(),
        avoidWords: document.getElementById("dnaAvoidWords").value.trim()
      };
      localStorage.setItem("lb_studio_writing_dna", JSON.stringify(state.dna));
      toggleModal("dnaModal");
      updateMasterPromptPreview();
      showToast("🧬 تم حفظ البصمة السينمائية ديالك!");
    }

    /**************************************************************
     * 4. UI RENDERERS (STARS, ELEMENTS, VIBES)
     **************************************************************/
    function renderStarButtons() {
      const container = document.getElementById("starButtonsGrid");
      container.textContent = "";
      const steps = [0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5];
      steps.forEach(val => {
        const btn = document.createElement("button");
        btn.type = "button";
        const isActive = state.rating === val;
        btn.className = `pill-btn py-2 px-1 rounded-xl font-mono text-xs font-bold border transition ${
          isActive
            ? "active-green"
            : "bg-black/40 border-white/10 text-slate-300 hover:border-white/30"
        }`;
        btn.textContent = `${val}★`;
        btn.onclick = () => setRating(val);
        container.appendChild(btn);
      });
    }

    function setRating(val) {
      state.rating = val;
      renderStarButtons();
      const badge = document.getElementById("ratingBadgeDisplay");
      if (val === null) {
        badge.textContent = "مازال ما مقيمش (Unrated)";
        badge.className = "px-3 py-1 rounded-full text-xs font-mono font-bold bg-white/10 text-slate-300 border border-white/10";
      } else {
        const fullStars = "★".repeat(Math.floor(val)) + (val % 1 ? "½" : "");
        badge.textContent = `${fullStars} (${val}/5)`;
        badge.className = "px-3 py-1 rounded-full text-xs font-mono font-black bg-lx-amber/20 text-lx-amber border border-lx-amber/40";
      }
      updateMasterPromptPreview();
    }

    function toggleLiked() {
      state.liked = !state.liked;
      const btn = document.getElementById("likeToggleBtn");
      const icon = document.getElementById("likeIcon");
      if (state.liked) {
        btn.className = "pill-btn flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl active-orange text-xs font-black";
        icon.textContent = "❤️";
      } else {
        btn.className = "pill-btn flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-black/40 border border-white/15 text-xs font-bold text-slate-300";
        icon.textContent = "🤍";
      }
      updateMasterPromptPreview();
    }

    function renderElementsMatrix() {
      const container = document.getElementById("elementsMatrixContainer");
      container.textContent = "";
      const options = [
        { val: "", text: "— ما عنديش رأي / عادي —" },
        { val: "Masterclass 🔥", text: "أسطوري واعر بزاف 🔥" },
        { val: "Strong & Effective 👍", text: "مزيان ومتقون 👍" },
        { val: "Mixed / Uneven ⚖️", text: "بين وبين (متفاوت) ⚖️" },
        { val: "Weak / Underwhelming 👎", text: "ضعيف وناقص 👎" }
      ];

      CINEMATIC_ELEMENTS.forEach(item => {
        const wrap = document.createElement("div");
        wrap.className = "bg-black/40 border border-white/10 rounded-2xl p-3 flex flex-col gap-1.5";

        const lbl = document.createElement("label");
        lbl.className = "text-xs font-bold text-slate-200";
        lbl.textContent = item.label;

        const sel = document.createElement("select");
        sel.className = "bg-lx-surface border border-white/15 rounded-xl px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-lx-coral";
        options.forEach(opt => {
          const o = document.createElement("option");
          o.value = opt.val;
          o.textContent = opt.text;
          if ((state.elements[item.id] || "") === opt.val) o.selected = true;
          sel.appendChild(o);
        });

        sel.onchange = (e) => {
          state.elements[item.id] = e.target.value;
          updateMasterPromptPreview();
        };

        wrap.appendChild(lbl);
        wrap.appendChild(sel);
        container.appendChild(wrap);
      });
    }

    function bulkSetElements(val) {
      CINEMATIC_ELEMENTS.forEach(el => {
        state.elements[el.id] = val;
      });
      renderElementsMatrix();
      updateMasterPromptPreview();
    }

    function renderVibeChips() {
      const container = document.getElementById("vibeChipsContainer");
      container.textContent = "";
      VIBE_OPTIONS.forEach(vibe => {
        const btn = document.createElement("button");
        btn.type = "button";
        const active = state.vibes.has(vibe);
        btn.className = `pill-btn text-xs font-bold px-3 py-1.5 rounded-full border ${
          active
            ? "active-blue"
            : "bg-black/40 border-white/10 text-slate-300 hover:border-white/30"
        }`;
        btn.textContent = vibe;
        btn.onclick = () => {
          if (state.vibes.has(vibe)) state.vibes.delete(vibe);
          else state.vibes.add(vibe);
          renderVibeChips();
          updateMasterPromptPreview();
        };
        container.appendChild(btn);
      });
    }

    /**************************************************************
     * 5. HERO STAGE & FANART.TV / TMDB VISUAL ENGINE
     **************************************************************/
    function syncHeroDisplay() {
      state.film.title = document.getElementById("filmTitle").value.trim();
      state.film.year = document.getElementById("filmYear").value.trim();
      state.film.director = document.getElementById("filmDirector").value.trim();
      updateMasterPromptPreview();
    }

    function setHeroVisuals({ posterUrl, backdropUrl, clearLogoUrl, genre, source, tmdbId, imdbId }) {
      if (posterUrl) {
        state.film.posterUrl = posterUrl;
        const img = document.getElementById("heroPosterImg");
        img.src = posterUrl;
        img.classList.remove("hidden");
        document.getElementById("heroPosterPlaceholder").classList.add("hidden");
      }
      if (backdropUrl) {
        state.film.backdropUrl = backdropUrl;
        document.getElementById("heroShowcase").style.backgroundImage = `url('${backdropUrl}')`;
        document.getElementById("ambientBackdrop").style.backgroundImage = `url('${backdropUrl}')`;
      }
      const logoContainer = document.getElementById("clearLogoContainer");
      const logoImg = document.getElementById("heroClearLogo");
      if (clearLogoUrl) {
        state.film.clearLogoUrl = clearLogoUrl;
        logoImg.src = clearLogoUrl;
        logoContainer.classList.remove("hidden");
      } else {
        state.film.clearLogoUrl = "";
        logoContainer.classList.add("hidden");
      }

      if (genre) {
        state.film.genre = genre;
        document.getElementById("heroGenreText").textContent = genre;
      }
      if (source) {
        state.film.source = source;
        document.getElementById("heroSourceBadge").textContent = `🎬 Source: ${source}`;
      }
      const idsParts = [];
      if (tmdbId) idsParts.push(`TMDB #${tmdbId}`);
      if (imdbId) idsParts.push(`IMDb ${imdbId}`);
      document.getElementById("heroIdsText").textContent = idsParts.join(" • ");
    }

    function openFanartDrawer() {
      document.getElementById("fanartDrawer").classList.toggle("hidden");
    }

    function applyCustomBackdrop() {
      const url = document.getElementById("customBackdropInput").value.trim();
      if (!url.startsWith("http")) {
        showToast("⚠️ دخل رابط صورة صحيح كيبدا بـ http أو https", true);
        return;
      }
      setHeroVisuals({ backdropUrl: url });
      showToast("🖼️ تم تغيير الخلفية بنجاح!");
    }

    /**
     * Fetches HD Movie Backgrounds, ClearLogos, and Thumbs from Fanart.tv API
     * Works with either TMDB ID or IMDb ID!
     */
    async function fetchFanartTvAssets(movieId) {
      if (!movieId) return;
      const fanartKey = getActiveKey("FANART_TV_API_KEY");
      const pill = document.getElementById("fanartStatusPill");

      if (!fanartKey) {
        pill.textContent = "💡 زيد مفتاح Fanart.tv فـ 🔑 باش تجبد ClearLogos وخلفيات 4K";
        pill.classList.remove("hidden");
        return;
      }

      try {
        pill.textContent = "⏳ جاري جلب الخلفيات والـ ClearLogo من Fanart.tv...";
        pill.classList.remove("hidden");

        const url = `https://webservice.fanart.tv/v3/movies/${encodeURIComponent(movieId)}?api_key=${encodeURIComponent(fanartKey)}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error("Fanart not found");
        const data = await res.json();

        const backdrops = (data.moviebackground || []).map(item => ({
          url: item.url,
          type: "Fanart.tv HD Background",
          lang: item.lang || "en"
        }));
        const thumbs = (data.moviethumb || []).map(item => ({
          url: item.url,
          type: "Fanart.tv Movie Thumb",
          lang: item.lang || "en"
        }));
        const logos = [
          ...(data.hdmovielogo || []),
          ...(data.movielogo || [])
        ];

        // Pick best English or first ClearLogo
        const bestLogo = logos.find(l => l.lang === "en") || logos[0];
        const bestBackdrop = backdrops[0] || thumbs[0];

        state.fanartAssets = [...backdrops, ...thumbs, ...state.fanartAssets];
        renderFanartGallery();

        setHeroVisuals({
          backdropUrl: bestBackdrop ? bestBackdrop.url : state.film.backdropUrl,
          clearLogoUrl: bestLogo ? bestLogo.url : ""
        });

        pill.textContent = `✨ Fanart.tv Active (${backdrops.length + thumbs.length} HD Visuals)`;
      } catch (err) {
        pill.textContent = "ℹ️ Fanart.tv: ما لقيناش خلفيات إضافية لهاد الفيلم";
      }
    }

    /**
     * Resolves TMDB ID or IMDb ID automatically via Wikidata Free API when user doesn't have a TMDB Key
     */
    async function resolveMovieIdViaWikidata(title, year) {
      try {
        const query = `${title} ${year || ""} film`.trim();
        const searchUrl = `https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${encodeURIComponent(query)}&language=en&format=json&origin=*`;
        const searchRes = await fetch(searchUrl);
        const searchData = await searchRes.json();
        if (!searchData.search || !searchData.search.length) return null;

        const entityId = searchData.search[0].id;
        const entityUrl = `https://www.wikidata.org/w/api.php?action=wbgetentities&ids=${entityId}&props=claims&format=json&origin=*`;
        const entityRes = await fetch(entityUrl);
        const entityData = await entityRes.json();
        const claims = entityData.entities?.[entityId]?.claims || {};

        // P4947 = TMDB Movie ID, P345 = IMDb ID
        const tmdbId = claims.P4947?.[0]?.mainsnak?.datavalue?.value || "";
        const imdbId = claims.P345?.[0]?.mainsnak?.datavalue?.value || "";
        return { tmdbId, imdbId };
      } catch {
        return null;
      }
    }

    function renderFanartGallery() {
      const grid = document.getElementById("fanartGalleryGrid");
      const countBadge = document.getElementById("fanartCountBadge");
      grid.textContent = "";
      countBadge.textContent = state.fanartAssets.length;

      if (!state.fanartAssets.length) {
        const msg = document.createElement("div");
        msg.className = "col-span-full text-center py-4 text-xs text-slate-400";
        msg.textContent = "ما كايناش خلفيات إضافية حالياً لهاد الفيلم. تقدر تحط رابط صورة فوق أولا تزيد مفتاح Fanart.tv / TMDB!";
        grid.appendChild(msg);
        return;
      }

      state.fanartAssets.forEach(asset => {
        const card = document.createElement("button");
        card.type = "button";
        card.className = "group relative aspect-video rounded-xl overflow-hidden border border-white/15 hover:border-lx-teal transition shadow-md";

        const img = document.createElement("img");
        img.src = asset.url;
        img.alt = asset.type;
        img.className = "w-full h-full object-cover group-hover:scale-105 transition duration-300";

        const tag = document.createElement("span");
        tag.className = "absolute bottom-1 right-1 left-1 bg-black/75 text-[9px] text-white px-1.5 py-0.5 rounded truncate";
        tag.textContent = asset.type;

        card.onclick = () => {
          setHeroVisuals({ backdropUrl: asset.url });
          showToast("✨ تم تطبيق الخلفية السينمائية!");
        };

        card.appendChild(img);
        card.appendChild(tag);
        grid.appendChild(card);
      });
    }

    /**************************************************************
     * 6. SMART HUB: SEARCH (TMDB + ITUNES FALLBACK), RSS, CSV
     **************************************************************/
    function switchHubTab(tab) {
      ["search", "rss", "csv"].forEach(t => {
        document.getElementById(`hubPanel-${t}`).classList.toggle("hidden", t !== tab);
        const btn = document.getElementById(`hubTab-${t}`);
        if (t === tab) {
          btn.className = "px-3.5 py-1.5 rounded-lg bg-lx-teal text-black font-bold transition";
        } else {
          btn.className = "px-3.5 py-1.5 rounded-lg text-slate-300 hover:text-white transition";
        }
      });
    }

    async function runGlobalSearch() {
      const query = document.getElementById("globalSearchInput").value.trim();
      const status = document.getElementById("searchStatusMsg");
      const grid = document.getElementById("searchResultsGrid");
      if (!query) return;

      status.textContent = "⏳ جاري البحث على الفيلم وجلب البوسترات...";
      status.classList.remove("hidden");
      grid.textContent = "";

      const tmdbKey = getActiveKey("TMDB_API_KEY");

      try {
        if (tmdbKey) {
          // 1. Search via TMDB API (Best for Backdrops & Direct Fanart.tv ID)
          const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${encodeURIComponent(tmdbKey)}&query=${encodeURIComponent(query)}`);
          const data = await res.json();
          if (data.results && data.results.length > 0) {
            status.textContent = `✅ لقينا ${data.results.length} نتيجة عبر TMDB. كليكي على الفيلم باش تعمرو وتجبد خلفيات Fanart.tv:`;
            data.results.slice(0, 10).forEach(m => {
              const year = (m.release_date || "").slice(0, 4);
              const poster = m.poster_path ? `https://image.tmdb.org/t/p/w500${m.poster_path}` : "";
              const backdrop = m.backdrop_path ? `https://image.tmdb.org/t/p/original${m.backdrop_path}` : "";
              grid.appendChild(createMovieCard({
                title: m.title,
                year,
                director: "",
                genre: "TMDB Verified",
                posterUrl: poster,
                backdropUrl: backdrop,
                tmdbId: String(m.id),
                source: "TMDB API"
              }));
            });
            return;
          }
        }

        // 2. Keyless Fallback via Apple iTunes Movies API
        const itunesRes = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=movie&entity=movie&limit=10`);
        const itunesData = await itunesRes.json();
        if (!itunesData.results || !itunesData.results.length) {
          status.textContent = "⚠️ ما لقينا حتى فيلم بهاد السمية. جرب تكتبها بـ الإنگليزية.";
          return;
        }
        status.textContent = `✅ لقينا ${itunesData.results.length} نتيجة. كليكي على الفيلم باش يعمّر ليك المعلومات والخلفيات:`;
        itunesData.results.forEach(item => {
          const hiResPoster = (item.artworkUrl100 || "").replace("100x100bb", "600x900bb");
          const widePreview = (item.artworkUrl100 || "").replace("100x100bb", "1200x675bb");
          const year = item.releaseDate ? item.releaseDate.slice(0, 4) : "";
          grid.appendChild(createMovieCard({
            title: item.trackName || "",
            year,
            director: item.artistName || "",
            genre: item.primaryGenreName || "Cinema",
            posterUrl: hiResPoster,
            backdropUrl: widePreview,
            tmdbId: "",
            source: "Apple iTunes Movie DB"
          }));
        });
      } catch (err) {
        status.textContent = "⚠️ وقع مشكل فـ الاتصال بالأنترنت أثناء البحث.";
      }
    }

    function createMovieCard(movie) {
      const card = document.createElement("div");
      card.className = "group cursor-pointer rounded-2xl overflow-hidden bg-black/50 border border-white/10 hover:border-lx-teal transition flex flex-col shadow-lg";

      const imgWrap = document.createElement("div");
      imgWrap.className = "aspect-[2/3] bg-lx-surface overflow-hidden relative";
      if (movie.posterUrl) {
        const img = document.createElement("img");
        img.src = movie.posterUrl;
        img.alt = movie.title;
        img.className = "w-full h-full object-cover group-hover:scale-105 transition duration-300";
        imgWrap.appendChild(img);
      }

      if (movie.rating !== undefined && movie.rating !== null) {
        const rBadge = document.createElement("span");
        rBadge.className = "absolute top-2 right-2 px-2 py-0.5 rounded-md bg-black/85 text-lx-teal font-mono text-[11px] font-bold border border-lx-teal/40";
        rBadge.textContent = `${movie.rating}★`;
        imgWrap.appendChild(rBadge);
      }

      const body = document.createElement("div");
      body.className = "p-2.5 flex-1 flex flex-col justify-between";

      const titleEl = document.createElement("h4");
      titleEl.className = "text-xs font-bold text-white line-clamp-1";
      titleEl.textContent = movie.title;

      const metaEl = document.createElement("p");
      metaEl.className = "text-[11px] text-slate-400 mt-0.5";
      metaEl.textContent = `${movie.year || "—"} ${movie.director ? "• " + movie.director : ""}`;

      body.appendChild(titleEl);
      body.appendChild(metaEl);
      card.appendChild(imgWrap);
      card.appendChild(body);

      card.onclick = () => selectMovieFromHub(movie);
      return card;
    }

    async function selectMovieFromHub(movie) {
      // CINÉMATIK : après sélection du film, on enchaîne automatiquement vers la phase 2
      setTimeout(() => goToStep(2), 450);
      document.getElementById("filmTitle").value = movie.title || "";
      document.getElementById("filmYear").value = movie.year || "";
      document.getElementById("filmDirector").value = movie.director || "";

      if (movie.rating !== undefined && movie.rating !== null) {
        setRating(Number(movie.rating));
      }
      if (movie.reviewText) {
        document.getElementById("freeThoughtsInput").value = movie.reviewText;
      }

      state.fanartAssets = [];
      if (movie.backdropUrl) {
        state.fanartAssets.push({ url: movie.backdropUrl, type: `${movie.source} Backdrop` });
      }

      setHeroVisuals({
        posterUrl: movie.posterUrl,
        backdropUrl: movie.backdropUrl || movie.posterUrl,
        clearLogoUrl: "",
        genre: movie.genre,
        source: movie.source,
        tmdbId: movie.tmdbId,
        imdbId: movie.imdbId
      });

      syncHeroDisplay();
      renderFanartGallery();

      // If TMDB Key is active and we have tmdbId, fetch Director & extra TMDB backdrops
      const tmdbKey = getActiveKey("TMDB_API_KEY");
      let activeMovieId = movie.tmdbId || movie.imdbId;

      if (tmdbKey && movie.tmdbId) {
        try {
          const detailRes = await fetch(`https://api.themoviedb.org/3/movie/${movie.tmdbId}?api_key=${encodeURIComponent(tmdbKey)}&append_to_response=credits,images`);
          const detail = await detailRes.json();
          const dir = (detail.credits?.crew || []).find(c => c.job === "Director");
          if (dir) {
            document.getElementById("filmDirector").value = dir.name;
            state.film.director = dir.name;
          }
          if (detail.genres?.length) {
            setHeroVisuals({ genre: detail.genres.map(g => g.name).join(" / ") });
          }
          (detail.images?.backdrops || []).slice(0, 6).forEach(b => {
            state.fanartAssets.push({
              url: `https://image.tmdb.org/t/p/original${b.file_path}`,
              type: "TMDB 4K Backdrop"
            });
          });
          renderFanartGallery();
        } catch {}
      }

      // If we don't have a TMDB/IMDb ID yet, resolve it via Wikidata so Fanart.tv works seamlessly!
      if (!activeMovieId) {
        const ids = await resolveMovieIdViaWikidata(movie.title, movie.year);
        if (ids && (ids.tmdbId || ids.imdbId)) {
          activeMovieId = ids.tmdbId || ids.imdbId;
          setHeroVisuals({ tmdbId: ids.tmdbId, imdbId: ids.imdbId });
        }
      }

      if (activeMovieId) {
        fetchFanartTvAssets(activeMovieId);
      }

      showToast(`🎬 تم اختيار "${movie.title}" بنجاح!`);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    /**************************************************************
     * 7. LETTERBOXD RSS SYNC & CSV OFFLINE PARSER
     **************************************************************/
    async function fetchLetterboxdRSS() {
      const username = document.getElementById("rssUsernameInput").value.trim();
      const status = document.getElementById("rssStatusMsg");
      const grid = document.getElementById("rssResultsGrid");
      if (!username) return;

      status.textContent = `⏳ جاري جلب آخر الأفلام من حساب ${username}...`;
      status.classList.remove("hidden");
      grid.textContent = "";

      try {
        const rssUrl = `https://letterboxd.com/${encodeURIComponent(username)}/rss/`;
        const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(rssUrl)}`;
        const res = await fetch(proxyUrl);
        if (!res.ok) throw new Error("RSS fetch failed");
        const xmlText = await res.text();

        const parser = new DOMParser();
        const xml = parser.parseFromString(xmlText, "text/xml");
        const items = Array.from(xml.querySelectorAll("item")).slice(0, 15);

        if (!items.length) {
          status.textContent = "⚠️ ما لقيناش أفلام فـ هاد الحساب. تأكد بلي الـ Username صحيح.";
          return;
        }

        status.textContent = `✅ لقينا ${items.length} فيلم من الـ Diary ديالك! كليكي على أي فيلم:`;
        items.forEach(item => {
          const filmTitle = item.getElementsByTagName("letterboxd:filmTitle")[0]?.textContent || item.querySelector("title")?.textContent || "";
          const filmYear = item.getElementsByTagName("letterboxd:filmYear")[0]?.textContent || "";
          const memberRating = item.getElementsByTagName("letterboxd:memberRating")[0]?.textContent || null;
          const tmdbId = item.getElementsByTagName("tmdb:movieId")[0]?.textContent || "";
          const descHtml = item.querySelector("description")?.textContent || "";

          // Extract poster safely without rendering untrusted HTML
          const imgMatch = descHtml.match(/<img[^>]+src="([^">]+)"/i);
          const posterUrl = imgMatch ? imgMatch[1] : "";
          const cleanReview = descHtml.replace(/<[^>]*>/g, "").trim();

          grid.appendChild(createMovieCard({
            title: filmTitle,
            year: filmYear,
            director: "",
            genre: "Letterboxd Diary",
            posterUrl,
            backdropUrl: posterUrl,
            tmdbId,
            rating: memberRating ? parseFloat(memberRating) : null,
            reviewText: cleanReview.startsWith("Watched on") ? "" : cleanReview,
            source: `Letterboxd @${username}`
          }));
        });
      } catch (err) {
        status.textContent = "⚠️ تعذر جلب الـ RSS حالياً. تقدر تخدم بـ البحث العالمي أولا ترفع ملف الـ CSV ديالك.";
      }
    }

    function handleCSVUpload(event) {
      const files = Array.from(event.target.files || []);
      if (!files.length) return;

      const moviesMap = new Map();
      let collectedSamples = [];

      let processed = 0;
      files.forEach(file => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const rows = parseCSV(e.target.result);
          if (rows.length > 1) {
            const headers = rows[0].map(h => h.trim().toLowerCase());
            const nameIdx = headers.indexOf("name");
            const yearIdx = headers.indexOf("year");
            const ratingIdx = headers.indexOf("rating");
            const reviewIdx = headers.indexOf("review");

            rows.slice(1).forEach(cols => {
              const title = cols[nameIdx] || "";
              if (!title) return;
              const year = cols[yearIdx] || "";
              const rating = ratingIdx > -1 && cols[ratingIdx] ? parseFloat(cols[ratingIdx]) : null;
              const review = reviewIdx > -1 ? (cols[reviewIdx] || "") : "";

              const key = `${title}_${year}`;
              const existing = moviesMap.get(key) || { title, year, rating: null, reviewText: "" };
              if (rating !== null && !isNaN(rating)) existing.rating = rating;
              if (review) {
                existing.reviewText = review;
                if (review.length > 30 && collectedSamples.length < 3) {
                  collectedSamples.push(`"${review}"`);
                }
              }
              moviesMap.set(key, existing);
            });
          }
          processed++;
          if (processed === files.length) {
            state.csvMovies = Array.from(moviesMap.values()).reverse();
            document.getElementById("csvFilterBar").classList.remove("hidden");
            renderCSVItems();
            if (collectedSamples.length && !state.dna.samples) {
              state.dna.samples = collectedSamples.join("\n\n");
              document.getElementById("dnaSamples").value = state.dna.samples;
              localStorage.setItem("lb_studio_writing_dna", JSON.stringify(state.dna));
              showToast(`🧬 تم استيراد ${state.csvMovies.length} فيلم + حفظ عينات من أسلوبك فـ Writing DNA!`);
            } else {
              showToast(`📂 تم استيراد ${state.csvMovies.length} فيلم بنجاح!`);
            }
          }
        };
        reader.readAsText(file);
      });
    }

    function parseCSV(text) {
      const rows = [];
      let row = [], cur = "", inQuotes = false;
      for (let i = 0; i < text.length; i++) {
        const ch = text[i], next = text[i + 1];
        if (inQuotes) {
          if (ch === '"' && next === '"') { cur += '"'; i++; }
          else if (ch === '"') inQuotes = false;
          else cur += ch;
        } else {
          if (ch === '"') inQuotes = true;
          else if (ch === ",") { row.push(cur); cur = ""; }
          else if (ch === "\n" || ch === "\r") {
            if (ch === "\r" && next === "\n") i++;
            row.push(cur); rows.push(row); row = []; cur = "";
          } else cur += ch;
        }
      }
      if (cur || row.length) { row.push(cur); rows.push(row); }
      return rows;
    }

    function renderCSVItems() {
      const grid = document.getElementById("csvResultsGrid");
      const q = document.getElementById("csvSearchInput").value.trim().toLowerCase();
      const starFilter = document.getElementById("csvStarFilter").value;
      grid.textContent = "";

      const filtered = state.csvMovies.filter(m => {
        const matchQ = !q || m.title.toLowerCase().includes(q);
        let matchStar = true;
        if (starFilter !== "all") {
          const num = parseFloat(starFilter);
          matchStar = num === 3 ? (m.rating !== null && m.rating <= 3) : m.rating === num;
        }
        return matchQ && matchStar;
      });

      filtered.slice(0, 60).forEach(m => {
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "text-right p-2.5 rounded-xl bg-black/50 border border-white/10 hover:border-lx-teal transition flex flex-col justify-between";
        const t = document.createElement("div");
        t.className = "text-xs font-bold text-white truncate w-full";
        t.textContent = m.title;
        const sub = document.createElement("div");
        sub.className = "text-[10px] font-mono text-lx-teal mt-1";
        sub.textContent = `${m.year || "—"} • ${m.rating ? m.rating + "★" : "Unrated"}`;
        btn.appendChild(t);
        btn.appendChild(sub);
        btn.onclick = () => selectMovieFromHub({ ...m, source: "Letterboxd CSV" });
        grid.appendChild(btn);
      });
    }

    /**************************************************************
     * 8. MASTER PROMPT ENGINE (WITH WRITING DNA & STRICT GUARDRAILS)
     **************************************************************/
    function applyStylePreset(preset) {
      const lengthEl = document.getElementById("reviewLength");
      const toneEl = document.getElementById("reviewTone");
      const humorEl = document.getElementById("humorSlider");
      const depthEl = document.getElementById("depthSlider");

      if (preset === "punchy") {
        lengthEl.selectedIndex = 1;
        toneEl.selectedIndex = 1;
        humorEl.value = 8;
        depthEl.value = 4;
      } else if (preset === "cinephile") {
        lengthEl.selectedIndex = 2;
        toneEl.selectedIndex = 2;
        humorEl.value = 2;
        depthEl.value = 9;
      } else if (preset === "raw") {
        lengthEl.selectedIndex = 0;
        toneEl.selectedIndex = 0;
        humorEl.value = 4;
        depthEl.value = 6;
      } else {
        lengthEl.selectedIndex = 0;
        toneEl.selectedIndex = 0;
        humorEl.value = 3;
        depthEl.value = 7;
      }
      document.getElementById("humorVal").textContent = humorEl.value + "/10";
      document.getElementById("depthVal").textContent = depthEl.value + "/10";
      updateMasterPromptPreview();
    }

    function buildMasterPrompt() {
      const title = document.getElementById("filmTitle").value.trim() || "[اسم الفيلم غير محدد]";
      const year = document.getElementById("filmYear").value.trim();
      const director = document.getElementById("filmDirector").value.trim();
      const watchType = document.getElementById("watchTypeSelect").value;
      const expectation = document.getElementById("expectationSelect").value;
      const bestMoment = document.getElementById("bestMomentInput").value.trim();
      const weakPoint = document.getElementById("weakPointInput").value.trim();
      const freeThoughts = document.getElementById("freeThoughtsInput").value.trim();

      const lang = document.getElementById("reviewLang").value;
      const length = document.getElementById("reviewLength").value;
      const spoiler = document.getElementById("spoilerPolicy").value;
      const tone = document.getElementById("reviewTone").value;
      const humor = document.getElementById("humorSlider").value;
      const depth = document.getElementById("depthSlider").value;
      const antiAi = document.getElementById("antiAiToggle").checked;
      const strictFact = document.getElementById("strictFactToggle").checked;

      // Collect only rated elements
      const ratedElements = [];
      CINEMATIC_ELEMENTS.forEach(el => {
        const val = state.elements[el.id];
        if (val) ratedElements.push(`  • ${el.label}: ${val}`);
      });

      const vibesList = Array.from(state.vibes);

      let prompt = `🎬 عزف ليا مراجعة احترافية وشخصية لـ Letterboxd بناءً على هاد المعطيات الدقيقة ديالي:\n`;
      prompt += `==================================================\n`;
      prompt += `📌 معلومات الفيلم:\n`;
      prompt += `- الفيلم: ${title}${year ? ` (${year})` : ""}\n`;
      if (director) prompt += `- المخرج: ${director}\n`;
      prompt += `- التقييم ديالي: ${state.rating !== null ? `${state.rating} / 5 ★` : "بلا تقييم بالنجوم (Unrated)"} | ${state.liked ? "❤️ Liked on Letterboxd" : "بدون علامة Liked"}\n`;
      if (watchType) prompt += `- سياق المشاهدة: ${watchType}\n`;
      if (expectation) prompt += `- مقارنة بالتوقعات: ${expectation}\n`;

      if (ratedElements.length > 0) {
        prompt += `\n🎯 تقييمي لعناصر الفيلم (ركز غير على هادو وما تفترضش رأيي فـ الباقي):\n${ratedElements.join("\n")}\n`;
      }

      if (vibesList.length > 0) {
        prompt += `\n🎭 الإحساس والـ Vibe اللي خلا فيا الفيلم:\n  ${vibesList.join(" ، ")}\n`;
      }

      if (bestMoment || weakPoint || freeThoughts) {
        prompt += `\n💭 ملاحظاتي الشخصية (Personal Touch — دمجها بطبيعية فـ قلب المراجعة):\n`;
        if (bestMoment) prompt += `  • أقوى نقطة أو مشهد عجبني: ${bestMoment}\n`;
        if (weakPoint) prompt += `  • نقطة الضعف أو اللي ما عجباتنيش: ${weakPoint}\n`;
        if (freeThoughts) prompt += `  • أفكاري الحرة: ${freeThoughts}\n`;
      }

      if (state.dna.favFilms || state.dna.criticalFocus || state.dna.samples || state.dna.avoidWords) {
        prompt += `\n🧬 بصمتي السينمائية وأسلوبي فـ الكتابة (My Writing DNA):\n`;
        if (state.dna.favFilms) prompt += `  • أفلامي المفضلة (مرجع الذوق): ${state.dna.favFilms}\n`;
        if (state.dna.criticalFocus) prompt += `  • زاوية النقد اللي تهمني: ${state.dna.criticalFocus}\n`;
        if (state.dna.samples) prompt += `  • عينات من كتابتي السابقة (قلّد الإيقاع واختيار الكلمات): ${state.dna.samples}\n`;
        if (state.dna.avoidWords) prompt += `  • أشياء خاصك تتجنبها: ${state.dna.avoidWords}\n`;
      }

      prompt += `\n⚙️ إعدادات الصياغة والأسلوب:\n`;
      prompt += `- لغة المراجعة المطلوبة: ${lang}\n`;
      prompt += `- الطول والحجم: ${length}\n`;
      prompt += `- النبرة (Tone): ${tone} (مستوى الفكاهة: ${humor}/10 ، العمق التحليلي: ${depth}/10)\n`;
      prompt += `- سياسة الحرق: ${spoiler}\n`;

      prompt += `\n🛡️ قواعد صارمة على الذكاء الاصطناعي (Professional Review Engine Rules):\n`;
      prompt += `1. اكتب بصيغة المتكلم (First-person) كأنني أنا اللي كاتبها فـ حسابي فـ Letterboxd.\n`;
      if (strictFact) {
        prompt += `2. [FACT & OPINION GUARD]: إياك تخترع أحداث، مشاهد، أو آراء ما ذكرتهاش ليك الفوق. اعتمد فقط على المعطيات ديالي.\n`;
      }
      if (antiAi) {
        prompt += `3. [ANTI-GENERIC FILTER]: ممنوع تستعمل مقدمات الذكاء الاصطناعي الكليشيه بحال "In conclusion", "A tapestry of", "From the very first frame", "Cinematic tour de force". دخل فـ صلب الموضوع مباشرة.\n`;
      }
      prompt += `4. عطيني 3 ديال النسخ متميزة باش نختار منها:\n`;
      prompt += `   - النسخة 1 (Balanced & Authentic): متوازنة، صادقة، وكتجمع كاع ملاحظاتي.\n`;
      prompt += `   - النسخة 2 (Analytical & Craft-Focused): كتركز على الإخراج والجمالية السينمائية.\n`;
      prompt += `   - النسخة 3 (Punchy Letterboxd Style): مركزة، حادة، وفيها روح Letterboxd.\n`;

      return prompt;
    }

    function updateMasterPromptPreview() {
      const area = document.getElementById("promptOutputArea");
      if (area) area.value = buildMasterPrompt();
    }

    // Listen to inputs to keep preview live
    ["bestMomentInput", "weakPointInput", "freeThoughtsInput", "reviewLang", "reviewLength", "spoilerPolicy", "reviewTone", "humorSlider", "depthSlider", "antiAiToggle", "strictFactToggle", "watchTypeSelect", "expectationSelect"].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener("input", updateMasterPromptPreview);
    });

    function validateBeforeAction() {
      const warnings = [];
      const title = document.getElementById("filmTitle").value.trim();
      if (!title) warnings.push("• مازال ما كتبتيش سمية الفيلم.");
      if (state.rating === null) warnings.push("• خليتي التقييم بلا نجمات (Unrated) — إلا نسيتيه تقدر تعزلو الفوق.");

      const box = document.getElementById("validationWarningBox");
      if (warnings.length > 0) {
        box.textContent = "💡 تذكير خفيف قبل ما تكمل: " + warnings.join(" | ");
        box.classList.remove("hidden");
      } else {
        box.classList.add("hidden");
      }
    }

    function generatePromptAndCopy() {
      validateBeforeAction();
      const prompt = buildMasterPrompt();
      document.getElementById("promptOutputArea").value = prompt;
      navigator.clipboard.writeText(prompt);
      showToast("📋 تم نسخ الـ Master Prompt! حطو دابا فـ الشات وغيصاوب ليك مراجعة واعرة.");
    }

    /**************************************************************
     * 9. IN-APP AI REVIEW GENERATOR & REFINER
     **************************************************************/
    async function generateReviewsInApp() {
      validateBeforeAction();
      const title = document.getElementById("filmTitle").value.trim() || "This Film";
      const year = document.getElementById("filmYear").value.trim();
      const director = document.getElementById("filmDirector").value.trim();
      const geminiKey = getActiveKey("GEMINI_API_KEY");
      const studioArea = document.getElementById("aiStudioResultsArea");
      const status = document.getElementById("aiGenStatus");

      studioArea.classList.remove("hidden");
      status.textContent = "⏳ جاري صياغة 3 نسخ...";

      if (geminiKey) {
        try {
          const prompt = buildMasterPrompt() + `\nReturn ONLY valid JSON array of 3 objects: [{"label":"Version 1: Authentic","text":"..."},{"label":"Version 2: Analytical","text":"..."},{"label":"Version 3: Punchy Letterboxd","text":"..."}]`;
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${encodeURIComponent(geminiKey)}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: prompt }] }]
            })
          });
          const data = await res.json();
          const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
          const jsonMatch = rawText.match(/\[[\s\S]*\]/);
          if (jsonMatch) {
            state.generatedVariations = JSON.parse(jsonMatch[0]);
            status.textContent = "✨ تم التوليد عبر Gemini API";
            renderVariationsCards();
            return;
          }
        } catch (e) {
          // Falls back gracefully to smart local composer below
        }
      }

      // Smart Local Composer (Works 100% Offline without API Key!)
      const best = document.getElementById("bestMomentInput").value.trim();
      const weak = document.getElementById("weakPointInput").value.trim();
      const free = document.getElementById("freeThoughtsInput").value.trim();
      const vibes = Array.from(state.vibes).map(v => v.replace(/[^\w\s-]/g, "").trim()).filter(Boolean);
      const starsText = state.rating ? `${state.rating}/5 stars` : "an unforgettable watch";

      const v1 = `${director ? `Directed by ${director}, ` : ""}*${title}*${year ? ` (${year})` : ""} hits with a very specific energy that stays with you after the credits roll. ${best ? `The standout element for me was ${best}. ` : ""}${free ? `${free} ` : ""}${weak ? `Even if ${weak}, ` : ""}it easily earns ${starsText}.`;
      const v2 = `What makes *${title}* work so well is the precision of its craft${director ? ` under ${director}’s direction` : ""}. ${best ? `Specifically, ${best} elevates the whole experience. ` : ""}${weak ? `While ${weak}, the visual and atmospheric weight carries it through.` : "Every frame feels deliberate and earned."}`;
      const v3 = `${best ? `${best} — ` : ""}*${title}*${year ? ` (${year})` : ""} ${vibes.length ? `delivers pure ${vibes[0].toLowerCase()} energy.` : "knows exactly what it wants to be and commits 100%."} ${free || ""}`.trim();

      state.generatedVariations = [
        { label: "النسخة 1: متوازنة وشخصية (Authentic & Balanced)", text: v1 },
        { label: "النسخة 2: تحليلية وسينمائية (Analytical Craft)", text: v2 },
        { label: "النسخة 3: قصيرة بـ ستيل Letterboxd (Punchy)", text: v3 }
      ];
      status.textContent = "⚡ قوالب ذكية محلية (أو لصق البرومبت فـ الشات لتوليد أعمق)";
      renderVariationsCards();
    }

    function renderVariationsCards() {
      const container = document.getElementById("variationsContainer");
      container.textContent = "";

      state.generatedVariations.forEach((v, idx) => {
        const card = document.createElement("div");
        const isSel = state.selectedVariationIndex === idx;
        card.className = `p-3.5 rounded-2xl border transition cursor-pointer space-y-2 ${
          isSel ? "bg-lx-teal/10 border-lx-teal" : "bg-black/50 border-white/10 hover:border-white/25"
        }`;
        card.onclick = () => {
          state.selectedVariationIndex = idx;
          renderVariationsCards();
        };

        const header = document.createElement("div");
        header.className = "flex items-center justify-between";

        const title = document.createElement("span");
        title.className = "text-xs font-extrabold text-white";
        title.textContent = v.label;

        const copyBtn = document.createElement("button");
        copyBtn.type = "button";
        copyBtn.className = "text-[11px] font-bold px-2.5 py-1 rounded-lg bg-lx-teal text-black";
        copyBtn.textContent = "نسخ هاد النسخة 📋";
        copyBtn.onclick = (e) => {
          e.stopPropagation();
          navigator.clipboard.writeText(v.text);
          showToast("✅ تم نسخ المراجعة!");
        };

        header.appendChild(title);
        header.appendChild(copyBtn);

        const txt = document.createElement("textarea");
        txt.rows = 3;
        txt.className = "w-full bg-black/60 border border-white/10 rounded-xl p-2.5 text-xs text-slate-100 focus:outline-none";
        txt.value = v.text;
        txt.oninput = (e) => {
          state.generatedVariations[idx].text = e.target.value;
        };

        card.appendChild(header);
        card.appendChild(txt);
        container.appendChild(card);
      });
    }

    function refineReview(instruction) {
      if (!state.generatedVariations.length) return;
      const idx = state.selectedVariationIndex;
      let current = state.generatedVariations[idx].text;

      if (instruction.includes("shorter")) {
        const sentences = current.split(/(?<=[.!?])\s+/);
        current = sentences.slice(0, Math.max(1, sentences.length - 1)).join(" ");
      } else if (instruction.includes("opening")) {
        const sentences = current.split(/(?<=[.!?])\s+/);
        if (sentences.length > 1) current = sentences.slice(1).join(" ");
      } else if (instruction.includes("personal")) {
        current = `Honestly, ${current.charAt(0).toLowerCase() + current.slice(1)}`;
      } else if (instruction.includes("critical")) {
        current += " It’s not without its flaws, but the ambition is undeniable.";
      }

      state.generatedVariations[idx].text = current;
      renderVariationsCards();
      showToast("✨ تم تعديل النسخة المختارة!");
    }

    /**************************************************************
     * 10. LOCAL FILM JOURNAL & RESET
     **************************************************************/
    function saveCurrentToJournal() {
      const title = document.getElementById("filmTitle").value.trim();
      if (!title) {
        showToast("⚠️ كتب بعدا سمية الفيلم باش تحفظو فـ الأرشيف!", true);
        return;
      }
      const journal = JSON.parse(localStorage.getItem("lb_studio_journal_v4") || "[]");
      journal.unshift({
        id: Date.now(),
        date: new Date().toLocaleDateString("ar-MA"),
        title,
        year: document.getElementById("filmYear").value.trim(),
        rating: state.rating,
        liked: state.liked,
        prompt: buildMasterPrompt()
      });
      localStorage.setItem("lb_studio_journal_v4", JSON.stringify(journal.slice(0, 50)));
      renderJournalCount();
      showToast("💾 تم حفظ المسودة فـ الأرشيف ديالك!");
    }

    function renderJournalCount() {
      const journal = JSON.parse(localStorage.getItem("lb_studio_journal_v4") || "[]");
      document.getElementById("journalCount").textContent = journal.length;
    }

    function renderJournalModalList() {
      const container = document.getElementById("journalListContainer");
      const journal = JSON.parse(localStorage.getItem("lb_studio_journal_v4") || "[]");
      container.textContent = "";

      if (!journal.length) {
        container.textContent = "مازال ما حفظتي حتى مسودة فـ الأرشيف.";
        return;
      }

      journal.forEach(item => {
        const row = document.createElement("div");
        row.className = "p-3 rounded-xl bg-black/50 border border-white/10 flex items-center justify-between gap-2";

        const info = document.createElement("div");
        const t = document.createElement("div");
        t.className = "font-bold text-white";
        t.textContent = `${item.title} ${item.year ? `(${item.year})` : ""} — ${item.rating ? item.rating + "★" : "Unrated"}`;
        const d = document.createElement("div");
        d.className = "text-[11px] text-slate-400";
        d.textContent = item.date;
        info.appendChild(t);
        info.appendChild(d);

        const copyBtn = document.createElement("button");
        copyBtn.className = "px-3 py-1.5 rounded-lg bg-lx-teal text-black font-bold";
        copyBtn.textContent = "نسخ البرومبت";
        copyBtn.onclick = () => {
          navigator.clipboard.writeText(item.prompt);
          showToast("📋 تم نسخ البرومبت المحفوظ!");
        };

        row.appendChild(info);
        row.appendChild(copyBtn);
        container.appendChild(row);
      });
    }

    function confirmReset() {
      if (!confirm("واش متأكد بغيتي تخوي الفورم وتبدا فيلم جديد من الصفر؟ (البصمة السينمائية ومفاتيح الـ API غادي يبقاو محفوظين)")) return;
      document.getElementById("filmTitle").value = "";
      document.getElementById("filmYear").value = "";
      document.getElementById("filmDirector").value = "";
      document.getElementById("bestMomentInput").value = "";
      document.getElementById("weakPointInput").value = "";
      document.getElementById("freeThoughtsInput").value = "";
      document.getElementById("watchTypeSelect").value = "";
      document.getElementById("expectationSelect").value = "";
      state.rating = null;
      state.liked = false;
      state.elements = {};
      state.vibes.clear();
      renderStarButtons();
      renderElementsMatrix();
      renderVibeChips();
      setRating(null);
      updateMasterPromptPreview();
      goToStep(1);
      showToast("🔄 تم تصفير الاستمارة — رجع للمرحلة 1 وقلب على فيلم جديد!");
    }

    /**************************************************************
     * 11. FULL PROJECT FOLDER (.ZIP) GENERATOR (CLEAN MULTI-FILE)
     * كيجمع ليك دوسي مشروع متكامل ونقي بلا أي سكريبت محقون!
     **************************************************************/
    async function downloadFullProjectZip() {
      if (typeof JSZip === "undefined") {
        showToast("⚠️ مكتبة JSZip مازال كتحمّل، عاود كليكي بعد ثانية.", true);
        return;
      }

      showToast("📦 جاري تحضير دوسي المشروع الكامل (.ZIP)...");
      const zip = new JSZip();

      // 1. Create js/config.js with dedicated API key slots
      const configJsContent = `/**
 * ============================================================================
 * LUMIÈRE ATELIER — API KEYS & CONFIGURATION FILE (js/config.js)
 * ============================================================================
 * حط مفاتيح الـ API ديالك هنا بين علامات التنصيص ("") وسجّل الملف!
 */

const STUDIO_CONFIG = {
  API_KEYS: {
    // 1. Fanart.tv API Key (لجلب الخلفيات السينمائية 4K والـ ClearLogos الشفافة)
    // جيبو بالمجان من: https://fanart.tv/get-an-api-key/
    FANART_TV_API_KEY: "${getActiveKey("FANART_TV_API_KEY")}",

    // 2. TMDB API Key v3 (للبحث على الأفلام، البوسترات، والمخرجين)
    // جيبو بالمجان من: https://www.themoviedb.org/settings/api
    TMDB_API_KEY: "${getActiveKey("TMDB_API_KEY")}",

    // 3. OMDb API Key (اختياري — لمعلومات IMDb الإضافية)
    OMDB_API_KEY: "${getActiveKey("OMDB_API_KEY")}",

    // 4. Google Gemini API Key (اختياري — لتوليد المراجعات بالذكاء الاصطناعي وسط التطبيق)
    GEMINI_API_KEY: "${getActiveKey("GEMINI_API_KEY")}"
  },

  DEFAULT_BACKDROP: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1920&auto=format&fit=crop"
};
`;

      // 2. Extract CSS into css/styles.css
      const styleTagContent = (() => {
        // Prefer the real modular stylesheet (css/styles.css) for the ZIP export;
        // fall back to any inline <style> tag if fetch is unavailable (e.g. file://).
        try {
          const xhr = new XMLHttpRequest();
          xhr.open("GET", "css/styles.css", false);
          xhr.send();
          if (xhr.status === 200 && xhr.responseText) return xhr.responseText;
        } catch (err) { /* ignore and fall back */ }
        const styleEl = document.querySelector("style");
        return styleEl ? styleEl.innerHTML : "";
      })();

      // 3. Extract Clean HTML without any platform-injected scripts
      const mainHtmlBody = document.querySelector("header").outerHTML + "\n" +
                           document.querySelector("main").outerHTML + "\n" +
                           document.getElementById("apiModal").outerHTML + "\n" +
                           document.getElementById("dnaModal").outerHTML + "\n" +
                           document.getElementById("journalModal").outerHTML + "\n" +
                           document.getElementById("toastBox").outerHTML;

      const cleanIndexHtml = `<!DOCTYPE html>
<html lang="ar" dir="rtl" class="dark">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Lumière — Cinematic Review Atelier v5.0</title>
  <script src="https://cdn.tailwindcss.com"><\/script>
  <link href="https://fonts.googleapis.com/css2?family=Alexandria:wght@300;400;500;600;700;800;900&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js"><\/script>
  <script>
    tailwind.config = {
      darkMode: 'class',
      theme: {
        extend: {
          colors: {
            lx: { bg: '#06070d', card: '#10131f', surface: '#171b2b', border: '#262c42', text: '#a8b0c8', light: '#eef1fa', amber: '#ffb454', teal: '#2dd4bf', coral: '#fb7185' }
          },
          fontFamily: { sans: ['Alexandria', 'Plus Jakarta Sans', 'sans-serif'], mono: ['JetBrains Mono', 'monospace'] }
        }
      }
    }
  <\/script>
  <link rel="stylesheet" href="css/styles.css" />
</head>
<body class="min-h-screen film-grain pb-28 selection:bg-lx-teal selection:text-black">
  <div id="ambientBackdrop" style="background-image: url('https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1920&auto=format&fit=crop');"></div>
  <div id="ambientOverlay"></div>

  ${mainHtmlBody}

  <!-- Clean Modular Scripts -->
  <script src="js/config.js"><\/script>
  <script src="js/app.js"><\/script>
</body>
</html>`;

      // 4. Extract JS logic (excluding STUDIO_CONFIG which is now in js/config.js)
      const allScripts = Array.from(document.querySelectorAll("script"));
      const mainAppScript = allScripts[allScripts.length - 1].innerHTML;
      const appJsOnly = mainAppScript.replace(/const STUDIO_CONFIG = \{[\s\S]*?\};/, "// STUDIO_CONFIG is loaded from js/config.js");

      // 5. Create README.md in Darija & English
      const readmeMd = `# 🎬 Lumière — Cinematic Review Atelier (Fanart.tv & TMDB Edition)

أتيليه ويب متكامل وملفات منظمة لصناعة مراجعات **Letterboxd** احترافية وشخصية بالدارجة المغربية أو الإنگليزية أو الفرنسية.

## 📁 هيكلة الدوسي (Project Structure)
\`\`\`
lumiere-atelier/
├── index.html        # الصفحة الرئيسية (نقية 100% بلا سكريبتات خارجية محقونة)
├── css/
│   └── styles.css    # تصميم الـ Glassmorphism والخلفيات الديناميكية
├── js/
│   ├── config.js     # بلاصة مفاتيح الـ API ديالك (Fanart.tv, TMDB, OMDb, Gemini)
│   └── app.js        # الكود البرمجي الكامل (Writing DNA, Fanart Engine, CSV/RSS Sync)
└── README.md         # دليل الاستخدام
\`\`\`

## 🔑 كيفاش تزيد مفاتيح الـ API ديالك؟
عندك جوج طرق ساهلين:
1. **من الكود مباشرة:** حل الملف \`js/config.js\` بأي محرر نصوص (VS Code أو Notepad) وحط المفاتيح ديالك فـ البلايص المخصصة ليهم.
2. **من الواجهة مباشرة:** حل \`index.html\` فـ المتصفح وكليكي الفوق على بطونة **"🔑 مفاتيح الـ API"** وحطهم تما.

## 🖼️ كيفاش خدامة ميزة Fanart.tv للخلفيات؟
- ملي كتقلب على أي فيلم وتختارو، التطبيق كيجبد الـ **TMDB ID** أو **IMDb ID** ديالو أوتوماتيكياً.
- كيتصل بـ **Fanart.tv API** وكيجبد ليك:
  1. **HD Movie Backgrounds:** خلفيات الفيلم الرسمية بـ جودة عالية كتولي هي خلفية الموقع.
  2. **HD ClearLogo:** اللوغو الرسمي ديال الفيلم شفاف بلا خلفية كيتحط فوق البانر السينمائي.
  3. **Fanart Gallery Drawer:** معرض وسط الصفحة تقدر تبدل منو الخلفية اللي عجباتك بكليكة وحدة.
`;

      zip.file("index.html", cleanIndexHtml);
      zip.folder("css").file("styles.css", styleTagContent);
      zip.folder("js").file("config.js", configJsContent);
      zip.folder("js").file("app.js", appJsOnly);
      zip.file("README.md", readmeMd);

      const blob = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "lumiere-atelier-project.zip";
      link.click();
      showToast("✅ تم تحميل دوسي المشروع الكامل (lumiere-atelier-project.zip)!");
    }
  