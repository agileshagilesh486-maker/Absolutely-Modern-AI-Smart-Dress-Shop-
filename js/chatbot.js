/**
 * AI Smart Dress Shop - Fashion Assistant Chatbot
 * Interactive conversational fashion advisor with rich in-chat product recommendations
 */

const Chatbot = {
  isOpen: false,
  messages: [],
  container: null,
  messagesList: null,
  inputField: null,

  init() {
    this.container = document.getElementById("chatbot-widget");
    this.messagesList = document.getElementById("chat-messages");
    this.inputField = document.getElementById("chat-input");

    // Add initial welcoming message
    this.appendBotMessage(
      "Hello! I'm your **AI Fashion Stylist** 👗✨. Tell me what occasion, color, or style you need, and I'll tailor the ideal ensemble for you!",
      [
        "What should I wear to a wedding?",
        "Black and modern outfits",
        "College casual wear",
        "Size guide help"
      ]
    );

    // Event listener for Enter key
    if (this.inputField) {
      this.inputField.addEventListener("keydown", (e) => {
        if (e.key === "Enter") {
          this.handleSendMessage();
        }
      });
    }
  },

  toggle() {
    this.isOpen = !this.isOpen;
    if (this.container) {
      if (this.isOpen) {
        this.container.classList.add("active");
        if (this.inputField) this.inputField.focus();
      } else {
        this.container.classList.remove("active");
      }
    }
  },

  handleSendMessage(userText = null) {
    const text = userText || (this.inputField ? this.inputField.value.trim() : "");
    if (!text) return;

    // Clear input
    if (this.inputField && !userText) {
      this.inputField.value = "";
    }

    // Append user message
    this.appendUserMessage(text);

    // Simulate AI thinking and reply
    setTimeout(() => {
      this.processAIResponse(text);
    }, 600);
  },

  appendUserMessage(text) {
    if (!this.messagesList) return;
    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-msg user";
    msgDiv.textContent = text;
    this.messagesList.appendChild(msgDiv);
    this.scrollToBottom();
  },

  appendBotMessage(markdownText, quickReplies = [], products = []) {
    if (!this.messagesList) return;
    const msgDiv = document.createElement("div");
    msgDiv.className = "chat-msg bot";

    // Simple markdown parsing for bold & emojis
    let html = markdownText
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\n/g, '<br/>');

    msgDiv.innerHTML = html;

    // Append products if any
    if (products && products.length > 0) {
      const prodsWrapper = document.createElement("div");
      prodsWrapper.style.marginTop = "8px";
      prodsWrapper.style.display = "flex";
      prodsWrapper.style.flexDirection = "column";
      prodsWrapper.style.gap = "6px";

      products.slice(0, 2).forEach(p => {
        const item = document.createElement("div");
        item.className = "chat-product-preview";
        item.innerHTML = `
          <img src="${p.image}" alt="${p.name}" />
          <div style="flex:1; min-width:0;">
            <div style="font-size:0.82rem; font-weight:700; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${p.name}</div>
            <div style="font-size:0.8rem; color:var(--accent-green); font-weight:700;">₹${p.price.toLocaleString()} <span style="font-size:0.7rem; color:var(--text-muted); text-decoration:line-through;">₹${p.originalPrice.toLocaleString()}</span></div>
          </div>
          <button class="btn btn-sm btn-primary add-chat-cart" data-id="${p.id}" style="padding:4px 10px; font-size:0.72rem;">Add</button>
        `;

        item.querySelector(".add-chat-cart").addEventListener("click", (e) => {
          e.stopPropagation();
          Store.addToCart(p);
          App.showToast(`Added ${p.name} to cart!`, "success");
        });

        item.addEventListener("click", () => {
          App.openProductModal(p.id);
        });

        prodsWrapper.appendChild(item);
      });
      msgDiv.appendChild(prodsWrapper);
    }

    // Append quick replies if any
    if (quickReplies && quickReplies.length > 0) {
      const chipsWrapper = document.createElement("div");
      chipsWrapper.style.display = "flex";
      chipsWrapper.style.flexWrap = "wrap";
      chipsWrapper.style.gap = "4px";
      chipsWrapper.style.marginTop = "8px";

      quickReplies.forEach(qr => {
        const chip = document.createElement("span");
        chip.className = "product-pill";
        chip.style.cursor = "pointer";
        chip.style.borderColor = "var(--border-accent)";
        chip.style.color = "var(--accent-purple)";
        chip.textContent = qr;
        chip.addEventListener("click", () => {
          this.handleSendMessage(qr);
        });
        chipsWrapper.appendChild(chip);
      });
      msgDiv.appendChild(chipsWrapper);
    }

    this.messagesList.appendChild(msgDiv);
    this.scrollToBottom();
  },

  processAIResponse(rawQuery) {
    const query = rawQuery.toLowerCase();

    // 1. Example 1 from requirements: "What should I wear to a wedding?"
    if (query.includes("wedding") && !query.includes("black")) {
      this.appendBotMessage(
        "For a wedding, I recommend a modern formal outfit. Would you prefer **traditional** or **western/modern** style?",
        ["Black and modern.", "Traditional Silk", "Festive Red Saree"]
      );
      return;
    }

    // 2. Example 2 from requirements: "Black and modern"
    if ((query.includes("black") && query.includes("modern")) || query.includes("black modern")) {
      const matching = FASHION_PRODUCTS.filter(p =>
        p.color.toLowerCase() === "black" && (p.style.toLowerCase() === "modern" || p.tags.includes("modern"))
      );
      this.appendBotMessage(
        "Here are some **black modern outfits** that match your preference perfectly with 95%+ AI match scores:",
        ["Try AI Stylist Ensemble", "Under ₹3000 options"],
        matching
      );
      return;
    }

    // 3. College / Casual
    if (query.includes("college") || query.includes("casual") || query.includes("streetwear")) {
      const casuals = FASHION_PRODUCTS.filter(p =>
        p.occasion.toLowerCase() === "college" || p.style.toLowerCase() === "streetwear" || p.occasion.toLowerCase() === "casual"
      );
      this.appendBotMessage(
        "For campus and relaxed wear, high-comfort streetwear and relaxed silhouettes are trending now:",
        ["Show men's hoodie", "Show cargo joggers"],
        casuals
      );
      return;
    }

    // 4. Size guide
    if (query.includes("size") || query.includes("fit") || query.includes("measure")) {
      this.appendBotMessage(
        "You can find your tailored fit in seconds with our **AI Size Advisor**! Enter your height and weight, and our neural model calculates your ideal size with 90%+ confidence.",
        ["Open AI Size Advisor", "Regular vs Slim Fit"]
      );
      return;
    }

    // 5. Generic / fallback NLP matching using AIEngine
    const parsed = AIEngine.parsePrompt(rawQuery);
    const recs = AIEngine.getRecommendations(FASHION_PRODUCTS, parsed, 2);

    this.appendBotMessage(
      `I analyzed your request for **${parsed.color}** ${parsed.style} fashion suitable for **${parsed.occasion}** within ₹${parsed.budget}. Here are top AI recommendations:`,
      ["Try another style", "Explore Shop Catalog"],
      recs
    );
  },

  scrollToBottom() {
    if (this.messagesList) {
      this.messagesList.scrollTop = this.messagesList.scrollHeight;
    }
  }
};
