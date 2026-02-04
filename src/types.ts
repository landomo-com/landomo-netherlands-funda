/**
 * Funda.nl Scraper Type Definitions
 */

export type TransactionType = 'sale' | 'rent' | 'unknown';

/**
 * Funda Scraper Configuration
 */
export interface FundaConfig {
  headless?: boolean;
  timeout?: number;
  delayMs?: number;
  redisUrl?: string;
  useRestAPI?: boolean; // Use REST API instead of HTML scraping
}

/**
 * City Configuration
 */
export interface CityInfo {
  id?: string;
  slug: string;
  name: string;
}

/**
 * Funda Property Listing (Normalized output)
 */
export interface FundaProperty {
  id: string;
  source: string;
  url: string;
  title: string;
  price: number | null;
  currency: string;
  priceUnit: 'total' | 'per_month';
  propertyType: string;
  transactionType: TransactionType;
  status?: string;
  location: {
    address?: string;
    city: string;
    country: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
  };
  details: {
    sqm?: number;
    rooms?: number;
    bedrooms?: number;
    bathrooms?: number;
    yearBuilt?: number;
    gardenSqm?: number;
    interior?: 'furnished' | 'unfurnished' | 'upholstered';
    parking?: boolean;
    elevator?: boolean;
  };
  features: string[];
  images: string[];
  description?: string;
  agent?: {
    name?: string;
    phone?: string;
    email?: string;
  };
  scrapedAt: string;
}

/**
 * Search Options
 */
export interface SearchOptions {
  city?: string;
  maxPages?: number;
  delayMs?: number;
  tinyIds?: (string | number)[]; // For REST API: list of TinyIds to fetch
}

/**
 * Page Listing (raw from page)
 */
export interface PageListing {
  id: string;
  title?: string;
  price?: string | number;
  address?: string;
  sqm?: string | number;
  rooms?: string | number;
  bedrooms?: string | number;
  link?: string;
  image?: string;
  [key: string]: unknown;
}

/**
 * Funda API Response - Listing Detail (Mobile API v4)
 */
export interface FundaListingResponse {
  Identifiers: {
    GlobalId: number;
    TinyId: string;
  };
  Price: {
    SellingPrice: string;
    NumericSellingPrice: number | null;
    IsAuction: boolean;
  };
  KenmerkSections: Array<{
    Index: number;
    Id: string;
    Title: string;
    KenmerkenList: Array<{
      Index: number;
      Id?: string;
      Label: string;
      Value: string;
      LabelStyle: string;
      KenmerkenList?: any[];
    }>;
  }>;
  Labels: Array<{
    Text: string;
    Type: string;
  }>;
  Urls: {
    FriendlyUrl: {
      FullUrl: string;
      RelativeUrl: string;
    };
  };
  ListingDescription?: {
    Title: string;
    Description: string;
  };
  AddressDetails: {
    Title: string;
    SubTitle: string;
    City: string;
    Province: string;
    Country: string;
    HouseNumber: string;
    PostCode: string;
    NeighborhoodName: string;
  };
  Coordinates: {
    Latitude: number;
    Longitude: number;
  };
  Media?: {
    Photos?: {
      ThumbnailBaseUrl: string;
      MediaBaseUrl: string;
      Items: Array<{
        Id: string;
      }>;
    };
    Brochure?: {
      CdnUrl: string;
    };
  };
  FastView: {
    LivingArea: string;
    PlotArea?: string;
    NumberOfBedrooms: string;
    EnergyLabel?: string;
  };
  IsSoldOrRented: boolean;
  SalesHistory?: {
    Title: string;
    Rows: Array<{
      Label: string;
      Value: string;
    }>;
  };
  ObjectType: string;
  OfferingType: string;
  ConstructionType: string;
  PublicationDate: string;
  ObjectInsights: {
    Views: string;
    Saves: string;
  };
  [key: string]: any; // For additional/future fields
}

/**
 * Funda Property Data (parsed from API response)
 */
export interface FundaPropertyData {
  // Identifiers
  tinyId: string;
  globalId: number;
  url: string;

  // Title and address
  title: string;
  address: string;
  postalCode: string;
  city: string;
  province: string;
  country: string;
  latitude: number | null;
  longitude: number | null;

  // Price information
  price: number | null;
  currency: string;
  pricePerSqm?: string;

  // Size information
  sqm?: number;
  plotSqm?: number;

  // Room information
  rooms?: number;
  bedrooms?: number;
  bathrooms?: number;

  // Building information
  yearBuilt?: number;
  objectType: string;
  dutchPropertyType?: string; // Original Dutch property type
  constructionType?: string;
  energyLabel?: string;

  // Parking and features
  parkingType?: string;
  hasParking?: boolean;

  // Description and media
  description: string;
  images: string[];

  // Statistics
  views: number;
  saves: number;

  // Transaction information
  transactionType: TransactionType;
  publicationDate: string;
  isSoldOrRented: boolean;

  // Metadata
  scrapedAt: string;
}

/**
 * Search Filters for API
 */
export interface SearchFilters {
  area?: string[];
  offeringType?: 'buy' | 'rent';
  objectType?: string[];
  priceRange?: {
    from: number;
    to: number;
  };
  areaRange?: {
    from: number;
    to: number;
  };
}

/**
 * Listing Detail Response (for consistency)
 */
export type ListingDetailResponse = FundaListingResponse;
