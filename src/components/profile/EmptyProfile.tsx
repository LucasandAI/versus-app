
import React from 'react';

interface EmptyProfileProps {
  onGoBack: () => void;
}

const EmptyProfile: React.FC<EmptyProfileProps> = ({ onGoBack }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p>No user selected</p>
      <button
        onClick={onGoBack}
        className="mt-4 text-primary hover:underline"
      >
        Go back home
      </button>
    </div>
  );
};

export default EmptyProfile;
