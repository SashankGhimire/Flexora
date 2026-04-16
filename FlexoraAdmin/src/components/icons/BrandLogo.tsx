interface BrandLogoProps {
  className?: string;
}

export const BrandLogo = ({ className = 'h-11 w-11' }: BrandLogoProps) => {
  return (
    <div
      className={`inline-flex items-center justify-center rounded-2xl bg-gradient-to-br from-brand-primary via-cyan-500 to-blue-600 text-white shadow-[0_16px_40px_rgba(15,76,117,0.28)] ${className}`}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 48 48"
        className="h-7 w-7"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M14 12v24h20" />
        <path d="M18 24h10" />
        <path d="M18 18h12" />
        <path d="M18 30h8" />
      </svg>
    </div>
  );
};