"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight } from "lucide-react";
import { getFeaturedProducts } from "@/lib/api";
import { getPublicErrorMessage } from "@/lib/errors";
import { Product } from "@/lib/types";
import { DataLoader } from "@/components/DataLoader";
import { ProductGrid } from "@/components/ProductGrid";

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    getFeaturedProducts(4)
      .then(data => {
        setProducts(data);
        setError("");
      })
      .catch(() => setError(getPublicErrorMessage()))
      .finally(() => setLoadingProducts(false));
  }, []);

  return (
    <main>
      <section className="hero">
        <div className="container-xl">
          <div className="row align-items-center g-4 g-lg-5 hero-copy">
            <div className="col-lg-7">
              <p className="eyebrow mb-3">MAK-Z Clothing</p>
              <h1 className="display-title mb-4">Elevated Daily Wear</h1>
              <div className="d-flex flex-column flex-sm-row gap-2">
                <Link className="btn btn-dark btn-lg d-inline-flex align-items-center justify-content-center gap-2" href="/products">
                  Shop collection
                  <ArrowRight size={18} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-xl">
          <div className="d-flex flex-column flex-md-row align-items-md-end justify-content-between gap-3 mb-4">
            <div>
              <p className="eyebrow mb-2">Selected for you</p>
              <h2 className="section-title mb-0">Featured Collection</h2>
            </div>
            <Link className="btn btn-outline-dark" href="/products">
              View all
            </Link>
          </div>
          {loadingProducts ? <DataLoader label="Loading collection" /> : error ? <div className="empty">{error}</div> : <ProductGrid products={products} />}
        </div>
      </section>
    </main>
  );
}
