/**
 * AI Smart Dress Shop - State Management & LocalStorage Persistence
 * Manages Cart, Wishlist, Orders, Profile, Theme, and Event Subscriptions
 */

const Store = {
  KEYS: {
    CART: "ai_dress_shop_cart",
    WISHLIST: "ai_dress_shop_wishlist",
    ORDERS: "ai_dress_shop_orders",
    THEME: "ai_dress_shop_theme",
    PROFILE: "ai_dress_shop_profile",
    POLL: "ai_dress_shop_poll"
  },

  // State cache
  state: {
    cart: [],
    wishlist: [],
    orders: [],
    theme: "dark",
    profile: null,
    pollVotes: {
      style: 342,
      size: 512,
      color: 189,
      occasion: 428,
      choices: 295
    },
    adminStats: {
      totalProducts: 248,
      totalCustomers: 1240,
      totalOrders: 856,
      revenue: 485600
    }
  },

  init() {
    // Load Cart
    try {
      const savedCart = localStorage.getItem(this.KEYS.CART);
      this.state.cart = savedCart ? JSON.parse(savedCart) : [];
    } catch (e) {
      this.state.cart = [];
    }

    // Load Wishlist
    try {
      const savedWishlist = localStorage.getItem(this.KEYS.WISHLIST);
      this.state.wishlist = savedWishlist ? JSON.parse(savedWishlist) : ["PROD-101", "PROD-102"];
    } catch (e) {
      this.state.wishlist = ["PROD-101", "PROD-102"];
    }

    // Load Orders
    try {
      const savedOrders = localStorage.getItem(this.KEYS.ORDERS);
      if (savedOrders) {
        this.state.orders = JSON.parse(savedOrders);
      } else {
        // Seed default order #AI2026001 as specified in Section 16
        this.state.orders = [
          {
            orderId: "#AI2026001",
            createdAt: "2026-09-28 14:30",
            status: "Processing",
            statusCode: 3, // 1: Placed, 2: Payment Confirmed, 3: Processing, 4: Shipped, 5: Out for Delivery, 6: Delivered
            items: [
              { ...FASHION_PRODUCTS[0], quantity: 1, selectedSize: "M", selectedColor: "Black" },
              { ...FASHION_PRODUCTS[9], quantity: 1, selectedSize: "M", selectedColor: "Black" }
            ],
            totalAmount: 4298,
            shippingAddress: {
              fullName: "Aarav Sharma",
              address: "42 Indiranagar 100ft Road",
              city: "Bengaluru",
              state: "Karnataka",
              pincode: "560038"
            },
            paymentMethod: "UPI (Google Pay)"
          }
        ];
        this.saveOrders();
      }
    } catch (e) {
      this.state.orders = [];
    }

    // Load Profile
    try {
      const savedProfile = localStorage.getItem(this.KEYS.PROFILE);
      this.state.profile = savedProfile ? JSON.parse(savedProfile) : {
        name: "Aarav Sharma",
        email: "aarav.sharma@fashionai.in",
        phone: "+91 98450 12345",
        tier: "AI Elite Club Member",
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80",
        savedSize: "M",
        height: "178 cm",
        weight: "72 kg",
        chest: "40 in",
        waist: "32 in",
        preferences: {
          style: "Modern",
          color: "Black",
          occasion: "Wedding"
        }
      };
    } catch (e) {
      this.state.profile = null;
    }

    // Load Theme
    try {
      const savedTheme = localStorage.getItem(this.KEYS.THEME) || "dark";
      this.setTheme(savedTheme);
    } catch (e) {
      this.setTheme("dark");
    }

    // Load Poll
    try {
      const savedPoll = localStorage.getItem(this.KEYS.POLL);
      if (savedPoll) this.state.pollVotes = JSON.parse(savedPoll);
    } catch (e) {}

    this.notifyUpdates();
  },

  /* Cart Operations */
  addToCart(product, quantity = 1, size = null, color = null) {
    const chosenSize = size || (product.sizes ? product.sizes[0] : "M");
    const chosenColor = color || product.color;

    const existingIndex = this.state.cart.findIndex(
      item => item.product.id === product.id && item.selectedSize === chosenSize && item.selectedColor === chosenColor
    );

    if (existingIndex > -1) {
      this.state.cart[existingIndex].quantity += quantity;
    } else {
      this.state.cart.push({
        product: { ...product },
        quantity: quantity,
        selectedSize: chosenSize,
        selectedColor: chosenColor
      });
    }

    this.saveCart();
    this.dispatch("cart:updated");
  },

  updateCartQty(productId, size, delta) {
    const itemIndex = this.state.cart.findIndex(
      item => item.product.id === productId && item.selectedSize === size
    );

    if (itemIndex > -1) {
      this.state.cart[itemIndex].quantity += delta;
      if (this.state.cart[itemIndex].quantity <= 0) {
        this.state.cart.splice(itemIndex, 1);
      }
      this.saveCart();
      this.dispatch("cart:updated");
    }
  },

  removeFromCart(productId, size) {
    this.state.cart = this.state.cart.filter(
      item => !(item.product.id === productId && item.selectedSize === size)
    );
    this.saveCart();
    this.dispatch("cart:updated");
  },

  clearCart() {
    this.state.cart = [];
    this.saveCart();
    this.dispatch("cart:updated");
  },

  getCartTotals() {
    const subtotal = this.state.cart.reduce(
      (sum, item) => sum + (item.product.price * item.quantity), 0
    );
    const discount = subtotal > 3000 ? Math.round(subtotal * 0.1) : 0; // 10% AI welcome discount
    const delivery = subtotal > 1500 || subtotal === 0 ? 0 : 99;
    const grandTotal = subtotal - discount + delivery;

    return {
      subtotal,
      discount,
      delivery,
      grandTotal,
      totalCount: this.state.cart.reduce((sum, item) => sum + item.quantity, 0)
    };
  },

  saveCart() {
    localStorage.setItem(this.KEYS.CART, JSON.stringify(this.state.cart));
  },

  /* Wishlist Operations */
  toggleWishlist(productId) {
    const index = this.state.wishlist.indexOf(productId);
    let added = false;
    if (index > -1) {
      this.state.wishlist.splice(index, 1);
      added = false;
    } else {
      this.state.wishlist.push(productId);
      added = true;
    }
    this.saveWishlist();
    this.dispatch("wishlist:updated");
    return added;
  },

  isInWishlist(productId) {
    return this.state.wishlist.includes(productId);
  },

  saveWishlist() {
    localStorage.setItem(this.KEYS.WISHLIST, JSON.stringify(this.state.wishlist));
  },

  /* Orders Operations */
  createOrder(orderData) {
    const newOrderId = `#AI2026${String(this.state.orders.length + 1).padStart(3, '0')}`;
    const newOrder = {
      orderId: newOrderId,
      createdAt: new Date().toLocaleString(),
      status: "Processing",
      statusCode: 3,
      items: [...this.state.cart],
      totalAmount: orderData.totalAmount || this.getCartTotals().grandTotal,
      shippingAddress: orderData.shippingAddress,
      paymentMethod: orderData.paymentMethod
    };

    this.state.orders.unshift(newOrder);
    this.saveOrders();
    this.clearCart();

    // Increment admin stats
    this.state.adminStats.totalOrders += 1;
    this.state.adminStats.revenue += newOrder.totalAmount;

    this.dispatch("order:created", newOrder);
    return newOrder;
  },

  saveOrders() {
    localStorage.setItem(this.KEYS.ORDERS, JSON.stringify(this.state.orders));
  },

  /* Theme Switching */
  setTheme(themeName) {
    this.state.theme = themeName;
    document.documentElement.setAttribute("data-theme", themeName);
    localStorage.setItem(this.KEYS.THEME, themeName);
    this.dispatch("theme:changed", themeName);
  },

  toggleTheme() {
    const nextTheme = this.state.theme === "dark" ? "light" : "dark";
    this.setTheme(nextTheme);
    return nextTheme;
  },

  /* Feedback Poll (Section 21) */
  votePoll(optionKey) {
    if (this.state.pollVotes[optionKey] !== undefined) {
      this.state.pollVotes[optionKey] += 1;
      localStorage.setItem(this.KEYS.POLL, JSON.stringify(this.state.pollVotes));
      this.dispatch("poll:updated");
    }
  },

  /* Event Dispatching */
  dispatch(eventName, detail = null) {
    window.dispatchEvent(new CustomEvent(eventName, { detail }));
  },

  notifyUpdates() {
    this.dispatch("cart:updated");
    this.dispatch("wishlist:updated");
  }
};
