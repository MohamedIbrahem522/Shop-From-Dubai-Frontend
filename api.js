class API {
  constructor(baseURL = "https://shop-from-dubai-backend-production.up.railway.app") {
    this.baseURL = baseURL;
    this.token = localStorage.getItem("api_token") || null;
  }

  get headers() {
    const h = { "Content-Type": "application/json" };
    if (this.token) h["Authorization"] = `Bearer ${this.token}`;
    return h;
  }

  async request(method, path, body, isFormData) {
    const opts = { method };
    if (this.token) {
      opts.headers = { "Authorization": `Bearer ${this.token}` };
    }
    if (body) {
      if (isFormData) {
        opts.headers = opts.headers || {};
        delete opts.headers["Content-Type"];
        opts.body = body;
      } else {
        opts.headers = opts.headers || {};
        opts.headers["Content-Type"] = "application/json";
        opts.body = JSON.stringify(body);
      }
    }
    const res = await fetch(`${this.baseURL}${path}`, opts);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || data.error || "Request failed");
    return data;
  }

  formRequest(method, path, formData) {
    return this.request(method, path, formData, true);
  }

  /* ─── Auth ─── */
  async login(email, password) {
    const data = await this.request("POST", "/admin/auth/login", { email, password });
    if (data.token) { this.token = data.token; localStorage.setItem("api_token", data.token); }
    return data;
  }
  async logout() {
    try { await this.request("POST", "/admin/auth/logout"); } catch (_) {}
    this.token = null; localStorage.removeItem("api_token");
  }
  updatePassword(currentPassword, newPassword, confirmPassword) {
    return this.request("PUT", "/admin/account/password", { currentPassword, newPassword, confirmPassword });
  }
  updateEmail(currentPassword, newEmail, confirmEmail) {
    return this.request("PUT", "/admin/account/email", { currentPassword, newEmail, confirmEmail });
  }

  /* ─── Products ─── */
  getProducts() { return this.request("GET", "/products"); }
  getProduct(id) { return this.request("GET", `/products/${id}`); }
  getProductsByCategory(catId) { return this.request("GET", `/products?category=${catId}`); }
  createProduct(fd) { return this.formRequest("POST", "/products", fd); }
  updateProduct(id, fd) { return this.formRequest("PUT", `/products/${id}`, fd); }
  deleteProduct(id) { return this.request("DELETE", `/products/${id}`); }
  restoreProduct(id) { return this.request("PUT", `/products/restore/${id}`); }

  /* ─── Categories ─── */
  getCategories() { return this.request("GET", "/categories"); }
  createCategory(name) { return this.request("POST", "/categories", { name }); }
  updateCategory(id, name) { return this.request("PUT", `/categories/${id}`, { name }); }
  deleteCategory(id) { return this.request("DELETE", `/categories/${id}`); }
  restoreCategory(id) { return this.request("PUT", `/categories/restore/${id}`); }
  hardDeleteCategory(id) { return this.request("DELETE", `/categories/hard/${id}`); }

  /* ─── Reviews / Testimonials ─── */
  getReviews() { return this.request("GET", "/reviews"); }
  createReview(fd) { return this.formRequest("POST", "/reviews", fd); }
  deleteReview(id) { return this.request("DELETE", `/reviews/${id}`); }
}

const api = new API();
