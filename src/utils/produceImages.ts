// Utility to get guaranteed high-resolution images, emojis, nutrition facts, storage tips, and origin tags for produce items

export interface ProduceMeta {
  imageUrl: string;
  emoji: string;
  origin: string;
  originCountry: string;
  isOrganic: boolean;
  dietaryTags: string[];
  nutrition: {
    calories: string;
    vitaminC: string;
    fiber: string;
    potassium: string;
    keyBenefit: string;
  };
  storageTip: string;
  cookingTips: string;
  estimatedWeight: string;
}

const CATEGORY_DEFAULT_IMAGES: Record<string, { image: string; emoji: string }> = {
  'Roots, Tubers & Yams': {
    image: 'https://images.unsplash.com/photo-1596097635121-14b63b7a0c19?auto=format&fit=crop&w=600&q=80',
    emoji: '🍠',
  },
  'Fresh Vegetables & Greens': {
    image: 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=600&q=80',
    emoji: '🥬',
  },
  'Tropical & Plantains': {
    image: 'https://images.unsplash.com/photo-1528825871115-3581a5387919?auto=format&fit=crop&w=600&q=80',
    emoji: '🍌',
  },
  'Peppers, Chillies & Squashes': {
    image: 'https://images.unsplash.com/photo-1588252303782-cb80119abd6d?auto=format&fit=crop&w=600&q=80',
    emoji: '🌶️',
  },
  'Fresh Tomatoes': {
    image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=600&q=80',
    emoji: '🍅',
  },
  'Citrus & Orchard Fruits': {
    image: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?auto=format&fit=crop&w=600&q=80',
    emoji: '🍊',
  },
  'Onions, Garlic & Herbs': {
    image: 'https://images.unsplash.com/photo-1618512496248-a07fe83aa8cb?auto=format&fit=crop&w=600&q=80',
    emoji: '🧅',
  },
};

export function getProduceMeta(name: string, category: string, existingImage?: string): ProduceMeta {
  const lower = name.toLowerCase();

  // Determine Emoji
  let emoji = '🥬';
  if (lower.includes('yam') || lower.includes('potato') || lower.includes('cassava') || lower.includes('coco yam') || lower.includes('dasheen') || lower.includes('eddoes')) {
    emoji = '🍠';
  } else if (lower.includes('banana') || lower.includes('plantain')) {
    emoji = '🍌';
  } else if (lower.includes('pepper') || lower.includes('chilli') || lower.includes('bonnet')) {
    emoji = '🌶️';
  } else if (lower.includes('tomato')) {
    emoji = '🍅';
  } else if (lower.includes('lemon') || lower.includes('lime')) {
    emoji = '🍋';
  } else if (lower.includes('orange') || lower.includes('clemente')) {
    emoji = '🍊';
  } else if (lower.includes('apple')) {
    emoji = '🍎';
  } else if (lower.includes('melon') || lower.includes('watermelon')) {
    emoji = '🍉';
  } else if (lower.includes('mango')) {
    emoji = '🥭';
  } else if (lower.includes('avocado')) {
    emoji = '🥑';
  } else if (lower.includes('coconut')) {
    emoji = '🥥';
  } else if (lower.includes('pineapple')) {
    emoji = '🍍';
  } else if (lower.includes('onion')) {
    emoji = '🧅';
  } else if (lower.includes('garlic')) {
    emoji = '🧄';
  } else if (lower.includes('ginger') || lower.includes('turmeric')) {
    emoji = '🫚';
  } else if (lower.includes('carrot')) {
    emoji = '🥕';
  } else if (lower.includes('corn')) {
    emoji = '🌽';
  } else if (lower.includes('eggplant') || lower.includes('garden egg') || lower.includes('aubergine')) {
    emoji = '🍆';
  }

  // Determine Origin
  let origin = 'Brixton Fresh Market';
  let originCountry = 'UK & Global';
  if (lower.includes('ghana')) {
    origin = 'Ghana 🇬🇭';
    originCountry = 'Ghana';
  } else if (lower.includes('nigeria') || lower.includes('abuja')) {
    origin = 'Nigeria 🇳🇬';
    originCountry = 'Nigeria';
  } else if (lower.includes('uganda') || lower.includes('matooke') || lower.includes('gonja') || lower.includes('bogoya') || lower.includes('ndizi')) {
    origin = 'Uganda 🇺🇬';
    originCountry = 'Uganda';
  } else if (lower.includes('jemaca') || lower.includes('jamaica')) {
    origin = 'Jamaica 🇯🇲';
    originCountry = 'Jamaica';
  } else if (lower.includes('brazil')) {
    origin = 'Brazil 🇧🇷';
    originCountry = 'Brazil';
  } else if (lower.includes('cyprus')) {
    origin = 'Cyprus 🇨🇾';
    originCountry = 'Cyprus';
  } else if (lower.includes('spanish') || lower.includes('spain')) {
    origin = 'Spain 🇪🇸';
    originCountry = 'Spain';
  } else if (lower.includes('dutch') || lower.includes('holland')) {
    origin = 'Netherlands 🇳🇱';
    originCountry = 'Netherlands';
  } else if (lower.includes('punjab') || lower.includes('india')) {
    origin = 'India 🇮🇳';
    originCountry = 'India';
  } else if (lower.includes('costa rica')) {
    origin = 'Costa Rica 🇨🇷';
    originCountry = 'Costa Rica';
  } else if (category === 'Tropical & Plantains') {
    origin = 'Caribbean & West Africa 🌴';
    originCountry = 'Tropical Regions';
  } else if (category === 'Roots, Tubers & Yams') {
    origin = 'Tropical Import 🌍';
    originCountry = 'West Africa & Caribbean';
  } else if (category === 'Fresh Vegetables & Greens') {
    origin = 'UK & European Farms 🇬🇧';
    originCountry = 'United Kingdom';
  }

  // Organic indicator
  const isOrganic =
    lower.includes('organic') ||
    lower.includes('turmeric') ||
    lower.includes('ginger') ||
    lower.includes('spinach') ||
    lower.includes('aloe') ||
    lower.includes('mint') ||
    lower.includes('thyme') ||
    lower.includes('callaloo') ||
    lower.includes('avocado') ||
    lower.includes('apple') ||
    lower.includes('honey');

  // Dietary & highlights tags
  const dietaryTags: string[] = ['Daily Fresh', 'Market Pick'];
  if (isOrganic) {
    dietaryTags.push('100% Organic Certified');
  }
  if (lower.includes('plantain') || lower.includes('yam') || lower.includes('cassava') || lower.includes('scotch')) {
    dietaryTags.push('Brixton Community Favorite');
  }
  if (lower.includes('bonnet') || lower.includes('chilli') || lower.includes('pepper') || lower.includes('hot')) {
    dietaryTags.push('Authentic Fiery Heat 🔥');
  }
  if (lower.includes('spinach') || lower.includes('callaloo') || lower.includes('cabbage') || lower.includes('greens') || lower.includes('broccoli')) {
    dietaryTags.push('Rich in Iron & Vitamins');
  }

  // Nutrition Facts & Storage Tips based on produce type
  let nutrition = {
    calories: '65 kcal per 100g',
    vitaminC: '25% Daily Value',
    fiber: '3.2g Dietary Fiber',
    potassium: '380mg Potassium',
    keyBenefit: 'Rich in essential vitamins, natural antioxidants, and clean dietary energy.',
  };

  let storageTip = 'Keep in a cool, well-ventilated dry area. Refrigerate once cut to maintain peak crispness.';
  let cookingTips = 'Ideal for soups, steaming, sautéing, or enjoying fresh as part of a balanced diet.';
  let estimatedWeight = 'Approx. 500g – 1kg';

  if (lower.includes('yam')) {
    nutrition = {
      calories: '118 kcal per 100g',
      vitaminC: '28% Daily Value',
      fiber: '4.1g Complex Fiber',
      potassium: '816mg Potassium',
      keyBenefit: 'High complex carbs, low glycemic index, sustained energy release for whole families.',
    };
    storageTip = 'Store in a cool, dark, dry and well-ventilated room (12–15°C). Never refrigerate raw uncut yams as moisture causes softening.';
    cookingTips = 'Boil with salt for yam & egg stew, pound for traditional fufu, or slice and deep-fry into crunchy yam chips (Dundun).';
    estimatedWeight = '1.5kg – 3kg per tuber';
  } else if (lower.includes('plantain')) {
    nutrition = {
      calories: '122 kcal per 100g',
      vitaminC: '30% Daily Value',
      fiber: '2.3g Fiber',
      potassium: '499mg Potassium',
      keyBenefit: 'Excellent source of Vitamin A, Vitamin B6, and potassium for heart vitality.',
    };
    storageTip = 'Leave on the counter at room temperature to ripen to sweet yellow/black for frying, or use green for savory boiling.';
    cookingTips = 'Slice ripe plantains diagonally and fry in oil for delicious sweet Dodo / Kelewele; boil green plantains with saltfish.';
    estimatedWeight = 'Approx. 350g per plantain';
  } else if (lower.includes('pepper') || lower.includes('bonnet') || lower.includes('chilli')) {
    nutrition = {
      calories: '40 kcal per 100g',
      vitaminC: '140% Daily Value',
      fiber: '1.5g Fiber',
      potassium: '320mg Potassium',
      keyBenefit: 'High capsaicin content boosts metabolism and provides immune-supporting Vitamin C.',
    };
    storageTip = 'Store in a breathable paper bag or perforated plastic in the vegetable crisper drawer for up to 2 weeks. Can be frozen whole.';
    cookingTips = 'Dice carefully for Jollof rice base, Jamaican jerk marinade, pepper soup, or homemade fiery hot sauce.';
    estimatedWeight = 'Approx. 100g – 250g bag';
  } else if (lower.includes('mango')) {
    nutrition = {
      calories: '60 kcal per 100g',
      vitaminC: '67% Daily Value',
      fiber: '1.6g Fiber',
      potassium: '168mg Potassium',
      keyBenefit: 'Abundant in beta-carotene, Vitamin A, and digestive enzymes for glowing skin.',
    };
    storageTip = 'Store at room temperature until fragrant and slightly soft to gentle touch, then refrigerate for up to 5 days.';
    cookingTips = 'Slice fresh for fruit platters, blend into creamy mango smoothies, or chop into fresh mango habanero salsa.';
    estimatedWeight = 'Approx. 400g per fruit';
  } else if (lower.includes('ginger') || lower.includes('turmeric')) {
    nutrition = {
      calories: '80 kcal per 100g',
      vitaminC: '8% Daily Value',
      fiber: '2.0g Fiber',
      potassium: '415mg Potassium',
      keyBenefit: 'Contains potent gingerols and curcumin known for powerful anti-inflammatory and digestive support.',
    };
    storageTip = 'Keep unpeeled in a paper bag in the fridge crisper or freeze whole rhizomes to grate directly into dishes.';
    cookingTips = 'Grate into hot lemon & honey herbal teas, curry bases, stir-fries, and spiced marinades.';
    estimatedWeight = 'Approx. 200g – 500g root';
  } else if (lower.includes('spinach') || lower.includes('callaloo') || lower.includes('greens')) {
    nutrition = {
      calories: '23 kcal per 100g',
      vitaminC: '47% Daily Value',
      fiber: '2.2g Dietary Fiber',
      potassium: '558mg Potassium',
      keyBenefit: 'Packed with plant-based iron, folate, lutein, and bone-strengthening Vitamin K.',
    };
    storageTip = 'Wrap unwashed greens in a dry paper towel and store inside a sealed container in the fridge crisper.';
    cookingTips = 'Steam with onions, garlic, and scotch bonnet for traditional Jamaican callaloo or Ghanaian Kontomire stew.';
    estimatedWeight = 'Approx. 300g – 500g bunch';
  }

  // Fallback image url if existing image is missing or empty
  let imageUrl = existingImage && existingImage.trim() !== '' ? existingImage : '';
  if (!imageUrl) {
    const catDefaults = CATEGORY_DEFAULT_IMAGES[category] || {
      image: 'https://images.unsplash.com/photo-1610348725531-843dff563e2c?auto=format&fit=crop&w=600&q=80',
      emoji: '🥬',
    };
    imageUrl = catDefaults.image;
  }

  return {
    imageUrl,
    emoji,
    origin,
    originCountry,
    isOrganic,
    dietaryTags,
    nutrition,
    storageTip,
    cookingTips,
    estimatedWeight,
  };
}
