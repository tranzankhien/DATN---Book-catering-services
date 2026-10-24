import { useEffect, useRef, useState } from 'react';
import type Map from 'ol/Map.js';
import type Overlay from 'ol/Overlay.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
import { MapPin, CheckCircle2, RotateCcw, Search, ExternalLink } from 'lucide-react';
import 'ol/ol.css';

export type MapPoint = { lat: number; lon: number };
type Feature = { geometry: { coordinates: number[] }; properties: Record<string, string> };
type Place = { label: string; point: MapPoint };

const base = (import.meta.env.VITE_PHOTON_URL || 'https://photon.komoot.io').replace(/\/$/, '');
const mapStyle = import.meta.env.VITE_MAP_STYLE_URL || 'https://tiles.openfreemap.org/styles/liberty';

async function places(path: string, params: Record<string, string>, signal: AbortSignal): Promise<Place[]> {
  const url = new URL(base + path);
  url.search = new URLSearchParams(params).toString();
  const response = await fetch(url, { signal });
  if (!response.ok) throw new Error('Geocoder unavailable');
  const data = await response.json() as { features: Feature[] };
  return data.features.flatMap(({ geometry, properties: p }) => {
    const [lon, lat] = geometry.coordinates;
    if (p.countrycode !== 'VN' || !Number.isFinite(lat) || !Number.isFinite(lon)) return [];
    const streetAddress = [p.housenumber, p.street].filter(Boolean).join(' ');
    const label = [...new Set([p.name, streetAddress, p.district, p.city, p.county, p.state].filter(Boolean))].join(', ');
    return label ? [{ label, point: { lat, lon } }] : [];
  });
}

function AddressMap({ point, onPick }: { point?: MapPoint; onPick: (point: MapPoint) => void }) {
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<Map | null>(null);
  const marker = useRef<Overlay | null>(null);
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
          view: new View({ center, zoom: selected ? 16 : 12, minZoom: 4, maxZoom: 19 }),
        });
        map.current = instance;
        const pin = document.createElement('div');
        pin.className = 'flex flex-col items-center -translate-x-1/2 -translate-y-full cursor-pointer select-none';
        pin.innerHTML = `
          <div class="px-2.5 py-1 bg-amber-900 text-white text-[11px] font-bold rounded-lg shadow-xl whitespace-nowrap mb-1 border border-amber-700/60">
            Sảnh tổ chức tiệc
          </div>
          <div class="h-4 w-4 rounded-full border-2 border-white bg-amber-600 shadow-lg ring-4 ring-amber-500/30"></div>
        `;
        pin.setAttribute('aria-label', 'Ghim địa điểm đã chọn');
        marker.current = new Overlay({ element: pin, positioning: 'bottom-center', stopEvent: false });
        instance.addOverlay(marker.current);
        marker.current.setPosition(selected ? center : undefined);
        instance.on('singleclick', event => {
          const [lon, lat] = toLonLat(event.coordinate);
          latest.current.onPick({ lat, lon });
        });
        await apply(instance, mapStyle);
        if (active) {
          instance.updateSize();
          window.setTimeout(() => instance.updateSize(), 200);
        }
      }).catch(() => { if (active) setError(true); });
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
    const view = map.current?.getView();
    view?.setCenter(center);
    if (view && (view.getZoom() ?? 0) < 16) view.setZoom(16);
    map.current?.updateSize();
  }, [point]);

  return (
    <div className="space-y-2 mt-3">
      <div
        ref={container}
        aria-label="Bản đồ chọn địa điểm"
        className="relative isolate h-80 sm:h-96 md:h-[440px] w-full rounded-2xl border-2 border-stone-200/90 shadow-sm overflow-hidden bg-stone-100"
      />
      <div className="flex flex-wrap items-center justify-between text-xs text-stone-500 px-1 gap-2">
        <span className="flex items-center gap-1.5 font-medium text-stone-600">
          <span className="h-2 w-2 rounded-full bg-amber-600 animate-pulse shrink-0" />
          Bấm chuột vào bất kỳ vị trí nào trên bản đồ để ghim tọa độ sảnh tiệc chính xác.
        </span>
        {point && (
          <a
            className="inline-flex items-center gap-1 font-semibold text-amber-900 hover:text-amber-700 underline transition-colors"
            target="_blank"
            rel="noreferrer"
            href={`https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lon}#map=17/${point.lat}/${point.lon}`}
          >
            <span>Mở trên OpenStreetMap</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
      {error && (
        <p role="status" className="text-xs text-rose-600 bg-rose-50 p-2.5 rounded-xl border border-rose-200">
          Không tải được một phần bản đồ trực tuyến. Quý khách vẫn có thể chọn từ gợi ý hoặc nhập địa chỉ trực tiếp.
        </p>
      )}
    </div>
  );
}

export function EventLocationField({ value, point, onChange }: {
  value: string;
  point?: MapPoint;
  onChange: (value: string, point?: MapPoint) => void;
}) {
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<Place[]>([]);
  const [status, setStatus] = useState('');
  const [mapOpen, setMapOpen] = useState(true);
  const reverse = useRef<AbortController | null>(null);

  useEffect(() => {
    if (search.trim().length < 3) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus('Đang tìm kiếm gợi ý địa chỉ…');
      try {
        const results = await places('/api/', { q: search.trim(), bbox: '102,8,110,24', limit: '6' },
          AbortSignal.any([controller.signal, AbortSignal.timeout(7000)]));
        if (controller.signal.aborted) return;
        setOptions(results);
        setStatus(results.length ? '' : 'Không tìm thấy gợi ý tự động. Bạn có thể tự gõ địa chỉ hoặc chọn trực tiếp trên bản đồ bên dưới.');
      } catch {
        if (!controller.signal.aborted) setStatus('Chưa tải được gợi ý tự động. Bạn vẫn có thể gõ địa chỉ hoặc bấm chọn trên bản đồ.');
      }
    }, 500);
    return () => { window.clearTimeout(timer); controller.abort(); };
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
    onChange('', selected);
    setStatus('Đang xác định tên địa chỉ tại điểm đã ghim…');
    try {
      const [match] = await places('/reverse', { lat: String(selected.lat), lon: String(selected.lon), limit: '1' },
        AbortSignal.any([controller.signal, AbortSignal.timeout(7000)]));
      if (controller.signal.aborted) return;
      if (match) onChange(match.label.slice(0, 255), selected);
      setStatus(match ? '' : 'Đã ghim vị trí. Quý khách có thể bổ sung số nhà hoặc tên sảnh.');
    } catch {
      if (!controller.signal.aborted) setStatus('Đã ghim vị trí. Quý khách có thể bổ sung số nhà hoặc tên sảnh.');
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
            onClick={() => setMapOpen(open => !open)}
            className="inline-flex items-center gap-1 font-semibold text-amber-800 hover:text-amber-900 underline cursor-pointer"
          >
            <MapPin className="h-3.5 w-3.5 text-amber-700" />
            <span>{mapOpen ? 'Thu gọn bản đồ' : 'Mở rộng bản đồ chọn vị trí'}</span>
          </button>
          {point && (
            <button
              type="button"
              onClick={() => { reverse.current?.abort(); setStatus(''); onChange(value, undefined); }}
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
          placeholder="Ví dụ: 56-58 Ngô Gia Tự, TP. Bắc Ninh hoặc ghim trên bản đồ..."
          onChange={event => {
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
            aria-label="Địa chỉ gợi ý"
            className="absolute left-0 right-0 top-full mt-1.5 z-40 max-h-56 overflow-auto rounded-xl border border-stone-200 bg-white shadow-xl divide-y divide-stone-100"
          >
            {options.map((place, index) => (
              <li key={index}>
                <button
                  type="button"
                  onClick={() => apply(place)}
                  className="w-full px-4 py-2.5 text-left text-xs sm:text-sm text-stone-700 hover:bg-amber-50/80 hover:text-amber-950 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <MapPin className="h-3.5 w-3.5 text-amber-700 shrink-0" />
                  <span className="truncate">{place.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {status && (
        <p role="status" className="text-xs text-stone-600 italic">
          {status}
        </p>
      )}

      {mapOpen && (
        <AddressMap point={point} onPick={pick} />
      )}
    </div>
  );
}
