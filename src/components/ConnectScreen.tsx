
import React from 'react';
import LoginForm from './auth/LoginForm';

const ConnectScreen: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-b from-white to-gray-100">
      <div className="max-w-md w-full space-y-8 text-center">
        <div className="space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">Versus</h1>
          <div className="flex justify-center">
            <div className="w-16 h-1 bg-primary rounded-full"></div>
          </div>
          <h2 className="font-medium text-gray-700 mx-auto whitespace-nowrap text-lg">
            The Competitive League for Runners
          </h2>
        </div>

        <LoginForm />
      </div>
    </div>
  );
};

export default ConnectScreen;
