type ProductPayload = {
  brief?: string;
  image?: string;
  reference?: string;
};

function clean(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function createTitle(brief: string) {
  if (!brief || brief.length === 0) {
    return "Product";
  }

  // Extract first sentence or natural phrase
  const sentences = brief.split(/[.!?\n]/);
  const firstSentence = sentences[0].trim();
  if (!firstSentence) {
    return "Product";
  }

  // Split into words
  const words = firstSentence.split(/\s+/);

  // Take up to 12 words, but find natural boundary
  let titleWords = [];
  for (let i = 0; i < Math.min(words.length, 12); i++) {
    titleWords.push(words[i]);
    // Stop at natural phrase boundaries at word 8+ (commas, "and", "with", etc.)
    if (titleWords.length >= 8 && i < words.length - 1) {
      const nextWord = words[i + 1]?.toLowerCase() || "";
      // Stop if next word starts a new clause
      if (["and", "with", "for", "in", "that", "which"].includes(nextWord)) {
        break;
      }
    }
  }

  const title = titleWords.join(" ");
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function extractIngredientsFromImage(imageContext: string): string[] {
  const ingredientKeywords = [
    "aloe vera",
    "hyaluronic acid",
    "vitamin c",
    "vitamin e",
    "retinol",
    "niacinamide",
    "peptides",
    "green tea",
    "chamomile",
    "tea tree",
    "charcoal",
    "clay",
    "salicylic acid",
    "glycolic acid",
    "benzoyl peroxide",
    "collagen",
    "ceramides",
    "jojoba",
    "argan",
    "coconut",
    "shea butter",
    "glycerin",
  ];

  const found: string[] = [];
  const lowerImage = imageContext.toLowerCase();
  for (const ingredient of ingredientKeywords) {
    if (lowerImage.includes(ingredient) && !found.includes(ingredient)) {
      found.push(ingredient.charAt(0).toUpperCase() + ingredient.slice(1));
    }
  }
  return found;
}

function extractTextureFromImage(imageContext: string): string | null {
  const lowerImage = imageContext.toLowerCase();
  if (/(gel|lightweight|serum|fluid)/.test(lowerImage)) {
    if (/gel/.test(lowerImage)) return "gel";
    if (/serum/.test(lowerImage)) return "serum";
    if (/lightweight|fluid/.test(lowerImage)) return "lightweight";
  }
  if (/(creamy|rich|thick|dense)/.test(lowerImage)) {
    if (/rich|thick|dense/.test(lowerImage)) return "rich cream";
    if (/creamy/.test(lowerImage)) return "creamy";
  }
  if (/(foaming|lather|foam)/.test(lowerImage)) return "foaming";
  if (/(oil|oily)/.test(lowerImage)) return "oil";
  return null;
}

function extractPackagingFromImage(imageContext: string): string | null {
  const lowerImage = imageContext.toLowerCase();
  if (/bottle/.test(lowerImage)) return "bottle";
  if (/pump/.test(lowerImage)) return "pump dispenser";
  if (/tube/.test(lowerImage)) return "tube";
  if (/jar/.test(lowerImage)) return "jar";
  if (/stick/.test(lowerImage)) return "stick";
  return null;
}

function extractIngredientsFromBrief(brief: string): string[] {
  const ingredientKeywords = [
    "aloe vera",
    "hyaluronic acid",
    "vitamin c",
    "vitamin e",
    "retinol",
    "niacinamide",
    "peptides",
    "green tea",
    "chamomile",
    "tea tree",
    "charcoal",
    "clay",
    "salicylic acid",
    "glycolic acid",
    "benzoyl peroxide",
    "collagen",
    "ceramides",
    "jojoba",
    "argan",
    "coconut",
    "shea butter",
    "glycerin",
  ];

  const found: string[] = [];
  const lowerBrief = brief.toLowerCase();
  for (const ingredient of ingredientKeywords) {
    if (lowerBrief.includes(ingredient) && !found.includes(ingredient)) {
      found.push(ingredient.charAt(0).toUpperCase() + ingredient.slice(1));
    }
  }
  return found;
}

function extractBenefitsFromReference(reference: string): string[] {
  const benefitKeywords = [
    "hydration",
    "moisturizing",
    "soothing",
    "anti-aging",
    "brightening",
    "anti-inflammatory",
    "cleansing",
    "detoxifying",
    "firming",
    "lifting",
    "nourishing",
    "revitalizing",
    "balancing",
    "clarifying",
    "pore-minimizing",
    "acne-fighting",
    "sensitive",
  ];

  const found: string[] = [];
  const lowerRef = reference.toLowerCase();
  for (const benefit of benefitKeywords) {
    if (lowerRef.includes(benefit) && !found.includes(benefit)) {
      found.push(benefit);
    }
  }
  return found;
}

function extractPositioningFromReference(reference: string): string[] {
  const positioningKeywords = [
    "sensitive",
    "dry",
    "oily",
    "combination",
    "acne-prone",
    "reactive",
    "organic",
    "natural",
    "cruelty-free",
    "vegan",
    "dermatologist",
    "clinically tested",
    "premium",
    "luxury",
    "gentle",
    "fragrance-free",
    "hypoallergenic",
    "non-comedogenic",
    "eco-friendly",
    "sustainable",
    "clean",
  ];

  const found: string[] = [];
  const lowerRef = reference.toLowerCase();
  
  // Prioritize skin type words (sensitive, dry, oily, etc.)
  const skinTypes = ["sensitive", "dry", "oily", "combination", "acne-prone", "reactive"];
  for (const skinType of skinTypes) {
    if (lowerRef.includes(skinType) && !found.includes(skinType)) {
      found.push(skinType);
    }
  }
  
  // Then add other positioning keywords
  for (const positioning of positioningKeywords) {
    if (!skinTypes.includes(positioning) && lowerRef.includes(positioning) && !found.includes(positioning)) {
      found.push(positioning);
    }
  }
  
  return found;
}

function isGenericPhrase(text: string): boolean {
  const genericPhrases = [
    "high quality",
    "product-focused",
    "easy to use",
    "best for",
    "works great",
    "perfect for",
    "great results",
  ];
  const lowerText = text.toLowerCase();
  return genericPhrases.some((phrase) => lowerText.includes(phrase));
}

function buildResponse(payload: ProductPayload) {
  const brief = clean(payload.brief);
  const image = clean(payload.image);
  const reference = clean(payload.reference);
  const searchableText = [brief, image, reference].join(" ").toLowerCase();

  // Determine category and subcategory
  const isSkincare = /face wash|cleanser|skincare|serum|cream|lotion|moisturizer|soap/.test(searchableText);
  const category = isSkincare ? "Skincare" : "General";
  const subCategory = /face wash|cleanser/.test(searchableText)
    ? "Face Wash"
    : /serum/.test(searchableText)
      ? "Face Serum"
      : /cream|lotion|moisturizer/.test(searchableText)
        ? "Moisturizer"
        : "Product";

  // Create base title from brief
  const baseTitle = createTitle(brief);

  // ===== INPUT MERGING: Combine all sources =====
  
  // Extract ingredients from ALL inputs
  const briefIngredients = extractIngredientsFromBrief(brief);
  const imageIngredients = image ? extractIngredientsFromImage(image) : [];
  const allIngredients = Array.from(new Set([...briefIngredients, ...imageIngredients])); // Deduplicate

  // Extract visual details from image
  const imageTexture = image ? extractTextureFromImage(image) : null;
  const imagePackaging = image ? extractPackagingFromImage(image) : null;

  // Extract benefits and positioning from reference
  const refBenefits = reference ? extractBenefitsFromReference(reference) : [];
  const refPositioning = reference ? extractPositioningFromReference(reference) : [];

  // ===== BUILD ENHANCED TITLE (combines all inputs) =====
  let enhancedTitle = baseTitle;
  
  // Add key image ingredient to title if not already included and title isn't too long
  if (imageIngredients.length > 0 && 
      !baseTitle.toLowerCase().includes(imageIngredients[0].toLowerCase()) &&
      enhancedTitle.length < 50) {
    enhancedTitle += ` & ${imageIngredients[0]}`;
  }
  
  // Add primary benefit and positioning if available (but keep title concise)
  if (enhancedTitle.length < 65) {
    if (refBenefits.length > 0 && refPositioning.length > 0) {
      const benefit = refBenefits[0];
      const positioning = refPositioning[0];
      enhancedTitle += ` for ${positioning.charAt(0).toUpperCase() + positioning.slice(1)}`;
    } else if (refPositioning.length > 0) {
      const positioning = refPositioning[0];
      enhancedTitle += ` for ${positioning.charAt(0).toUpperCase() + positioning.slice(1)}`;
    } else if (refBenefits.length > 0) {
      enhancedTitle += ` for ${refBenefits[0]}`;
    }
  }

  // ===== BUILD KEY_INGREDIENTS (combined from all inputs) =====
  let keyIngredients: string[] = [];
  if (allIngredients.length > 0) {
    keyIngredients = allIngredients.slice(0, 5);
  } else if (isSkincare) {
    keyIngredients = ["Water", "Glycerin", "Botanical Extracts"];
  } else {
    keyIngredients = ["Primary Material", "Supporting Components"];
  }

  // ===== BUILD DESCRIPTION (merged inputs with reference context front-and-center) =====
  let fullDescription = "";
  
  // Build description with clear positioning
  fullDescription += `${enhancedTitle} `;
  
  if (refPositioning.length > 0) {
    const positioningStr = refPositioning.length > 2
      ? refPositioning.slice(0, -1).join(", ") + ", and " + refPositioning[refPositioning.length - 1]
      : refPositioning.join(" and ");
    fullDescription += `is specifically formulated for ${positioningStr} skin. `;
  }
  
  // Add texture-specific description
  if (imageTexture === "gel" || imageTexture === "serum") {
    fullDescription += `The lightweight ${imageTexture}`;
  } else if (imageTexture === "rich cream" || imageTexture === "creamy") {
    fullDescription += `The rich, nourishing formula`;
  } else if (imageTexture === "foaming" || imageTexture === "lightweight") {
    fullDescription += `The gentle, ${imageTexture} formula`;
  } else {
    fullDescription += `The carefully formulated blend`;
  }
  
  // Add key ingredients
  if (briefIngredients.length > 0) {
    fullDescription += ` features ${briefIngredients.slice(0, 2).join(" and ")}`;
  }
  if (imageIngredients.length > 0 && !briefIngredients.includes(imageIngredients[0])) {
    fullDescription += briefIngredients.length > 0 ? ` plus ${imageIngredients[0]}` : ` features ${imageIngredients[0]}`;
  }
  
  fullDescription += `. `;
  
  // Add benefit summary
  if (refBenefits.length > 1) {
    fullDescription += `This combination provides ${refBenefits.slice(0, 2).join(" and ")} benefits, `;
  } else if (refBenefits.length > 0) {
    fullDescription += `This combination provides ${refBenefits[0]} benefits, `;
  } else {
    fullDescription += `This formulation delivers visible results, `;
  }
  
  if (imagePackaging) {
    fullDescription += `all conveniently delivered in a ${imagePackaging}.`;
  } else {
    fullDescription += `ensuring consistent, effective results.`;
  }

  // ===== BUILD KEY_FEATURES (STRICT: Real, specific benefits only) =====
  const keyFeatures: string[] = [];

  // Feature 1: Cleansing action (must be specific to product type/ingredients)
  if (briefIngredients.includes("Retinol") || briefIngredients.includes("Salicylic Acid")) {
    keyFeatures.push("Deeply cleanses while minimizing pores and refining texture");
  } else if (imageTexture === "foaming") {
    keyFeatures.push("Removes makeup, dirt, and impurities with a refreshing lather");
  } else if (subCategory === "Face Wash") {
    keyFeatures.push("Removes daily grime and environmental buildup without harsh stripping");
  } else {
    keyFeatures.push("Gently dissolves surface impurities while preserving skin barrier");
  }

  // Feature 2: Hydration benefit (must reference hydration explicitly and tie to reference context if available)
  if (refBenefits.includes("hydration") || refBenefits.includes("moisturizing")) {
    if (refPositioning.includes("sensitive")) {
      keyFeatures.push("Restores hydration while being gentle on sensitive skin");
    } else {
      keyFeatures.push("Delivers sustained hydration for 24+ hours");
    }
  } else {
    keyFeatures.push("Maintains skin hydration and prevents moisture loss");
  }

  // Feature 3: Suitability from reference (must be explicit)
  if (refPositioning.length > 0) {
    const positioningStr = refPositioning.length > 2
      ? refPositioning.slice(0, -1).join(", ") + ", and " + refPositioning[refPositioning.length - 1]
      : refPositioning.join(" and ");
    keyFeatures.push(`Ideal for ${positioningStr} skin types`);
  } else {
    keyFeatures.push("Suitable for daily use on all skin types");
  }

  // Feature 4: Texture/experience (must describe actual sensory benefit)
  if (imageTexture === "gel") {
    keyFeatures.push("Non-greasy gel texture absorbs completely for a clean feel");
  } else if (imageTexture === "serum") {
    keyFeatures.push("Silky serum texture glides smoothly for effortless application");
  } else if (imageTexture === "foaming") {
    keyFeatures.push("Lightweight foaming action creates a spa-like cleansing experience");
  } else if (imageTexture === "rich cream" || imageTexture === "creamy") {
    keyFeatures.push("Luxurious creamy texture melts into skin without residue");
  } else {
    keyFeatures.push("Smooth, pleasant texture enhances the application experience");
  }

  // Feature 5: Ingredient-specific benefit (must be concrete, tied to actual ingredient action)
  if (briefIngredients.length > 0) {
    const ing = briefIngredients[0];
    if (ing === "Retinol") {
      keyFeatures.push("Retinol reduces fine lines and improves skin firmness over time");
    } else if (ing === "Hyaluronic Acid" || ing === "Hyaluronic acid") {
      keyFeatures.push("Hyaluronic acid attracts and locks in moisture for plump, hydrated skin");
    } else if (ing === "Vitamin C" || ing === "Vitamin c") {
      keyFeatures.push("Vitamin C brightens dull skin and provides antioxidant protection");
    } else if (ing === "Peptides") {
      keyFeatures.push("Peptides support skin elasticity and reduce visible signs of aging");
    } else if (ing === "Niacinamide") {
      keyFeatures.push("Niacinamide minimizes pores and regulates oil production");
    } else {
      keyFeatures.push(`${ing} enhances skin resilience and natural radiance`);
    }
  } else if (imageIngredients.length > 0) {
    const ing = imageIngredients[0];
    if (ing === "Aloe Vera") {
      keyFeatures.push("Aloe vera soothes and calms irritated or reactive skin");
    } else if (ing === "Green Tea") {
      keyFeatures.push("Green tea provides antioxidant benefits and protects against environmental stressors");
    } else {
      keyFeatures.push(`${ing} supports skin health and visible improvement`);
    }
  } else {
    keyFeatures.push("Premium ingredients work together to enhance skin health");
  }

  // ===== BUILD SEO KEYWORDS (merged from all inputs) =====
  const seoKeywords: string[] = [];
  seoKeywords.push(enhancedTitle.toLowerCase());
  if (briefIngredients.length > 0) {
    seoKeywords.push(`${briefIngredients[0].toLowerCase()} ${subCategory.toLowerCase()}`);
  }
  if (refBenefits.length > 0) {
    seoKeywords.push(`${refBenefits[0]} ${category.toLowerCase()}`);
  }
  if (refPositioning.length > 0) {
    seoKeywords.push(`${refPositioning[0]} ${category.toLowerCase()}`);
  }
  if (imageIngredients.length > 0) {
    seoKeywords.push(`${imageIngredients[0].toLowerCase()} skincare`);
  }
  seoKeywords.push(`best ${subCategory.toLowerCase()}`);

  return {
    title: enhancedTitle,
    alt_title: enhancedTitle,
    category,
    sub_category: subCategory,
    description: brief ? fullDescription : "A thoughtfully formulated product designed for optimal results.",
    key_features: brief ? keyFeatures : [],
    key_ingredients: keyIngredients,
    full_ingredients: isSkincare
      ? "Aqua, Glycerin, Cocamidopropyl Betaine, Sodium Cocoyl Isethionate, Decyl Glucoside, Vitamin E, Aloe Vera Extract, Panthenol, Green Tea Extract, Chamomile Extract, Citric Acid, Sodium Chloride, Phenoxyethanol, Ethylhexylglycerin, Fragrance"
      : "Primary Material, Supporting Components, Stabilizers, Fragrance, Preservatives",
    how_to_use: brief
      ? "Apply as needed and rinse thoroughly. Use regularly as part of your daily routine."
      : "Apply as needed and rinse thoroughly.",
    product_care: imagePackaging
      ? `Store in a cool, dry place away from direct sunlight. Keep the ${imagePackaging} closed when not in use.`
      : "Store in a cool, dry place away from direct sunlight. Keep packaging closed when not in use.",
    cautions: "For external use only when applicable. Avoid contact with eyes. Discontinue use if irritation occurs.",
    seo_keywords: brief ? seoKeywords : [],
  };
}

export async function POST(request: Request) {
  try {
    const payload = (await request.json()) as ProductPayload;
    const brief = clean(payload.brief);

    if (!brief) {
      return Response.json({ error: "Product Brief is required." }, { status: 400 });
    }

    return Response.json(buildResponse(payload));
  } catch {
    return Response.json({ error: "Invalid JSON body." }, { status: 400 });
  }
}
