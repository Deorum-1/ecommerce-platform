"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number | string;
  currency: string;
  inventoryQuantity: number;
  imageUrls: string[];
  category: { name: string } | null;
  variants: ProductVariant[];
};

type ProductVariant = {
  id: string;
  name: string;
  price: number | string | null;
  inventoryQuantity: number;
};

type CartLine = {
  productId: string;
  variantId?: string;
  quantity: number;
};

type CartItem = {
  key: string;
  line: CartLine;
  product: Product;
  variant?: ProductVariant;
  unitPrice: number;
};

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
const STORE_SLUG = process.env.NEXT_PUBLIC_STOREFRONT_TENANT_SLUG || "";
const EMPTY_CHECKOUT = {
  customerName: "",
  customerEmail: "",
  customerPhone: "",
  shippingAddress: "",
  shippingCity: "",
  shippingState: "",
};

function getApiError(body: unknown): string {
  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    typeof body.message === "string"
  ) {
    return body.message;
  }
  if (
    typeof body === "object" &&
    body !== null &&
    "message" in body &&
    Array.isArray(body.message)
  ) {
    return body.message.join(", ");
  }
  return "The request could not be completed.";
}

function parseCart(value: unknown): Record<string, CartLine> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(value).filter(
      ([, line]) =>
        typeof line === "object" &&
        line !== null &&
        "productId" in line &&
        typeof line.productId === "string" &&
        "quantity" in line &&
        Number.isInteger(line.quantity) &&
        line.quantity > 0 &&
        (!("variantId" in line) || typeof line.variantId === "string"),
    ),
  ) as Record<string, CartLine>;
}

const formatPrice = (price: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    maximumFractionDigits: 0,
  }).format(price);

export default function Home() {
  const [products, setProducts] = useState<Product[]>([]);
  const [storeSlug, setStoreSlug] = useState(STORE_SLUG);
  const [activeCategory, setActiveCategory] = useState("Everything");
  const [search, setSearch] = useState("");
  const [cart, setCart] = useState<Record<string, CartLine>>({});
  const [cartLoaded, setCartLoaded] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [catalogError, setCatalogError] = useState("");
  const [selectedVariants, setSelectedVariants] = useState<
    Record<string, string>
  >({});
  const [checkout, setCheckout] = useState(EMPTY_CHECKOUT);
  const [checkoutError, setCheckoutError] = useState("");
  const [submittingCheckout, setSubmittingCheckout] = useState(false);

  useEffect(() => {
    const querySlug = new URLSearchParams(window.location.search).get("store");
    if (querySlug) setStoreSlug(querySlug);
  }, []);

  useEffect(() => {
    if (!storeSlug) {
      setCart({});
      setCartLoaded(false);
      setLoadingProducts(false);
      return;
    }

    try {
      const savedCart = window.localStorage.getItem(`store-cart:${storeSlug}`);
      setCart(savedCart ? parseCart(JSON.parse(savedCart)) : {});
      setCartLoaded(true);
    } catch {
      setCart({});
      setCartLoaded(true);
    }
  }, [storeSlug]);

  useEffect(() => {
    if (cartLoaded && storeSlug) {
      window.localStorage.setItem(
        `store-cart:${storeSlug}`,
        JSON.stringify(cart),
      );
    }
  }, [cart, cartLoaded, storeSlug]);

  useEffect(() => {
    if (!storeSlug) return;
    let active = true;
    setLoadingProducts(true);
    setCatalogError("");

    void fetch(
      `${API_URL}/storefront/${encodeURIComponent(storeSlug)}/products`,
    )
      .then(async (response) => {
        const body: unknown = await response.json();
        if (!response.ok) throw new Error(getApiError(body));
        if (!Array.isArray(body))
          throw new Error("The store returned invalid products.");
        if (active) setProducts(body as Product[]);
      })
      .catch((error: unknown) => {
        if (active) {
          setCatalogError(
            error instanceof Error ? error.message : "Could not load products.",
          );
        }
      })
      .finally(() => {
        if (active) setLoadingProducts(false);
      });

    return () => {
      active = false;
    };
  }, [storeSlug]);

  const categories = useMemo(
    () => [
      "Everything",
      ...new Set(
        products
          .map((product) => product.category?.name)
          .filter((name): name is string => Boolean(name)),
      ),
    ],
    [products],
  );

  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    return products.filter((product) => {
      const matchesCategory =
        activeCategory === "Everything" ||
        product.category?.name === activeCategory;
      const matchesSearch =
        !query ||
        `${product.name} ${product.category?.name || ""}`
          .toLowerCase()
          .includes(query);
      return matchesCategory && matchesSearch;
    });
  }, [activeCategory, products, search]);

  const cartItems: CartItem[] = Object.entries(cart).flatMap(([key, line]) => {
    const product = products.find(
      (candidate) => candidate.id === line.productId,
    );
    if (!product) return [];
    const variant = line.variantId
      ? product.variants.find((candidate) => candidate.id === line.variantId)
      : undefined;
    if (line.variantId && !variant) return [];
    return [
      {
        key,
        line,
        product,
        variant,
        unitPrice: Number(variant?.price ?? product.price),
      },
    ];
  });
  const itemCount = cartItems.reduce(
    (total, item) => total + item.line.quantity,
    0,
  );
  const subtotal = cartItems.reduce(
    (total, item) => total + item.unitPrice * item.line.quantity,
    0,
  );

  function changeQuantity(key: string, amount: number) {
    setCart((currentCart) => {
      const line = currentCart[key];
      if (!line) return currentCart;
      const product = products.find(
        (candidate) => candidate.id === line.productId,
      );
      const variant = line.variantId
        ? product?.variants.find((candidate) => candidate.id === line.variantId)
        : undefined;
      const stock =
        variant?.inventoryQuantity ?? product?.inventoryQuantity ?? 0;
      const nextQuantity = line.quantity + amount;
      if (nextQuantity <= 0) {
        const remainingItems = { ...currentCart };
        delete remainingItems[key];
        return remainingItems;
      }
      if (nextQuantity > stock) return currentCart;
      return { ...currentCart, [key]: { ...line, quantity: nextQuantity } };
    });
  }

  function addProductToCart(product: Product) {
    const variantId =
      selectedVariants[product.id] || product.variants[0]?.id || undefined;
    const variant = variantId
      ? product.variants.find((candidate) => candidate.id === variantId)
      : undefined;
    if (product.variants.length > 0 && !variant) return;
    const stock = variant?.inventoryQuantity ?? product.inventoryQuantity;
    if (stock < 1) return;
    const key = `${product.id}:${variantId || ""}`;
    setCart((currentCart) => {
      const current = currentCart[key];
      if (current && current.quantity >= stock) return currentCart;
      return {
        ...currentCart,
        [key]: {
          productId: product.id,
          variantId,
          quantity: (current?.quantity || 0) + 1,
        },
      };
    });
  }

  async function beginCheckout(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!storeSlug || cartItems.length === 0) return;

    setSubmittingCheckout(true);
    setCheckoutError("");
    try {
      const response = await fetch(
        `${API_URL}/storefront/${encodeURIComponent(storeSlug)}/orders`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...checkout,
            items: cartItems.map(({ line }) => line),
          }),
        },
      );
      const body: unknown = await response.json();
      if (!response.ok) throw new Error(getApiError(body));
      if (
        typeof body !== "object" ||
        body === null ||
        !("authorizationUrl" in body) ||
        typeof body.authorizationUrl !== "string"
      ) {
        throw new Error("The payment provider did not return a checkout link.");
      }
      window.location.assign(body.authorizationUrl);
    } catch (error) {
      setCheckoutError(
        error instanceof Error ? error.message : "Could not start checkout.",
      );
      setSubmittingCheckout(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#fbfaf7] text-[#29271f]">
      <div className="bg-[#263b30] px-4 py-2.5 text-center text-xs font-medium tracking-wide text-white sm:text-sm">
        A little something for your home — free Lagos delivery over ₦50,000
      </div>

      <header className="border-b border-[#eae7df] bg-[#fbfaf7]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-5 sm:px-8">
          <a
            aria-label="Morrow home"
            className="shrink-0 text-[1.65rem] font-semibold leading-none tracking-[-.08em] text-[#263b30]"
            href="#home"
          >
            morrow<span className="text-[#d58452]">.</span>
          </a>
          <nav
            aria-label="Main navigation"
            className="hidden items-center gap-8 text-sm font-medium text-[#68665f] md:flex"
          >
            <a className="hover:text-[#263b30]" href="#collection">
              Shop all
            </a>
            <a className="hover:text-[#263b30]" href="#story">
              Our approach
            </a>
            <a className="hover:text-[#263b30]" href="#delivery">
              Delivery
            </a>
          </nav>
          <div className="flex items-center gap-3 sm:gap-5">
            <label className="hidden items-center gap-2 border-b border-[#d8d5cc] pb-1 text-[#77756e] sm:flex">
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="10.8"
                  cy="10.8"
                  r="6.8"
                  stroke="currentColor"
                  strokeWidth="1.6"
                />
                <path
                  d="m16 16 4 4"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.6"
                />
              </svg>
              <input
                aria-label="Search the collection"
                className="w-28 bg-transparent text-sm outline-none placeholder:text-[#99968d] focus:w-40"
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search"
                value={search}
              />
            </label>
            <button
              aria-expanded={cartOpen}
              aria-label={`Open bag, ${itemCount} items`}
              className="flex items-center gap-2 text-sm font-semibold text-[#263b30] hover:text-[#d58452]"
              onClick={() => setCartOpen(true)}
              type="button"
            >
              <svg
                aria-hidden="true"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <path
                  d="M5 8h14l1 12H4L5 8Z"
                  stroke="currentColor"
                  strokeLinejoin="round"
                  strokeWidth="1.6"
                />
                <path
                  d="M9 9V6a3 3 0 0 1 6 0v3"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="1.6"
                />
              </svg>
              Bag <span>({itemCount})</span>
            </button>
          </div>
        </div>
        <div className="border-t border-[#eae7df] px-5 py-3 sm:hidden">
          <label className="flex items-center gap-2 rounded-full bg-[#f0eee8] px-4 py-2.5 text-[#77756e]">
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle
                cx="10.8"
                cy="10.8"
                r="6.8"
                stroke="currentColor"
                strokeWidth="1.6"
              />
              <path
                d="m16 16 4 4"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="1.6"
              />
            </svg>
            <input
              aria-label="Search the collection"
              className="w-full bg-transparent text-sm outline-none placeholder:text-[#99968d]"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Find something lovely"
              value={search}
            />
          </label>
        </div>
      </header>

      <section
        className="mx-auto grid max-w-7xl items-center gap-10 px-5 pb-14 pt-10 sm:px-8 sm:pb-20 sm:pt-16 lg:grid-cols-[1fr_.95fr] lg:gap-16"
        id="home"
      >
        <div className="max-w-xl">
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[.19em] text-[#b7724d]">
            <span className="h-px w-7 bg-[#b7724d]" />
            Everyday objects, considered
          </p>
          <h1 className="mt-5 font-serif text-[3.4rem] leading-[.99] tracking-[-.055em] text-[#263b30] sm:text-7xl">
            Make room for
            <br />
            <span className="italic">the good</span> things.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-[#77756e] sm:text-lg sm:leading-8">
            Thoughtful pieces for slower mornings, softer evenings, and all the
            little moments in between.
          </p>
          <a
            className="mt-8 inline-flex items-center gap-3 rounded-full bg-[#263b30] px-6 py-3.5 text-sm font-semibold text-white transition hover:bg-[#395443]"
            href="#collection"
          >
            Explore the collection <span aria-hidden="true">→</span>
          </a>
          <div className="mt-9 flex items-center gap-3 text-xs text-[#77756e]">
            <div className="flex -space-x-2">
              {["bg-[#cf9f7a]", "bg-[#7d8b72]", "bg-[#d5c0a2]"].map((color) => (
                <span
                  aria-hidden="true"
                  className={`grid h-7 w-7 place-items-center rounded-full border-2 border-[#fbfaf7] ${color}`}
                  key={color}
                >
                  <span className="h-2 w-2 rounded-full bg-white/80" />
                </span>
              ))}
            </div>
            <span>
              Made for your home,{" "}
              <strong className="font-semibold text-[#4f4d45]">
                made to be kept
              </strong>
            </span>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[560px]">
          <div className="absolute -left-4 top-12 z-10 rounded-full border border-white/70 bg-[#fbfaf7]/90 px-4 py-2 text-xs font-medium text-[#55554a] shadow-sm backdrop-blur sm:-left-7">
            The Sunday edit · No. 04
          </div>
          <div className="relative grid aspect-[1.14/1] grid-cols-[1.05fr_.95fr] gap-3 overflow-hidden rounded-[2rem] bg-[#e7e2d7] p-3 sm:gap-4 sm:rounded-[2.4rem] sm:p-4">
            <div className="relative flex flex-col items-center justify-center overflow-hidden rounded-[1.5rem] bg-[#c4c6ad]">
              <span className="absolute -left-10 top-8 h-40 w-40 rounded-full bg-[#d6d5bd]" />
              <span className="absolute -bottom-14 -right-10 h-48 w-48 rounded-full bg-[#87927a]" />
              <div className="relative grid h-44 w-36 place-items-center rounded-t-[48%] rounded-b-[18%] bg-[#e8e1d4] shadow-[inset_-14px_-4px_20px_rgba(87,79,61,.12),0_18px_25px_rgba(64,68,51,.18)] sm:h-56 sm:w-44">
                <span className="absolute -top-16 h-24 w-1 rounded-full bg-[#626f56] sm:-top-20 sm:h-32" />
                <span className="absolute -top-12 -left-5 h-20 w-12 rotate-[-28deg] rounded-[100%_0_100%_0] bg-[#748064] sm:-top-16 sm:h-24" />
                <span className="absolute -top-10 right-0 h-20 w-12 rotate-[35deg] rounded-[100%_0_100%_0] bg-[#899276] sm:-top-14 sm:h-24" />
                <span className="absolute top-2 h-2 w-16 rounded-full bg-[#b5aa92] sm:w-20" />
              </div>
              <p className="absolute bottom-4 left-4 text-[10px] font-medium uppercase tracking-[.2em] text-[#f7f4e9]/90 sm:bottom-6 sm:left-6">
                Objects with a story
              </p>
            </div>
            <div className="grid grid-rows-[1fr_auto] gap-3 sm:gap-4">
              <div className="relative flex items-center justify-center overflow-hidden rounded-[1.5rem] bg-[#d6c3ad]">
                <span className="absolute -right-5 -top-7 h-32 w-32 rounded-full bg-[#e4d7c7]" />
                <span className="relative text-[5rem] drop-shadow-[0_12px_12px_rgba(78,57,38,.18)] sm:text-[7rem]">
                  🏺
                </span>
                <span className="absolute bottom-4 left-4 rounded-full bg-white/65 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#61584d] backdrop-blur">
                  Hand finished
                </span>
              </div>
              <div className="flex min-h-24 items-center justify-between rounded-[1.5rem] bg-[#f4efe6] px-4 py-4 sm:px-5">
                <div>
                  <p className="text-xs text-[#8b8679]">A softer space</p>
                  <p className="mt-1 text-sm font-semibold text-[#263b30] sm:text-base">
                    Little rituals, daily
                  </p>
                </div>
                <span aria-hidden="true" className="text-3xl">
                  ☼
                </span>
              </div>
            </div>
          </div>
          <span className="absolute -bottom-5 right-6 grid h-14 w-14 place-items-center rounded-full bg-[#d58452] text-center text-[10px] font-semibold leading-tight text-white shadow-lg sm:right-10 sm:h-16 sm:w-16">
            Made
            <br />
            with care
          </span>
        </div>
      </section>

      <section
        className="border-y border-[#eae7df] bg-[#f5f3ed] py-5"
        id="delivery"
      >
        <div className="mx-auto flex max-w-7xl flex-wrap justify-center gap-x-10 gap-y-3 px-5 text-xs font-medium text-[#646258] sm:gap-x-16 sm:text-sm">
          <span className="flex items-center gap-2">
            <span className="text-[#b7724d]">✳</span> Designed for everyday
          </span>
          <span className="flex items-center gap-2">
            <span className="text-[#b7724d]">✳</span> Packed with care
          </span>
          <span className="flex items-center gap-2">
            <span className="text-[#b7724d]">✳</span> Delivery across Nigeria
          </span>
        </div>
      </section>

      <section
        className="mx-auto max-w-7xl px-5 py-14 sm:px-8 sm:py-20"
        id="collection"
      >
        <div className="flex flex-wrap items-end justify-between gap-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#b7724d]">
              A few good things
            </p>
            <h2 className="mt-2 font-serif text-4xl tracking-[-.04em] text-[#263b30] sm:text-5xl">
              The considered collection
            </h2>
          </div>
          <span className="rounded-full border border-[#e7e3da] px-3 py-1.5 text-[11px] font-medium text-[#8a867c]">
            {storeSlug ? "Live store catalog" : "Store setup required"}
          </span>
        </div>

        {!storeSlug && (
          <p className="mt-5 rounded-xl bg-[#f5f3ed] px-4 py-3 text-sm text-[#706e65]">
            Configure NEXT_PUBLIC_STOREFRONT_TENANT_SLUG or open this page with
            a store query, such as <code>?store=your-store-slug</code>.
          </p>
        )}
        {catalogError && (
          <p className="mt-5 rounded-xl bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {catalogError}
          </p>
        )}

        <div className="mt-7 flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              aria-pressed={activeCategory === category}
              className={`shrink-0 rounded-full border px-4 py-2 text-xs font-medium transition ${
                activeCategory === category
                  ? "border-[#263b30] bg-[#263b30] text-white"
                  : "border-[#e5e1d8] bg-transparent text-[#706e65] hover:border-[#263b30] hover:text-[#263b30]"
              }`}
              key={category}
              onClick={() => setActiveCategory(category)}
              type="button"
            >
              {category}
            </button>
          ))}
        </div>

        {loadingProducts ? (
          <p className="mt-8 text-sm text-[#77756e]">Loading the collection…</p>
        ) : visibleProducts.length > 0 ? (
          <div className="mt-5 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 sm:gap-y-10 lg:grid-cols-4">
            {visibleProducts.map((product) => (
              <article className="group min-w-0" key={product.id}>
                <div className="relative flex aspect-[.86/1] items-center justify-center overflow-hidden rounded-2xl bg-[#eee9df] sm:rounded-[1.4rem]">
                  <span className="absolute -right-8 -top-8 h-36 w-36 rounded-full bg-white/25 transition-transform duration-500 group-hover:scale-125" />
                  {product.imageUrls[0] ? (
                    <Image
                      alt={product.name}
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      src={product.imageUrls[0]}
                      unoptimized
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="relative select-none text-[4.5rem] drop-shadow-[0_15px_12px_rgba(68,56,41,.16)] transition-transform duration-500 group-hover:scale-110 sm:text-[6rem]"
                    >
                      ✳
                    </span>
                  )}
                  <button
                    aria-label={`Add ${product.name} to bag`}
                    className="absolute bottom-3 right-3 grid h-10 w-10 place-items-center rounded-full bg-[#fbfaf7] text-xl text-[#263b30] shadow-md transition hover:scale-105 hover:bg-[#263b30] hover:text-white disabled:cursor-not-allowed disabled:opacity-40 sm:bottom-4 sm:right-4"
                    disabled={
                      (product.variants.length > 0
                        ? (
                            product.variants.find(
                              (variant) =>
                                variant.id === selectedVariants[product.id],
                            ) || product.variants[0]
                          ).inventoryQuantity
                        : product.inventoryQuantity) < 1
                    }
                    onClick={() => addProductToCart(product)}
                    type="button"
                  >
                    +
                  </button>
                </div>
                <div className="mt-3 flex items-start justify-between gap-2 sm:mt-4">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[#34332c] sm:text-base">
                      {product.name}
                    </p>
                    <p className="mt-1 text-xs text-[#8a867c]">
                      {product.category?.name || "Uncategorized"}
                    </p>
                  </div>
                  <p className="shrink-0 text-xs font-semibold text-[#34332c] sm:text-sm">
                    {formatPrice(Number(product.price))}
                  </p>
                </div>
                {product.variants.length > 0 && (
                  <label className="mt-3 block text-xs text-[#77756e]">
                    Option
                    <select
                      className="mt-1 w-full rounded-lg border border-[#e5e1d8] bg-white px-2.5 py-2 text-xs text-[#34332c]"
                      onChange={(event) =>
                        setSelectedVariants((current) => ({
                          ...current,
                          [product.id]: event.target.value,
                        }))
                      }
                      value={
                        selectedVariants[product.id] || product.variants[0].id
                      }
                    >
                      {product.variants.map((variant) => (
                        <option
                          disabled={variant.inventoryQuantity < 1}
                          key={variant.id}
                          value={variant.id}
                        >
                          {variant.name}
                          {variant.price
                            ? ` — ${formatPrice(Number(variant.price))}`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="mt-6 rounded-2xl border border-dashed border-[#d9d4c8] px-5 py-14 text-center">
            <p className="font-serif text-2xl text-[#263b30]">
              Nothing in this corner just yet
            </p>
            <p className="mt-2 text-sm text-[#77756e]">
              Try another search or choose a different collection.
            </p>
            {!storeSlug && !catalogError && (
              <p className="mt-2 text-xs text-[#8a867c]">
                The store catalog appears once a tenant slug is configured.
              </p>
            )}
            <button
              className="mt-5 text-sm font-semibold text-[#9b5b39] underline underline-offset-4"
              onClick={() => {
                setSearch("");
                setActiveCategory("Everything");
              }}
              type="button"
            >
              Clear filters
            </button>
          </div>
        )}
      </section>

      <section className="bg-[#e9eee7] px-5 py-14 sm:px-8 sm:py-20" id="story">
        <div className="mx-auto grid max-w-7xl gap-6 md:grid-cols-[.8fr_1.2fr] md:items-center md:gap-16">
          <div className="flex items-center justify-center">
            <div className="relative grid aspect-square w-full max-w-sm place-items-center overflow-hidden rounded-full bg-[#d2ddce]">
              <span className="absolute h-[75%] w-[75%] rounded-full border border-[#a7b59d]" />
              <span className="absolute h-[56%] w-[56%] rounded-full border border-[#a7b59d]" />
              <span className="absolute h-[36%] w-[36%] rounded-full border border-[#a7b59d]" />
              <span className="relative font-serif text-8xl italic text-[#536b50]">
                m.
              </span>
              <span className="absolute bottom-[18%] right-[10%] text-5xl">
                ✿
              </span>
            </div>
          </div>
          <div className="max-w-xl py-4">
            <p className="text-xs font-semibold uppercase tracking-[.18em] text-[#73816a]">
              A little more intentional
            </p>
            <h2 className="mt-3 font-serif text-4xl leading-tight tracking-[-.04em] text-[#263b30] sm:text-5xl">
              Fewer things.
              <br />
              Better everyday.
            </h2>
            <p className="mt-5 text-base leading-7 text-[#676c60]">
              We look for useful shapes, honest materials, and the kind of
              details that feel right at home. Pieces to live with, not just
              look at.
            </p>
            <a
              className="mt-7 inline-flex items-center gap-3 text-sm font-semibold text-[#263b30] hover:text-[#9b5b39]"
              href="#collection"
            >
              Find your everyday piece <span aria-hidden="true">→</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-[#263b30] px-5 py-10 text-white sm:px-8 sm:py-12">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 sm:flex-row sm:items-end">
          <div>
            <a
              className="text-3xl font-semibold tracking-[-.08em]"
              href="#home"
            >
              morrow<span className="text-[#d58452]">.</span>
            </a>
            <p className="mt-3 text-sm text-white/65">
              Good things for the everyday.
            </p>
          </div>
          <p className="max-w-xs text-sm leading-6 text-white/65">
            A sample storefront preview. Product availability and checkout will
            appear when this store is connected.
          </p>
          <p className="text-xs text-white/45">
            © {new Date().getFullYear()} Morrow
          </p>
        </div>
      </footer>

      {cartOpen && (
        <div
          className="fixed inset-0 z-50 flex justify-end"
          onClick={() => setCartOpen(false)}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-[#161912]/45"
          />
          <aside
            aria-label="Shopping bag"
            aria-modal="true"
            className="relative flex h-full w-full max-w-md flex-col bg-[#fbfaf7] shadow-2xl"
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <div className="flex items-center justify-between border-b border-[#eae7df] px-6 py-5">
              <div>
                <p className="font-serif text-2xl text-[#263b30]">
                  Your bag <span className="text-[#9a978d]">({itemCount})</span>
                </p>
                <p className="mt-1 text-xs text-[#858176]">
                  A few good things, all together.
                </p>
              </div>
              <button
                aria-label="Close shopping bag"
                className="grid h-10 w-10 place-items-center rounded-full text-2xl text-[#646258] hover:bg-[#efede6]"
                onClick={() => setCartOpen(false)}
                type="button"
              >
                ×
              </button>
            </div>

            {cartItems.length ? (
              <>
                <div className="flex-1 space-y-5 overflow-y-auto px-6 py-5">
                  {cartItems.map((item) => (
                    <div className="flex gap-4" key={item.key}>
                      {item.product.imageUrls[0] ? (
                        <Image
                          alt=""
                          className="rounded-xl object-cover"
                          height={80}
                          sizes="80px"
                          src={item.product.imageUrls[0]}
                          unoptimized
                          width={80}
                        />
                      ) : (
                        <div className="grid h-20 w-20 shrink-0 place-items-center rounded-xl bg-[#eee9df] text-3xl">
                          <span aria-hidden="true">✳</span>
                        </div>
                      )}
                      <div className="flex min-w-0 flex-1 items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-semibold text-[#34332c]">
                            {item.product.name}
                          </p>
                          <p className="mt-1 text-xs text-[#898579]">
                            {item.variant?.name
                              ? `${item.variant.name} · `
                              : ""}
                            {formatPrice(item.unitPrice)}
                          </p>
                          <div className="mt-3 inline-flex items-center rounded-full border border-[#e4e0d7]">
                            <button
                              aria-label={`Remove one ${item.product.name}`}
                              className="grid h-7 w-8 place-items-center text-[#55534b] hover:text-[#b7724d]"
                              onClick={() => changeQuantity(item.key, -1)}
                              type="button"
                            >
                              −
                            </button>
                            <span className="min-w-6 text-center text-xs">
                              {item.line.quantity}
                            </span>
                            <button
                              aria-label={`Add one ${item.product.name}`}
                              className="grid h-7 w-8 place-items-center text-[#55534b] hover:text-[#b7724d]"
                              onClick={() => changeQuantity(item.key, 1)}
                              type="button"
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <p className="shrink-0 text-xs font-semibold text-[#34332c]">
                          {formatPrice(item.unitPrice * item.line.quantity)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="max-h-[55vh] overflow-y-auto border-t border-[#eae7df] px-6 py-5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-[#77756e]">Subtotal</span>
                    <span className="font-semibold text-[#34332c]">
                      {formatPrice(subtotal)}
                    </span>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-[#8a867c]">
                    Delivery charges are not included. Payment is securely
                    processed by Paystack.
                  </p>
                  {checkoutError && (
                    <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-xs text-rose-700">
                      {checkoutError}
                    </p>
                  )}
                  {!storeSlug && (
                    <p className="mt-3 text-xs text-rose-700">
                      Checkout requires a configured store slug.
                    </p>
                  )}
                  <form className="mt-4 space-y-3" onSubmit={beginCheckout}>
                    <input
                      autoComplete="name"
                      className="w-full rounded-xl border border-[#e5e1d8] bg-white px-3 py-2.5 text-sm"
                      onChange={(event) =>
                        setCheckout({
                          ...checkout,
                          customerName: event.target.value,
                        })
                      }
                      placeholder="Full name"
                      required
                      value={checkout.customerName}
                    />
                    <input
                      autoComplete="email"
                      className="w-full rounded-xl border border-[#e5e1d8] bg-white px-3 py-2.5 text-sm"
                      onChange={(event) =>
                        setCheckout({
                          ...checkout,
                          customerEmail: event.target.value,
                        })
                      }
                      placeholder="Email address"
                      required
                      type="email"
                      value={checkout.customerEmail}
                    />
                    <input
                      autoComplete="tel"
                      className="w-full rounded-xl border border-[#e5e1d8] bg-white px-3 py-2.5 text-sm"
                      onChange={(event) =>
                        setCheckout({
                          ...checkout,
                          customerPhone: event.target.value,
                        })
                      }
                      placeholder="Phone number"
                      required
                      type="tel"
                      value={checkout.customerPhone}
                    />
                    <input
                      autoComplete="street-address"
                      className="w-full rounded-xl border border-[#e5e1d8] bg-white px-3 py-2.5 text-sm"
                      onChange={(event) =>
                        setCheckout({
                          ...checkout,
                          shippingAddress: event.target.value,
                        })
                      }
                      placeholder="Delivery address"
                      required
                      value={checkout.shippingAddress}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input
                        autoComplete="address-level2"
                        className="min-w-0 rounded-xl border border-[#e5e1d8] bg-white px-3 py-2.5 text-sm"
                        onChange={(event) =>
                          setCheckout({
                            ...checkout,
                            shippingCity: event.target.value,
                          })
                        }
                        placeholder="City"
                        required
                        value={checkout.shippingCity}
                      />
                      <input
                        autoComplete="address-level1"
                        className="min-w-0 rounded-xl border border-[#e5e1d8] bg-white px-3 py-2.5 text-sm"
                        onChange={(event) =>
                          setCheckout({
                            ...checkout,
                            shippingState: event.target.value,
                          })
                        }
                        placeholder="State"
                        required
                        value={checkout.shippingState}
                      />
                    </div>
                    <button
                      className="w-full rounded-full bg-[#263b30] px-5 py-3.5 text-sm font-semibold text-white transition hover:bg-[#395443] disabled:cursor-not-allowed disabled:opacity-50"
                      disabled={
                        submittingCheckout || !storeSlug || !cartItems.length
                      }
                      type="submit"
                    >
                      {submittingCheckout
                        ? "Preparing secure checkout…"
                        : "Continue to secure payment"}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
                <span
                  aria-hidden="true"
                  className="grid h-16 w-16 place-items-center rounded-full bg-[#f0eee8] text-2xl"
                >
                  ✳
                </span>
                <p className="mt-5 font-serif text-2xl text-[#263b30]">
                  Your bag is taking a breather
                </p>
                <p className="mt-2 text-sm leading-6 text-[#77756e]">
                  Add something you love and it will be waiting here.
                </p>
                <button
                  className="mt-6 rounded-full bg-[#263b30] px-5 py-3 text-sm font-semibold text-white hover:bg-[#395443]"
                  onClick={() => {
                    setCartOpen(false);
                    document
                      .getElementById("collection")
                      ?.scrollIntoView({ behavior: "smooth" });
                  }}
                  type="button"
                >
                  Explore the collection
                </button>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
