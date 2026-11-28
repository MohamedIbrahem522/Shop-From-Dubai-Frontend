const API = "https://shop-from-dubai-backend-production.up.railway.app";
const SITE = "https://shop-from-dubai-frontend.pages.dev";

export async function onRequestGet() {
  let products = [];
  try {
    const res = await fetch(`${API}/products?limit=100`);
    products = (await res.json()).products || [];
  } catch (e) {
    products = [];
  }
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    `<url><loc>${SITE}/</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url>`,
    ...products.map(
      (p) =>
        `<url><loc>${SITE}/p/${p.slug}</loc><lastmod>${today}</lastmod><changefreq>weekly</changefreq><priority>0.8</priority></url>`,
    ),
  ].join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`;
  return new Response(xml, {
    headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" },
  });
}
