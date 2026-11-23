import { useEffect, useRef, useState } from 'react';
import type Map from 'ol/Map.js';
import type Overlay from 'ol/Overlay.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import { MapPin, CheckCircle2, Search, ExternalLink, Sparkles } from 'lucide-react';
import 'ol/ol.css';

export type MapPoint = { lat: number; lon: number };

type Place = {
  title: string;
  subtitle: string;
  label: string;
  point: MapPoint;
};

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || '';

const mapboxStyle = `https://api.mapbox.com/styles/v1/mapbox/streets-v12?access_token=${MAPBOX_TOKEN}`;
const fallbackMapStyle = import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';

// Mapbox Geocoding Forward Search
async function searchMapboxPlaces(query: string, signal: AbortSignal): Promise<Place[]> {
  try {
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json`);
    url.searchParams.set('access_token', MAPBOX_TOKEN);
    url.searchParams.set('country', 'vn');
    url.searchParams.set('language', 'vi');
    url.searchParams.set('limit', '6');

    const response = await fetch(url.toString(), { signal });
    if (!response.ok) throw new Error('Mapbox Geocoder failed');
    const data = await response.json();

    if (!data.features || !Array.isArray(data.features)) return [];

    return data.features.map((f: any) => {
      const [lon, lat] = f.center || f.geometry?.coordinates || [0, 0];
      const title = f.text || f.place_name?.split(',')[0] || query;
      const label = f.place_name || title;
      const subtitle = label.startsWith(title) ? label.slice(title.length).replace(/^,\s*/, '') : label;
      return {
        title,
        subtitle,
        label,
        point: { lat, lon },
      };
    });
  } catch (err: any) {
    if (signal.aborted) throw err;
    // Fallback to Photon if Mapbox fails or reaches limit
    return searchPhotonPlaces(query, signal);
  }
}

// Fallback search using Photon OpenStreetMap
async function searchPhotonPlaces(query: string, signal: AbortSignal): Promise<Place[]> {
  const url = new URL('https://photon.komoot.io/api/');
  url.searchParams.set('q', query);
  url.searchParams.set('bbox', '102,8,110,24');
  url.searchParams.set('limit', '6');

  const response = await fetch(url.toString(), { signal });
  if (!response.ok) return [];
  const data = await response.json();

  return (data.features || []).flatMap((feat: any) => {
    const [lon, lat] = feat.geometry?.coordinates || [];
    const p = feat.properties || {};
    if (p.countrycode !== 'VN' || !Number.isFinite(lat) || !Number.isFinite(lon)) return [];
    const streetAddress = [p.housenumber, p.street].filter(Boolean).join(' ');
    const label = [...new Set([p.name, streetAddress, p.district, p.city, p.county, p.state].filter(Boolean))].join(', ');
    if (!label) return [];
    return [{
      title: p.name || streetAddress || label.split(',')[0],
      subtitle: label,
      label,
      point: { lat, lon },
    }];
  });
}

// Mapbox Reverse Geocoding
async function reverseGeocodeMapbox(point: MapPoint, signal: AbortSignal): Promise<string | null> {
  try {
    const url = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${point.lon},${point.lat}.json`);
    url.searchParams.set('access_token', MAPBOX_TOKEN);
    url.searchParams.set('country', 'vn');
    url.searchParams.set('language', 'vi');
    url.searchParams.set('limit', '1');

    const response = await fetch(url.toString(), { signal });
    if (!response.ok) throw new Error('Mapbox Reverse failed');
    const data = await response.json();
    if (data.features && data.features.length > 0) {
      return data.features[0].place_name;
    }
  } catch (err) {
    if (signal.aborted) throw err;
  }
  return null;
}

function AddressMap({ point, onPick }: { point?: MapPoint; onPick: (point: MapPoint) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const marker = useRef<Overlay | null>(null);
  const isMapClick = useRef(false);
  const latest = useRef({ point, onPick });
  const [error, setError] = useState(false);
  latest.current = { point, onPick };

  useEffect(() => {
    let active = true;
    Promise.all([import('ol/Map.js'), import('ol/View.js'), import('ol/Overlay.js'), import('ol-mapbox-style')])
      .then(async ([{ default: Map }, { default: View }, { default: Overlay }, { apply }]) => {
        if (!active || !container.current) return;
        const selected = latest.current.point;
        const center = fromLonLat(selected ? [selected.lon, selected.lat] : [105.8542, 21.0285]);
        const instance = new Map({
          target: container.current,
          view: new View({ center, zoom: selected ? 16 : 13, minZoom: 4, maxZoom: 20 }),
        });
        map.current = instance;

        const pin = document.createElement('div');
        pin.style.pointerEvents = 'none';
        pin.style.userSelect = 'none';
        pin.className = 'flex flex-col items-center';
        pin.innerHTML = `
          <div class="px-2.5 py-1 bg-amber-950 text-white text-[11px] font-bold rounded-lg shadow-xl whitespace-nowrap mb-1 border border-amber-700/60">
            Sảnh tổ chức tiệc
          </div>
          <svg width="26" height="34" viewBox="0 0 24 32" fill="none" class="drop-shadow-md">
            <path d="M12 0C5.373 0 0 5.373 0 12C0 21.5 12 32 12 32C12 32 24 21.5 24 12C24 5.373 18.627 0 12 0Z" fill="#b45309"/>
            <circle cx="12" cy="11" r="4.5" fill="white"/>
          </svg>
        `;
        pin.setAttribute('aria-label', 'Ghim địa điểm đã chọn');
        marker.current = new Overlay({ element: pin, positioning: 'bottom-center', stopEvent: false });
        instance.addOverlay(marker.current);
        marker.current.setPosition(selected ? center : undefined);

        instance.on('click', (event) => {
          isMapClick.current = true;
          marker.current?.setPosition(event.coordinate);
          const [lon, lat] = toLonLat(event.coordinate);
          latest.current.onPick({ lat, lon });
        });

        try {
          await apply(instance, mapboxStyle);
        } catch {
          // Fallback to openfreemap if mapbox style load fails
          try {
            await apply(instance, fallbackMapStyle);
          } catch {
            if (active) setError(true);
          }
        }

        if (active) {
          instance.updateSize();
          window.setTimeout(() => instance.updateSize(), 200);
        }

        const ro = new ResizeObserver(() => {
          instance.updateSize();
        });
        if (container.current) {
          ro.observe(container.current);
        }
      })
      .catch(() => {
        if (active) setError(true);
      });

    return () => {
      active = false;
      map.current?.dispose();
      map.current = null;
      marker.current = null;
    };
  }, []);

  useEffect(() => {
    if (!point) {
      marker.current?.setPosition(undefined);
      return;
    }
    const center = fromLonLat([point.lon, point.lat]);
    marker.current?.setPosition(center);
    if (!isMapClick.current) {
      const view = map.current?.getView();
      if (view) {
        const targetZoom = Math.max(view.getZoom() ?? 0, 16);
        view.animate({ center, zoom: targetZoom, duration: 400 });
      }
    }
    isMapClick.current = false;
  }, [point]);

  return (
    <div className="space-y-2 mt-3">
      <div
        ref={container}
        aria-label="Bản đồ chọn địa điểm Mapbox"
        className="relative isolate h-80 sm:h-96 md:h-[440px] w-full rounded-2xl border-2 border-stone-200/90 shadow-sm overflow-hidden bg-stone-100 cursor-crosshair"
      />
      <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 px-1 gap-2">
        <span className="flex items-center gap-1.5 font-medium text-stone-600">
          <span className="h-2 w-2 rounded-full bg-amber-600 animate-pulse shrink-0" />
          Bấm chuột vào bất kỳ vị trí nào trên bản đồ để ghim tọa độ sảnh tiệc chính xác.
        </span>
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-stone-400">
            <Sparkles className="h-3 w-3 text-amber-600" />
            Bản đồ Mapbox HD
          </span>
          {point && (
            <a
              className="inline-flex items-center gap-1 font-semibold text-amber-900 hover:text-amber-700 underline transition-colors"
              target="_blank"
              rel="noreferrer"
              href={`https://www.google.com/maps?q=${point.lat},${point.lon}`}
            >
              <span>Mở trên Google Maps</span>
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
      {error && (
        <p role="status" className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
          Không tải được một phần bản đồ trực tuyến. Quý khách vẫn có thể chọn từ gợi ý hoặc nhập địa chỉ trực tiếp.
        </p>
      )}
    </div>
  );
}

export function EventLocationField({
  value,
  point,
  onChange,
}: {
  value: string;
  point?: MapPoint;
  onChange: (value: string, point?: MapPoint) => void;
}) {
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<Place[]>([]);
  const [status, setStatus] = useState('');
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [mapOpen, setMapOpen] = useState(true);
  const reverse = useRef<AbortController | null>(null);

  useEffect(() => {
    if (search.trim().length < 2) {
      setOptions([]);
      setLoadingSuggestions(false);
      return;
    }
    const controller = new AbortController();
    setLoadingSuggestions(true);
    setStatus('Đang tìm kiếm gợi ý địa chỉ Mapbox…');

    const timer = window.setTimeout(async () => {
      try {
        const results = await searchMapboxPlaces(search.trim(), controller.signal);
        if (controller.signal.aborted) return;
        setOptions(results);
        setLoadingSuggestions(false);
        setStatus(
          results.length
            ? ''
            : 'Không tìm thấy địa chỉ khớp. Bạn có thể tự gõ địa chỉ hoặc bấm chọn trực tiếp trên bản đồ bên dưới.'
        );
      } catch {
        if (!controller.signal.aborted) {
          setLoadingSuggestions(false);
          setStatus('Chưa tải được gợi ý tự động. Bạn vẫn có thể gõ địa chỉ hoặc bấm chọn trên bản đồ.');
        }
      }
    }, 400);

    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [search]);

  useEffect(() => () => reverse.current?.abort(), []);

  function apply(place: Place) {
    reverse.current?.abort();
    setSearch('');
    setOptions([]);
    setStatus('');
    onChange(place.label.slice(0, 255), place.point);
    setMapOpen(true);
  }

  async function pick(selected: MapPoint) {
    reverse.current?.abort();
    const controller = new AbortController();
    reverse.current = controller;
    setSearch('');
    setOptions([]);
    const tempCoordText = `Vị trí đã ghim (${selected.lat.toFixed(4)}, ${selected.lon.toFixed(4)})`;
    onChange(tempCoordText, selected);
    setStatus('Đang xác định địa chỉ chính xác qua Mapbox…');

    try {
      const placeName = await reverseGeocodeMapbox(selected, controller.signal);
      if (controller.signal.aborted) return;
      if (placeName) {
        onChange(placeName.slice(0, 255), selected);
        setStatus('');
      } else {
        setStatus('Đã ghim vị trí. Quý khách có thể bổ sung số nhà hoặc tên sảnh vào ô địa chỉ.');
      }
    } catch {
      if (!controller.signal.aborted) {
        setStatus('Đã ghim vị trí. Quý khách có thể bổ sung số nhà hoặc tên sảnh vào ô địa chỉ.');
      }
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <label htmlFor="event-location" className="block text-xs font-semibold text-stone-700">
          Địa điểm / Sảnh tổ chức tiệc <span className="text-rose-500">*</span>
        </label>
        <div className="flex items-center gap-3 text-xs">
          <button
            type="button"
            aria-expanded={mapOpen}
            onClick={() => setMapOpen((open) => !open)}
            className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-900 underline cursor-pointer"
          >
            <MapPin className="h-3.5 w-3.5 text-amber-700" />
            <span>{mapOpen ? 'Thu gọn bản đồ' : 'Mở rộng bản đồ chọn vị trí'}</span>
          </button>
          {point && (
            <button
              type="button"
              onClick={() => {
                reverse.current?.abort();
                setStatus('');
                onChange(value, undefined);
              }}
              className="text-stone-500 hover:text-stone-800 underline cursor-pointer"
            >
              Bỏ ghim
            </button>
          )}
          {point && (
            <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold text-[11px]">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Đã ghim vị trí
            </span>
          )}
        </div>
      </div>

      <div className="relative">
        <input
          id="event-location"
          type="text"
          required
          maxLength={255}
          autoComplete="off"
          value={value}
          placeholder="Ví dụ: Trung tâm Hội nghị Quốc gia, 57 Phạm Hùng, Hà Nội..."
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              if (options.length > 0) {
                apply(options[0]);
              }
            }
          }}
          onChange={(event) => {
            reverse.current?.abort();
            const text = event.target.value;
            setOptions([]);
            setStatus('');
            setSearch(point ? '' : text);
            onChange(text, point);
          }}
          className="w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-xs sm:text-sm text-stone-900 focus:border-amber-600 focus:ring-1 focus:ring-amber-600 focus:outline-none shadow-xs transition-colors"
        />

        {options.length > 0 && (
          <ul
            aria-label="Địa chỉ gợi ý Mapbox"
            className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-64 overflow-auto rounded-xl border border-stone-200 bg-white shadow-xl divide-y divide-stone-100"
          >
            {options.map((place, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => apply(place)}
                  className="w-full px-4 py-3 text-left hover:bg-amber-50/80 transition-colors flex items-start gap-2.5 cursor-pointer group"
                >
                  <MapPin className="h-4 w-4 text-amber-700 shrink-0 mt-0.5 group-hover:scale-110 transition-transform" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-bold text-stone-900 group-hover:text-amber-950 truncate">
                      {place.title}
                    </p>
                    {place.subtitle && (
                      <p className="text-[11px] text-stone-500 truncate mt-0.5">
                        {place.subtitle}
                      </p>
                    )}
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {status && (
        <p role="status" className="text-xs text-stone-600 italic flex items-center gap-1.5">
          {loadingSuggestions && <span className="h-2 w-2 rounded-full bg-amber-600 animate-ping inline-block" />}
          {status}
        </p>
      )}

      {mapOpen && <AddressMap point={point} onPick={pick} />}
    </div>
  );
}
