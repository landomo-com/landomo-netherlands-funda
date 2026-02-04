import { FundaScraper } from './scraper.js';
import { FundaRESTAPIScraper } from './api-scraper.js';
import type { SearchOptions } from './types.js';
import { createLogger } from '@shared/logger';

const logger = createLogger('module');

function parseArgs(): {
  city?: string;
  maxPages?: number;
  rent?: boolean;
  useRestApi?: boolean;
  tinyIds?: string[];
  benchmark?: boolean;
} {
  const args = process.argv.slice(2);
  const result: {
    city?: string;
    maxPages?: number;
    rent?: boolean;
    useRestApi?: boolean;
    tinyIds?: string[];
    benchmark?: boolean;
  } = {};

  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--city' && args[i + 1]) {
      result.city = args[i + 1];
      i++;
    } else if (args[i] === '--max-pages' && args[i + 1]) {
      result.maxPages = parseInt(args[i + 1], 10);
      i++;
    } else if (args[i] === '--rent') {
      result.rent = true;
    } else if (args[i] === '--rest-api') {
      result.useRestApi = true;
    } else if (args[i] === '--tiny-ids' && args[i + 1]) {
      result.tinyIds = args[i + 1].split(',');
      i++;
    } else if (args[i] === '--benchmark') {
      result.benchmark = true;
    }
  }

  return result;
}

async function runRESTAPI(args: any) {
  logger.info('Funda.nl REST API Scraper');
  logger.info('==========================');
  logger.info('Method: REST API (Mobile API v4)');

  const scraper = new FundaRESTAPIScraper({ delayMs: 500 });

  try {
    if (args.benchmark && args.tinyIds && args.tinyIds.length > 0) {
      logger.info(`\nRunning benchmark with ${args.tinyIds.length} listings...`);
      const results = await scraper.benchmark(args.tinyIds);
      logger.info('\n=== Benchmark Results ===');
      logger.info(`Total Time: ${results.totalTime}ms`);
      logger.info(`Request Count: ${results.requestCount}`);
      logger.info(`Avg Time per Request: ${results.avgTimePerRequest}ms`);
      logger.info(`Success Rate: ${(results.successRate * 100).toFixed(1)}%`);
      logger.info(`Estimated Time for 1000 listings: ${(results.estimatedTimeFor1000 / 1000).toFixed(1)}s`);
      return;
    }

    if (!args.tinyIds || args.tinyIds.length === 0) {
      logger.warn('No TinyIds provided. Use --tiny-ids ID1,ID2,ID3 or --benchmark');
      return;
    }

    logger.info(`Fetching ${args.tinyIds.length} listings...`);
    const config: SearchOptions = {
      tinyIds: args.tinyIds.map((id) => id.trim()),
    };

    const properties = await scraper.searchByTinyIds(config);

    if (properties.length > 0) {
      logger.info(`\n=== Sample Properties (${Math.min(3, properties.length)}) ===`);
      const samples = properties.slice(0, 3);
      for (const p of samples) {
        logger.info(`\n[${p.transactionType.toUpperCase()}] ${p.title}`);
        logger.info(
          `  Price: ${p.price ? p.price.toLocaleString('nl-NL') + ' EUR' : 'N/A'}${p.priceUnit === 'per_month' ? '/month' : ''}`,
        );
        logger.info(`  Type: ${p.propertyType}`);
        logger.info(`  Location: ${p.location.address || p.location.city}`);
        const detailParts = [
          p.details.sqm ? `${p.details.sqm} m²` : null,
          p.details.rooms ? `${p.details.rooms} rooms` : null,
          p.details.bedrooms ? `${p.details.bedrooms} bedrooms` : null,
        ]
          .filter(Boolean)
          .join(', ');
        logger.info(`  Details: ${detailParts || 'N/A'}`);
        logger.info(`  URL: ${p.url}`);
      }
    }

    logger.info(`\nFetched ${properties.length} properties successfully`);
  } catch (error) {
    logger.error('Scraper error:', error);
    process.exit(1);
  }
}

async function runHTMLScraper(args: any) {
  logger.info('Funda.nl HTML Scraper');
  logger.info('======================');
  logger.info('Method: HTML scraping (Playwright)');

  const config: SearchOptions = {
    city: args.city || 'amsterdam',
    maxPages: args.maxPages || 1,
  };

  logger.info(`City: ${config.city}`);
  logger.info(`Max Pages: ${config.maxPages}`);
  logger.info(`Listing Type: ${args.rent ? 'Rental' : 'For Sale'}`);
  logger.info('');

  const scraper = new FundaScraper({ headless: true });

  try {
    await scraper.init();
    const properties = args.rent ? await scraper.searchRent(config) : await scraper.searchBuy(config);

    if (properties.length > 0) {
      logger.info('\n=== Sample Properties ===');
      const samples = properties.slice(0, 3);
      for (const p of samples) {
        logger.info(`\n[${p.transactionType.toUpperCase()}] ${p.title}`);
        logger.info(
          `  Price: ${p.price ? p.price.toLocaleString('nl-NL') + ' EUR' : 'N/A'}${p.priceUnit === 'per_month' ? '/month' : ''}`,
        );
        logger.info(`  Type: ${p.propertyType}`);
        logger.info(`  Location: ${p.location.address || p.location.city}`);
        const detailParts = [
          p.details.sqm ? `${p.details.sqm} m²` : null,
          p.details.rooms ? `${p.details.rooms} rooms` : null,
          p.details.bedrooms ? `${p.details.bedrooms} bedrooms` : null,
        ]
          .filter(Boolean)
          .join(', ');
        logger.info(`  Details: ${detailParts || 'N/A'}`);
        logger.info(`  URL: ${p.url}`);
      }
    }

    logger.info(`\nScraping complete: ${properties.length} properties`);
  } catch (error) {
    logger.error('Scraper error:', error);
    process.exit(1);
  } finally {
    await scraper.close();
  }
}

async function main() {
  const args = parseArgs();

  if (args.useRestApi) {
    await runRESTAPI(args);
  } else {
    await runHTMLScraper(args);
  }
}

main();
