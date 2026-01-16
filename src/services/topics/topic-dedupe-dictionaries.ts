/**
 * Stop words to ignore when comparing keywords
 */
export const STOP_WORDS = new Set([
  // Articles and prepositions
  'a',
  'an',
  'the',
  'for',
  'of',
  'to',
  'in',
  'on',
  'at',
  'by',
  'with',
  'and',
  'n', // n is and's short form
  'or',
  'ages',

  // Very generic verbs might be safe to ignore for topic identity,
  // but "review" and "guide" are distinct content types.
  // "buy", "shop" are borderline, but usually "buy X" maps to the "X" topic page.
  'buy',
  'shop',
  'purchase',
  'order',
  'online', // "online" can be redundant for an internet store
  'store',

  //
  'clubs',
  'club',

  // Weights/Dimensions often create noise in topic grouping (e.g. "laptop 15 inch" vs "laptop")
  // depending on strictness, we might want to keep these or ignore them.
  // For broad topic clustering, ignoring them helps.
  'inch',
  'inches',
  'oz',
  'pound',
  'pounds',
  'lb',
  'lbs',
  'kg',
  'needed',
  // 'pack', 'set' etc can differentiate "Gift Set" vs "Gift".
  // Let's be conservative and remove them from Stop Words if we want distinct pages.
  // But often "Batteries 4 pack" is just "Batteries".
  // Leaving strict units as stop words seems safer for "Topic" (Entity) resolution.
])

/**
 * Common plural suffixes for normalization
 */
export const PLURAL_PATTERNS: Array<{ pattern: RegExp; replacement: string }> = [
  { pattern: /less$/i, replacement: 'less' }, // protect -less words: wireless, cordless, harmless
  { pattern: /ies$/i, replacement: 'y' }, // batteries -> battery
  { pattern: /ves$/i, replacement: 'f' }, // knives -> knife (handling general case if missed in irregulars)
  { pattern: /oes$/i, replacement: 'o' }, // heroes -> hero, tomatoes -> tomato
  { pattern: /ses$/i, replacement: 's' }, // glasses -> glass (but keep final s)
  { pattern: /xes$/i, replacement: 'x' }, // boxes -> box
  { pattern: /ches$/i, replacement: 'ch' }, // watches -> watch
  { pattern: /shes$/i, replacement: 'sh' }, // dishes -> dish
  { pattern: /s$/i, replacement: '' }, // general plural
]

/**
 * Pre-processing regex replacements (applied to full keyword before splitting)
 * Used for normalizing unit abbreviations attached to numbers
 *
 * Examples:
 * - "12v" -> "12 volt"
 * - "48v" -> "48 volt"
 * - "100w" -> "100 watt"
 * - "2.4ghz" -> "2.4 ghz"
 * - "5lb" -> "5 lb"
 * - "10in" -> "10 inch"
 */
export const REGEX_REPLACEMENTS: Array<{ pattern: RegExp; replacement: string }> = [
  // 注意: 所有规则使用 \s* 同时匹配有空格和无空格的情况
  // 例如: "12v" / "12 v" / "12 volt" 都匹配

  // === Electrical ===
  // Voltage: 12v, "12 v", 12volt, "12 volt" -> 12 volt
  { pattern: /(\d+)\s*(v|volt)\b/gi, replacement: '$1 volt' },
  // Wattage: 100w, "100 w", 100watt, "100 watt" -> 100 watt
  { pattern: /(\d+)\s*(w|watt)\b/gi, replacement: '$1 watt' },
  // Amperage: 2a, "2 a", 2amp, "2 amp" -> 2 amp
  { pattern: /(\d+)\s*(a|amp)\b/gi, replacement: '$1 amp' },
  // Frequency: 2.4ghz, "2.4 ghz" -> 2.4 ghz
  { pattern: /(\d+(?:\.\d+)?)\s*ghz\b/gi, replacement: '$1 ghz' },
  // Frequency: 900mhz, "900 mhz" -> 900 mhz
  { pattern: /(\d+)\s*mhz\b/gi, replacement: '$1 mhz' },

  // === Weight ===
  // Pounds: 5lb, 5lbs, "5 lb", "5 lbs" -> 5 lb
  { pattern: /(\d+(?:\.\d+)?)\s*lbs?\b/gi, replacement: '$1 lb' },
  // Kilograms: 2kg, "2 kg" -> 2 kg
  { pattern: /(\d+(?:\.\d+)?)\s*kgs?\b/gi, replacement: '$1 kg' },
  // Ounces: 16oz, "16 oz" -> 16 oz
  { pattern: /(\d+(?:\.\d+)?)\s*oz\b/gi, replacement: '$1 oz' },
  // Grams: 500g, "500 g" -> 500 g
  { pattern: /(\d+(?:\.\d+)?)\s*g\b/gi, replacement: '$1 g' },

  // === Length / Size ===
  // Inches: 10in, 10inch, "10 in", "10 inch" -> 10 inch
  { pattern: /(\d+(?:\.\d+)?)\s*(in|inch)\b/gi, replacement: '$1 inch' },
  // Feet: 5ft, 6feet, 8foot, "8 foot", "8 feet" -> 5 ft
  { pattern: /(\d+(?:\.\d+)?)\s*(ft|feet|foot)\b/gi, replacement: '$1 ft' },
  // Centimeters: 100cm, "100 cm" -> 100 cm
  { pattern: /(\d+(?:\.\d+)?)\s*cm\b/gi, replacement: '$1 cm' },
  // Millimeters: 10mm, "10 mm" -> 10 mm
  { pattern: /(\d+(?:\.\d+)?)\s*mm\b/gi, replacement: '$1 mm' },
  // Meters: 2m, "2 m" -> 2 m (注意：放在 mm 后面，避免匹配 mm 的 m)
  { pattern: /(\d+(?:\.\d+)?)\s*m\b/gi, replacement: '$1 m' },

  // === Age ===
  // "6 year old" / "6-year-old" / "6 years old" -> "6 age"
  { pattern: /(\d+)[-\s]*years?[-\s]*old\b/gi, replacement: '$1 age' },

  // === Size Modifiers (尺寸修饰词) ===
  // 当数字后跟尺寸词时，移除尺寸词只保留数字
  // "13 midsize" / "10 medium" / "32 regular" / "8 wide" -> 只保留数字
  // 包括：尺寸(small/medium/large/xl)、宽度(wide/narrow)、样式(regular/slim/fitted)
  {
    pattern:
      /(\d+(?:\.\d+)?)\s*(packs?|packages?|midsize|standard|oversize|jumbo|undersize|small|medium|large|xl|xxl|xs|wide|narrow|regular|slim|fitted|loose|relaxed)\b/gi,
    replacement: '$1',
  },

  // === Compound Words ===
  // "slip on" / "slip-on" / "slip ons" -> "slipon"
  { pattern: /\bslip[\s-]*ons?\b/gi, replacement: 'slipon' },
]

/**
 * Canonical Word Mapping (Map Key -> Value)
 * These are replaced BEFORE processing word sets.
 * Used for:
 * 1. Pure synonyms: "fridge" -> "refrigerator"
 * 2. Irregular plurals: "children" -> "child"
 * 3. Exceptions to s-stripping: "wireless" -> "wireless"
 */
export const CANONICAL_WORD_MAP: Record<string, string> = {
  // --- Irregular Plurals (formerly IRREGULAR_PLURALS) ---
  children: 'child',
  childrens: 'child',
  childs: 'child',
  women: 'woman',
  womens: 'woman',
  men: 'man',
  mens: 'man',
  mice: 'mouse',
  teeth: 'tooth',
  people: 'person',
  geese: 'goose',
  lives: 'life',
  leaves: 'leaf',
  knives: 'knife',
  scarves: 'scarf',
  crises: 'crisis',
  cacti: 'cactus',
  fungi: 'fungus',
  phenomena: 'phenomenon',
  criteria: 'criterion',
  data: 'datum',
  seater: 'seat',
  package: 'pack',
  seating: 'seat',
  lighting: 'light',
  flooring: 'floor',

  // Exceptions to s-stripping (prevent "wireless" -> "wireles")
  wireless: 'wireless',

  // --- Transport ---
  automobile: 'car',
  bike: 'bicycle',

  // --- Home & Furniture ---
  couch: 'sofa',

  // --- Fashion ---
  tshirt: 'shirt',
  tee: 'shirt',
  apparel: 'clothing',
  garment: 'clothing',

  // --- Electronics ---
  cellphone: 'phone',
  mobilephone: 'phone',

  // Appliances
  fridge: 'refrigerator',
  tv: 'television',

  // Tech
  pc: 'computer',
  mac: 'macbook',

  // Audio
  earphone: 'headphone',

  // Input
  gamepad: 'controller',
  joypad: 'controller',

  // --- Media ---
  movie: 'film',

  // --- Games ---
  gaming: 'game',

  // --- General ---
  cord: 'cable', // "ethernet cord" -> "ethernet cable", "power cord" -> "power cable"

  // British → American (如果想统一)
  grey: 'gray',
  colour: 'color',
  aluminium: 'aluminum',
  favourite: 'favorite',
  centre: 'center',
  metre: 'meter',
  litre: 'liter',
  tyre: 'tire',
  defence: 'defense',
  licence: 'license',
  organised: 'organized',
  specialised: 'specialized',

  // --- Age/Gender 年龄/性别 ---
  kid: 'child',
  kids: 'child',
  infant: 'baby',
  newborn: 'baby',
  ladies: 'woman',
  lady: 'woman',
  gents: 'man',
  gentleman: 'man',
  gentlemen: 'man',

  // --- Synonyms 同义词 ---
  rucksack: 'backpack',
  knapsack: 'backpack',
  drapes: 'curtain',
  drapery: 'curtain',
  skillet: 'pan',

  // --- Spelling 拼写统一 ---
  adaptor: 'adapter',
  barbeque: 'bbq',
  barbecue: 'bbq',

  // --- Office 办公 ---
  stationary: 'stationery', // 常见拼写错误修正
  notepad: 'notebook',

  // --- Auto 汽车（英美统一）---
  auto: 'car',
  motorbike: 'motorcycle',
  windscreen: 'windshield',
  bonnet: 'hood',
  boot: 'trunk',

  // --- Eyewear 眼镜 ---
  eyeglasses: 'glasses',
  shades: 'sunglasses',

  // --- Footwear 鞋类（英美统一）---
  trainer: 'sneaker',
  trainers: 'sneaker',

  // --- Jewelry 珠宝 ---
  jewellery: 'jewelry',
  jewelery: 'jewelry',

  // --- Cleaning 清洁 ---
  cleanser: 'cleaner',

  // --- Accessories 配件 ---
  billfold: 'wallet',

  // --- Bathroom 浴室（英美统一）---
  washroom: 'bathroom',
  restroom: 'bathroom',

  // --- Music 乐器 ---
  ukelele: 'ukulele',

  // --- Baby 婴儿（英美统一）---
  pram: 'stroller',
  nappy: 'diaper',
  nappies: 'diaper',
  dummy: 'pacifier',

  // --- Animals 动物 ---
  bunny: 'rabbit',
  bunnies: 'rabbit',

  // --- Food 食品（英美统一）---
  crisps: 'chips',
  biscuit: 'cookie',
  biscuits: 'cookie',
  sweets: 'candy',
  aubergine: 'eggplant',
  courgette: 'zucchini',

  // --- Fitness 健身 ---
  dumbell: 'dumbbell',

  // --- Legacy Brands 旧品牌示例 ---
  dri: 'dritac', // Dri-Tac 握把品牌，dri 是用户常用缩写

  // --- Footwear 鞋类 ---
  shoe: 'shoe', // 保护 "shoe" 不被 -es 规则错误处理
  shoes: 'shoe',
  sho: 'shoe', // 修正错误规范化
  spiked: 'spikes',

  // --- Compound Words 复合词 ---
  slipon: 'slip ons',
  slipons: 'slip ons',
  'slip on': 'slip ons',
}

/**
 * Context-dependent stop words (Tautological Reductions)
 *
 * **🎯 SEO 目的 (SEO Purpose):**
 * 去重的核心目标是避免内容稀释（Content Cannibalization）。
 * 将多个相似关键词合并到一个更通用、搜索量更大的主题页面，
 * 集中权重和流量，提升 SEO 排名效果。
 *
 * 例如：
 * - "12v led christmas lights" 和 "12v christmas lights" → 合并到 "christmas lights" 页面
 * - "led light" → 保留 "light"（统称），移除 "led"（具体类型）
 *
 * **核心原则 (Core Principle):**
 * 仅包含"同义重复"（Tautology）的情况，即移除后不改变关键词核心含义的词汇。
 * 优先保留更通用的词汇（搜索量更大），移除具体类型/修饰词。
 *
 * **使用规则 (Usage Rules):**
 * - Key: 触发词（必须存在于词组中，通常是更通用的词）
 * - Value: 当触发词存在时要移除的冗余词汇数组（通常是具体类型/修饰词）
 *
 * **⚠️ 执行顺序 (Execution Order):**
 * 1. 先应用 CANONICAL_WORD_MAP 进行词汇规范化
 * 2. 再应用 CONTEXT_DEPENDENT_STOP_WORDS 移除冗余词
 *
 * **💡 配置注意事项 (Configuration Notes):**
 * 如果 CANONICAL_WORD_MAP 中有映射（如 `mac -> macbook`），
 * 则 CONTEXT_DEPENDENT_STOP_WORDS 中应使用规范化后的词（`macbook`），而非原词（`mac`）。
 *
 * 示例：
 * - CANONICAL_WORD_MAP: `{ mac: 'macbook' }`
 * - CONTEXT_DEPENDENT_STOP_WORDS: `{ macbook: ['computer'] }`  ✅ 正确
 * - CONTEXT_DEPENDENT_STOP_WORDS: `{ mac: ['computer'] }`      ❌ 错误（规则不会生效）
 *
 * **✅ 符合原则的例子 (Valid Examples):**
 * - `light: ['led']` → "led light" 简化为 "light"
 *   ✓ light 是统称（SEO 价值更高），led 是具体类型修饰词
 * - `vacuum: ['cleaner']` → "vacuum cleaner" 简化为 "vacuum"
 *   ✓ vacuum 本身就是吸尘器，cleaner 是冗余描述
 * - `laptop: ['computer']` → "laptop computer" 简化为 "laptop"
 *   ✓ laptop 本身就是笔记本电脑
 *
 * **❌ 不符合原则的反例 (Invalid Examples):**
 * - `wifi: ['router']` → "wifi router" 简化为 "wifi"
 *   ✗ wifi ≠ router，移除会丢失"路由器"这个产品信息
 * - `protein: ['powder']` → "protein powder" 简化为 "protein"
 *   ✗ protein powder 是特定产品形态，移除会改变含义
 *
 * **添加新条目前请确认 (Before Adding New Entries):**
 * 1. 移除指定词汇后，关键词的核心含义是否保持不变？
 * 2. 保留的词是否是更通用的词（SEO 搜索量更大）？
 * 3. 如果词汇在 CANONICAL_WORD_MAP 中有映射，是否使用了规范化后的词？
 */
export const CONTEXT_DEPENDENT_STOP_WORDS: Record<string, string[]> = {
  // Networking
  wifi: ['internet'],
  bluetooth: ['wireless'], // "bluetooth wireless" -> "bluetooth" (蓝牙本身就是无线技术)

  // Computers & Tech
  laptop: ['computer', 'pc'], // "laptop computer" -> "laptop"
  desktop: ['computer', 'pc'],
  tablet: ['computer', 'pc'],
  macbook: ['computer', 'laptop', 'notebook', 'apple'], // "apple macbook laptop" -> "macbook"
  thinkpad: ['laptop', 'computer', 'notebook', 'lenovo'], // "lenovo thinkpad laptop" -> "thinkpad"
  chromebook: ['laptop', 'computer'], // "chromebook laptop" -> "chromebook"
  webcam: ['camera'], // "webcam camera" -> "webcam"

  // Mobile Devices
  smartphone: ['phone'], // "smartphone phone" -> "smartphone"

  // Display Devices
  monitor: ['display'], // "monitor display" -> "monitor"

  // Storage Devices
  ssd: ['drive', 'storage'], // "ssd drive" -> "ssd"
  hdd: ['drive', 'storage'], // "hdd drive" -> "hdd"

  // Power & Charging
  charger: ['adapter'], // "charger adapter" -> "charger"

  // Input Devices
  keyboard: ['typing'], // "keyboard typing" -> "keyboard"
  trackpad: ['touchpad'], // "trackpad touchpad" -> "trackpad"

  // Audio Devices
  earbuds: ['headphone'], // "earbuds headphone" -> "earbuds"

  // clothing
  // TODO

  // NOTE: 不要将 led 和 light 合并
  // "12v led christmas lights" 和 "12v christmas lights" 是不同的 SEO 主题
  // LED 是具体产品类型，用户有明确搜索意图，应保留为独立主题页面

  // Appliances (Tautologies only)
  vacuum: ['cleaner'], // "vacuum cleaner" -> "vacuum"
  microwave: ['oven'], // "microwave oven" -> "microwave"
  washer: ['machine'], // "washing machine" -> "washer"
  dryer: ['machine'], // "dryer machine" -> "dryer"
  dishwasher: ['machine'], // "dishwasher machine" -> "dishwasher"

  // Consumables
  protein: ['supplement'],

  // Removed general categories (shoe, sock, soap, etc) as they are less specific than product variations.
}
