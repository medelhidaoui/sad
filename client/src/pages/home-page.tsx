import { useEffect } from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { MainContent } from "@/components/layout/MainContent";
import { useWebSocket } from "@/hooks/use-websocket";
import { useProfiles } from "@/hooks/use-profiles";

export default function HomePage() {
  const { isConnected } = useWebSocket();
  const { initializeAllProfiles } = useProfiles();

  // Initialize all profiles when the component mounts
  useEffect(() => {
    if (isConnected) {
      initializeAllProfiles.mutate();
    }
  }, [isConnected, initializeAllProfiles]);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <MainContent />
    </div>
  );
}
