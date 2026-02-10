export const CATEGORY_KEYWORDS = [
  { label: "Produce", words: ["vegetable", "veg", "tomato", "onion", "potato", "apple", "banana", "fruit", "greens"] },
  { label: "Dairy", words: ["milk", "cheese", "butter", "yogurt", "curd", "paneer", "cream"] },
  { label: "Meat", words: ["chicken", "mutton", "beef", "fish", "prawn", "egg", "steak"] },
  { label: "Pantry", words: ["rice", "flour", "atta", "oil", "dal", "lentil", "spice", "masala", "salt", "sugar"] },
  { label: "Snacks", words: ["chips", "biscuit", "cookies", "chocolate", "namkeen", "snack"] },
  { label: "Beverages", words: ["juice", "soda", "coffee", "tea", "cola", "water"] },
  { label: "Household", words: ["soap", "detergent", "cleaner", "tissue", "toilet", "broom", "mop"] },
];

export const DEFAULT_CATEGORY = "Other";

export function inferCategory(itemName = "") {
  const lower = itemName.toLowerCase();
  for (const category of CATEGORY_KEYWORDS) {
    if (category.words.some((word) => lower.includes(word))) {
      return category.label;
    }
  }
  return DEFAULT_CATEGORY;
}
