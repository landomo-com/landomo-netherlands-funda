import type { PageListing, FundaProperty, TransactionType, FundaPropertyData } from './types.js';

const BASE_URL = 'https://www.funda.nl';

/**
 * Parse price string to number
 */
function parsePrice(priceText: string | null): number | null {
  if (!priceText) return null;
  const cleaned = priceText.replace(/[€\s.]/g, '').replace(',', '.');
  const num = parseInt(cleaned, 10);
  return isNaN(num) ? null : num;
}

/**
 * Detect if price is monthly (per maand) or total
 */
function determinePriceUnit(priceText: string): 'total' | 'per_month' {
  if (!priceText) return 'total';
  return priceText.toLowerCase().includes('per maand') || priceText.toLowerCase().includes('/maand')
    ? 'per_month'
    : 'total';
}

/**
 * Extract sqm from text
 */
function extractSqm(text: string | null): number | undefined {
  if (!text) return undefined;
  const match = text.match(/(\d+)\s*m[²2]/i);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Extract number from text
 */
function extractNumber(text: string | null): number | undefined {
  if (!text) return undefined;
  const match = text.match(/(\d+)/);
  return match ? parseInt(match[1], 10) : undefined;
}

/**
 * Detect property type from URL and title
 */
function detectPropertyType(url: string, title: string): string {
  const combined = (url + ' ' + title).toLowerCase();
  if (combined.includes('appartement') || combined.includes('apartment')) return 'apartment';
  if (combined.includes('huis') || combined.includes('woning') || combined.includes('house')) return 'house';
  if (combined.includes('studio')) return 'studio';
  if (combined.includes('kamer') || combined.includes('room')) return 'room';
  if (combined.includes('villa')) return 'villa';
  if (combined.includes('tuin') || combined.includes('garden')) return 'land';
  return 'property';
}

/**
 * Parse page listing to normalized property
 */
export function normalizeProperty(
  listing: PageListing,
  transactionType: TransactionType,
): FundaProperty | null {
  if (!listing.title && !listing.price) {
    return null;
  }

  const url = listing.link || '#';
  const price = parsePrice(typeof listing.price === 'string' ? listing.price : String(listing.price || ''));
  const priceUnit = determinePriceUnit(typeof listing.price === 'string' ? listing.price : String(listing.price || ''));
  const sqm = extractSqm(typeof listing.sqm === 'string' ? listing.sqm : String(listing.sqm || ''));
  const rooms = extractNumber(typeof listing.rooms === 'string' ? listing.rooms : String(listing.rooms || ''));
  const bedrooms = extractNumber(typeof listing.bedrooms === 'string' ? listing.bedrooms : String(listing.bedrooms || ''));

  return {
    id: listing.id || `funda-${Date.now()}-${Math.random()}`,
    source: 'funda-netherlands',
    url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
    title: listing.title || listing.address || 'Property',
    price,
    currency: 'EUR',
    priceUnit,
    propertyType: detectPropertyType(url, listing.title || ''),
    transactionType,
    status: 'available',
    location: {
      address: listing.address,
      city: 'Netherlands',
      country: 'Netherlands',
    },
    details: {
      sqm,
      rooms,
      bedrooms,
    },
    features: [],
    images: listing.image ? [listing.image] : [],
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Normalize property from REST API response
 */
export function normalizePropertyFromAPI(data: FundaPropertyData): FundaProperty | null {
  if (!data.title && !data.price) {
    return null;
  }

  // Determine property type from Dutch naming
  let propertyType = 'property';
  if (data.dutchPropertyType) {
    const dutch = data.dutchPropertyType.toLowerCase();
    if (dutch.includes('appartement')) propertyType = 'apartment';
    else if (dutch.includes('huis') || dutch.includes('woning')) propertyType = 'house';
    else if (dutch.includes('studio')) propertyType = 'studio';
    else if (dutch.includes('villa')) propertyType = 'villa';
    else if (dutch.includes('bungalow')) propertyType = 'bungalow';
    else if (dutch.includes('tuin')) propertyType = 'land';
    else if (dutch.includes('nieuwbouw')) propertyType = 'new-construction';
  } else if (data.objectType) {
    const obj = data.objectType.toLowerCase();
    if (obj.includes('apartment')) propertyType = 'apartment';
    else if (obj.includes('house')) propertyType = 'house';
    else if (obj.includes('studio')) propertyType = 'studio';
    else if (obj.includes('villa')) propertyType = 'villa';
  }

  // Determine price unit
  const priceUnit = data.transactionType === 'rent' ? 'per_month' : 'total';

  // Status
  let status = 'available';
  if (data.isSoldOrRented) {
    status = data.transactionType === 'rent' ? 'rented' : 'sold';
  }

  return {
    id: data.tinyId,
    source: 'funda-netherlands-api',
    url: data.url,
    title: data.title,
    price: data.price,
    currency: data.currency,
    priceUnit,
    propertyType,
    transactionType: data.transactionType,
    status,
    location: {
      address: data.address,
      city: data.city,
      country: data.country,
      postalCode: data.postalCode,
      latitude: data.latitude,
      longitude: data.longitude,
    },
    details: {
      sqm: data.sqm,
      rooms: data.rooms,
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      yearBuilt: data.yearBuilt,
      gardenSqm: data.plotSqm,
      parking: data.hasParking,
    },
    features: data.energyLabel ? [`Energy Label: ${data.energyLabel}`] : [],
    images: data.images,
    description: data.description,
    scrapedAt: data.scrapedAt,
  };
}

/**
 * Parse listings page HTML using Playwright's evaluate context
 * This function is meant to be executed in browser context
 */
export function extractListingsFromPage(): PageListing[] {
  const items: PageListing[] = [];

  // Multiple selectors for different page layouts
  const selectors = [
    '[data-test-id="search-result-item"]',
    '[class*="search-result"]',
    '[class*="listing-card"]',
    '[class*="property-card"]',
    'article',
    'li[data-id]',
  ];

  let elements: Element[] = [];

  for (const selector of selectors) {
    const found = document.querySelectorAll(selector);
    if (found.length > 0) {
      elements = Array.from(found);
      break;
    }
  }

  elements.forEach((card: Element, index: number) => {
    try {
      const priceEl = card.querySelector('[class*="price"], span[class*="prijs"]');
      const addressEl = card.querySelector('[class*="address"], [class*="adres"], h2, h3');
      const sizeEl = card.querySelector('[class*="size"], [class*="area"], [class*="m2"], [class*="m²"]');
      const roomsEl = card.querySelector('[class*="room"], [class*="kamer"]');
      const linkEl = card.querySelector('a[href]');
      const imgEl = card.querySelector('img');

      const listing: PageListing = {
        id: (card as HTMLElement).getAttribute('data-id') || `listing-${index}`,
        title: addressEl?.textContent?.trim(),
        price: priceEl?.textContent?.trim(),
        address: addressEl?.textContent?.trim(),
        sqm: sizeEl?.textContent?.trim(),
        rooms: roomsEl?.textContent?.trim(),
        link: linkEl?.getAttribute('href') || undefined,
        image: (imgEl as HTMLImageElement)?.src || (imgEl as HTMLImageElement)?.getAttribute('data-src') || undefined,
      };

      if (listing.title || listing.price) {
        items.push(listing);
      }
    } catch (e) {
      // Skip malformed items
    }
  });

  return items;
}
