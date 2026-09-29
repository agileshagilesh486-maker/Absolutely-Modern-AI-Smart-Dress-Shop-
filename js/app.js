/**
 * AI Smart Dress Shop - Main Application Controller
 * Handles SPA navigation, product rendering, filtering, modals, cart/checkout flows,
 * order simulation, admin dashboard charts, and prompt audit testing.
 */

const App = {
  currentView: "home",
  activeFilters: {
    category: "All",
    gender: "All",
    color: "All",
    style: "All",
    occasion: "All",
    size: "All",
    maxPrice: 10000,
    searchQuery: ""
  },
  currentModalProduct: null,

  init() {
    // Initialize State Store & Chatbot
    Store.init();
    Chatbot.init();

    // Setup Event Listeners
    this.setupNavigation();
    this.setupSearch();
    this.setupThemeToggle();
    this.setupStylistForm();
    this.setupShopFilters();
    this.setupAdvisors();
    this.setupCartAndCheckout();
    this.setupFeedbackPoll();
    this.setupPromptAudit();
    this.setupStateListeners();

    // Render Initial Views
    this.renderHomeTrending();
    this.renderCategoriesGrid();
    this.renderShopProducts();
    this.renderWishlist();
    this.renderCart();
    this.renderOrders();
    this.renderProfile();
    this.renderAdminDashboard();
    this.renderSystemArchitecture();

    // Default view route check (URL hash or default to home)
    const hash = window.location.hash.replace("#", "") || "home";
    this.navigate(hash, false);

    window.addEventListener("popstate", () => {
      const h = window.location.hash.replace("#", "") || "home";
      this.navigate(h, false);
    });

    console.log("AI Smart Dress Shop - Initialized Successfully");
  },

  /* --------------------------------------------------------------------------
     Navigation & View Switching
     -------------------------------------------------------------------------- */
  setupNavigation() {
    // Desktop & Mobile nav links
    document.querySelectorAll("[data-nav]").forEach(el => {
      el.addEventListener("click", (e) => {
        e.preventDefault();
        const targetView = el.getAttribute("data-nav");
        this.navigate(targetView);
        this.closeMobileDrawer();
      });
    });

    // Mobile drawer toggle
    const mobileBtn = document.getElementById("mobile-menu-btn");
    const closeDrawerBtn = document.getElementById("close-drawer-btn");
    const drawerOverlay = document.getElementById("drawer-overlay");

    if (mobileBtn) mobileBtn.addEventListener("click", () => this.openMobileDrawer());
    if (closeDrawerBtn) closeDrawerBtn.addEventListener("click", () => this.closeMobileDrawer());
    if (drawerOverlay) drawerOverlay.addEventListener("click", () => this.closeMobileDrawer());
  },

  navigate(viewName, updateHistory = true) {
    const validViews = [
      "home", "shop", "stylist", "categories", "recommendations",
      "wishlist", "cart", "checkout", "orders", "profile", "admin",
      "architecture", "problem", "audit"
    ];

    if (!validViews.includes(viewName)) {
      viewName = "home";
    }

    this.currentView = viewName;
    if (updateHistory) {
      window.location.hash = viewName;
    }

    // Toggle active class on view sections
    document.querySelectorAll(".view-section").forEach(sec => {
      sec.classList.remove("active");
    });
    const targetSection = document.getElementById(`view-${viewName}`);
    if (targetSection) {
      targetSection.classList.add("active");
      window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // Update active nav links
    document.querySelectorAll("[data-nav]").forEach(el => {
      el.classList.toggle("active", el.getAttribute("data-nav") === viewName);
    });

    // Special view triggers
    if (viewName === "shop") {
      this.renderShopProducts();
    } else if (viewName === "wishlist") {
      this.renderWishlist();
    } else if (viewName === "cart") {
      this.renderCart();
    } else if (viewName === "orders") {
      this.renderOrders();
    } else if (viewName === "admin") {
      this.renderAdminDashboard();
    }
  },

  openMobileDrawer() {
    document.getElementById("mobile-drawer")?.classList.add("active");
    document.getElementById("drawer-overlay")?.classList.add("active");
  },

  closeMobileDrawer() {
    document.getElementById("mobile-drawer")?.classList.remove("active");
    document.getElementById("drawer-overlay")?.classList.remove("active");
  },

  setupThemeToggle() {
    const themeBtn = document.getElementById("theme-toggle-btn");
    if (themeBtn) {
      themeBtn.addEventListener("click", () => {
        const next = Store.toggleTheme();
        themeBtn.textContent = next === "dark" ? "🌙" : "☀️";
        App.showToast(`Switched to ${next} mode`, "info");
      });
      themeBtn.textContent = Store.state.theme === "dark" ? "🌙" : "☀️";
    }
  },

  /* --------------------------------------------------------------------------
     Global Smart Search
     -------------------------------------------------------------------------- */
  setupSearch() {
    const searchInput = document.getElementById("global-search-input");
    const suggestionsBox = document.getElementById("search-suggestions");
    const clearBtn = document.getElementById("search-clear-btn");

    if (!searchInput) return;

    searchInput.addEventListener("focus", () => {
      if (suggestionsBox) suggestionsBox.classList.add("active");
    });

    searchInput.addEventListener("input", (e) => {
      const val = e.target.value.trim();
      if (clearBtn) clearBtn.classList.toggle("visible", val.length > 0);
    });

    // Close suggestions on click outside
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".search-container")) {
        suggestionsBox?.classList.remove("active");
      }
    });

    if (clearBtn) {
      clearBtn.addEventListener("click", () => {
        searchInput.value = "";
        clearBtn.classList.remove("visible");
        this.activeFilters.searchQuery = "";
        if (this.currentView === "shop") this.renderShopProducts();
      });
    }

    searchInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        const query = searchInput.value.trim();
        suggestionsBox?.classList.remove("active");
        this.executeSmartSearch(query);
      }
    });

    // Click on suggestion item
    document.querySelectorAll(".suggestion-item").forEach(item => {
      item.addEventListener("click", (e) => {
        const query = item.getAttribute("data-query");
        if (searchInput) searchInput.value = query;
        suggestionsBox?.classList.remove("active");
        this.executeSmartSearch(query);
      });
    });
  },

  executeSmartSearch(query) {
    if (!query) return;
    const parsed = AIEngine.parsePrompt(query);

    // Populate active filters based on NLP extraction
    this.activeFilters.searchQuery = query;
    if (parsed.color !== "Any Color") this.activeFilters.color = parsed.color;
    if (parsed.occasion !== "Casual") this.activeFilters.occasion = parsed.occasion;
    if (parsed.style !== "Modern") this.activeFilters.style = parsed.style;
    if (parsed.budget) this.activeFilters.maxPrice = parsed.budget;

    this.navigate("shop");
    this.showToast(`AI filtered for: "${query}"`, "info");
    this.renderShopProducts();
  },

  /* --------------------------------------------------------------------------
     Home Page: Trending Products & Category Showcase
     -------------------------------------------------------------------------- */
  renderHomeTrending() {
    const container = document.getElementById("trending-products-grid");
    if (!container) return;

    // Display first 6-8 trending products
    const trending = FASHION_PRODUCTS.slice(0, 8);
    container.innerHTML = trending.map(p => this.createProductCardHtml(p)).join("");
    this.attachCardEventListeners(container);
  },

  renderCategoriesGrid() {
    const container = document.getElementById("categories-grid");
    const shopCatContainer = document.getElementById("categories-view-grid");
    if (!container && !shopCatContainer) return;

    const html = CATEGORY_ITEMS.map(cat => `
      <div class="category-card" data-category="${cat.id}">
        <span class="category-icon">${cat.icon}</span>
        <div class="category-name">${cat.name}</div>
        <div class="category-count">${cat.count}</div>
      </div>
    `).join("");

    if (container) {
      container.innerHTML = html;
      container.querySelectorAll(".category-card").forEach(c => {
        c.addEventListener("click", () => {
          const category = c.getAttribute("data-category");
          this.activeFilters.category = category;
          this.navigate("shop");
        });
      });
    }

    if (shopCatContainer) {
      shopCatContainer.innerHTML = html;
      shopCatContainer.querySelectorAll(".category-card").forEach(c => {
        c.addEventListener("click", () => {
          const category = c.getAttribute("data-category");
          this.activeFilters.category = category;
          this.navigate("shop");
        });
      });
    }
  },

  /* --------------------------------------------------------------------------
     Product Card Generator
     -------------------------------------------------------------------------- */
  createProductCardHtml(product, aiScore = null) {
    const isFav = Store.isInWishlist(product.id);
    const discount = Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100);

    return `
      <div class="product-card" data-id="${product.id}">
        <div class="product-card-image-wrap">
          <img class="product-card-image" src="${product.image}" alt="${product.name}" loading="lazy" />
          <div class="card-badges">
            ${aiScore ? `<span class="badge badge-ai-match">✨ ${aiScore}% AI Match</span>` : ''}
            <span class="badge badge-discount">-${discount}% OFF</span>
            <span class="badge badge-category">${product.category}</span>
          </div>
          <button class="fav-btn ${isFav ? 'active' : ''}" data-fav-id="${product.id}" title="Add to Wishlist">
            ${isFav ? '❤️' : '🤍'}
          </button>
        </div>
        <div class="product-card-body">
          <div class="product-meta">
            <span class="product-rating">★ ${product.rating} <span style="color:var(--text-muted); font-size:0.75rem;">(${product.reviewsCount})</span></span>
            <span style="font-size:0.75rem; color:var(--accent-purple); font-weight:700;">${product.style} • ${product.occasion}</span>
          </div>
          <h4 class="product-card-title">${product.name}</h4>
          <div class="product-tags-row">
            <span class="product-pill">${product.color}</span>
            <span class="product-pill">${product.material.split(" ")[0]}</span>
            <span class="product-pill">Sizes: ${product.sizes.slice(0, 3).join(", ")}</span>
          </div>
          <div class="product-card-footer">
            <div class="product-price-box">
              <span class="product-price">₹${product.price.toLocaleString()}</span>
              <span class="product-original-price">₹${product.originalPrice.toLocaleString()}</span>
            </div>
            <button class="btn btn-sm btn-primary add-cart-btn" data-cart-id="${product.id}">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    `;
  },

  attachCardEventListeners(container) {
    // Open product modal on image or title click
    container.querySelectorAll(".product-card-image-wrap, .product-card-title").forEach(el => {
      el.addEventListener("click", (e) => {
        const card = el.closest(".product-card");
        const id = card.getAttribute("data-id");
        this.openProductModal(id);
      });
    });

    // Wishlist Toggle
    container.querySelectorAll(".fav-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-fav-id");
        const added = Store.toggleWishlist(id);
        btn.classList.toggle("active", added);
        btn.innerHTML = added ? "❤️" : "🤍";
        this.showToast(added ? "Added to your wishlist!" : "Removed from wishlist", "info");
      });
    });

    // Add to Cart button
    container.querySelectorAll(".add-cart-btn").forEach(btn => {
      btn.addEventListener("click", (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-cart-id");
        const prod = FASHION_PRODUCTS.find(p => p.id === id);
        if (prod) {
          Store.addToCart(prod, 1);
          this.showToast(`Added ${prod.name} to cart!`, "success");
        }
      });
    });
  },

  /* --------------------------------------------------------------------------
     AI Stylist Page (Section 4, 5, 6)
     -------------------------------------------------------------------------- */
  setupStylistForm() {
    const form = document.getElementById("ai-stylist-form");
    const budgetSlider = document.getElementById("stylist-budget-slider");
    const budgetDisplay = document.getElementById("stylist-budget-val");

    if (budgetSlider && budgetDisplay) {
      budgetSlider.addEventListener("input", (e) => {
        budgetDisplay.textContent = `₹${Number(e.target.value).toLocaleString()}`;
      });
    }

    if (form) {
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        this.generateAIStylistOutfit();
      });
    }

    const tryAnotherBtn = document.getElementById("stylist-try-another-btn");
    if (tryAnotherBtn) {
      tryAnotherBtn.addEventListener("click", () => {
        window.scrollTo({ top: 300, behavior: "smooth" });
      });
    }

    const addEnsembleBtn = document.getElementById("stylist-add-complete-btn");
    if (addEnsembleBtn) {
      addEnsembleBtn.addEventListener("click", () => {
        if (this.currentEnsemble) {
          // Add primary item + accessories to cart
          FASHION_PRODUCTS.slice(0, 3).forEach(p => Store.addToCart(p, 1));
          this.showToast("Complete 4-Piece AI Outfit added to cart!", "success");
        }
      });
    }
  },

  generateAIStylistOutfit() {
    const occasion = document.getElementById("stylist-occasion")?.value || "Wedding";
    const style = document.getElementById("stylist-style")?.value || "Modern";
    const color = document.getElementById("stylist-color")?.value || "Black";
    const size = document.getElementById("stylist-size")?.value || "M";
    const budget = Number(document.getElementById("stylist-budget-slider")?.value) || 5000;

    const criteria = { occasion, style, color, size, budget };
    const ensemble = AIEngine.generateOutfitEnsemble(criteria);
    this.currentEnsemble = ensemble;

    // Render Ensemble Card
    const resultContainer = document.getElementById("stylist-result-container");
    if (!resultContainer) return;

    resultContainer.classList.add("active");
    resultContainer.scrollIntoView({ behavior: "smooth", block: "start" });

    // Fill titles & match percentages
    document.getElementById("ensemble-title").textContent = ensemble.title;
    document.getElementById("ensemble-match-score").textContent = `${ensemble.overallScore}%`;

    // Breakdown scores
    const b = ensemble.breakdown;
    document.getElementById("score-occasion-val").textContent = `${b.occasionMatch}%`;
    document.getElementById("score-occasion-bar").style.width = `${b.occasionMatch}%`;

    document.getElementById("score-color-val").textContent = `${b.colorMatch}%`;
    document.getElementById("score-color-bar").style.width = `${b.colorMatch}%`;

    document.getElementById("score-style-val").textContent = `${b.styleMatch}%`;
    document.getElementById("score-style-bar").style.width = `${b.styleMatch}%`;

    document.getElementById("score-size-val").textContent = `${b.sizeMatch}%`;
    document.getElementById("score-size-bar").style.width = `${b.sizeMatch}%`;

    document.getElementById("score-budget-val").textContent = `${b.budgetMatch}%`;
    document.getElementById("score-budget-bar").style.width = `${b.budgetMatch}%`;

    // Fill ensemble items list
    const itemsList = document.getElementById("ensemble-items-list");
    if (itemsList) {
      itemsList.innerHTML = ensemble.items.map(item => `
        <li class="ensemble-item-row">
          <span class="ensemble-item-icon">${item.icon}</span>
          <div style="flex:1;">
            <div style="font-weight:700; color:var(--text-primary);">${item.name}</div>
            <div style="font-size:0.78rem; color:var(--text-muted);">${item.type}</div>
          </div>
          <div style="font-weight:800; color:var(--accent-green);">₹${item.price.toLocaleString()}</div>
        </li>
      `).join("");
    }

    // Render individual matching top products
    const topGrid = document.getElementById("ensemble-top-products-grid");
    if (topGrid) {
      topGrid.innerHTML = ensemble.topRecommendations.map(p => this.createProductCardHtml(p, p.matchScore)).join("");
      this.attachCardEventListeners(topGrid);
    }
  },

  /* --------------------------------------------------------------------------
     Shop View & Dynamic Multi-Attribute Filtering (Section 7)
     -------------------------------------------------------------------------- */
  setupShopFilters() {
    // Category Select
    const catSelect = document.getElementById("filter-category");
    if (catSelect) {
      catSelect.addEventListener("change", (e) => {
        this.activeFilters.category = e.target.value;
        this.renderShopProducts();
      });
    }

    // Price Slider
    const priceSlider = document.getElementById("filter-price-slider");
    const priceVal = document.getElementById("filter-price-val");
    if (priceSlider && priceVal) {
      priceSlider.addEventListener("input", (e) => {
        this.activeFilters.maxPrice = Number(e.target.value);
        priceVal.textContent = `₹${this.activeFilters.maxPrice.toLocaleString()}`;
        this.renderShopProducts();
      });
    }

    // Color, Style, Occasion & Size checkboxes or pills
    document.querySelectorAll(".shop-filter-cb").forEach(cb => {
      cb.addEventListener("change", () => {
        const filterType = cb.getAttribute("data-filter-type"); // color, style, occasion, size
        const value = cb.value;
        if (cb.checked) {
          this.activeFilters[filterType] = value;
        } else {
          this.activeFilters[filterType] = "All";
        }
        this.renderShopProducts();
      });
    });

    // Reset filters button
    const resetBtn = document.getElementById("reset-filters-btn");
    if (resetBtn) {
      resetBtn.addEventListener("click", () => {
        this.activeFilters = {
          category: "All",
          gender: "All",
          color: "All",
          style: "All",
          occasion: "All",
          size: "All",
          maxPrice: 10000,
          searchQuery: ""
        };
        const searchInput = document.getElementById("global-search-input");
        if (searchInput) searchInput.value = "";
        this.renderShopProducts();
        this.showToast("Filters reset to default", "info");
      });
    }
  },

  renderShopProducts() {
    const container = document.getElementById("shop-products-grid");
    const countDisplay = document.getElementById("shop-results-count");
    const activeChipsContainer = document.getElementById("active-filter-chips");
    if (!container) return;

    // Filter products
    const filtered = FASHION_PRODUCTS.filter(product => {
      const f = this.activeFilters;

      // Category
      if (f.category !== "All" && product.category !== f.category && product.subCategory !== f.category) {
        return false;
      }
      // Color
      if (f.color !== "All" && product.color.toLowerCase() !== f.color.toLowerCase()) {
        return false;
      }
      // Style
      if (f.style !== "All" && product.style.toLowerCase() !== f.style.toLowerCase()) {
        return false;
      }
      // Occasion
      if (f.occasion !== "All" && product.occasion.toLowerCase() !== f.occasion.toLowerCase()) {
        return false;
      }
      // Size
      if (f.size !== "All" && !product.sizes.includes(f.size)) {
        return false;
      }
      // Price
      if (product.price > f.maxPrice) {
        return false;
      }
      // Free-text query
      if (f.searchQuery) {
        const q = f.searchQuery.toLowerCase();
        const matchesName = product.name.toLowerCase().includes(q);
        const matchesCategory = product.category.toLowerCase().includes(q);
        const matchesColor = product.color.toLowerCase().includes(q);
        const matchesStyle = product.style.toLowerCase().includes(q);
        const matchesOccasion = product.occasion.toLowerCase().includes(q);
        const matchesTag = product.tags.some(t => t.includes(q));

        if (!matchesName && !matchesCategory && !matchesColor && !matchesStyle && !matchesOccasion && !matchesTag) {
          return false;
        }
      }

      return true;
    });

    if (countDisplay) {
      countDisplay.textContent = `Showing ${filtered.length} products`;
    }

    // Active filter chips
    if (activeChipsContainer) {
      const activeTags = [];
      if (this.activeFilters.category !== "All") activeTags.push({ key: "category", val: `Category: ${this.activeFilters.category}` });
      if (this.activeFilters.color !== "All") activeTags.push({ key: "color", val: `Color: ${this.activeFilters.color}` });
      if (this.activeFilters.style !== "All") activeTags.push({ key: "style", val: `Style: ${this.activeFilters.style}` });
      if (this.activeFilters.occasion !== "All") activeTags.push({ key: "occasion", val: `Occasion: ${this.activeFilters.occasion}` });
      if (this.activeFilters.size !== "All") activeTags.push({ key: "size", val: `Size: ${this.activeFilters.size}` });
      if (this.activeFilters.searchQuery) activeTags.push({ key: "searchQuery", val: `"${this.activeFilters.searchQuery}"` });

      activeChipsContainer.innerHTML = activeTags.map(tag => `
        <span class="filter-chip-tag">
          ${tag.val}
          <span class="filter-chip-remove" data-remove-key="${tag.key}">✕</span>
        </span>
      `).join("");

      activeChipsContainer.querySelectorAll(".filter-chip-remove").forEach(btn => {
        btn.addEventListener("click", () => {
          const k = btn.getAttribute("data-remove-key");
          if (k === "searchQuery") {
            this.activeFilters.searchQuery = "";
            const searchInput = document.getElementById("global-search-input");
            if (searchInput) searchInput.value = "";
          } else {
            this.activeFilters[k] = "All";
          }
          this.renderShopProducts();
        });
      });
    }

    if (filtered.length === 0) {
      container.innerHTML = `
        <div style="grid-column: 1 / -1; text-align: center; padding: var(--spacing-3xl); background: var(--bg-surface-elevated); border-radius: var(--radius-xl);">
          <div style="font-size: 3rem; margin-bottom: 12px;">👗🔍</div>
          <h3>No matching outfits found</h3>
          <p style="color:var(--text-muted); margin: 8px 0 20px;">Try adjusting your price range, color, or style filters.</p>
          <button class="btn btn-primary" onclick="App.activeFilters = {category:'All',gender:'All',color:'All',style:'All',occasion:'All',size:'All',maxPrice:10000,searchQuery:''}; App.renderShopProducts();">Clear All Filters</button>
        </div>
      `;
    } else {
      container.innerHTML = filtered.map(p => this.createProductCardHtml(p)).join("");
      this.attachCardEventListeners(container);
    }
  },

  /* --------------------------------------------------------------------------
     Product Details Modal (Section 8)
     -------------------------------------------------------------------------- */
  openProductModal(productId) {
    const product = FASHION_PRODUCTS.find(p => p.id === productId);
    if (!product) return;
    this.currentModalProduct = product;

    const modal = document.getElementById("product-detail-modal");
    if (!modal) return;

    document.getElementById("modal-prod-image").src = product.image;
    document.getElementById("modal-prod-name").textContent = product.name;
    document.getElementById("modal-prod-price").textContent = `₹${product.price.toLocaleString()}`;
    document.getElementById("modal-prod-original-price").textContent = `₹${product.originalPrice.toLocaleString()}`;
    document.getElementById("modal-prod-discount").textContent = `-${Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF`;
    document.getElementById("modal-prod-rating").textContent = `★ ${product.rating} (${product.reviewsCount} verified reviews)`;
    document.getElementById("modal-prod-desc").textContent = product.description;
    document.getElementById("modal-prod-material").textContent = product.material;
    document.getElementById("modal-prod-occasion").textContent = product.occasion;
    document.getElementById("modal-prod-style").textContent = product.style;

    // "Why AI Recommended This?" (Section 8)
    const reasonBox = document.getElementById("modal-prod-ai-reason");
    if (reasonBox) {
      reasonBox.textContent = `This product matches your preferred ${product.color.toLowerCase()} palette, ${product.style.toLowerCase()} style, and is perfectly tailored for ${product.occasion.toLowerCase()} occasions within your target budget.`;
    }

    // Render sizes
    const sizesContainer = document.getElementById("modal-prod-sizes");
    if (sizesContainer) {
      sizesContainer.innerHTML = product.sizes.map((s, idx) => `
        <button class="choice-chip ${idx === 0 ? 'active' : ''}" data-size="${s}">${s}</button>
      `).join("");

      sizesContainer.querySelectorAll(".choice-chip").forEach(chip => {
        chip.addEventListener("click", () => {
          sizesContainer.querySelectorAll(".choice-chip").forEach(c => c.classList.remove("active"));
          chip.classList.add("active");
        });
      });
    }

    modal.classList.add("active");
  },

  closeProductModal() {
    document.getElementById("product-detail-modal")?.classList.remove("active");
  },

  /* --------------------------------------------------------------------------
     AI Color, Size & Image Search Advisors (Section 9, 10, 11)
     -------------------------------------------------------------------------- */
  setupAdvisors() {
    // 1. Color Advisor
    const colorBtn = document.getElementById("generate-color-palette-btn");
    if (colorBtn) {
      colorBtn.addEventListener("click", () => {
        const tone = document.getElementById("color-skin-tone")?.value || "medium";
        const palette = COLOR_THEORY_PALETTES[tone] || COLOR_THEORY_PALETTES["medium"];

        const display = document.getElementById("color-palette-results");
        if (display) {
          display.innerHTML = `
            <div style="margin-bottom: 8px; font-weight:700; color:var(--text-primary);">${palette.name} Recommendations:</div>
            <div class="color-swatch-display">
              ${palette.recommended.map(c => `
                <div class="color-swatch-item" style="background-color: ${c.hex};">
                  <span>${c.name}</span>
                </div>
              `).join("")}
            </div>
            <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:8px;">💡 ${palette.advice}</p>
            <button class="btn btn-sm btn-primary" id="shop-palette-btn" style="margin-top:10px;">
              🛍 Shop These Colors
            </button>
          `;

          document.getElementById("shop-palette-btn")?.addEventListener("click", () => {
            const firstColor = palette.recommended[0].name.split(" ").pop();
            this.activeFilters.color = firstColor;
            this.navigate("shop");
          });
        }
      });
    }

    // 2. Size Advisor
    const sizeBtn = document.getElementById("calculate-size-btn");
    if (sizeBtn) {
      sizeBtn.addEventListener("click", () => {
        const height = Number(document.getElementById("size-input-height")?.value) || 175;
        const weight = Number(document.getElementById("size-input-weight")?.value) || 70;
        const chest = Number(document.getElementById("size-input-chest")?.value) || 39;
        const fit = document.getElementById("size-input-fit")?.value || "Regular";

        const rec = AIEngine.calculateSize(height, weight, chest, fit);

        const resultBox = document.getElementById("size-recommendation-result");
        if (resultBox) {
          resultBox.innerHTML = `
            <div style="background: var(--bg-surface-elevated); border:1px solid var(--border-accent); border-radius: var(--radius-md); padding: var(--spacing-md); margin-top:14px;">
              <div style="display:flex; justify-content:space-between; align-items:center;">
                <div>
                  <div style="font-size:0.8rem; color:var(--text-muted); text-transform:uppercase; font-weight:700;">Recommended Size</div>
                  <div style="font-size:2rem; font-weight:800; color:var(--accent-purple);">${rec.recommendedSize}</div>
                </div>
                <div style="text-align:right;">
                  <span class="badge badge-ai-match" style="font-size:0.85rem;">${rec.confidence}% Confidence</span>
                </div>
              </div>
              <p style="font-size:0.85rem; color:var(--text-secondary); margin-top:8px;">${rec.advice}</p>
              <div style="font-size:0.75rem; color:var(--text-muted); margin-top:8px; border-top:1px dashed var(--border-subtle); padding-top:6px;">
                * Prototype AI measurement guide. Standard fit tested across industrial size charts.
              </div>
            </div>
          `;
        }
      });
    }

    // 3. Image Search Simulator (Section 11)
    const fileInput = document.getElementById("image-upload-input");
    const dropzone = document.getElementById("image-upload-dropzone");
    const imageResults = document.getElementById("image-search-results");

    if (dropzone && fileInput) {
      dropzone.addEventListener("click", () => fileInput.click());
      fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
          this.simulateImageSearch(file.name);
        }
      });
    }

    // Sample dress tags for image search
    document.querySelectorAll(".image-search-preset").forEach(btn => {
      btn.addEventListener("click", () => {
        const query = btn.getAttribute("data-preset");
        this.simulateImageSearch(query);
      });
    });
  },

  simulateImageSearch(filename) {
    const resultsContainer = document.getElementById("image-search-results");
    if (!resultsContainer) return;

    resultsContainer.innerHTML = `
      <div style="padding: 16px; text-align:center; color:var(--accent-purple);">
        <div class="live-status-dot" style="display:inline-block; margin-right:8px;"></div>
        Simulating Computer Vision Deep Feature Extraction on <strong>${filename}</strong>...
      </div>
    `;

    setTimeout(() => {
      const matches = AIEngine.simulateVisualSearch(filename);
      resultsContainer.innerHTML = `
        <div style="margin: 14px 0 8px; font-weight:700;">Similar Products Found:</div>
        <div class="products-grid" style="grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));">
          ${matches.map(p => this.createProductCardHtml(p)).join("")}
        </div>
      `;
      this.attachCardEventListeners(resultsContainer);
    }, 700);
  },

  /* --------------------------------------------------------------------------
     Cart & Checkout Flow (Section 13, 14, 15, 16)
     -------------------------------------------------------------------------- */
  setupCartAndCheckout() {
    // Modal buttons
    document.getElementById("modal-add-cart-btn")?.addEventListener("click", () => {
      if (this.currentModalProduct) {
        const activeSizeChip = document.querySelector("#modal-prod-sizes .choice-chip.active");
        const chosenSize = activeSizeChip ? activeSizeChip.getAttribute("data-size") : "M";
        Store.addToCart(this.currentModalProduct, 1, chosenSize);
        this.showToast(`Added ${this.currentModalProduct.name} (Size: ${chosenSize}) to cart!`, "success");
        this.closeProductModal();
      }
    });

    document.getElementById("modal-buy-now-btn")?.addEventListener("click", () => {
      if (this.currentModalProduct) {
        Store.addToCart(this.currentModalProduct, 1);
        this.closeProductModal();
        this.navigate("checkout");
      }
    });

    // Checkout form submission
    const checkoutForm = document.getElementById("checkout-form");
    if (checkoutForm) {
      checkoutForm.addEventListener("submit", (e) => {
        e.preventDefault();
        this.processCheckout();
      });
    }

    // Step Simulator in Order Tracking
    document.getElementById("advance-order-step-btn")?.addEventListener("click", () => {
      this.advanceOrderStep();
    });
  },

  renderWishlist() {
    const container = document.getElementById("wishlist-products-grid");
    const emptyState = document.getElementById("wishlist-empty-state");
    if (!container) return;

    const wishlistProds = FASHION_PRODUCTS.filter(p => Store.isInWishlist(p.id));

    if (wishlistProds.length === 0) {
      container.style.display = "none";
      if (emptyState) emptyState.style.display = "block";
    } else {
      if (emptyState) emptyState.style.display = "none";
      container.style.display = "grid";
      container.innerHTML = wishlistProds.map(p => this.createProductCardHtml(p)).join("");
      this.attachCardEventListeners(container);
    }
  },

  renderCart() {
    const itemsContainer = document.getElementById("cart-items-list");
    const emptyState = document.getElementById("cart-empty-state");
    const totals = Store.getCartTotals();

    // Summary numbers
    document.getElementById("cart-subtotal").textContent = `₹${totals.subtotal.toLocaleString()}`;
    document.getElementById("cart-discount").textContent = `-₹${totals.discount.toLocaleString()}`;
    document.getElementById("cart-delivery").textContent = totals.delivery === 0 ? "FREE" : `₹${totals.delivery}`;
    document.getElementById("cart-grand-total").textContent = `₹${totals.grandTotal.toLocaleString()}`;

    if (!itemsContainer) return;

    if (Store.state.cart.length === 0) {
      itemsContainer.style.display = "none";
      if (emptyState) emptyState.style.display = "block";
      document.getElementById("proceed-checkout-btn")?.setAttribute("disabled", "true");
    } else {
      if (emptyState) emptyState.style.display = "none";
      itemsContainer.style.display = "block";
      document.getElementById("proceed-checkout-btn")?.removeAttribute("disabled");

      itemsContainer.innerHTML = Store.state.cart.map(item => `
        <div class="cart-item-row">
          <img class="cart-item-img" src="${item.product.image}" alt="${item.product.name}" />
          <div>
            <div style="font-weight:700; color:var(--text-primary);">${item.product.name}</div>
            <div style="font-size:0.8rem; color:var(--text-muted);">Size: ${item.selectedSize} | Color: ${item.selectedColor}</div>
            <div style="font-size:0.85rem; color:var(--accent-purple); font-weight:700;">₹${item.product.price.toLocaleString()}</div>
          </div>
          <div class="qty-control">
            <button class="qty-btn" data-action="dec" data-id="${item.product.id}" data-size="${item.selectedSize}">-</button>
            <span class="qty-display">${item.quantity}</span>
            <button class="qty-btn" data-action="inc" data-id="${item.product.id}" data-size="${item.selectedSize}">+</button>
          </div>
          <div style="font-weight:800; font-size:1.05rem;">₹${(item.product.price * item.quantity).toLocaleString()}</div>
          <button class="btn btn-ghost" data-action="remove" data-id="${item.product.id}" data-size="${item.selectedSize}" style="color:var(--accent-pink); padding:6px;">✕</button>
        </div>
      `).join("");

      // Qty event listeners
      itemsContainer.querySelectorAll(".qty-btn").forEach(b => {
        b.addEventListener("click", () => {
          const id = b.getAttribute("data-id");
          const size = b.getAttribute("data-size");
          const delta = b.getAttribute("data-action") === "inc" ? 1 : -1;
          Store.updateCartQty(id, size, delta);
        });
      });

      itemsContainer.querySelectorAll("[data-action='remove']").forEach(b => {
        b.addEventListener("click", () => {
          const id = b.getAttribute("data-id");
          const size = b.getAttribute("data-size");
          Store.removeFromCart(id, size);
          App.showToast("Item removed from cart", "info");
        });
      });
    }
  },

  processCheckout() {
    const fullName = document.getElementById("checkout-name")?.value;
    const email = document.getElementById("checkout-email")?.value;
    const phone = document.getElementById("checkout-phone")?.value;
    const address = document.getElementById("checkout-address")?.value;
    const city = document.getElementById("checkout-city")?.value;
    const state = document.getElementById("checkout-state")?.value;
    const pincode = document.getElementById("checkout-pincode")?.value;

    const paymentMethodEl = document.querySelector("input[name='payment-method']:checked");
    const paymentMethod = paymentMethodEl ? paymentMethodEl.value : "UPI (Google Pay)";

    // Show simulated modal / feedback
    this.showToast("Securing payment & generating order token...", "info");

    setTimeout(() => {
      const newOrder = Store.createOrder({
        shippingAddress: { fullName, email, phone, address, city, state, pincode },
        paymentMethod: paymentMethod
      });

      this.showToast(`Order ${newOrder.orderId} Placed Successfully!`, "success");
      this.navigate("orders");
    }, 1000);
  },

  renderOrders() {
    const order = Store.state.orders[0];
    if (!order) return;

    document.getElementById("tracking-order-id").textContent = order.orderId;
    document.getElementById("tracking-order-date").textContent = order.createdAt;
    document.getElementById("tracking-order-total").textContent = `₹${order.totalAmount.toLocaleString()}`;
    document.getElementById("tracking-order-status").textContent = order.status;

    // Update Stepper
    this.updateStepperUi(order.statusCode);

    // Render Order Items
    const itemsList = document.getElementById("order-tracking-items-list");
    if (itemsList) {
      itemsList.innerHTML = order.items.map(item => `
        <div style="display:flex; align-items:center; gap:12px; padding:10px 0; border-bottom:1px solid var(--border-subtle);">
          <img src="${item.product ? item.product.image : item.image}" style="width:50px; height:60px; object-fit:cover; border-radius:var(--radius-sm);" />
          <div style="flex:1;">
            <div style="font-weight:700;">${item.product ? item.product.name : item.name}</div>
            <div style="font-size:0.8rem; color:var(--text-muted);">Qty: ${item.quantity} | Size: ${item.selectedSize}</div>
          </div>
          <div style="font-weight:800;">₹${((item.product ? item.product.price : item.price) * item.quantity).toLocaleString()}</div>
        </div>
      `).join("");
    }
  },

  updateStepperUi(code) {
    const steps = [
      { num: 1, id: "step-placed", label: "Order Placed" },
      { num: 2, id: "step-confirmed", label: "Payment Confirmed" },
      { num: 3, id: "step-processing", label: "Processing" },
      { num: 4, id: "step-shipped", label: "Shipped" },
      { num: 5, id: "step-delivery", label: "Out for Delivery" },
      { num: 6, id: "step-delivered", label: "Delivered" }
    ];

    steps.forEach(s => {
      const node = document.getElementById(s.id);
      if (!node) return;
      node.classList.remove("completed", "current");
      if (s.num < code) {
        node.classList.add("completed");
        node.querySelector(".step-circle").textContent = "✓";
      } else if (s.num === code) {
        node.classList.add("current");
        node.querySelector(".step-circle").textContent = "●";
      } else {
        node.querySelector(".step-circle").textContent = "○";
      }
    });

    const progressLine = document.getElementById("stepper-progress-line");
    if (progressLine) {
      const pct = Math.min(100, Math.round(((code - 1) / (steps.length - 1)) * 100));
      progressLine.style.width = `${pct}%`;
    }
  },

  advanceOrderStep() {
    const order = Store.state.orders[0];
    if (!order) return;
    order.statusCode = (order.statusCode % 6) + 1;
    const statusMap = {
      1: "Order Placed",
      2: "Payment Confirmed",
      3: "Processing",
      4: "Shipped",
      5: "Out for Delivery",
      6: "Delivered"
    };
    order.status = statusMap[order.statusCode];
    Store.saveOrders();
    this.renderOrders();
    this.showToast(`Order status updated to: ${order.status}`, "info");
  },

  /* --------------------------------------------------------------------------
     User Profile (Section 17)
     -------------------------------------------------------------------------- */
  renderProfile() {
    const prof = Store.state.profile;
    if (!prof) return;

    document.getElementById("profile-name").textContent = prof.name;
    document.getElementById("profile-email").textContent = prof.email;
    document.getElementById("profile-phone").textContent = prof.phone;
    document.getElementById("profile-tier").textContent = prof.tier;

    document.getElementById("profile-pref-style").textContent = prof.preferences.style;
    document.getElementById("profile-pref-color").textContent = prof.preferences.color;
    document.getElementById("profile-pref-occasion").textContent = prof.preferences.occasion;

    document.getElementById("profile-size-height").textContent = prof.height;
    document.getElementById("profile-size-weight").textContent = prof.weight;
    document.getElementById("profile-size-chest").textContent = prof.chest;
    document.getElementById("profile-size-waist").textContent = prof.waist;
    document.getElementById("profile-size-saved").textContent = prof.savedSize;
  },

  /* --------------------------------------------------------------------------
     Admin Dashboard & SVG Charts (Section 18)
     -------------------------------------------------------------------------- */
  renderAdminDashboard() {
    const stats = Store.state.adminStats;
    document.getElementById("kpi-products").textContent = stats.totalProducts;
    document.getElementById("kpi-customers").textContent = stats.totalCustomers.toLocaleString();
    document.getElementById("kpi-orders").textContent = stats.totalOrders.toLocaleString();
    document.getElementById("kpi-revenue").textContent = `₹${stats.revenue.toLocaleString()}`;

    // Render Clean SVG Charts
    this.renderAdminCharts();

    // Inventory Table
    const tableBody = document.getElementById("admin-inventory-table-body");
    if (tableBody) {
      tableBody.innerHTML = FASHION_PRODUCTS.slice(0, 6).map(p => `
        <tr style="border-bottom: 1px solid var(--border-subtle);">
          <td style="padding: 10px; display:flex; align-items:center; gap:8px;">
            <img src="${p.image}" style="width:36px; height:44px; object-fit:cover; border-radius:4px;" />
            <span style="font-weight:700;">${p.name}</span>
          </td>
          <td style="padding: 10px; color:var(--text-muted);">${p.category}</td>
          <td style="padding: 10px; font-weight:700;">₹${p.price.toLocaleString()}</td>
          <td style="padding: 10px; color:var(--accent-green); font-weight:700;">In Stock (42)</td>
          <td style="padding: 10px;">★ ${p.rating}</td>
        </tr>
      `).join("");
    }
  },

  renderAdminCharts() {
    // 1. Sales Trend SVG Area Chart
    const salesChart = document.getElementById("sales-svg-chart");
    if (salesChart) {
      salesChart.innerHTML = `
        <svg viewBox="0 0 500 200" style="width:100%; height:100%;">
          <defs>
            <linearGradient id="salesGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stop-color="#8b5cf6" stop-opacity="0.45" />
              <stop offset="100%" stop-color="#8b5cf6" stop-opacity="0.0" />
            </linearGradient>
          </defs>
          <line x1="40" y1="160" x2="480" y2="160" stroke="var(--chart-grid)" stroke-width="1" />
          <line x1="40" y1="110" x2="480" y2="110" stroke="var(--chart-grid)" stroke-width="1" />
          <line x1="40" y1="60" x2="480" y2="60" stroke="var(--chart-grid)" stroke-width="1" />
          
          <polygon points="40,160 40,140 110,120 180,135 250,90 320,105 390,55 460,40 460,160" fill="url(#salesGrad)" />
          <polyline points="40,140 110,120 180,135 250,90 320,105 390,55 460,40" fill="none" stroke="#8b5cf6" stroke-width="3" stroke-linecap="round" />

          <!-- Data Points -->
          <circle cx="110" cy="120" r="4" fill="#8b5cf6" />
          <circle cx="180" cy="135" r="4" fill="#8b5cf6" />
          <circle cx="250" cy="90" r="4" fill="#8b5cf6" />
          <circle cx="320" cy="105" r="4" fill="#8b5cf6" />
          <circle cx="390" cy="55" r="4" fill="#ec4899" />
          <circle cx="460" cy="40" r="5" fill="#10b981" />

          <!-- Labels -->
          <text x="40" y="180" fill="var(--text-muted)" font-size="11">Apr</text>
          <text x="110" y="180" fill="var(--text-muted)" font-size="11">May</text>
          <text x="180" y="180" fill="var(--text-muted)" font-size="11">Jun</text>
          <text x="250" y="180" fill="var(--text-muted)" font-size="11">Jul</text>
          <text x="320" y="180" fill="var(--text-muted)" font-size="11">Aug</text>
          <text x="390" y="180" fill="var(--text-muted)" font-size="11">Sep</text>
          <text x="460" y="180" fill="var(--accent-green)" font-size="11" font-weight="700">Oct</text>
        </svg>
      `;
    }

    // 2. Orders by Status Bar Chart
    const ordersChart = document.getElementById("orders-svg-chart");
    if (ordersChart) {
      ordersChart.innerHTML = `
        <svg viewBox="0 0 500 200" style="width:100%; height:100%;">
          <line x1="40" y1="160" x2="480" y2="160" stroke="var(--chart-grid)" stroke-width="1" />
          <!-- Placed -->
          <rect x="70" y="90" width="40" height="70" rx="4" fill="#8b5cf6" />
          <text x="90" y="80" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-weight="700">142</text>
          <text x="90" y="180" text-anchor="middle" fill="var(--text-muted)" font-size="11">Placed</text>

          <!-- Confirmed -->
          <rect x="150" y="60" width="40" height="100" rx="4" fill="#06b6d4" />
          <text x="170" y="50" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-weight="700">210</text>
          <text x="170" y="180" text-anchor="middle" fill="var(--text-muted)" font-size="11">Confirmed</text>

          <!-- Processing -->
          <rect x="230" y="75" width="40" height="85" rx="4" fill="#f59e0b" />
          <text x="250" y="65" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-weight="700">180</text>
          <text x="250" y="180" text-anchor="middle" fill="var(--text-muted)" font-size="11">Processing</text>

          <!-- Shipped -->
          <rect x="310" y="100" width="40" height="60" rx="4" fill="#ec4899" />
          <text x="330" y="90" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-weight="700">124</text>
          <text x="330" y="180" text-anchor="middle" fill="var(--text-muted)" font-size="11">Shipped</text>

          <!-- Delivered -->
          <rect x="390" y="40" width="40" height="120" rx="4" fill="#10b981" />
          <text x="410" y="30" text-anchor="middle" fill="var(--text-primary)" font-size="12" font-weight="700">300</text>
          <text x="410" y="180" text-anchor="middle" fill="var(--text-muted)" font-size="11">Delivered</text>
        </svg>
      `;
    }
  },

  /* --------------------------------------------------------------------------
     System Architecture & Database Model (Section 19, 20)
     -------------------------------------------------------------------------- */
  renderSystemArchitecture() {
    const schemasContainer = document.getElementById("database-schemas-grid");
    if (!schemasContainer) return;

    schemasContainer.innerHTML = SYSTEM_SCHEMA_MODELS.map(schema => `
      <div class="schema-card">
        <div class="schema-card-header">
          <span>📦 Table: ${schema.tableName}</span>
          <span style="font-size:0.75rem; opacity:0.8;">Relational</span>
        </div>
        <div style="padding:8px 16px; font-size:0.78rem; color:var(--text-muted); background:var(--bg-surface);">
          ${schema.description}
        </div>
        <ul class="schema-fields-list">
          ${schema.fields.map(f => `
            <li class="schema-field-item">
              <span class="schema-field-name">${f.name}</span>
              <span class="schema-field-type">${f.type}</span>
            </li>
          `).join("")}
        </ul>
      </div>
    `).join("");
  },

  /* --------------------------------------------------------------------------
     Customer Problem Validation & Interactive Poll (Section 21)
     -------------------------------------------------------------------------- */
  setupFeedbackPoll() {
    this.renderPollResults();

    document.querySelectorAll(".poll-vote-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const optionKey = btn.getAttribute("data-poll-option");
        Store.votePoll(optionKey);
        this.renderPollResults();
        this.showToast("Thank you for your feedback! Vote recorded in real-time.", "success");
      });
    });
  },

  renderPollResults() {
    const votes = Store.state.pollVotes;
    const totalVotes = Object.values(votes).reduce((sum, v) => sum + v, 0);

    const keys = ["style", "size", "color", "occasion", "choices"];
    keys.forEach(k => {
      const count = votes[k];
      const pct = Math.round((count / totalVotes) * 100);

      const countEl = document.getElementById(`poll-val-${k}`);
      const barEl = document.getElementById(`poll-bar-${k}`);
      if (countEl) countEl.textContent = `${count} votes (${pct}%)`;
      if (barEl) barEl.style.width = `${pct}%`;
    });

    const totalEl = document.getElementById("poll-total-votes");
    if (totalEl) totalEl.textContent = `${totalVotes.toLocaleString()} shoppers surveyed`;
  },

  /* --------------------------------------------------------------------------
     AI Prompt Audit (Section 22)
     -------------------------------------------------------------------------- */
  setupPromptAudit() {
    const auditBtn = document.getElementById("run-prompt-audit-btn");
    const input = document.getElementById("prompt-audit-input");

    if (auditBtn && input) {
      auditBtn.addEventListener("click", () => {
        this.runPromptAudit(input.value);
      });
    }

    // Preset audit prompt buttons
    document.querySelectorAll(".audit-preset-btn").forEach(btn => {
      btn.addEventListener("click", () => {
        const text = btn.getAttribute("data-prompt");
        if (input) input.value = text;
        this.runPromptAudit(text);
      });
    });

    // Run default audit on load
    this.runPromptAudit("I need a black modern outfit for a wedding under ₹3000.");
  },

  runPromptAudit(promptText) {
    const parsed = AIEngine.parsePrompt(promptText);

    document.getElementById("audit-display-occasion").textContent = parsed.occasion;
    document.getElementById("audit-display-color").textContent = parsed.color;
    document.getElementById("audit-display-style").textContent = parsed.style;
    document.getElementById("audit-display-budget").textContent = `₹${parsed.budget.toLocaleString()}`;

    // Get recommendations for audit
    const recs = AIEngine.getRecommendations(FASHION_PRODUCTS, parsed, 3);
    const resultsTable = document.getElementById("audit-results-table-body");
    if (resultsTable) {
      resultsTable.innerHTML = recs.map(r => `
        <tr style="border-bottom: 1px solid var(--border-subtle);">
          <td style="padding:10px; font-weight:700;">${r.name}</td>
          <td style="padding:10px;">${r.category}</td>
          <td style="padding:10px; color:var(--accent-purple); font-weight:700;">₹${r.price.toLocaleString()}</td>
          <td style="padding:10px;"><span class="badge badge-ai-match">${r.matchScore}% Match</span></td>
          <td style="padding:10px; font-size:0.8rem; color:var(--text-muted);">${r.aiReason}</td>
        </tr>
      `).join("");
    }
  },

  /* --------------------------------------------------------------------------
     Global State Listeners & Toast System
     -------------------------------------------------------------------------- */
  setupStateListeners() {
    // Listen for Cart updates
    window.addEventListener("cart:updated", () => {
      const totals = Store.getCartTotals();
      const badge = document.getElementById("nav-cart-badge");
      if (badge) {
        badge.textContent = totals.totalCount;
        badge.style.display = totals.totalCount > 0 ? "flex" : "none";
      }
      if (this.currentView === "cart") this.renderCart();
    });

    // Listen for Wishlist updates
    window.addEventListener("wishlist:updated", () => {
      const badge = document.getElementById("nav-wishlist-badge");
      if (badge) {
        badge.textContent = Store.state.wishlist.length;
        badge.style.display = Store.state.wishlist.length > 0 ? "flex" : "none";
      }
      if (this.currentView === "wishlist") this.renderWishlist();
    });
  },

  showToast(message, type = "info") {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      container.className = "toast-container";
      document.body.appendChild(container);
    }

    const toast = document.createElement("div");
    toast.className = `toast toast-${type}`;
    const icon = type === "success" ? "✓" : "✨";
    toast.innerHTML = `<span style="font-size:1.1rem; color:var(--accent-purple); font-weight:800;">${icon}</span> <span>${message}</span>`;

    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = "0";
      toast.style.transform = "translateX(-20px)";
      setTimeout(() => toast.remove(), 300);
    }, 3200);
  }
};

// Initialize App once DOM is loaded
document.addEventListener("DOMContentLoaded", () => {
  App.init();
});
