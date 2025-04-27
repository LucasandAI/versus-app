
import React from 'react';
import { Search } from 'lucide-react';

interface SearchBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange }) => {
  return (
    <div className="relative px-4 py-2 bg-gray-50">
      <div className="relative flex items-center bg-gray-100 rounded-full">
        <Search className="absolute left-4 h-5 w-5 text-gray-400" />
        <input
          type="text"
          className="w-full py-3 pl-12 pr-4 bg-transparent text-lg placeholder:text-gray-500 focus:outline-none"
          placeholder="Search"
          value={value}
          onChange={onChange}
        />
      </div>
    </div>
  );
};

export default SearchBar;
