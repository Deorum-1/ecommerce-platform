"use client";

import Link from "next/link";
import { useAuth, useOrganization, UserButton } from "@clerk/nextjs";
import readXlsxFile from "read-excel-file/browser";
import {
  ChangeEvent,
  FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

type Category = { id: string; name: string; slug: string };
type Variant = {
  id?: string;
  name: string;
  sku: string | null;
  price: string | number | null;
  inventoryQuantity: number;
};
type Product = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  price: string | number;
  currency: string;
  status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
  inventoryQuantity: number;
  categoryId: string | null;
  category: Category | null;
  variants: Variant[];
  imageUrls: string[];
};
type ProductDraft = {
  name: string;
  description: string;
  price: string;
  currency: string;
  status: Product["status"];
  categoryId: string;
  inventoryQuantity: string;
  variants: { name: string; sku: string; price: string; inventoryQuantity: string }[];
};
type ImportResult = {
  imported: number;
  failed: number;
  errors: { row: number; message: string }[];
};
type UploadSignature = {
  cloudName: string;
  apiKey: string;
  timestamp: number;
  folder: string;
  allowedFormats: string;
  signature: string;
};

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
).replace(/\/+$/, "");
const SAMPLE_CSV =
  "name,slug,description,price,currency,status,inventoryQuantity,category,imageUrls,variants\r\n" +
  'Everyday Tote,everyday-tote,Canvas tote bag,8500,NGN,DRAFT,24,,,"[{""name"":""Natural"",""sku"":""TOTE-NATURAL"",""inventoryQuantity"":12}]"\r\n';

function parseCsv(text: string): Record<string, unknown>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const source = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < source.length; index += 1) {
    const character = source[index];
    if (quoted) {
      if (character === '"' && source[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        quoted = false;
      } else {
        cell += character;
      }
    } else if (character === '"' && cell.length === 0) {
      quoted = true;
    } else if (character === ",") {
      row.push(cell);
      cell = "";
    } else if (character === "\n" || character === "\r") {
      row.push(cell);
      if (row.some((value) => value.trim())) rows.push(row);
      row = [];
      cell = "";
      if (character === "\r" && source[index + 1] === "\n") index += 1;
    } else {
      cell += character;
    }
  }
  if (quoted) throw new Error("The CSV contains an unfinished quoted field.");
  row.push(cell);
  if (row.some((value) => value.trim())) rows.push(row);

  if (!rows.length) throw new Error("The selected file has no rows.");
  const headers = rows[0].map((header) => header.trim());
  if (!headers.includes("name") || !headers.includes("price")) {
    throw new Error("The file needs at least the name and price columns.");
  }
  return rows.slice(1).map((cells) =>
    Object.fromEntries(
      headers.map((header, index) => [header, (cells[index] || "").trim()]),
    ),
  );
}

function parseSheetRows(rows: unknown[][]): Record<string, unknown>[] {
  const [headerRow, ...dataRows] = rows;
  if (!headerRow?.length) throw new Error("The selected workbook has no rows.");
  const headers = headerRow.map((value) => String(value ?? "").trim());
  if (!headers.includes("name") || !headers.includes("price")) {
    throw new Error("The file needs at least the name and price columns.");
  }
  return dataRows
    .filter((cells) => cells.some((value) => value !== null && value !== ""))
    .map((cells) =>
      Object.fromEntries(
        headers.map((header, index) => [
          header,
          cells[index] instanceof Date
            ? (cells[index] as Date).toISOString()
            : String(cells[index] ?? "").trim(),
        ]),
      ),
    );
}

const emptyDraft = (): ProductDraft => ({
  name: "",
  description: "",
  price: "",
  currency: "NGN",
  status: "DRAFT",
  categoryId: "",
  inventoryQuantity: "0",
  variants: [],
});

export default function CatalogPage() {
  const { getToken, isLoaded, orgId, orgRole } = useAuth();
  const { organization, isLoaded: organizationLoaded } = useOrganization();
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [section, setSection] = useState<"products" | "categories">("products");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [categoryName, setCategoryName] = useState("");
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [draft, setDraft] = useState<ProductDraft>(emptyDraft);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productDialogOpen, setProductDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const [search, setSearch] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);
  const canManage = orgRole === "org:admin";

  const request = useCallback(
    async <T,>(path: string, init: RequestInit = {}): Promise<T> => {
      const token = await getToken();
      if (!token) throw new Error("Your session expired. Please sign in again.");
      const response = await fetch(`${API_URL}/catalog/${path}`, {
        ...init,
        headers: {
          Authorization: `Bearer ${token}`,
          ...(init.body ? { "Content-Type": "application/json" } : {}),
          ...init.headers,
        },
      });
      if (!response.ok) {
        const payload = (await response.json().catch(() => null)) as
          | { message?: string | string[] }
          | null;
        const message = Array.isArray(payload?.message)
          ? payload.message.join(", ")
          : payload?.message;
        throw new Error(message || `Request failed (${response.status})`);
      }
      if (response.status === 204) return undefined as T;
      return (await response.json()) as T;
    },
    [getToken],
  );

  const loadCatalog = useCallback(async () => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const [nextCategories, nextProducts] = await Promise.all([
        request<Category[]>("categories"),
        request<Product[]>("products"),
      ]);
      setCategories(nextCategories);
      setProducts(nextProducts);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load catalog.");
    } finally {
      setLoading(false);
    }
  }, [orgId, request]);

  useEffect(() => {
    if (isLoaded && organizationLoaded) void loadCatalog();
  }, [isLoaded, organizationLoaded, loadCatalog]);

  function startProduct(product?: Product) {
    setError("");
    setNotice("");
    if (!product) {
      setEditingProduct(null);
      setDraft(emptyDraft());
      setImageUrls([]);
    } else {
      setEditingProduct(product);
      setDraft({
        name: product.name,
        description: product.description || "",
        price: String(product.price),
        currency: product.currency,
        status: product.status,
        categoryId: product.categoryId || "",
        inventoryQuantity: String(product.inventoryQuantity),
        variants: product.variants.map((variant) => ({
          name: variant.name,
          sku: variant.sku || "",
          price: variant.price == null ? "" : String(variant.price),
          inventoryQuantity: String(variant.inventoryQuantity),
        })),
      });
      setImageUrls(product.imageUrls || []);
    }
    setProductDialogOpen(true);
  }

  async function saveCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!categoryName.trim()) return;
    setError("");
    try {
      if (editingCategory) {
        await request(`categories/${editingCategory.id}`, {
          method: "PATCH",
          body: JSON.stringify({ name: categoryName.trim() }),
        });
        setNotice("Category updated.");
      } else {
        await request("categories", {
          method: "POST",
          body: JSON.stringify({ name: categoryName.trim() }),
        });
        setNotice("Category created.");
      }
      setCategoryName("");
      setEditingCategory(null);
      await loadCatalog();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save category.");
    }
  }

  async function deleteCategory(category: Category) {
    if (!window.confirm(`Delete “${category.name}”?`)) return;
    setError("");
    try {
      await request(`categories/${category.id}`, { method: "DELETE" });
      setNotice("Category deleted.");
      await loadCatalog();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete category.");
    }
  }

  async function uploadImages(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    if (!files.length) return;
    setError("");
    const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
    if (imageUrls.length + files.length > 10) {
      setError("A product can have at most 10 images.");
      return;
    }
    for (const file of files) {
      if (!allowedTypes.has(file.type)) {
        setError(`${file.name} must be a JPEG, PNG, WebP, or GIF image.`);
        return;
      }
      if (file.size > 5 * 1024 * 1024) {
        setError(`${file.name} exceeds the 5 MB image limit.`);
        return;
      }
    }
    setUploadingImages(true);
    try {
      const uploaded: string[] = [];
      for (const file of files) {
        const signature = await request<UploadSignature>("images/sign", {
          method: "POST",
          body: JSON.stringify({}),
        });
        const body = new FormData();
        body.append("file", file);
        body.append("api_key", signature.apiKey);
        body.append("timestamp", String(signature.timestamp));
        body.append("folder", signature.folder);
        body.append("allowed_formats", signature.allowedFormats);
        body.append("signature", signature.signature);
        const response = await fetch(
          `https://api.cloudinary.com/v1_1/${signature.cloudName}/image/upload`,
          { method: "POST", body },
        );
        const result = (await response.json()) as {
          secure_url?: string;
          error?: { message?: string };
        };
        const imageUrl = result.secure_url;
        if (!response.ok || !imageUrl) {
          throw new Error(result.error?.message || `Could not upload ${file.name}.`);
        }
        uploaded.push(imageUrl);
        setImageUrls((current) => [...current, imageUrl]);
      }
      setNotice(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Image upload failed.");
    } finally {
      setUploadingImages(false);
    }
  }

  async function saveProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        name: draft.name.trim(),
        description: draft.description.trim(),
        price: Number(draft.price),
        currency: draft.currency.trim().toUpperCase() || "NGN",
        status: draft.status,
        categoryId: draft.categoryId || null,
        inventoryQuantity: Number(draft.inventoryQuantity),
        imageUrls,
        variants: draft.variants
          .filter((variant) => variant.name.trim())
          .map((variant) => ({
            name: variant.name.trim(),
            sku: variant.sku.trim() || undefined,
            price: variant.price ? Number(variant.price) : undefined,
            inventoryQuantity: Number(variant.inventoryQuantity || 0),
          })),
      };
      await request(
        editingProduct ? `products/${editingProduct.id}` : "products",
        {
          method: editingProduct ? "PATCH" : "POST",
          body: JSON.stringify(payload),
        },
      );
      setProductDialogOpen(false);
      setNotice(editingProduct ? "Product updated." : "Product created.");
      await loadCatalog();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not save product.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(product: Product) {
    if (!window.confirm(`Delete “${product.name}”?`)) return;
    setError("");
    try {
      await request(`products/${product.id}`, { method: "DELETE" });
      setNotice("Product deleted.");
      await loadCatalog();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not delete product.");
    }
  }

  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setNotice("");
    setImportResult(null);
    if (file.size > 5 * 1024 * 1024) {
      setError("Import files must be 5 MB or smaller.");
      return;
    }
    setImporting(true);
    try {
      const extension = file.name.split(".").pop()?.toLowerCase();
      const rows =
        extension === "csv"
          ? parseCsv(await file.text())
          : extension === "xlsx"
            ? parseSheetRows((await readXlsxFile(file))[0]?.data || [])
            : (() => {
                throw new Error("Choose a CSV or Excel (.xlsx) file.");
              })();
      if (!rows.length) throw new Error("The file contains no product rows.");
      const result = await request<ImportResult>("products/import", {
        method: "POST",
        body: JSON.stringify({ rows }),
      });
      setImportResult(result);
      setNotice(
        `Imported ${result.imported} product${result.imported === 1 ? "" : "s"}; ${result.failed} row${result.failed === 1 ? "" : "s"} need attention.`,
      );
      await loadCatalog();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not import products.");
    } finally {
      setImporting(false);
    }
  }

  async function addSampleData() {
    setError("");
    try {
      const result = await request<{ created: number }>("sample-data", {
        method: "POST",
        body: JSON.stringify({}),
      });
      setNotice(
        result.created
          ? `Added ${result.created} sample products.`
          : "Sample products are already in this workspace.",
      );
      await loadCatalog();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not add sample data.");
    }
  }

  function downloadTemplate() {
    const url = URL.createObjectURL(
      new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8" }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "product-import-template.csv";
    anchor.click();
    URL.revokeObjectURL(url);
  }

  const visibleProducts = products.filter((product) =>
    `${product.name} ${product.category?.name || ""}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );

  if (!isLoaded || !organizationLoaded || loading) {
    return (
      <main className="min-h-screen bg-[#f5f7fb] p-6">
        <div className="mx-auto max-w-6xl animate-pulse">
          <div className="h-10 w-48 rounded-xl bg-slate-200" />
          <div className="mt-8 h-64 rounded-3xl bg-white" />
        </div>
      </main>
    );
  }

  if (!orgId || !organization) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#f5f7fb] p-6">
        <section className="max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-slate-950">Choose a workspace</h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Select or create a company workspace before managing its catalog.
          </p>
          <Link className="mt-5 inline-flex font-semibold text-indigo-700" href="/dashboard">
            Go to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f7fb]">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-[#172033] px-4 py-6 text-white lg:flex">
        <Link className="flex items-center gap-3 px-3" href="/dashboard">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-[#5b5ce2] font-semibold">
            S
          </span>
          <span className="font-semibold tracking-tight">Store Admin</span>
        </Link>
        <p className="mb-3 mt-10 px-3 text-[11px] font-semibold uppercase tracking-[.16em] text-slate-500">
          Workspace
        </p>
        <nav aria-label="Main navigation" className="space-y-1">
          <Link className="block rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white" href="/dashboard">
            Overview
          </Link>
          <Link aria-current="page" className="block rounded-xl bg-white/10 px-3 py-3 text-sm font-medium text-white" href="/dashboard/catalog">
            Catalog
          </Link>
          <Link className="block rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white" href="/dashboard/orders">Orders</Link>
          <Link className="block rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white" href="/dashboard/customers">Customers</Link>
          <Link className="block rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white" href="/dashboard/discounts">Discounts</Link>
          <Link className="block rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white" href="/dashboard/analytics">Analytics</Link>
          <Link className="block rounded-xl px-3 py-3 text-sm text-slate-300 hover:bg-white/5 hover:text-white" href="/dashboard/settings">Store settings</Link>
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="flex h-[72px] items-center justify-between border-b border-slate-200/80 bg-white px-5 sm:px-8">
          <Link className="font-semibold text-slate-950 lg:hidden" href="/dashboard">
            Store Admin
          </Link>
          <p className="hidden text-sm text-slate-500 lg:block">{organization.name}</p>
          <UserButton />
        </header>

        <section className="mx-auto max-w-6xl px-5 py-8 sm:px-8 sm:py-10">
          <nav aria-label="Mobile navigation" className="mb-6 flex gap-2 overflow-x-auto pb-2 lg:hidden">
            {[["Orders", "/dashboard/orders"], ["Customers", "/dashboard/customers"], ["Discounts", "/dashboard/discounts"], ["Analytics", "/dashboard/analytics"], ["Settings", "/dashboard/settings"]].map(([label, href]) => (
              <Link key={href} href={href} className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700">{label}</Link>
            ))}
          </nav>
          <div className="mb-7 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">{organization.name}</p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight text-slate-950">
                Product catalog
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Manage products, variants, stock, categories, and images.
              </p>
            </div>
            {canManage && section === "products" && (
              <div className="flex flex-wrap gap-2">
                <input
                  ref={fileInput}
                  accept=".csv,.xlsx"
                  className="hidden"
                  onChange={importFile}
                  type="file"
                />
                <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50" disabled={importing} onClick={() => fileInput.current?.click()} type="button">
                  {importing ? "Importing…" : "Import CSV / Excel"}
                </button>
                <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={downloadTemplate} type="button">
                  Download template
                </button>
                <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={addSampleData} type="button">
                  Add sample data
                </button>
                <button className="rounded-xl bg-[#5b5ce2] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#4546bb]" onClick={() => startProduct()} type="button">
                  Add product
                </button>
              </div>
            )}
          </div>

          {!canManage && (
            <div className="mb-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              You can view this catalog. Ask a workspace owner to make changes.
            </div>
          )}
          {error && (
            <div role="alert" className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
              {error}
            </div>
          )}
          {notice && (
            <div role="status" className="mb-5 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
              {notice}
            </div>
          )}
          {importResult?.errors.length ? (
            <section className="mb-5 rounded-2xl border border-amber-200 bg-white p-5">
              <h2 className="font-semibold text-slate-900">Import row errors</h2>
              <div className="mt-3 max-h-48 space-y-2 overflow-auto text-sm text-amber-900">
                {importResult.errors.map((item) => (
                  <p key={`${item.row}-${item.message}`}>
                    Row {item.row}: {item.message}
                  </p>
                ))}
              </div>
            </section>
          ) : null}

          <div className="mb-5 flex gap-2 border-b border-slate-200">
            {(["products", "categories"] as const).map((item) => (
              <button
                aria-pressed={section === item}
                className={`border-b-2 px-4 py-3 text-sm font-semibold capitalize ${section === item ? "border-indigo-600 text-indigo-700" : "border-transparent text-slate-500 hover:text-slate-800"}`}
                key={item}
                onClick={() => setSection(item)}
                type="button"
              >
                {item} <span className="ml-1 text-xs text-slate-400">{item === "products" ? products.length : categories.length}</span>
              </button>
            ))}
          </div>

          {section === "products" ? (
            <section className="overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-[0_8px_30px_rgba(30,41,59,.035)]">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 p-5 sm:px-6">
                <div>
                  <h2 className="font-semibold text-slate-950">Products</h2>
                  <p className="mt-1 text-sm text-slate-500">Prices are shown in each product’s currency.</p>
                </div>
                <input
                  aria-label="Search products"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm sm:w-64"
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products"
                  value={search}
                />
              </div>
              {visibleProducts.length ? (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                      <tr>
                        <th className="px-6 py-3 font-semibold">Product</th>
                        <th className="px-4 py-3 font-semibold">Category</th>
                        <th className="px-4 py-3 font-semibold">Price</th>
                        <th className="px-4 py-3 font-semibold">Stock</th>
                        <th className="px-4 py-3 font-semibold">Status</th>
                        <th className="px-6 py-3 text-right font-semibold">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {visibleProducts.map((product) => (
                        <tr className="text-slate-700" key={product.id}>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div
                                aria-label={product.imageUrls?.length ? `Image of ${product.name}` : "No product image"}
                                className="h-11 w-11 shrink-0 rounded-xl bg-slate-100 bg-cover bg-center"
                                role="img"
                                style={product.imageUrls?.[0] ? { backgroundImage: `url("${product.imageUrls[0]}")` } : undefined}
                              />
                              <div>
                                <p className="font-semibold text-slate-900">{product.name}</p>
                                <p className="mt-0.5 text-xs text-slate-500">
                                  {product.variants.length} variant{product.variants.length === 1 ? "" : "s"}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-4">{product.category?.name || "—"}</td>
                          <td className="px-4 py-4">{product.currency} {Number(product.price).toLocaleString()}</td>
                          <td className="px-4 py-4">{product.inventoryQuantity}</td>
                          <td className="px-4 py-4">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700">
                              {product.status.toLowerCase()}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            {canManage ? (
                              <div className="flex justify-end gap-3">
                                <button className="font-semibold text-indigo-700 hover:text-indigo-900" onClick={() => startProduct(product)} type="button">Edit</button>
                                <button className="font-semibold text-rose-600 hover:text-rose-800" onClick={() => deleteProduct(product)} type="button">Delete</button>
                              </div>
                            ) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="px-6 py-16 text-center">
                  <p className="font-semibold text-slate-900">{search ? "No matching products" : "Your catalog is empty"}</p>
                  <p className="mt-2 text-sm text-slate-500">Add a product or import your catalog to get started.</p>
                </div>
              )}
            </section>
          ) : (
            <section className="rounded-3xl border border-slate-200/80 bg-white p-5 shadow-[0_8px_30px_rgba(30,41,59,.035)] sm:p-6">
              <div className="grid gap-6 lg:grid-cols-[.8fr_1.2fr]">
                <form className="h-fit rounded-2xl bg-slate-50 p-5" onSubmit={saveCategory}>
                  <h2 className="font-semibold text-slate-950">{editingCategory ? "Edit category" : "Add a category"}</h2>
                  <label className="mt-4 block text-sm font-medium text-slate-700" htmlFor="category-name">Category name</label>
                  <input
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm"
                    id="category-name"
                    maxLength={120}
                    onChange={(event) => setCategoryName(event.target.value)}
                    required
                    value={categoryName}
                  />
                  <div className="mt-4 flex gap-2">
                    <button className="rounded-xl bg-[#5b5ce2] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={!canManage} type="submit">
                      {editingCategory ? "Save category" : "Create category"}
                    </button>
                    {editingCategory && (
                      <button className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600" onClick={() => { setEditingCategory(null); setCategoryName(""); }} type="button">
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
                <div>
                  <h2 className="mb-3 font-semibold text-slate-950">Categories</h2>
                  {categories.length ? (
                    <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100">
                      {categories.map((category) => (
                        <div className="flex items-center justify-between gap-3 px-4 py-3" key={category.id}>
                          <div>
                            <p className="text-sm font-semibold text-slate-900">{category.name}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{category.slug}</p>
                          </div>
                          {canManage && (
                            <div className="flex gap-3 text-sm">
                              <button className="font-semibold text-indigo-700" onClick={() => { setEditingCategory(category); setCategoryName(category.name); }} type="button">Edit</button>
                              <button className="font-semibold text-rose-600" onClick={() => deleteCategory(category)} type="button">Delete</button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500">No categories yet.</p>
                  )}
                </div>
              </div>
            </section>
          )}
        </section>
      </div>

      {productDialogOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 p-4 sm:p-8">
          <section aria-labelledby="product-dialog-title" aria-modal="true" className="mx-auto my-6 max-w-3xl rounded-3xl bg-white shadow-2xl" role="dialog">
            <form onSubmit={saveProduct}>
              <div className="flex items-start justify-between border-b border-slate-100 px-6 py-5">
                <div>
                  <h2 className="text-xl font-semibold text-slate-950" id="product-dialog-title">{editingProduct ? "Edit product" : "Add product"}</h2>
                  <p className="mt-1 text-sm text-slate-500">Manage details, inventory, variants, and images.</p>
                </div>
                <button aria-label="Close dialog" className="rounded-lg px-2 py-1 text-xl text-slate-500 hover:bg-slate-100" onClick={() => setProductDialogOpen(false)} type="button">×</button>
              </div>
              <div className="grid gap-5 p-6 sm:grid-cols-2">
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Product name
                  <input className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5" maxLength={180} onChange={(event) => setDraft({ ...draft, name: event.target.value })} required value={draft.name} />
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Description
                  <textarea className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5" onChange={(event) => setDraft({ ...draft, description: event.target.value })} rows={3} value={draft.description} />
                </label>
                <label className="text-sm font-medium text-slate-700">Price
                  <input className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5" min="0" onChange={(event) => setDraft({ ...draft, price: event.target.value })} required step="0.01" type="number" value={draft.price} />
                </label>
                <label className="text-sm font-medium text-slate-700">Currency
                  <input className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5 uppercase" maxLength={3} onChange={(event) => setDraft({ ...draft, currency: event.target.value })} required value={draft.currency} />
                </label>
                <label className="text-sm font-medium text-slate-700">Category
                  <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5" onChange={(event) => setDraft({ ...draft, categoryId: event.target.value })} value={draft.categoryId}>
                    <option value="">Uncategorized</option>
                    {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700">Status
                  <select className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5" onChange={(event) => setDraft({ ...draft, status: event.target.value as Product["status"] })} value={draft.status}>
                    <option value="DRAFT">Draft</option>
                    <option value="PUBLISHED">Published</option>
                    <option value="ARCHIVED">Archived</option>
                  </select>
                </label>
                <label className="text-sm font-medium text-slate-700 sm:col-span-2">Product stock
                  <input className="mt-2 w-full rounded-xl border border-slate-200 px-3 py-2.5" min="0" onChange={(event) => setDraft({ ...draft, inventoryQuantity: event.target.value })} required type="number" value={draft.inventoryQuantity} />
                </label>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Variants</h3>
                      <p className="mt-1 text-xs text-slate-500">Optional sizes, colours, or other options with their own stock.</p>
                    </div>
                    <button className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700" onClick={() => setDraft({ ...draft, variants: [...draft.variants, { name: "", sku: "", price: "", inventoryQuantity: "0" }] })} type="button">Add variant</button>
                  </div>
                  {draft.variants.map((variant, index) => (
                    <div className="mt-3 grid gap-2 rounded-xl border border-slate-100 p-3 sm:grid-cols-[1.2fr_1fr_1fr_1fr_auto]" key={index}>
                      <input aria-label="Variant name" className="min-w-0 rounded-lg border border-slate-200 px-2.5 py-2 text-sm" onChange={(event) => setDraft({ ...draft, variants: draft.variants.map((item, current) => current === index ? { ...item, name: event.target.value } : item) })} placeholder="Name (e.g. Blue / M)" value={variant.name} />
                      <input aria-label="Variant SKU" className="min-w-0 rounded-lg border border-slate-200 px-2.5 py-2 text-sm" onChange={(event) => setDraft({ ...draft, variants: draft.variants.map((item, current) => current === index ? { ...item, sku: event.target.value } : item) })} placeholder="SKU" value={variant.sku} />
                      <input aria-label="Variant price" className="min-w-0 rounded-lg border border-slate-200 px-2.5 py-2 text-sm" min="0" onChange={(event) => setDraft({ ...draft, variants: draft.variants.map((item, current) => current === index ? { ...item, price: event.target.value } : item) })} placeholder="Price (optional)" step="0.01" type="number" value={variant.price} />
                      <input aria-label="Variant stock" className="min-w-0 rounded-lg border border-slate-200 px-2.5 py-2 text-sm" min="0" onChange={(event) => setDraft({ ...draft, variants: draft.variants.map((item, current) => current === index ? { ...item, inventoryQuantity: event.target.value } : item) })} placeholder="Stock" type="number" value={variant.inventoryQuantity} />
                      <button aria-label="Remove variant" className="px-2 text-rose-600" onClick={() => setDraft({ ...draft, variants: draft.variants.filter((_, current) => current !== index) })} type="button">×</button>
                    </div>
                  ))}
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-semibold text-slate-800">Product images</h3>
                      <p className="mt-1 text-xs text-slate-500">Images are uploaded securely to Cloudinary (5 MB maximum each).</p>
                    </div>
                    <label className={`cursor-pointer rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 ${uploadingImages ? "pointer-events-none opacity-50" : ""}`}>
                      {uploadingImages ? "Uploading…" : "Upload images"}
                      <input accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" disabled={uploadingImages} multiple onChange={uploadImages} type="file" />
                    </label>
                  </div>
                  {imageUrls.length ? (
                    <div className="mt-3 flex flex-wrap gap-3">
                      {imageUrls.map((url, index) => (
                        <div className="relative h-20 w-20 rounded-xl bg-slate-100 bg-cover bg-center" key={url} style={{ backgroundImage: `url("${url}")` }}>
                          <button aria-label={`Remove image ${index + 1}`} className="absolute -right-2 -top-2 grid h-6 w-6 place-items-center rounded-full bg-slate-900 text-sm text-white" onClick={() => setImageUrls(imageUrls.filter((_, current) => current !== index))} type="button">×</button>
                        </div>
                      ))}
                    </div>
                  ) : <p className="mt-3 text-xs text-slate-400">No images uploaded.</p>}
                </div>
              </div>
              <div className="flex justify-end gap-2 border-t border-slate-100 px-6 py-4">
                <button className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700" onClick={() => setProductDialogOpen(false)} type="button">Cancel</button>
                <button className="rounded-xl bg-[#5b5ce2] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50" disabled={saving || uploadingImages} type="submit">
                  {saving ? "Saving…" : editingProduct ? "Save changes" : "Create product"}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
