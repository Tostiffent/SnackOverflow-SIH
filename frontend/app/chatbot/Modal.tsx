import React from "react";

interface ModalProps {
  children: React.ReactNode;
  onClose: () => void;
}

const Modal: React.FC<ModalProps> = ({ children, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center ">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl w-full h-[720px]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
        >
          &times; {/* Close icon */}
        </button>
        {children}
      </div>
    </div>
  );
};

export default Modal;
