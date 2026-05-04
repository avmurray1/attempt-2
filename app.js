const STORAGE_KEY = "flatFinderProperties.v1";
const SHARED_SYNC_INTERVAL_MS = 5000;
const WALKING_METRES_PER_MINUTE = 80;
const ROUTE_FACTOR = 1.25;
const NON_NEGOTIABLES = {
  bedrooms: 2,
  bathrooms: 2,
  sqft: 800,
  maxPrice: 1750000,
};
const INNER_PREFERRED_STATIONS = new Set(["Lancaster Gate", "Notting Hill Gate", "Queensway"]);

const stations = [
  { name: "Bayswater", lat: 51.5124, lng: -0.1877, ideal: true, cannonStreetMinutes: 20 },
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

const preferredGyms = [
  { name: "Third Space The Whiteley", brand: "Third Space", lat: 51.5142, lng: -0.1885 },
  { name: "Virgin Active Mayfair", brand: "Virgin Active", lat: 51.5141, lng: -0.1578 },
  { name: "Third Space Marylebone", brand: "Third Space", lat: 51.5179, lng: -0.1509 },
  { name: "Third Space Mayfair", brand: "Third Space", lat: 51.5073, lng: -0.1452 },
  { name: "Third Space Soho", brand: "Third Space", lat: 51.5126, lng: -0.1351 },
  { name: "Third Space City", brand: "Third Space", lat: 51.5108, lng: -0.0811 },
  { name: "Third Space Moorgate", brand: "Third Space", lat: 51.5192, lng: -0.0876 },
  { name: "Equinox Kensington", brand: "Equinox", lat: 51.5011, lng: -0.1909 },
  { name: "Fitness First Baker Street", brand: "Fitness First", lat: 51.5228, lng: -0.1573 },
  { name: "Fitness First Oxford Circus", brand: "Fitness First", lat: 51.5152, lng: -0.1421 },
  { name: "Fitness First Gracechurch Street", brand: "Fitness First", lat: 51.5121, lng: -0.0848 },
  { name: "Virgin Active Chelsea", brand: "Virgin Active", lat: 51.4869, lng: -0.1811 },
];

const coffeeShops = [
  { name: "GAIL's St John's Wood", lat: 51.5331, lng: -0.1701 },
  { name: "Starbucks St John's Wood", lat: 51.5344, lng: -0.1736 },
  { name: "Beam St John's Wood", lat: 51.5348, lng: -0.1741 },
  { name: "GAIL's Queensway", lat: 51.5117, lng: -0.1877 },
  { name: "Granier Bakery Queensway", lat: 51.5123, lng: -0.1864 },
  { name: "Arro Coffee Bayswater", lat: 51.5131, lng: -0.1911 },
  { name: "Urban Baristas Queensway", lat: 51.5106, lng: -0.1879 },
  { name: "WatchHouse Notting Hill", lat: 51.5094, lng: -0.1975 },
  { name: "Coffee Plant Notting Hill", lat: 51.5154, lng: -0.2035 },
  { name: "Hagen Marylebone", lat: 51.5205, lng: -0.1517 },
  { name: "GAIL's Baker Street", lat: 51.5214, lng: -0.1566 },
  { name: "WatchHouse Marylebone", lat: 51.5191, lng: -0.1512 },
  { name: "Blank Street Goodge Street", lat: 51.5202, lng: -0.1351 },
  { name: "Kaffeine Great Titchfield Street", lat: 51.5181, lng: -0.1406 },
  { name: "GAIL's Marble Arch", lat: 51.5149, lng: -0.1583 },
];

const groceryStores = [
  { name: "Waitrose St John's Wood", lat: 51.5333, lng: -0.1703 },
  { name: "Tesco Express St John's Wood", lat: 51.5345, lng: -0.174 },
  { name: "Panzer's St John's Wood", lat: 51.5349, lng: -0.1748 },
  { name: "Sainsbury's Local Maida Vale", lat: 51.5295, lng: -0.1852 },
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

const WORK_DESTINATION = {
  name: "Cannon Street tube",
  lat: 51.5113,
  lng: -0.0904,
};

const form = document.querySelector("#propertyForm");
const propertyList = document.querySelector("#propertyList");
const summaryList = document.querySelector("#summaryList");
const propertyTemplate = document.querySelector("#propertyTemplate");
const emptyState = document.querySelector("#emptyState");
const sortSelect = document.querySelector("#sortSelect");
const summarySortSelect = document.querySelector("#summarySortSelect");
const exportBtn = document.querySelector("#exportBtn");
const clearBtn = document.querySelector("#clearBtn");
const importBtn = document.querySelector("#importBtn");
const geoNote = document.querySelector("#geoNote");
const scannerToggle = document.querySelector("#scannerToggle");
const scannerUrlsInput = document.querySelector("#scannerUrlsInput");
const scanNowBtn = document.querySelector("#scanNowBtn");
const scannerStatus = document.querySelector("#scannerStatus");
const scannerSourceList = document.querySelector("#scannerSourceList");
const scannerCandidateList = document.querySelector("#scannerCandidateList");

let properties = readProperties().map(migratePropertyData).map(recalculatePropertyScore);
let editingId = null;
let sharedUpdatedAt = 0;
let isSavingShared = false;

render();
initialiseSharedProperties();
initialiseScanner();
window.setInterval(syncSharedProperties, SHARED_SYNC_INTERVAL_MS);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  setGeoNote("Assessing location...");

  let formData = getFormData();

  try {
    if (canUseImporter() && shouldImportBeforeSave(formData)) {
      const imported = await importListing(formData.url);
      applyImportedData(imported, { onlyEmpty: true });
      formData = getFormData();
    }

    const coordinates = await resolveCoordinates(formData);
    const score = coordinates
      ? assessLocation(coordinates.lat, coordinates.lng)
      : makeUnscoredAssessment("Add a postcode, address, or coordinates to assess location.");

    const property = {
      id: editingId || crypto.randomUUID(),
      createdAt: editingId ? properties.find((item) => item.id === editingId)?.createdAt : Date.now(),
      updatedAt: Date.now(),
      ...formData,
      coordinates,
      score,
    };

    properties = editingId
      ? properties.map((item) => (item.id === editingId ? property : item))
      : [property, ...properties];

    saveProperties();
    render();
    resetForm();
    setGeoNote("Saved. Location score is based on estimated walking time, not live route data.");
    refreshSavedListings({ reason: "after-save" });
  } catch (error) {
    setGeoNote(error.message || "Could not assess this location. Try entering coordinates.");
  }
});

sortSelect.addEventListener("change", render);
summarySortSelect.addEventListener("change", renderSummaryDashboard);

importBtn.addEventListener("click", async () => {
  const url = getValue("#urlInput");
  if (!url) {
    setGeoNote("Paste an estate agent listing URL first.");
    return;
  }

  if (!canUseImporter()) {
    setGeoNote("Open this through the local server to import from URLs: http://localhost:4173");
    return;
  }

  importBtn.disabled = true;
  setGeoNote("Importing listing details...");

  try {
    const imported = await importListing(url);
    applyImportedData(imported, { onlyEmpty: false });
    setGeoNote(imported.warning || "Imported listing details. Check the fields before saving.");
  } catch (error) {
    setGeoNote(error.message || "Could not import this listing. Add details manually.");
  } finally {
    importBtn.disabled = false;
  }
});

scannerToggle.addEventListener("change", saveScannerSettings);
scannerUrlsInput.addEventListener("change", saveScannerSettings);
scanNowBtn.addEventListener("click", runScannerNow);
scannerCandidateList.addEventListener("click", handleScannerCandidateAction);
scannerCandidateList.addEventListener("click", handleScannerListingOpen);

exportBtn.addEventListener("click", async () => {
  const data = JSON.stringify(properties, null, 2);
  await navigator.clipboard.writeText(data);
  setGeoNote("Export copied to clipboard as JSON.");
});

clearBtn.addEventListener("click", () => {
  if (!properties.length) return;
  const confirmed = window.confirm("Clear all saved properties?");
  if (!confirmed) return;
  properties = [];
  saveProperties();
  render();
  setGeoNote("Comparison list cleared.");
});

function getFormData() {
  return {
    url: getValue("#urlInput"),
    name: getValue("#nameInput") || listingNameFromUrl(getValue("#urlInput")),
    price: getValue("#priceInput"),
    address: getValue("#addressInput"),
    bedrooms: getNumber("#bedroomsInput"),
    bathrooms: getNumber("#bathroomsInput"),
    sqft: getNumber("#sqftInput"),
    outdoorSpace: getValue("#outdoorSpaceInput") || "none",
    lightCeilingsScore: getNumber("#lightCeilingsInput"),
    floorplanUrl: getValue("#floorplanInput"),
    photoUrl: getValue("#photoInput"),
    lat: getNumber("#latInput"),
    lng: getNumber("#lngInput"),
    notes: getValue("#notesInput"),
  };
}

function getValue(selector) {
  return document.querySelector(selector).value.trim();
}

function getNumber(selector) {
  const value = document.querySelector(selector).value.trim();
  return value ? Number(value) : null;
}

async function resolveCoordinates(property) {
  if (Number.isFinite(property.lat) && Number.isFinite(property.lng)) {
    return { lat: property.lat, lng: property.lng, source: "manual coordinates" };
  }

  if (!property.address) return null;

  const postcode = extractUkPostcode(property.address);
  if (postcode) {
    const fromPostcode = await lookupPostcode(postcode);
    if (fromPostcode) return { ...fromPostcode, source: "postcode lookup" };
  }

  return lookupAddress(property.address);
}

async function importListing(url) {
  const response = await fetch(`${apiBaseUrl()}/api/scrape`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });
  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(payload.error || "Could not import this listing.");
  }

  return payload;
}

function applyImportedData(imported, options = {}) {
  const onlyEmpty = options.onlyEmpty ?? true;
  const facts = formatImportedFacts(imported);
  const updates = [
    ["#nameInput", imported.name],
    ["#priceInput", imported.price],
    ["#addressInput", imported.address],
    ["#bedroomsInput", imported.bedrooms],
    ["#bathroomsInput", imported.bathrooms],
    ["#sqftInput", imported.sqft || parseSqft(imported.size)],
    ["#outdoorSpaceInput", imported.outdoorSpace],
    ["#floorplanInput", imported.floorplanUrl || imported.floorplanUrls?.[0]],
    ["#photoInput", imported.photoUrl || imported.photoUrls?.[0]],
    ["#latInput", imported.lat],
    ["#lngInput", imported.lng],
    ["#notesInput", facts],
  ];

  updates.forEach(([selector, value]) => {
    if (value === null || value === undefined || value === "") return;
    const field = document.querySelector(selector);
    if (!onlyEmpty || !field.value.trim()) {
      field.value = value;
    }
  });
}

async function refreshSavedListings(options = {}) {
  if (!canUseImporter() || !properties.length) return;

  const reason = options.reason || "manual";
  const refreshable = properties.filter((property) => property.url);
  if (!refreshable.length) return;

  if (reason !== "startup") {
    setGeoNote("Refreshing saved listings...");
  }

  let refreshedCount = 0;
  const refreshed = [];

  for (const property of properties) {
    if (!property.url) {
      refreshed.push(property);
      continue;
    }

    try {
      const imported = await importListing(property.url);
      refreshed.push(await mergeImportedProperty(property, imported));
      refreshedCount += 1;
    } catch {
      refreshed.push(property);
    }
  }

  properties = refreshed.map(migratePropertyData).map(recalculatePropertyScore);
  saveProperties();
  render();

  if (refreshedCount > 0) {
    setGeoNote(`Refreshed criteria for ${refreshedCount} saved listing${refreshedCount === 1 ? "" : "s"}.`);
  } else if (reason !== "startup") {
    setGeoNote("Could not refresh saved listings. Check the local server is running.");
  }
}

async function mergeImportedProperty(property, imported) {
  const merged = {
    ...property,
    name: imported.name || property.name,
    price: imported.price || property.price,
    address: imported.address || property.address,
    bedrooms: imported.bedrooms ?? property.bedrooms,
    bathrooms: imported.bathrooms ?? property.bathrooms,
    sqft: imported.sqft || parseSqft(imported.size) || property.sqft,
      outdoorSpace: imported.outdoorSpace || property.outdoorSpace || "none",
      floorplanUrl: imported.floorplanUrl || imported.floorplanUrls?.[0] || property.floorplanUrl,
      photoUrl: imported.photoUrl || imported.photoUrls?.[0] || property.photoUrl,
      lat: imported.lat ?? property.lat,
    lng: imported.lng ?? property.lng,
    notes: mergeImportedNotes(property.notes, formatImportedFacts(imported)),
    updatedAt: Date.now(),
  };

  const coordinates = await resolveCoordinates(merged);
  return {
    ...merged,
    coordinates,
    score: coordinates
      ? assessLocation(coordinates.lat, coordinates.lng)
      : makeUnscoredAssessment("Add a postcode, address, or coordinates to assess location."),
  };
}

function mergeImportedNotes(existingNotes, importedFacts) {
  if (!importedFacts) return existingNotes || "";
  if (!existingNotes || existingNotes.includes("Imported from")) return importedFacts;
  return `${existingNotes} · ${importedFacts}`;
}

function formatImportedFacts(imported) {
  const facts = [
    imported.bedrooms ? `${imported.bedrooms} bed` : "",
    imported.bathrooms ? `${imported.bathrooms} bath` : "",
    imported.sqft ? `${imported.sqft} sq. ft.` : imported.size || "",
    imported.outdoorSpace && imported.outdoorSpace !== "none" ? imported.outdoorSpace : "",
    imported.floorplanUrl || imported.floorplanUrls?.length ? "Floorplan available" : "",
    imported.source ? `Imported from ${imported.source}` : "",
  ].filter(Boolean);
  return facts.join(" · ");
}

function shouldImportBeforeSave(formData) {
  return formData.url && (!formData.address || !formData.price || !formData.name);
}

function canUseImporter() {
  return window.location.protocol.startsWith("http") || window.location.protocol === "file:";
}

function apiBaseUrl() {
  return window.location.protocol === "file:" ? "http://localhost:4173" : "";
}

async function lookupPostcode(postcode) {
  const response = await fetch(`https://api.postcodes.io/postcodes/${encodeURIComponent(postcode)}`);
  if (!response.ok) return null;
  const payload = await response.json();
  if (!payload.result) return null;
  return { lat: payload.result.latitude, lng: payload.result.longitude };
}

async function lookupAddress(address) {
  const params = new URLSearchParams({
    format: "jsonv2",
    limit: "1",
    countrycodes: "gb",
    q: address,
  });
  const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`);
  if (!response.ok) {
    throw new Error("Address lookup was unavailable. Try a postcode or coordinates.");
  }
  const payload = await response.json();
  if (!payload.length) {
    throw new Error("I could not find that address. Try a full postcode or coordinates.");
  }
  return { lat: Number(payload[0].lat), lng: Number(payload[0].lon), source: "address lookup" };
}

function assessLocation(lat, lng) {
  const results = stations
    .map((station) => {
      const metres = haversine({ lat, lng }, station);
      const minutes = (metres * ROUTE_FACTOR) / WALKING_METRES_PER_MINUTE;
      return { ...station, metres, minutes };
    })
    .sort((a, b) => a.minutes - b.minutes);

  const best = results[0];
  const bayswater = results.find((station) => station.name === "Bayswater");
  const innerPreferred = results.find((station) => INNER_PREFERRED_STATIONS.has(station.name) && station.minutes <= 10);
  const otherWithinFive = results.find(
    (station) => station.name !== "Bayswater" && !INNER_PREFERRED_STATIONS.has(station.name) && station.minutes <= 5,
  );
  const anyOtherOriginalMatch = results.find(
    (station) => station.name !== "Bayswater" && !INNER_PREFERRED_STATIONS.has(station.name) && station.minutes <= 10,
  );

  let points;
  let assessment;
  let locationMet = true;

  if (bayswater.minutes <= 10) {
    points = 10;
    assessment = "10/10: within 10 minutes of Bayswater.";
  } else if (innerPreferred) {
    points = 8;
    assessment = `8/10: within 10 minutes of ${innerPreferred.name}.`;
  } else if (otherWithinFive) {
    points = 7;
    assessment = `7/10: within 5 minutes of ${otherWithinFive.name}.`;
  } else if (anyOtherOriginalMatch) {
    points = 5;
    assessment = `5/10: within 10 minutes of ${anyOtherOriginalMatch.name}.`;
  } else {
    points = 3;
    locationMet = false;
    assessment = "3/10: does not meet the location criteria.";
  }

  return {
    points,
    locationMet,
    bestStation: best.name,
    bestMinutes: best.minutes,
    bayswaterMinutes: bayswater.minutes,
    assessment,
    stationBreakdown: results.map(({ name, minutes }) => ({ name, minutes: round(minutes) })),
  };
}

function makeUnscoredAssessment(message) {
  return {
    points: null,
    locationMet: false,
    bestStation: "Not assessed",
    bestMinutes: null,
    bayswaterMinutes: null,
    assessment: message,
    stationBreakdown: [],
  };
}

function assessGymAccess(property) {
  return assessNearestAmenity(property, preferredGyms, scoreGymMinutes, 15);
}

function assessCoffeeAccess(property) {
  return assessNearestAmenity(property, coffeeShops, scoreLocalAmenityMinutes, 10);
}

function assessGroceryAccess(property) {
  return assessNearestAmenity(property, groceryStores, scoreLocalAmenityMinutes, 10);
}

function assessNearestAmenity(property, places, scoreFn, acceptableMinutes) {
  const point = propertyPoint(property);
  if (!point) return { score: null, value: "Not assessed", scoreLabel: "Flag", met: false, neutral: true };

  const nearest = places
    .map((place) => ({
      ...place,
      minutes: walkingMinutes(point, place),
    }))
    .sort((a, b) => a.minutes - b.minutes);
  const best = nearest[0];
  const score = scoreFn(best.minutes);

  return {
    ...score,
    value: `${round(best.minutes)} min walk`,
    detail: best.name,
    link: googleMapsDirectionsUrl(point, best, "walking"),
    met: best.minutes <= acceptableMinutes,
  };
}

function assessWorkTravel(property) {
  const point = propertyPoint(property);
  if (!point) return { score: null, value: "Not assessed", scoreLabel: "Flag", met: false, neutral: true };

  const routes = stations
    .filter((station) => Number.isFinite(station.cannonStreetMinutes))
    .map((station) => {
      const walkToTube = walkingMinutes(point, station);
      return {
        ...station,
        walkToTube,
        totalMinutes: walkToTube + station.cannonStreetMinutes,
      };
    })
    .sort((a, b) => a.totalMinutes - b.totalMinutes);
  const best = routes[0];
  const score = scoreWorkMinutes(best.totalMinutes);

  return {
    ...score,
    value: `${round(best.totalMinutes)} min`,
    detail: `via ${best.name}`,
    link: googleMapsDirectionsUrl(point, WORK_DESTINATION, "transit"),
    met: best.totalMinutes <= 40,
  };
}

function propertyPoint(property) {
  const lat = property.coordinates?.lat ?? property.lat;
  const lng = property.coordinates?.lng ?? property.lng;
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

function walkingMinutes(from, to) {
  return (haversine(from, to) * ROUTE_FACTOR) / WALKING_METRES_PER_MINUTE;
}

function scoreGymMinutes(minutes) {
  if (!Number.isFinite(minutes)) return { score: null, scoreLabel: "Flag" };
  if (minutes <= 10) return { score: 10, scoreLabel: "10/10" };
  if (minutes <= 15) return { score: 8, scoreLabel: "8/10" };
  if (minutes <= 20) return { score: 6, scoreLabel: "6/10" };
  return { score: 4, scoreLabel: "4/10" };
}

function scoreLocalAmenityMinutes(minutes) {
  if (!Number.isFinite(minutes)) return { score: null, scoreLabel: "Flag" };
  if (minutes <= 5) return { score: 10, scoreLabel: "10/10" };
  if (minutes <= 10) return { score: 8, scoreLabel: "8/10" };
  if (minutes <= 15) return { score: 5, scoreLabel: "5/10" };
  return { score: 3, scoreLabel: "3/10" };
}

function scoreWorkMinutes(minutes) {
  if (!Number.isFinite(minutes)) return { score: null, scoreLabel: "Flag" };
  if (minutes <= 30) return { score: 10, scoreLabel: "10/10" };
  if (minutes <= 40) return { score: 8, scoreLabel: "8/10" };
  if (minutes <= 50) return { score: 6, scoreLabel: "6/10" };
  return { score: 4, scoreLabel: "4/10" };
}

function googleMapsDirectionsUrl(from, to, mode) {
  const params = new URLSearchParams({
    api: "1",
    origin: `${from.lat},${from.lng}`,
    destination: `${to.lat},${to.lng}`,
    travelmode: mode,
  });
  return `https://www.google.com/maps/dir/?${params.toString()}`;
}

function haversine(a, b) {
  const earthRadius = 6371000;
  const lat1 = toRadians(a.lat);
  const lat2 = toRadians(b.lat);
  const deltaLat = toRadians(b.lat - a.lat);
  const deltaLng = toRadians(b.lng - a.lng);
  const sinLat = Math.sin(deltaLat / 2);
  const sinLng = Math.sin(deltaLng / 2);
  const value = sinLat * sinLat + Math.cos(lat1) * Math.cos(lat2) * sinLng * sinLng;
  return earthRadius * 2 * Math.atan2(Math.sqrt(value), Math.sqrt(1 - value));
}

function toRadians(value) {
  return (value * Math.PI) / 180;
}

function render() {
  propertyList.innerHTML = "";
  emptyState.classList.toggle("is-hidden", properties.length > 0);
  renderSummaryDashboard();

  getSortedProperties().forEach((property) => {
    const node = propertyTemplate.content.firstElementChild.cloneNode(true);
    const scoreText = property.score.points === null ? "—" : `${property.score.points}/10`;
    const locationPill = node.querySelector(".location-pill");
    const composite = calculateCompositeScore(property);

    node.querySelector("[data-score]").textContent = scoreText;
    node.querySelector("[data-composite-score]").textContent = composite.score === null ? "—" : `${composite.score}/10`;
    locationPill.classList.toggle("is-failed", property.score.points !== null && !property.score.locationMet);
    node.querySelector("[data-name]").textContent = property.name;
    node.querySelector("[data-price]").textContent = property.price || "Price not added";
    node.querySelector("[data-url]").href = property.url;
    renderPropertyPhoto(node.querySelector("[data-photo]"), property.photoUrl);
    renderFloorplanLink(node.querySelector("[data-floorplan]"), property.floorplanUrl);
    node.querySelector("[data-best-station]").textContent = stationText(property.score.bestStation, property.score.bestMinutes);
    node.querySelector("[data-bayswater]").textContent = minutesText(property.score.bayswaterMinutes);
    node.querySelector("[data-assessment]").textContent = property.score.assessment;
    renderNonNegotiables(node.querySelector("[data-non-negotiables]"), property);
    node.querySelector("[data-notes]").textContent = property.notes || "";
    node.querySelector("[data-edit]").addEventListener("click", () => editProperty(property.id));
    node.querySelector("[data-delete]").addEventListener("click", () => deleteProperty(property.id));

    propertyList.append(node);
  });
}

function renderSummaryDashboard() {
  summaryList.innerHTML = "";

  getSortedSummaryProperties().forEach((property) => {
    const row = document.createElement("div");
    const composite = calculateCompositeScore(property);
    const pricePerSqft = formatPricePerSqft(property);
    const locationScore = property.score?.points;
    const propertyLink = document.createElement("a");
    const compositeCell = document.createElement("strong");
    const locationCell = document.createElement("strong");
    const voteCell = renderVoteCell(property);
    const priceCell = document.createElement("span");
    const pricePerSqftCell = document.createElement("span");
    const photoCell = renderSummaryPhoto(property);

    row.className = "summary-row";
    propertyLink.className = "summary-property-link";
    propertyLink.href = property.url;
    propertyLink.target = "_blank";
    propertyLink.rel = "noopener noreferrer";
    propertyLink.textContent = property.name || "Unnamed property";
    compositeCell.textContent = composite.score === null ? "—" : `${composite.score}/10`;
    locationCell.textContent = locationScore === null || locationScore === undefined ? "—" : `${locationScore}/10`;
    locationCell.classList.toggle("is-danger-text", property.score?.locationMet === false);
    priceCell.textContent = property.price || "Missing";
    pricePerSqftCell.textContent = pricePerSqft.value === "Missing" ? "Missing" : `${pricePerSqft.value} / sq ft`;
    row.append(propertyLink, compositeCell, locationCell, voteCell, priceCell, pricePerSqftCell, photoCell);
    summaryList.append(row);
  });
}

function renderSummaryPhoto(property) {
  const wrapper = document.createElement("span");
  const image = document.createElement("img");

  wrapper.className = "summary-photo-wrap";
  wrapper.classList.toggle("is-hidden", !property.photoUrl);
  image.className = "summary-photo";
  image.alt = "";
  image.loading = "lazy";
  image.src = property.photoUrl || "";
  wrapper.append(image);

  return wrapper;
}

function renderVoteCell(property) {
  const votes = normalizeVotes(property.votes);
  const voteCell = document.createElement("div");

  voteCell.className = "vote-cell";
  [
    ["top1", "Top 1"],
    ["top2", "Top 2"],
    ["top3", "Top 3"],
  ].forEach(([key, label]) => {
    const button = document.createElement("button");
    const count = document.createElement("strong");

    button.className = "vote-button";
    button.type = "button";
    button.textContent = `${label} `;
    count.textContent = votes[key];
    button.append(count);
    button.addEventListener("click", () => addVote(property.id, key));
    voteCell.append(button);
  });

  return voteCell;
}

function addVote(propertyId, voteKey) {
  properties = properties.map((property) => {
    if (property.id !== propertyId) return property;
    const votes = normalizeVotes(property.votes);
    return {
      ...property,
      votes: {
        ...votes,
        [voteKey]: votes[voteKey] + 1,
      },
      updatedAt: Date.now(),
    };
  });
  saveProperties();
  renderSummaryDashboard();
}

function normalizeVotes(votes = {}) {
  return {
    top1: Number(votes.top1) || 0,
    top2: Number(votes.top2) || 0,
    top3: Number(votes.top3) || 0,
  };
}

function getSortedSummaryProperties() {
  const sorted = [...properties];
  const mode = summarySortSelect.value;

  if (mode === "location") {
    sorted.sort((a, b) => (b.score?.points ?? -1) - (a.score?.points ?? -1));
  } else {
    sorted.sort((a, b) => compositePoints(b) - compositePoints(a));
  }

  return sorted;
}

function getSortedProperties() {
  const sorted = [...properties];
  const mode = sortSelect.value;

  if (mode === "price") {
    sorted.sort((a, b) => priceNumber(a.price) - priceNumber(b.price));
  } else if (mode === "station") {
    sorted.sort((a, b) => scoreMinutes(a) - scoreMinutes(b));
  } else if (mode === "newest") {
    sorted.sort((a, b) => b.createdAt - a.createdAt);
  } else {
    sorted.sort((a, b) => compositePoints(b) - compositePoints(a));
  }

  return sorted;
}

function editProperty(id) {
  const property = properties.find((item) => item.id === id);
  if (!property) return;

  editingId = id;
  document.querySelector("#urlInput").value = property.url;
  document.querySelector("#nameInput").value = property.name;
  document.querySelector("#priceInput").value = property.price;
  document.querySelector("#addressInput").value = property.address;
  document.querySelector("#bedroomsInput").value = property.bedrooms ?? "";
  document.querySelector("#bathroomsInput").value = property.bathrooms ?? "";
  document.querySelector("#sqftInput").value = property.sqft ?? "";
  document.querySelector("#outdoorSpaceInput").value = property.outdoorSpace ?? "none";
  document.querySelector("#lightCeilingsInput").value = property.lightCeilingsScore ?? "";
  document.querySelector("#floorplanInput").value = property.floorplanUrl ?? "";
  document.querySelector("#photoInput").value = property.photoUrl ?? "";
  document.querySelector("#latInput").value = property.coordinates?.lat || property.lat || "";
  document.querySelector("#lngInput").value = property.coordinates?.lng || property.lng || "";
  document.querySelector("#notesInput").value = property.notes;
  form.querySelector("button[type='submit']").textContent = "Update property";
  form.scrollIntoView({ behavior: "smooth", block: "start" });
}

function deleteProperty(id) {
  properties = properties.filter((item) => item.id !== id);
  saveProperties();
  render();
}

function migratePropertyData(property) {
  const notes = property.notes || "";
  return {
    ...property,
    votes: normalizeVotes(property.votes),
    photoUrl: property.photoUrl || "",
    bedrooms: property.bedrooms ?? parseNumberFromNotes(notes, /\b(\d+(?:\.\d+)?)\s*bed\b/i),
    bathrooms: property.bathrooms ?? parseNumberFromNotes(notes, /\b(\d+(?:\.\d+)?)\s*bath\b/i),
    sqft: Number(property.sqft) > 0 ? property.sqft : parseSqft(notes),
  };
}

function parseNumberFromNotes(notes, pattern) {
  const match = String(notes || "").match(pattern);
  return match ? Number(match[1]) : null;
}

function recalculatePropertyScore(property) {
  const lat = property.coordinates?.lat ?? property.lat;
  const lng = property.coordinates?.lng ?? property.lng;

  if (Number.isFinite(lat) && Number.isFinite(lng)) {
    return {
      ...property,
      score: assessLocation(lat, lng),
    };
  }

  return property;
}

function renderNonNegotiables(container, property) {
  container.innerHTML = "";
  getNonNegotiableChecks(property).forEach((check) => {
    const item = document.createElement("span");
    item.className = `criteria-chip ${check.neutral ? "is-neutral" : check.met ? "is-met" : "is-failed"}`;

    if (check.type === "lightCeilings") {
      item.append(renderLightCeilingsControl(property, check));
    } else {
      item.innerHTML = `
        <span class="criteria-main">
          <span>${check.name}</span>
          <strong>${check.value}</strong>
        </span>
        <span class="criteria-score">${check.scoreLabel}</span>
      `;
    }

    if (check.detail) {
      const detail = document.createElement(check.link ? "a" : "span");
      detail.className = "criteria-detail";
      detail.textContent = check.detail;
      if (check.link) {
        detail.href = check.link;
        detail.target = "_blank";
        detail.rel = "noopener noreferrer";
      }
      item.querySelector(".criteria-main").append(detail);
    }
    container.append(item);
  });
}

function renderLightCeilingsControl(property, check) {
  const main = document.createElement("span");
  const label = document.createElement("span");
  const select = document.createElement("select");
  const score = document.createElement("span");

  main.className = "criteria-main";
  label.textContent = check.name;
  select.className = "inline-score-select";
  select.setAttribute("aria-label", `Light and ceilings score for ${property.name}`);
  select.append(new Option("Not scored", ""));
  for (let value = 1; value <= 10; value += 1) {
    select.append(new Option(`${value}/10`, String(value)));
  }
  select.value = property.lightCeilingsScore ?? "";
  select.addEventListener("change", () => updateLightCeilingsScore(property.id, select.value));

  score.className = "criteria-score";
  score.textContent = check.scoreLabel;
  main.append(label, select);

  const fragment = document.createDocumentFragment();
  fragment.append(main, score);
  return fragment;
}

function updateLightCeilingsScore(propertyId, value) {
  const score = value ? Number(value) : null;
  properties = properties.map((property) =>
    property.id === propertyId
      ? { ...property, lightCeilingsScore: score, updatedAt: Date.now() }
      : property,
  );
  saveProperties();
  render();
}

function calculateCompositeScore(property) {
  const scores = [
    property.score?.points,
    scoreBedrooms(property.bedrooms).score,
    scoreBathrooms(property.bathrooms).score,
    scoreSqft(property.sqft).score,
    scoreOutdoorSpace(property.outdoorSpace).score,
    scoreLightCeilings(property.lightCeilingsScore).score,
    assessGymAccess(property).score,
    assessCoffeeAccess(property).score,
    assessGroceryAccess(property).score,
    assessWorkTravel(property).score,
  ].filter((value) => Number.isFinite(value));

  if (!scores.length) return { score: null, count: 0 };

  return {
    score: roundToOneDecimal(scores.reduce((total, value) => total + value, 0) / scores.length),
    count: scores.length,
  };
}

function renderFloorplanLink(link, floorplanUrl) {
  link.classList.toggle("is-hidden", !floorplanUrl);
  if (floorplanUrl) link.href = floorplanUrl;
}

function renderPropertyPhoto(image, photoUrl) {
  image.classList.toggle("is-hidden", !photoUrl);
  if (photoUrl) image.src = photoUrl;
}

function getNonNegotiableChecks(property) {
  return [
    {
      name: "Bedrooms",
      value: scoreBedrooms(property.bedrooms).value,
      scoreLabel: scoreBedrooms(property.bedrooms).scoreLabel,
      met: Number(property.bedrooms) >= NON_NEGOTIABLES.bedrooms,
    },
    {
      name: "Bathrooms",
      value: scoreBathrooms(property.bathrooms).value,
      scoreLabel: scoreBathrooms(property.bathrooms).scoreLabel,
      met: Number(property.bathrooms) >= NON_NEGOTIABLES.bathrooms,
    },
    {
      name: "Sq. footage",
      value: scoreSqft(property.sqft).value,
      scoreLabel: scoreSqft(property.sqft).scoreLabel,
      met: Number(property.sqft) >= NON_NEGOTIABLES.sqft,
      neutral: !property.sqft,
    },
    {
      name: "Price cap",
      value: property.price || "Missing",
      scoreLabel: priceNumber(property.price) <= NON_NEGOTIABLES.maxPrice ? "Pass" : "Flag",
      met: priceNumber(property.price) <= NON_NEGOTIABLES.maxPrice,
      neutral: !property.price,
    },
    {
      name: "Price / sq ft",
      value: formatPricePerSqft(property).value,
      scoreLabel: formatPricePerSqft(property).scoreLabel,
      met: true,
      neutral: true,
    },
    {
      name: "Outdoor space",
      value: scoreOutdoorSpace(property.outdoorSpace).value,
      scoreLabel: scoreOutdoorSpace(property.outdoorSpace).scoreLabel,
      met: (property.outdoorSpace || "none") !== "none",
    },
    {
      name: "Gym time",
      value: assessGymAccess(property).value,
      scoreLabel: assessGymAccess(property).scoreLabel,
      detail: assessGymAccess(property).detail,
      link: assessGymAccess(property).link,
      met: assessGymAccess(property).met,
      neutral: assessGymAccess(property).neutral,
    },
    {
      name: "Coffee shop",
      value: assessCoffeeAccess(property).value,
      scoreLabel: assessCoffeeAccess(property).scoreLabel,
      detail: assessCoffeeAccess(property).detail,
      link: assessCoffeeAccess(property).link,
      met: assessCoffeeAccess(property).met,
      neutral: assessCoffeeAccess(property).neutral,
    },
    {
      name: "Supermarket",
      value: assessGroceryAccess(property).value,
      scoreLabel: assessGroceryAccess(property).scoreLabel,
      detail: assessGroceryAccess(property).detail,
      link: assessGroceryAccess(property).link,
      met: assessGroceryAccess(property).met,
      neutral: assessGroceryAccess(property).neutral,
    },
    {
      name: "Work commute",
      value: assessWorkTravel(property).value,
      scoreLabel: assessWorkTravel(property).scoreLabel,
      detail: assessWorkTravel(property).detail,
      link: assessWorkTravel(property).link,
      met: assessWorkTravel(property).met,
      neutral: assessWorkTravel(property).neutral,
    },
    {
      name: "Light / ceilings",
      value: "Manual",
      scoreLabel: formatScore(property.lightCeilingsScore),
      met: true,
      neutral: true,
      type: "lightCeilings",
    },
  ];
}

function formatCriterionValue(value, suffix = "") {
  return value === null || value === undefined || value === "" ? "Missing" : `${value}${suffix}`;
}

function scoreBedrooms(value) {
  const bedrooms = Number(value);
  if (!Number.isFinite(bedrooms)) return { score: null, value: "Missing", scoreLabel: "Flag" };
  if (bedrooms < 2) return { score: 3, value: `${bedrooms} bed`, scoreLabel: "3/10" };
  if (bedrooms === 2) return { score: 8, value: "2 bed", scoreLabel: "8/10" };
  return { score: 10, value: `${bedrooms} bed`, scoreLabel: "10/10" };
}

function scoreBathrooms(value) {
  const bathrooms = Number(value);
  if (!Number.isFinite(bathrooms)) return { score: null, value: "Missing", scoreLabel: "Flag" };
  if (bathrooms < 2) return { score: 3, value: `${bathrooms}`, scoreLabel: "3/10" };
  return { score: 10, value: `${bathrooms}`, scoreLabel: "10/10" };
}

function scoreSqft(value) {
  const sqft = Number(value);
  if (!Number.isFinite(sqft) || sqft <= 0) return { score: null, value: "Missing", scoreLabel: "Flag" };
  if (sqft < 800) return { score: 5, value: `${sqft} sq ft`, scoreLabel: "5/10" };
  if (sqft < 900) return { score: 7, value: `${sqft} sq ft`, scoreLabel: "7/10" };
  if (sqft < 1000) return { score: 9, value: `${sqft} sq ft`, scoreLabel: "9/10" };
  return { score: 10, value: `${sqft} sq ft`, scoreLabel: "10/10" };
}

function formatPricePerSqft(property) {
  const price = priceNumber(property.price);
  const sqft = Number(property.sqft);

  if (!Number.isFinite(price) || price === Number.MAX_SAFE_INTEGER || !Number.isFinite(sqft) || sqft <= 0) {
    return { value: "Missing", scoreLabel: "Not scored" };
  }

  return {
    value: `£${Math.round(price / sqft).toLocaleString("en-GB")}`,
    scoreLabel: "per sq ft",
  };
}

function formatOutdoorSpace(value) {
  return value ? value.replace(/\b\w/g, (letter) => letter.toUpperCase()) : "None";
}

function scoreOutdoorSpace(value) {
  const normalized = value || "none";
  const scores = {
    none: 5,
    "shared garden": 6,
    balcony: 8,
    garden: 10,
  };
  return {
    score: scores[normalized] ?? 5,
    value: formatOutdoorSpace(normalized),
    scoreLabel: `${scores[normalized] ?? 5}/10`,
  };
}

function formatScore(value) {
  return scoreLightCeilings(value).label;
}

function scoreLightCeilings(value) {
  const score = Number(value);
  if (!Number.isFinite(score) || score < 1) return { score: null, label: "Not scored" };
  return { score, label: `${score}/10` };
}

function parseSqft(value) {
  const match = String(value || "").match(/([\d,]+)\s*(?:sq\.?\s*ft|sqft|square feet)/i);
  return match ? Number(match[1].replace(/,/g, "")) : null;
}

function resetForm() {
  editingId = null;
  form.reset();
  form.querySelector("button[type='submit']").textContent = "Add property";
}

async function initialiseSharedProperties() {
  await syncSharedProperties({ migrateLocal: true });
  refreshSavedListings({ reason: "startup" });
}

async function initialiseScanner() {
  if (!canUseImporter()) {
    scannerStatus.textContent = "Open through http://localhost:4173 to use the scanner.";
    scannerToggle.disabled = true;
    scanNowBtn.disabled = true;
    scannerUrlsInput.disabled = true;
    return;
  }

  try {
    const settings = await fetchScannerSettings();
    renderScannerSettings(settings);
  } catch {
    scannerStatus.textContent = "Scanner settings could not be loaded.";
  }
}

async function fetchScannerSettings() {
  const response = await fetch(`${apiBaseUrl()}/api/scanner`);
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.error || "Could not load scanner settings.");
  return payload;
}

function renderScannerSettings(settings) {
  scannerToggle.checked = Boolean(settings.enabled);
  scannerUrlsInput.value = (settings.searchUrls || []).join("\n");
  scannerStatus.textContent = scannerStatusText(settings);
  renderScannerSourceList(settings.searchUrls || []);
  renderScannerCandidates(settings.candidates || []);
}

function scannerStatusText(settings) {
  const result = settings.lastResult;
  if (!result) {
    return settings.enabled ? "Scanner is on. It checks every 30 minutes." : "Scanner is paused.";
  }

  const when = settings.lastRunAt ? new Date(settings.lastRunAt).toLocaleString("en-GB") : "recently";
  const matches = result.matches?.length || 0;
  const discovered = result.discovered || 0;
  const rejected = result.rejected?.length || 0;
  const errors = result.errors?.length || 0;
  const topRejection = topScannerRejection(result.rejectionSummary);
  return `Last scan ${when}: found ${discovered}, flagged ${matches}, skipped ${rejected}${topRejection ? `, mostly: ${topRejection}` : ""}${errors ? `, ${errors} error${errors === 1 ? "" : "s"}` : ""}.`;
}

function topScannerRejection(summary) {
  const entries = Object.entries(summary || {}).sort((a, b) => b[1] - a[1]);
  return entries.length ? `${entries[0][0]} (${entries[0][1]})` : "";
}

function renderScannerSourceList(searchUrls) {
  scannerSourceList.innerHTML = "";
  searchUrls.forEach((url) => {
    const row = document.createElement("a");
    row.className = "scanner-source-row";
    row.href = url;
    row.target = "_blank";
    row.rel = "noopener noreferrer";
    row.innerHTML = `
      <span>
        <strong>${scannerHostName(url)}</strong>
        <small>${url}</small>
      </span>
    `;
    scannerSourceList.append(row);
  });
}

function scannerHostName(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "Search page";
  }
}

function renderScannerCandidates(candidates) {
  scannerCandidateList.innerHTML = "";

  if (!candidates.length) {
    const empty = document.createElement("p");
    empty.className = "form-note";
    empty.textContent = "No scanner matches awaiting review.";
    scannerCandidateList.append(empty);
    return;
  }

  candidates.forEach((candidate) => {
    const row = document.createElement("div");
    const propertyLink = document.createElement("a");
    const score = document.createElement("span");
    const openLink = document.createElement("a");
    const approveButton = document.createElement("button");
    const declineButton = document.createElement("button");

    row.className = "scanner-candidate-row";
    propertyLink.className = "summary-property-link";
    propertyLink.href = candidate.url;
    propertyLink.target = "_blank";
    propertyLink.rel = "noopener noreferrer";
    propertyLink.textContent = `${candidate.name || listingNameFromUrl(candidate.url)} · ${candidate.price || "Price missing"}`;

    score.className = "scanner-candidate-score";
    score.textContent = `${candidate.compositeScore}/10`;

    openLink.className = "secondary small scanner-open-link";
    openLink.href = candidate.url;
    openLink.dataset.openUrl = candidate.url;
    openLink.textContent = "Open listing";

    approveButton.className = "secondary small";
    approveButton.type = "button";
    approveButton.dataset.scannerAction = "approve";
    approveButton.dataset.url = candidate.url;
    approveButton.setAttribute("aria-label", "Add to Dreamhouse list");
    approveButton.textContent = "✓";

    declineButton.className = "danger small";
    declineButton.type = "button";
    declineButton.dataset.scannerAction = "decline";
    declineButton.dataset.url = candidate.url;
    declineButton.setAttribute("aria-label", "Decline scanner match");
    declineButton.textContent = "×";

    row.append(propertyLink, score, openLink, approveButton, declineButton);
    scannerCandidateList.append(row);
  });
}

function handleScannerListingOpen(event) {
  const link = event.target.closest("[data-open-url]");
  if (!link) return;
  event.preventDefault();
  window.location.href = link.dataset.openUrl;
}

async function handleScannerCandidateAction(event) {
  const button = event.target.closest("[data-scanner-action]");
  if (!button) return;

  const action = button.dataset.scannerAction;
  const url = button.dataset.url;
  button.disabled = true;
  scannerStatus.textContent = action === "approve" ? "Adding scanner match..." : "Declining scanner match...";

  try {
    const endpoint = action === "approve" ? "/api/scanner/approve" : "/api/scanner/decline";
    const response = await fetch(`${apiBaseUrl()}${endpoint}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ url }),
    });
    const settings = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(settings.error || "Could not update scanner match.");
    renderScannerSettings(settings);
    if (action === "approve") {
      await syncSharedProperties();
      scannerStatus.textContent = "Added to the Dreamhouse list.";
    }
  } catch (error) {
    scannerStatus.textContent = error.message || "Could not update scanner match.";
  } finally {
    button.disabled = false;
  }
}

async function saveScannerSettings() {
  if (!canUseImporter()) return;
  scannerStatus.textContent = "Saving scanner settings...";

  try {
    const settings = await postScannerSettings({
      enabled: scannerToggle.checked,
      searchUrls: scannerUrlsInput.value.split(/\n+/).map((url) => url.trim()).filter(Boolean),
    });
    renderScannerSettings(settings);
  } catch (error) {
    scannerStatus.textContent = error.message || "Could not save scanner settings.";
  }
}

async function postScannerSettings(payload) {
  const response = await fetch(`${apiBaseUrl()}/api/scanner`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const result = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(result.error || "Could not save scanner settings.");
  return result;
}

async function runScannerNow() {
  if (!canUseImporter()) return;
  scanNowBtn.disabled = true;
  scannerStatus.textContent = "Scanning search pages...";

  try {
    await saveScannerSettings();
    const response = await fetch(`${apiBaseUrl()}/api/scanner/run`, { method: "POST" });
    const result = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(result.error || "Scan failed.");
    const settings = await fetchScannerSettings();
    renderScannerSettings(settings);
    await syncSharedProperties();
  } catch (error) {
    scannerStatus.textContent = error.message || "Scan failed.";
  } finally {
    scanNowBtn.disabled = false;
  }
}

async function syncSharedProperties(options = {}) {
  if (!canUseImporter() || isSavingShared) return;

  try {
    const response = await fetch(`${apiBaseUrl()}/api/properties`);
    if (!response.ok) return;

    const payload = await response.json();
    const remoteProperties = Array.isArray(payload.properties) ? payload.properties : [];
    const remoteUpdatedAt = Number(payload.updatedAt) || 0;

    if (options.migrateLocal && !remoteProperties.length && properties.length) {
      await saveSharedProperties();
      return;
    }

    if (remoteUpdatedAt > sharedUpdatedAt) {
      sharedUpdatedAt = remoteUpdatedAt;
      properties = remoteProperties.map(migratePropertyData).map(recalculatePropertyScore);
      saveLocalProperties();
      render();
    }
  } catch {
    // The app still works from this browser's local copy if the shared server is unavailable.
  }
}

async function saveSharedProperties() {
  if (!canUseImporter()) return;

  isSavingShared = true;
  try {
    const response = await fetch(`${apiBaseUrl()}/api/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ properties }),
    });
    const payload = await response.json().catch(() => ({}));
    if (response.ok) {
      sharedUpdatedAt = Number(payload.updatedAt) || Date.now();
    }
  } finally {
    isSavingShared = false;
  }
}

function readProperties() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

function saveProperties() {
  saveLocalProperties();
  saveSharedProperties().catch(() => {
    // Local storage remains the fallback if a deployed server is unavailable.
  });
}

function saveLocalProperties() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(properties));
}

function extractUkPostcode(value) {
  const match = value.match(/\b([A-Z]{1,2}\d[A-Z\d]?\s*\d[A-Z]{2})\b/i);
  return match ? match[1].toUpperCase().replace(/\s+/g, " ") : null;
}

function listingNameFromUrl(url) {
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const idMatch = parsed.pathname.match(/properties\/(\d+)/);
    return idMatch ? `${host} property ${idMatch[1]}` : host;
  } catch {
    return "Property";
  }
}

function stationText(name, minutes) {
  if (minutes === null || minutes === undefined) return name;
  return `${name}, ${minutesText(minutes)}`;
}

function minutesText(minutes) {
  if (minutes === null || minutes === undefined) return "Not assessed";
  return `${round(minutes)} min walk`;
}

function round(value) {
  return Math.round(value * 10) / 10;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function priceNumber(value) {
  const number = Number(String(value || "").replace(/[^\d]/g, ""));
  return Number.isFinite(number) && number > 0 ? number : Number.MAX_SAFE_INTEGER;
}

function scorePoints(property) {
  return property.score.points ?? -1;
}

function compositePoints(property) {
  return calculateCompositeScore(property).score ?? -1;
}

function scoreMinutes(property) {
  return property.score.bestMinutes ?? Number.MAX_SAFE_INTEGER;
}

function roundToOneDecimal(value) {
  return Math.round(value * 10) / 10;
}

function setGeoNote(message) {
  geoNote.textContent = message;
}
