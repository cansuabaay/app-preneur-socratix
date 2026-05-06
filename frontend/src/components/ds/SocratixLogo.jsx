import socratixLogoPng from "../../assets/socratix-logo.png";

export default function SocratixLogo({ size = 48, className = "", alt = "Socratix" }) {
  return (
    <img
      className={className}
      src={socratixLogoPng}
      alt={alt}
      width={size}
      height={size}
      style={{
        display: "block",
        borderRadius: "14px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.35)",
      }}
    />
  );
}
