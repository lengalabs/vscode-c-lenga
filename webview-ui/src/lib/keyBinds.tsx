import React from "react";
import { EditorMode } from "../components/context";

/**
 * Keyboard command abstraction for structured editing
 *
 * This provides a higher-level interface for handling keyboard interactions in the editor.
 * Instead of dealing with raw key events, render functions specify named commands they support.
 *
 * Available commands:
 * - View mode:
 *   - insertSibling: Create a sibling node (mapped to Enter key)
 *   - delete: Remove the current node (mapped to Delete key)
 *
 * - Edit mode:
 *   - insert: Insert new content/child nodes (mapped to Enter key)
 *   - delete: Remove content (mapped to Delete key)
 *
 * The abstraction automatically handles:
 * - Event propagation (stopPropagation)
 * - Default behavior prevention (preventDefault)
 * - Mode-specific command routing
 *
 * Usage:
 *   const handleKeyDown = createKeyDownHandler(mode, {
 *     edit: {
 *       insert: () => { ... }
 *     }
 *   });
 */
// Command types that render functions can use
type CommandHandler = () => void;
interface CommandHandlers {
  view?: {
    insertSibling?: CommandHandler;
    delete?: CommandHandler;
  };
  edit?: {
    insert?: CommandHandler;
    delete?: CommandHandler;
  };
}
// Key mapping for each mode
const KEY_MAPPINGS = {
  view: {
    Enter: "insertSibling",
    Delete: "delete",
  },
  edit: {
    Enter: "insert",
    Delete: "delete",
  },
} as const;
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
    const commandName = keyMapping[e.key as keyof typeof keyMapping];
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
