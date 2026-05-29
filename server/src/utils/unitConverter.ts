const UNIT_CATEGORIES = {
  weight: ['g', 'kg', 'oz', 'lb'],
  volume: ['ml', 'l', 'cup', 'tbsp', 'tsp'],
  count: ['piece', 'pieces', 'pcs', 'dozen'],
};

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Proteins: ['chicken', 'beef', 'pork', 'fish', 'salmon', 'turkey', 'egg', 'tofu', 'shrimp', 'lamb', 'steak', 'ground'],
  Vegetables: ['lettuce', 'tomato', 'onion', 'garlic', 'carrot', 'potato', 'broccoli', 'spinach', 'pepper', 'cucumber', 'celery', 'mushroom', 'zucchini', 'squash'],
  Dairy: ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'sour cream', 'cottage cheese', 'parmesan'],
  Grains: ['rice', 'pasta', 'bread', 'oat', 'flour', 'quinoa', 'couscous', 'noodle', 'tortilla'],
  Fruits: ['apple', 'banana', 'orange', 'lemon', 'lime', 'berry', 'strawberry', 'blueberry', 'mango', 'avocado', 'grape'],
  Spices: ['salt', 'pepper', 'cumin', 'paprika', 'oregano', 'basil', 'thyme', 'rosemary', 'cinnamon', 'ginger', 'turmeric'],
};

const CATEGORY_EMOJI: Record<string, string> = {
  Proteins: '🥩',
  Vegetables: '🥬',
  Dairy: '🧀',
  Grains: '🌾',
  Fruits: '🍎',
  Spices: '🧂',
  Other: '📦',
};

const parseQuantity = (input: string): { value: number; unit: string } => {
  const match = input.match(/^([\d\.]+)\s*(g|kg|oz|lb|ml|l|cup|tbsp|tsp|piece|pieces|pcs|dozen)?$/i);
  
  if (match) {
    const value = parseFloat(match[1]);
    const unit = (match[2] || 'piece').toLowerCase();
    return { value, unit };
  }
  
  const numMatch = input.match(/^([\d\.]+)$/);
  if (numMatch) {
    return { value: parseFloat(numMatch[1]), unit: 'piece' };
  }
  
  return { value: 1, unit: 'piece' };
};

const convertToBase = (value: number, unit: string): number => {
  const normalizedUnit = unit.toLowerCase();
  
  if (['g', 'oz', 'lb'].includes(normalizedUnit)) {
    if (normalizedUnit === 'oz') return value * 28.35;
    if (normalizedUnit === 'lb') return value * 453.592;
    return value;
  }
  
  if (['ml', 'l', 'cup', 'tbsp', 'tsp'].includes(normalizedUnit)) {
    if (normalizedUnit === 'l') return value * 1000;
    if (normalizedUnit === 'cup') return value * 240;
    if (normalizedUnit === 'tbsp') return value * 15;
    if (normalizedUnit === 'tsp') return value * 5;
    return value;
  }
  
  return value;
};

const convertFromBase = (baseValue: number, unitType: 'weight' | 'volume' | 'count'): string => {
  if (unitType === 'weight') {
    if (baseValue >= 1000) {
      return `${(baseValue / 1000).toFixed(1)}kg`;
    }
    return `${Math.round(baseValue)}g`;
  }
  
  if (unitType === 'volume') {
    if (baseValue >= 1000) {
      return `${(baseValue / 1000).toFixed(1)}L`;
    }
    if (baseValue >= 240) {
      return `${(baseValue / 240).toFixed(1)}cup`;
    }
    return `${Math.round(baseValue)}ml`;
  }
  
  if (baseValue >= 12) {
    return `${(baseValue / 12).toFixed(1)}dozen`;
  }
  return `${Math.round(baseValue)}pcs`;
};

const categorizeIngredient = (name: string): string => {
  const lowerName = name.toLowerCase();
  
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    if (keywords.some(keyword => lowerName.includes(keyword))) {
      return category;
    }
  }
  
  return 'Other';
};

const getEmojiForCategory = (category: string): string => {
  return CATEGORY_EMOJI[category] || '📦';
};

export const parseAndAggregateIngredients = (
  ingredients: Array<{ name: string; quantity: number; unit: string }>
): Array<{ name: string; totalQuantity: number; unit: string; category: string }> => {
  const aggregated = new Map<string, { baseValue: number; unitType: string; name: string; category: string }>();
  
  for (const ing of ingredients) {
    const { value, unit } = parseQuantity(Number(ing.quantity).toString() + ' ' + ing.unit);
    const unitType = UNIT_CATEGORIES.weight.includes(unit) ? 'weight' :
                      UNIT_CATEGORIES.volume.includes(unit) ? 'volume' : 'count';
    const baseValue = convertToBase(value, unit);
    const category = categorizeIngredient(ing.name);
    const normalizedName = ing.name.toLowerCase().trim();
    
    if (aggregated.has(normalizedName)) {
      const existing = aggregated.get(normalizedName)!;
      existing.baseValue += baseValue;
    } else {
      aggregated.set(normalizedName, {
        baseValue,
        unitType,
        name: ing.name,
        category,
      });
    }
  }
  
  return Array.from(aggregated.values()).map(item => ({
    name: item.name,
    totalQuantity: item.baseValue,
    unit: item.unitType === 'weight' ? 'g' : item.unitType === 'volume' ? 'ml' : 'pcs',
    category: item.category,
  }));
};

export const formatQuantity = (totalQuantity: number, unit: string): string => {
  const unitType = UNIT_CATEGORIES.weight.includes(unit) ? 'weight' :
                   UNIT_CATEGORIES.volume.includes(unit) ? 'volume' : 'count';
  
  return convertFromBase(totalQuantity, unitType);
};

export const getCategoryEmoji = getEmojiForCategory;

export const getCategoryFromIngredient = categorizeIngredient;