
import React, { useState, useEffect } from 'react';
import { SupportTicket } from '@/types/chat';
import { ArrowLeft, Loader2 } from 'lucide-react';
import SupportOptions from './SupportOptions';
import NewTicketDialog from './NewTicketDialog';
import ChatTicketContent from '../../ChatTicketContent';
import { Button } from '@/components/ui/button';
import { useSupportTicketEffects } from '@/hooks/chat/useSupportTicketEffects';

interface SupportTabContentProps {
  supportTickets: SupportTicket[];
  onSelectTicket: (ticket: SupportTicket) => void;
  handleSubmitSupportTicket: () => Promise<void>;
  supportMessage: string;
  setSupportMessage: (message: string) => void;
  selectedTicket: SupportTicket | null;
  onSendMessage: (message: string) => void;
  isSubmitting?: boolean;
  selectedSupportOption: {id: string, label: string} | null;
  setSelectedSupportOption: (option: {id: string, label: string} | null) => void;
  activeTab: "clubs" | "dm" | "support";
}

const SupportTabContent: React.FC<SupportTabContentProps> = ({
  supportTickets: initialSupportTickets,
  onSelectTicket,
  handleSubmitSupportTicket,
  supportMessage,
  setSupportMessage,
  selectedTicket,
  onSendMessage,
  isSubmitting = false,
  selectedSupportOption,
  setSelectedSupportOption,
  activeTab
}) => {
  const [supportOptionsOpen, setSupportOptionsOpen] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [localSupportTickets, setLocalSupportTickets] = useState<SupportTicket[]>(initialSupportTickets);
  const [isCreatingTicket, setIsCreatingTicket] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  
  // Use the ticket effects hook to handle loading and updating tickets
  useSupportTicketEffects(activeTab === "support", (tickets) => {
    setLocalSupportTickets(tickets);
    setIsLoading(false); // Set loading to false once we have tickets
  });
  
  // Also update from props when they change
  useEffect(() => {
    if (initialSupportTickets.length > 0) {
      console.log('[SupportTabContent] Updating tickets from props:', initialSupportTickets.length);
      setLocalSupportTickets(initialSupportTickets);
      setIsLoading(false);
    }
  }, [initialSupportTickets]);

  // Set loading state when tab changes to support
  useEffect(() => {
    if (activeTab === "support") {
      // Only show loading state briefly to prevent flicker if tickets load quickly
      const timer = setTimeout(() => {
        if (localSupportTickets.length === 0) {
          setIsLoading(true);
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [activeTab, localSupportTickets.length]);

  const handleTicketClosed = () => {
    console.log('[SupportTabContent] Closing selected ticket');
    onSelectTicket(null as any);
  };

  const handleSubmitTicket = async () => {
    if (!supportMessage.trim() || !selectedSupportOption) {
      return;
    }
    
    try {
      setIsCreatingTicket(true);
      console.log('[SupportTabContent] Submitting new ticket');
      await handleSubmitSupportTicket();
      setDialogOpen(false);
      setIsLoading(true); // Show loading indicator while we fetch updated tickets
      
      // Refresh tickets after submission handled by useSupportTicketEffects
    } catch (error) {
      console.error("[SupportTabContent] Failed to submit ticket:", error);
    } finally {
      setIsCreatingTicket(false);
    }
  };

  const displaySubmittingStatus = isSubmitting || isCreatingTicket;

  return (
    <div className="flex flex-col w-full h-full bg-white">
      {!selectedTicket ? (
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <h1 className="text-4xl font-bold">Support</h1>
          </div>
          
          {/* New Support Ticket button moved above the ticket list */}
          <div className="p-4 border-b">
            <Button 
              className="w-full py-6 text-lg"
              onClick={() => setSupportOptionsOpen(true)}
              disabled={displaySubmittingStatus}
            >
              {displaySubmittingStatus ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Creating...
                </>
              ) : (
                'New Support Ticket'
              )}
            </Button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4">
            {isLoading ? (
              <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <span className="ml-2 text-gray-600">Loading tickets...</span>
              </div>
            ) : localSupportTickets.length === 0 ? (
              <div className="text-gray-500 text-center py-8">
                No support tickets yet. Click "New Ticket" to create one.
              </div>
            ) : (
              <div className="space-y-3">
                {localSupportTickets.map((ticket) => (
                  <div 
                    key={ticket.id} 
                    onClick={() => onSelectTicket(ticket)}
                    className="p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition"
                  >
                    <div className="font-medium text-lg">{ticket.subject}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      Created: {new Date(ticket.createdAt).toLocaleDateString()} 
                      • {ticket.messages.length} message{ticket.messages.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="flex flex-col h-full">
          <div className="flex items-center border-b p-3 gap-3">
            <button 
              onClick={handleTicketClosed} 
              className="p-2 hover:bg-gray-100 rounded-full"
              aria-label="Go back to ticket list"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>
            <div className="flex-1 text-center">
              <h2 className="font-semibold text-lg">{selectedTicket.subject}</h2>
            </div>
            <div className="w-10" /> {/* Spacer for alignment */}
          </div>
          
          <div className="flex-1 overflow-hidden h-full relative">
            <ChatTicketContent 
              ticket={selectedTicket} 
              onSendMessage={onSendMessage}
              onTicketClosed={handleTicketClosed} 
            />
          </div>
        </div>
      )}

      <SupportOptions 
        open={supportOptionsOpen}
        onOpenChange={setSupportOptionsOpen}
        onSelectOption={(option) => {
          setSelectedSupportOption(option);
          setSupportOptionsOpen(false);
          setDialogOpen(true);
        }}
      />

      <NewTicketDialog 
        open={dialogOpen}
        onOpenChange={(value) => {
          if (!value && !displaySubmittingStatus) {
            setDialogOpen(false);
          }
        }}
        selectedOption={selectedSupportOption}
        onSubmit={handleSubmitTicket}
        supportMessage={supportMessage}
        setSupportMessage={setSupportMessage}
        isSubmitting={displaySubmittingStatus}
      />
    </div>
  );
};

export default SupportTabContent;
