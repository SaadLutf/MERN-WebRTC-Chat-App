// TypingIndicator.jsx
import React from "react";

const TypingIndicator = () => {
  return (
    <div className="flex items-center gap-1 bg-gray-200 text-gray-600 px-3 py-1 rounded-full w-fit">
      <span className="w-2 h-2 bg-gray-600 rounded-full animate-typingDot"></span>
      <span className="w-2 h-2 bg-gray-600 rounded-full animate-typingDot animation-delay-200"></span>
      <span className="w-2 h-2 bg-gray-600 rounded-full animate-typingDot animation-delay-400"></span>
    </div>
  );
};

export default TypingIndicator;
