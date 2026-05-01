"use client";

import { FormEvent, useState } from "react";

type CatalogData = {
  title: string;
  alt_title: string;
  category: string;
  sub_category: string;
  description: string;
  key_features: string[];
  key_ingredients: string[];
  full_ingredients: string;
  how_to_use: string;
  product_care: string;
  cautions: string;
  seo_keywords: string[];
};

const initialOutput: CatalogData = {
  title: "",
  alt_title: "",
  category: "",
  sub_category: "",
  description: "",
  key_features: [],
  key_ingredients: [],
  full_ingredients: "",
  how_to_use: "",
  product_care: "",
  cautions: "",
  seo_keywords: [],
};

export default function Home() {
  const [brief, setBrief] = useState("");
  const [image, setImage] = useState("");
  const [reference, setReference] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [output, setOutput] = useState<CatalogData>(initialOutput);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!brief.trim()) {
      setError("Product Brief is required.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          brief,
          image,
          reference,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.error || "Failed to generate product data.");
      }

      setOutput(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
        <header>
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-zinc-500">
            AI Product Catalog Generator
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
            Input → AI → Generated Output
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-zinc-600">
            Enter a product brief, send it to the API, and view the structured catalog JSON below.
          </p>
        </header>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <div className="grid gap-2">
              <label htmlFor="brief" className="text-sm font-medium">
                Product Brief
              </label>
              <textarea
                id="brief"
                value={brief}
                onChange={(event) => setBrief(event.target.value)}
                required
                className="min-h-32 rounded-xl border border-zinc-300 px-3 py-2 outline-none transition focus:border-zinc-400"
                placeholder="Describe the product, category, benefits, and target use"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="grid gap-2">
                <label htmlFor="image" className="text-sm font-medium">
                  Image Context
                </label>
                <input
                  id="image"
                  value={image}
                  onChange={(event) => setImage(event.target.value)}
                  className="rounded-xl border border-zinc-300 px-3 py-2 outline-none transition focus:border-zinc-400"
                  placeholder="Optional image notes"
                />
              </div>

              <div className="grid gap-2">
                <label htmlFor="reference" className="text-sm font-medium">
                  Reference Context
                </label>
                <input
                  id="reference"
                  value={reference}
                  onChange={(event) => setReference(event.target.value)}
                  className="rounded-xl border border-zinc-300 px-3 py-2 outline-none transition focus:border-zinc-400"
                  placeholder="Optional reference link or notes"
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading}
                className="rounded-xl bg-zinc-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Generating..." : "Generate Product Data"}
              </button>
              <p className="text-sm text-zinc-500">POST /api/generate</p>
            </div>

            {error ? <p className="text-sm text-red-600">{error}</p> : null}
          </form>
        </section>

        <section className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">Generated Output</h2>
            <p className="text-sm text-zinc-500">Formatted JSON response</p>
          </div>
          <pre className="overflow-auto rounded-xl bg-zinc-950 p-4 text-sm text-zinc-100">
            {JSON.stringify(output, null, 2)}
          </pre>
        </section>
      </div>
      </main>
  );
}
