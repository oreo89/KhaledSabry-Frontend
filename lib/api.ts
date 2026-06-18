import { clearCartId, getAdminSession, getCartId, setCartId } from "./storage";
import { Cart, CatalogOption, CheckoutForm, Order, PaginationResult, PaymentMethod, Product, ProductUpsert, ShippingFee, UserSession } from "./types";

type RequestOptions = RequestInit & {
  auth?: boolean;
};

const configuredApiBaseUrl = (
  process.env.NEXT_PUBLIC_API_BASE_URL ??
  "https://khaledsabry-backend-6lda.onrender.com"
).replace(/\/+$/, "");
const apiBaseUrl = configuredApiBaseUrl.endsWith("/api") ? configuredApiBaseUrl : `${configuredApiBaseUrl}/api`;

async function readResponsePayload(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (response.status === 204) return undefined;
  if (contentType.includes("application/json")) {
    const json = await response.json().catch(() => undefined);
    if (typeof json === "string") {
      return JSON.parse(json);
    }

    return json;
  }

  const text = await response.text().catch(() => "");
  if (text.startsWith("{") || text.startsWith("[")) {
    return JSON.parse(text);
  }

  return text || undefined;
}

function getErrorMessage(payload: unknown, response: Response) {
  if (response.status === 401) return "Please log in to admin again.";
  if (response.status === 403) return "Your admin account is not allowed to do this.";
  if (!payload) return `Request failed (${response.status}).`;
  if (typeof payload === "string") return payload;
  if (typeof payload !== "object") return `Request failed (${response.status}).`;

  const body = payload as {
    errors?: string[] | Record<string, string[]>;
    message?: string;
    title?: string;
  };
  const errors = Array.isArray(body.errors)
    ? body.errors
    : body.errors
      ? Object.values(body.errors).flat()
      : [];

  return [body.message ?? body.title ?? `Request failed (${response.status}).`, ...errors].join(" ");
}

function asRecord(payload: unknown) {
  return payload && typeof payload === "object" ? payload as Record<string, unknown> : {};
}

function normalizeStringList(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function normalizeColorImageUrls(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};

  return Object.fromEntries(
    Object.entries(value as Record<string, unknown>)
      .map(([color, images]) => [color, normalizeStringList(images)] as const)
      .filter(([color, images]) => color.trim() && images.length > 0)
  );
}

function normalizeProduct(payload: unknown): Product {
  const product = asRecord(payload);
  const price = Number(product.price ?? 0);
  const discountPercentage = Number(product.discountPercentage ?? 0);

  return {
    id: Number(product.id ?? 0),
    name: String(product.name ?? ""),
    description: String(product.description ?? ""),
    pictureUrl: String(product.pictureUrl ?? ""),
    imageUrls: normalizeStringList(product.imageUrls),
    colorImageUrls: normalizeColorImageUrls(product.colorImageUrls),
    price,
    discountPercentage,
    priceAfterDiscount: Number(product.priceAfterDiscount ?? price),
    colors: Array.isArray(product.colors) ? product.colors.map(String) : [],
    sizes: Array.isArray(product.sizes) ? product.sizes.map(String) : [],
    material: String(product.material ?? ""),
    gender: String(product.gender ?? ""),
    stockQuantity: Number(product.stockQuantity ?? 0),
    isFeatured: Boolean(product.isFeatured),
    isActive: product.isActive !== false,
    brandId: Number(product.brandId ?? 0),
    typeId: Number(product.typeId ?? 0),
    brandName: String(product.brandName ?? ""),
    typeName: String(product.typeName ?? "")
  };
}

function normalizeProductList(payload: unknown) {
  const body = asRecord(payload);
  const data = Array.isArray(payload)
    ? payload
    : Array.isArray(body.data)
      ? body.data
      : Array.isArray(body.items)
        ? body.items
        : Array.isArray(body.products)
          ? body.products
          : [];

  return data.map(normalizeProduct);
}

function normalizeProductPage(payload: unknown, fallbackPageSize: number): PaginationResult<Product> {
  const body = asRecord(payload);
  const data = normalizeProductList(payload);

  return {
    pageIndex: Number(body.pageIndex ?? body.pageNumber ?? body.currentPage ?? 1),
    pageSize: Number(body.pageSize ?? fallbackPageSize),
    totalCount: Number(body.totalCount ?? body.count ?? body.total ?? data.length),
    data
  };
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const headers = new Headers(options.headers);
  if (options.body) headers.set("Content-Type", "application/json");

  if (options.auth) {
    const token = getAdminSession()?.token;
    if (token) headers.set("Authorization", `Bearer ${token}`);
  }

  const url = `${apiBaseUrl}${path}`;
  let response: Response;

  try {
    response = await fetch(url, {
      ...options,
      headers,
      cache: "no-store"
    });
  } catch {
    throw new Error(
      `Could not reach the API. If ${url} opens in the browser, the backend probably needs to allow this frontend domain in CORS.`
    );
  }

  if (!response.ok) {
    const payload = await readResponsePayload(response);
    throw new Error(getErrorMessage(payload, response));
  }

  return readResponsePayload(response) as Promise<T>;
}

export function getProducts(params: URLSearchParams) {
  const pageSize = Number(params.get("pageSize") ?? 8);
  return request<unknown>(`/products?${params.toString()}`).then(payload => normalizeProductPage(payload, pageSize));
}

export function getFeaturedProducts(take = 4) {
  return request<unknown>(`/products/featured?take=${take}`).then(normalizeProductList);
}

export function getProduct(id: number) {
  return request<unknown>(`/products/${id}`).then(normalizeProduct);
}

export function getTypes() {
  return request<CatalogOption[]>("/products/Types");
}

export async function ensureCart() {
  const existing = getCartId();
  if (existing) {
    return request<Cart>(`/carts/${existing}`);
  }

  const cart = await request<Cart>("/carts", { method: "POST" });
  setCartId(cart.id);
  return cart;
}

export async function addCartItem(productId: number, color: string, size: string, quantity = 1) {
  const cart = await ensureCart();
  const updated = await request<Cart>(`/carts/${cart.id}/items`, {
    method: "PUT",
    body: JSON.stringify({ productId, color, size, quantity })
  });
  setCartId(updated.id);
  return updated;
}

export async function updateCartItem(productId: number, color: string, size: string, quantity: number) {
  const cart = await ensureCart();
  return request<Cart>(`/carts/${cart.id}/items`, {
    method: "PATCH",
    body: JSON.stringify({ productId, color, size, quantity })
  });
}

export async function removeCartItem(productId: number, color: string, size: string) {
  const cart = await ensureCart();
  const params = new URLSearchParams({ color, size });
  return request<Cart>(`/carts/${cart.id}/items/${productId}?${params.toString()}`, {
    method: "DELETE"
  });
}

export async function placeOrder(customer: CheckoutForm, cart: Cart, paymentMethod: PaymentMethod) {
  const order = await request<Order>("/orders", {
    method: "POST",
    body: JSON.stringify({
      email: customer.email,
      phoneNumber: customer.phoneNumber,
      paymentMethod,
      address: {
        firstName: customer.firstName,
        lastName: customer.lastName,
        street: customer.street,
        city: customer.city,
        country: customer.country
      },
      items: cart.items.map(item => ({
        productId: item.productId,
        color: item.color,
        size: item.size,
        quantity: item.quantity
      }))
    })
  });

  await request(`/carts/${cart.id}`, { method: "DELETE" });
  clearCartId();
  return order;
}

export function loginAdmin(email: string, password: string) {
  return request<UserSession>("/Authentication/Login", {
    method: "POST",
    body: JSON.stringify({ email, password })
  });
}

export function getAdminProducts(params: URLSearchParams) {
  const pageSize = Number(params.get("pageSize") ?? 24);
  return request<unknown>(`/admin/products?${params.toString()}`, { auth: true }).then(payload =>
    normalizeProductPage(payload, pageSize)
  );
}

export function createProduct(product: ProductUpsert) {
  return request<Product>("/admin/products", {
    method: "POST",
    body: JSON.stringify(product),
    auth: true
  });
}

export function updateProduct(id: number, product: ProductUpsert) {
  return request<Product>(`/admin/products/${id}`, {
    method: "PUT",
    body: JSON.stringify(product),
    auth: true
  });
}

export function setProductDiscount(id: number, discountPercentage: number) {
  return request<Product>(`/admin/products/${id}/discount`, {
    method: "PATCH",
    body: JSON.stringify({ discountPercentage }),
    auth: true
  });
}

export function deleteProduct(id: number) {
  return request<boolean>(`/admin/products/${id}`, {
    method: "DELETE",
    auth: true
  });
}

export function getAdminOrders() {
  return request<Order[]>("/orders/AllOrders", { auth: true });
}

export function markOrderPaymentReceived(orderId: string) {
  return request<Order>(`/orders/${orderId}/payment-received`, {
    method: "PATCH",
    auth: true
  }).catch(error => {
    const message = error instanceof Error ? error.message : "";
    if (!message.includes("(404)") && !message.includes("(405)")) {
      throw error;
    }

    return request<Order>(`/orders/${orderId}/payment-received`, {
      method: "POST",
      auth: true
    });
  });
}

export function getShippingFee() {
  return request<ShippingFee>("/orders/shipping");
}

export function updateShippingFee(shippingFee: number) {
  return request<ShippingFee>("/orders/shipping", {
    method: "PATCH",
    body: JSON.stringify({ shippingFee }),
    auth: true
  });
}
