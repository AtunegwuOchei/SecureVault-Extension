import React from 'react';

interface AutofillNotificationProps {
  site: string;
  onAccept: () => void;
  onDecline: () => void;
}

const AutofillNotification: React.FC<AutofillNotificationProps> = ({ site, onAccept, onDecline }) => {
  return (
    <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg w-80 z-50">
      <div className="p-3 border-b border-neutral-200 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-6 h-6 rounded-full bg-primary-light flex items-center justify-center mr-2">
            <span className="material-icons text-primary text-sm">lock</span>
          </div>
          <h3 className="text-sm font-medium text-neutral-800">SecureKeeper</h3>
        </div>
        <button className="p-1 rounded-full hover:bg-neutral-100" onClick={onDecline}>
          <span className="material-icons text-neutral-500 text-sm">close</span>
        </button>
      </div>
      
      <div className="p-3">
        <p className="text-sm text-neutral-700 mb-3">
          Would you like to autofill your credentials for <span className="font-medium">{site}</span>?
        </p>
        
        <div className="flex justify-between">
          <button 
            className="px-3 py-1.5 bg-primary text-white text-sm rounded-md flex-1 mr-2"
            onClick={onAccept}
          >
            Yes, Autofill
          </button>
          <button 
            className="px-3 py-1.5 bg-white border border-neutral-300 text-neutral-700 text-sm rounded-md flex-1"
            onClick={onDecline}
          >
            Not Now
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutofillNotification;
