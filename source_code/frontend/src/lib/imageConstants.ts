// Default curated high-resolution banquet and culinary photography fallbacks
export const DEFAULT_MENU_IMAGE =
  'https://images.unsplash.com/photo-1544025162-d76694265947?w=1000&auto=format&fit=crop&q=80';

export const DEFAULT_DISH_IMAGE =
  'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop&q=80';

// Inlined high-res warm luxury culinary SVG placeholder as the ultimate fallback when offline or unsplash is unreachable
export const CULINARY_SVG_FALLBACK =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(`
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600" fill="none">
  <defs>
    <radialGradient id="grad" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="#292524"/>
      <stop offset="50%" stop-color="#1c1917"/>
      <stop offset="100%" stop-color="#0c0a09"/>
    </radialGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#d97706"/>
      <stop offset="100%" stop-color="#b45309"/>
    </linearGradient>
  </defs>
  <rect width="800" height="600" fill="url(#grad)"/>
  <circle cx="400" cy="270" r="100" stroke="#78350f" stroke-width="2" stroke-opacity="0.3" fill="none"/>
  <circle cx="400" cy="270" r="80" stroke="#d97706" stroke-width="1.5" stroke-dasharray="4 4" stroke-opacity="0.4" fill="none"/>
  <path d="M400 210 C425 210 445 225 445 245 C445 255 438 262 430 266 C433 273 434 282 434 290 L366 290 C366 282 367 273 370 266 C362 262 355 255 355 245 C355 225 375 210 400 210 Z" fill="url(#gold)" opacity="0.9"/>
  <rect x="360" y="295" width="80" height="8" rx="4" fill="url(#gold)" opacity="0.9"/>
  <rect x="364" y="307" width="72" height="6" rx="3" fill="#78350f" opacity="0.8"/>
  <text x="400" y="360" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="700" font-size="20" fill="#fef3c7" letter-spacing="3">BANQUETHUB</text>
  <text x="400" y="390" text-anchor="middle" font-family="system-ui, -apple-system, sans-serif" font-weight="500" font-size="14" fill="#a8a29e" letter-spacing="1">ẨM THỰC YẾN TIỆC HOÀNG GIA</text>
</svg>
`);

export const handleImageError = (
  e: React.SyntheticEvent<HTMLImageElement, Event>,
  fallbackUrl: string = CULINARY_SVG_FALLBACK
) => {
  const target = e.currentTarget;
  if (target.dataset.triedFallback !== 'true') {
    target.dataset.triedFallback = 'true';
    target.src = fallbackUrl;
  }
};
