import "./ExcalidrawLogo.scss";

const LogoIcon = () => (
  <svg
    viewBox="186 144 1206 1206"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="ExcalidrawLogo-icon"
  >
    <path
      d="M1178.23 147H399.773C283.366 147 189 238.682 189 351.778V1142.22C189 1255.32 283.366 1347 399.773 1347H1178.23C1294.63 1347 1389 1255.32 1389 1142.22V351.778C1389 238.682 1294.63 147 1178.23 147Z"
      fill="#0B0F16"
      stroke="#151925"
      strokeWidth="5"
    />
    <path
      d="M1183 338H699.14C514.813 338 395 456.3 395 620.1C395 783.9 514.813 884 689.924 884H892.684"
      stroke="#2563EB"
      strokeWidth="96"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M678.876 624H884.441C1065.53 624 1183 732.203 1183 885.492C1183 1056.81 1060.64 1156 874.652 1156H395"
      stroke="#2563EB"
      strokeWidth="96"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <circle cx="1183" cy="338" r="65" fill="#3B82F6" />
    <circle cx="687" cy="624" r="65" fill="#3B82F6" />
    <circle cx="887" cy="884" r="65" fill="#2563EB" />
    <circle cx="395" cy="1156" r="65" fill="#1D4ED8" />
  </svg>
);

const LogoText = () => (
  <span
    className="ExcalidrawLogo-text"
    style={{
      fontFamily: "'Outfit', sans-serif",
      fontWeight: 800,
      fontSize: "1.4rem",
      letterSpacing: "-0.02em",
      color: "var(--text-primary-color, currentColor)",
      lineHeight: 1,
      display: "inline-flex",
      alignItems: "center",
    }}
  >
    Sketion
  </span>
);

type LogoSize = "xs" | "small" | "normal" | "large" | "custom" | "mobile";

interface LogoProps {
  size?: LogoSize;
  withText?: boolean;
  style?: React.CSSProperties;
  /**
   * If true, the logo will not be wrapped in a Link component.
   * The link prop will be ignored as well.
   * It will merely be a plain div.
   */
  isNotLink?: boolean;
}

export const ExcalidrawLogo = ({
  style,
  size = "small",
  withText,
}: LogoProps) => {
  return (
    <div className={`ExcalidrawLogo is-${size}`} style={style}>
      <LogoIcon />
      {withText && <LogoText />}
    </div>
  );
};
