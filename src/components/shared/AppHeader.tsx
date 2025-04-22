
import React from 'react';
import { ArrowLeft } from 'lucide-react';

interface AppHeaderProps {
  title: string;
  onBack?: () => void;
  rightElement?: React.ReactNode;
}

const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  onBack,
  rightElement
}) => {
  return (
    <div className="bg-green-500 py-4 px-6 text-white flex items-center justify-center relative">
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute left-4 text-white hover:bg-green-600 rounded-full p-2 transition-colors"
        >
          <ArrowLeft className="h-6 w-6" />
        </button>
      )}
      <h1 className="text-xl font-semibold">{title}</h1>
      {rightElement && (
        <div className="absolute right-4">
          {rightElement}
        </div>
      )}
    </div>
  );
};

export default AppHeader;
