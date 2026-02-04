/**
 * Funda.nl Property Transformer
 *
 * Transforms Dutch property data from Funda API to StandardProperty format.
 * Preserves country-specific Dutch market conventions in country_specific field.
 */

import type { FundaPropertyData } from './types.js';

/**
 * StandardProperty type based on @landomo/core
 * This is the target format for Core Service ingestion
 */
export interface StandardProperty {
  // Basic info
  title: string;
  price: number;
  currency: string;
  property_type: string;
  transaction_type: 'sale' | 'rent';
  source_url?: string;

  // Location
  location: {
    address?: string;
    city: string;
    region?: string;
    country: string;
    postal_code?: string;
    coordinates?: {
      lat: number;
      lon: number;
    };
  };

  // Details
  details: {
    bedrooms?: number;
    bathrooms?: number;
    sqm?: number;
    sqm_type?: string;
    floor?: number;
    total_floors?: number;
    rooms?: number;
    year_built?: number;
  };

  // Media
  images?: string[];
  videos?: string[];
  description?: string;
  description_language?: string;

  // Agent/Agency
  agent?: {
    name: string;
    phone?: string;
    email?: string;
    agency?: string;
  };

  // Features
  features?: string[];

  // Amenities
  amenities?: {
    has_parking?: boolean;
    has_garden?: boolean;
    has_balcony?: boolean;
    has_terrace?: boolean;
    has_pool?: boolean;
    has_elevator?: boolean;
    has_garage?: boolean;
    has_basement?: boolean;
    has_fireplace?: boolean;
    is_furnished?: boolean;
    is_new_construction?: boolean;
    is_luxury?: boolean;
  };

  // Energy rating
  energy_rating?: string;

  // Financial
  price_per_sqm?: number;
  hoa_fees?: number;
  property_tax?: number;

  // Country-specific fields (Dutch market conventions)
  country_specific?: Record<string, any>;

  // Status
  status?: 'active' | 'removed' | 'sold' | 'rented';
}

/**
 * Normalize Dutch property type to standardized type
 */
function normalizePropertyType(dutchType?: string, objectType?: string): string {
  if (!dutchType && !objectType) return 'property';

  const combined = `${dutchType || ''} ${objectType || ''}`.toLowerCase();

  // Apartments
  if (combined.includes('appartement') || combined.includes('apartment')) {
    return 'apartment';
  }

  // Houses
  if (
    combined.includes('woning') ||
    combined.includes('eengezinswoning') ||
    combined.includes('huis')
  ) {
    return 'house';
  }

  // Villa
  if (combined.includes('villa')) {
    return 'villa';
  }

  // Bungalow
  if (combined.includes('bungalow')) {
    return 'bungalow';
  }

  // Studio
  if (combined.includes('studio')) {
    return 'studio';
  }

  // Room
  if (combined.includes('kamer')) {
    return 'room';
  }

  // Land/Garden
  if (combined.includes('tuin') || combined.includes('grond')) {
    return 'land';
  }

  // New construction
  if (combined.includes('nieuwbouw')) {
    return 'new-construction';
  }

  // Farm
  if (combined.includes('boerderij')) {
    return 'farm';
  }

  return 'property';
}

/**
 * Parse price per square meter
 */
function parsePricePerSqm(pricePerSqmStr?: string): number | undefined {
  if (!pricePerSqmStr) return undefined;

  const cleaned = pricePerSqmStr.replace(/[€\s.]/g, '').replace(',', '.');
  const num = parseFloat(cleaned);
  return isNaN(num) ? undefined : num;
}

/**
 * Extract features from energy label and parking
 */
function extractFeatures(data: FundaPropertyData): string[] {
  const features: string[] = [];

  if (data.energyLabel) {
    features.push(`Energy Label: ${data.energyLabel}`);
  }

  if (data.parkingType) {
    features.push(`Parking: ${data.parkingType}`);
  }

  if (data.constructionType) {
    features.push(`Construction: ${data.constructionType}`);
  }

  return features;
}

/**
 * Transform Funda property data to StandardProperty format
 */
export function transformToStandard(data: FundaPropertyData): StandardProperty {
  const propertyType = normalizePropertyType(data.dutchPropertyType, data.objectType);
  const pricePerSqm = parsePricePerSqm(data.pricePerSqm);

  // Build country-specific fields for Dutch market conventions
  const countrySpecific: Record<string, any> = {};

  // Dutch property type (original)
  if (data.dutchPropertyType) {
    countrySpecific.dutch_property_type = data.dutchPropertyType;
  }

  // Construction type (Bouwvorm)
  if (data.constructionType) {
    countrySpecific.construction_type = data.constructionType;
  }

  // Parking type
  if (data.parkingType) {
    countrySpecific.parking_type = data.parkingType;
  }

  // Province (Dutch administrative division)
  if (data.province) {
    countrySpecific.province = data.province;
  }

  // Energy label (important in Netherlands)
  if (data.energyLabel) {
    countrySpecific.energy_label = data.energyLabel;
  }

  // Plot size (garden/land area)
  if (data.plotSqm) {
    countrySpecific.plot_sqm = data.plotSqm;
  }

  // Price per square meter
  if (pricePerSqm) {
    countrySpecific.price_per_sqm_original = data.pricePerSqm;
  }

  // Object insights (views and saves)
  if (data.views) {
    countrySpecific.views = data.views;
  }
  if (data.saves) {
    countrySpecific.saves = data.saves;
  }

  // Publication date
  if (data.publicationDate) {
    countrySpecific.publication_date = data.publicationDate;
  }

  // Determine status
  let status: 'active' | 'removed' | 'sold' | 'rented' = 'active';
  if (data.isSoldOrRented) {
    status = data.transactionType === 'rent' ? 'rented' : 'sold';
  }

  return {
    title: data.title,
    price: data.price || 0,
    currency: data.currency,
    property_type: propertyType,
    transaction_type: data.transactionType === 'rent' ? 'rent' : 'sale',
    source_url: data.url,

    location: {
      address: data.address,
      city: data.city,
      region: data.province,
      country: data.country,
      postal_code: data.postalCode,
      coordinates:
        data.latitude && data.longitude
          ? {
              lat: data.latitude,
              lon: data.longitude,
            }
          : undefined,
    },

    details: {
      bedrooms: data.bedrooms,
      bathrooms: data.bathrooms,
      sqm: data.sqm,
      sqm_type: 'living',
      rooms: data.rooms,
      year_built: data.yearBuilt,
    },

    images: data.images || [],
    description: data.description,
    description_language: 'nl',

    features: extractFeatures(data),

    amenities: {
      has_parking: data.hasParking || false,
      has_garden: data.plotSqm ? data.plotSqm > 0 : undefined,
      is_furnished: undefined, // Not available in current API parsing
      is_new_construction: data.dutchPropertyType?.toLowerCase().includes('nieuwbouw'),
    },

    energy_rating: data.energyLabel,
    price_per_sqm: pricePerSqm,

    country_specific: countrySpecific,

    status,
  };
}

/**
 * Build ingestion payload for Core Service
 */
export interface IngestionPayload {
  portal: string;
  portal_id: string;
  country: string;
  data: StandardProperty;
  raw_data: any;
}

export function buildIngestionPayload(
  data: FundaPropertyData,
  rawData?: any,
): IngestionPayload {
  return {
    portal: 'funda',
    portal_id: data.tinyId,
    country: 'netherlands',
    data: transformToStandard(data),
    raw_data: rawData || data,
  };
}
