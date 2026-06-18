import { useMemo } from 'react'
import { Layers3, MapPin, Route, Search } from 'lucide-react'
import { createOpenMapProviderConfig, normalizeCoordinate, toOsmMarkerUrl } from './map/openMapProvider.js'

const TONE_COLORS = {
  meal: '#D29922',
  park: '#3FB950',
  logistics: '#8B949E',
  default: '#58A6FF',
}

function colorForLocation(location) {
  return TONE_COLORS[location?.category] || TONE_COLORS[location?.placeType] || TONE_COLORS.default
}

function getLocationCoordinate(location) {
  try {
    return normalizeCoordinate(location?.coordinates || location)
  } catch {
    return null
  }
}

function getLocationTitle(location) {
  return location?.title || location?.name || location?.label || 'Location'
}

function getRoutePath(route, locationsById) {
  if (Array.isArray(route?.currentPath) && route.currentPath.length) return route.currentPath
  if (Array.isArray(route?.path) && route.path.length) return route.path

  const origin = route?.originCoordinates || locationsById.get(route?.originLocationId)?.coordinates
  const destination = route?.destinationCoordinates || locationsById.get(route?.destinationLocationId)?.coordinates
  return [origin, destination].filter(Boolean)
}

function buildBounds(points) {
  const validPoints = points.map((point) => {
    try {
      return normalizeCoordinate(point)
    } catch {
      return null
    }
  }).filter(Boolean)

  if (!validPoints.length) {
    return {
      minLat: 37.6,
      maxLat: 38.1,
      minLng: -120.5,
      maxLng: -119.8,
    }
  }

  const lats = validPoints.map((point) => point.lat)
  const lngs = validPoints.map((point) => point.lng)
  const minLat = Math.min(...lats)
  const maxLat = Math.max(...lats)
  const minLng = Math.min(...lngs)
  const maxLng = Math.max(...lngs)
  const latPad = Math.max((maxLat - minLat) * 0.18, 0.04)
  const lngPad = Math.max((maxLng - minLng) * 0.18, 0.04)

  return {
    minLat: minLat - latPad,
    maxLat: maxLat + latPad,
    minLng: minLng - lngPad,
    maxLng: maxLng + lngPad,
  }
}

function projectPoint(point, bounds) {
  const normalized = normalizeCoordinate(point)
  const x = ((normalized.lng - bounds.minLng) / Math.max(bounds.maxLng - bounds.minLng, 0.000001)) * 100
  const y = (1 - (normalized.lat - bounds.minLat) / Math.max(bounds.maxLat - bounds.minLat, 0.000001)) * 100
  return {
    x: Math.min(Math.max(x, 3), 97),
    y: Math.min(Math.max(y, 3), 97),
  }
}

function RouteLine({ path, bounds, selected }) {
  const points = path.map((point) => {
    try {
      const projected = projectPoint(point, bounds)
      return `${projected.x},${projected.y}`
    } catch {
      return null
    }
  }).filter(Boolean).join(' ')

  if (!points) return null

  return (
    <polyline
      points={points}
      fill="none"
      stroke={selected ? '#F85149' : '#58A6FF'}
      strokeDasharray={selected ? '0' : '1.5 1.5'}
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth={selected ? 0.9 : 0.5}
      vectorEffect="non-scaling-stroke"
    />
  )
}

export default function CommandMap({
  locations = [],
  routes = [],
  families = [],
  cursorSlot = 0,
  mapUi = {},
  mapWeather,
  mapWeatherTargets = [],
  selectedLocationId,
  selectedRouteId,
  playbackActive = false,
  playbackHighlightLocationId = null,
  onUpdateMapUi,
  onSelectEntity,
}) {
  const providerConfig = useMemo(() => createOpenMapProviderConfig(import.meta.env), [])
  const locationsById = useMemo(() => new Map(locations.map((location) => [location.id, location])), [locations])
  const locationPoints = useMemo(() => locations.map(getLocationCoordinate).filter(Boolean), [locations])
  const routeEntries = useMemo(() => routes.map((route) => ({ route, path: getRoutePath(route, locationsById) })), [routes, locationsById])
  const routePoints = routeEntries.flatMap((entry) => entry.path || [])
  const bounds = useMemo(() => buildBounds([...locationPoints, ...routePoints]), [locationPoints, routePoints])
  const visibleLocations = locations.filter((location) => getLocationCoordinate(location))

  const focusDayId = mapUi.focusDayId || 'all'
  const selectedLocation = selectedLocationId ? locationsById.get(selectedLocationId) : null

  return (
    <div className="relative h-full min-h-[420px] overflow-hidden bg-[#05080d] text-slate-100">
      <div className="absolute inset-0 opacity-60" aria-hidden="true">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(88,166,255,0.25),transparent_28%),radial-gradient(circle_at_78%_74%,rgba(63,185,80,0.18),transparent_30%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] bg-[size:44px_44px]" />
      </div>

      <div className="absolute left-5 top-5 z-20 max-w-md rounded-2xl border border-slate-700/80 bg-slate-950/85 p-4 shadow-xl backdrop-blur">
        <div className="flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-cyan-300">
          <Layers3 size={14} /> Open Map Layer
        </div>
        <h2 className="mt-2 text-lg font-semibold">OpenStreetMap command surface</h2>
        <p className="mt-2 text-xs leading-5 text-slate-400">
          Google Maps runtime dependency has been replaced with a provider-neutral Open Map surface. Tile/search/route providers are configured through the Open Map adapter foundation.
        </p>
        <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-slate-300">
          <span className="rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1">{visibleLocations.length} places</span>
          <span className="rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1">{routes.length} routes</span>
          <span className="rounded-lg border border-slate-800 bg-slate-900/80 px-2 py-1">{families.length} groups</span>
        </div>
      </div>

      <div className="absolute right-5 top-5 z-20 w-72 rounded-2xl border border-slate-700/80 bg-slate-950/85 p-4 text-xs shadow-xl backdrop-blur">
        <div className="flex items-center gap-2 text-slate-300">
          <Search size={14} /> Provider config
        </div>
        <dl className="mt-3 space-y-2 text-slate-400">
          <div className="flex justify-between gap-3"><dt>Provider</dt><dd className="text-slate-200">{providerConfig.provider}</dd></div>
          <div className="flex justify-between gap-3"><dt>Focus</dt><dd className="text-slate-200">{focusDayId}</dd></div>
          <div className="flex justify-between gap-3"><dt>Playback</dt><dd className="text-slate-200">{playbackActive ? `slot ${cursorSlot.toFixed?.(1) || cursorSlot}` : 'paused'}</dd></div>
          {mapWeather ? <div className="flex justify-between gap-3"><dt>Weather</dt><dd className="text-right text-slate-200">{mapWeather.temperature} · {mapWeather.summary}</dd></div> : null}
        </dl>
        {mapWeatherTargets.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {mapWeatherTargets.map((target) => (
              <button
                key={target.id}
                className={`rounded-full border px-2 py-1 ${target.active ? 'border-cyan-300 text-cyan-200' : 'border-slate-700 text-slate-400'}`}
                type="button"
                onClick={() => onUpdateMapUi?.({ weatherTargetId: target.id })}
              >
                {target.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100" role="img" aria-label="Open map route overview">
        <defs>
          <filter id="mapGlow">
            <feGaussianBlur stdDeviation="1.6" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        {routeEntries.map(({ route, path }) => (
          <RouteLine key={route.id} path={path || []} bounds={bounds} selected={route.id === selectedRouteId} />
        ))}
        {visibleLocations.map((location) => {
          const point = projectPoint(getLocationCoordinate(location), bounds)
          const selected = location.id === selectedLocationId || location.id === playbackHighlightLocationId
          return (
            <g key={location.id} filter={selected ? 'url(#mapGlow)' : undefined}>
              <circle cx={point.x} cy={point.y} r={selected ? 1.5 : 1.05} fill={colorForLocation(location)} stroke="#0B0F14" strokeWidth="0.45" />
              <text x={point.x + 1.3} y={point.y - 1.3} fill="#DDE7F0" fontSize="1.8" paintOrder="stroke" stroke="#05080d" strokeWidth="0.45">
                {getLocationTitle(location)}
              </text>
            </g>
          )
        })}
      </svg>

      <div className="absolute bottom-5 left-5 z-20 flex max-w-[70%] flex-wrap gap-2">
        {visibleLocations.slice(0, 10).map((location) => {
          const selected = location.id === selectedLocationId
          return (
            <button
              key={location.id}
              className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs backdrop-blur ${selected ? 'border-cyan-300 bg-cyan-300/10 text-cyan-100' : 'border-slate-700 bg-slate-950/75 text-slate-300 hover:border-slate-500'}`}
              type="button"
              onClick={() => onSelectEntity?.({ type: 'location', id: location.id })}
            >
              <MapPin size={13} style={{ color: colorForLocation(location) }} />
              {getLocationTitle(location)}
            </button>
          )
        })}
      </div>

      <div className="absolute bottom-5 right-5 z-20 max-w-sm rounded-2xl border border-slate-700/80 bg-slate-950/85 p-4 text-xs text-slate-400 shadow-xl backdrop-blur">
        <div className="flex items-center gap-2 text-slate-200"><Route size={14} /> External map link</div>
        {selectedLocation ? (
          <a className="mt-2 block truncate text-cyan-300 hover:text-cyan-100" href={toOsmMarkerUrl(selectedLocation.coordinates || selectedLocation)} target="_blank" rel="noreferrer">
            Open {getLocationTitle(selectedLocation)} in OpenStreetMap
          </a>
        ) : (
          <p className="mt-2">Select a place to open it in OpenStreetMap.</p>
        )}
      </div>
    </div>
  )
}
