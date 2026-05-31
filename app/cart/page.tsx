"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { Banknote, Minus, Plus, Smartphone, Trash2 } from "lucide-react";
import { ensureCart, getShippingFee, placeOrder, removeCartItem, updateCartItem } from "@/lib/api";
import { money } from "@/lib/format";
import { shirtPlaceholder, useImageFallback } from "@/lib/images";
import { Cart, CheckoutForm, PaymentMethod, ShippingFee } from "@/lib/types";
import { DataLoader } from "@/components/DataLoader";

const blankCustomer: CheckoutForm = {
  firstName: "",
  lastName: "",
  email: "",
  phoneNumber: "",
  street: "",
  city: "",
  country: ""
};

const instapayMessage = "Someone will contact you to confirm your Instapay payment.";

export default function CartPage() {
  const [cart, setCart] = useState<Cart | null>(null);
  const [shipping, setShipping] = useState<ShippingFee | null>(null);
  const [customer, setCustomer] = useState(blankCustomer);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash_on_delivery");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  async function load() {
    setLoading(true);
    const [nextCart, nextShipping] = await Promise.all([ensureCart(), getShippingFee()]);
    setCart(nextCart);
    setShipping(nextShipping);
    setLoading(false);
  }

  useEffect(() => {
    load().catch(error => {
      setMessage(error.message);
      setLoading(false);
    });
  }, []);

  async function changeQty(productId: number, color: string, size: string, quantity: number) {
    setCart(await updateCartItem(productId, color, size, quantity));
  }

  const subtotal = cart?.subtotal ?? 0;
  const shippingFee = shipping?.shippingFee ?? 0;
  const total = subtotal + shippingFee;

  async function remove(productId: number, color: string, size: string) {
    setCart(await removeCartItem(productId, color, size));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!cart || cart.items.length === 0) {
      setMessage("Add at least one product before checkout.");
      return;
    }

    setMessage("Placing order...");
    try {
      const order = await placeOrder(customer, cart, paymentMethod);
      setMessage(
        paymentMethod === "instapay"
          ? `Order placed. Reference: ${order.id}. ${instapayMessage}`
          : `Order placed. Reference: ${order.id}`
      );
      setCustomer(blankCustomer);
      setPaymentMethod("cash_on_delivery");
      await load();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Could not place order.");
    }
  }

  return (
    <main>
      <section className="py-5 bg-white border-bottom">
        <div className="container-xl d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3">
          <div>
            <p className="eyebrow mb-2">Checkout</p>
            <h1 className="section-title mb-0">Your Cart</h1>
          </div>
          <Link className="btn btn-outline-dark" href="/products">
            Continue shopping
          </Link>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-xl">
          <div className="row g-4 align-items-start">
            <div className="col-lg-7">
              <div className="d-grid gap-3">
                {loading ? (
                  <DataLoader label="Loading cart" />
                ) : !cart || cart.items.length === 0 ? (
                  <div className="empty">Your cart is empty on this device.</div>
                ) : (
                  cart.items.map(item => (
                    <article className="panel p-3" key={`${item.productId}-${item.color}-${item.size}`}>
                      <div className="d-flex gap-3 align-items-start">
                        <img
                          className="cart-thumb flex-shrink-0"
                          src={item.pictureUrl || shirtPlaceholder}
                          alt={item.productName}
                          onError={event => useImageFallback(event.currentTarget)}
                        />
                        <div className="flex-grow-1">
                          <h2 className="h5 fw-black mb-1">{item.productName}</h2>
                          <p className="text-muted small mb-2">
                            {item.color} / {item.size} / {money.format(item.unitPrice)}
                          </p>
                          <strong>{money.format(item.lineTotal)}</strong>
                        </div>
                      </div>
                      <div className="d-flex flex-wrap gap-2 mt-3">
                        <button className="btn btn-light" onClick={() => changeQty(item.productId, item.color, item.size, item.quantity - 1)} aria-label="Decrease quantity">
                          <Minus size={16} />
                        </button>
                        <button className="btn btn-outline-dark" disabled>{item.quantity}</button>
                        <button className="btn btn-light" onClick={() => changeQty(item.productId, item.color, item.size, item.quantity + 1)} aria-label="Increase quantity">
                          <Plus size={16} />
                        </button>
                        <button className="btn btn-outline-danger ms-sm-auto" onClick={() => remove(item.productId, item.color, item.size)} aria-label="Remove item">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </article>
                  ))
                )}
              </div>
            </div>

            <div className="col-lg-5">
              <section className="panel p-3 p-md-4 position-sticky" style={{ top: 120 }}>
                <div className="d-grid gap-2 border-bottom pb-3 mb-3">
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-black">Subtotal</span>
                    <span className="fw-bold">{money.format(subtotal)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center">
                    <span className="fw-black">Shipping</span>
                    <span className="fw-bold">{money.format(shippingFee)}</span>
                  </div>
                  <div className="d-flex justify-content-between align-items-center pt-2">
                    <span className="fw-black">Total</span>
                    <span className="fs-4 fw-black">{money.format(total)}</span>
                  </div>
                </div>
                <h2 className="h4 fw-black mb-3">Checkout Details</h2>
                <form className="d-grid gap-3" onSubmit={submit}>
                  <div className="row g-3">
                    {(Object.keys(blankCustomer) as Array<keyof CheckoutForm>).map(field => (
                      <div className="col-sm-6" key={field}>
                        <label className="form-label small text-muted fw-bold text-capitalize">
                          {field.replace(/([A-Z])/g, " $1")}
                        </label>
                        <input
                          className="form-control"
                          required
                          type={field === "email" ? "email" : "text"}
                          value={customer[field]}
                          onChange={event => setCustomer(value => ({ ...value, [field]: event.target.value }))}
                        />
                      </div>
                    ))}
                  </div>
                  <div>
                    <label className="form-label small text-muted fw-bold">Payment method</label>
                    <div className="payment-options">
                      <label className={`payment-option ${paymentMethod === "cash_on_delivery" ? "active-payment" : ""}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="cash_on_delivery"
                          checked={paymentMethod === "cash_on_delivery"}
                          onChange={() => {
                            setPaymentMethod("cash_on_delivery");
                            setMessage("");
                          }}
                        />
                        <span className="payment-icon">
                          <Banknote size={18} />
                        </span>
                        <span>
                          <strong>Cash on delivery</strong>
                          <small>Pay when your order arrives.</small>
                        </span>
                      </label>
                      <label className={`payment-option ${paymentMethod === "instapay" ? "active-payment" : ""}`}>
                        <input
                          type="radio"
                          name="paymentMethod"
                          value="instapay"
                          checked={paymentMethod === "instapay"}
                          onChange={() => {
                            setPaymentMethod("instapay");
                            setMessage(instapayMessage);
                          }}
                        />
                        <span className="payment-icon">
                          <Smartphone size={18} />
                        </span>
                        <span>
                          <strong>Instapay</strong>
                          <small>{instapayMessage}</small>
                        </span>
                      </label>
                    </div>
                  </div>
                  <button className="btn btn-dark btn-lg w-100" type="submit">
                    Place order
                  </button>
                  <p className="message mb-0">{message}</p>
                </form>
              </section>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
