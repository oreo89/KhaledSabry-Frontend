"use client";

import { useEffect } from "react";
import Link from "next/link";
import { Menu, Search, Shield, ShoppingBag, ShoppingCart } from "lucide-react";

export function Header() {
  useEffect(() => {
    import("bootstrap/dist/js/bootstrap.bundle.min.js");
  }, []);

  return (
    <>
      <div className="promo-bar text-center small fw-semibold">
        New MAK-Z drops starting now
      </div>
      <header className="navbar navbar-expand-lg sticky-top bg-white border-bottom">
        <div className="container-xl">
          <Link className="navbar-brand d-flex align-items-center gap-2 fw-black" href="/">
            <span className="brand-mark" aria-hidden="true">
              <img src="/Logo.png" alt="" />
            </span>
            <span>MAK-Z</span>
          </Link>

          <button
            className="navbar-toggler border-0 shadow-none"
            type="button"
            data-bs-toggle="collapse"
            data-bs-target="#main-navigation"
            aria-controls="main-navigation"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            <Menu size={24} />
          </button>

          <nav className="collapse navbar-collapse" id="main-navigation" aria-label="Main navigation">
            <ul className="navbar-nav mx-lg-auto my-3 my-lg-0 gap-lg-2">
              <li className="nav-item">
                <Link className="nav-link fw-semibold" href="/">
                  Home
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link fw-semibold" href="/products">
                  Shop
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-link fw-semibold" href="/products?sortingOptions=3">
                  New Arrivals
                </Link>
              </li>
            </ul>

            <div className="d-flex flex-column flex-lg-row gap-2">
              <Link className="btn btn-light icon-button" href="/products" aria-label="Search products">
                <Search size={18} />
              </Link>
              <Link className="btn btn-dark d-inline-flex align-items-center gap-2" href="/cart">
                <ShoppingCart size={18} />
                Cart
              </Link>
            </div>
          </nav>
        </div>
      </header>
      <div className="trust-strip d-none d-md-block">
        <div className="container-xl d-flex justify-content-center gap-4 small text-muted">
          <span className="d-inline-flex align-items-center gap-2">
            <ShoppingBag size={15} />
            Curated clothing essentials
          </span>
          <span className="d-inline-flex align-items-center gap-2">
            <Shield size={15} />
            Secure checkout
          </span>
        </div>
      </div>
    </>
  );
}
