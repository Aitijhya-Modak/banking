interface LogoProps {
  size?: number;
  className?: string;
  showText?: boolean;
}

export function Logo({
  size = 32,
  className = "",
  showText = true,
}: LogoProps) {
  return (
    <div className={`flex items-center gap-2.5 select-none ${className}`}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 40 40"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
      >
        {/* Rounded Container Box */}
        <rect width="40" height="40" rx="10" className="fill-sky-500" />

        {/* Shield / Vault Icon */}
        <path
          d="M20 10L11 14V20C11 25.5 14.8 30.7 20 32C25.2 30.7 29 25.5 29 20V14L20 10Z"
          fill="#020617"
        />
        {/* Inner Lock Keyhole cutout */}
        <circle cx="20" cy="19" r="2.5" fill="#0ea5e9" />
        <path d="M19 20.5H21V25H19V20.5Z" fill="#0ea5e9" />
      </svg>

      {showText && (
        <span className="text-xl font-bold tracking-tight text-red-500 font-sans">
          AM<span className="text-sky-700">Bank</span>
        </span>
      )}
    </div>
  );
}
export default Logo;
