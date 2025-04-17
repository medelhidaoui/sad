import { ProfileCard } from "./ProfileCard";
import { Button } from "@/components/ui/button";
import { PlusIcon, Loader2 } from "lucide-react";

type Profile = {
  id: number;
  label: string;
  phone?: string;
  lastActive?: string;
  status: string;
  sessionStatus?: string;
};

interface ProfileListProps {
  profiles: Profile[];
  isLoading: boolean;
  onAddProfile: () => void;
}

export function ProfileList({ profiles, isLoading, onAddProfile }: ProfileListProps) {
  if (isLoading) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-12 w-12 animate-spin text-whatsapp-green" />
        </div>
      </div>
    );
  }

  if (profiles.length === 0) {
    return (
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-white rounded-lg p-8 text-center shadow-sm">
          <div className="flex justify-center mb-4">
            <img 
              src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/512px-WhatsApp.svg.png" 
              alt="WhatsApp Logo" 
              className="w-16 h-16 opacity-50"
            />
          </div>
          <h3 className="text-lg font-medium text-gray-700 mb-2">No WhatsApp Profiles Added</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first WhatsApp profile.</p>
          <Button 
            onClick={onAddProfile}
            className="px-4 py-2 bg-whatsapp-green text-white rounded-md hover:bg-whatsapp-dark-green transition-colors"
          >
            <PlusIcon className="h-5 w-5 mr-2" />
            Add Your First Profile
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <ProfileCard key={profile.id} profile={profile} />
        ))}
      </div>
    </div>
  );
}
