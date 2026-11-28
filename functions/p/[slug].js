const API = "https://shop-from-dubai-backend-production.up.railway.app";
const SITE = "https://shop-from-dubai-frontend.pages.dev";
const WA = "201143749737";

const esc = (s) =>
  String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const clamp = (s, n) => {
  const t = String(s || "").replace(/\s+/g, " ").trim();
  return t.length > n ? t.slice(0, n - 1) + "…" : t;
};

const img = (url, w) =>
  String(url || "").replace("/upload/", `/upload/w_${w},c_limit/`);

async function loadProducts() {
  const res = await fetch(`${API}/products?limit=100`);
  const data = await res.json();
  return data.products || [];
}

function page(p) {
  const url = `${SITE}/p/${p.slug}`;
  const image = img((p.images && p.images[0] && p.images[0].url) || "", 1200);
  const title = `${p.name} - Shop from Dubai`;
  const desc = clamp(
    p.description || `${p.name} من Shop from Dubai، منتجات أصلية من دبي.`,
    160,
  );
  const cat = p.category && p.category.name ? p.category.name : "";
  const price = Number(p.price || 0).toLocaleString("ar-EG");
  const gallery = (p.images || []).slice(1).map((i) => i.url).filter(Boolean);
  const features = Array.isArray(p.features) ? p.features : p.features ? [p.features] : [];
  const waText = encodeURIComponent(
    `أهلاً، مهتم بـ ${p.name} بسعر ${price} ج.م - ${url}`,
  );

  return `<!doctype html>
<html lang="ar" dir="rtl">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}" />
<link rel="canonical" href="${esc(url)}" />
<meta property="og:type" content="product" />
<meta property="og:site_name" content="Shop from Dubai" />
<meta property="og:title" content="${esc(p.name)}" />
<meta property="og:description" content="${esc(desc)}" />
${image ? `<meta property="og:image" content="${esc(image)}" />` : ""}
<meta property="og:url" content="${esc(url)}" />
<meta property="og:locale" content="ar_EG" />
<meta property="product:price:amount" content="${Number(p.price || 0)}" />
<meta property="product:price:currency" content="EGP" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(p.name)}" />
<meta name="twitter:description" content="${esc(desc)}" />
${image ? `<meta name="twitter:image" content="${esc(image)}" />` : ""}
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Tajawal:wght@400;500;700;900&display=swap" rel="stylesheet" />
<script type="application/ld+json">${JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.name,
    description: clamp(p.description || p.name, 300),
    image: image ? [image] : [],
    category: cat || undefined,
    brand: { "@type": "Brand", name: "Shop from Dubai" },
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: "EGP",
      price: Number(p.price || 0),
      availability: "https://schema.org/InStock",
    },
  })}</script>
<style>
  :root { --ink:#0a1b2d; --gold:#b8935a; --cream:#f7f1e6; }
  * { box-sizing: border-box; }
  body { margin:0; font-family:"Tajawal",system-ui,sans-serif; background:var(--cream); color:var(--ink); }
  a { color:inherit; }
  header { background:var(--ink); padding:16px 20px; display:flex; justify-content:space-between; align-items:center; }
  header a.brand { color:#edd8b3; font-weight:900; font-size:1.2rem; text-decoration:none; letter-spacing:.5px; }
  header a.back { color:#cbd5e1; font-size:.85rem; text-decoration:none; }
  main { max-width:1040px; margin:0 auto; padding:28px 18px 60px; display:grid; grid-template-columns:1fr 1fr; gap:36px; }
  @media (max-width:760px){ main { grid-template-columns:1fr; gap:22px; } }
  .media img.main { width:100%; border-radius:22px; background:#fff; box-shadow:0 10px 30px rgba(10,27,45,.12); display:block; }
  .thumbs { display:flex; gap:10px; margin-top:12px; flex-wrap:wrap; }
  .thumbs img { width:74px; height:74px; object-fit:cover; border-radius:12px; border:1px solid rgba(10,27,45,.1); background:#fff; }
  .chip { display:inline-block; font-size:.72rem; font-weight:700; color:var(--gold); border:1px solid rgba(184,147,90,.45); border-radius:30px; padding:5px 14px; margin-bottom:14px; }
  h1 { font-size:clamp(1.5rem,3vw,2.1rem); margin:0 0 12px; line-height:1.35; }
  .price { font-size:1.8rem; font-weight:900; color:var(--ink); margin:10px 0 18px; }
  .price small { font-size:.95rem; font-weight:700; color:var(--gold); }
  p.desc { font-size:1rem; line-height:1.9; color:#334155; white-space:pre-line; margin:0 0 18px; }
  ul.features { margin:0 0 22px; padding-inline-start:20px; color:#334155; line-height:1.9; }
  .btn { display:inline-flex; align-items:center; gap:10px; background:#25d366; color:#fff; text-decoration:none; font-weight:800; padding:14px 26px; border-radius:40px; box-shadow:0 10px 24px rgba(37,211,102,.28); }
  .cta { display:flex; flex-direction:column; gap:12px; margin-top:6px; }
  .cta .btn { width:100%; justify-content:center; padding:16px 22px; font-size:1rem; }
  .cta .btn.alt { margin-inline-start:0; }
  @media (min-width:761px){ .cta { flex-direction:row; } .cta .btn { flex:1 1 0; width:auto; } }
  footer { text-align:center; color:#7b8794; font-size:.8rem; padding:24px 0 40px; }
</style>
</head>
<body>
<header>
  <a class="brand" href="/">Shop from Dubai</a>
  <a class="back" href="/#products">كل المنتجات</a>
</header>
<main>
  <div class="media">
    ${image ? `<img class="main" src="${esc(image)}" alt="${esc(p.name)}" />` : ""}
    ${gallery.length ? `<div class="thumbs">${gallery.map((g) => `<img src="${esc(img(g, 300))}" alt="${esc(p.name)}" loading="lazy" />`).join("")}</div>` : ""}
  </div>
  <div class="info">
    ${cat ? `<span class="chip">${esc(cat)}</span>` : ""}
    <h1>${esc(p.name)}</h1>
    <div class="price">${price} <small>ج.م</small></div>
    ${p.description ? `<p class="desc">${esc(p.description)}</p>` : ""}
    ${features.length ? `<ul class="features">${features.map((f) => `<li>${esc(f)}</li>`).join("")}</ul>` : ""}
    <div class="cta">
      <a class="btn" href="https://wa.me/${WA}?text=${waText}" target="_blank" rel="noopener">اطلب عبر واتساب</a>
      <a class="btn alt" href="/#products">تصفح باقي المنتجات</a>
    </div>
  </div>
</main>
<footer>Shop from Dubai — منتجات أصلية من دبي</footer>
</body>
</html>`;
}

export async function onRequestGet({ params }) {
  const slug = decodeURIComponent(params.slug || "");
  try {
    const products = await loadProducts();
    const p =
      products.find((x) => x.slug === slug) || products.find((x) => x._id === slug);
    if (!p) {
      return new Response(
        `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>المنتج غير موجود</title></head><body style="font-family:system-ui;text-align:center;padding:60px"><h1>المنتج غير موجود</h1><p><a href="/#products">كل المنتجات</a></p></body></html>`,
        { status: 404, headers: { "content-type": "text/html; charset=utf-8" } },
      );
    }
    return new Response(page(p), {
      headers: {
        "content-type": "text/html; charset=utf-8",
        "cache-control": "public, max-age=300",
      },
    });
  } catch (e) {
    return new Response(
      `<!doctype html><html lang="ar" dir="rtl"><head><meta charset="utf-8"><title>خطأ مؤقت</title></head><body style="font-family:system-ui;text-align:center;padding:60px"><h1>تعذر تحميل المنتج</h1><p><a href="/#products">كل المنتجات</a></p></body></html>`,
      { status: 502, headers: { "content-type": "text/html; charset=utf-8" } },
    );
  }
}
