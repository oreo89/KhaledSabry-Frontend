"use client";

import { useEffect, useMemo, useState } from "react";
import { getProducts } from "@/lib/api";
import { getPublicErrorMessage } from "@/lib/errors";
import { Product, PaginationResult } from "@/lib/types";
import { DataLoader } from "@/components/DataLoader";
import { ProductGrid } from "@/components/ProductGrid";

const emptyResult: PaginationResult<Product> = {
  pageIndex: 1,
  pageSize: 8,
  totalCount: 0,
  data: []
};

export default function ProductsPage() {
  const [result, setResult] = useState(emptyResult);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const totalPages = Math.max(1, Math.ceil(result.totalCount / result.pageSize));

  const params = useMemo(() => {
    const next = new URLSearchParams({ pageIndex: String(page), pageSize: "8" });
    if (search) next.set("searchValue", search);
    if (sort) next.set("sortingOptions", sort);
    return next;
  }, [page, search, sort]);

  useEffect(() => {
    setLoading(true);
    getProducts(params)
      .then(data => {
        setResult(data);
        setError("");
      })
      .catch(() => setError(getPublicErrorMessage()))
      .finally(() => setLoading(false));
  }, [params]);

  return (
    <main>
      <section className="py-5 bg-white border-bottom">
        <div className="container-xl">
          <p className="eyebrow mb-2">Shop MAK-Z</p>
          <h1 className="section-title mb-3">All Products</h1>
          <p className="text-muted mb-0">Browse the collection with quick search and sorting.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-xl">
          <div className="filter-panel p-3 p-md-4 mb-4">
            <div className="row g-3 align-items-end">
              <div className="col-12 col-md-8">
                <label className="form-label fw-bold text-muted small">Search</label>
                <input
                  className="form-control form-control-lg"
                  value={search}
                  onChange={event => { setPage(1); setSearch(event.target.value); }}
                />
              </div>
              <div className="col-12 col-md-4">
                <label className="form-label fw-bold text-muted small">Sort</label>
                <select className="form-select form-select-lg" value={sort} onChange={event => { setPage(1); setSort(event.target.value); }}>
                  <option value="">Default</option>
                  <option value="1">Name A-Z</option>
                  <option value="2">Name Z-A</option>
                  <option value="3">Price low</option>
                  <option value="4">Price high</option>
                </select>
              </div>
            </div>
          </div>

          {loading ? <DataLoader label="Loading products" /> : error ? <div className="empty">{error}</div> : <ProductGrid products={result.data} />}

          <div className="d-flex align-items-center justify-content-center gap-3 pt-4">
            <button className="btn btn-outline-dark" disabled={page <= 1} onClick={() => setPage(value => value - 1)}>
              Previous
            </button>
            <strong className="small">
              {result.pageIndex} / {totalPages}
            </strong>
            <button className="btn btn-outline-dark" disabled={page >= totalPages} onClick={() => setPage(value => value + 1)}>
              Next
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
