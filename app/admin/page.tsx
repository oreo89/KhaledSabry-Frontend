"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Boxes, ClipboardList, LogIn, LogOut, Save, Truck } from "lucide-react";
import { getShippingFee, loginAdmin, updateShippingFee } from "@/lib/api";
import { getPublicErrorMessage } from "@/lib/errors";
import { money } from "@/lib/format";
import { clearAdminSession, getAdminSession, setAdminSession } from "@/lib/storage";
import { ShippingFee, UserSession } from "@/lib/types";
import { DataLoader } from "@/components/DataLoader";

export default function AdminPage() {
  const router = useRouter();
  const [session, setSession] = useState<UserSession | null>(null);
  const [email, setEmail] = useState("admin@shop.com");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [shipping, setShipping] = useState<ShippingFee | null>(null);
  const [shippingFee, setShippingFee] = useState("0");
  const [shippingLoading, setShippingLoading] = useState(false);
  const [shippingMessage, setShippingMessage] = useState("");

  useEffect(() => {
    const savedSession = getAdminSession();
    setSession(savedSession);
    if (savedSession) {
      loadShipping();
      const next = new URLSearchParams(window.location.search).get("next");
      if (next?.startsWith("/") && !next.startsWith("//")) {
        router.replace(next);
      }
    }
  }, [router]);

  async function loadShipping() {
    setShippingLoading(true);
    try {
      const value = await getShippingFee();
      setShipping(value);
      setShippingFee(String(value.shippingFee));
      setShippingMessage("");
    } catch {
      setShippingMessage(getPublicErrorMessage());
    } finally {
      setShippingLoading(false);
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("Signing in...");
    try {
      const user = await loginAdmin(email, password);
      setAdminSession(user);
      setSession(user);
      setMessage("");
      await loadShipping();
      const next = new URLSearchParams(window.location.search).get("next");
      if (next?.startsWith("/") && !next.startsWith("//")) {
        router.replace(next);
      }
    } catch {
      setMessage(getPublicErrorMessage());
    }
  }

  async function saveShipping(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setShippingMessage("Saving shipping fee...");
    try {
      const next = await updateShippingFee(Number(shippingFee));
      setShipping(next);
      setShippingFee(String(next.shippingFee));
      setShippingMessage("Shipping fee saved.");
    } catch {
      setShippingMessage(getPublicErrorMessage());
    }
  }

  function logout() {
    clearAdminSession();
    setSession(null);
  }

  return (
    <main>
      <section className="py-5 bg-white border-bottom">
        <div className="container-xl">
          <p className="eyebrow mb-2">MAK-Z back office</p>
          <h1 className="section-title mb-3">Admin</h1>
          <p className="text-muted mb-0">Manage the storefront, inventory, discounts, and checkout orders.</p>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-xl">
          {session ? (
            <section className="panel p-3 p-md-4">
              <h2 className="h3 fw-black mb-3">Welcome, {session.displayName}</h2>
              <div className="row g-3">
                <div className="col-md-5">
                  <Link className="btn btn-dark btn-lg w-100 d-inline-flex align-items-center justify-content-center gap-2" href="/admin/products">
                    <Boxes size={18} />
                    Manage products
                  </Link>
                </div>
                <div className="col-md-4">
                  <Link className="btn btn-outline-dark btn-lg w-100 d-inline-flex align-items-center justify-content-center gap-2" href="/admin/orders">
                    <ClipboardList size={18} />
                    Orders
                  </Link>
                </div>
                <div className="col-md-2">
                  <button className="btn btn-outline-danger btn-lg w-100 d-inline-flex align-items-center justify-content-center gap-2" onClick={logout}>
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              </div>
              <div className="border-top mt-4 pt-4">
                {shippingLoading ? (
                  <DataLoader label="Loading shipping" />
                ) : (
                  <form className="row g-3 align-items-end" onSubmit={saveShipping}>
                    <div className="col-md-7">
                      <label className="form-label small text-muted fw-bold d-flex align-items-center gap-2">
                        <Truck size={16} />
                        Shipping fee
                      </label>
                      <input
                        className="form-control form-control-lg"
                        min="0"
                        step="0.01"
                        type="number"
                        value={shippingFee}
                        onChange={event => setShippingFee(event.target.value)}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <button className="btn btn-dark btn-lg w-100 d-inline-flex align-items-center justify-content-center gap-2" type="submit">
                        <Save size={18} />
                        Save
                      </button>
                    </div>
                    <div className="col-md-2 fw-black text-md-end">
                      {money.format(shipping?.shippingFee ?? Number(shippingFee || 0))}
                    </div>
                    <p className="message mb-0">{shippingMessage}</p>
                  </form>
                )}
              </div>
            </section>
          ) : (
            <section className="panel p-3 p-md-4 mx-auto" style={{ maxWidth: 560 }}>
              <h2 className="h3 fw-black mb-3">Admin Login</h2>
              <form className="d-grid gap-3" onSubmit={submit}>
                <div>
                  <label className="form-label small text-muted fw-bold">Email</label>
                  <input className="form-control form-control-lg" type="email" value={email} onChange={event => setEmail(event.target.value)} required />
                </div>
                <div>
                  <label className="form-label small text-muted fw-bold">Password</label>
                  <input className="form-control form-control-lg" type="password" value={password} onChange={event => setPassword(event.target.value)} required />
                </div>
                <button className="btn btn-dark btn-lg d-inline-flex align-items-center justify-content-center gap-2" type="submit">
                  <LogIn size={18} />
                  Login
                </button>
                <p className="message mb-0">{message}</p>
              </form>
            </section>
          )}
        </div>
      </section>
    </main>
  );
}
