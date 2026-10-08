type IconName =
  | "home"
  | "car"
  | "bag"
  | "build"
  | "garage"
  | "search"
  | "menu"
  | "close"
  | "arrow"
  | "chevron"
  | "check"
  | "shield"
  | "whatsapp"
  | "phone"
  | "star"
  | "spark"
  | "speaker"
  | "wheel"
  | "wrench"
  | "map"
  | "plus"
  | "minus"
  | "play"
  | "instagram"
  | "youtube"
  | "facebook"
  | "filter";

const PATHS: Record<IconName, React.ReactNode> = {
  home: <path d="M3 10.2 12 3l9 7.2V21H3z" />,
  car: (
    <>
      <path d="M3 13.5 5 8h14l2 5.5V19h-3v-2H6v2H3z" />
      <circle cx="7.5" cy="15.5" r="1.2" />
      <circle cx="16.5" cy="15.5" r="1.2" />
    </>
  ),
  bag: (
    <>
      <path d="M4 7h16l-1.2 13H5.2z" />
      <path d="M9 9V6a3 3 0 0 1 6 0v3" />
    </>
  ),
  build: (
    <>
      <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1" />
      <circle cx="12" cy="12" r="3.4" />
    </>
  ),
  garage: (
    <>
      <path d="M3 21V9l9-5 9 5v12" />
      <path d="M7 21v-7h10v7M7 17h10" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4.5 4.5" />
    </>
  ),
  menu: <path d="M3 7h18M3 12h18M3 17h18" />,
  close: <path d="M5 5l14 14M19 5 5 19" />,
  arrow: <path d="M4 12h15m-5-6 6 6-6 6" />,
  chevron: <path d="m9 5 7 7-7 7" />,
  check: <path d="m4.5 12.5 5 5 10-11" />,
  shield: (
    <>
      <path d="M12 3 4.5 6v6c0 4.5 3 7.8 7.5 9 4.5-1.2 7.5-4.5 7.5-9V6z" />
      <path d="m9 12 2 2 4-4.5" />
    </>
  ),
  whatsapp: (
    <path d="M3.5 20.5 5 16.4A8.2 8.2 0 1 1 8 19.2zM8.6 8.2c-.2.4-.5.5-.8.7-.5.4-.5 1.4.2 2.5.9 1.5 2.2 2.5 3.6 3 1 .4 1.8.2 2.2-.3.3-.3.5-.8.4-1l-1.6-.8c-.2-.1-.4 0-.6.2l-.4.5c-.9-.4-1.7-1.1-2.2-2l.5-.5c.2-.2.2-.4.1-.6l-.7-1.6c-.1-.3-.5-.3-.7-.1z" />
  ),
  phone: (
    <path d="M5 3.5h3l1.5 4-2 1.4a12 12 0 0 0 5.6 5.6l1.4-2 4 1.5v3c0 .9-.7 1.6-1.6 1.5C9.4 18.7 5.3 14.6 3.6 5.1 3.4 4.2 4.1 3.5 5 3.5z" />
  ),
  star: <path d="m12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.9-5.2-2.8-5.2 2.8 1-5.9L3.5 9.7l5.9-.8z" />,
  spark: <path d="M12 2.5 14 9l6.5 2-6.5 2-2 6.5-2-6.5L3.5 11 10 9z" />,
  speaker: (
    <>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <circle cx="12" cy="14.5" r="4" />
      <circle cx="12" cy="7" r="1.6" />
    </>
  ),
  wheel: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="3" />
      <path d="M12 3.5v5M12 15.5v5M3.5 12h5M15.5 12h5" />
    </>
  ),
  wrench: (
    <path d="M20 5.5a5 5 0 0 1-6.6 6.3L6 19.2 4.8 18l7.4-7.4A5 5 0 0 1 18.5 4L16 6.5l1.5 1.5z" />
  ),
  map: (
    <>
      <path d="M12 21s7-6.3 7-11a7 7 0 1 0-14 0c0 4.7 7 11 7 11z" />
      <circle cx="12" cy="10" r="2.5" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  minus: <path d="M5 12h14" />,
  play: <path d="M8 5.5v13l11-6.5z" />,
  instagram: (
    <>
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17" cy="7" r="1" />
    </>
  ),
  youtube: (
    <>
      <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
      <path d="m10 9.5 5 2.5-5 2.5z" />
    </>
  ),
  facebook: <path d="M14 8.5h2.5V5.5H14c-2 0-3.5 1.5-3.5 3.5v2H8v3h2.5v6.5h3V14H16l.5-3h-3V9.5c0-.6.4-1 1-1z" />,
  filter: <path d="M3 6h18M6.5 12h11M10 18h4" />,
};

export function Icon({
  name,
  className = "",
  size = 20,
  filled = false,
}: {
  name: IconName;
  className?: string;
  size?: number;
  filled?: boolean;
}) {
  const solid = filled || name === "whatsapp" || name === "star" || name === "phone" ||
    name === "play" || name === "spark" || name === "facebook" || name === "wrench";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={solid ? "currentColor" : "none"}
      stroke={solid ? "none" : "currentColor"}
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={className}
    >
      {PATHS[name]}
    </svg>
  );
}

export type { IconName };
