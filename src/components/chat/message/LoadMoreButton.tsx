
import React from 'react';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';

interface LoadMoreButtonProps {
  onLoadMore: () => void;
  isLoading: boolean;
}

const LoadMoreButton: React.FC<LoadMoreButtonProps> = ({ onLoadMore, isLoading }) => {
  return (
    <div className="flex justify-center py-2">
      <Button
        variant="ghost"
        size="sm"
        onClick={onLoadMore}
        disabled={isLoading}
        className="text-xs text-muted-foreground hover:text-primary"
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
