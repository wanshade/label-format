"use client";

import { useState } from "react";

interface AddLineModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (text: string, textSize: number) => void;
}

export default function AddLineModal({ isOpen, onClose, onAdd }: AddLineModalProps) {
  const [text, setText] = useState("");
  const [textSize, setTextSize] = useState(0);

  const handleAdd = () => {
    if (text.trim()) {
      onAdd(text.trim(), textSize);
      setText("");
      setTextSize(0);
      onClose();
    }
  };

  const handleCancel = () => {
    setText("");
    setTextSize(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-md w-full relative">
        <button
          onClick={handleCancel}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Add New Line</h3>
          <p className="text-sm text-gray-600 mt-1">Configure text content and size</p>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Text Content Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Content
              </label>
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && text.trim()) {
                    handleAdd();
                  } else if (e.key === 'Escape') {
                    handleCancel();
                  }
                }}
                placeholder="Enter text"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                autoFocus
              />
            </div>

            {/* Text Size Column */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Size (mm)
              </label>
              <input
                type="number"
                value={textSize}
                onChange={(e) => setTextSize(parseFloat(e.target.value) || 0)}
                min="0.1"
                step="0.1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md font-medium"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!text.trim()}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-300 text-white rounded-md font-medium"
          >
            Add Line
          </button>
        </div>
      </div>
    </div>
  );
}