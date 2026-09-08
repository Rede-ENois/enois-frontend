import { useEffect, useRef } from "react";

export function useConversationScrollAnchor(messageCount: number) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messageCount]);

  return messagesEndRef;
}
