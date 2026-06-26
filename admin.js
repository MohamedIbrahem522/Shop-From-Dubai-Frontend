let products = [];
let categories = [];
let testimonials = [];
const ADMIN_CACHE_KEY = "sfd_admin_cache";
const ADMIN_CACHE_DURATION = 10 * 60 * 1000;

function getAdminCache() {
  try {
    const raw = localStorage.getItem(ADMIN_CACHE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw);
    if (Date.now() - data.ts > ADMIN_CACHE_DURATION) {
      localStorage.removeItem(ADMIN_CACHE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function setAdminCache(data) {
  try {
    localStorage.setItem(
      ADMIN_CACHE_KEY,
      JSON.stringify({ ts: Date.now(), ...data }),
    );
  } catch (_) {}
}

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const user = document.getElementById("loginUser").value.trim();
  const pass = document.getElementById("loginPass").value.trim();
  try {
    await api.login(user, pass);
  } catch (e) {
    document.getElementById("loginError").textContent = "بيانات الدخول خطأ";
    return;
  }
  document.getElementById("loginOverlay").style.display = "none";
  document.getElementById("adminApp").style.display = "flex";
  initApp();
});

async function initApp() {
  await loadData();
  showPage("dashboard");
  setupNavigation();
}

async function loadData() {
  const cache = getAdminCache();
  if (cache) {
    products = (cache.products || []).map(normalizeProduct);
    categories = cache.categories || [];
    testimonials = cache.reviews || [];
    renderCurrentPage();
  }

  try {
    const [pData, cData, rData] = await Promise.all([
      api.getProducts(),
      api.getCategories(),
      api.getReviews(),
    ]);
    products = (pData.products || pData.data || pData || []).map(
      normalizeProduct,
    );
    categories = cData.categories || cData.data || cData || [];
    testimonials = rData.reviews || rData.data || rData || [];
    setAdminCache({ products, categories, reviews: testimonials });
    renderCurrentPage();
  } catch (err) {
    console.error("Failed to load data:", err);
  }
}

async function uploadToCloudinary(file) {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", "shop_preset");
  const res = await fetch(
    "https://api.cloudinary.com/v1_1/dw92smdvr/image/upload",
    { method: "POST", body: fd },
  );
  const data = await res.json();
  return data.secure_url;
}

function normalizeProduct(p) {
  if (typeof p.category === "object" && p.category) {
    p.category = p.category._id || p.category;
  }
  return p;
}

function renderCurrentPage() {
  const name =
    document.querySelector(".sidebar-link.active")?.dataset.page || "dashboard";
  pages[name]?.();
}

function getCatName(id) {
  if (!id) return "";
  const c = categories.find((x) => x._id === id);
  return c ? c.name : id;
}

function getCatId(name) {
  const c = categories.find((x) => x.name === name);
  return c ? c._id : name;
}

const pages = {
  dashboard,
  products: productsPage,
  categories: categoriesPage,
  testimonials: testimonialsPage,
  settings,
};

function showPage(name) {
  document
    .querySelectorAll(".sidebar-link")
    .forEach((l) => l.classList.remove("active"));
  document.querySelector(`[data-page="${name}"]`)?.classList.add("active");
  const titles = {
    dashboard: "الإحصائيات",
    products: "المنتجات",
    categories: "الأقسام",
    testimonials: "آراء العملاء",
    settings: "الإعدادات",
  };
  document.getElementById("pageTitle").textContent = titles[name] || name;
  document.getElementById("pageContent").innerHTML = "";
  pages[name]?.();
}

function setupNavigation() {
  const logoutBtn = document.getElementById("logoutBtn");
  if (window.innerWidth <= 768) {
    const nav = document.querySelector(".sidebar-nav");
    const viewSite = document.querySelector(".sidebar-view-site");
    if (viewSite) nav.appendChild(viewSite);
    const actions = document.querySelector(".sidebar-actions");
    if (actions) {
      const settLink = actions.querySelector(".sidebar-settings-link");
      if (settLink) {
        settLink.classList.remove("sidebar-link", "sidebar-settings-link");
        settLink.className = "mobile-settings-btn";
        settLink.innerHTML = '<i class="fas fa-cog"></i>';
        settLink.addEventListener("click", (e) => {
          e.preventDefault();
          showPage("settings");
        });
        document.body.appendChild(settLink);
      }
    }
    logoutBtn.classList.remove("sidebar-link");
    logoutBtn.innerHTML = '<i class="fas fa-sign-out-alt"></i>';
    document.body.appendChild(logoutBtn);
  }
  document.querySelectorAll(".sidebar-link").forEach((link) => {
    link.addEventListener("click", (e) => {
      e.preventDefault();
      showPage(link.dataset.page);
    });
  });
  logoutBtn.addEventListener("click", () => {
    api.logout();
    document.getElementById("adminApp").style.display = "none";
    document.getElementById("loginOverlay").style.display = "flex";
    document.getElementById("loginForm").reset();
  });
}

function dashboard() {
  const total = products.length;
  const cats = categories.length;
  const best = products.filter((p) => p.isBest || p.best).length;
  const avg = total
    ? Math.round(products.reduce((s, p) => s + (p.price || 0), 0) / total)
    : 0;
  const totalVal = products.reduce((s, p) => s + (p.price || 0), 0);

  document.getElementById("pageContent").innerHTML = `
    <div class="dash-welcome">
      <div class="dash-welcome-text">
        <h2>مرحباً بك في <span>لوحة التحكم</span></h2>
        <p>إدارة متجرك بالكامل من مكان واحد</p>
      </div>
      <div class="dash-welcome-badge"><i class="fas fa-store" style="margin-left:6px"></i>Shop From Dubai</div>
    </div>
    <div class="stats-grid">
      <div class="stat-card gold-border">
        <div class="stat-side"><div class="stat-icon"><i class="fas fa-box"></i></div></div>
        <div class="stat-body">
          <h3>${total}</h3>
          <p>إجمالي المنتجات</p>
        </div>
      </div>
      <div class="stat-card blue-border">
        <div class="stat-side"><div class="stat-icon"><i class="fas fa-tags"></i></div></div>
        <div class="stat-body">
          <h3>${cats}</h3>
          <p>الأقسام</p>
        </div>
      </div>
      <div class="stat-card green-border">
        <div class="stat-side"><div class="stat-icon"><i class="fas fa-crown"></i></div></div>
        <div class="stat-body">
          <h3>${best}</h3>
          <p>الأكثر مبيعاً</p>
        </div>
      </div>
    </div>
    <div class="dash-charts">
      <div class="chart-card">
        <h3><i class="fas fa-chart-bar"></i>توزيع المنتجات حسب القسم</h3>
        ${categories
          .map((c) => {
            const count = products.filter(
              (p) => p.category === c._id || p.category === c.name,
            ).length;
            const pct = total ? Math.round((count / total) * 100) : 0;
            return `<div class="chart-bar-wrap">
            <div class="chart-bar-label">
              <span>${c.name}</span>
              <span>${count} (${pct}%)</span>
            </div>
            <div class="chart-bar-track">
              <div class="chart-bar-fill" style="width:${pct}%"></div>
            </div>
          </div>`;
          })
          .join("")}
      </div>
      <div class="chart-card">
        <h3><i class="fas fa-chart-simple"></i>مؤشرات سريعة</h3>
        <div class="quick-grid">
          <div class="quick-item">
            <div class="quick-item-top">
              <div class="quick-icon gold"><i class="fas fa-star"></i></div>
              <span class="label">أعلى سعر</span>
            </div>
            <div class="value">${total ? Math.max(...products.map((p) => p.price || 0)).toLocaleString("ar-EG") + " ج.م" : "—"}</div>
          </div>
          <div class="quick-item">
            <div class="quick-item-top">
              <div class="quick-icon navy"><i class="fas fa-gem"></i></div>
              <span class="label">أقل سعر</span>
            </div>
            <div class="value">${total ? Math.min(...products.map((p) => p.price || 0)).toLocaleString("ar-EG") + " ج.م" : "—"}</div>
          </div>
          <div class="quick-item">
            <div class="quick-item-top">
              <div class="quick-icon gold"><i class="fas fa-coins"></i></div>
              <span class="label">متوسط السعر</span>
            </div>
            <div class="value">${avg.toLocaleString("ar-EG")} ج.م</div>
          </div>
          <div class="quick-item">
            <div class="quick-item-top">
              <div class="quick-icon navy"><i class="fas fa-cubes"></i></div>
              <span class="label">القيمة الإجمالية</span>
            </div>
            <div class="value">${totalVal.toLocaleString("ar-EG")} ج.م</div>
          </div>
          <div class="quick-item" style="grid-column:1/-1">
            <div class="quick-item-top">
              <div class="quick-icon green"><i class="fas fa-crown"></i></div>
              <span class="label">نسبة الأكثر مبيعاً</span>
            </div>
            <div class="value">${total ? Math.round((best / total) * 100) : 0}% من الإجمالي</div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function productsPage() {
  renderProductsTable(products);
}

function renderProductsTable(list) {
  const content = document.getElementById("pageContent");
  content.innerHTML = `
    <div class="table-toolbar">
      <div class="search-box">
        <input type="text" id="searchInput" placeholder="بحث عن منتج...">
        <i class="fas fa-search"></i>
      </div>
      <button class="btn-add" id="addProductBtn"><i class="fas fa-plus"></i> اضافة منتج</button>
    </div>
    <div class="table-card" id="productsTableWrap">
      <table>
        <thead>
          <tr>
            <th>الصورة</th>
            <th>الاسم</th>
            <th>السعر</th>
            <th>القسم</th>
            <th>الحالة</th>
            <th>مميز</th>
            <th>اجراءات</th>
          </tr>
        </thead>
        <tbody id="productsTbody">
          ${list
            .map((p) => {
              const catName = getCatName(p.category);
              const imgSrc =
                p.images && p.images.length > 0
                  ? p.images[0]?.url || p.images[0]
                  : typeof p.image === "object"
                    ? p.image?.url
                    : p.image || "";
              const isActive = p.active !== false;
              const isBest = p.isBest || p.best;
              return `
            <tr class="product-row" data-id="${p._id}">
              <td><img src="${imgSrc}" class="table-img" onerror="this.src='https://via.placeholder.com/40x40/f0ede8/ccc?text=X'"></td>
              <td style="font-weight:600">${p.name}</td>
              <td>${(p.price || 0).toLocaleString("ar-EG")} ج.م</td>
              <td>${catName}</td>
              <td><span class="badge-status ${isActive ? "on" : "off"}">${isActive ? "ظاهر" : "مخفي"}</span></td>
              <td><span class="badge-best ${isBest ? "" : "no"}">${isBest ? "نعم" : "لا"}</span></td>
              <td>
                <div class="table-actions">
                  <button class="btn-toggle" data-id="${p._id}" title="${isActive ? "إخفاء" : "إظهار"}"><i class="fas ${isActive ? "fa-eye" : "fa-eye-slash"}"></i></button>
                  <button class="btn-edit" data-id="${p._id}" title="تعديل"><i class="fas fa-pen"></i></button>
                  <button class="btn-delete" data-id="${p._id}" title="حذف"><i class="fas fa-trash"></i></button>
                </div>
              </td>
            </tr>`;
            })
            .join("")}
        </tbody>
      </table>
      <div id="productsEmpty" class="empty-state" style="display:${list.length === 0 ? "block" : "none"}"><i class="fas fa-box-open"></i><p>لا توجد منتجات</p></div>
    </div>
  `;

  document
    .getElementById("addProductBtn")
    .addEventListener("click", () => openProductModal());

  document.getElementById("searchInput").addEventListener("input", (e) => {
    const q = e.target.value.trim().toLowerCase();
    const rows = document.querySelectorAll("#productsTbody .product-row");
    let visible = 0;
    rows.forEach((row) => {
      const match = row.textContent.toLowerCase().includes(q);
      row.style.display = match ? "" : "none";
      if (match) visible++;
    });
    document.getElementById("productsEmpty").style.display =
      visible === 0 ? "block" : "none";
  });

  content.querySelectorAll(".btn-toggle").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const p = products.find((x) => x._id === btn.dataset.id);
      if (!p) return;
      try {
        const fd = new FormData();
        fd.append("active", p.active === false ? "true" : "false");
        await api.updateProduct(p._id, fd);
        await loadData();
        renderProductsTable(products);
      } catch (err) {
        alert("فشل التحديث: " + err.message);
      }
    });
  });
  content.querySelectorAll(".btn-edit").forEach((btn) => {
    btn.addEventListener("click", () => {
      const p = products.find((x) => x._id === btn.dataset.id);
      if (p) openProductModal(p);
    });
  });
  content.querySelectorAll(".btn-delete").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("هل انت متأكد من حذف هذا المنتج؟")) return;
      try {
        await api.deleteProduct(btn.dataset.id);
        await loadData();
        renderProductsTable(products);
      } catch (err) {
        alert("فشل الحذف: " + err.message);
      }
    });
  });
}

function openProductModal(product) {
  const edit = !!product;
  const overlay = document.createElement("div");
  overlay.className = "modal-overlay show";
  const catHtml = categories
    .map((c) => {
      const selected =
        edit && (product.category === c._id || product.category === c.name);
      return `<option value="${c._id}" ${selected ? "selected" : ""}>${c.name}</option>`;
    })
    .join("");
  const allImgs =
    edit && product.images && product.images.length > 0
      ? product.images.map((i) => i.url || i)
      : product && product.image
        ? [product.image]
        : [];
  overlay.innerHTML = `
    <div class="modal-box">
      <h2>${edit ? "تعديل المنتج" : "اضافة منتج جديد"}</h2>
      <div class="form-group">
        <label>اسم المنتج</label>
        <input type="text" id="modalName" value="${edit ? product.name : ""}">
      </div>
      <div class="form-group">
        <label>السعر (ج.م)</label>
        <input type="number" id="modalPrice" value="${edit ? product.price : ""}">
      </div>
      <div class="form-group">
        <label>القسم</label>
        <select id="modalCategory">${catHtml}</select>
      </div>
      <div class="form-group">
        <label>وصف المنتج</label>
        <textarea id="modalDesc">${edit ? product.description || "" : ""}</textarea>
      </div>
      <div class="form-group">
        <label>المميزات (مفصولة بفواصل)</label>
        <input type="text" id="modalFeatures" value="${edit ? (Array.isArray(product.features) ? product.features.join("، ") : product.features || "") : ""}">
      </div>
      <div class="form-group">
        <label>الخصم (%)</label>
        <input type="number" id="modalDiscount" value="${edit ? product.discount || 0 : 0}">
      </div>
      <div class="form-group">
        <label>صور المنتج</label>
        <input type="file" id="modalImageInput" accept="image/*" multiple>
        <div id="modalImagePreview" class="modal-preview-row" style="${allImgs.length ? "" : "display:none"}" dir="ltr">
          ${allImgs.map((src) => `<img src="${src}" class="modal-preview-img">`).join("")}
        </div>
      </div>
      <div class="form-group" style="display:flex;align-items:center;gap:8px">
        <input type="checkbox" id="modalBest" ${edit && (product.isBest || product.best) ? "checked" : ""} style="width:auto">
        <label for="modalBest" style="margin:0">منتج مميز (الافضل)</label>
      </div>
      <div class="modal-actions">
        <button class="btn-save" id="modalSave">حفظ</button>
        <button class="btn-cancel" id="modalCancel">الغاء</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  document
    .getElementById("modalCancel")
    .addEventListener("click", () => overlay.remove());
  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) overlay.remove();
  });

  let imageFiles = [];

  async function compressImage(file) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const max = 1200;
        let { width, height } = img;
        if (width > max || height > max) {
          if (width > height) {
            height = (height / width) * max;
            width = max;
          } else {
            width = (width / height) * max;
            height = max;
          }
        }
        const c = document.createElement("canvas");
        c.width = width;
        c.height = height;
        c.getContext("2d").drawImage(img, 0, 0, width, height);
        c.toBlob(
          (b) =>
            resolve(
              new File([b], file.name.replace(/\.\w+$/, ".webp"), {
                type: "image/webp",
              }),
            ),
          "image/webp",
          0.75,
        );
      };
      img.src = URL.createObjectURL(file);
    });
  }

  document
    .getElementById("modalImageInput")
    .addEventListener("change", async (e) => {
      const files = Array.from(e.target.files);
      imageFiles = await Promise.all(files.map(compressImage));
      const preview = document.getElementById("modalImagePreview");
      if (imageFiles.length > 0) {
        preview.style.display = "flex";
        preview.innerHTML = imageFiles
          .map(
            (f) =>
              `<img src="${URL.createObjectURL(f)}" class="modal-preview-img">`,
          )
          .join("");
      } else if (edit && product.images && product.images.length > 0) {
        preview.style.display = "flex";
      } else {
        preview.style.display = "none";
      }
    });

  document.getElementById("modalSave").addEventListener("click", async () => {
    const name = document.getElementById("modalName").value.trim();
    const price = parseFloat(document.getElementById("modalPrice").value);
    const cat = document.getElementById("modalCategory").value;
    const desc = document.getElementById("modalDesc").value.trim();
    const features = document.getElementById("modalFeatures").value.trim();
    const discount =
      parseFloat(document.getElementById("modalDiscount").value) || 0;
    const isBest = document.getElementById("modalBest").checked;

    if (!name || (price !== 0 && !price)) {
      alert("الاسم والسعر مطلوبان");
      return;
    }

    try {
      overlay.querySelector("h2").textContent = edit
        ? "جاري رفع الصور..."
        : "جاري رفع الصور...";
      let imageUrls = [];
      if (imageFiles.length > 0) {
        const results = await Promise.all(
          imageFiles.map(async (file) => {
            try {
              return await uploadToCloudinary(file);
            } catch (_) {
              return null;
            }
          }),
        );
        imageUrls = results.filter(Boolean);
      }

      const body = {
        name,
        price: Number(price),
        category: cat,
        description: desc,
        features: features || "[]",
        discount: Number(discount),
        isBest: isBest ? "true" : "false",
      };
      if (imageUrls.length > 0) body.imageUrls = imageUrls;

      if (edit) {
        await api.request("PUT", `/products/${product._id}`, body);
      } else {
        const created = await api.request("POST", "/products", body);
        if (!imageUrls.length) created.product; // no-op
      }
      overlay.remove();
      await loadData();
      renderProductsTable(products);
    } catch (err) {
      alert("فشل الحفظ: " + err.message);
    }
  });
}

function categoriesPage() {
  const content = document.getElementById("pageContent");
  content.innerHTML = `
    <div class="cat-page-header">
      <h2><i class="fas fa-tags" style="color:#b8935a;margin-left:8px"></i>الأقسام</h2>
      <span class="cat-page-count">${categories.length} قسم</span>
    </div>
    <div class="cat-add-card">
      <input type="text" id="newCatInput" placeholder="اسم القسم الجديد">
      <button class="btn-add" id="addCatBtn"><i class="fas fa-plus"></i> اضافة</button>
    </div>
    <div class="cat-grid" id="catGrid">
      ${
        categories.length > 0
          ? categories
              .map((c) => {
                return `
        <div class="cat-card">
          <button class="cat-card-del" data-id="${c._id}"><i class="fas fa-times"></i></button>
          <div class="cat-card-icon"><i class="fas fa-tag"></i></div>
          <div class="cat-card-name">${c.name}</div>
          <div class="cat-card-count">${products.filter((p) => p.category === c._id || p.category === c.name).length} منتج</div>
        </div>`;
              })
              .join("")
          : '<div class="cat-empty"><i class="fas fa-tags"></i><p>لا توجد أقسام بعد</p><span>أضف قسمك الأول</span></div>'
      }
    </div>
  `;

  document.getElementById("addCatBtn").addEventListener("click", async () => {
    const val = document.getElementById("newCatInput").value.trim();
    if (!val) return;
    try {
      await api.createCategory(val);
      document.getElementById("newCatInput").value = "";
      await loadData();
      categoriesPage();
    } catch (err) {
      alert("فشل الإضافة: " + err.message);
    }
  });
  document.getElementById("newCatInput").addEventListener("keydown", (e) => {
    if (e.key === "Enter") document.getElementById("addCatBtn").click();
  });
  document.querySelectorAll(".cat-card-del").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const id = btn.dataset.id;
      if (products.some((p) => p.category === id)) {
        alert("لا يمكن حذف قسم مستخدم في منتجات");
        return;
      }
      if (!confirm("حذف هذا القسم؟")) return;
      try {
        await api.deleteCategory(id);
        await loadData();
        categoriesPage();
      } catch (err) {
        alert("فشل الحذف: " + err.message);
      }
    });
  });
}

function testimonialsPage() {
  const content = document.getElementById("pageContent");
  content.innerHTML = `
    <div class="rev-header">
      <h3><i class="fas fa-star"></i>آراء العملاء</h3>
      <span>${testimonials.length} رأي</span>
    </div>
    <div class="cat-add-card">
      <label class="btn-add rev-upload-btn"><i class="fas fa-upload"></i> رفع صورة<input type="file" id="fileInput" accept="image/*" hidden></label>
    </div>
    <div class="rev-grid" id="revGrid">
      ${
        testimonials.length > 0
          ? testimonials
              .map((r, i) => {
                const src = r.image?.url || r.image || r;
                const id = r._id || i;
                return `
        <div class="rev-card">
          <button class="rev-del" data-id="${id}"><i class="fas fa-times"></i></button>
          <div class="rev-img-wrap">
            <img src="${src}" onerror="this.classList.add('rev-broken')">
          </div>
        </div>`;
              })
              .join("")
          : '<div class="cat-empty" style="grid-column:1/-1"><i class="fas fa-star"></i><p>لا توجد آراء بعد</p><span>أضف أول تقييم من الأعلى</span></div>'
      }
    </div>
  `;

  document.getElementById("fileInput").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fd = new FormData();
    fd.append("image", file);
    try {
      await api.createReview(fd);
      await loadData();
      testimonialsPage();
    } catch (err) {
      alert("فشل الرفع: " + err.message);
    }
    e.target.value = "";
  });
  document.querySelectorAll(".rev-del").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("هل انت متأكد من حذف هذا الرأي؟")) return;
      try {
        await api.deleteReview(btn.dataset.id);
        await loadData();
        testimonialsPage();
      } catch (err) {
        alert("فشل الحذف: " + err.message);
      }
    });
  });
  const lb = document.getElementById("adminLightbox");
  const lbImg = document.getElementById("adminLightboxImg");
  document.querySelectorAll(".rev-card .rev-img-wrap img").forEach((img) => {
    img.addEventListener("click", () => {
      lbImg.src = img.src;
      lb.classList.add("show");
    });
  });
  lb.addEventListener("click", () => lb.classList.remove("show"));
  document
    .querySelector(".admin-lightbox-close")
    .addEventListener("click", () => lb.classList.remove("show"));
}

function getDefaultSocial() {
  return {
    whatsapp: "201143749737",
    facebook: "https://www.facebook.com/share/1C2MzQPZ4N/",
    instagram: "https://www.instagram.com/dubai_inyourhand/",
    tiktok: "https://www.tiktok.com/@joudehab1",
  };
}
function loadSocial() {
  try {
    return (
      JSON.parse(localStorage.getItem("admin_social")) || getDefaultSocial()
    );
  } catch {
    return getDefaultSocial();
  }
}
function saveSocial(data) {
  localStorage.setItem("admin_social", JSON.stringify(data));
}

function settings() {
  const social = loadSocial();
  const total = products.length;
  const best = products.filter((p) => p.isBest || p.best).length;

  const content = document.getElementById("pageContent");
  content.innerHTML = `
    <div class="st-header">
      <div class="st-header-left">
        <div class="st-header-icon"><i class="fas fa-cog"></i></div>
        <div>
          <h2><span class="st-h-icon">⚙️</span> <span class="st-h-title">إعدادات المتجر</span></h2>
          <p><span class="st-h-dot"></span> قم بإدارة حسابك وروابط التواصل الخاصة بالمتجر</p>
        </div>
      </div>
    </div>

    <div class="st-grid">
      <div class="st-side">
        <div class="st-card st-store">
          <div class="st-store-top">
            <div class="st-store-avatar"><i class="fas fa-store"></i></div>
            <div>
              <div class="st-store-name">Shop from Dubai</div>
              <div class="st-store-badge"><span class="st-dot"></span> نشط</div>
            </div>
          </div>
          <div class="st-store-stats">
            <div class="st-stat-cell">
              <div class="st-stat-icon"><i class="fas fa-box"></i></div>
              <div class="st-stat-info"><strong>${total}</strong><span>المنتجات</span></div>
            </div>
            <div class="st-stat-cell">
              <div class="st-stat-icon"><i class="fas fa-tags"></i></div>
              <div class="st-stat-info"><strong>${categories.length}</strong><span>الأقسام</span></div>
            </div>
            <div class="st-stat-cell">
              <div class="st-stat-icon"><i class="fas fa-crown"></i></div>
              <div class="st-stat-info"><strong>${best}</strong><span>مميز</span></div>
            </div>
          </div>
        </div>
      </div>

      <div class="st-main">
        <div class="st-acc">
          <div class="st-acc-item">
            <div class="st-acc-header" onclick="toggleAcc(this)">
              <div class="st-acc-title">
                <i class="fas fa-lock" style="color:#b8935a"></i>
                <span>تغيير كلمة المرور</span>
              </div>
              <i class="fas fa-chevron-down st-acc-arrow"></i>
            </div>
            <div class="st-acc-body">
              <div class="st-field">
                <label>كلمة المرور الحالية</label>
                <div class="st-input-wrap">
                  <i class="fas fa-key"></i>
                  <input type="password" id="setOldPass" placeholder="ادخل كلمة المرور الحالية">
                  <button class="st-toggle-pass" tabindex="-1" onclick="togglePass(this)"><i class="far fa-eye"></i></button>
                </div>
              </div>
              <div class="st-field">
                <label>كلمة المرور الجديدة</label>
                <div class="st-input-wrap">
                  <i class="fas fa-lock"></i>
                  <input type="password" id="setNewPass" placeholder="6 أحرف على الأقل">
                  <button class="st-toggle-pass" tabindex="-1" onclick="togglePass(this)"><i class="far fa-eye"></i></button>
                </div>
                <div class="st-strength" id="stStrength"><div class="st-strength-bar" style="width:0%"></div></div>
              </div>
              <div class="st-field">
                <label>تأكيد كلمة المرور الجديدة</label>
                <div class="st-input-wrap">
                  <i class="fas fa-check"></i>
                  <input type="password" id="setConfirmPass" placeholder="أعد إدخال كلمة المرور">
                  <button class="st-toggle-pass" tabindex="-1" onclick="togglePass(this)"><i class="far fa-eye"></i></button>
                </div>
              </div>
              <p id="setMsg" class="st-msg"></p>
              <button class="st-btn" id="setSaveBtn" style="width:100%;justify-content:center"><i class="fas fa-save"></i> حفظ</button>
            </div>
          </div>

          <div class="st-acc-item">
            <div class="st-acc-header" onclick="toggleAcc(this)">
              <div class="st-acc-title">
                <i class="fas fa-envelope" style="color:#b8935a"></i>
                <span>تغيير البريد الإلكتروني</span>
              </div>
              <i class="fas fa-chevron-down st-acc-arrow"></i>
            </div>
              <div class="st-acc-body">
                <div class="st-field">
                  <label>كلمة المرور الحالية</label>
                  <div class="st-input-wrap">
                    <i class="fas fa-lock"></i>
                    <input type="password" id="setOldEmail" placeholder="أدخل كلمة المرور لتأكيد التغيير">
                  </div>
                </div>
                <div class="st-field">
                  <label>البريد الإلكتروني الجديد</label>
                  <div class="st-input-wrap">
                    <i class="fas fa-envelope-open"></i>
                    <input type="email" id="setNewEmail" placeholder="new@domain.com">
                  </div>
                </div>
                <div class="st-field">
                  <label>تأكيد البريد الإلكتروني الجديد</label>
                  <div class="st-input-wrap">
                    <i class="fas fa-check"></i>
                    <input type="email" id="setConfirmEmail" placeholder="أعد إدخال البريد الإلكتروني">
                  </div>
                </div>
              <p id="emailMsg" class="st-msg"></p>
              <button class="st-btn" id="setEmailBtn" style="width:100%;justify-content:center"><i class="fas fa-save"></i> حفظ</button>
            </div>
          </div>
        </div>

          <div class="st-acc-item">
            <div class="st-acc-header" onclick="toggleAcc(this)">
              <div class="st-acc-title">
                <i class="fas fa-share-nodes" style="color:#b8935a"></i>
                <span>روابط التواصل الاجتماعي</span>
              </div>
              <i class="fas fa-chevron-down st-acc-arrow"></i>
            </div>
            <div class="st-acc-body">
              <p class="st-card-desc">روابط صفحات المتجر على منصات التواصل.</p>
              <div class="st-soc-fields">
                <div class="st-soc-row">
                  <div class="st-soc-icon" style="background:#25D366"><i class="fab fa-whatsapp"></i></div>
                  <div class="st-input-wrap"><input type="text" id="socWhatsapp" value="${social.whatsapp}" placeholder="201143749737"></div>
                  <a href="https://wa.me/${social.whatsapp}" target="_blank" class="st-soc-open"><i class="fas fa-external-link-alt"></i></a>
                </div>
                <div class="st-soc-row">
                  <div class="st-soc-icon" style="background:#1877F2"><i class="fab fa-facebook-f"></i></div>
                  <div class="st-input-wrap"><input type="text" id="socFacebook" value="${social.facebook}" placeholder="https://facebook.com/..."></div>
                  <a href="${social.facebook}" target="_blank" class="st-soc-open"><i class="fas fa-external-link-alt"></i></a>
                </div>
                <div class="st-soc-row">
                  <div class="st-soc-icon" style="background:linear-gradient(135deg,#f58529,#dd2a7b)"><i class="fab fa-instagram"></i></div>
                  <div class="st-input-wrap"><input type="text" id="socInstagram" value="${social.instagram}" placeholder="https://instagram.com/..."></div>
                  <a href="${social.instagram}" target="_blank" class="st-soc-open"><i class="fas fa-external-link-alt"></i></a>
                </div>
                <div class="st-soc-row">
                  <div class="st-soc-icon" style="background:#010101"><i class="fab fa-tiktok"></i></div>
                  <div class="st-input-wrap"><input type="text" id="socTiktok" value="${social.tiktok}" placeholder="https://tiktok.com/@..."></div>
                  <a href="${social.tiktok}" target="_blank" class="st-soc-open"><i class="fas fa-external-link-alt"></i></a>
                </div>
              </div>
              <p id="socMsg" class="st-msg"></p>
              <button class="st-btn" id="socSaveBtn"><i class="fas fa-save"></i> حفظ الروابط</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  document.getElementById("socSaveBtn").addEventListener("click", () => {
    const data = {
      whatsapp: document.getElementById("socWhatsapp").value.trim(),
      facebook: document.getElementById("socFacebook").value.trim(),
      instagram: document.getElementById("socInstagram").value.trim(),
      tiktok: document.getElementById("socTiktok").value.trim(),
    };
    if (!data.whatsapp) {
      showSettMsg("socMsg", "رقم الواتساب مطلوب", false);
      return;
    }
    saveSocial(data);
    showSettMsg("socMsg", "تم حفظ الروابط بنجاح", true);
  });

  document.getElementById("setSaveBtn").addEventListener("click", async () => {
    const oldPass = document.getElementById("setOldPass").value;
    const newPass = document.getElementById("setNewPass").value;
    const confirmPass = document.getElementById("setConfirmPass").value;
    const msg = document.getElementById("setMsg");
    msg.className = "sett-msg";
    msg.innerHTML = "";

    if (!oldPass || !newPass || !confirmPass) {
      showSettMsg("setMsg", "جميع الحقول مطلوبة", false);
      return;
    }
    if (newPass.length < 6) {
      showSettMsg(
        "setMsg",
        "كلمة المرور الجديدة يجب أن تكون 6 أحرف على الأقل",
        false,
      );
      return;
    }
    if (newPass !== confirmPass) {
      showSettMsg("setMsg", "كلمة المرور الجديدة غير متطابقة", false);
      return;
    }

    try {
      await api.updatePassword(oldPass, newPass, confirmPass);
      showSettMsg("setMsg", "تم تغيير كلمة المرور بنجاح", true);
      document.getElementById("setOldPass").value = "";
      document.getElementById("setNewPass").value = "";
      document.getElementById("setConfirmPass").value = "";
    } catch (err) {
      showSettMsg("setMsg", err.message || "فشل تغيير كلمة المرور", false);
    }
  });

  document.getElementById("setEmailBtn").addEventListener("click", async () => {
    const curPass = document.getElementById("setOldEmail").value.trim();
    const newE = document.getElementById("setNewEmail").value.trim();
    const conf = document.getElementById("setConfirmEmail").value.trim();
    if (!curPass || !newE || !conf) {
      showSettMsg("emailMsg", "جميع الحقول مطلوبة", false);
      return;
    }
    if (newE !== conf) {
      showSettMsg("emailMsg", "البريد الإلكتروني غير متطابق", false);
      return;
    }

    try {
      await api.updateEmail(curPass, newE, conf);
      showSettMsg("emailMsg", "تم تغيير البريد الإلكتروني بنجاح", true);
      document.getElementById("setOldEmail").value = "";
      document.getElementById("setNewEmail").value = "";
      document.getElementById("setConfirmEmail").value = "";
    } catch (err) {
      showSettMsg(
        "emailMsg",
        err.message || "فشل تغيير البريد الإلكتروني",
        false,
      );
    }
  });
}

function toggleAcc(header) {
  const item = header.parentElement;
  const body = item.querySelector(".st-acc-body");
  const arrow = header.querySelector(".st-acc-arrow");
  const isOpen = item.classList.contains("open");
  document.querySelectorAll(".st-acc-item.open").forEach((el) => {
    if (el !== item) {
      el.classList.remove("open");
      el.querySelector(".st-acc-arrow").style.transform = "rotate(0deg)";
    }
  });
  if (isOpen) {
    item.classList.remove("open");
    arrow.style.transform = "rotate(0deg)";
  } else {
    item.classList.add("open");
    arrow.style.transform = "rotate(180deg)";
  }
}

function togglePass(btn) {
  const inp = btn.parentElement.querySelector("input");
  inp.type = inp.type === "password" ? "text" : "password";
  btn.innerHTML =
    inp.type === "password"
      ? '<i class="far fa-eye"></i>'
      : '<i class="far fa-eye-slash"></i>';
}

document.addEventListener("input", function (e) {
  if (e.target && e.target.id === "setNewPass") {
    const val = e.target.value;
    const bar = document.querySelector("#stStrength .st-strength-bar");
    if (!bar) return;
    let pct = 0;
    if (val.length >= 4) pct = 25;
    if (val.length >= 6) pct = 50;
    if (val.length >= 8 && /[A-Za-z]/.test(val) && /\d/.test(val)) pct = 75;
    if (
      val.length >= 10 &&
      /[A-Za-z]/.test(val) &&
      /\d/.test(val) &&
      /[^A-Za-z0-9]/.test(val)
    )
      pct = 100;
    bar.style.width = pct + "%";
    bar.style.background =
      pct < 50
        ? "#e74c3c"
        : pct < 75
          ? "#f39c12"
          : pct < 100
            ? "#2ecc71"
            : "#27ae60";
  }
});

function showSettMsg(id, text, success) {
  const el = document.getElementById(id);
  el.className = "sett-msg" + (success ? " success" : " error");
  el.innerHTML = `<i class="fas ${success ? "fa-check-circle" : "fa-exclamation-circle"}"></i> ${text}`;
}
