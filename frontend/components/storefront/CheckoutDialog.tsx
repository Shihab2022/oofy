"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  FiCheck,
  FiCopy,
  FiTruck,
  FiSmartphone,
  FiShield,
  FiAlertCircle,
  FiCheckCircle,
  FiX,
  FiShoppingBag,
  FiArrowRight,
  FiLock,
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiFileText,
  FiChevronDown,
  FiTrash2,
} from "react-icons/fi";
import { CartItem, money, productPrice, isFreeDeliveryProduct } from "./types";
import { getStoredCart, saveStoredCart } from "./cartStore";

const API = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")
  .trim()
  .replace(/^["']|["']$/g, "");

const STORE_BKASH_NUMBER =
  process.env.NEXT_PUBLIC_BKASH_NUMBER || "01712-345678";
const STORE_NAGAD_NUMBER =
  process.env.NEXT_PUBLIC_NAGAD_NUMBER || "01712-345678";

const BD_DISTRICTS = [
  "Dhaka",
  "Chattogram",
  "Gazipur",
  "Narayanganj",
  "Bagerhat",
  "Bandarban",
  "Barguna",
  "Barishal",
  "Bhola",
  "Bogura",
  "Brahmanbaria",
  "Chandpur",
  "Chapainawabganj",
  "Chuadanga",
  "Cox's Bazar",
  "Cumilla",
  "Dinajpur",
  "Faridpur",
  "Feni",
  "Gaibandha",
  "Gopalganj",
  "Habiganj",
  "Jamalpur",
  "Jashore",
  "Jhalokati",
  "Jhenaidah",
  "Joypurhat",
  "Khagrachhari",
  "Khulna",
  "Kishoreganj",
  "Kurigram",
  "Kushtia",
  "Lakshmipur",
  "Lalmonirhat",
  "Madaripur",
  "Magura",
  "Manikganj",
  "Meherpur",
  "Moulvibazar",
  "Munshiganj",
  "Mymensingh",
  "Naogaon",
  "Narail",
  "Narsingdi",
  "Natore",
  "Netrokona",
  "Nilphamari",
  "Noakhali",
  "Pabna",
  "Panchagarh",
  "Patuakhali",
  "Pirojpur",
  "Rajbari",
  "Rajshahi",
  "Rangamati",
  "Rangpur",
  "Satkhira",
  "Shariatpur",
  "Sherpur",
  "Sirajganj",
  "Sunamganj",
  "Sylhet",
  "Tangail",
  "Thakurgaon",
  "Other",
];

type Props = {
  items: CartItem[];
  shipping: number;
  onClose: () => void;
  onDone: (message: string) => void;
  onUpdateQuantity?: (variantId: string, quantity: number) => void;
  onRemoveItem?: (variantId: string) => void;
};

type PaymentMethod = "COD" | "BKASH" | "NAGAD";

export function CheckoutDialog({
  items,
  shipping,
  onClose,
  onDone,
  onUpdateQuantity,
  onRemoveItem,
}: Props) {
  const [form, setForm] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    district: "Dhaka",
    customDistrict: "",
    area: "",
    address: "",
    orderNotes: "",
    paymentNumber: "",
    transactionId: "",
  });

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("COD");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);
  const [confirmedOrder, setConfirmedOrder] = useState<any | null>(null);

  const [deliveryRates, setDeliveryRates] = useState<{
    insideDhaka: number;
    outsideDhaka: number;
    cityRates: Record<string, number>;
    threshold: number | null;
  }>({
    insideDhaka: 60,
    outsideDhaka: 100,
    cityRates: {},
    threshold: 2000,
  });

  useEffect(() => {
    fetch(`${API}/settings`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success && res.data) {
          setDeliveryRates({
            insideDhaka: Number(
              res.data.deliveryChargeInsideDhaka ?? res.data.deliveryCharge ?? 60
            ),
            outsideDhaka: Number(res.data.deliveryChargeOutsideDhaka ?? 100),
            cityRates: res.data.cityDeliveryRates || {},
            threshold:
              res.data.freeShippingThreshold !== null &&
              res.data.freeShippingThreshold !== undefined &&
              res.data.freeShippingThreshold !== ""
                ? Number(res.data.freeShippingThreshold)
                : 2000,
          });
        }
      })
      .catch(() => {});
  }, []);

  const subtotal = items.reduce(
    (n, item) =>
      n + Number(productPrice(item.product, item.variant)) * item.quantity,
    0
  );

  const hasFreeItem = items.some((item) => isFreeDeliveryProduct(item.product));

  const effectiveShipping = useMemo(() => {
    if (subtotal === 0 || hasFreeItem) return 0;
    if (deliveryRates.insideDhaka === 0 && deliveryRates.outsideDhaka === 0) return 0;
    if (deliveryRates.threshold !== null && deliveryRates.threshold === 0) return 0;
    if (deliveryRates.threshold !== null && subtotal >= deliveryRates.threshold) return 0;

    const norm = (
      form.district === "Other" ? form.customDistrict : form.district
    ).toLowerCase().trim();

    if (!norm || norm.includes("dhaka")) {
      return deliveryRates.insideDhaka;
    }

    if (deliveryRates.cityRates) {
      for (const [cityName, rate] of Object.entries(deliveryRates.cityRates)) {
        if (
          norm.includes(cityName.toLowerCase()) ||
          cityName.toLowerCase().includes(norm)
        ) {
          return Number(rate);
        }
      }
    }

    return deliveryRates.outsideDhaka;
  }, [subtotal, hasFreeItem, form.district, form.customDistrict, deliveryRates]);

  const total = subtotal + effectiveShipping;

  const activeStoreNumber =
    paymentMethod === "BKASH" ? STORE_BKASH_NUMBER : STORE_NAGAD_NUMBER;

  // Item quantity & removal handlers (Requirement 10)
  const handleIncrease = (item: CartItem) => {
    setError("");
    const maxStock = item.variant?.stock ?? 99;
    const nextQty = item.quantity + 1;
    if (nextQty > maxStock) {
      setError(`Only ${maxStock} in stock for ${item.product.name} (${item.variant.size}).`);
      return;
    }
    if (onUpdateQuantity) {
      onUpdateQuantity(item.variant.id, nextQty);
    } else {
      const current = getStoredCart();
      const updated = current.map((i) =>
        i.variant.id === item.variant.id ? { ...i, quantity: nextQty } : i
      );
      saveStoredCart(updated);
    }
  };

  const handleDecrease = (item: CartItem) => {
    setError("");
    if (item.quantity <= 1) {
      handleDelete(item);
      return;
    }
    const nextQty = item.quantity - 1;
    if (onUpdateQuantity) {
      onUpdateQuantity(item.variant.id, nextQty);
    } else {
      const current = getStoredCart();
      const updated = current.map((i) =>
        i.variant.id === item.variant.id ? { ...i, quantity: nextQty } : i
      );
      saveStoredCart(updated);
    }
  };

  const handleDelete = (item: CartItem) => {
    setError("");
    if (onRemoveItem) {
      onRemoveItem(item.variant.id);
    } else {
      const current = getStoredCart();
      const updated = current.filter((i) => i.variant.id !== item.variant.id);
      saveStoredCart(updated);
    }
  };

  const handleCopy = (text: string, label: string) => {
    const clean = text.replace(/[\s\-]/g, "");
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(clean);
      setCopied(label);
      setTimeout(() => setCopied(null), 2000);
    }
  };

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError("");

    // 1. Validate Name
    if (!form.customerName.trim() || form.customerName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }

    // 2. Validate Phone
    const cleanPhone = form.customerPhone.replace(/[\s\-]/g, "");
    if (!/^(?:\+?880|880|0)?1[3-9]\d{8}$/.test(cleanPhone)) {
      setError("Please enter a valid 11-digit mobile number (e.g. 017XXXXXXXX).");
      return;
    }

    // 3. Validate District & Area
    const finalDistrict =
      form.district === "Other"
        ? form.customDistrict.trim()
        : form.district.trim();
    if (!finalDistrict) {
      setError("Please select or enter your district.");
      return;
    }

    if (!form.area.trim()) {
      setError("Please enter your area / upazila / thana.");
      return;
    }

    // 4. Validate Address
    if (!form.address.trim() || form.address.trim().length < 5) {
      setError("Please enter your full delivery address (House, Road, Area).");
      return;
    }

    // 5. Validate Mobile Payment Fields (if bKash or Nagad)
    if (paymentMethod === "BKASH" || paymentMethod === "NAGAD") {
      const cleanPayNumber = form.paymentNumber.replace(/[\s\-]/g, "");
      if (!/^(?:\+?880|880|0)?1[3-9]\d{8}$/.test(cleanPayNumber)) {
        setError(
          `Please enter the 11-digit ${
            paymentMethod === "BKASH" ? "bKash" : "Nagad"
          } number you paid from.`
        );
        return;
      }
      if (!form.transactionId.trim() || form.transactionId.trim().length < 4) {
        setError(
          `Please enter the Transaction ID (TrxID) from your ${
            paymentMethod === "BKASH" ? "bKash" : "Nagad"
          } SMS receipt.`
        );
        return;
      }
    }

    if (!items.length) {
      setError("Your shopping bag is empty.");
      return;
    }

    setBusy(true);

    const payload = {
      customerName: form.customerName.trim(),
      customerPhone: cleanPhone,
      customerEmail: form.customerEmail.trim() || undefined,
      district: finalDistrict,
      area: form.area.trim(),
      address: form.address.trim(),
      orderNotes: form.orderNotes.trim() || undefined,
      paymentMethod,
      paymentNumber:
        paymentMethod !== "COD" && form.paymentNumber.trim()
          ? form.paymentNumber.trim()
          : undefined,
      transactionId:
        paymentMethod !== "COD" && form.transactionId.trim()
          ? form.transactionId.trim()
          : undefined,
      items: items.map((item) => ({
        productId: item.product.id,
        variantId: item.variant.id,
        quantity: item.quantity,
        size: item.variant.size,
        color: item.variant.color || null,
      })),
    };

    const endpoints = [
      "/api/orders",
      `${API}/orders`,
      "http://localhost:5000/api/orders",
      "http://127.0.0.1:5000/api/orders",
    ];
    const uniqueEndpoints = Array.from(new Set(endpoints));

    let orderData: any = null;
    let lastErr =
      "Unable to place order. Please check your network and try again.";

    for (const ep of uniqueEndpoints) {
      try {
        const res = await fetch(ep, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json().catch(() => null);

        if (res.ok && data?.success) {
          orderData = data.data;
          break;
        } else if (data?.message) {
          lastErr = data.message;
        }
      } catch (err: any) {
        // Continue to fallback endpoint
      }
    }

    setBusy(false);

    if (!orderData) {
      setError(lastErr);
      return;
    }

    setConfirmedOrder({
      ...orderData,
      customerName: form.customerName,
      customerPhone: cleanPhone,
      address: form.address,
      district: finalDistrict,
      area: form.area,
      paymentMethod,
      transactionId: form.transactionId,
    });
  }

  const handleFinish = () => {
    if (confirmedOrder) {
      onDone(
        `Order ${confirmedOrder.orderNumber} confirmed. Payment: ${
          paymentMethod === "COD"
            ? "Cash on Delivery (" + money(confirmedOrder.totalAmount) + ")"
            : paymentMethod + " (TrxID: " + form.transactionId + ")"
        }`
      );
    } else {
      onClose();
    }
  };

  return (
    <div
      className="oofy-checkout-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
      role="dialog"
      aria-modal="true"
    >
      <div className="oofy-checkout-dialog">
        {/* Top App Bar */}
        <div className="oofy-checkout-topbar">
          <div className="topbar-left">
            <span className="brand-pill">
              <span className="brand-dot" />
              OOFY STUDIO
            </span>
            <span className="topbar-title">
              {confirmedOrder ? "Order Confirmation" : "Complete Your Order"}
            </span>
          </div>

          <button
            type="button"
            className="topbar-close-btn"
            onClick={confirmedOrder ? handleFinish : onClose}
            disabled={busy}
            aria-label="Close"
          >
            <FiX />
          </button>
        </div>

        {/* Content Area */}
        {confirmedOrder ? (
          /* Success Receipt View */
          <div className="oofy-success-screen">
            <div className="success-badge-ring">
              <FiCheck className="success-check-icon" />
            </div>

            <span className="success-eyebrow">ORDER RECEIVED</span>
            <h2 className="success-heading">
              Thank You, {confirmedOrder.customerName}
            </h2>
            <p className="success-sub">
              Your order has been recorded in our Dhaka atelier. We are preparing it for packaging.
            </p>

            <div className="success-receipt-box">
              <div className="receipt-item-row">
                <span className="receipt-k">Order Reference</span>
                <span className="receipt-v font-mono font-bold text-black">
                  #{confirmedOrder.orderNumber}
                </span>
              </div>

              <div className="receipt-item-row">
                <span className="receipt-k">Payment Method</span>
                <span className="receipt-v">
                  {confirmedOrder.paymentMethod === "COD" ? (
                    <span className="pill-method cod">Cash on Delivery</span>
                  ) : confirmedOrder.paymentMethod === "BKASH" ? (
                    <span className="pill-method bkash">
                      bKash · TrxID: {confirmedOrder.transactionId}
                    </span>
                  ) : (
                    <span className="pill-method nagad">
                      Nagad · TrxID: {confirmedOrder.transactionId}
                    </span>
                  )}
                </span>
              </div>

              <div className="receipt-item-row">
                <span className="receipt-k">Delivery Destination</span>
                <span className="receipt-v text-right">
                  {confirmedOrder.address}, {confirmedOrder.area},{" "}
                  {confirmedOrder.district}
                </span>
              </div>

              <div className="receipt-item-row">
                <span className="receipt-k">Customer Contact</span>
                <span className="receipt-v">{confirmedOrder.customerPhone}</span>
              </div>

              <div className="receipt-separator" />

              <div className="receipt-item-row total-row">
                <span className="total-k">Total Amount Payable</span>
                <span className="total-v">{money(confirmedOrder.totalAmount)}</span>
              </div>
            </div>

            <div className="dispatch-callout">
              <FiPhone className="dispatch-icon" />
              <div>
                <strong>Verification Call Coming Soon</strong>
                <p>
                  Our fulfillment team will call {confirmedOrder.customerPhone} to verify
                  your size and delivery window before dispatch.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleFinish}
              className="oofy-main-submit-btn"
            >
              Continue Browsing Collection
            </button>
          </div>
        ) : (
          /* Checkout Main Form */
          <form onSubmit={submit} className="oofy-checkout-body" noValidate>
            {/* Left Side: Delivery & Payment Details */}
            <div className="oofy-form-col">
              {/* Card 1: Delivery Details */}
              <div className="oofy-card">
                <div className="card-header-row">
                  <div className="header-icon-box">
                    <FiMapPin />
                  </div>
                  <div>
                    <h3 className="card-title">Delivery Details</h3>
                    <p className="card-subtitle">
                      Where should we deliver your OOFY package?
                    </p>
                  </div>
                </div>

                <div className="fields-grid">
                  {/* Full Name */}
                  <div className="field-group span-2">
                    <label htmlFor="customerName">
                      <FiUser className="label-icon" /> Full Name <span className="star">*</span>
                    </label>
                    <div className="input-wrap">
                      <input
                        id="customerName"
                        type="text"
                        placeholder="e.g. Tanvir Ahmed"
                        value={form.customerName}
                        onChange={(e) =>
                          setForm({ ...form, customerName: e.target.value })
                        }
                        autoComplete="name"
                        required
                      />
                    </div>
                  </div>

                  {/* Mobile Phone */}
                  <div className="field-group">
                    <label htmlFor="customerPhone">
                      <FiPhone className="label-icon" /> Mobile Number <span className="star">*</span>
                    </label>
                    <div className="input-wrap with-prefix">
                      <span className="phone-prefix">+880</span>
                      <input
                        id="customerPhone"
                        type="tel"
                        placeholder="17XXXXXXXX"
                        value={form.customerPhone.replace(/^\+?880/, "")}
                        onChange={(e) =>
                          setForm({ ...form, customerPhone: e.target.value })
                        }
                        autoComplete="tel"
                        required
                      />
                    </div>
                    <span className="field-hint">For confirmation call & delivery SMS</span>
                  </div>

                  {/* Email */}
                  <div className="field-group">
                    <label htmlFor="customerEmail">
                      <FiMail className="label-icon" /> Email Address <span className="optional">(Optional)</span>
                    </label>
                    <div className="input-wrap">
                      <input
                        id="customerEmail"
                        type="email"
                        placeholder="tanvir@example.com"
                        value={form.customerEmail}
                        onChange={(e) =>
                          setForm({ ...form, customerEmail: e.target.value })
                        }
                        autoComplete="email"
                      />
                    </div>
                    <span className="field-hint">For digital receipt & invoice</span>
                  </div>

                  {/* District */}
                  <div className="field-group">
                    <label htmlFor="district" className="flex items-center justify-between">
                      <span><FiMapPin className="label-icon" /> District <span className="star">*</span></span>
                      <span className="text-[10px] text-ink/50 font-normal">
                        Dhaka: ৳{deliveryRates.insideDhaka} | Other: ৳{deliveryRates.outsideDhaka}
                      </span>
                    </label>
                    <div className="input-wrap select-wrap">
                      <select
                        id="district"
                        value={form.district}
                        onChange={(e) =>
                          setForm({ ...form, district: e.target.value })
                        }
                      >
                        {BD_DISTRICTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <FiChevronDown className="select-arrow" />
                    </div>
                  </div>

                  {/* Area / Thana */}
                  <div className="field-group">
                    <label htmlFor="area">
                      Area / Thana / Upazila <span className="star">*</span>
                    </label>
                    <div className="input-wrap">
                      <input
                        id="area"
                        type="text"
                        placeholder="e.g. Dhanmondi, Mirpur, Uttara"
                        value={form.area}
                        onChange={(e) =>
                          setForm({ ...form, area: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Custom District if 'Other' */}
                  {form.district === "Other" && (
                    <div className="field-group span-2">
                      <label htmlFor="customDistrict">
                        District Name <span className="star">*</span>
                      </label>
                      <div className="input-wrap">
                        <input
                          id="customDistrict"
                          type="text"
                          placeholder="Enter your district"
                          value={form.customDistrict}
                          onChange={(e) =>
                            setForm({ ...form, customDistrict: e.target.value })
                          }
                          required
                        />
                      </div>
                    </div>
                  )}

                  {/* Street Address */}
                  <div className="field-group span-2">
                    <label htmlFor="address">
                      Street Address / House / Road <span className="star">*</span>
                    </label>
                    <div className="input-wrap">
                      <textarea
                        id="address"
                        rows={2}
                        placeholder="House No., Road No., Flat / Floor, Landmark..."
                        value={form.address}
                        onChange={(e) =>
                          setForm({ ...form, address: e.target.value })
                        }
                        required
                      />
                    </div>
                  </div>

                  {/* Order Note */}
                  <div className="field-group span-2">
                    <label htmlFor="orderNotes">
                      <FiFileText className="label-icon" /> Order Notes <span className="optional">(Optional)</span>
                    </label>
                    <div className="input-wrap">
                      <input
                        id="orderNotes"
                        type="text"
                        placeholder="Any special instructions for courier delivery"
                        value={form.orderNotes}
                        onChange={(e) =>
                          setForm({ ...form, orderNotes: e.target.value })
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Card 2: Payment Method */}
              <div className="oofy-card">
                <div className="card-header-row">
                  <div className="header-icon-box">
                    <FiShield />
                  </div>
                  <div>
                    <h3 className="card-title">Payment Method</h3>
                    <p className="card-subtitle">
                      Choose how you would like to complete your order
                    </p>
                  </div>
                </div>

                {/* 3 Payment Options */}
                <div className="payment-cards-grid">
                  {/* Option 1: Cash on Delivery */}
                  <div
                    className={`payment-method-card ${
                      paymentMethod === "COD" ? "selected" : ""
                    }`}
                    onClick={() => setPaymentMethod("COD")}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="method-card-top">
                      <div className="method-icon-circle cod-icon">
                        <FiTruck />
                      </div>
                      <div className="custom-radio">
                        <span className="radio-inner" />
                      </div>
                    </div>
                    <span className="method-card-name">Cash on Delivery</span>
                    <p className="method-card-desc">
                      Pay cash upon delivery to the courier at your door.
                    </p>
                    <span className="method-pill cod-pill">Verified Doorstep</span>
                  </div>

                  {/* Option 2: bKash */}
                  <div
                    className={`payment-method-card bkash-theme ${
                      paymentMethod === "BKASH" ? "selected" : ""
                    }`}
                    onClick={() => setPaymentMethod("BKASH")}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="method-card-top">
                      <div className="method-icon-circle bkash-icon">
                        <FiSmartphone />
                      </div>
                      <div className="custom-radio">
                        <span className="radio-inner" />
                      </div>
                    </div>
                    <span className="method-card-name">bKash</span>
                    <p className="method-card-desc">
                      Send Money or Payment via bKash mobile wallet.
                    </p>
                    <span className="method-pill bkash-pill">Instant Payment</span>
                  </div>

                  {/* Option 3: Nagad */}
                  <div
                    className={`payment-method-card nagad-theme ${
                      paymentMethod === "NAGAD" ? "selected" : ""
                    }`}
                    onClick={() => setPaymentMethod("NAGAD")}
                    role="button"
                    tabIndex={0}
                  >
                    <div className="method-card-top">
                      <div className="method-icon-circle nagad-icon">
                        <FiSmartphone />
                      </div>
                      <div className="custom-radio">
                        <span className="radio-inner" />
                      </div>
                    </div>
                    <span className="method-card-name">Nagad</span>
                    <p className="method-card-desc">
                      Send Money or Payment via Nagad mobile wallet.
                    </p>
                    <span className="method-pill nagad-pill">Instant Payment</span>
                  </div>
                </div>

                {/* Sub-panel: Cash on Delivery info */}
                {paymentMethod === "COD" && (
                  <div className="method-info-banner cod-info">
                    <FiShield className="banner-icon" />
                    <div>
                      <strong>No Advance Payment Needed</strong>
                      <p>
                        Inspect the package before handing over cash to our delivery
                        partner. 100% genuine guaranteed.
                      </p>
                    </div>
                  </div>
                )}

                {/* Sub-panel: bKash / Nagad Manual Payment Guide */}
                {(paymentMethod === "BKASH" || paymentMethod === "NAGAD") && (
                  <div
                    className={`mobile-payment-panel ${
                      paymentMethod === "BKASH" ? "bkash-panel" : "nagad-panel"
                    }`}
                  >
                    <div className="panel-badge-row">
                      <span className="panel-badge">
                        {paymentMethod === "BKASH" ? "bKash Transfer" : "Nagad Transfer"}
                      </span>
                      <span className="panel-hint">Personal / Send Money</span>
                    </div>

                    {/* Official Phone Number Card with Copy */}
                    <div className="store-number-card">
                      <div>
                        <span className="number-label">
                          Send <b>{money(total)}</b> to this {paymentMethod === "BKASH" ? "bKash" : "Nagad"} Number:
                        </span>
                        <div className="number-val font-mono">{activeStoreNumber}</div>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleCopy(activeStoreNumber, paymentMethod)}
                        className="copy-btn"
                        aria-label="Copy phone number"
                      >
                        {copied === paymentMethod ? (
                          <>
                            <FiCheck className="text-emerald-500" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <FiCopy />
                            <span>Copy Number</span>
                          </>
                        )}
                      </button>
                    </div>

                    {/* 3 Step Instruction Chips */}
                    <div className="instruction-steps">
                      <div className="step-chip">
                        <span className="chip-num">1</span>
                        <span>Open your {paymentMethod === "BKASH" ? "bKash" : "Nagad"} app or USSD</span>
                      </div>
                      <div className="step-chip">
                        <span className="chip-num">2</span>
                        <span>Send Money <b>{money(total)}</b> to <b>{activeStoreNumber}</b></span>
                      </div>
                      <div className="step-chip">
                        <span className="chip-num">3</span>
                        <span>Type your Sender Number and Transaction ID below</span>
                      </div>
                    </div>

                    {/* Input Fields */}
                    <div className="mobile-payment-inputs">
                      <div className="field-group">
                        <label htmlFor="paymentNumber">
                          Sender {paymentMethod === "BKASH" ? "bKash" : "Nagad"} Number <span className="star">*</span>
                        </label>
                        <div className="input-wrap">
                          <input
                            id="paymentNumber"
                            type="tel"
                            placeholder="01XXXXXXXXX"
                            value={form.paymentNumber}
                            onChange={(e) =>
                              setForm({ ...form, paymentNumber: e.target.value })
                            }
                            required
                          />
                        </div>
                        <span className="field-hint">The mobile number you used to send payment</span>
                      </div>

                      <div className="field-group">
                        <label htmlFor="transactionId">
                          Transaction ID (TrxID) <span className="star">*</span>
                        </label>
                        <div className="input-wrap">
                          <input
                            id="transactionId"
                            type="text"
                            placeholder="e.g. BKA8X92K1L"
                            value={form.transactionId}
                            onChange={(e) =>
                              setForm({
                                ...form,
                                transactionId: e.target.value.toUpperCase(),
                              })
                            }
                            className="font-mono uppercase font-semibold"
                            required
                          />
                        </div>
                        <span className="field-hint">Find this in your SMS confirmation</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Side: Order Summary & Action */}
            <div className="oofy-summary-col">
              <div className="oofy-summary-card">
                <div className="summary-head">
                  <div className="summary-title-group">
                    <FiShoppingBag className="bag-icon" />
                    <h4>Order Summary</h4>
                  </div>
                  <span className="items-count-badge">
                    {items.reduce((n, i) => n + i.quantity, 0)} Item(s)
                  </span>
                </div>

                {/* Items List */}
                <div className="summary-items-scroll">
                  {items.length === 0 ? (
                    <div className="checkout-empty-state-box">
                      <FiShoppingBag className="mx-auto text-3xl text-gray-400 mb-2" />
                      <p>Your bag is empty. Please add items to complete checkout.</p>
                      <button
                        type="button"
                        onClick={onClose}
                        className="rounded-xl bg-[#111] px-5 py-2.5 text-xs font-bold uppercase text-white hover:bg-black/80"
                      >
                        Browse Collection
                      </button>
                    </div>
                  ) : (
                    items.map((item) => {
                      const price = Number(productPrice(item.product, item.variant));
                      const imgUrl = item.product.images?.[0]?.url;

                      return (
                        <div key={item.variant.id} className="summary-item-card">
                          <div className="item-thumb-box">
                            {imgUrl ? (
                              <img src={imgUrl} alt={item.product.name} />
                            ) : (
                              <div className="thumb-empty">
                                <FiShoppingBag />
                              </div>
                            )}
                          </div>

                          <div className="item-info-col">
                            <p className="item-name">{item.product.name}</p>
                            <div className="item-variant-chips">
                              <span className="chip">Size: {item.variant.size}</span>
                              {item.variant.color && (
                                <span className="chip">{item.variant.color}</span>
                              )}
                            </div>

                            {/* Quantity Controls & Delete Item (Item 10) */}
                            <div className="checkout-item-actions-row">
                              <div className="checkout-qty-group">
                                <button
                                  type="button"
                                  onClick={() => handleDecrease(item)}
                                  className="checkout-qty-btn"
                                  aria-label="Decrease quantity"
                                >
                                  {item.quantity === 1 ? (
                                    <FiTrash2 className="text-rose-500 text-xs" />
                                  ) : (
                                    "−"
                                  )}
                                </button>
                                <span className="checkout-qty-val">
                                  {item.quantity}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleIncrease(item)}
                                  className="checkout-qty-btn"
                                  aria-label="Increase quantity"
                                  disabled={
                                    item.variant?.stock !== undefined &&
                                    item.quantity >= item.variant.stock
                                  }
                                >
                                  +
                                </button>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleDelete(item)}
                                className="checkout-remove-btn"
                                title="Remove item"
                                aria-label="Remove item"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </div>

                          <div className="text-right flex flex-col justify-between items-end">
                            <strong className="item-price-val">
                              {money(price * item.quantity)}
                            </strong>
                            {item.quantity > 1 && (
                              <span className="text-[10px] text-gray-400">
                                {money(price)} ea
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Pricing Breakdown */}
                <div className="summary-calc-box">
                  <div className="calc-row">
                    <span>Subtotal</span>
                    <span className="font-semibold">{money(subtotal)}</span>
                  </div>

                  <div className="calc-row">
                    <span>Delivery Charge ({isDhaka ? "Inside Dhaka" : "Outside Dhaka"})</span>
                    <span>
                      {effectiveShipping === 0 ? (
                        <span className="free-shipping-pill">FREE</span>
                      ) : (
                        money(effectiveShipping)
                      )}
                    </span>
                  </div>

                  {effectiveShipping === 0 && subtotal > 0 && (
                    <div className="free-unlocked-banner">
                      ✦ Free Delivery Unlocked
                    </div>
                  )}

                  <div className="calc-divider" />

                  <div className="calc-row total-calc-row">
                    <div>
                      <span className="grand-label">Total Payable</span>
                      <small className="tax-hint">All taxes & packaging included</small>
                    </div>
                    <strong className="grand-amount">{money(total)}</strong>
                  </div>
                </div>

                {/* Error Banner */}
                {error && (
                  <div className="oofy-error-alert" role="alert">
                    <FiAlertCircle className="error-icon" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Submit / Confirm Button */}
                <button
                  type="submit"
                  disabled={busy || items.length === 0}
                  className="oofy-main-submit-btn"
                >
                  {busy ? (
                    <span className="btn-loading-flex">
                      <span className="oofy-spinner" /> Confirming your order…
                    </span>
                  ) : paymentMethod === "COD" ? (
                    <>
                      <span>Confirm Order · Cash on Delivery</span>
                      <FiArrowRight className="btn-arrow" />
                    </>
                  ) : paymentMethod === "BKASH" ? (
                    <>
                      <span>Confirm Order · bKash ({money(total)})</span>
                      <FiArrowRight className="btn-arrow" />
                    </>
                  ) : (
                    <>
                      <span>Confirm Order · Nagad ({money(total)})</span>
                      <FiArrowRight className="btn-arrow" />
                    </>
                  )}
                </button>

                {/* Security Trust Features */}
                <div className="summary-trust-row">
                  <div className="trust-cell">
                    <FiLock className="trust-icon" />
                    <span>Encrypted & Safe</span>
                  </div>
                  <div className="trust-cell">
                    <FiShield className="trust-icon" />
                    <span>14-Day Exchange</span>
                  </div>
                </div>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
