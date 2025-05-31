
import React from 'react';

interface IconProps {
  className?: string;
}

const SettingsIcon: React.FC<IconProps> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    strokeWidth={1.5}
    stroke="currentColor"
    className={className || "w-6 h-6"}
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M9.594 3.94c.09-.542.56-1.003 1.11-.952l2.176.412c.566.107 1.01.597 1.031 1.178l.09 2.824c.022.67-.433 1.27-.98 1.48l-2.046.768c-.61.23-1.28-.214-1.389-.836l-.387-2.207a1.25 1.25 0 0 1 .952-1.186ZM21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Zm-9 4.5a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Z"
    />
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      d="M19.5 12h.01M12 4.5v.01M4.5 12h.01M12 19.5v.01" 
      strokeWidth="1"
    />
 </svg>
);

export default SettingsIcon;
    