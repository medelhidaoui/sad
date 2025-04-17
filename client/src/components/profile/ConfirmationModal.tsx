import {
  Dialog,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";

interface ConfirmationModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  message: string;
  confirmText: string;
  confirmVariant?: "default" | "destructive";
  onConfirm: () => void;
}

export function ConfirmationModal({ 
  open, 
  onClose, 
  title, 
  message, 
  confirmText, 
  confirmVariant = "default",
  onConfirm 
}: ConfirmationModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="sm:max-w-md">
        <div className="p-4">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-red-100 text-red-600 mb-4">
              <AlertTriangle className="h-10 w-10" />
            </div>
            <h4 className="text-lg font-medium text-gray-800 mb-2">{title}</h4>
            <p className="text-gray-600">{message}</p>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant={confirmVariant} onClick={onConfirm}>
              {confirmText}
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
