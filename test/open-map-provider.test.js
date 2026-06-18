import test from 'node:test'
import assert from 'node:assert/strict'

import {
  buildNominatimSearchUrl,
  buildOsrmRouteUrl,
  createOpenMapProviderConfig,
  normalizeCoordinate,
  toOsmMarkerUrl,
  toOsmTileUrl,
} from '../src/map/openMapProvider.js'

test('normalizeCoordinate accepts common lat/lng shapes', () => {
  assert.deepEqual(normalizeCoordinate({ lat: '37.7749', lng: '-122.4194' }), { lat: 37.7749, lng: -122.4194 })
  assert.deepEqual(normalizeCoordinate({ latitude: 38, longitude: -120 }), { lat: 38, lng: -120 })
})

test('normalizeCoordinate validates coordinate ranges', () => {
  assert.throws(() => normalizeCoordinate({ lat: 91, lng: 0 }), /Latitude/)
  assert.throws(() => normalizeCoordinate({ lat: 0, lng: -181 }), /Longitude/)
})

test('toOsmTileUrl expands xyz tile templates', () => {
  assert.equal(toOsmTileUrl('https://tiles.example/{z}/{x}/{y}.png', { z: 8, x: 40, y: 97 }), 'https://tiles.example/8/40/97.png')
})

test('toOsmMarkerUrl creates a shareable OSM marker URL', () => {
  assert.equal(
    toOsmMarkerUrl({ lat: 37.7749, lng: -122.4194 }, 12),
    'https://www.openstreetmap.org/?mlat=37.7749&mlon=-122.4194#map=12/37.7749/-122.4194',
  )
})

test('buildOsrmRouteUrl creates a provider-neutral route URL', () => {
  assert.equal(
    buildOsrmRouteUrl({ lat: 37, lng: -122 }, { lat: 38, lng: -121 }, { baseUrl: 'https://osrm.example/', steps: true }),
    'https://osrm.example/route/v1/driving/-122,37;-121,38?overview=full&geometries=geojson&steps=true',
  )
})

test('buildNominatimSearchUrl encodes search parameters', () => {
  const url = buildNominatimSearchUrl(' Yosemite Valley ', { baseUrl: 'https://geo.example/', limit: 3, countrycodes: 'us' })
  assert.equal(url, 'https://geo.example/search?q=Yosemite+Valley&format=jsonv2&addressdetails=1&limit=3&countrycodes=us')
})

test('createOpenMapProviderConfig uses environment overrides', () => {
  assert.deepEqual(createOpenMapProviderConfig({ VITE_MAP_TILE_URL: 'https://tiles/{z}/{x}/{y}.png' }), {
    provider: 'openstreetmap',
    tileUrl: 'https://tiles/{z}/{x}/{y}.png',
    tileAttribution: '© OpenStreetMap contributors',
    geocodingApiBase: 'https://nominatim.openstreetmap.org',
    routingApiBase: 'https://router.project-osrm.org',
  })
})
