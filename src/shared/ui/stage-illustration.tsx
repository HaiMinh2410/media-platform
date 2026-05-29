import React from "react";

interface StageIllustrationProps {
  variant: "add-stage" | "qualified" | "converted";
  size?: number;
  className?: string;
}

export function StageIllustration({
  variant,
  size = 56,
  className,
}: StageIllustrationProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {variant === "add-stage" ? (
        <>
          {/* Khung block 1 */}
          <rect
            x="12"
            y="10"
            width="40"
            height="12"
            rx="4"
            className="fill-primary/5 stroke-current"
            strokeWidth="1.5"
          />
          <circle cx="18" cy="16" r="2" className="fill-primary/60" />
          <rect
            x="24"
            y="14"
            width="16"
            height="4"
            rx="1"
            className="fill-primary/20"
          />

          {/* Khung block 2 */}
          <rect
            x="12"
            y="26"
            width="40"
            height="12"
            rx="4"
            className="fill-base-content/5 stroke-current"
            strokeWidth="1.5"
          />
          <circle cx="18" cy="32" r="2" className="fill-base-content/40" />
          <rect
            x="24"
            y="30"
            width="16"
            height="4"
            rx="1"
            className="fill-base-content/20"
          />

          {/* Khung block 3 */}
          <rect
            x="12"
            y="42"
            width="40"
            height="12"
            rx="4"
            className="fill-primary/5 stroke-current"
            strokeWidth="1.5"
          />
          <circle cx="18" cy="48" r="2" className="fill-primary/60" />
          <rect
            x="24"
            y="46"
            width="16"
            height="4"
            rx="1"
            className="fill-primary/20"
          />

          {/* Trỏ chuột click */}
          <path
            d="M46 36 L52 48 L48 50 L42 42 L38 46 L38 34 L46 36 Z"
            className="fill-base-content/70 stroke-base-100"
            strokeWidth="1"
            strokeLinejoin="round"
          />
        </>
      ) : variant === "qualified" ? (
        <>
          {/* Block 1 */}
          <rect
            x="12"
            y="10"
            width="40"
            height="10"
            rx="3"
            className="fill-primary/5 stroke-primary/30"
            strokeWidth="1.2"
          />
          <circle cx="18" cy="15" r="1.5" className="fill-primary/40" />

          {/* Block 2 (Highlight) */}
          <rect
            x="8"
            y="26"
            width="48"
            height="14"
            rx="4"
            className="fill-primary/10 stroke-primary"
            strokeWidth="1.5"
          />
          <circle cx="14" cy="33" r="2" className="fill-primary" />

          {/* Block 3 */}
          <rect
            x="12"
            y="46"
            width="40"
            height="10"
            rx="3"
            className="fill-primary/5 stroke-primary/30"
            strokeWidth="1.2"
          />
          <circle cx="18" cy="51" r="1.5" className="fill-primary/40" />
        </>
      ) : (
        <>
          {/* Block 1 */}
          <rect
            x="12"
            y="10"
            width="40"
            height="10"
            rx="3"
            className="fill-primary/5 stroke-primary/30"
            strokeWidth="1.2"
          />
          <circle cx="18" cy="15" r="1.5" className="fill-primary/40" />

          {/* Block 2 (Highlight + Check) */}
          <rect
            x="8"
            y="26"
            width="48"
            height="14"
            rx="4"
            className="fill-primary/10 stroke-primary"
            strokeWidth="1.5"
          />
          <circle cx="14" cy="33" r="2" className="fill-primary" />
          <circle cx="48" cy="33" r="6" className="fill-primary" />
          <path
            d="M46 33 L47.5 34.5 L50 31.5"
            className="stroke-base-100"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />

          {/* Block 3 */}
          <rect
            x="12"
            y="46"
            width="40"
            height="10"
            rx="3"
            className="fill-primary/5 stroke-primary/30"
            strokeWidth="1.2"
          />
          <circle cx="18" cy="51" r="1.5" className="fill-primary/40" />
        </>
      )}
    </svg>
  );
}
