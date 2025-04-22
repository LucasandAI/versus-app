
import React from 'react';

interface NoUserStateProps {
  onBackHome: () => void;
}

const NoUserState: React.FC<NoUserStateProps> = ({ onBackHome }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <p>No user selected</p>
      <button
        onClick={onBackHome}
        className="mt-4 text-primary hover:underline"
      >
        Go back home
      </button>
    </div>
  );
};

export default NoUserState;
