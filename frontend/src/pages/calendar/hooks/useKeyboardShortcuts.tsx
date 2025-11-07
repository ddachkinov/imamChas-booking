import { useEffect } from 'react';
import { useCalendar } from '@/contexts/CalendarContext';

interface KeyboardShortcutsProps {
  onNewAppointment?: () => void;
}

export const useKeyboardShortcuts = ({ onNewAppointment }: KeyboardShortcutsProps = {}) => {
  const { state, actions } = useCalendar();

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

      // Handle keyboard shortcuts
      switch (event.key.toLowerCase()) {
        // Navigation
        case 'arrowleft':
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            actions.previousPeriod();
          }
          break;

        case 'arrowright':
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            actions.nextPeriod();
          }
          break;

        case 't':
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            actions.goToToday();
          }
          break;

        // View switching
        case 'd':
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            actions.setView('day');
          }
          break;

        case 'w':
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            actions.setView('week');
          }
          break;

        case 'm':
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            actions.setView('month');
          }
          break;

        // Actions
        case 'n':
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            onNewAppointment?.();
          }
          break;

        case 'f':
          if (!event.shiftKey && !event.ctrlKey && !event.metaKey) {
            event.preventDefault();
            // Focus search (if implemented)
            const searchInput = document.querySelector('input[placeholder*="Search"]') as HTMLInputElement;
            searchInput?.focus();
          }
          break;

        case 'escape':
          if (state.sidebarOpen) {
            event.preventDefault();
            actions.closeSidebar();
          }
          break;

        default:
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, onNewAppointment, state.sidebarOpen]);
};

// Keyboard shortcuts reference
export const KEYBOARD_SHORTCUTS = [
  { key: '←', description: 'Previous day/week/month' },
  { key: '→', description: 'Next day/week/month' },
  { key: 'T', description: 'Jump to today' },
  { key: 'D', description: 'Day view' },
  { key: 'W', description: 'Week view' },
  { key: 'M', description: 'Month view' },
  { key: 'N', description: 'New appointment' },
  { key: 'F', description: 'Focus search' },
  { key: 'Esc', description: 'Close sidebar' },
];
