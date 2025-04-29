import { toast } from '@/hooks/use-toast';

export const findMatchingMessage = (messages: any[], newMessage: any) => {
  return messages.find(
    message =>
      message.text === newMessage.text &&
      message.sender.id === newMessage.sender.id &&
      message.timestamp === newMessage.timestamp
  );
};

// Add a new helper function for checking if a toast has already been shown for an error
export const showErrorToast = (message: string, hasShownToast: boolean): boolean => {
  if (hasShownToast) return true;
  
  toast({
    title: "Error",
    description: message,
    variant: "destructive"
  });
  
  return true;
};
