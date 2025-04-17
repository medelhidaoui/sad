import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  MoreVertical,
  Edit,
  RefreshCw,
  Trash2,
  Send,
  Loader2
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SendTestMessageModal } from "./SendTestMessageModal";
import { ConfirmationModal } from "./ConfirmationModal";
import { useProfiles } from "@/hooks/use-profiles";
import { useToast } from "@/hooks/use-toast";

type Profile = {
  id: number;
  label: string;
  phone?: string;
  lastActive?: string;
  status: string;
  sessionStatus?: string;
};

interface ProfileCardProps {
  profile: Profile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const [isSendMessageModalOpen, setIsSendMessageModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const { deleteProfile, reconnectProfile } = useProfiles();
  const { toast } = useToast();
  
  const getStatusColor = () => {
    const status = profile.sessionStatus || profile.status;
    
    if (status === 'connected' || status === 'authenticated') {
      return 'bg-whatsapp-green';
    } else if (status === 'disconnected' || status === 'error') {
      return 'bg-red-500';
    } else {
      return 'bg-yellow-500';
    }
  };
  
  const getStatusText = () => {
    const status = profile.sessionStatus || profile.status;
    
    if (status === 'connected') {
      return 'Connected';
    } else if (status === 'authenticated') {
      return 'Authenticated';
    } else if (status === 'disconnected') {
      return 'Disconnected';
    } else if (status === 'error') {
      return 'Error';
    } else if (status === 'initializing') {
      return 'Initializing...';
    } else if (status === 'qr_ready') {
      return 'Scan QR Code';
    } else {
      return 'Connecting...';
    }
  };
  
  const handleReconnect = () => {
    reconnectProfile.mutate(profile.id, {
      onSuccess: () => {
        toast({
          title: "Reconnecting profile",
          description: `Reconnecting ${profile.label} profile...`,
        });
      },
      onError: (error) => {
        toast({
          title: "Failed to reconnect",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };
  
  const handleDelete = () => {
    deleteProfile.mutate(profile.id, {
      onSuccess: () => {
        toast({
          title: "Profile deleted",
          description: `${profile.label} profile deleted successfully.`,
        });
        setIsDeleteModalOpen(false);
      },
      onError: (error) => {
        toast({
          title: "Failed to delete profile",
          description: error.message,
          variant: "destructive",
        });
      }
    });
  };
  
  const isConnecting = reconnectProfile.isPending && reconnectProfile.variables === profile.id;
  const isConnected = (profile.sessionStatus === 'connected' || profile.sessionStatus === 'authenticated');
  
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center">
        <div className="flex items-center">
          <div className={`h-9 w-9 rounded-full ${isConnected ? 'bg-whatsapp-green' : 'bg-gray-500'} flex items-center justify-center text-white font-medium mr-3`}>
            <span>{profile.label[0].toUpperCase()}</span>
          </div>
          <div>
            <h3 className="font-medium text-gray-800">{profile.label}</h3>
            <div className="flex items-center text-sm">
              <div className={`h-2 w-2 rounded-full mr-1 ${getStatusColor()}`}></div>
              <span className="text-gray-500">{getStatusText()}</span>
            </div>
          </div>
        </div>
        <div className="relative">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-gray-400 hover:text-gray-600 focus:outline-none">
                <MoreVertical className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => toast({ title: "Edit Profile", description: "This feature is coming soon." })}>
                <Edit className="mr-2 h-4 w-4 text-gray-500" />
                <span>Edit Profile</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleReconnect}>
                <RefreshCw className="mr-2 h-4 w-4 text-gray-500" />
                <span>Reconnect</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => setIsDeleteModalOpen(true)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div className="px-4 py-3">
        <div className="grid grid-cols-2 gap-y-2 text-sm">
          <div className="text-gray-500">Phone:</div>
          <div>{profile.phone || 'Not specified'}</div>
          
          <div className="text-gray-500">Last active:</div>
          <div>{profile.lastActive ? new Date(profile.lastActive).toLocaleString() : 'Never'}</div>
        </div>
      </div>
      
      <div className="px-4 py-3 bg-gray-50 border-t border-gray-100">
        {isConnecting ? (
          <div className="flex items-center justify-center text-whatsapp-dark-green">
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
            <span className="text-sm">Establishing connection...</span>
          </div>
        ) : isConnected ? (
          <Button 
            className="w-full bg-whatsapp-green hover:bg-whatsapp-dark-green text-white"
            size="sm"
            onClick={() => setIsSendMessageModalOpen(true)}
          >
            <Send className="h-4 w-4 mr-2" />
            Send Test Message
          </Button>
        ) : (
          <Button 
            className="w-full bg-whatsapp-blue hover:opacity-90 text-white"
            size="sm"
            onClick={handleReconnect}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Reconnect
          </Button>
        )}
      </div>

      <SendTestMessageModal 
        open={isSendMessageModalOpen} 
        onClose={() => setIsSendMessageModalOpen(false)}
        profileId={profile.id}
        profileLabel={profile.label}
      />

      <ConfirmationModal 
        open={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Profile?"
        message={`Are you sure you want to delete the profile "${profile.label}"? This action cannot be undone.`}
        confirmText="Delete Profile"
        confirmVariant="destructive"
        onConfirm={handleDelete}
      />
    </div>
  );
}
