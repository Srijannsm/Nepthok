const ICONS: Record<string, string> = {
  home:       'M3 12L12 4l9 8 M5 10v10h14V10',
  pkg:        'M21 16V8a2 2 0 0 0-1-1.7l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.7l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z M3.27 6.96L12 12.01 20.73 6.96 M12 22.08V12',
  cart:       'M6 6h15l-1.5 9H7L5 3H2 M9 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z M19 21a1 1 0 1 0 0-2 1 1 0 0 0 0 2z',
  warehouse:  'M3 21V8l9-4 9 4v13 M7 21v-7h10v7 M7 17h10',
  tag:        'M20.6 13.4l-7.2 7.2a2 2 0 0 1-2.8 0L3 13V3h10l7.6 7.6a2 2 0 0 1 0 2.8z M7 7v.01',
  chart:      'M3 21h18 M6 17V10 M11 17V6 M16 17v-4 M21 17V8',
  settings:   'M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z',
  card:       'M3 8h18 M3 6h18v12H3z M7 14h2',
  store:      'M3 9l1-5h16l1 5 M4 22V11h16v11 M9 22v-6h6v6',
  bell:       'M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9 M11 22a2 2 0 0 0 2 0',
  search:     'M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z M21 21l-4.3-4.3',
  user:       'M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2 M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z',
  mail:       'M3 7l9 6 9-6 M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z',
  phone:      'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13 1 .37 1.96.72 2.85a2 2 0 0 1-.45 2.1L8.09 9.91a16 16 0 0 0 6 6l1.27-1.28a2 2 0 0 1 2.1-.45c.89.35 1.85.59 2.85.72A2 2 0 0 1 22 16.92z',
  lock:       'M5 11h14v10H5z M8 11V7a4 4 0 0 1 8 0v4',
  arrowUp:    'M12 19V5 M5 12l7-7 7 7',
  arrowDown:  'M12 5v14 M19 12l-7 7-7-7',
  arrowRight: 'M5 12h14 M12 5l7 7-7 7',
  arrowLeft:  'M19 12H5 M12 19l-7-7 7-7',
  plus:       'M12 5v14 M5 12h14',
  check:      'M5 12l5 5L20 7',
  x:          'M18 6L6 18 M6 6l12 12',
  more:       'M5 12h.01 M12 12h.01 M19 12h.01',
  filter:     'M3 4h18l-7 9v7l-4-2v-5z',
  download:   'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M7 10l5 5 5-5 M12 15V3',
  upload:     'M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4 M17 8l-5-5-5 5 M12 3v12',
  star:       'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z',
  alert:      'M12 9v4 M12 17h.01 M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z',
  msg:        'M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z',
  clock:      'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M12 6v6l4 2',
  pin:        'M12 22s-8-7.5-8-13a8 8 0 0 1 16 0c0 5.5-8 13-8 13z M12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  zap:        'M13 2L3 14h9l-1 8 10-12h-9z',
  logout:     'M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9',
  refresh:    'M21 12a9 9 0 1 1-3.51-7.13 M21 3v6h-6',
  layers:     'M12 2L2 7l10 5 10-5-10-5z M2 17l10 5 10-5 M2 12l10 5 10-5',
  help:       'M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3 M12 17h.01',
  chevDown:   'M6 9l6 6 6-6',
  chevRight:  'M9 18l6-6-6-6',
  grid:       'M3 3h7v7H3z M14 3h7v7h-7z M14 14h7v7h-7z M3 14h7v7H3z',
  list:       'M8 6h13 M8 12h13 M8 18h13 M3 6h.01 M3 12h.01 M3 18h.01',
};

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  stroke?: number;
}

export function Icon({ name, size = 16, color = 'currentColor', stroke = 1.6 }: IconProps) {
  const d = ICONS[name];
  if (!d) return null;
  const paths = d.split(/\s+M\s/).map((p, i) => (i === 0 ? p : 'M ' + p));
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={stroke}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ flexShrink: 0, display: 'block' }}
      aria-hidden="true"
    >
      {paths.map((p, i) => <path key={i} d={p} />)}
    </svg>
  );
}
