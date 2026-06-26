"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Save, Tag, Trash2 } from "lucide-react";
import {
  createProduct,
  deleteProduct,
  getAdminProducts,
  setProductDiscount,
  updateProduct
} from "@/lib/api";
import { getPublicErrorMessage } from "@/lib/errors";
import { joinList, money, splitList } from "@/lib/format";
import { shirtPlaceholder } from "@/lib/images";
import { Product, ProductUpsert } from "@/lib/types";
import { AuthGate } from "@/components/AuthGate";
import { DataLoader } from "@/components/DataLoader";

const blankProduct: ProductUpsert = {
  name: "",
  description: "",
  pictureUrl: "",
  imageUrls: [],
  colorImageUrls: {},
  price: 0,
  discountPercentage: 0,
  colors: [],
  sizes: [],
  material: "Cotton",
  gender: "Unisex",
  stockQuantity: 0,
  isFeatured: false,
  isActive: true,
  brandId: 1,
  typeId: 0
};

type ColorImageRow = {
  id: string;
  color: string;
  imageText: string;
  images: string[];
};

function makeRow(color = "", images: string[] = []): ColorImageRow {
  const linkedImages = filterGoogleDriveLinks(images);

  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    color,
    imageText: joinList(linkedImages),
    images: linkedImages
  };
}

function getColorImages(colorImageUrls: Record<string, string[]>, color: string) {
  const match = Object.entries(colorImageUrls).find(([key]) => key.toLowerCase() === color.toLowerCase());
  return match?.[1] ?? [];
}

function isGoogleDriveLink(url: string) {
  try {
    const hostname = new URL(url).hostname.toLowerCase();
    return hostname === "drive.google.com" || hostname.endsWith(".drive.google.com");
  } catch {
    return false;
  }
}

function filterGoogleDriveLinks(urls: string[]) {
  return urls.filter(url => url && url !== shirtPlaceholder && isGoogleDriveLink(url));
}

export default function AdminProductsPage() {
  return (
    <AuthGate>
      <AdminProductsContent />
    </AuthGate>
  );
}

function AdminProductsContent() {
  const formPanelRef = useRef<HTMLElement | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(blankProduct);
  const [colorRows, setColorRows] = useState<ColorImageRow[]>([makeRow()]);
  const [sizeText, setSizeText] = useState("");
  const [imageText, setImageText] = useState("");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const params = new URLSearchParams({ pageIndex: "1", pageSize: "24", includeInactive: "true" });
    const productResult = await getAdminProducts(params);
    setProducts(productResult.data);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(() => {
      setMessage(getPublicErrorMessage());
      setLoading(false);
    });
  }, []);

  function edit(product: Product) {
    setEditingId(product.id);
    const imageUrls = filterGoogleDriveLinks(product.imageUrls);
    const pictureUrl = isGoogleDriveLink(product.pictureUrl) ? product.pictureUrl : imageUrls[0] || "";
    const colorImageUrls = Object.fromEntries(
      Object.entries(product.colorImageUrls)
        .map(([color, urls]) => [color, filterGoogleDriveLinks(urls)] as const)
        .filter(([, urls]) => urls.length > 0)
    );
    const next = {
      name: product.name,
      description: product.description,
      pictureUrl,
      imageUrls,
      colorImageUrls,
      price: product.price,
      discountPercentage: product.discountPercentage,
      colors: product.colors,
      sizes: product.sizes,
      material: product.material,
      gender: product.gender,
      stockQuantity: product.stockQuantity,
      isFeatured: product.isFeatured,
      isActive: product.isActive,
      brandId: product.brandId,
      typeId: product.typeId || 0
    };
    setForm(next);
    setColorRows(next.colors.length > 0
      ? next.colors.map(color => makeRow(color, getColorImages(next.colorImageUrls, color)))
      : [makeRow()]);
    setSizeText(joinList(next.sizes));
    setImageText(joinList(next.imageUrls.filter(url => {
      const colorImages = Object.values(next.colorImageUrls).flat();
      return url !== next.pictureUrl && url !== shirtPlaceholder && !colorImages.includes(url);
    })));
    window.setTimeout(() => formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function reset() {
    setEditingId(null);
    setForm({ ...blankProduct });
    setColorRows([makeRow()]);
    setSizeText("");
    setImageText("");
  }

  function updateColorRow(rowId: string, patch: Partial<ColorImageRow>) {
    setColorRows(rows => rows.map(row => row.id === rowId ? { ...row, ...patch } : row));
  }

  function addColorRow() {
    setColorRows(rows => [...rows, makeRow()]);
  }

  function removeColorRow(rowId: string) {
    setColorRows(rows => rows.length > 1 ? rows.filter(row => row.id !== rowId) : [makeRow()]);
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const linkedImages = splitList(imageText);
    const colorLinkGroups = colorRows.map(row => splitList(row.imageText));
    const allImageLinks = [
      form.pictureUrl,
      ...linkedImages,
      ...colorLinkGroups.flat()
    ].filter(Boolean);
    const invalidLinks = allImageLinks.filter(url => !isGoogleDriveLink(url));

    if (invalidLinks.length > 0) {
      setMessage("Only Google Drive image links are allowed. Remove any other image links before saving.");
      return;
    }

    const normalizedColorRows = colorRows
      .map(row => ({
        color: row.color.trim(),
        images: Array.from(new Set(splitList(row.imageText).filter(url => url && url !== shirtPlaceholder)))
      }))
      .filter(row => row.color);
    const colorImageEntries = new Map<string, string[]>();
    normalizedColorRows.forEach(row => {
      if (row.images.length === 0) return;
      const existingColor = Array.from(colorImageEntries.keys()).find(key => key.toLowerCase() === row.color.toLowerCase());
      const key = existingColor ?? row.color;
      colorImageEntries.set(key, Array.from(new Set([...(colorImageEntries.get(key) ?? []), ...row.images])));
    });
    const colorImageUrls = Object.fromEntries(colorImageEntries);
    const colorImages = normalizedColorRows.flatMap(row => row.images);
    const imageUrls = Array.from(new Set([...linkedImages, ...colorImages].filter(url => url && url !== shirtPlaceholder)));
    const pictureUrl = form.pictureUrl && form.pictureUrl !== shirtPlaceholder ? form.pictureUrl : imageUrls[0] || "";
    const payload = {
      ...form,
      pictureUrl,
      brandId: 1,
      typeId: form.typeId ?? 0,
      colors: normalizedColorRows.map(row => row.color),
      sizes: splitList(sizeText),
      imageUrls,
      colorImageUrls
    };

    setMessage("Saving...");
    try {
      if (editingId) {
        await updateProduct(editingId, payload);
      } else {
        await createProduct(payload);
      }
      reset();
      await load();
      setMessage("Product saved.");
    } catch {
      setMessage(getPublicErrorMessage());
    }
  }

  async function discount(product: Product) {
    const raw = window.prompt("Discount percentage", String(product.discountPercentage));
    if (raw === null) return;
    await setProductDiscount(product.id, Number(raw));
    await load();
  }

  async function remove(product: Product) {
    if (!window.confirm(`Delete ${product.name}?`)) return;
    await deleteProduct(product.id);
    await load();
  }

  return (
    <main>
      <section className="py-5 bg-white border-bottom">
        <div className="container-xl d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3">
          <div>
            <p className="eyebrow mb-2">Inventory</p>
            <h1 className="section-title mb-3">Admin Products</h1>
            <p className="text-muted mb-0">Create products, upload image URLs, define colors and sizes, and apply discounts.</p>
          </div>
          <div className="d-flex gap-2">
            <Link className="btn btn-outline-dark" href="/admin">Admin home</Link>
            <Link className="btn btn-dark" href="/admin/orders">Orders</Link>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-xl">
          <section className="panel p-3 p-md-4 mb-4" ref={formPanelRef}>
            <h2 className="h3 fw-black mb-3">{editingId ? "Edit Product" : "Add Product"}</h2>
            <form className="d-grid gap-3" onSubmit={submit}>
              <div className="row g-3">
                <div className="col-md-6 col-xl-3">
                  <label className="form-label small text-muted fw-bold">Name</label>
                  <input className="form-control" required value={form.name} onChange={event => setForm({ ...form, name: event.target.value })} />
                </div>
                <div className="col-md-6 col-xl-3">
                  <label className="form-label small text-muted fw-bold">Price</label>
                  <input className="form-control" required type="number" value={form.price} onChange={event => setForm({ ...form, price: Number(event.target.value) })} />
                </div>
                <div className="col-md-6 col-xl-3">
                  <label className="form-label small text-muted fw-bold">Discount %</label>
                  <input className="form-control" type="number" min="0" max="100" value={form.discountPercentage} onChange={event => setForm({ ...form, discountPercentage: Number(event.target.value) })} />
                </div>
                <div className="col-md-6 col-xl-3">
                  <label className="form-label small text-muted fw-bold">Stock</label>
                  <input className="form-control" type="number" value={form.stockQuantity} onChange={event => setForm({ ...form, stockQuantity: Number(event.target.value) })} />
                </div>
                <div className="col-md-6 col-xl-3">
                  <label className="form-label small text-muted fw-bold">Material</label>
                  <input className="form-control" value={form.material} onChange={event => setForm({ ...form, material: event.target.value })} />
                </div>
                <div className="col-md-6 col-xl-3">
                  <label className="form-label small text-muted fw-bold">Gender</label>
                  <input className="form-control" value={form.gender} onChange={event => setForm({ ...form, gender: event.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted fw-bold">Sizes</label>
                  <input className="form-control" required value={sizeText} onChange={event => setSizeText(event.target.value)} placeholder="S, M, L" />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted fw-bold">Main image URL</label>
                  <input className="form-control" value={form.pictureUrl} onChange={event => setForm({ ...form, pictureUrl: event.target.value })} placeholder="Optional, first uploaded color image is used if empty" />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted fw-bold">General gallery image links</label>
                  <textarea className="form-control" rows={2} value={imageText} onChange={event => setImageText(event.target.value)} placeholder="Paste links separated by commas or new lines" />
                </div>
              </div>

              <div className="color-image-editor">
                <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-2">
                  <label className="form-label small text-muted fw-bold mb-0">Color images</label>
                  <button className="btn btn-outline-dark btn-sm d-inline-flex align-items-center gap-2" type="button" onClick={addColorRow}>
                    <Plus size={14} />
                    Add color
                  </button>
                </div>
                <div className="d-grid gap-3">
                  {colorRows.map((row, index) => {
                const previews = Array.from(new Set(splitList(row.imageText)))
                  .filter(url => url && url !== shirtPlaceholder)
                  .slice(0, 6);

                    return (
                      <div className="color-image-row" key={row.id}>
                        <div className="row g-3">
                          <div className="col-md-4">
                            <label className="form-label small text-muted fw-bold">Color {index + 1}</label>
                            <input
                              className="form-control"
                              required
                              value={row.color}
                              onChange={event => updateColorRow(row.id, { color: event.target.value })}
                              placeholder="White"
                            />
                          </div>
                          <div className="col-md-8">
                            <label className="form-label small text-muted fw-bold">Images for this color</label>
                            <textarea
                              className="form-control"
                              rows={2}
                              value={row.imageText}
                              onChange={event => updateColorRow(row.id, { imageText: event.target.value })}
                              placeholder="Paste links separated by commas or new lines"
                            />
                          </div>
                        </div>
                        <div className="d-flex flex-wrap gap-2 align-items-center mt-3">
                          <button className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-2" type="button" onClick={() => removeColorRow(row.id)}>
                            <Trash2 size={14} />
                            Remove
                          </button>
                          {previews.map(url => (
                            <img className="admin-preview" key={url} src={url} alt={`${row.color || "Color"} preview`} />
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="d-flex flex-wrap gap-3 align-items-center">
                {form.pictureUrl && form.pictureUrl !== shirtPlaceholder && <img className="admin-preview" src={form.pictureUrl} alt="Selected product preview" />}
                {form.imageUrls.filter(url => {
                  const colorImages = colorRows.flatMap(row => splitList(row.imageText));
                  return url !== form.pictureUrl && url !== shirtPlaceholder && !colorImages.includes(url);
                }).slice(0, 6).map(url => (
                  <img className="admin-preview" key={url} src={url} alt="Selected gallery preview" />
                ))}
              </div>

              <div>
                <label className="form-label small text-muted fw-bold">Description</label>
                <textarea className="form-control" required rows={4} value={form.description} onChange={event => setForm({ ...form, description: event.target.value })} />
              </div>

              <div className="d-flex flex-wrap gap-3">
                <label className="form-check-label d-flex align-items-center gap-2 fw-bold">
                  <input className="form-check-input m-0" type="checkbox" checked={form.isFeatured} onChange={event => setForm({ ...form, isFeatured: event.target.checked })} />
                  Featured
                </label>
                <label className="form-check-label d-flex align-items-center gap-2 fw-bold">
                  <input className="form-check-input m-0" type="checkbox" checked={form.isActive} onChange={event => setForm({ ...form, isActive: event.target.checked })} />
                  Active
                </label>
              </div>

              <div className="d-flex flex-wrap gap-2">
                <button className="btn btn-dark d-inline-flex align-items-center gap-2" type="submit">
                  {editingId ? <Save size={16} /> : <Plus size={16} />}
                  {editingId ? "Save changes" : "Create product"}
                </button>
                <button className="btn btn-outline-dark d-inline-flex align-items-center gap-2" type="button" onClick={reset}>
                  <RefreshCw size={16} />
                  Reset
                </button>
              </div>
              <p className="message mb-0">{message}</p>
            </form>
          </section>

          <section className="d-grid gap-3">
            {loading ? <DataLoader label="Loading products" /> : products.map(product => (
              <article className="panel p-3" key={product.id}>
                <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3">
                  <div>
                    <h3 className="h5 fw-black mb-1">{product.name}</h3>
                    <p className="text-muted mb-0">
                      {product.colors.join(", ")} / {product.sizes.join(", ")} / {money.format(product.priceAfterDiscount)}
                    </p>
                  </div>
                  <div className="d-flex flex-wrap gap-2">
                    <button className="btn btn-outline-dark d-inline-flex align-items-center gap-2" onClick={() => edit(product)}>
                      <Save size={16} />
                      Edit
                    </button>
                    <button className="btn btn-outline-dark d-inline-flex align-items-center gap-2" onClick={() => discount(product)}>
                      <Tag size={16} />
                      Discount
                    </button>
                    <button className="btn btn-outline-danger d-inline-flex align-items-center gap-2" onClick={() => remove(product)}>
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </article>
            ))}
            {!loading && products.length === 0 && !message && <div className="empty">No products yet.</div>}
          </section>
        </div>
      </section>
    </main>
  );
}
