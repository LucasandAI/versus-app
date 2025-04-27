
import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFocus?: () => void;
  showResults: boolean;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onFocus, showResults }) => {
  return (
    <div className="px-4 py-2 bg-gray-50">
      <div className={`relative flex items-center bg-gray-100 rounded-full ${showResults ? 'rounded-b-none' : ''}`}>
        <Search className="absolute left-4 h-5 w-5 text-gray-400" />
        <input
          type="text"
          className="w-full py-3 pl-12 pr-4 bg-transparent text-lg placeholder:text-gray-500 focus:outline-none"
          placeholder="Search users..."
          value={value}
          onChange={onChange}
          onFocus={onFocus}
        />
      </div>
    </div>
  );
};

export default SearchBar;
