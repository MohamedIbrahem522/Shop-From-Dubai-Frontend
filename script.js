// ===== Social Links from localStorage =====
function getSocial() {
  try { return JSON.parse(localStorage.getItem("admin_social")) || {}; }
  catch { return {}; }
}
function updateSocialLinks() {
  const s = getSocial();
  if (s.whatsapp) {
    document.querySelectorAll('[href*="wa.me/"]').forEach(el => {
      el.href = el.href.replace(/wa\.me\/\d+/, `wa.me/${s.whatsapp}`);
    });
  }
  if (s.facebook) {
    document.querySelectorAll('.hero-social a, .footer-social a, .contact-item').forEach(el => {
      if (el.href.includes('facebook.com')) el.href = s.facebook;
    });
  }
  if (s.instagram) {
    document.querySelectorAll('.hero-social a, .footer-social a, .contact-item').forEach(el => {
      if (el.href.includes('instagram.com')) el.href = s.instagram;
    });
  }
  if (s.tiktok) {
    document.querySelectorAll('.hero-social a, .footer-social a, .contact-item').forEach(el => {
      if (el.href.includes('tiktok.com')) el.href = s.tiktok;
    });
  }
}

// ===== Splash Screen =====
window.addEventListener("load", () => {
  updateSocialLinks();
  setTimeout(() => {
    document.getElementById("splash").classList.add("hide");
    AOS.init({ duration: 600, once: true, offset: 40, easing: 'ease-out-cubic' });
  }, 1800);
});

// ===== Navbar =====
const navbar = document.getElementById("navbar");
window.addEventListener("scroll", () => {
  navbar.classList.toggle("scrolled", window.scrollY > 50);
});

// ===== Hamburger Menu =====
const navMenu = document.getElementById("navLinks");
document.getElementById("hamburger").addEventListener("click", () => {
  navMenu.classList.toggle("open");
});
document.querySelectorAll(".nav-links a").forEach(link => {
  link.addEventListener("click", e => {
    e.preventDefault();
    navMenu.classList.remove("open");
    const target = document.querySelector(link.getAttribute("href"));
    if (target) target.scrollIntoView({ behavior: "smooth" });
  });
});

// ===== State & Cache =====
let allProducts = [];
const container = document.getElementById("productsContainer");
const loader = document.getElementById("loaderContainer");
const CACHE_KEY = "sfd_cache_v3";
const CACHE_DURATION = 10 * 60 * 1000;

// تحسين صور Cloudinary (تصغير الحجم)
function optImg(url, w = 400) {
  if (!url || !url.includes("cloudinary")) return url;
  return url.replace("/upload/", `/upload/w_${w},q_auto,f_auto/`);
}

function getCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.ts > CACHE_DURATION) { localStorage.removeItem(CACHE_KEY); return null; }
    return data;
  } catch { return null; }
}

function setCache(data) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), ...data })); } catch (_) {}
}

// Modal elements
const modal = document.getElementById("productModal");
const modalImg = document.getElementById("modalImage");
const modalTitle = document.getElementById("modalTitle");
const modalDesc = document.getElementById("modalDescription");
const modalFeatures = document.getElementById("modalFeatures");
const modalPrice = document.getElementById("modalPrice");
const modalBadge = document.getElementById("modalBadge");
const modalWhatsapp = document.getElementById("modalWhatsapp");
const modalGallery = document.getElementById("modalGallery");
const modalClose = document.querySelector(".modal-close");

// ===== Load Data (Cache-First) =====
(async function loadData() {
  // 1. Show cached data فوراً
  const cache = getCache();
  if (cache) {
    allProducts = cache.products || [];
    renderProducts(allProducts);
    renderCategories(cache.categories);
    renderTestimonials(cache.reviews);
    loader.classList.remove("active");
  }

  // 2. Fetch fresh data في الخلفية
  try {
    const [pRes, cRes, rRes] = await Promise.all([
      fetch("https://shop-from-dubai-backend-production.up.railway.app/products"),
      fetch("https://shop-from-dubai-backend-production.up.railway.app/categories"),
      fetch("https://shop-from-dubai-backend-production.up.railway.app/reviews")
    ]);
    const pData = await pRes.json();
    const cData = await cRes.json();
    const rData = await rRes.json();

    const cats = (cData.categories || cData.data || cData || []);
    const reviews = (rData.reviews || rData.data || rData || []);

    allProducts = (pData.products || pData.data || pData || []).map(p => ({
      id: p._id, name: p.name, price: p.price,
      category: typeof p.category === "object" ? p.category?.name || p.category?._id || "" : (cats.find(c => c._id === p.category) || {}).name || p.category,
      image: (p.images && p.images[0]?.url) || (typeof p.image === "object" ? p.image?.url : p.image) || "",
      images: p.images || [], description: p.description || "",
      features: Array.isArray(p.features) ? p.features.join(", ") : (p.features || ""),
      discount: p.discount || 0, best: p.isBest || p.best,
      gallery: (p.images && p.images.slice(1).map(i => i.url || i)) || [],
      active: p.active !== false,
    })).filter(p => p.active);

    setCache({ products: allProducts, categories: cats, reviews });
    renderProducts(allProducts);
    renderCategories(cats);
    renderTestimonials(reviews);

  } catch (err) {
    if (!cache) {
      try {
        const res = await fetch("./products.json");
        allProducts = (await res.json()).map((p, i) => ({ ...p, id: p._id || p.id || i }));
      } catch {}
    }
  }
  loader.classList.remove("active");
})();

function renderCategories(cats) {
  const catContainer = document.querySelector(".categories");
  if (!catContainer || !cats.length) return;
  catContainer.innerHTML = `<button class="active" data-category="الكل">الكل</button>
    ${cats.map(c => `<button data-category="${c.name}" data-catid="${c._id}">${c.name}</button>`).join("")}`;
  catContainer.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      catContainer.querySelectorAll("button").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      if (btn.dataset.category === "الكل") return renderProducts(allProducts);
      renderProducts(allProducts.filter(p => p.category?.trim() === btn.dataset.category.trim()));
    });
  });
}

function renderTestimonials(reviews) {
  const grid = document.getElementById("testimonialsGrid");
  if (!grid || !reviews.length) return;
  grid.innerHTML = reviews.map(r => `
    <div class="testimonial-card">
      <div class="testimonial-img-wrap">
        <img src="${optImg(r.image?.url || r.image || r)}" alt="تقييم عميل">
      </div>
    </div>`).join("");
  grid.querySelectorAll(".testimonial-card img").forEach(img => {
    img.addEventListener("click", () => {
      lightboxImg.src = img.src;
      lightbox.classList.add("show");
      document.body.style.overflow = "hidden";
    });
  });
}

// ===== Auto-refresh خفيف (لما المستخدم يرجع للتاب) =====
let isFetching = false;
document.addEventListener("visibilitychange", () => {
  if (document.hidden || isFetching) return;
  isFetching = true;
  Promise.all([
    fetch("https://shop-from-dubai-backend-production.up.railway.app/products"),
    fetch("https://shop-from-dubai-backend-production.up.railway.app/reviews")
  ]).then(async ([pRes, rRes]) => {
    const d = await pRes.json();
    const fresh = (d.products || d.data || d || []).map(p => ({
      id: p._id, name: p.name, price: p.price,
      category: allProducts.find(a => a.id === p._id)?.category || "",
      image: (p.images && p.images[0]?.url) || (typeof p.image === "object" ? p.image?.url : p.image) || "",
      images: p.images || [], description: p.description || "",
      features: Array.isArray(p.features) ? p.features.join(", ") : (p.features || ""),
      discount: p.discount || 0, best: p.isBest || p.best,
      gallery: (p.images && p.images.slice(1).map(i => i.url || i)) || []
    }));
    if (fresh.length) { allProducts = fresh; renderProducts(allProducts); }

    const reviews = (await rRes.json()).reviews || [];
    const grid = document.getElementById("testimonialsGrid");
    if (grid && reviews.length) {
      grid.innerHTML = reviews.map(r => `
        <div class="testimonial-card">
          <div class="testimonial-img-wrap">
            <img src="${optImg(r.image?.url || r.image || r)}" alt="تقييم عميل">
          </div>
        </div>`).join("");
    }
  }).finally(() => { isFetching = false; });
});

// ===== Render Products =====
function renderProducts(products) {
  container.innerHTML = products.map(p => `
    <div class="product-card" data-aos="fade-up">
      ${p.best ? '<span class="product-card-badge">الأفضل</span>' : ''}
      <div class="product-card-img-wrap">
        <img src="${optImg(p.image)}" alt="${p.name}" class="product-card-img" loading="lazy"
          onerror="this.src='https://via.placeholder.com/300x300/f5f0e8/b8935a?text=Shop+from+Dubai'">
        <div class="product-card-shimmer"></div>
      </div>
      <div class="product-card-body">
        <h3>${p.name}</h3>
        <div class="product-card-category">${p.category}</div>
        <div class="product-card-price">${p.price.toLocaleString('ar-EG')} <span class="currency">ج.م</span></div>
        <button class="product-card-btn" data-id="${p.id}">
          اشتري <i class="fas fa-arrow-left"></i>
        </button>
      </div>
    </div>
  `).join("");

  container.querySelectorAll(".product-card-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const id = btn.dataset.id;
      const product = allProducts.find(p => p.id === id);
      if (product) openModal(product);
    });
  });
}

// ===== Open Modal =====
function openModal(product) {
  modalImg.src = optImg(product.image, 600);
  modalImg.onerror = () => { modalImg.src = 'https://via.placeholder.com/400x400/f5f0e8/b8935a?text=Shop+from+Dubai'; };
  modalTitle.textContent = product.name;
  modalBadge.textContent = product.category;
  modalDesc.textContent = product.description || "منتج أصلي مستورد من دبي.";
  modalFeatures.innerHTML = `<i class="fas fa-check-circle"></i> ${product.features || "لا توجد مميزات إضافية"}`;
  modalPrice.textContent = product.price.toLocaleString('ar-EG');

  const wa = getSocial().whatsapp || "201143749737";
  modalWhatsapp.href = `https://wa.me/${wa}?text=${encodeURIComponent(
    `أريد شراء ${product.name} بسعر ${product.price.toLocaleString('ar-EG')} جنيه مصري`
  )}`;

  renderGallery(product);
  modal.classList.add("show");
  document.body.style.overflow = "hidden";
}

// ===== Gallery =====
function renderGallery(product) {
  modalGallery.innerHTML = "";
  const images = [product.image, ...(product.gallery || [])].map(s => (typeof s === "object" ? s?.url : s)).filter(Boolean);
  if (!images.length) return;

  const label = document.createElement("span");
  label.className = "modal-gallery-label";
  label.textContent = "صور المنتج";

  const inner = document.createElement("div");
  inner.className = "modal-gallery-inner";

  images.forEach((src, i) => {
    const thumb = document.createElement("img");
    thumb.src = optImg(src, 100);
    thumb.onerror = () => { thumb.style.display = "none"; };
    if (i === 0) thumb.className = "active";
    thumb.onclick = () => {
      modalImg.src = optImg(src, 600);
      inner.querySelectorAll("img").forEach(im => im.classList.remove("active"));
      thumb.classList.add("active");
    };
    inner.appendChild(thumb);
  });

  modalGallery.appendChild(label);
  modalGallery.appendChild(inner);
}

// ===== Close Modal =====
function closeModal() {
  modal.classList.remove("show");
  document.body.style.overflow = "";
}
modalClose.onclick = closeModal;
window.onclick = e => { if (e.target === modal) closeModal(); };
document.addEventListener("keydown", e => { if (e.key === "Escape") closeModal(); });

// ===== Hero Button =====
document.querySelector(".hero-btns .btn-primary")?.addEventListener("click", e => {
  e.preventDefault();
  const target = document.querySelector("#products");
  if (target) target.scrollIntoView({ behavior: "smooth" });
});

// ===== Back to Top =====
const backTop = document.getElementById("backTop");
window.addEventListener("scroll", () => {
  backTop.classList.toggle("show", window.scrollY > 500);
});
backTop.addEventListener("click", () => {
  window.scrollTo({ top: 0, behavior: "smooth" });
});

// ===== Contact Form =====
document.getElementById("contactForm").addEventListener("submit", function(e) {
  e.preventDefault();
  const name = document.getElementById("contactName").value;
  const phone = document.getElementById("contactPhone").value;
  const message = document.getElementById("contactMessage").value;
  const wa = getSocial().whatsapp || "201143749737";
  const text = encodeURIComponent(`الاسم: ${name}\nرقم الهاتف: ${phone}\nالرسالة: ${message}`);
  window.open(`https://wa.me/${wa}?text=${text}`, "_blank");
});

// ===== Testimonial Lightbox =====
const lightbox = document.getElementById("testimonialLightbox");
const lightboxImg = document.getElementById("testimonialLightboxImg");
lightbox.addEventListener("click", () => {
  lightbox.classList.remove("show");
  document.body.style.overflow = "";
});
document.querySelector(".testimonial-lightbox-close").addEventListener("click", () => {
  lightbox.classList.remove("show");
  document.body.style.overflow = "";
});