const paths = {
  chevronDown: <polyline points="6 9 12 15 18 9" />,
  chevronUp:   <polyline points="18 15 12 9 6 15" />,
  close:       <><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></>,
}

const Icon = ({ name, size = 20 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24"
       fill="none" stroke="currentColor" strokeWidth="2"
       strokeLinecap="round" strokeLinejoin="round">
    {paths[name]}
  </svg>
)

export default Icon
