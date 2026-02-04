# Funda.nl Real Estate Portal Analysis

## Portal Overview

**Funda** (funda.nl) is the largest and most popular real estate platform in the Netherlands, established in 2001. It is owned by NVM (Nederlandse Vereniging van Makelaars), the Dutch Association of Real Estate Brokers.

### Key Statistics
- **Market Position**: Dominant platform for Dutch real estate
- **Listings**: Hundreds of thousands of properties for sale and rent
- **Coverage**: All provinces in the Netherlands
- **Languages**: Dutch (primary), some English support

### Property Types Available
- Appartementen (Apartments)
- Huizen (Houses)
- Nieuwbouw (New construction)
- Recreatiewoningen (Vacation homes)
- Bedrijfs onroerend goed (Commercial real estate)
- Agrarisch (Agricultural)

---

## Technical Architecture

### Frontend Stack
- **Framework**: Nuxt.js (Vue.js based)
- **Static Assets**: Hosted on `assets.fstatic.nl` (Cloudflare CDN)
- **Build ID**: Changes with deployments (e.g., `master_3438`)

### Backend Services
- **Primary Domain**: `www.funda.nl`
- **Mobile API**: `*.funda.io` subdomains
- **Search Engine**: Elasticsearch
- **CDN**: Akamai (content delivery and bot protection)
- **Media Storage**: `cloud.funda.nl/valentina_media/`

### Protection Systems
| Layer | Provider | Purpose |
|-------|----------|---------|
| CDN/WAF | Akamai | Bot detection, traffic filtering |
| CAPTCHA | Google reCAPTCHA v2 | Human verification |
| Static CDN | Cloudflare | Asset delivery, DDoS protection |

---

## URL Structure

### Search URLs

```
# Buy listings
https://www.funda.nl/koop/{city}/
https://www.funda.nl/koop/{city}/{property-type}/
https://www.funda.nl/koop/{city}/appartement/

# Rent listings
https://www.funda.nl/huur/{city}/
https://www.funda.nl/huur/{city}/appartement/

# Sold listings
https://www.funda.nl/koop/verkocht/{city}/

# New search format (with JSON parameters)
https://www.funda.nl/zoeken/koop/?selected_area=["amsterdam"]&object_type=["appartement"]
```

### Detail Page URLs

```
# Active listing
https://www.funda.nl/detail/koop/{city}/appartement-{address}/{tinyId}/

# Sold listing
https://www.funda.nl/detail/koop/verkocht/{city}/appartement-{address}/{tinyId}/

# Example
https://www.funda.nl/detail/koop/amsterdam/appartement-ijdok-37/43267698/
```

### Broker URLs

```
https://www.funda.nl/makelaar/{id}-{broker-slug}/
https://www.funda.nl/makelaars/{city}/
```

---

## API Access Methods

### 1. Mobile App API (Most Reliable)

The mobile API provides clean JSON responses and better accessibility:

```bash
# Get listing details
curl "https://listing-detail-page.funda.io/api/v4/listing/object/nl/tinyId/43267698" \
  -H "User-Agent: Dart/3.9 (dart:io)" \
  -H "X-Funda-App-Platform: android"
```

**Pros:**
- Clean JSON responses
- Detailed property information
- Less aggressive bot detection

**Cons:**
- Search endpoint requires authentication
- May change without notice

### 2. Website Scraping

Direct website access is heavily protected:

**Challenges:**
- Akamai bot detection triggers CAPTCHA
- Rate limiting enforced
- JavaScript rendering required
- Session cookies needed

**Tools that work:**
- Playwright/Puppeteer with stealth plugins
- Residential proxy rotation
- Browser fingerprint spoofing

### 3. Third-Party Services

| Service | Type | Cost |
|---------|------|------|
| [pyfunda](https://github.com/0xMH/pyfunda) | Python library | Free |
| [Apify Scrapers](https://apify.com/easyapi/funda-nl-scraper) | Cloud scraping | Paid |
| [funda-scraper](https://pypi.org/project/funda-scraper/) | Python/Scrapy | Free |

---

## Data Available

### Property Information
- Price (asking price, price per m2)
- Address and location coordinates
- Property type and size
- Number of rooms/bedrooms/bathrooms
- Construction year
- Energy label
- Photos and floor plans
- Property description

### Market Insights
- Publication date
- Days on market
- View counts
- Save counts
- Sale history (sold properties)

### Broker Information
- Broker name and office
- Association membership (NVM, VBO, etc.)
- Contact details

---

## Anti-Bot Protection Details

### Detection Mechanisms

1. **Request Fingerprinting**
   - User-Agent validation
   - Header order and completeness
   - TLS fingerprint (JA3/JA4)

2. **Behavioral Analysis**
   - Request timing patterns
   - Mouse/keyboard simulation detection
   - Navigation patterns

3. **Technical Checks**
   - JavaScript execution
   - WebDriver detection
   - Canvas/WebGL fingerprinting

### Verification Page

When detected as a bot, users see:
```
Title: "Je bent bijna op de pagina die je zoekt"
(You're almost at the page you're looking for)

Message: "We houden ons platform graag veilig en spamvrij.
Daarom moeten we soms verifiëren dat onze bezoekers echte mensen zijn."
(We like to keep our platform safe and spam-free.
That's why we sometimes need to verify that our visitors are real people.)
```

### Bypass Strategies (for legitimate research)

1. Use the mobile API with correct headers
2. Implement proper rate limiting (1-2 sec delays)
3. Use residential proxies
4. Employ browser automation with stealth features
5. Cache responses aggressively

---

## Legal Considerations

### Terms of Service
Funda's terms prohibit automated scraping without permission. Always:
- Review current terms at funda.nl
- Consider official partnerships for commercial use
- Respect robots.txt directives
- Implement rate limiting to avoid service disruption

### robots.txt Summary
```
Disallow: /mijn/          # User accounts
Disallow: /zoeken/        # Search pages
Disallow: /*/zoeken/      # Localized search
```

---

## File Structure

```
netherlands/funda/
├── README.md                      # This file
├── docs/
│   └── API.md                     # Detailed API documentation
├── capture_api.py                 # Playwright capture script v1
├── capture_api_v2.py              # Playwright capture script v2
├── capture_search_api.py          # Search-focused capture script
├── sample_listing_response.json   # Example API response
├── v2_requests.json               # Captured requests
├── v2_responses.json              # Captured responses
└── screenshots/
    └── *.png                      # Captured screenshots
```

---

## Quick Start

### Prerequisites
```bash
pip install playwright requests
playwright install chromium
```

### Fetch a Listing

```python
import requests

def get_funda_listing(tiny_id):
    """Fetch listing details from Funda mobile API"""
    url = f"https://listing-detail-page.funda.io/api/v4/listing/object/nl/tinyId/{tiny_id}"
    headers = {
        "User-Agent": "Dart/3.9 (dart:io)",
        "X-Funda-App-Platform": "android",
        "Content-Type": "application/json"
    }
    response = requests.get(url, headers=headers)
    return response.json()

# Example usage
listing = get_funda_listing("43267698")
print(f"Address: {listing['AddressDetails']['Title']}")
print(f"Price: {listing['Price']['SellingPrice']}")
print(f"Area: {listing['FastView']['LivingArea']}")
```

### Extract TinyId from URL

```python
import re

def extract_tiny_id(url):
    """Extract tinyId from Funda listing URL"""
    match = re.search(r'/(\d{8,9})/?$', url)
    return match.group(1) if match else None

# Example
url = "https://www.funda.nl/detail/koop/amsterdam/appartement-ijdok-37/43267698/"
tiny_id = extract_tiny_id(url)  # Returns "43267698"
```

---

## Related Resources

- [Funda Official Site](https://www.funda.nl)
- [Funda Help Center](https://help.funda.nl)
- [NVM (Owner)](https://www.nvm.nl)
- [pyfunda GitHub](https://github.com/0xMH/pyfunda)
- [funda-scraper PyPI](https://pypi.org/project/funda-scraper/)

---

## Changelog

| Date | Change |
|------|--------|
| 2026-01-30 | Initial documentation |
| 2025-Q4 | Listing dates hidden behind login |
| 2025 | Mobile API v4 discovered |

---

## Disclaimer

This documentation is for educational and research purposes only. The APIs and methods described are based on publicly observable behavior and open-source research. Always comply with Funda's terms of service and applicable Dutch/EU data protection laws.
