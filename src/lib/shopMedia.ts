// Curated deterministic mock media for approved barber shops.
// Uses Unsplash-hosted images (stable IDs) so no bundle bloat.

const SHOP_IMAGES = [
  'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1599351431202-1e0f0137899a?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1512690277411-b3a4b8b3f5a3?auto=format&fit=crop&w=800&q=80',
  'https://images.unsplash.com/photo-1596728325488-58c87691e9af?auto=format&fit=crop&w=800&q=80',
];

const DESCRIPTIONS = [
  'A refined space where classic barbering meets modern grooming. Precision cuts, hot-towel shaves, and a signature experience.',
  'Boutique barbershop offering premium fades, beard sculpting, and personalized styling in a luxurious setting.',
  'Timeless craftsmanship, contemporary style. Every appointment is tailored to bring out your sharpest look.',
  'Where every trim is an art. Expert barbers, curated products, and an atmosphere built for gentlemen.',
];

function hash(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return Math.abs(h);
}

export function shopImage(id: string): string {
  return SHOP_IMAGES[hash(id) % SHOP_IMAGES.length];
}

export function shopRating(id: string): { rating: number; reviews: number } {
  const h = hash(id);
  const rating = 4.4 + ((h % 60) / 100); // 4.40 – 4.99
  const reviews = 80 + (h % 480);
  return { rating: Math.round(rating * 10) / 10, reviews };
}

export function shopDescription(id: string): string {
  return DESCRIPTIONS[hash(id + 'd') % DESCRIPTIONS.length];
}
