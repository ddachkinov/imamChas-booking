import React, { useEffect, useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { Modal } from '@/components/ui/Modal';
import { KEYBOARD_SHORTCUTS } from '../hooks/useKeyboardShortcuts';

export const KeyboardShortcutsModal: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        return;
      }

      if (event.key === '?' && !event.shiftKey && !event.ctrlKey && !event.metaKey) {
        event.preventDefault();
        setIsOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} title="Keyboard Shortcuts">
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Use these keyboard shortcuts to navigate the calendar quickly.
        </p>

        <div className="space-y-2">
          {KEYBOARD_SHORTCUTS.map((shortcut) => (
            <div
              key={shortcut.key}
              className="flex items-center justify-between py-2 px-3 rounded-md hover:bg-gray-50"
            >
              <span className="text-sm text-gray-700">{shortcut.description}</span>
              <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded-lg">
                {shortcut.key}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            Press <kbd className="px-1 py-0.5 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-200 rounded">?</kbd> to show this help
          </p>
        </div>
      </div>
    </Modal>
  );
};
