"use client";

import { FiMinus, FiPlus, FiTrash2 } from "react-icons/fi";
import { CartItem, money, productPrice } from "./types";
import { CloseButton } from "./StoreHeader";

type Props = {
  items: CartItem[];
  shipping: number;
  onClose: () => void;
  onQuantity: (index: number, quantity: number) => void;
  onCheckout: () => void;
};

export function CartDrawer({
  items,
  shipping,
  onClose,
  onQuantity,
  onCheckout,
}: Props) {
  const subtotal = items.reduce(
    (total, item) =>
      total + Number(productPrice(item.product, item.variant)) * item.quantity,
    0
  );

  const totalCount = items.reduce((n, item) => n + item.quantity, 0);

  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <aside className="cart-drawer" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-head">
          <div>
            <p className="eyebrow">Your selection</p>
            <h2>Bag ({totalCount})</h2>
          </div>
          <CloseButton onClick={onClose} />
        </div>

        <div className="cart-lines">
          {items.length ? (
            items.map((item, index) => {
              const itemKey = `${item.product.id}-${
                item.variant.id || item.variant.size
              }-${item.variant.color || ""}-${index}`;

              return (
                <div className="cart-line" key={itemKey}>
                  <div className="cart-thumb">
                    {item.product.images[0] ? (
                      <img src={item.product.images[0].url} alt={item.product.name} />
                    ) : (
                      <div className="image-fallback">OOFY</div>
                    )}
                  </div>
                  <div className="cart-item-details">
                    <b>{item.product.name}</b>
                    <p className="cart-variant-tag">
                      Size: <span>{item.variant.size}</span>
                      {item.variant.color ? ` / ${item.variant.color}` : ""}
                    </p>
                    <div className="quantity">
                      <button
                        type="button"
                        onClick={() => onQuantity(index, item.quantity - 1)}
                        aria-label="Decrease quantity"
                      >
                        <FiMinus />
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => onQuantity(index, item.quantity + 1)}
                        aria-label="Increase quantity"
                      >
                        <FiPlus />
                      </button>
                    </div>
                  </div>
                  <div className="cart-item-right">
                    <strong>
                      {money(
                        Number(productPrice(item.product, item.variant)) *
                          item.quantity
                      )}
                    </strong>
                    <button
                      type="button"
                      onClick={() => onQuantity(index, 0)}
                      className="cart-delete-btn"
                      title="Remove item"
                      aria-label="Remove item"
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <p className="empty-bag">Your bag is waiting.</p>
          )}
        </div>

        {items.length > 0 && (
          <div className="cart-total">
            <p>
              <span>Subtotal</span>
              <b>{money(subtotal)}</b>
            </p>
            <p>
              <span>Delivery</span>
              <b>{shipping ? money(shipping) : "Free"}</b>
            </p>
            <p className="grand-total">
              <span>Total</span>
              <b>{money(subtotal + shipping)}</b>
            </p>
            <button onClick={onCheckout} className="primary-button">
              Proceed to Checkout →
            </button>
          </div>
        )}
      </aside>
    </div>
  );
}
