import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { ProfileList } from "../profile/ProfileList";
import { AddProfileModal } from "../profile/AddProfileModal";
import { useProfiles } from "@/hooks/use-profiles";

export function MainContent() {
  const [isAddProfileModalOpen, setIsAddProfileModalOpen] = useState(false);
  const { profiles, isLoading } = useProfiles();

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 p-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold">WhatsApp Profiles</h2>
        
        <div className="flex items-center">
          <Button 
            onClick={() => setIsAddProfileModalOpen(true)}
            className="flex items-center px-4 py-2 bg-whatsapp-green text-white rounded-md hover:bg-whatsapp-dark-green transition-colors focus:outline-none focus:ring-2 focus:ring-whatsapp-green focus:ring-opacity-50"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            <span>Add Profile</span>
          </Button>
        </div>
      </header>

      {/* Profiles Content */}
      <ProfileList profiles={profiles} isLoading={isLoading} onAddProfile={() => setIsAddProfileModalOpen(true)} />

      {/* Add Profile Modal */}
      <AddProfileModal 
        open={isAddProfileModalOpen} 
        onClose={() => setIsAddProfileModalOpen(false)}
      />
    </div>
  );
}
