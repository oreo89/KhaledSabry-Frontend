"use client";

import Link from "next/link";
import { useMemo } from "react";
import { ArrowRight } from "lucide-react";
import { money } from "@/lib/format";
import { productImage, useImageFallback } from "@/lib/images";
import { Product } from "@/lib/types";

export function ProductCard({ product }: { product: Product }) {
  const hasDiscount = product.discountPercentage > 0;
  const image = useMemo(() => productImage(product.pictureUrl, product.imageUrls), [product]);

  return (
    <Link className="product-card d-flex flex-column text-reset" href={`/products/${product.id}`}>
      <img className="product-image" src={image} alt={product.name} onError={event => useImageFallback(event.currentTarget)} />
      <div className="p-3 p-md-4 d-flex flex-column gap-3 flex-grow-1">
        <div className="product-card-summary">
          <div className="product-card-copy">
            <p className="small text-muted fw-semibold mb-1">{product.brandName || "MAK-Z"}</p>
            <h3 className="h5 fw-black mb-0 product-title">
  {product.name}
</h3>
          </div>
          <div className="price">
            <span>{money.format(product.priceAfterDiscount)}</span>
            {hasDiscount && <s>{money.format(product.price)}</s>}
          </div>
        </div>
        {hasDiscount && <span className="sale-badge">{product.discountPercentage}% off</span>}
       <p className="text-muted small mb-0 product-description">
  {product.description}
</p>
        <span className="btn btn-outline-dark w-100 d-inline-flex align-items-center justify-content-center gap-2 mt-auto">
          Choose options
          <ArrowRight size={16} />
        </span>
      </div>
    </Link>
  );
}
