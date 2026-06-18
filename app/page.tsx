"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";

export default function HomePage() {
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
           {/* </div>
            <div className="col-lg-5">
             <div className="hero-panel p-3">
                {/* <img className="hero-logo mb-3" src="/MAK-Z-03.png" alt="MAK-Z Clothing" /> */}
               {/* <div className="brand-gallery"> 
                  {brandImages.map((image, index) => (
                    <img key={image} src={image} alt={`MAK-Z brand style ${index + 1}`} />
                  ))}
                </div> 
              </div> */}
            </div> 
          </div> 
        </div> 
      </section>

      {/* <section className="section-padding bg-white">
        <div className="container-xl">
          <div className="row g-3">
            <div className="col-md-4">
              <div className="collection-tile">
                <img src="/MAK-Z-04.png" alt="MAK-Z monochrome identity" />
                <div className="collection-overlay">
                  <p className="small text-muted fw-semibold mb-1">Drop 01</p>
                  <h2 className="h4 fw-black mb-0">Minimal Essentials</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="collection-tile">
                <img src="/MAK-Z-03.png" alt="MAK-Z light identity" />
                <div className="collection-overlay">
                  <p className="small text-muted fw-semibold mb-1">Core Line</p>
                  <h2 className="h4 fw-black mb-0">Clean Everyday Fits</h2>
                </div>
              </div>
            </div>
            <div className="col-md-4">
              <div className="collection-tile">
                <img src="/MAK-Z-03.jpg.jpeg" alt="MAK-Z clothing branding" />
                <div className="collection-overlay">
                  <p className="small text-muted fw-semibold mb-1">Mobile First</p>
                  <h2 className="h4 fw-black mb-0">Fast Shop Flow</h2>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section> */}

      {/* <section className="section-padding">
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
      </section> */}
    </main>
  );
}
