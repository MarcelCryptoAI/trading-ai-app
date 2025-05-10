// frontend/src/components/Modal.jsx
import React from 'react';

export default function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-gray-800 rounded-xl p-6 max-w-lg w-full"
        onClick={e => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}
