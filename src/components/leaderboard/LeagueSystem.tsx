
import React from 'react';

const LeagueSystem: React.FC = () => {
  return (
    <div className="mt-6 bg-white rounded-lg shadow-md p-4">
      <h3 className="font-semibold mb-3">League System</h3>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2">👑</span>
            <span>Elite League</span>
          </div>
          <span className="text-sm text-gray-500">
            Point-based (+1 win, -1 loss)
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2">🔷</span>
            <span>Diamond 5 → Diamond 1</span>
          </div>
          <span className="text-sm text-gray-500">
            Top promotion to Elite
          </span>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2">💎</span>
            <span>Platinum 5 → Platinum 1</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2">🥇</span>
            <span>Gold 5 → Gold 1</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2">🥈</span>
            <span>Silver 5 → Silver 1</span>
          </div>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <span className="mr-2">🥉</span>
            <span>Bronze 5 → Bronze 1</span>
          </div>
          <span className="text-sm text-gray-500">
            Entry level
          </span>
        </div>
      </div>
    </div>
  );
};

export default LeagueSystem;
