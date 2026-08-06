const S = { fill: 'none',        stroke: 'currentColor' }
const F = { fill: 'currentColor', stroke: 'none'          }

const paths = {
  chevronDown: <polyline points="6 9 12 15 18 9"  {...S} />,
  chevronUp:   <polyline points="18 15 12 9 6 15" {...S} />,
  close:       <><line x1="18" y1="6" x2="6" y2="18" {...S} /><line x1="6" y1="6" x2="18" y2="18" {...S} /></>,
  eye:         <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" {...S} /><circle cx="12" cy="12" r="3" {...S} /></>,
  pencil:      <><path d="M12 20h9" {...S} /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4 9.5-9.5z" {...S} /></>,
  leave:       <><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...S} /><polyline points="16 17 21 12 16 7" {...S} /><line x1="21" y1="12" x2="9" y2="12" {...S} /></>,
  qrcode: <>
    <rect x="3"  y="3"  width="7" height="7" rx="1" {...S} />
    <rect x="5"  y="5"  width="3" height="3"        {...F} />
    <rect x="14" y="3"  width="7" height="7" rx="1" {...S} />
    <rect x="16" y="5"  width="3" height="3"        {...F} />
    <rect x="3"  y="14" width="7" height="7" rx="1" {...S} />
    <rect x="5"  y="16" width="3" height="3"        {...F} />
    <rect x="14" y="14" width="3" height="3"        {...F} />
    <rect x="19" y="14" width="2" height="2"        {...F} />
    <rect x="14" y="19" width="2" height="2"        {...F} />
    <rect x="17" y="17" width="2" height="4"        {...F} />
  </>,
  'more-vertical': <>
    <line x1="3" y1="6"  x2="21" y2="6"  {...S} />
    <line x1="3" y1="12" x2="21" y2="12" {...S} />
    <line x1="3" y1="18" x2="21" y2="18" {...S} />
  </>,
  swap: <>
    <polyline points="7 8 3 12 7 16" {...S} />
    <polyline points="17 8 21 12 17 16" {...S} />
    <line x1="3" y1="12" x2="21" y2="12" {...S} />
  </>,
  reset: <>
    <polyline points="23 4 23 10 17 10" {...S} />
    <polyline points="1 20 1 14 7 14" {...S} />
    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" {...S} />
  </>,
}

const Icon = ({ name, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    {paths[name]}
  </svg>
)

export default Icon
