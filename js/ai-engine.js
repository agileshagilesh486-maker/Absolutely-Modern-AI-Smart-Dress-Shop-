/**
 * AI Smart Dress Shop - AI Recommendation & Styling Engine
 * Implements weighted matching math, NLP prompt parsing, color theory & size prediction
 */

const AIEngine = {
  /**
   * Weights defined by Section 6 of requirements:
   * Color: 25%, Style: 25%, Occasion: 25%, Size: 15%, Budget: 10%
   */
  WEIGHTS: {
    color: 0.25,
    style: 0.25,
    occasion: 0.25,
    size: 0.15,
    budget: 0.10
  },

  /**
   * Calculate exact matching score between user preferences and a product
   * Returns overall percentage and individual sub-scores
   */
  calculateMatchScore(product, criteria) {
    const { occasion, style, color, size, budget } = criteria;

    // 1. Occasion Match (0 to 100)
    let occasionScore = 60; // baseline compatibility
    if (product.occasion.toLowerCase() === occasion.toLowerCase()) {
      occasionScore = 98;
    } else if (
      (occasion === "Party" && product.occasion === "Wedding") ||
      (occasion === "Wedding" && product.occasion === "Party") ||
      (occasion === "Office" && product.style === "Formal") ||
      (occasion === "Casual" && product.style === "Streetwear")
    ) {
      occasionScore = 84;
    } else if (product.tags.includes(occasion.toLowerCase())) {
      occasionScore = 88;
    }

    // 2. Color Match (0 to 100)
    let colorScore = 55;
    if (color === "Any Color" || color === "any") {
      colorScore = 95;
    } else if (product.color.toLowerCase() === color.toLowerCase()) {
      colorScore = 98;
    } else if (product.tags.includes(color.toLowerCase())) {
      colorScore = 92;
    } else {
      // Complementary color matrix
      const complementary = {
        "Black": ["White", "Red", "Blue"],
        "White": ["Black", "Blue", "Pink", "Green"],
        "Blue": ["White", "Black", "Pink"],
        "Red": ["Black", "White"],
        "Green": ["White", "Black"],
        "Pink": ["White", "Blue"]
      };
      if (complementary[color] && complementary[color].includes(product.color)) {
        colorScore = 75;
      }
    }

    // 3. Style Match (0 to 100)
    let styleScore = 60;
    if (product.style.toLowerCase() === style.toLowerCase()) {
      styleScore = 96;
    } else if (
      (style === "Modern" && product.style === "Minimal") ||
      (style === "Minimal" && product.style === "Modern") ||
      (style === "Casual" && product.style === "Streetwear") ||
      (style === "Formal" && product.style === "Modern")
    ) {
      styleScore = 85;
    } else if (product.tags.includes(style.toLowerCase())) {
      styleScore = 90;
    }

    // 4. Size Match (0 to 100)
    let sizeScore = 50;
    if (!size || size === "Any" || product.sizes.includes(size)) {
      sizeScore = 95;
    } else {
      // Check adjacent sizes
      const sizeOrder = ["XS", "S", "M", "L", "XL", "XXL"];
      const targetIdx = sizeOrder.indexOf(size);
      const hasAdjacent = product.sizes.some(s => {
        const idx = sizeOrder.indexOf(s);
        return Math.abs(idx - targetIdx) === 1;
      });
      sizeScore = hasAdjacent ? 75 : 40;
    }

    // 5. Budget Match (0 to 100)
    let budgetScore = 70;
    const maxBudget = Number(budget) || 10000;
    if (product.price <= maxBudget) {
      // Award higher score if comfortably within budget
      const ratio = product.price / maxBudget;
      budgetScore = Math.round(92 + (1 - ratio) * 6); // 92% to 98%
    } else {
      const overPercentage = (product.price - maxBudget) / maxBudget;
      budgetScore = Math.max(30, Math.round(90 - overPercentage * 100));
    }

    // Calculate Final Weighted Score
    const totalWeightedScore = Math.round(
      (this.WEIGHTS.color * colorScore) +
      (this.WEIGHTS.style * styleScore) +
      (this.WEIGHTS.occasion * occasionScore) +
      (this.WEIGHTS.size * sizeScore) +
      (this.WEIGHTS.budget * budgetScore)
    );

    return {
      totalScore: Math.min(99, Math.max(45, totalWeightedScore)),
      breakdown: {
        occasionMatch: occasionScore,
        colorMatch: colorScore,
        styleMatch: styleScore,
        sizeMatch: sizeScore,
        budgetMatch: budgetScore
      }
    };
  },

  /**
   * Recommend ranked list of products based on user criteria
   */
  getRecommendations(products, criteria, limit = 6) {
    const scoredProducts = products.map(product => {
      const match = this.calculateMatchScore(product, criteria);
      return {
        ...product,
        matchScore: match.totalScore,
        scoreBreakdown: match.breakdown,
        aiReason: this.generateReason(product, criteria, match)
      };
    });

    // Sort descending by match score
    scoredProducts.sort((a, b) => b.matchScore - a.matchScore);
    return scoredProducts.slice(0, limit);
  },

  /**
   * Generate an ensemble package (outfit) for the AI Stylist feature
   */
  generateOutfitEnsemble(criteria) {
    const { occasion, style, color, budget } = criteria;
    const scored = this.getRecommendations(FASHION_PRODUCTS, criteria, 10);
    const primaryPiece = scored[0] || FASHION_PRODUCTS[0];

    // Find complementary pieces for ensemble
    const accessories = FASHION_PRODUCTS.filter(p =>
      p.tags.includes("shoes") || p.tags.includes("watch") || p.tags.includes("trousers")
    );

    const ensembleItems = [
      {
        type: "Primary Garment",
        name: primaryPiece.name,
        price: primaryPiece.price,
        image: primaryPiece.image,
        icon: "✨"
      },
      {
        type: "Coordinating Bottom",
        name: `Tailored ${color === "Any Color" ? "Dark" : color} ${style} Trousers`,
        price: 1799,
        image: "https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=300&q=80",
        icon: "👖"
      },
      {
        type: "Curated Footwear",
        name: `Handcrafted ${style} Derby Shoes`,
        price: 2199,
        image: "https://images.unsplash.com/photo-1533867617858-e7b97e060509?auto=format&fit=crop&w=300&q=80",
        icon: "👞"
      },
      {
        type: "Accent Accessory",
        name: "Minimalist Sapphire Timepiece",
        price: 1899,
        image: "https://images.unsplash.com/photo-1524805444758-089113d48a6d?auto=format&fit=crop&w=300&q=80",
        icon: "⌚"
      }
    ];

    const ensembleTitle = `${color === "Any Color" ? "Signature" : color} ${style} ${occasion} Outfit`;

    return {
      title: ensembleTitle,
      overallScore: primaryPiece.matchScore || 92,
      breakdown: primaryPiece.scoreBreakdown || {
        occasionMatch: 95,
        colorMatch: 94,
        styleMatch: 91,
        sizeMatch: 90,
        budgetMatch: 89
      },
      items: ensembleItems,
      totalOutfitPrice: ensembleItems.reduce((acc, curr) => acc + curr.price, 0),
      topRecommendations: scored
    };
  },

  /**
   * Explains "Why AI Recommended This?" (Section 8)
   */
  generateReason(product, criteria, match) {
    const colorMention = criteria.color && criteria.color !== "Any Color" ? `selected ${criteria.color.toLowerCase()} palette` : "versatile colorway";
    const styleMention = `${criteria.style.toLowerCase()} aesthetic`;
    const occasionMention = `${criteria.occasion.toLowerCase()} occasion`;
    const budgetStatus = product.price <= criteria.budget ? "well within your target budget" : "premium styling choice";

    return `This product matches your ${colorMention}, ${styleMention}, ${occasionMention}, and is ${budgetStatus} (${match.totalScore}% overall compatibility).`;
  },

  /**
   * Natural Language Query Parser (Section 7, 22)
   * Extracts entities: occasion, color, style, budget, category from free text
   */
  parsePrompt(text) {
    const lower = text.toLowerCase();
    const result = {
      occasion: "Casual",
      color: "Any Color",
      style: "Modern",
      budget: 5000,
      extractedEntities: []
    };

    // Color extraction
    const colors = ["black", "white", "blue", "red", "green", "pink"];
    for (const c of colors) {
      if (lower.includes(c)) {
        result.color = c.charAt(0).toUpperCase() + c.slice(1);
        result.extractedEntities.push({ entity: "Color", value: result.color });
        break;
      }
    }

    // Occasion extraction
    const occasions = ["wedding", "party", "college", "office", "casual", "festival", "date"];
    for (const o of occasions) {
      if (lower.includes(o)) {
        result.occasion = o.charAt(0).toUpperCase() + o.slice(1);
        result.extractedEntities.push({ entity: "Occasion", value: result.occasion });
        break;
      }
    }

    // Style extraction
    const styles = ["modern", "casual", "formal", "traditional", "streetwear", "minimal"];
    for (const s of styles) {
      if (lower.includes(s)) {
        result.style = s.charAt(0).toUpperCase() + s.slice(1);
        result.extractedEntities.push({ entity: "Style", value: result.style });
        break;
      }
    }

    // Budget extraction (e.g. "under 3000", "₹3000", "3000")
    const budgetMatch = lower.match(/(?:under|below|budget|within|₹|\$|rs\.?)\s*(\d{3,6})/i) || lower.match(/(\d{3,5})/);
    if (budgetMatch && budgetMatch[1]) {
      const parsedBudget = parseInt(budgetMatch[1], 10);
      if (parsedBudget >= 500 && parsedBudget <= 50000) {
        result.budget = parsedBudget;
        result.extractedEntities.push({ entity: "Budget", value: `₹${result.budget}` });
      }
    }

    return result;
  },

  /**
   * AI Size Calculator (Section 10)
   * Calculates recommended size based on measurements & fit preference
   */
  calculateSize(heightCm, weightKg, chestInches, fitPreference = "Regular") {
    let size = "M";
    let confidence = 90;

    // Weight/Chest based heuristic
    if (chestInches <= 36 || (weightKg < 55 && heightCm < 165)) {
      size = "XS";
      confidence = 92;
    } else if (chestInches <= 38 || weightKg < 64) {
      size = "S";
      confidence = 91;
    } else if (chestInches <= 40 || weightKg < 74) {
      size = "M";
      confidence = 94;
    } else if (chestInches <= 43 || weightKg < 84) {
      size = "L";
      confidence = 90;
    } else if (chestInches <= 46 || weightKg < 94) {
      size = "XL";
      confidence = 89;
    } else {
      size = "XXL";
      confidence = 88;
    }

    // Adjust for fit preference
    let fitAdvice = "This size should provide a comfortable regular fit.";
    if (fitPreference === "Slim") {
      fitAdvice = "Tailored snug fit around shoulders and torso with tapered waistline.";
      confidence = Math.min(96, confidence + 2);
    } else if (fitPreference === "Relaxed") {
      fitAdvice = "Roomy silhouette with extra ease of movement across chest and back.";
      confidence = Math.min(95, confidence + 1);
    }

    return {
      recommendedSize: size,
      confidence: confidence,
      advice: fitAdvice
    };
  },

  /**
   * Image-based Similarity Simulator (Section 11)
   */
  simulateVisualSearch(imageName) {
    const lower = (imageName || "").toLowerCase();
    let queryColor = "black";
    let queryStyle = "modern";

    if (lower.includes("white")) queryColor = "white";
    if (lower.includes("blue")) queryColor = "blue";
    if (lower.includes("red")) queryColor = "red";
    if (lower.includes("green")) queryColor = "green";
    if (lower.includes("pink")) queryColor = "pink";

    if (lower.includes("casual") || lower.includes("hoodie")) queryStyle = "casual";
    if (lower.includes("formal") || lower.includes("blazer")) queryStyle = "formal";
    if (lower.includes("traditional") || lower.includes("saree")) queryStyle = "traditional";

    return FASHION_PRODUCTS.filter(p =>
      p.color.toLowerCase() === queryColor || p.style.toLowerCase() === queryStyle || p.tags.includes(queryColor)
    ).slice(0, 4);
  }
};
