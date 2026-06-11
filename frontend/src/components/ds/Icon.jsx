function Svg({ size, className, children }) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      {children}
    </svg>
  );
}

const W = 1.75;

export default function Icon({ name, size = 20, className = "" }) {
  const p = { stroke: "currentColor", strokeWidth: W, strokeLinecap: "round", strokeLinejoin: "round" };

  switch (name) {
    case "sparkles":
      return (
        <Svg size={size} className={className}>
          <path fill="currentColor" d="M9.813 15.904 9 18.75l-.813-2.846a4.5 4.5 0 0 0-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 0 0 3.09-3.09L9 5.25l.813 2.847a4.5 4.5 0 0 0 3.09 3.09L15.75 12l-2.847.813a4.5 4.5 0 0 0-3.09 3.09ZM18.259 8.715 18 9.75l-.259-1.035a3.375 3.375 0 0 0-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 0 0 2.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 0 0 2.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 0 0-2.456 2.456Z" />
        </Svg>
      );

    case "chevronRight":
      return (
        <Svg size={size} className={className}>
          <path d="m9 6 6 6-6 6" {...p} />
        </Svg>
      );

    case "plus":
      return (
        <Svg size={size} className={className}>
          <path d="M12 5v14M5 12h14" {...p} />
        </Svg>
      );

    case "vote":
      return (
        <Svg size={size} className={className}>
          <path d="M12 3.5 14.3 8.6l5.7.8-4.1 4 1 5.6L12 16.3 7.1 19l1-5.6L4 9.4l5.7-.8Z" {...p} />
        </Svg>
      );

    case "comment":
      return (
        <Svg size={size} className={className}>
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" {...p} />
        </Svg>
      );

    case "building":
      return (
        <Svg size={size} className={className}>
          <path d="M3 21h18M3 9h18M3 3h18M9 21V9m6 12V9M6 21V9m12 12V9" {...p} />
        </Svg>
      );

    case "dashboard":
      return (
        <Svg size={size} className={className}>
          <rect x="3" y="3" width="7" height="7" rx="1" {...p} />
          <rect x="14" y="3" width="7" height="7" rx="1" {...p} />
          <rect x="3" y="14" width="7" height="7" rx="1" {...p} />
          <rect x="14" y="14" width="7" height="7" rx="1" {...p} />
        </Svg>
      );

    case "user":
      return (
        <Svg size={size} className={className}>
          <circle cx="12" cy="8" r="4" {...p} />
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" {...p} />
        </Svg>
      );

    case "users":
      return (
        <Svg size={size} className={className}>
          <circle cx="9" cy="8" r="3.5" {...p} />
          <path d="M2 20c0-3.5 2.8-6 7-6" {...p} />
          <circle cx="17" cy="9" r="2.75" {...p} />
          <path d="M14 20c0-2.8 2-4.5 5.5-4.5" {...p} />
        </Svg>
      );

    case "mail":
      return (
        <Svg size={size} className={className}>
          <rect x="2" y="4" width="20" height="16" rx="2" {...p} />
          <path d="m2 7 10 7 10-7" {...p} />
        </Svg>
      );

    case "lock":
      return (
        <Svg size={size} className={className}>
          <rect x="5" y="11" width="14" height="10" rx="2" {...p} />
          <path d="M8 11V7a4 4 0 0 1 8 0v4" {...p} />
        </Svg>
      );

    case "eye":
      return (
        <Svg size={size} className={className}>
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" {...p} />
          <circle cx="12" cy="12" r="3" {...p} />
        </Svg>
      );

    case "eyeOff":
      return (
        <Svg size={size} className={className}>
          <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" {...p} />
          <line x1="1" y1="1" x2="23" y2="23" {...p} />
        </Svg>
      );

    case "send":
      return (
        <Svg size={size} className={className}>
          <line x1="22" y1="2" x2="11" y2="13" {...p} />
          <polygon points="22 2 15 22 11 13 2 9 22 2" {...p} />
        </Svg>
      );

    case "settings":
      return (
        <Svg size={size} className={className}>
          <circle cx="12" cy="12" r="3" {...p} />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" {...p} />
        </Svg>
      );

    case "logout":
      return (
        <Svg size={size} className={className}>
          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" {...p} />
          <polyline points="16 17 21 12 16 7" {...p} />
          <line x1="21" y1="12" x2="9" y2="12" {...p} />
        </Svg>
      );

    default:
      return null;
  }
}
