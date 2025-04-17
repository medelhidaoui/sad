import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  Settings, 
  HelpCircle,
  LogOut
} from "lucide-react";
import { useState } from "react";
import { SettingsModal } from "../profile/SettingsModal";

export function Sidebar() {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <div className="w-64 bg-white border-r border-gray-200 flex flex-col h-full">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center">
          <img 
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/512px-WhatsApp.svg.png" 
            alt="WhatsApp Logo" 
            className="w-8 h-8 mr-2"
          />
          <h1 className="text-lg font-semibold">WhatsApp Manager</h1>
        </div>
      </div>
      
      <nav className="flex-1 overflow-y-auto p-2">
        <Link href="/">
          <a className={`flex items-center p-3 mb-2 rounded-md hover:bg-whatsapp-light transition-colors 
            ${location === '/' ? 'text-whatsapp-dark-green bg-whatsapp-light font-medium' : ''}`}>
            <Users className="mr-3 h-5 w-5" />
            <span>Profiles</span>
          </a>
        </Link>
        
        <button 
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center p-3 mb-2 rounded-md hover:bg-whatsapp-light transition-colors w-full text-left"
        >
          <Settings className="mr-3 h-5 w-5" />
          <span>Settings</span>
        </button>
        
        <a 
          href="https://github.com/user/whatsapp-manager" 
          target="_blank" 
          rel="noopener noreferrer"
          className="flex items-center p-3 mb-2 rounded-md hover:bg-whatsapp-light transition-colors"
        >
          <HelpCircle className="mr-3 h-5 w-5" />
          <span>Help</span>
        </a>
      </nav>
      
      <div className="p-4 border-t border-gray-200">
        {user && (
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-500">
              Logged in as: <span className="font-medium">{user.username}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleLogout}
              className="text-gray-500 hover:text-red-500"
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        )}
        <div className="flex items-center text-sm text-gray-500 mt-2">
          <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
          <span>Server running on port 85</span>
        </div>
      </div>

      {isSettingsOpen && (
        <SettingsModal open={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} />
      )}
    </div>
  );
}
