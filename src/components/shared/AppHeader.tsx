
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
    <div className="bg-green-500 py-4 px-6 text-white flex items-center justify-between relative">
      <div className="flex items-center">
        {onBack && (
          <button 
            onClick={onBack}
            className="text-white hover:bg-green-600 rounded-full p-2 transition-colors mr-2"
          >
            <ArrowLeft className="h-6 w-6" />
          </button>
        )}
      </div>
      
      <h1 className="text-xl font-semibold absolute left-1/2 transform -translate-x-1/2">
        {title}
      </h1>
      
      {rightElement && (
        <div className="flex items-center">
          {rightElement}
        </div>
      )}
    </div>
  );
};

export default AppHeader;
