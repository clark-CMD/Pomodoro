
import React from 'react';

interface IconProps {
  className?: string;
}

const SkipIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="currentColor"
    className={className || "w-6 h-6"}
  >
    <path
      fillRule="evenodd"
      d="M3.75 5.25a.75.75 0 0 1 .75-.75h.75a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75h-.75a.75.75 0 0 1-.75-.75V5.25Zm6.75-.75A.75.75 0 0 1 11.25 4.5l10.5 7.5a.75.75 0 0 1 0 1.5l-10.5 7.5a.75.75 0 0 1-1.5-.75V5.25Z"
      clipRule="evenodd"
    />
  </svg>
);

export default SkipIcon;
    