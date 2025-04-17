import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ArrowLeft, XIcon, InfoIcon, CheckCircle } from "lucide-react";
import { useProfiles } from "@/hooks/use-profiles";
import { useWebSocket } from "@/hooks/use-websocket";
import { useToast } from "@/hooks/use-toast";

interface AddProfileModalProps {
  open: boolean;
  onClose: () => void;
}

export function AddProfileModal({ open, onClose }: AddProfileModalProps) {
  const [step, setStep] = useState(1);
  const [profileLabel, setProfileLabel] = useState("");
  const [profileId, setProfileId] = useState<number | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const { createProfile, connectProfile } = useProfiles();
  const { socket, sessionUpdates } = useWebSocket();
  const { toast } = useToast();

  // Reset state when modal opens
  useEffect(() => {
    if (open) {
      setStep(1);
      setProfileLabel("");
      setProfileId(null);
      setQrCode(null);
    }
  }, [open]);

  // Listen for session updates
  useEffect(() => {
    if (profileId && sessionUpdates[profileId]) {
      const status = sessionUpdates[profileId].status;
      
      if (status === 'qr_ready') {
        setQrCode(sessionUpdates[profileId].qrCode || null);
      } else if (status === 'connected' || status === 'authenticated') {
        // Move to step 3 when connected
        setStep(3);
      }
    }
  }, [sessionUpdates, profileId]);

  const handleContinue = async () => {
    if (!profileLabel.trim()) {
      toast({
        title: "Profile label required",
        description: "Please enter a profile label.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Create the profile
      const profile = await createProfile.mutateAsync({ label: profileLabel });
      setProfileId(profile.id);
      
      // Move to step 2
      setStep(2);
      
      // Start connection
      await connectProfile.mutateAsync(profile.id);
    } catch (error) {
      toast({
        title: "Failed to create profile",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const handleGoBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onClose();
    }
  };

  const handleFinish = () => {
    toast({
      title: "Profile Added",
      description: `${profileLabel} profile has been successfully added.`,
    });
    onClose();
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Add New WhatsApp Profile</DialogTitle>
              <DialogDescription>
                Create a new WhatsApp profile for sending messages.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="mb-4">
                <Label htmlFor="profileLabel">Profile Label</Label>
                <Input
                  id="profileLabel"
                  placeholder="e.g. Work, Personal, Business"
                  value={profileLabel}
                  onChange={(e) => setProfileLabel(e.target.value)}
                  className="mt-1"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Choose a unique name for this WhatsApp profile
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleContinue}>
                Continue
              </Button>
            </DialogFooter>
          </>
        );
        
      case 2:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Scan QR Code</DialogTitle>
              <DialogDescription>
                Scan this QR code with your WhatsApp mobile app
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="flex flex-col items-center">
                {qrCode ? (
                  <div className="bg-white p-3 border border-gray-200 rounded-lg mb-4">
                    <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrCode)}`} 
                      alt="QR Code" 
                      className="w-48 h-48" 
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center w-48 h-48 border border-gray-200 rounded-lg mb-4">
                    <Loader2 className="h-10 w-10 animate-spin text-whatsapp-green" />
                  </div>
                )}
                
                <div className="text-center text-sm text-gray-500 mb-4">
                  <div className="flex items-center justify-center mb-2">
                    <Loader2 className="animate-spin mr-2 h-4 w-4 text-whatsapp-green" />
                    <span>Waiting for connection...</span>
                  </div>
                  <p>Open WhatsApp on your phone, tap Menu or Settings and select WhatsApp Web</p>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={handleGoBack}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <Button disabled={true} variant="outline">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Connecting...
              </Button>
            </DialogFooter>
          </>
        );
        
      case 3:
        return (
          <>
            <DialogHeader>
              <DialogTitle>Connection Successful!</DialogTitle>
              <DialogDescription>
                Your WhatsApp profile has been successfully connected.
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="text-center mb-6">
                <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-green-100 text-whatsapp-green mb-4">
                  <CheckCircle className="h-10 w-10" />
                </div>
                <h4 className="text-lg font-medium text-gray-800 mb-2">Connection Successful!</h4>
                <p className="text-gray-600">Your WhatsApp profile has been successfully connected.</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex items-start">
                  <InfoIcon className="h-5 w-5 text-whatsapp-blue mr-3 mt-0.5" />
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">Keep your phone connected to the internet to maintain this connection.</p>
                    <p>You can now send and receive messages through this profile.</p>
                  </div>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button onClick={handleFinish}>
                Done
              </Button>
            </DialogFooter>
          </>
        );
        
      default:
        return null;
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        {renderStepContent()}
      </DialogContent>
    </Dialog>
  );
}
