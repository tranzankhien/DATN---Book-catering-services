import { useEffect, useRef, useState } from 'react';
import type Map from 'ol/Map.js';
import type Overlay from 'ol/Overlay.js';
import { fromLonLat, toLonLat } from 'ol/proj.js';
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
          view: new View({ center, zoom: selected ? 16 : 11, minZoom: 4, maxZoom: 19 }),
        });
        map.current = instance;
        const pin = document.createElement('span');
        pin.className = 'block h-4 w-4 rounded-full border-2 border-white bg-amber-800 shadow-md';
        pin.setAttribute('aria-label', 'Ghim địa điểm đã chọn');
        marker.current = new Overlay({ element: pin, positioning: 'center-center', stopEvent: false });
        instance.addOverlay(marker.current);
        marker.current.setPosition(selected ? center : undefined);
        instance.on('singleclick', event => {
          const [lon, lat] = toLonLat(event.coordinate);
          latest.current.onPick({ lat, lon });
        });
        await apply(instance, mapStyle);
        if (active) instance.updateSize();
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
  }, [point]);

  return <>
    <div ref={container} aria-label="Bản đồ chọn địa điểm" className="relative isolate h-64 w-full rounded-xl border border-stone-200" />
    {error && <p role="status" className="text-xs text-stone-600">Không tải được một phần bản đồ. Bạn vẫn có thể chọn gợi ý hoặc nhập địa chỉ.</p>}
    {point && <a className="text-xs font-semibold text-amber-900 underline" target="_blank" rel="noreferrer"
      href={`https://www.openstreetmap.org/?mlat=${point.lat}&mlon=${point.lon}#map=17/${point.lat}/${point.lon}`}>Mở vị trí trên OpenStreetMap</a>}
  </>;
}

export function EventLocationField({ value, point, onChange }: {
  value: string;
  point?: MapPoint;
  onChange: (value: string, point?: MapPoint) => void;
}) {
  const [search, setSearch] = useState('');
  const [options, setOptions] = useState<Place[]>([]);
  const [status, setStatus] = useState('');
  const [mapOpen, setMapOpen] = useState(false);
  const reverse = useRef<AbortController | null>(null);

  useEffect(() => {
    if (search.trim().length < 3) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setStatus('Đang tìm địa chỉ…');
      try {
        const results = await places('/api/', { q: search.trim(), bbox: '102,8,110,24', limit: '6' },
          AbortSignal.any([controller.signal, AbortSignal.timeout(7000)]));
        if (controller.signal.aborted) return;
        setOptions(results);
        setStatus(results.length ? '' : 'Không tìm thấy gợi ý. Bạn có thể nhập địa chỉ hoặc chọn trên bản đồ.');
      } catch {
        if (!controller.signal.aborted) setStatus('Chưa tải được gợi ý. Bạn vẫn có thể nhập địa chỉ.');
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
    setStatus('Đang tìm tên địa chỉ tại điểm đã chọn…');
    try {
      const [match] = await places('/reverse', { lat: String(selected.lat), lon: String(selected.lon), limit: '1' },
        AbortSignal.any([controller.signal, AbortSignal.timeout(7000)]));
      if (controller.signal.aborted) return;
      if (match) onChange(match.label.slice(0, 255), selected);
      setStatus(match ? '' : 'Đã ghim vị trí. Hãy nhập địa chỉ hoặc tên sảnh.');
    } catch {
      if (!controller.signal.aborted) setStatus('Đã ghim vị trí. Hãy nhập địa chỉ hoặc tên sảnh.');
    }
  }

  return <div className="space-y-2">
    <label htmlFor="event-location" className="block text-xs font-semibold text-stone-700">
      Địa điểm / Sảnh tổ chức tiệc <span className="text-rose-500">*</span>
    </label>
    <input id="event-location" type="text" required maxLength={255} autoComplete="off" value={value}
      placeholder="Ví dụ: Chương Mỹ, Hà Nội"
      onChange={event => {
        reverse.current?.abort();
        const text = event.target.value;
        setOptions([]);
        setStatus('');
        setSearch(point ? '' : text);
        onChange(text, point);
      }}
      className="w-full rounded-xl border border-stone-300 bg-stone-50/50 px-4 py-3 text-sm focus:border-amber-600 focus:outline-none" />
    {status && <p role="status" className="text-xs text-stone-600">{status}</p>}
    {options.length > 0 && <ul aria-label="Địa chỉ gợi ý" className="max-h-48 overflow-auto rounded-xl border border-stone-200 bg-white">
      {options.map((place, index) => <li key={index}>
        <button type="button" onClick={() => apply(place)} className="block w-full px-3 py-2 text-left text-sm hover:bg-amber-50 focus:bg-amber-50">
          {place.label}
        </button>
      </li>)}
    </ul>}
    <div className="flex flex-wrap items-center gap-3 text-xs">
      <button type="button" aria-expanded={mapOpen} onClick={() => setMapOpen(open => !open)} className="font-semibold text-amber-900 underline">
        {mapOpen ? 'Ẩn bản đồ' : 'Chọn trên bản đồ'}
      </button>
      {point && <button type="button" onClick={() => { reverse.current?.abort(); setStatus(''); onChange(value, undefined); }}
        className="text-stone-600 underline">Bỏ ghim</button>}
      {point && <span className="text-emerald-800">Đã ghim vị trí</span>}
    </div>
    {mapOpen && <>
      <p className="text-xs text-stone-600">Bấm lên bản đồ để ghim đúng địa điểm.</p>
      <AddressMap point={point} onPick={pick} />
    </>}
  </div>;
}
