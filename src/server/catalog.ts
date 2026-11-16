// Artículos de ejemplo. Nombres y precios de referencia (nuevos) obtenidos de la API pública de SoloTodo.cl
// el 2026-11-16. Las descripciones son propias. Las fotos se muestran
// directamente desde SoloTodo (no se copian al repositorio) y pertenecen a sus dueños.

export interface CatalogItem {
  name: string;
  kind: string;
  emoji: string;
  category: 'electrohogar' | 'tecnologia';
  /** Foto del producto servida por SoloTodo (versión reducida). */
  image: string;
  /** Precio de referencia del producto nuevo en SoloTodo, en CLP. */
  ref: number;
}

export const CATALOG: CatalogItem[] = [
  {
    name: "Albin Trotter AT-MD DAMPF 3",
    image: "https://publicapi.solotodo.com/products/268035/picture/?width=500&height=500",
    kind: "Hervidores",
    emoji: "🫖",
    category: "electrohogar",
    ref: 19990
  },
  {
    name: "FDV Steel",
    image: "https://publicapi.solotodo.com/products/268038/picture/?width=500&height=500",
    kind: "Hervidores",
    emoji: "🫖",
    category: "electrohogar",
    ref: 19590
  },
  {
    name: "Nespresso Vertuo Lattissima - Negro",
    image: "https://publicapi.solotodo.com/products/267258/picture/?width=500&height=500",
    kind: "Cafeteras",
    emoji: "☕",
    category: "electrohogar",
    ref: 254990
  },
  {
    name: "Krups XP381810 - Black",
    image: "https://publicapi.solotodo.com/products/356448/picture/?width=500&height=500",
    kind: "Cafeteras",
    emoji: "☕",
    category: "electrohogar",
    ref: 98991
  },
  {
    name: "FDV HAT-9741 SL",
    image: "https://publicapi.solotodo.com/products/268784/picture/?width=500&height=500",
    kind: "Licuadoras",
    emoji: "🥤",
    category: "electrohogar",
    ref: 25990
  },
  {
    name: "Wurden WBL-KRAFT1500P",
    image: "https://publicapi.solotodo.com/products/268187/picture/?width=500&height=500",
    kind: "Licuadoras",
    emoji: "🥤",
    category: "electrohogar",
    ref: 49990
  },
  {
    name: "Homen FREIDORA55",
    image: "https://publicapi.solotodo.com/products/396374/picture/?width=500&height=500",
    kind: "Air fryers",
    emoji: "🍟",
    category: "electrohogar",
    ref: 39990
  },
  {
    name: "Kitchen-It Smart Edition 25 Lts",
    image: "https://publicapi.solotodo.com/products/353320/picture/?width=500&height=500",
    kind: "Air fryers",
    emoji: "🍟",
    category: "electrohogar",
    ref: 129990
  },
  {
    name: "Kioto Matsue 26",
    image: "https://publicapi.solotodo.com/products/231262/picture/?width=500&height=500",
    kind: "Hornos y Microondas",
    emoji: "♨️",
    category: "electrohogar",
    ref: 29990
  },
  {
    name: "Doral Milan",
    image: "https://publicapi.solotodo.com/products/269687/picture/?width=500&height=500",
    kind: "Sandwicheras",
    emoji: "🥪",
    category: "electrohogar",
    ref: 29990
  },
  {
    name: "Groner OYBW60100H2",
    image: "https://publicapi.solotodo.com/products/276570/picture/?width=500&height=500",
    kind: "Ollas eléctricas",
    emoji: "🍲",
    category: "electrohogar",
    ref: 84990
  },
  {
    name: "Doral Singapur",
    image: "https://publicapi.solotodo.com/products/271696/picture/?width=500&height=500",
    kind: "Planchas",
    emoji: "👕",
    category: "electrohogar",
    ref: 21990
  },
  {
    name: "Black & Decker HLVA325J10-B2C",
    image: "https://publicapi.solotodo.com/products/230609/picture/?width=500&height=500",
    kind: "Aspiradoras",
    emoji: "🧹",
    category: "electrohogar",
    ref: 55990
  },
  {
    name: "SwitchBot K10+",
    image: "https://publicapi.solotodo.com/products/259018/picture/?width=500&height=500",
    kind: "Aspiradoras",
    emoji: "🧹",
    category: "electrohogar",
    ref: 229990
  },
  {
    name: "Anwo PN2000DL",
    image: "https://publicapi.solotodo.com/products/72689/picture/?width=500&height=500",
    kind: "Estufas",
    emoji: "🔥",
    category: "electrohogar",
    ref: 99990
  },
  {
    name: "Toyotomi GH-HB62 (Red)",
    image: "https://publicapi.solotodo.com/products/38510/picture/?width=500&height=500",
    kind: "Estufas",
    emoji: "🔥",
    category: "electrohogar",
    ref: 219990
  },
  {
    name: "Xiaomi TV A Pro 65 2025",
    image: "https://publicapi.solotodo.com/products/250667/picture/?width=500&height=500",
    kind: "Televisores",
    emoji: "📺",
    category: "tecnologia",
    ref: 469990
  },
  {
    name: "Blik Lightup701",
    image: "https://publicapi.solotodo.com/products/256111/picture/?width=500&height=500",
    kind: "Equipos de audio",
    emoji: "🔊",
    category: "tecnologia",
    ref: 119990
  },
  {
    name: "Bestway Parlante Bluetooth Flotante (58700)",
    image: "https://publicapi.solotodo.com/products/225409/picture/?width=500&height=500",
    kind: "Equipos de audio",
    emoji: "🔊",
    category: "tecnologia",
    ref: 24990
  },
  {
    name: "Apple AirPods Pro 3 with USB-C MagSafe Charging Case (MFHP4LL/A)",
    image: "https://publicapi.solotodo.com/products/382219/picture/?width=500&height=500",
    kind: "Audífonos",
    emoji: "🎧",
    category: "tecnologia",
    ref: 289990
  },
  {
    name: "Havit Gaming Headphone (HV-H2168D)",
    image: "https://publicapi.solotodo.com/products/79561/picture/?width=500&height=500",
    kind: "Audífonos",
    emoji: "🎧",
    category: "tecnologia",
    ref: 9490
  },
  {
    name: "Apple iPhone 12 Pro Max (128 GB / Pacific Blue)",
    image: "https://publicapi.solotodo.com/products/92622/picture/?width=500&height=500",
    kind: "Celulares",
    emoji: "📱",
    category: "tecnologia",
    ref: 439990
  },
  {
    name: "Apple iPhone 15 Pro (128 GB / Natural Titanium)",
    image: "https://publicapi.solotodo.com/products/221836/picture/?width=500&height=500",
    kind: "Celulares",
    emoji: "📱",
    category: "tecnologia",
    ref: 749990
  },
  {
    name: "Xiaomi Redmi Note 14 Pro 5G (256 GB / 8 GB / Midnight Black)",
    image: "https://publicapi.solotodo.com/products/264139/picture/?width=500&height=500",
    kind: "Celulares",
    emoji: "📱",
    category: "tecnologia",
    ref: 199990
  },
  {
    name: "Kodak K10 (64 GB / 4 GB / Black)",
    image: "https://publicapi.solotodo.com/products/391062/picture/?width=500&height=500",
    kind: "Tablets",
    emoji: "📲",
    category: "tecnologia",
    ref: 126390
  },
  {
    name: "Apple iPad Air 11.0 2024 (Wi-Fi / 128 GB / Space Gray)",
    image: "https://publicapi.solotodo.com/products/243086/picture/?width=500&height=500",
    kind: "Tablets",
    emoji: "📲",
    category: "tecnologia",
    ref: 731990
  },
  {
    name: "HP 15-FD0022LA",
    image: "https://publicapi.solotodo.com/products/355430/picture/?width=500&height=500",
    kind: "Notebooks",
    emoji: "💻",
    category: "tecnologia",
    ref: 659990
  },
  {
    name: "HP 348 G7",
    image: "https://publicapi.solotodo.com/products/112943/picture/?width=500&height=500",
    kind: "Notebooks",
    emoji: "💻",
    category: "tecnologia",
    ref: 379990
  },
  {
    name: "ArgomTech Skeiwatch C60 - Black",
    image: "https://publicapi.solotodo.com/products/211579/picture/?width=500&height=500",
    kind: "Wearables",
    emoji: "⌚",
    category: "tecnologia",
    ref: 61990
  },
  {
    name: "Canon PIXMA iX6810",
    image: "https://publicapi.solotodo.com/products/16034/picture/?width=500&height=500",
    kind: "Impresoras",
    emoji: "🖨️",
    category: "tecnologia",
    ref: 185990
  }
];
