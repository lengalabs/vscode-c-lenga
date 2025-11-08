import React from "react";
import { EditorMode } from "../context/line/lineContext";

/**
 * Keyboard command abstraction for structured editing
 *
 * This provides a higher-level interface for handling keyboard interactions in the editor.
 * Instead of dealing with raw key events, render functions specify named commands they support.
 *
 * Available commands:
 * - View mode:
 *   - insertSibling: Create a sibling node after (mapped to Enter key)
 *   - insertSiblingBefore: Create a sibling node before (mapped to Shift+Enter)
 *   - delete: Remove the current node (mapped to Delete key)
 *
 * - Edit mode (for array fields):
 *   - insertFirst: Insert new element at beginning (mapped to Enter key)
 *   - insertLast: Insert new element at end (mapped to Shift+Enter key)
 *   - delete: Remove content (mapped to Delete key)
 *
 * - Edit mode (for single fields):
 *   - insert: Replace/modify current field (mapped to Enter key)
 *   - delete: Clear field content (mapped to Delete key)
 *
 * The abstraction automatically handles:
 * - Event propagation (stopPropagation)
 * - Default behavior prevention (preventDefault)
 * - Mode-specific command routing
 *
 * Usage:
 *   const handleKeyDown = createKeyDownHandler(mode, {
 *     edit: {
 *       insertFirst: () => { ... }
 *     }
 *   });
 */
// Command types that render functions can use
type CommandHandler = () => void;
interface CommandHandlers {
  view?: {
    insertSibling?: CommandHandler;
    insertSiblingBefore?: CommandHandler;
    delete?: CommandHandler;
  };
  edit?: {
    insertFirst?: CommandHandler; // For array fields
    insertLast?: CommandHandler; // For array fields
    delete?: CommandHandler;
  };
}
// Key combination to command name mapping
type KeyMapping = {
  [key: string]: string; // serialized combo -> command name
};

const KEY_MAPPINGS: Record<EditorMode, KeyMapping> = {
  view: {
    Enter: "insertSibling",
    "Shift+Enter": "insertSiblingBefore",
    Delete: "delete",
  },
  edit: {
    Enter: "insertFirst",
    "Shift+Enter": "insertLast",
    Delete: "delete",
  },
};

// Helper to serialize key event to string for lookup
// Modifiers are always in alphabetical order: Alt+Ctrl+Shift+Key
function getKeyComboString(e: React.KeyboardEvent): string {
  const parts: string[] = [];
  if (e.altKey) {
    parts.push("Alt");
  }
  if (e.ctrlKey) {
    parts.push("Ctrl");
  }
  if (e.shiftKey) {
    parts.push("Shift");
  }
  parts.push(e.key);
  return parts.join("+");
}

// Helper to create structured keydown handlers with automatic event management
export function createKeyDownHandler(
  mode: EditorMode,
  commands: CommandHandlers
): (e: React.KeyboardEvent) => void {
  return (e: React.KeyboardEvent) => {
    const modeCommands = commands[mode];
    if (!modeCommands) {
      return;
    }

    const keyMapping = KEY_MAPPINGS[mode];
    const comboString = getKeyComboString(e);
    const commandName = keyMapping[comboString];

    if (!commandName) {
      return;
    }

    const command = modeCommands[commandName as keyof typeof modeCommands];
    if (command) {
      e.preventDefault();
      e.stopPropagation();
      command();
    }
  };
}
