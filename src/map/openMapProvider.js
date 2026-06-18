const DEFAULT_TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
const DEFAULT_ATTRIBUTION = '© OpenStreetMap contributors'
const DEFAULT_OSRM_BASE_URL = 'https://router.project-osrm.org'
const DEFAULT_NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org'

export function normalizeCoordinate(point) {
  const lat = Number(point?.lat ?? point?.latitude)
  const lng = Number(point?.lng ?? point?.lon ?? point?.longitude)

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new Error('Coordinate requires finite lat/lng values')
  }
  if (lat < -90 || lat > 90) throw new Error('Latitude must be between -90 and 90')
  if (lng < -180 || lng > 180) throw new Error('Longitude must be between -180 and 180')

  return { lat, lng }
}

export function toOsmTileUrl(template = DEFAULT_TILE_URL, { x, y, z }) {
  if (!template || typeof template !== 'string') throw new Error('A tile URL template is required')
  return template.replace('{x}', encodeURIComponent(x)).replace('{y}', encodeURIComponent(y)).replace('{z}', encodeURIComponent(z))
}

export function toOsmMarkerUrl(point, zoom = 14) {
  const { lat, lng } = normalizeCoordinate(point)
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=${Number(zoom) || 14}/${lat}/${lng}`
}

export function buildOsrmRouteUrl(origin, destination, options = {}) {
  const from = normalizeCoordinate(origin)
  const to = normalizeCoordinate(destination)
  const baseUrl = String(options.baseUrl || DEFAULT_OSRM_BASE_URL).replace(/\/+$/, '')
  const profile = encodeURIComponent(options.profile || 'driving')
  const params = new URLSearchParams({
    overview: options.overview || 'full',
    geometries: options.geometries || 'geojson',
    steps: String(Boolean(options.steps)),
  })

  return `${baseUrl}/route/v1/${profile}/${from.lng},${from.lat};${to.lng},${to.lat}?${params.toString()}`
}

export function buildNominatimSearchUrl(query, options = {}) {
  const trimmedQuery = String(query || '').trim()
  if (!trimmedQuery) throw new Error('Search query is required')

  const baseUrl = String(options.baseUrl || DEFAULT_NOMINATIM_BASE_URL).replace(/\/+$/, '')
  const params = new URLSearchParams({
    q: trimmedQuery,
    format: 'jsonv2',
    addressdetails: String(options.addressdetails ?? 1),
    limit: String(options.limit || 5),
  })

  if (options.countrycodes) params.set('countrycodes', options.countrycodes)
  if (options.viewbox) params.set('viewbox', options.viewbox)
  if (options.bounded !== undefined) params.set('bounded', String(Number(Boolean(options.bounded))))

  return `${baseUrl}/search?${params.toString()}`
}

export function createOpenMapProviderConfig(env = {}) {
  return {
    provider: 'openstreetmap',
    tileUrl: env.VITE_MAP_TILE_URL || DEFAULT_TILE_URL,
    tileAttribution: env.VITE_MAP_TILE_ATTRIBUTION || DEFAULT_ATTRIBUTION,
    geocodingApiBase: env.VITE_GEOCODING_API_BASE || DEFAULT_NOMINATIM_BASE_URL,
    routingApiBase: env.VITE_ROUTING_API_BASE || DEFAULT_OSRM_BASE_URL,
  }
}
