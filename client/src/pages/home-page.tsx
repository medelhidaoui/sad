import { useEffect, useRef } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MainContent } from "@/components/layout/MainContent";
import { useWebSocket } from "@/hooks/use-websocket";
import { useProfiles } from "@/hooks/use-profiles";

export default function HomePage() {
  const { isConnected } = useWebSocket();
  const { initializeAllProfiles } = useProfiles();
  const initializedRef = useRef(false);

  // Initialize all profiles only once when connected
  useEffect(() => {
    if (isConnected && !initializedRef.current) {
      initializedRef.current = true;
      initializeAllProfiles.mutate();
    }
  }, [isConnected]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MainContent />
    </div>
  );
}
