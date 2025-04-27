
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Loader2 } from 'lucide-react';
import { Textarea } from "@/components/ui/textarea";

interface NewTicketDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedOption: { id: string; label: string } | null;
  onSubmit: () => void;
  supportMessage: string;
  setSupportMessage: (message: string) => void;
  isSubmitting?: boolean;
}

const NewTicketDialog: React.FC<NewTicketDialogProps> = ({
  open,
  onOpenChange,
  selectedOption,
  onSubmit,
  supportMessage,
  setSupportMessage,
  isSubmitting = false
}) => {
  // Local state to manage textarea content
  const [localMessage, setLocalMessage] = useState('');
  
  // Sync local state with prop when dialog opens or selectedOption changes
  useEffect(() => {
    if (open) {
      setLocalMessage(supportMessage || '');
    }
  }, [open, supportMessage, selectedOption]);
  
  // Update parent state when local state changes
  useEffect(() => {
    setSupportMessage(localMessage);
  }, [localMessage, setSupportMessage]);

  const handleSubmit = () => {
    if (isSubmitting) return;
    
    // Only check if the message is non-empty
    if (!localMessage.trim()) {
      toast({
        title: "Message Required", 
        description: "Please provide details before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    console.log("Submitting support ticket with message:", localMessage);
    // Call the onSubmit handler from parent component
    onSubmit();
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newState) => {
        if (!newState && !isSubmitting) onOpenChange(false);
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {selectedOption?.label || "Create Support Ticket"}
          </DialogTitle>
          <DialogDescription>
            Please provide details about your issue.
            Our team will review your submission and respond in the support chat.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <Textarea 
            value={localMessage}
            onChange={(e) => setLocalMessage(e.target.value)}
            placeholder="Describe your issue in detail..."
            className="min-h-[100px]"
            disabled={isSubmitting === true}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => !isSubmitting && onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || !localMessage.trim()}
          >
            {isSubmitting ? (
              <div className="flex items-center">
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Submitting...
              </div>
            ) : (
              'Submit'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default NewTicketDialog;
