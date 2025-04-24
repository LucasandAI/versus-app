
import { useState } from 'react';

export const useSupportTicketState = () => {
  const [supportMessage, setSupportMessage] = useState("");
  const [selectedSupportOption, setSelectedSupportOption] = useState<{id: string, label: string} | null>(null);

  return {
    supportMessage,
    setSupportMessage,
    selectedSupportOption,
    setSelectedSupportOption
  };
};
