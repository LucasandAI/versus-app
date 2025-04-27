
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from '@/hooks/use-toast';
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
  const handleSubmit = () => {
    if (isSubmitting) return;
    
    if (!selectedOption) {
      toast({
        title: "Support Option Required",
        description: "Please select a support topic before submitting",
        variant: "destructive"
      });
      return;
    }
    
    if (!supportMessage.trim()) {
      toast({
        title: "Message Required", 
        description: "Please provide details before submitting.",
        variant: "destructive"
      });
      return;
    }
    
    onSubmit();
  };

  return (
    <Dialog 
      open={open} 
      onOpenChange={(newState) => {
        if (!newState) onOpenChange(false);
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
            value={supportMessage}
            onChange={(e) => setSupportMessage(e.target.value)}
            placeholder="Describe your issue in detail..."
            className="min-h-[100px]"
            disabled={isSubmitting}
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
            disabled={isSubmitting || !supportMessage.trim()}
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
