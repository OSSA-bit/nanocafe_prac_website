// Order from Menu can stay anywhere
function loadPage(page) {
  const frame = document.getElementById('contentFrame');
  if (frame) {
    frame.src = page;
  }
}

// Cart to work all pages
const initCartSystem = () => {
  const cartState = {
    items: JSON.parse(localStorage.getItem('cartItems')) || [],
    deliveryFee: parseFloat(localStorage.getItem('deliveryFee')) || 0,
    location: localStorage.getItem('selectedLocation') || '0'
  };

  const elements = {
    cart: document.querySelector('.cart'),
    overlay: document.getElementById('cartOverlay'),
    backArrow: document.getElementById('close-cart'),
    cartList: document.querySelector(".cart-items"),
    cartTotal: document.querySelector(".cart-total"),
    deliveryFee: document.querySelector(".delivery-fee"),
    grandTotal: document.querySelector(".cart-grand-total"),
    location: document.getElementById("location"),
    orderBtn: document.querySelector(".submit-btn"),
    receipts: document.getElementById("receipts")
  };

  // Check if cart elements exist on this page
  if (!elements.cart || !elements.overlay) return;

  // Initialize cart state
  if (elements.location) {
    elements.location.value = cartState.location;
  }

  // Cart overlay toggle
  const setupCartToggle = () => {
    elements.cart.addEventListener('click', (e) => {
      e.stopPropagation();
      elements.cart.classList.toggle('active');
      elements.overlay.classList.toggle('active');
    });

    if (elements.backArrow) {
      elements.backArrow.addEventListener('click', () => {
        elements.overlay.classList.remove('active');
        elements.cart.classList.remove('active');
      });
    }

    // Close cart when clicking outside
    document.addEventListener('click', (e) => {
      if (!elements.overlay.contains(e.target) && !elements.cart.contains(e.target)) {
        elements.overlay.classList.remove('active');
        elements.cart.classList.remove('active');
      }
    });
  };

  // Works on Online and Local host
  const setupMessageListener = () => {
    const allowedOrigins = [
      window.location.origin,
      "http://127.0.0.1:5500", 
      "http://localhost:5500"
    ];

    window.addEventListener("message", (event) => {
      if (!allowedOrigins.includes(event.origin) || !event.data?.type) return;

      if (event.data.type === "add-to-cart") {
        const { name, price } = event.data.item;
        const priceValue = parseFloat(price.replace(/[^\d.]/g, ""));
        const existingItem = cartState.items.find(i => i.name === name);

        if (existingItem) {
          existingItem.qty++;
        } else {
          cartState.items.push({ name, priceValue, qty: 1 });
        }

        saveAndRenderCart();
      }
    });
  };

  // Delivery location 
  const setupLocationHandler = () => {
    if (elements.location) {
      elements.location.addEventListener("change", (e) => {
        cartState.deliveryFee = parseFloat(e.target.value) || 0;
        cartState.location = e.target.value;
        localStorage.setItem('deliveryFee', cartState.deliveryFee);
        localStorage.setItem('selectedLocation', cartState.location);
        renderCart();
      });
    }
  };

  // cart system
  const renderCart = () => {
    if (!elements.cartList) return;

    elements.cartList.innerHTML = "";

    cartState.items.forEach((item) => {
      const li = document.createElement("li");
      li.classList.add("cart-item");
      li.innerHTML = `
        <span>${item.name}</span>
        <div class="qty-section">
          <button class="qty-btn" data-action="minus" data-name="${item.name}">-</button>
          <span class="qty">${item.qty}</span>
          <button class="qty-btn" data-action="plus" data-name="${item.name}">+</button>
          <span class="price">₱${(item.priceValue * item.qty).toFixed(2)}</span>
        </div>`;
      elements.cartList.appendChild(li);
    });

    const total = cartState.items.reduce((sum, item) => sum + item.priceValue * item.qty, 0);
    if (elements.cartTotal) {
      elements.cartTotal.innerHTML = `<hr><p>Total: ₱${total.toFixed(2)}</p>`;
    }
    if (elements.deliveryFee) {
      elements.deliveryFee.textContent = `Delivery Fee: ₱${cartState.deliveryFee.toFixed(2)}`;
    }
    if (elements.grandTotal) {
      elements.grandTotal.textContent = `GRAND TOTAL: ₱${(total + cartState.deliveryFee).toFixed(2)}`;
    }
  };

  // Quantity adjuster
  const setupQuantityHandlers = () => {
    if (elements.cartList) {
      elements.cartList.addEventListener('click', (e) => {
        if (!e.target.classList.contains('qty-btn')) return;
        
        const name = e.target.dataset.name;
        const item = cartState.items.find(i => i.name === name);
        if (!item) return;

        if (e.target.dataset.action === 'plus') {
          item.qty++;
        } else if (e.target.dataset.action === 'minus' && item.qty > 1) {
          item.qty--;
        }

        saveAndRenderCart();
      });
    }
  };

  // Save and render cart
  const saveAndRenderCart = () => {
    localStorage.setItem('cartItems', JSON.stringify(cartState.items));
    renderCart();
  };

  // Order + receipt
  const setupOrderHandler = () => {
    if (!elements.orderBtn) return;

    elements.orderBtn.addEventListener("click", () => {
      if (cartState.items.length === 0) {
        alert("Your cart is empty!");
        return;
      }
      if (elements.location.value === "0") {
        alert("Please select a delivery location!");
        return;
      }

      const timestamp = new Date().toLocaleString();
      const locationText = elements.location.options[elements.location.selectedIndex].text;
      const total = cartState.items.reduce((sum, item) => sum + item.priceValue * item.qty, 0);
      const grandTotal = total + cartState.deliveryFee;

      // Receipt
      const receipt = document.createElement("div");
      receipt.classList.add("receipt-entry");
      receipt.innerHTML = `
        <div class="receipt-head">
          <strong>${timestamp}</strong>
          <button class="toggle-details">Show Details</button>
        </div>
        <div class="receipt-details" style="display:none;">
          <ul>
            ${cartState.items.map(i => `<li>${i.name} x${i.qty} — ₱${(i.priceValue * i.qty).toFixed(2)}</li>`).join("")}
          </ul>
          <p><strong>Location:</strong> ${locationText}</p>
          <p><strong>Delivery Fee:</strong> ₱${cartState.deliveryFee.toFixed(2)}</p>
          <p><strong>Grand Total:</strong> ₱${grandTotal.toFixed(2)}</p>
        </div>
      `;

      if (elements.receipts) {
        elements.receipts.prepend(receipt);
      }

      // Toggle receipt details
      const toggleBtn = receipt.querySelector(".toggle-details");
      const details = receipt.querySelector(".receipt-details");
      toggleBtn.addEventListener("click", () => {
        const hidden = details.style.display === "none";
        details.style.display = hidden ? "block" : "none";
        toggleBtn.textContent = hidden ? "Hide Details" : "Show Details";
      });

      // After order, make lsit empty
      cartState.items = [];
      cartState.deliveryFee = 0;
      cartState.location = '0';
      
      if (elements.location) {
        elements.location.value = '0';
      }
      
      localStorage.removeItem('cartItems');
      localStorage.removeItem('deliveryFee');
      localStorage.removeItem('selectedLocation');
      
      saveAndRenderCart();

      // Close overlay
      elements.overlay.classList.remove('active');
      elements.cart.classList.remove('active');
    });
  };

  // Initialize all cart functionality
  setupCartToggle();
  setupMessageListener();
  setupLocationHandler();
  setupQuantityHandlers();
  setupOrderHandler();
  renderCart(); // Initial render
};

  // for mobile toggle
  document.addEventListener('DOMContentLoaded', function () {
    const menuToggle = document.querySelector('.menu-toggle');
    const headerCenter = document.querySelector('.header-center');
    const dropdown = document.querySelector('.dropdown');
    const dropBtn = document.querySelector('.drop-btn');

    // Mobile menu toggle
    if (menuToggle && headerCenter) {
      menuToggle.addEventListener('click', function (e) {
        e.stopPropagation();
        headerCenter.classList.toggle('active');
      });

      // Close menu when clicking outside
      document.addEventListener('click', function (e) {
        if (!headerCenter.contains(e.target) && !menuToggle.contains(e.target)) {
          headerCenter.classList.remove('active');
        }
      });

      if (dropBtn && dropdown) {
        dropBtn.addEventListener('click', function (e) {
          if (window.innerWidth <= 992) {
            e.preventDefault();
            dropdown.classList.toggle('active');
          }
        });
      }

      // Close dropdown when clicking a link
      const dropLinks = document.querySelectorAll('.drop-content a');
      dropLinks.forEach(link => {
        link.addEventListener('click', function () {
          headerCenter.classList.remove('active');
          if (window.innerWidth <= 992) {
            dropdown.classList.remove('active');
          }
        });
      });
    }

      // Initialize cart system on every page
  initCartSystem();
  });
