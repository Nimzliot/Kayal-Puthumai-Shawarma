"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import type { Product, ProductCategory } from "@/lib/types";
import { formatCurrency } from "@/lib/utils";

const categories: ProductCategory[] = [
  "Shawarma",
  "Chicken Grill",
  "Burger",
  "Fries",
  "Rolls",
  "Beverages",
  "Combo Meals"
];

type FormState = {
  tamilName: string;
  englishName: string;
  description: string;
  image: string;
  category: ProductCategory;
  price: string;
  prepTime: string;
  isVeg: boolean;
  spiceLevel: "Mild" | "Medium" | "Hot";
  addonsText: string;
  stockAvailable: boolean;
  enabled: boolean;
};

const emptyForm: FormState = {
  tamilName: "",
  englishName: "",
  description: "",
  image: "",
  category: "Shawarma",
  price: "",
  prepTime: "",
  isVeg: false,
  spiceLevel: "Medium",
  addonsText: "",
  stockAvailable: true,
  enabled: true
};

function serializeAddons(product: Product) {
  return product.addons.map((addon) => `${addon.name}|${addon.price}`).join("\n");
}

function parseAddons(addonsText: string) {
  return addonsText
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, rawPrice] = line.split("|");
      return {
        name: name?.trim() ?? "",
        price: Number(rawPrice?.trim() ?? 0)
      };
    })
    .filter((addon) => addon.name && Number.isFinite(addon.price));
}

function toFormState(product?: Product): FormState {
  if (!product) {
    return emptyForm;
  }

  return {
    tamilName: product.tamilName,
    englishName: product.englishName,
    description: product.description,
    image: product.image,
    category: product.category,
    price: String(product.price),
    prepTime: String(product.prepTime),
    isVeg: product.isVeg,
    spiceLevel: product.spiceLevel,
    addonsText: serializeAddons(product),
    stockAvailable: product.stockAvailable ?? true,
    enabled: product.enabled ?? true
  };
}

function FieldError({ message }: { message?: string }) {
  if (!message) {
    return null;
  }

  return <p className="mt-2 text-sm text-danger">{message}</p>;
}

export function ProductManager({ initialProducts }: { initialProducts: Product[] }) {
  const router = useRouter();
  const formPanelRef = useRef<HTMLDivElement | null>(null);
  const [products, setProducts] = useState(initialProducts);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [message, setMessage] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  function focusFormPanel() {
    formPanelRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function startCreate() {
    setEditingId(null);
    setForm(emptyForm);
    setSelectedFile(null);
    setMessage("");
    setFieldErrors({});
    focusFormPanel();
  }

  function startEdit(product: Product) {
    setEditingId(product.id);
    setForm(toFormState(product));
    setSelectedFile(null);
    setMessage("");
    setFieldErrors({});
    focusFormPanel();
  }

  async function handleImageUpload() {
    if (!selectedFile) {
      setMessage("Choose an image file first.");
      return;
    }

    setIsUploadingImage(true);
    setMessage("");
    setFieldErrors({});

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const response = await fetch("/api/admin/uploads", {
        method: "POST",
        body: formData
      });

      const result = (await response.json()) as {
        success?: boolean;
        imageUrl?: string;
        error?: string;
      };

      if (!response.ok || !result.success || !result.imageUrl) {
        setMessage(result.error ?? "Unable to upload image.");
        return;
      }

      setForm((current) => ({ ...current, image: result.imageUrl! }));
      setSelectedFile(null);
      setMessage("Image uploaded successfully.");
    } finally {
      setIsUploadingImage(false);
    }
  }

  async function handleSubmit() {
    setIsSaving(true);
    setMessage("");
    setFieldErrors({});

    const payload = {
      tamilName: form.tamilName.trim(),
      englishName: form.englishName.trim(),
      description: form.description.trim(),
      image: form.image.trim(),
      category: form.category,
      price: Number(form.price),
      prepTime: Number(form.prepTime),
      isVeg: form.isVeg,
      spiceLevel: form.spiceLevel,
      addons: parseAddons(form.addonsText),
      stockAvailable: form.stockAvailable,
      enabled: form.enabled
    };

    const endpoint = editingId ? `/api/admin/products/${editingId}` : "/api/admin/products";
    const method = editingId ? "PUT" : "POST";

    try {
      const response = await fetch(endpoint, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      const result = (await response.json()) as {
        success?: boolean;
        product?: Product;
        error?: string | { fieldErrors?: Record<string, string[]> };
      };

      if (!response.ok || !result.success || !result.product) {
        if (typeof result.error !== "string" && result.error?.fieldErrors) {
          const nextFieldErrors = Object.fromEntries(
            Object.entries(result.error.fieldErrors)
              .filter((entry): entry is [string, string[]] => Array.isArray(entry[1]) && entry[1].length > 0)
              .map(([key, value]) => [key, value[0]])
          );
          setFieldErrors(nextFieldErrors);
          setMessage("Please correct the highlighted fields.");
          focusFormPanel();
          return;
        }

        setMessage(
          typeof result.error === "string"
            ? result.error
            : "Unable to save product. Please check the fields and try again."
        );
        return;
      }

      if (editingId) {
        setProducts((current) =>
          current.map((product) => (product.id === result.product?.id ? result.product : product))
        );
        setMessage("Product updated successfully.");
      } else {
        setProducts((current) => [...current, result.product!]);
        setMessage("Product created successfully.");
      }

      setEditingId(result.product.id);
      setForm(toFormState(result.product));
      setFieldErrors({});
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(productId: string) {
    const confirmed = window.confirm("Delete this product from Supabase?");
    if (!confirmed) {
      return;
    }

    const response = await fetch(`/api/admin/products/${productId}`, {
      method: "DELETE"
    });

    const result = (await response.json()) as { success?: boolean; error?: string };
    if (!response.ok || !result.success) {
      setMessage(result.error ?? "Unable to delete product.");
      return;
    }

    setProducts((current) => current.filter((product) => product.id !== productId));
    if (editingId === productId) {
      startCreate();
    }
    setMessage("Product deleted successfully.");
    router.refresh();
  }

  return (
    <section className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
      <div className="glass-panel rounded-[30px] p-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-white">Menu management</h2>
            <p className="mt-2 text-sm text-foreground/65">
              Add, edit, enable, disable, and delete products directly in Supabase.
            </p>
          </div>
          <Button size="sm" onClick={startCreate}>
            <Plus className="mr-2 h-4 w-4" />
            New item
          </Button>
        </div>

        <div className="mt-5 space-y-3">
          {products.map((product) => (
            <div key={product.id} className="rounded-[24px] border border-border p-4 text-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-white">{product.englishName}</p>
                  <p className="mt-1 text-foreground/60">{product.tamilName}</p>
                  <p className="mt-2 text-foreground/70">
                    {product.category} · {formatCurrency(product.price)} · {product.prepTime} mins
                  </p>
                  <p className="mt-2 text-xs text-foreground/55">
                    {product.enabled ? "Enabled" : "Disabled"} /{" "}
                    {product.stockAvailable ? "In stock" : "Out of stock"}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="secondary" onClick={() => startEdit(product)}>
                    <Pencil className="mr-2 h-4 w-4" />
                    Edit
                  </Button>
                  <Button size="sm" variant="secondary" onClick={() => handleDelete(product.id)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div ref={formPanelRef} className="glass-panel rounded-[30px] p-6">
        <div className="rounded-[24px] border border-brand/20 bg-brand/10 p-4">
          <p className="text-xs uppercase tracking-[0.3em] text-brand">
            {editingId ? "Editing" : "Creating"}
          </p>
          <h2 className="mt-2 text-lg font-semibold text-white">
            {editingId ? "Edit product" : "Create product"}
          </h2>
          <p className="mt-2 text-sm text-foreground/70">
            {editingId
              ? "Update the selected item and save your changes."
              : "You are adding a new menu item. Fill the fields below, then click Create product."}
          </p>
        </div>

        {message ? <p className="mt-4 text-sm text-foreground/70">{message}</p> : null}

        <div className="mt-5 grid gap-4 md:grid-cols-2">
          <div>
            <input
              value={form.tamilName}
              onChange={(event) => setForm((current) => ({ ...current, tamilName: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none"
              placeholder="Tamil name"
            />
            <FieldError message={fieldErrors.tamilName} />
          </div>

          <div>
            <input
              value={form.englishName}
              onChange={(event) => setForm((current) => ({ ...current, englishName: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none"
              placeholder="English name"
            />
            <FieldError message={fieldErrors.englishName} />
          </div>

          <div className="md:col-span-2">
            <input
              value={form.image}
              onChange={(event) => setForm((current) => ({ ...current, image: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none"
              placeholder="Image URL or upload below"
            />
            <FieldError message={fieldErrors.image} />
          </div>

          <div className="rounded-2xl border border-border bg-black/20 p-4 md:col-span-2">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <input
                type="file"
                accept="image/*"
                onChange={(event) => setSelectedFile(event.target.files?.[0] ?? null)}
                className="text-sm text-foreground/75 file:mr-4 file:rounded-full file:border-0 file:bg-brand file:px-4 file:py-2 file:text-sm file:font-semibold file:text-black"
              />
              <Button
                type="button"
                variant="secondary"
                onClick={handleImageUpload}
                disabled={!selectedFile || isUploadingImage}
              >
                {isUploadingImage ? "Uploading..." : "Upload image"}
              </Button>
            </div>
            <p className="mt-3 text-xs text-foreground/60">
              Admin uploads are stored in Supabase Storage bucket `product-images`.
            </p>
            {form.image ? (
              <div className="mt-4 overflow-hidden rounded-[20px] border border-border">
                <div className="relative h-40 w-full">
                  <Image src={form.image} alt="Product preview" fill className="object-cover" />
                </div>
              </div>
            ) : null}
          </div>

          <div>
            <select
              value={form.category}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  category: event.target.value as ProductCategory
                }))
              }
              className="w-full rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none"
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
            <FieldError message={fieldErrors.category} />
          </div>

          <div>
            <select
              value={form.spiceLevel}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  spiceLevel: event.target.value as FormState["spiceLevel"]
                }))
              }
              className="w-full rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none"
            >
              <option value="Mild">Mild</option>
              <option value="Medium">Medium</option>
              <option value="Hot">Hot</option>
            </select>
            <FieldError message={fieldErrors.spiceLevel} />
          </div>

          <div>
            <input
              value={form.price}
              onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none"
              placeholder="Price"
              type="number"
              min="0"
            />
            <FieldError message={fieldErrors.price} />
          </div>

          <div>
            <input
              value={form.prepTime}
              onChange={(event) => setForm((current) => ({ ...current, prepTime: event.target.value }))}
              className="w-full rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none"
              placeholder="Prep time in mins"
              type="number"
              min="1"
            />
            <FieldError message={fieldErrors.prepTime} />
          </div>

          <div className="md:col-span-2">
            <textarea
              value={form.description}
              onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
              className="min-h-28 w-full rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none"
              placeholder="Description"
            />
            <FieldError message={fieldErrors.description} />
          </div>

          <textarea
            value={form.addonsText}
            onChange={(event) => setForm((current) => ({ ...current, addonsText: event.target.value }))}
            className="min-h-28 rounded-2xl border border-border bg-black/30 px-4 py-3 text-sm outline-none md:col-span-2"
            placeholder={"Add-ons, one per line\nExample: Extra Garlic Sauce|20"}
          />
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <label className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm text-foreground/75">
            <input
              type="checkbox"
              checked={form.isVeg}
              onChange={(event) => setForm((current) => ({ ...current, isVeg: event.target.checked }))}
              className="h-4 w-4 accent-[#f7c942]"
            />
            Veg item
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm text-foreground/75">
            <input
              type="checkbox"
              checked={form.stockAvailable}
              onChange={(event) =>
                setForm((current) => ({ ...current, stockAvailable: event.target.checked }))
              }
              className="h-4 w-4 accent-[#f7c942]"
            />
            In stock
          </label>
          <label className="flex items-center gap-3 rounded-2xl border border-border px-4 py-3 text-sm text-foreground/75">
            <input
              type="checkbox"
              checked={form.enabled}
              onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))}
              className="h-4 w-4 accent-[#f7c942]"
            />
            Enabled
          </label>
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? "Saving..." : editingId ? "Update product" : "Create product"}
          </Button>
          <Button variant="secondary" onClick={startCreate}>
            Reset form
          </Button>
        </div>
      </div>
    </section>
  );
}
