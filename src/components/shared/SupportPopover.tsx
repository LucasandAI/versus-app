
import React, { useState } from 'react';
import { HelpCircle, MessageSquare, AlertCircle, Flag } from 'lucide-react';
import { 
  Popover, 
  PopoverContent, 
  PopoverTrigger 
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";

interface SupportOption {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
}

const supportOptions: SupportOption[] = [
  {
    id: 'contact',
    label: 'Contact Support',
    icon: <MessageSquare className="h-4 w-4" />,
    description: 'Get help with a general question or issue'
  },
  {
    id: 'bug',
    label: 'Report a Bug',
    icon: <AlertCircle className="h-4 w-4" />,
    description: 'Tell us if something isn't working correctly'
  },
  {
    id: 'report',
    label: 'Report a Cheater',
    icon: <Flag className="h-4 w-4" />,
    description: 'Report suspicious activities or cheating'
  }
];

const SupportPopover: React.FC = () => {
  const [open, setOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedOption, setSelectedOption] = useState<SupportOption | null>(null);

  const handleOptionClick = (option: SupportOption) => {
    setSelectedOption(option);
    setOpen(false);
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    toast({
      title: "Support Request Sent",
      description: `Your ${selectedOption?.label.toLowerCase()} has been submitted. We'll get back to you soon.`,
    });
    setDialogOpen(false);
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button 
            variant="ghost" 
            size="icon"
            className="h-8 w-8 fixed bottom-20 right-4 text-gray-500 hover:bg-gray-100 rounded-full lg:bottom-6"
          >
            <HelpCircle className="h-5 w-5" />
            <span className="sr-only">Support</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-56 p-0" align="end">
          <div className="p-2">
            {supportOptions.map((option) => (
              <button
                key={option.id}
                className="w-full text-left flex items-center gap-2 py-2 px-3 hover:bg-gray-100 rounded-md"
                onClick={() => handleOptionClick(option)}
              >
                <span className="flex-shrink-0 text-gray-500">{option.icon}</span>
                <div>
                  <p className="text-sm font-medium">{option.label}</p>
                  <p className="text-xs text-gray-500">{option.description}</p>
                </div>
              </button>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <AlertDialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedOption?.label}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please provide details about your {selectedOption?.label.toLowerCase()}.
              Our team will review your submission and get back to you as soon as possible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <textarea 
              className="w-full min-h-[100px] p-2 border rounded-md" 
              placeholder={`Describe your ${selectedOption?.label.toLowerCase()} in detail...`}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>Submit</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default SupportPopover;
