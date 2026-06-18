"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2 } from "lucide-react";
import { getAdminOrders, markOrderPaymentReceived } from "@/lib/api";
import { getPublicErrorMessage } from "@/lib/errors";
import { money } from "@/lib/format";
import { Order } from "@/lib/types";
import { AuthGate } from "@/components/AuthGate";
import { DataLoader } from "@/components/DataLoader";

export default function AdminOrdersPage() {
  return (
    <AuthGate>
      <AdminOrdersContent />
    </AuthGate>
  );
}

function AdminOrdersContent() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrderId, setUpdatingOrderId] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    setLoading(true);
    getAdminOrders()
      .then(setOrders)
      .catch(() => setMessage(getPublicErrorMessage()))
      .finally(() => setLoading(false));
  }, []);

  async function markPaid(orderId: string) {
    setUpdatingOrderId(orderId);
    setMessage("");

    try {
      const updatedOrder = await markOrderPaymentReceived(orderId);
      setOrders(current => current.map(order => order.id === orderId ? updatedOrder : order));
      setMessage("Order marked as payment received.");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Could not update order.";
      setMessage(
        errorMessage.includes("(404)") || errorMessage.includes("(405)")
          ? "The backend is not updated yet. Deploy/restart the backend, then try Mark as done again."
          : getPublicErrorMessage()
      );
    } finally {
      setUpdatingOrderId("");
    }
  }

  return (
    <main>
      <section className="py-5 bg-white border-bottom">
        <div className="container-xl d-flex flex-column flex-md-row justify-content-between align-items-md-end gap-3">
          <div>
            <p className="eyebrow mb-2">Orders</p>
            <h1 className="section-title mb-3">Customer Orders</h1>
            <p className="text-muted mb-0">Customer details come from checkout, not accounts.</p>
          </div>
          <Link className="btn btn-dark" href="/admin/products">
            Products
          </Link>
        </div>
      </section>

      <section className="section-padding">
        <div className="container-xl">
          {message && <div className="empty mb-3">{message}</div>}

          <div className="d-grid gap-3">
            {loading ? <DataLoader label="Loading orders" /> : orders.map(order => {
              const paymentReceived = order.orderState.toLowerCase().includes("recieved") || order.orderState.toLowerCase().includes("received");
              const statusText = paymentReceived ? "Done" : order.orderState;

              return (
                <article className="panel p-3 p-md-4" key={order.id}>
                  <div className="d-flex flex-column flex-md-row justify-content-between gap-3 border-bottom pb-3 mb-3">
                    <div>
                      <h2 className="h4 fw-black mb-1">{order.userEmail}</h2>
                      <p className="text-muted mb-0">
                        {order.phoneNumber} / {new Date(order.orderDate).toLocaleString()} / {statusText}
                      </p>
                    </div>
                    <div className="d-flex flex-column align-items-md-end gap-2">
                      <strong className="fs-4">{money.format(order.total)}</strong>
                      <button
                        className="btn btn-outline-dark btn-sm d-inline-flex align-items-center gap-2"
                        type="button"
                        disabled={paymentReceived || updatingOrderId === order.id}
                        onClick={() => markPaid(order.id)}
                      >
                        <CheckCircle2 size={16} />
                        {paymentReceived ? "Done" : updatingOrderId === order.id ? "Updating..." : "Mark as done"}
                      </button>
                    </div>
                  </div>
                  <div className="d-flex flex-wrap gap-3 mb-3 text-muted fw-bold">
                    <span>Subtotal: {money.format(order.subtotal)}</span>
                    <span>Shipping: {money.format(order.shippingFee ?? 0)}</span>
                    <span>{order.deliveryMethod}</span>
                    <span>Payment: {order.paymentMethod ?? "Cash on delivery"}</span>
                  </div>
                  <p className="text-muted">
                    {order.address.firstName} {order.address.lastName}, {order.address.street}, {order.address.city},{" "}
                    {order.address.country}
                  </p>
                  <div className="d-grid gap-2">
                    {order.items.map(item => (
                      <div className="d-flex justify-content-between gap-3 border rounded-4 p-3 bg-white" key={`${order.id}-${item.productName}-${item.color}-${item.size}`}>
                        <div>
                          <strong>{item.productName}</strong>
                          <p className="text-muted small mb-0">
                            {item.color} / {item.size} / Qty {item.quantity}
                          </p>
                        </div>
                        <span className="fw-bold">{money.format(item.price * item.quantity)}</span>
                      </div>
                    ))}
                  </div>
                </article>
              );
            })}
            {!loading && orders.length === 0 && !message && <div className="empty">No orders yet.</div>}
          </div>
        </div>
      </section>
    </main>
  );
}
