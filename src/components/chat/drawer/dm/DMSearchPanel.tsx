
import React, { useState } from 'react';

const DMSearchPanel: React.FC = () => {
  const [query, setQuery] = useState("");
  return (
    <div className="p-4">
      <input
        className="w-full border rounded px-2 py-2 mb-2"
        type="text"
        placeholder="Search users to DM..."
        value={query}
        onChange={e => setQuery(e.target.value)}
      />
      <p className="text-gray-500 text-sm">Type to search. (Feature Coming Soon)</p>
    </div>
  );
};

export default DMSearchPanel;
