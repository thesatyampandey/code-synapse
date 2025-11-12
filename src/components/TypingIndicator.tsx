import { useEffect, useState } from "react";

interface TypingIndicatorProps {
  typingUsers: string[];
}

export const TypingIndicator = ({ typingUsers }: TypingIndicatorProps) => {
  if (typingUsers.length === 0) return null;

  const message =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : typingUsers.length === 2
      ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
      : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;

  return (
    <div className="px-4 py-2 text-sm text-muted-foreground italic animate-pulse">
      {message}
    </div>
  );
};

export const useTypingIndicator = (
  roomId: string,
  channel: any,
  currentUserEmail: string
) => {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!channel) return;

    const typingChannel = channel
      .on("broadcast", { event: "typing" }, ({ payload }: any) => {
        if (payload.email !== currentUserEmail) {
          setTypingUsers((prev) => {
            if (!prev.includes(payload.email)) {
              return [...prev, payload.email];
            }
            return prev;
          });

          // Remove user after 3 seconds
          setTimeout(() => {
            setTypingUsers((prev) => prev.filter((u) => u !== payload.email));
          }, 3000);
        }
      })
      .on("broadcast", { event: "stop-typing" }, ({ payload }: any) => {
        setTypingUsers((prev) => prev.filter((u) => u !== payload.email));
      });

    return () => {
      if (typingTimeout) clearTimeout(typingTimeout);
    };
  }, [channel, currentUserEmail]);

  const handleTyping = () => {
    if (!channel || !currentUserEmail) return;

    if (!isTyping) {
      setIsTyping(true);
      channel.send({
        type: "broadcast",
        event: "typing",
        payload: { email: currentUserEmail },
      });
    }

    if (typingTimeout) clearTimeout(typingTimeout);

    const timeout = setTimeout(() => {
      setIsTyping(false);
      channel.send({
        type: "broadcast",
        event: "stop-typing",
        payload: { email: currentUserEmail },
      });
    }, 2000);

    setTypingTimeout(timeout);
  };

  return { typingUsers, handleTyping };
};
