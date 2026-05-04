const http = require("node:http");
const fs = require("node:fs/promises");
const path = require("node:path");
const { randomUUID } = require("node:crypto");

const PORT = Number(process.env.PORT || 4173);
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const PROPERTIES_FILE = path.join(DATA_DIR, "properties.json");
const SCANNER_FILE = path.join(DATA_DIR, "scanner.json");
const SCANNER_INTERVAL_MS = 30 * 60 * 1000;
const SCANNER_LOCATION_SEARCHES = [
  { label: "Bayswater", rightmoveSlug: "Bayswater", slug: "bayswater" },
  { label: "Warwick Avenue", rightmoveSlug: "Maida-Vale", slug: "warwick-avenue" },
  { label: "Marylebone", rightmoveSlug: "Marylebone", slug: "marylebone" },
  { label: "Baker Street", rightmoveSlug: "Baker-Street", slug: "baker-street" },
  { label: "Goodge Street", rightmoveSlug: "Fitzrovia", slug: "goodge-street" },
  { label: "Lancaster Gate", rightmoveSlug: "Bayswater", slug: "lancaster-gate" },
  { label: "Notting Hill Gate", rightmoveSlug: "Notting-Hill", slug: "notting-hill-gate" },
  { label: "Holland Park", rightmoveSlug: "Holland-Park", slug: "holland-park" },
  { label: "Queensway", rightmoveSlug: "Queensway", slug: "queensway" },
  { label: "Marble Arch", rightmoveSlug: "Marble-Arch", slug: "marble-arch" },
  { label: "Bond Street", rightmoveSlug: "Mayfair", slug: "bond-street" },
];
const DEFAULT_SEARCH_URLS = SCANNER_LOCATION_SEARCHES.flatMap((location) => [
  `https://www.rightmove.co.uk/property-for-sale/${location.rightmoveSlug}.html?minBedrooms=2&maxPrice=1750000`,
  `https://www.onthemarket.com/for-sale/property/${location.slug}/?min-bedrooms=2&max-price=1750000`,
  `https://www.zoopla.co.uk/for-sale/property/london/${location.slug}/?beds_min=2&price_max=1750000`,
]);
const SCANNER_HOSTS = [
  "rightmove.co.uk",
  "onthemarket.com",
  "zoopla.co.uk",
];
const SCANNER_STATIONS = [
  { name: "Bayswater", lat: 51.5124, lng: -0.1877, cannonStreetMinutes: 20 },
  { name: "Warwick Avenue", lat: 51.5233, lng: -0.1838, cannonStreetMinutes: 24 },
  { name: "Marylebone", lat: 51.5225, lng: -0.1631, cannonStreetMinutes: 21 },
  { name: "Baker Street", lat: 51.5226, lng: -0.1571, cannonStreetMinutes: 17 },
  { name: "Goodge Street", lat: 51.5205, lng: -0.1347, cannonStreetMinutes: 22 },
  { name: "Lancaster Gate", lat: 51.5119, lng: -0.1756, cannonStreetMinutes: 21 },
  { name: "Notting Hill Gate", lat: 51.5093, lng: -0.1966, cannonStreetMinutes: 24 },
  { name: "Holland Park", lat: 51.5072, lng: -0.2057, cannonStreetMinutes: 27 },
  { name: "Queensway", lat: 51.5104, lng: -0.1872, cannonStreetMinutes: 23 },
  { name: "Marble Arch", lat: 51.5136, lng: -0.1586, cannonStreetMinutes: 18 },
  { name: "Bond Street", lat: 51.5142, lng: -0.1494, cannonStreetMinutes: 16 },
];
const SCANNER_INNER_PREFERRED_STATIONS = new Set(["Lancaster Gate", "Notting Hill Gate", "Queensway"]);
const SCANNER_PREFERRED_GYMS = [
  { name: "Third Space The Whiteley", lat: 51.5142, lng: -0.1885 },
  { name: "Virgin Active Mayfair", lat: 51.5141, lng: -0.1578 },
  { name: "Third Space Marylebone", lat: 51.5179, lng: -0.1509 },
  { name: "Third Space Mayfair", lat: 51.5073, lng: -0.1452 },
  { name: "Third Space Soho", lat: 51.5126, lng: -0.1351 },
  { name: "Equinox Kensington", lat: 51.5011, lng: -0.1909 },
  { name: "Fitness First Baker Street", lat: 51.5228, lng: -0.1573 },
  { name: "Fitness First Oxford Circus", lat: 51.5152, lng: -0.1421 },
];
const SCANNER_COFFEE_SHOPS = [
  { name: "GAIL's Queensway", lat: 51.5117, lng: -0.1877 },
  { name: "Granier Bakery Queensway", lat: 51.5123, lng: -0.1864 },
  { name: "Arro Coffee Bayswater", lat: 51.5131, lng: -0.1911 },
  { name: "Urban Baristas Queensway", lat: 51.5106, lng: -0.1879 },
  { name: "WatchHouse Notting Hill", lat: 51.5094, lng: -0.1975 },
  { name: "Hagen Marylebone", lat: 51.5205, lng: -0.1517 },
  { name: "GAIL's Baker Street", lat: 51.5214, lng: -0.1566 },
  { name: "Blank Street Goodge Street", lat: 51.5202, lng: -0.1351 },
  { name: "GAIL's Marble Arch", lat: 51.5149, lng: -0.1583 },
];
const SCANNER_GROCERY_STORES = [
  { name: "Waitrose Bayswater", lat: 51.5137, lng: -0.1908 },
  { name: "Tesco Express Bayswater", lat: 51.5127, lng: -0.1878 },
  { name: "Sainsbury's Local Queensway", lat: 51.5102, lng: -0.188 },
  { name: "M&S Foodhall Notting Hill Gate", lat: 51.5092, lng: -0.1964 },
  { name: "Tesco Express Notting Hill Gate", lat: 51.5098, lng: -0.196 },
  { name: "Waitrose Marylebone", lat: 51.5207, lng: -0.1519 },
  { name: "M&S Foodhall Baker Street", lat: 51.5214, lng: -0.1569 },
  { name: "Tesco Express Goodge Street", lat: 51.5204, lng: -0.1343 },
  { name: "M&S Foodhall Marble Arch", lat: 51.5136, lng: -0.1589 },
];
const SCANNER_ROUTE_FACTOR = 1.25;
const SCANNER_WALKING_METRES_PER_MINUTE = 80;
const SCANNER_MAX_STATION_METRES = 804.672;
const SCANNER_MAX_PRICE = 1750000;
const SCANNER_MIN_COMPOSITE_SCORE = 7;
const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = http.createServer(async (request, response) => {
  try {
    if (request.method === "OPTIONS") {
      sendOptions(response);
      return;
    }

    const requestedUrl = new URL(request.url, `http://${request.headers.host}`);

    if (request.method === "GET" && requestedUrl.pathname === "/api/properties") {
      await handleReadProperties(response);
      return;
    }

    if (request.method === "POST" && requestedUrl.pathname === "/api/properties") {
      await handleWriteProperties(request, response);
      return;
    }

    if (request.method === "GET" && requestedUrl.pathname === "/api/scanner") {
      await handleReadScanner(response);
      return;
    }

    if (request.method === "POST" && requestedUrl.pathname === "/api/scanner") {
      await handleWriteScanner(request, response);
      return;
    }

    if (request.method === "POST" && requestedUrl.pathname === "/api/scanner/run") {
      const result = await runScanner("manual");
      sendJson(response, 200, result);
      return;
    }

    if (request.method === "POST" && requestedUrl.pathname === "/api/scanner/approve") {
      await handleApproveScannerCandidate(request, response);
      return;
    }

    if (request.method === "POST" && requestedUrl.pathname === "/api/scanner/decline") {
      await handleDeclineScannerCandidate(request, response);
      return;
    }

    if (request.method === "GET" && requestedUrl.pathname === "/api/scrape") {
      redirectToApp(response);
      return;
    }

    if (request.method === "POST" && requestedUrl.pathname === "/api/scrape") {
      await handleScrape(request, response);
      return;
    }

    await serveStatic(request, response);
  } catch (error) {
    sendJson(response, 500, { error: error.message || "Server error" });
  }
});

server.listen(PORT, () => {
  console.log(`Property comparison tool running at http://localhost:${PORT}`);
});

setInterval(() => {
  runScanner("scheduled").catch((error) => {
    console.error("Scanner failed:", error.message);
  });
}, SCANNER_INTERVAL_MS);

async function handleReadProperties(response) {
  const payload = await readPropertiesStore();
  sendJson(response, 200, payload);
}

async function handleWriteProperties(request, response) {
  const body = await readBody(request);
  const payload = JSON.parse(body || "{}");
  const properties = Array.isArray(payload.properties) ? payload.properties : [];
  const stored = {
    updatedAt: Date.now(),
    properties,
  };

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(PROPERTIES_FILE, JSON.stringify(stored, null, 2));
  sendJson(response, 200, stored);
}

async function readPropertiesStore() {
  try {
    const file = await fs.readFile(PROPERTIES_FILE, "utf8");
    const payload = JSON.parse(file);
    return {
      updatedAt: Number(payload.updatedAt) || 0,
      properties: Array.isArray(payload.properties) ? payload.properties : [],
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return { updatedAt: 0, properties: [] };
    }
    throw error;
  }
}

async function handleReadScanner(response) {
  sendJson(response, 200, await readScannerStore());
}

async function handleWriteScanner(request, response) {
  const body = await readBody(request);
  const payload = JSON.parse(body || "{}");
  const stored = {
    ...await readScannerStore(),
    enabled: Boolean(payload.enabled),
    searchUrls: normalizeSearchUrls(payload.searchUrls),
    updatedAt: Date.now(),
  };

  await writeScannerStore(stored);
  sendJson(response, 200, stored);
}

async function readScannerStore() {
  try {
    const file = await fs.readFile(SCANNER_FILE, "utf8");
    const payload = JSON.parse(file);
    return {
      enabled: Boolean(payload.enabled),
      searchUrls: normalizeSearchUrls(payload.searchUrls),
      candidates: Array.isArray(payload.candidates) ? payload.candidates : [],
      declinedUrls: Array.isArray(payload.declinedUrls) ? payload.declinedUrls : [],
      lastRunAt: Number(payload.lastRunAt) || null,
      lastResult: payload.lastResult || null,
      updatedAt: Number(payload.updatedAt) || 0,
    };
  } catch (error) {
    if (error.code === "ENOENT") {
      return {
        enabled: false,
        searchUrls: DEFAULT_SEARCH_URLS,
        candidates: [],
        declinedUrls: [],
        lastRunAt: null,
        lastResult: null,
        updatedAt: 0,
      };
    }
    throw error;
  }
}

async function writeScannerStore(payload) {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(SCANNER_FILE, JSON.stringify(payload, null, 2));
}

function normalizeSearchUrls(value) {
  const urls = Array.isArray(value) ? value : String(value || "").split(/\n+/);
  const normalized = [...new Set(urls.map((url) => url.trim()).filter(isAllowedScannerUrl))];
  const isOldDefault = urls.some((url) => /knightfrank|foxtons|rightmove\.co\.uk\/property-for-sale\/find\.html/i.test(url))
    || normalized.length <= 5;
  return isOldDefault ? DEFAULT_SEARCH_URLS : normalized;
}

async function runScanner(trigger = "manual") {
  const settings = await readScannerStore();
  if (!settings.enabled && trigger !== "manual") {
    return { skipped: true, reason: "Scanner is paused." };
  }

  const searchUrls = settings.searchUrls.length ? settings.searchUrls : DEFAULT_SEARCH_URLS;
  const store = await readPropertiesStore();
  const existingUrls = new Set(store.properties.map((property) => normalizeListingUrl(property.url)).filter(Boolean));
  const declinedUrls = new Set((settings.declinedUrls || []).map(normalizeListingUrl).filter(Boolean));
  const existingCandidateUrls = new Set((settings.candidates || []).map((candidate) => normalizeListingUrl(candidate.url)).filter(Boolean));
  const discoveredUrls = new Set();
  const discoveredByHost = {};
  const errors = [];

  for (const searchUrl of searchUrls) {
    try {
      const html = await fetchHtml(searchUrl);
      extractListingUrls(html, searchUrl).forEach((url) => {
        discoveredUrls.add(url);
        const host = hostLabel(url);
        discoveredByHost[host] = (discoveredByHost[host] || 0) + 1;
      });
    } catch (error) {
      errors.push(`${hostLabel(searchUrl)} search failed: ${error.message}`);
    }
  }

  const candidates = [...discoveredUrls]
    .filter((url) => {
      const normalized = normalizeListingUrl(url);
      return !existingUrls.has(normalized) && !declinedUrls.has(normalized) && !existingCandidateUrls.has(normalized);
    })
    .slice(0, 150);
  const matches = [];
  const rejected = [];

  for (const url of candidates) {
    try {
      const imported = await scrapeListing(url);
      const point = await resolveScannerPoint(imported);
      const rejectionReason = scannerRejectReason(imported, point);
      if (rejectionReason) {
        rejected.push({ url, reason: rejectionReason });
        continue;
      }

      const candidate = scannerCandidateFromImport(imported, point);
      matches.push(candidate);
      existingCandidateUrls.add(normalizeListingUrl(url));
    } catch (error) {
      errors.push(`${hostLabel(url)} listing failed: ${error.message}`);
    }
  }

  const result = {
    trigger,
    scannedAt: Date.now(),
    searchPages: searchUrls.length,
    discovered: discoveredUrls.size,
    discoveredByHost,
    checked: candidates.length,
    matches: matches.map(({ property, ...candidate }) => candidate),
    rejectionSummary: summarizeRejections(rejected),
    rejected: rejected.slice(0, 10),
    errors: errors.slice(0, 10),
  };

  await writeScannerStore({
    ...settings,
    searchUrls,
    candidates: [...matches, ...(settings.candidates || [])].slice(0, 50),
    declinedUrls: [...declinedUrls],
    lastRunAt: result.scannedAt,
    lastResult: result,
    updatedAt: Date.now(),
  });

  return result;
}

function summarizeRejections(rejected) {
  return rejected.reduce((summary, item) => {
    const reason = item.reason || "Unknown reason";
    summary[reason] = (summary[reason] || 0) + 1;
    return summary;
  }, {});
}

async function handleApproveScannerCandidate(request, response) {
  const body = await readBody(request);
  const { url } = JSON.parse(body || "{}");
  const normalizedUrl = normalizeListingUrl(url);
  const settings = await readScannerStore();
  const candidate = settings.candidates.find((item) => normalizeListingUrl(item.url) === normalizedUrl);

  if (!candidate?.property) {
    sendJson(response, 404, { error: "Candidate was not found." });
    return;
  }

  const store = await readPropertiesStore();
  const existingUrls = new Set(store.properties.map((property) => normalizeListingUrl(property.url)).filter(Boolean));
  if (!existingUrls.has(normalizedUrl)) {
    store.properties.unshift(candidate.property);
    await fs.mkdir(DATA_DIR, { recursive: true });
    await fs.writeFile(PROPERTIES_FILE, JSON.stringify({ updatedAt: Date.now(), properties: store.properties }, null, 2));
  }

  const updatedSettings = {
    ...settings,
    candidates: settings.candidates.filter((item) => normalizeListingUrl(item.url) !== normalizedUrl),
    updatedAt: Date.now(),
  };
  await writeScannerStore(updatedSettings);
  sendJson(response, 200, updatedSettings);
}

async function handleDeclineScannerCandidate(request, response) {
  const body = await readBody(request);
  const { url } = JSON.parse(body || "{}");
  const normalizedUrl = normalizeListingUrl(url);
  const settings = await readScannerStore();
  const declinedUrls = new Set((settings.declinedUrls || []).map(normalizeListingUrl).filter(Boolean));
  if (normalizedUrl) declinedUrls.add(normalizedUrl);

  const updatedSettings = {
    ...settings,
    candidates: settings.candidates.filter((item) => normalizeListingUrl(item.url) !== normalizedUrl),
    declinedUrls: [...declinedUrls],
    updatedAt: Date.now(),
  };
  await writeScannerStore(updatedSettings);
  sendJson(response, 200, updatedSettings);
}

async function handleScrape(request, response) {
  const body = await readBody(request);
  const { url } = JSON.parse(body || "{}");

  if (!isAllowedUrl(url)) {
    sendJson(response, 400, { error: "Enter a valid http(s) estate agent or portal URL." });
    return;
  }

  const result = await scrapeListing(url);
  sendJson(response, 200, result);
}

async function scrapeListing(url) {
  const parsed = new URL(url);

  if (parsed.hostname.includes("knightfrank.")) {
    return scrapeKnightFrank(url, parsed);
  }

  if (parsed.hostname.includes("rightmove.co.uk")) {
    return scrapeRightmove(url);
  }

  return scrapeGeneric(url);
}

async function scrapeKnightFrank(url, parsed) {
  const reference = parsed.pathname.split("/").filter(Boolean).pop();
  if (!reference) {
    throw new Error("Could not find the Knight Frank property reference in that URL.");
  }

  const params = new URLSearchParams({
    cachetoken: "www.knightfrank.co.uk|en-GB",
    currency: "GBP",
    availability: "Any",
    floorAreaMeasurementUnit: "sqft",
    landAreaMeasurementUnit: "acres",
  });
  const apiUrl = `https://api-v2.web.prd-knightfrank.com/properties/${encodeURIComponent(reference)}?${params}`;
  const response = await fetch(apiUrl, {
    headers: {
      "accept": "application/json",
      "accept-language": "en-GB",
      "content-type": "application/json",
      "referer": "https://www.knightfrank.co.uk/",
      "user-agent": browserUserAgent(),
      "x-kf-appname": "KnightFrank.OneCms.Search",
      "x-kf-host": "en-GB",
    },
  });

  if (!response.ok) {
    return scrapeGeneric(url, `Knight Frank API responded with ${response.status}; used page fallback.`);
  }

  const property = await response.json();
  const outdoorSpace = inferOutdoorSpace([
    property.Description,
    property.ShortDescription,
    property.Summary,
    property.Address,
    stringifyFeatureText(property.Features),
  ].join(" "));
  return {
    url,
    source: "Knight Frank API",
    name: property.CustomPropertyTitle || property.Address || property.Slug || `Knight Frank ${reference}`,
    price: property.Price?.PriceMinFormatted || property.Price?.PriceMaxFormatted || "",
    address: [property.Address, property.Postcode].filter(Boolean).join(", "),
    lat: numericOrUndefined(property.Latitude),
    lng: numericOrUndefined(property.Longitude),
    bedrooms: property.BedroomsMaximum,
    bathrooms: property.BathroomsMaximum,
    sqft: extractSqft(formatSize(property)),
    size: formatSize(property),
    outdoorSpace,
    photoUrl: firstUrl(property.ImgUrls) || firstUrl(property.FullScreenImageUrl),
    photoUrls: [...(property.ImgUrls || []), ...(property.FullScreenImageUrl || [])],
    floorplanUrl: firstUrl(property.FloorPlansUrls) || firstUrl(property.BrochuresUrls),
    floorplanUrls: [...(property.FloorPlansUrls || []), ...(property.BrochuresUrls || [])],
    warning: property.Latitude && property.Longitude ? undefined : "Imported, but Knight Frank did not provide coordinates.",
  };
}

async function scrapeRightmove(url) {
  const html = await fetchHtml(url);
  const model = extractWindowJson(html, "PAGE_MODEL");

  if (!model?.propertyData) {
    return scrapeGeneric(url, "Rightmove page model was not found; used page fallback.");
  }

  const property = model.propertyData;
  const location = property.location || property.streetView || {};
  const address = property.address?.displayAddress || property.address?.outcode || "";
  const price = property.prices?.primaryPrice || property.price?.displayPrices?.[0]?.displayPrice || "";
  const size = property.sizings?.find((item) => item.unit === "sqft");
  const outdoorSpace = inferOutdoorSpace([
    property.text?.description,
    property.text?.propertyPhrase,
    stringifyFeatureText(property.keyFeatures),
    stringifyFeatureText(property.tags),
  ].join(" "));
  const floorplanUrls = [
    ...(property.floorplans || []).map((item) => item.url || item),
    ...(property.brochures || []).map((item) => item.url || item),
  ].filter(Boolean);
  const photoUrls = (property.images || [])
    .map((item) => item.resizedImageUrls?.size656x437 || item.resizedImageUrls?.size476x317 || item.url || item)
    .filter(Boolean);

  return {
    url,
    source: "Rightmove page model",
    name: [property.text?.propertyPhrase, address].filter(Boolean).join(" in "),
    price,
    address,
    lat: numericOrUndefined(location.latitude),
    lng: numericOrUndefined(location.longitude),
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    sqft: size ? Number(size.maximumSize || size.minimumSize) : undefined,
    size: size ? `${size.maximumSize || size.minimumSize} ${size.displayUnit || "sq ft"}` : "",
    outdoorSpace,
    photoUrl: firstUrl(photoUrls),
    photoUrls,
    floorplanUrl: firstUrl(floorplanUrls),
    floorplanUrls,
    warning: location.latitude && location.longitude ? undefined : "Imported, but Rightmove did not provide coordinates.",
  };
}

async function scrapeGeneric(url, warningPrefix = "") {
  const fetchResponse = await fetch(url, {
    headers: {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-GB,en;q=0.9",
      "user-agent": browserUserAgent(),
    },
    redirect: "follow",
  });

  if (!fetchResponse.ok) {
    return {
      url,
      warning: `The site responded with ${fetchResponse.status}. Add details manually.`,
    };
  }

  const html = await fetchResponse.text();
  const jsonLd = getJsonLdObjects(html);
  const flattened = flattenObjects(jsonLd);
  const meta = getMetaValues(html);
  const text = decodeEntities(stripTags(html)).replace(/\s+/g, " ").trim();
  const coordinates = findCoordinates(html, flattened);
  const floorplanUrls = findFloorplanUrls(html, url);
  const photoUrls = findPhotoUrls(html, meta, flattened, url);
  const address = pickAddress(flattened, meta, text);
  const price = pickPrice(flattened, meta, text);
  const name = pickName(flattened, meta, text, url);
  const sqft = extractSqft(text) || extractSqft(floorplanUrls.join(" "));
  const bedrooms = extractBedrooms(text);
  const bathrooms = extractBathrooms(text);
  const outdoorSpace = inferOutdoorSpace(text);

  const warning = !address && !coordinates
    ? [warningPrefix, "Imported what I could, but no usable address or coordinates were found."].filter(Boolean).join(" ")
    : warningPrefix || (sqft ? undefined : floorplanUrls.length ? "Square footage was not exposed as text; open the floorplan to check it." : undefined);

  return {
    url,
    source: "Generic page scraper",
    name,
    price,
    address,
    bedrooms,
    bathrooms,
    sqft,
    size: sqft ? `${sqft} sq ft` : "",
    outdoorSpace,
    photoUrl: firstUrl(photoUrls),
    photoUrls,
    floorplanUrl: firstUrl(floorplanUrls),
    floorplanUrls,
    lat: coordinates?.lat,
    lng: coordinates?.lng,
    warning,
  };
}

async function serveStatic(request, response) {
  const requestedUrl = new URL(request.url, `http://${request.headers.host}`);
  const pathname = requestedUrl.pathname === "/" ? "/index.html" : requestedUrl.pathname;
  const filePath = path.normalize(path.join(ROOT, pathname));

  if (!filePath.startsWith(ROOT)) {
    sendText(response, 403, "Forbidden");
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    response.writeHead(200, {
      "content-type": MIME_TYPES[path.extname(filePath)] || "application/octet-stream",
    });
    response.end(file);
  } catch {
    sendText(response, 404, "Not found");
  }
}

function isAllowedUrl(value) {
  try {
    const parsed = new URL(value);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

function isAllowedScannerUrl(value) {
  if (!isAllowedUrl(value)) return false;
  const host = new URL(value).hostname.replace(/^www\./, "");
  return SCANNER_HOSTS.some((allowedHost) => host === allowedHost || host.endsWith(`.${allowedHost}`));
}

function extractListingUrls(html, baseUrl) {
  const urls = new Set();
  const hrefs = [
    ...[...html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)].map((match) => match[1]),
    ...(html.match(/https?:\/\/[^"' <>)]+/gi) || []),
  ];

  hrefs.forEach((href) => {
    try {
      const url = new URL(decodeEntities(href), baseUrl);
      const cleanUrl = normalizeListingUrl(url.href);
      if (isAllowedScannerUrl(cleanUrl) && isListingUrl(cleanUrl)) {
        urls.add(cleanUrl);
      }
    } catch {
      // Ignore malformed links in search pages.
    }
  });

  return [...urls];
}

function isListingUrl(value) {
  const parsed = new URL(value);
  const host = parsed.hostname;
  const path = parsed.pathname;

  if (host.includes("rightmove.co.uk")) return /\/properties\/\d+/i.test(path);
  if (host.includes("onthemarket.com")) return /\/details\/\d+/i.test(path);
  if (host.includes("zoopla.co.uk")) return /\/for-sale\/details\/\d+/i.test(path);
  return false;
}

function normalizeListingUrl(value) {
  if (!value) return "";
  try {
    const parsed = new URL(value);
    parsed.hash = "";
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach((param) => {
      parsed.searchParams.delete(param);
    });
    return parsed.href.replace(/\/$/, "");
  } catch {
    return "";
  }
}

function scannerPropertyMatches(property) {
  const point = isNumeric(property.lat) && isNumeric(property.lng)
    ? { lat: Number(property.lat), lng: Number(property.lng) }
    : null;
  return !scannerRejectReason(property, point);
}

function scannerRejectReason(property, point) {
  const bedrooms = Number(property.bedrooms);
  const bathrooms = Number(property.bathrooms);
  const sqft = Number(property.sqft || extractSqft(property.size));
  const price = parsePriceNumber(property.price);

  if (!Number.isFinite(price) || price > SCANNER_MAX_PRICE) return "Over £1.75M or price missing.";
  if (!Number.isFinite(bedrooms) || bedrooms < 2) return "Less than 2 bedrooms or bedrooms missing.";
  if (!Number.isFinite(bathrooms) || bathrooms < 2 || bathrooms > 10) {
    return "Less than 2 bathrooms or bathrooms missing.";
  }
  if (!Number.isFinite(sqft) || sqft < 800) return "Less than 800 sq ft or square footage missing.";
  if (!point) return "No postcode or coordinates, so location could not be checked.";
  if (!scannerLocationMatches(point)) return "Not within 0.5 miles of the approved station list.";
  const compositeScore = scannerCompositeScore(property, point);
  if (!Number.isFinite(compositeScore) || compositeScore <= SCANNER_MIN_COMPOSITE_SCORE) {
    return `Composite score ${Number.isFinite(compositeScore) ? `${compositeScore}/10` : "missing"} is not above 7/10.`;
  }
  return "";
}

function scannerLocationMatches(point) {
  return SCANNER_STATIONS.some((station) => scannerHaversine(point, station) <= SCANNER_MAX_STATION_METRES);
}

async function resolveScannerPoint(property) {
  if (isNumeric(property.lat) && isNumeric(property.lng)) {
    return { lat: Number(property.lat), lng: Number(property.lng), source: "listing coordinates" };
  }

  const postcode = extractUkPostcode([
    property.address,
    property.name,
    property.url,
  ].filter(Boolean).join(" "));
  if (!postcode) return null;

  return lookupPostcodeCoordinates(postcode);
}

async function lookupPostcodeCoordinates(postcode) {
  try {
    const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`, {
      headers: {
        "accept": "application/json",
        "user-agent": browserUserAgent(),
      },
    });
    if (!response.ok) return null;
    const payload = await response.json();
    const result = payload.result;
    if (!isNumeric(result?.latitude) || !isNumeric(result?.longitude)) return null;
    return {
      lat: Number(result.latitude),
      lng: Number(result.longitude),
      source: "postcode lookup",
    };
  } catch {
    return null;
  }
}

function scannerWalkingMinutes(from, to) {
  return (scannerHaversine(from, to) * SCANNER_ROUTE_FACTOR) / SCANNER_WALKING_METRES_PER_MINUTE;
}

function scannerCompositeScore(property, point) {
  const scores = [
    scannerLocationScore(point),
    scannerBedroomScore(property.bedrooms),
    scannerBathroomScore(property.bathrooms),
    scannerSqftScore(property.sqft || extractSqft(property.size)),
    scannerOutdoorScore(property.outdoorSpace),
    scannerGymScore(scannerNearestMinutes(point, SCANNER_PREFERRED_GYMS)),
    scannerLocalAmenityScore(scannerNearestMinutes(point, SCANNER_COFFEE_SHOPS)),
    scannerLocalAmenityScore(scannerNearestMinutes(point, SCANNER_GROCERY_STORES)),
    scannerWorkScore(scannerWorkMinutes(point)),
  ].filter((value) => Number.isFinite(value));

  if (!scores.length) return Number.NaN;
  return Math.round((scores.reduce((total, value) => total + value, 0) / scores.length) * 10) / 10;
}

function scannerLocationScore(point) {
  const stations = SCANNER_STATIONS
    .map((station) => ({ ...station, minutes: scannerWalkingMinutes(point, station) }))
    .sort((a, b) => a.minutes - b.minutes);
  const bayswater = stations.find((station) => station.name === "Bayswater");
  const best = stations[0];

  if (bayswater?.minutes <= 10) return 10;
  if (SCANNER_INNER_PREFERRED_STATIONS.has(best.name) && best.minutes <= 10) return 8;
  if (best.minutes <= 5) return 7;
  if (best.minutes <= 10) return 5;
  return 3;
}

function scannerBedroomScore(value) {
  const bedrooms = Number(value);
  if (!Number.isFinite(bedrooms)) return Number.NaN;
  if (bedrooms < 2) return 3;
  if (bedrooms === 2) return 8;
  return 10;
}

function scannerBathroomScore(value) {
  const bathrooms = Number(value);
  if (!Number.isFinite(bathrooms)) return Number.NaN;
  return bathrooms < 2 ? 3 : 10;
}

function scannerSqftScore(value) {
  const sqft = Number(value);
  if (!Number.isFinite(sqft) || sqft <= 0) return Number.NaN;
  if (sqft < 800) return 5;
  if (sqft < 900) return 7;
  if (sqft < 1000) return 9;
  return 10;
}

function scannerOutdoorScore(value) {
  const scores = {
    none: 5,
    "shared garden": 6,
    balcony: 8,
    garden: 10,
  };
  return scores[value || "none"] ?? 5;
}

function scannerNearestMinutes(point, places) {
  return places.reduce((best, place) => Math.min(best, scannerWalkingMinutes(point, place)), Number.POSITIVE_INFINITY);
}

function scannerGymScore(minutes) {
  if (!Number.isFinite(minutes)) return Number.NaN;
  if (minutes <= 10) return 10;
  if (minutes <= 15) return 8;
  if (minutes <= 20) return 6;
  return 4;
}

function scannerLocalAmenityScore(minutes) {
  if (!Number.isFinite(minutes)) return Number.NaN;
  if (minutes <= 5) return 10;
  if (minutes <= 10) return 8;
  if (minutes <= 15) return 5;
  return 3;
}

function scannerWorkMinutes(point) {
  return SCANNER_STATIONS.reduce((best, station) => {
    const totalMinutes = scannerWalkingMinutes(point, station) + station.cannonStreetMinutes;
    return Math.min(best, totalMinutes);
  }, Number.POSITIVE_INFINITY);
}

function scannerWorkScore(minutes) {
  if (!Number.isFinite(minutes)) return Number.NaN;
  if (minutes <= 30) return 10;
  if (minutes <= 40) return 8;
  if (minutes <= 50) return 6;
  return 4;
}

function scannerHaversine(a, b) {
  const earthRadius = 6371000;
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);
  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);
  const value = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return 2 * earthRadius * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function scannerPropertyFromImport(imported, point = null) {
  const now = Date.now();
  const coordinates = point || {
    lat: Number(imported.lat),
    lng: Number(imported.lng),
    source: "scanner import",
  };
  return {
    id: randomUUID(),
    createdAt: now,
    updatedAt: now,
    url: normalizeListingUrl(imported.url),
    name: imported.name || fallbackName(imported.url),
    price: imported.price || "",
    address: imported.address || "",
    bedrooms: Number(imported.bedrooms),
    bathrooms: Number(imported.bathrooms),
    sqft: Number(imported.sqft || extractSqft(imported.size)),
    outdoorSpace: imported.outdoorSpace || "none",
    lightCeilingsScore: null,
    floorplanUrl: imported.floorplanUrl || imported.floorplanUrls?.[0] || "",
    photoUrl: imported.photoUrl || imported.photoUrls?.[0] || "",
    lat: numericOrUndefined(coordinates.lat),
    lng: numericOrUndefined(coordinates.lng),
    coordinates,
    notes: [`Found by scanner`, imported.source ? `Imported from ${imported.source}` : ""].filter(Boolean).join(" · "),
  };
}

function scannerCandidateFromImport(imported, point) {
  const property = scannerPropertyFromImport(imported, point);
  const score = scannerCompositeScore(imported, point);
  return {
    id: randomUUID(),
    url: normalizeListingUrl(imported.url),
    name: imported.name || fallbackName(imported.url),
    price: imported.price || "",
    bedrooms: Number(imported.bedrooms),
    bathrooms: Number(imported.bathrooms),
    sqft: Number(imported.sqft || extractSqft(imported.size)),
    compositeScore: score,
    source: imported.source || hostLabel(imported.url),
    foundAt: Date.now(),
    property,
  };
}

function hostLabel(value) {
  try {
    return new URL(value).hostname.replace(/^www\./, "");
  } catch {
    return "Search";
  }
}

function readBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1_000_000) {
        request.destroy();
        reject(new Error("Request body too large"));
      }
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

async function fetchHtml(url) {
  const response = await fetch(url, {
    headers: {
      "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      "accept-language": "en-GB,en;q=0.9",
      "user-agent": browserUserAgent(),
    },
    redirect: "follow",
  });

  if (!response.ok) {
    throw new Error(`The site responded with ${response.status}.`);
  }

  return response.text();
}

function extractWindowJson(html, variableName) {
  const assignment = `window.${variableName} =`;
  const start = html.indexOf(assignment);
  if (start === -1) return null;

  const objectStart = html.indexOf("{", start + assignment.length);
  if (objectStart === -1) return null;

  const objectEnd = findBalancedJsonEnd(html, objectStart);
  if (objectEnd === -1) return null;

  try {
    return JSON.parse(html.slice(objectStart, objectEnd + 1));
  } catch {
    return null;
  }
}

function findBalancedJsonEnd(text, start) {
  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < text.length; index += 1) {
    const char = text[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === "\"") {
        inString = false;
      }
      continue;
    }

    if (char === "\"") {
      inString = true;
    } else if (char === "{") {
      depth += 1;
    } else if (char === "}") {
      depth -= 1;
      if (depth === 0) return index;
    }
  }

  return -1;
}

function getJsonLdObjects(html) {
  const matches = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  return matches.flatMap((match) => {
    const cleaned = decodeEntities(match[1].trim());
    try {
      const parsed = JSON.parse(cleaned);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch {
      return [];
    }
  });
}

function flattenObjects(values) {
  const output = [];
  const visit = (value) => {
    if (!value || typeof value !== "object") return;
    if (Array.isArray(value)) {
      value.forEach(visit);
      return;
    }
    output.push(value);
    Object.values(value).forEach(visit);
  };
  values.forEach(visit);
  return output;
}

function getMetaValues(html) {
  const meta = {};
  const matches = [...html.matchAll(/<meta\s+([^>]+)>/gi)];
  matches.forEach((match) => {
    const attrs = getAttributes(match[1]);
    const key = attrs.property || attrs.name || attrs.itemprop;
    if (key && attrs.content) {
      meta[key.toLowerCase()] = decodeEntities(attrs.content);
    }
  });
  const title = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  if (title) meta.title = decodeEntities(stripTags(title[1])).trim();
  return meta;
}

function getAttributes(value) {
  const attrs = {};
  const matches = [...value.matchAll(/([\w:-]+)=["']([^"']*)["']/g)];
  matches.forEach((match) => {
    attrs[match[1].toLowerCase()] = match[2];
  });
  return attrs;
}

function pickName(objects, meta, text, url) {
  const fromObjects = firstString(objects, ["name", "headline", "title"]);
  const fromMeta = meta["og:title"] || meta["twitter:title"] || meta.title;
  return cleanTitle(fromObjects || fromMeta || fallbackName(url));
}

function pickPrice(objects, meta, text) {
  const fromObjects = firstString(objects, ["price", "pricevalue", "offers.price"]);
  const fromMeta = meta["product:price:amount"] || meta["og:price:amount"];
  const fromText = text.match(/£\s?\d[\d,]*(?:\.\d{2})?/);
  return cleanPrice(fromObjects || fromMeta || fromText?.[0]);
}

function pickAddress(objects, meta, text) {
  const direct = firstString(objects, ["streetAddress", "addressLocality", "addressRegion", "address"]);
  const objectAddress = objects
    .map((item) => item.address)
    .find((item) => item && typeof item === "object" && !Array.isArray(item));
  const joined = objectAddress
    ? [
        objectAddress.streetAddress,
        objectAddress.addressLocality,
        objectAddress.addressRegion,
        objectAddress.postalCode,
      ]
        .filter(Boolean)
        .join(", ")
    : "";
  const postcode = text.match(/\b[A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2}\b/i)?.[0];
  return cleanAddress(joined || direct || meta["og:street-address"] || postcode);
}

function findCoordinates(html, objects) {
  const geoObject = objects.find((item) => isNumeric(item.latitude) && isNumeric(item.longitude));
  if (geoObject) {
    return { lat: Number(geoObject.latitude), lng: Number(geoObject.longitude) };
  }

  const patterns = [
    /"latitude"\s*:\s*"?(-?\d+\.\d+)"?[\s\S]{0,80}"longitude"\s*:\s*"?(-?\d+\.\d+)"?/i,
    /"lat"\s*:\s*"?(-?\d+\.\d+)"?[\s\S]{0,80}"lng"\s*:\s*"?(-?\d+\.\d+)"?/i,
    /"lat"\s*:\s*"?(-?\d+\.\d+)"?[\s\S]{0,80}"lon"\s*:\s*"?(-?\d+\.\d+)"?/i,
  ];

  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return { lat: Number(match[1]), lng: Number(match[2]) };
  }

  return null;
}

function findFloorplanUrls(html, baseUrl) {
  const urls = new Set();
  const urlMatches = html.match(/https?:\/\/[^"' <>)]+/gi) || [];
  const hrefMatches = [...html.matchAll(/\b(?:href|src)=["']([^"']+)["']/gi)].map((match) => match[1]);

  [...urlMatches, ...hrefMatches].forEach((value) => {
    const decoded = decodeEntities(value);
    if (!/floor\s*plan|floorplan|brochure|particular/i.test(decoded)) return;
    try {
      urls.add(new URL(decoded, baseUrl).href);
    } catch {
      // Ignore malformed third-party asset references.
    }
  });

  return [...urls];
}

function findPhotoUrls(html, meta, objects, baseUrl) {
  const urls = new Set();
  const candidates = [
    meta["og:image"],
    meta["og:image:url"],
    meta["twitter:image"],
    meta["twitter:image:src"],
    ...objects.flatMap((item) => {
      const image = item.image || item.photo || item.thumbnailUrl;
      if (Array.isArray(image)) return image;
      return image ? [image] : [];
    }),
  ];
  const imgMatches = [...html.matchAll(/<img\s+([^>]+)>/gi)]
    .flatMap((match) => {
      const attrs = getAttributes(match[1]);
      return [attrs.src, attrs["data-src"], attrs["data-original"], attrs.srcset?.split(",")[0]?.trim().split(/\s+/)[0]];
    });

  [...candidates, ...imgMatches].forEach((candidate) => addPhotoCandidate(candidate, urls, baseUrl));
  return [...urls];
}

function addPhotoCandidate(candidate, urls, baseUrl) {
  if (!candidate) return;
  if (typeof candidate === "object") {
    Object.values(candidate).forEach((value) => addPhotoCandidate(value, urls, baseUrl));
    return;
  }

  const decoded = decodeEntities(String(candidate));
  if (!/\.(?:jpe?g|png|webp)(?:[?#]|$)/i.test(decoded)) return;
  if (/floor\s*plan|floorplan|brochure|logo|icon|sprite|placeholder/i.test(decoded)) return;

  try {
    urls.add(new URL(decoded, baseUrl).href);
  } catch {
    // Ignore malformed third-party asset references.
  }
}

function inferOutdoorSpace(value) {
  const text = decodeEntities(stripTags(value || "")).toLowerCase();

  if (/\b(communal|shared)\s+(garden|gardens|grounds|courtyard)\b/.test(text)) {
    return "shared garden";
  }

  if (/\b(balcony|balconies|terrace|roof terrace|patio)\b/.test(text)) {
    return "balcony";
  }

  if (/\b(private\s+garden|garden|gardens|courtyard|outside space|outdoor space)\b/.test(text)) {
    return "garden";
  }

  return "none";
}

function stringifyFeatureText(value) {
  if (!value) return "";
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (typeof item === "object") return Object.values(item).join(" ");
        return "";
      })
      .join(" ");
  }
  if (typeof value === "object") return Object.values(value).join(" ");
  return String(value);
}

function firstString(objects, keys) {
  for (const item of objects) {
    for (const key of keys) {
      const value = readKey(item, key);
      if (typeof value === "string" || typeof value === "number") return String(value);
    }
  }
  return "";
}

function readKey(object, key) {
  if (!key.includes(".")) return object[key];
  return key.split(".").reduce((value, part) => value?.[part], object);
}

function cleanTitle(value) {
  return decodeEntities(String(value || ""))
    .replace(/\s*\|\s*(Rightmove|Zoopla|OnTheMarket).*$/i, "")
    .replace(/\s+-\s+.*Estate Agents.*$/i, "")
    .trim();
}

function cleanPrice(value) {
  if (!value) return "";
  const text = String(value);
  if (text.includes("£")) return text.replace(/\s+/g, " ").trim();
  const number = Number(text.replace(/[^\d.]/g, ""));
  return Number.isFinite(number) && number > 0 ? `£${number.toLocaleString("en-GB")}` : text.trim();
}

function parsePriceNumber(value) {
  const number = Number(String(value || "").replace(/[^\d]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : Number.NaN;
}

function extractUkPostcode(value) {
  const match = String(value || "").match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i);
  return match ? match[1].toUpperCase().replace(/\s+/g, " ") : "";
}

function cleanAddress(value) {
  return decodeEntities(String(value || ""))
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .trim();
}

function formatSize(property) {
  const floorArea = property.FloorArea || property.SaleableArea || property.GrossArea;
  if (floorArea?.AreaMaxFormatted) return floorArea.AreaMaxFormatted;
  if (floorArea?.AreaMinFormatted) return floorArea.AreaMinFormatted;
  if (property.FloorAreaMax) return `${property.FloorAreaMax} sq ft`;
  if (property.FloorAreaMin) return `${property.FloorAreaMin} sq ft`;
  if (property.FloorAreaMaximum) return `${property.FloorAreaMaximum} sq ft`;
  return "";
}

function extractSqft(value) {
  const match = String(value || "").match(/([\d,]+)\s*(?:sq\.?\s*ft|sqft|square feet)/i);
  return match ? Number(match[1].replace(/,/g, "")) : undefined;
}

function extractBedrooms(value) {
  const text = decodeEntities(stripTags(value || ""));
  const patterns = [
    /\b(?:bedrooms?|beds?)\s*(?:maximum|min|max|:)?\s*(\d+)/i,
    /\b(\d+)\s*(?:bedrooms?|beds?)\b/i,
    /"bedrooms?"\s*:\s*"?(\d+)/i,
  ];
  return extractCountFromPatterns(text, patterns);
}

function extractBathrooms(value) {
  const text = decodeEntities(stripTags(value || ""));
  const patterns = [
    /\b(?:bathrooms?|baths?)\s*(?:maximum|min|max|:)?\s*(\d+)/i,
    /\b(\d+)\s*(?:bathrooms?|baths?)\b/i,
    /"bathrooms?"\s*:\s*"?(\d+)/i,
  ];
  return extractCountFromPatterns(text, patterns);
}

function extractCountFromPatterns(text, patterns) {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = Number(match[1]);
      if (Number.isFinite(value) && value > 0 && value <= 10) return value;
    }
  }
  return undefined;
}

function firstUrl(values) {
  return Array.isArray(values) ? values.find(Boolean) || "" : "";
}

function fallbackName(url) {
  const parsed = new URL(url);
  return parsed.hostname.replace(/^www\./, "");
}

function stripTags(value) {
  return String(value).replace(/<[^>]*>/g, " ");
}

function decodeEntities(value) {
  return String(value)
    .replace(/&pound;/g, "£")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function isNumeric(value) {
  return value !== null && value !== undefined && Number.isFinite(Number(value));
}

function numericOrUndefined(value) {
  return isNumeric(value) ? Number(value) : undefined;
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function browserUserAgent() {
  return "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124 Safari/537.36";
}

function sendJson(response, status, payload) {
  response.writeHead(status, {
    "access-control-allow-headers": "Content-Type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-origin": "*",
    "content-type": "application/json; charset=utf-8",
  });
  response.end(JSON.stringify(payload));
}

function sendText(response, status, message) {
  response.writeHead(status, {
    "access-control-allow-origin": "*",
    "content-type": "text/plain; charset=utf-8",
  });
  response.end(message);
}

function sendOptions(response) {
  response.writeHead(204, {
    "access-control-allow-headers": "Content-Type",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-origin": "*",
  });
  response.end();
}

function redirectToApp(response) {
  response.writeHead(302, {
    "access-control-allow-origin": "*",
    "location": "/",
  });
  response.end();
}
