"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface Channel {
  id: string;
  name: string;
  handle: string;
  avatar_url: string | null;
}

interface ActiveChannelContextType {
  activeChannel: Channel | null;
  setActiveChannel: (channel: Channel | null) => void;
}

const ActiveChannelContext = createContext<ActiveChannelContextType | undefined>(undefined);

export const ActiveChannelProvider = ({ children }: { children: ReactNode }) => {
  const [activeChannel, setActiveChannel] = useState<Channel | null>(null);

  return (
    <ActiveChannelContext.Provider value={{ activeChannel, setActiveChannel }}>
      {children}
    </ActiveChannelContext.Provider>
  );
};

export const useActiveChannel = () => {
  const context = useContext(ActiveChannelContext);
  if (!context) {
    throw new Error("useActiveChannel must be used within ActiveChannelProvider");
  }
  return context;
};
