import { useEffect, useState } from "react";

interface TypingIndicatorProps {
  typingUsers: { id: string; name: string }[];
}

export function TypingIndicator({ typingUsers }: TypingIndicatorProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typingUsers.length > 0) {
      setVisible(true);
    } else {
      // Delay hiding to prevent flickering
      const timeout = setTimeout(() => setVisible(false), 500);
      return () => clearTimeout(timeout);
    }
  }, [typingUsers]);

  if (!visible || typingUsers.length === 0) {
    return null;
  }

  const names = typingUsers.map(u => u.name).join(", ");
  const text = typingUsers.length === 1
    ? `${names} is typing...`
    : `${names} are typing...`;

  return (
    <div className="flex items-center gap-2 text-sm text-gray-500 italic p-2">
      <div className="flex gap-1">
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
        <div className="w-1 h-1 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
      </div>
      <span>{text}</span>
    </div>
  );
}