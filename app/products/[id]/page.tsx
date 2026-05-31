"use client";

import Link from "next/link";
import { use, useEffect, useMemo, useState } from "react";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { addCartItem, getProduct } from "@/lib/api";
import { getPublicErrorMessage } from "@/lib/errors";
import { money } from "@/lib/format";
import { productImage, useImageFallback } from "@/lib/images";
import { Product } from "@/lib/types";
import { DataLoader } from "@/components/DataLoader";

export default function ProductDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const productId = Number(id);
  const [product, setProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState("");
  const [color, setColor] = useState("");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    setLoading(true);
    getProduct(productId)
      .then(data => {
        const image = productImage(data.pictureUrl, data.imageUrls);
        setProduct(data);
        setSelectedImage(image);
        setColor(data.colors[0] ?? "");
        setSize(data.sizes[0] ?? "");
        setMessage("");
      })
      .catch(() => setMessage(getPublicErrorMessage()))
      .finally(() => setLoading(false));
  }, [productId]);

  const gallery = useMemo(() => {
    if (!product) return [];
    return Array.from(new Set([productImage(product.pictureUrl, product.imageUrls), ...product.imageUrls].filter(Boolean)));
  }, [product]);

  async function add() {
    if (!product || !color || !size) return;
    setBusy(true);
    setMessage("Adding...");
    try {
      await addCartItem(product.id, color, size, quantity);
      setMessage("Added to cart.");
    } catch {
      setMessage(getPublicErrorMessage());
    } finally {
      setBusy(false);
    }
  }

  if (!product) {
    return (
      <main className="container-xl py-5">
        <Link className="btn btn-outline-dark d-inline-flex align-items-center gap-2" href="/products">
          <ArrowLeft size={16} />
          Products
        </Link>
        <div style={{ marginTop: 18 }}>
          {loading ? <DataLoader label="Loading product" /> : <div className="empty">{message || "Product not found."}</div>}
        </div>
      </main>
    );
  }

  const hasDiscount = product.discountPercentage > 0;
  const canBuy = product.isActive && product.stockQuantity > 0 && color && size && quantity > 0;

  return (
    <main className="section-padding">
      <div className="container-xl">
        <Link className="btn btn-outline-dark d-inline-flex align-items-center gap-2 mb-4" href="/products">
          <ArrowLeft size={16} />
          Products
        </Link>

        <section className="row g-4 g-lg-5 align-items-start">
          <div className="col-lg-6">
            <img className="detail-image" src={selectedImage} alt={product.name} onError={event => useImageFallback(event.currentTarget)} />
            {gallery.length > 1 && (
              <div className="d-flex flex-wrap gap-2 mt-3">
                {gallery.map(image => (
                  <button
                    className={image === selectedImage ? "thumb active-thumb" : "thumb"}
                    key={image}
                    type="button"
                    onClick={() => setSelectedImage(image)}
                    aria-label={`Show ${product.name} image`}
                  >
                    <img src={image} alt="" onError={event => useImageFallback(event.currentTarget)} />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="col-lg-6">
            <div className="panel p-3 p-md-4">
              <p className="eyebrow mb-2">{product.brandName} / {product.typeName}</p>
              <h1 className="section-title mb-3">{product.name}</h1>
              <div className="price fs-3 mb-3">
                <span>{money.format(product.priceAfterDiscount)}</span>
                {hasDiscount && <s>{money.format(product.price)}</s>}
                {hasDiscount && <span className="sale-badge">{product.discountPercentage}% off</span>}
              </div>
              <p className="text-muted lh-lg">{product.description}</p>

              <div className="row g-2 mb-4">
                <div className="col-4">
                  <div className="border rounded-4 p-3 h-100 bg-white">
                    <dt className="small text-muted fw-black text-uppercase">Material</dt>
                    <dd className="fw-black mb-0">{product.material}</dd>
                  </div>
                </div>
                <div className="col-4">
                  <div className="border rounded-4 p-3 h-100 bg-white">
                    <dt className="small text-muted fw-black text-uppercase">Fit</dt>
                    <dd className="fw-black mb-0">{product.gender}</dd>
                  </div>
                </div>
                <div className="col-4">
                  <div className="border rounded-4 p-3 h-100 bg-white">
                    <dt className="small text-muted fw-black text-uppercase">Stock</dt>
                    <dd className="fw-black mb-0">{product.stockQuantity > 0 ? `${product.stockQuantity}` : "Out"}</dd>
                  </div>
                </div>
              </div>

              <div className="mb-3">
                <span className="small text-muted fw-black text-uppercase d-block mb-2">Color</span>
                <div className="d-flex flex-wrap gap-2">
                  {product.colors.map(item => (
                    <button
                      className={item === color ? "btn btn-outline-dark option active-option" : "btn btn-outline-dark option"}
                      key={item}
                      type="button"
                      onClick={() => setColor(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <span className="small text-muted fw-black text-uppercase d-block mb-2">Size</span>
                <div className="d-flex flex-wrap gap-2">
                  {product.sizes.map(item => (
                    <button
                      className={item === size ? "btn btn-outline-dark option active-option" : "btn btn-outline-dark option"}
                      key={item}
                      type="button"
                      onClick={() => setSize(item)}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div className="row g-2 align-items-end">
                <div className="col-4 col-sm-3">
                  <label className="form-label small text-muted fw-bold">Qty</label>
                  <input
                    className="form-control form-control-lg"
                    min="1"
                    max={Math.max(1, product.stockQuantity)}
                    type="number"
                    value={quantity}
                    onChange={event => setQuantity(Number(event.target.value))}
                  />
                </div>
                <div className="col-8 col-sm-9">
                  <button className="btn btn-dark btn-lg w-100 d-inline-flex align-items-center justify-content-center gap-2" disabled={!canBuy || busy} type="button" onClick={add}>
                    <ShoppingCart size={18} />
                    {product.stockQuantity <= 0 ? "Out of stock" : "Add to cart"}
                  </button>
                </div>
              </div>
              <p className="message mt-3 mb-0">{message}</p>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
