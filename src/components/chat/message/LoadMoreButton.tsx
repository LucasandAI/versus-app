
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';

interface LoadMoreButtonProps {
  onLoadMore: () => void;
  isLoading: boolean;
}

const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({ onLoadMore, isLoading }) => {
  return (
    <div className="flex justify-center py-2 sticky top-0 z-10 bg-white/90 backdrop-blur-sm">
      <Button
        variant="secondary"
        size="sm"
        onClick={onLoadMore}
        disabled={isLoading}
        className="text-xs hover:bg-primary/20"
      >
        {isLoading ? (
          <div className="flex items-center">
            <Loader className="h-3 w-3 mr-2 animate-spin" />
            Loading...
          </div>
        ) : (
          'Load More Messages'
        )}
      </Button>
    </div>
  );
};

export default LoadMoreButton;
