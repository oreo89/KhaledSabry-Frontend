"use client";

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, RefreshCw, Save, Tag, Trash2, Upload } from "lucide-react";
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
  const [colorText, setColorText] = useState("");
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
    const next = {
      name: product.name,
      description: product.description,
      pictureUrl: product.pictureUrl,
      imageUrls: product.imageUrls,
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
    setColorText(joinList(next.colors));
    setSizeText(joinList(next.sizes));
    setImageText(joinList(next.imageUrls.filter(url => url !== next.pictureUrl && url !== shirtPlaceholder && !url.startsWith("data:"))));
    window.setTimeout(() => formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  }

  function reset() {
    setEditingId(null);
    setForm({ ...blankProduct });
    setColorText("");
    setSizeText("");
    setImageText("");
  }

  function readImageFile(file: File) {
    return new Promise<string>((resolve, reject) => {
      if (!file.type.startsWith("image/")) {
        reject(new Error(`${file.name} is not an image file.`));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result ?? ""));
      reader.onerror = () => reject(new Error(`Could not read ${file.name}.`));
      reader.readAsDataURL(file);
    });
  }

  async function uploadImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";
    if (files.length === 0) return;

    try {
      const dataUrls = await Promise.all(files.map(readImageFile));
      setForm(current => {
        const pictureUrl = current.pictureUrl && current.pictureUrl !== shirtPlaceholder ? current.pictureUrl : dataUrls[0] || "";
        const imageUrls = Array.from(new Set([...current.imageUrls.filter(url => url !== shirtPlaceholder), ...dataUrls]));
        return { ...current, pictureUrl, imageUrls };
      });
      setMessage(`${dataUrls.length} image${dataUrls.length === 1 ? "" : "s"} loaded from your PC.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not read those images.");
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const linkedImages = splitList(imageText);
    const imageUrls = Array.from(new Set([...form.imageUrls, ...linkedImages].filter(url => url && url !== shirtPlaceholder)));
    const payload = {
      ...form,
      pictureUrl: form.pictureUrl === shirtPlaceholder ? imageUrls[0] || "" : form.pictureUrl,
      brandId: 1,
      typeId: form.typeId ?? 0,
      colors: splitList(colorText),
      sizes: splitList(sizeText),
      imageUrls
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
                  <label className="form-label small text-muted fw-bold">Colors</label>
                  <input className="form-control" required value={colorText} onChange={event => setColorText(event.target.value)} placeholder="White, Navy" />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted fw-bold">Sizes</label>
                  <input className="form-control" required value={sizeText} onChange={event => setSizeText(event.target.value)} placeholder="S, M, L" />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted fw-bold">Main image URL</label>
                  <input className="form-control" required value={form.pictureUrl} onChange={event => setForm({ ...form, pictureUrl: event.target.value })} />
                </div>
                <div className="col-md-6">
                  <label className="form-label small text-muted fw-bold">Gallery image links</label>
                  <textarea className="form-control" rows={2} value={imageText} onChange={event => setImageText(event.target.value)} placeholder="Paste links separated by commas or new lines" />
                </div>
              </div>

              <div className="d-flex flex-wrap gap-3 align-items-center">
                <label className="btn btn-outline-dark file-picker mb-0 d-inline-flex align-items-center gap-2">
                  <Upload size={16} />
                  Upload images from PC
                  <input accept="image/*" multiple type="file" onChange={uploadImages} />
                </label>
                {form.pictureUrl && form.pictureUrl !== shirtPlaceholder && <img className="admin-preview" src={form.pictureUrl} alt="Selected product preview" />}
                {form.imageUrls.filter(url => url !== form.pictureUrl && url !== shirtPlaceholder).slice(0, 6).map(url => (
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
