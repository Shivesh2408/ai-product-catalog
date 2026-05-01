type ProductPayload = {
  brief?: string;
  image?: string;
  reference?: string;
  referenceUrl?: string;
};

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

const SYSTEM_PROMPT = String.raw`You are an AI product catalog generator.

Return ONLY valid JSON.
No explanation.
No markdown.
No text outside JSON.

STRICT FORMAT:

{
  "title": "string",
  "alt_title": "string",
  "category": "string",
  "sub_category": "string",
  "description": "string",
  "key_features": ["string"],
  "key_ingredients": ["string"],
  "full_ingredients": "string",
  "how_to_use": "string",
  "product_care": "string",
  "cautions": "string",
  "seo_keywords": ["string"]
}

Use ALL inputs:
- Brief
- Image Context
- Reference Context

If reference content comes from a product page, extract style and benefits but do not copy text.

Fill ALL fields.
Do NOT leave empty values.`;

function buildUserPrompt(payload: ProductPayload): string {
  const brief = payload.brief?.trim() || "";
  const image = payload.image?.trim() || "";
  const reference = payload.reference?.trim() || "";

  return [
    "PRODUCT BRIEF:",
    brief || "(empty)",
    "",
    "IMAGE CONTEXT:",
    image || "(empty)",
    "",
    "REFERENCE CONTEXT:",
    reference || "(empty)",
  ].join("\n");
}

function extractJson(text: string): string {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start !== -1 && end !== -1 && end >= start) {
    return text.substring(start, end + 1);
  }
  return text;
}

async function fetchReferenceUrl(url: string): Promise<string> {
  try {
    const res = await fetch(url);
    if (!res.ok) return "";
    const html = await res.text();
    
    const titleMatch = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : "";
    
    let description = "";
    const descMatch1 = html.match(/<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["']/i);
    const descMatch2 = html.match(/<meta[^>]*content=["']([^"']*)["'][^>]*name=["']description["']/i);
    
    if (descMatch1) description = descMatch1[1].trim();
    else if (descMatch2) description = descMatch2[1].trim();

    const parts = [];
    if (title) parts.push(`Title: ${title}`);
    if (description) parts.push(`Description: ${description}`);
    
    return parts.join("\n");
  } catch {
    return "";
  }
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ProductPayload;
    
    if (!payload.brief?.trim()) {
      return Response.json({ error: "Product Brief is required." }, { status: 400 });
    }

    if (payload.referenceUrl?.trim()) {
      const extractedUrlContent = await fetchReferenceUrl(payload.referenceUrl.trim());
      if (extractedUrlContent) {
        payload.reference = (payload.reference?.trim() ? payload.reference.trim() + "\n\n" : "") + "Extracted from URL:\n" + extractedUrlContent;
      }
    }

    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      return Response.json({ error: "Missing OPENROUTER_API_KEY in environment." }, { status: 500 });
    }

    const openRouterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openrouter/free",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: buildUserPrompt(payload) },
        ],
      }),
    });

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      return Response.json(
        { error: `OpenRouter request failed (${openRouterResponse.status}): ${errorText}` },
        { status: 502 },
      );
    }

    const responseBody = await openRouterResponse.json();
    const modelContent = responseBody.choices?.[0]?.message?.content;
    
    if (!modelContent) {
      return Response.json({ error: "OpenRouter returned an empty response." }, { status: 502 });
    }

    const jsonString = extractJson(modelContent);
    let parsed: CatalogData;
    
    try {
      parsed = JSON.parse(jsonString);
    } catch {
      return Response.json({ error: "Failed to parse JSON from LLM response.", raw_output: modelContent }, { status: 502 });
    }

    return Response.json(parsed);
  } catch (err: any) {
    console.error("API Route Error:", err);
    return Response.json({ error: "Invalid JSON body or unexpected server error.", details: err.message }, { status: 500 });
  }
}

