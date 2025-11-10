import React from "react";
import * as objects from "../../../src/language_objects/cNodes";
import { EditorModeType } from "../context/line/lineContext";

export interface NodeCallbacks extends NodeEditCallbacks, NodeNavigationCallbacks {}

export interface NodeEditCallbacks extends NodeChildEditCallbacks, NodeParentEditCallbacks {}

export interface NodeParentEditCallbacks {
  // Insertion
  onInsertSibling?: (node: objects.LanguageObject) => void;
  onInsertSiblingBefore?: (node: objects.LanguageObject) => void;
  onReplace?: (oldNode: objects.LanguageObject, newNode: objects.LanguageObject) => void;

  // Deletion
  onDelete?: (node: objects.LanguageObject) => void;

  // Movement
  onMoveUp?: (node: objects.LanguageObject) => void;
  onMoveDown?: (node: objects.LanguageObject) => void;
  onMoveToParentPreviousSibling?: (node: objects.LanguageObject) => void;
  onMoveToParentNextSibling?: (node: objects.LanguageObject) => void;
  onMoveIntoNextSiblingsFirstChild?: (node: objects.LanguageObject) => void;
  onMoveIntoPreviousSiblingsLastChild?: (node: objects.LanguageObject) => void;
}

export interface NodeChildEditCallbacks {
  onInsertChildFirst?: () => void;
  onInsertChildLast?: () => void;
}

// Navigation
export interface NodeNavigationCallbacks
  extends NodeParentNavigationCallbacks,
    NodeChildNavigationCallbacks,
    NodeFieldNavigationCallbacks {}

export interface NodeParentNavigationCallbacks {
  onNavigateToParent?: () => void;
  onNavigateToPreviousSibling?: () => void;
  onNavigateToNextSibling?: () => void;
}

export interface NodeChildNavigationCallbacks {
  onNavigateToFirstChild?: () => void;
  onNavigateToLastChild?: () => void;
}

export interface NodeFieldNavigationCallbacks {
  onNavigateToPreviousField?: () => void;
  onNavigateToNextField?: () => void;
}

/**
 * Keyboard command abstraction for structured editing
 *
 * This provides a higher-level interface for handling keyboard interactions in the editor.
 * Instead of dealing with raw key events, render functions specify named commands they support.
 *
 * The new system allows defining multiple key combinations for the same command through
 * the COMMAND_DEFINITIONS object. This enables both traditional arrow keys and vim-like
 * hjkl navigation, as well as alternative keys for the same actions.
 *
 * Key Features:
 * - Multiple key bindings per command (e.g., both "Delete" and "Backspace" for delete)
 * - Vim-like navigation support (j/k/l/n alongside arrow keys)
 * - Command descriptions for documentation/help systems
 * - Optimized key mapping generation with caching
 * - Backwards compatibility with existing KEY_MAPPINGS usage
 *
 * Available commands are defined in COMMAND_DEFINITIONS with their key combinations
 * and descriptions. The system automatically generates the optimized key mapping
 * for runtime lookup.
 *
 * The abstraction automatically handles:
 * - Event propagation (stopPropagation)
 * - Default behavior prevention (preventDefault)
 * - Mode-specific command routing
 * - Multiple key combinations per command
 *
 * Usage:
 *   const handleKeyDown = createKeyDownHandler(mode, {
 *     insertChildFirst: () => { ... }
 *   });
 *
 * Or to get available commands for a mode:
 *   const commands = getAvailableCommands("view");
 */
// Command types that render functions can use
type Callback = () => void;

export interface NodeCommandHandlers
  extends NodeEditCommandHandlers,
    NodeNavigationCommandHandlers {}

export interface NodeEditCommandHandlers {
  // Insertion
  insertSibling?: Callback;
  insertSiblingBefore?: Callback;
  insertChildFirst?: Callback;
  insertChildLast?: Callback;

  // Deletion
  delete?: Callback;

  // Movement
  moveNodeUp?: Callback;
  moveNodeDown?: Callback;
  moveNodeToParentPreviousSibling?: Callback;
  moveNodeToParentNextSibling?: Callback;
  moveNodeIntoNextSiblingsFirstChild?: Callback;
  moveNodeIntoPreviousSiblingsLastChild?: Callback;
}

export interface NodeNavigationCommandHandlers
  extends NodeParentNavigationCommandHandlers,
    NodeChildNavigationCommandHandlers,
    NodeFieldNavigationCommandHandlers {}

export interface NodeParentNavigationCommandHandlers {
  navigateToPreviousSibling?: Callback;
  navigateToNextSibling?: Callback;
  navigateToParent?: Callback;
}

export interface NodeChildNavigationCommandHandlers {
  navigateToFirstChild?: Callback;
  navigateToLastChild?: Callback;
}

export interface NodeFieldNavigationCommandHandlers {
  navigateToPreviousField?: Callback;
  navigateToNextField?: Callback;
}

// Command definition with multiple key combinations
interface CommandDefinition {
  keys: string[];
  description?: string;
}

// Key combination to command name mapping
type KeyMapping = {
  [key: string]: string;
};

// Command definitions organized by mode
type CommandDefinitions = {
  [mode in EditorModeType]: {
    [commandName: string]: CommandDefinition;
  };
};

// Define commands with their key combinations and descriptions
export const COMMAND_DEFINITIONS: CommandDefinitions = {
  view: {
    // Insertion
    insertSibling: {
      keys: ["Enter"],
      description: "Create a sibling node after",
    },
    insertSiblingBefore: {
      keys: ["Shift+Enter"],
      description: "Create a sibling node before",
    },
    insertChildFirst: {
      keys: ["Ctrl+Enter"],
      description: "Insert new element at beginning",
    },
    insertChildLast: {
      keys: ["Ctrl+Shift+Enter"],
      description: "Insert new element at end",
    },
    // Deletion
    delete: {
      keys: ["Delete", "Backspace"],
      description: "Remove the current node",
    },
    // Navigation
    navigateToPreviousSibling: {
      keys: ["ArrowUp", "l"],
      description: "Navigate to previous sibling",
    },
    navigateToNextSibling: {
      keys: ["ArrowDown", "k"],
      description: "Navigate to next sibling",
    },
    navigateToParent: {
      keys: ["ArrowLeft", "j"],
      description: "Navigate to parent node",
    },
    navigateToFirstChild: {
      keys: ["ArrowRight", "n"],
      description: "Navigate to first child",
    },
    navigateToLastChild: {
      keys: ["Shift+ArrowRight", "Shift+n"],
      description: "Navigate to last child",
    },
    navigateToPreviousField: {
      keys: ["Shift+ArrowUp", "Shift+l", "o"],
      description: "Navigate to previous field in same object",
    },
    navigateToNextField: {
      keys: ["Shift+ArrowDown", "Shift+k", "i"],
      description: "Navigate to next field in same object",
    },
    // Movement/Permutation
    moveNodeUp: {
      keys: ["Alt+ArrowUp", "Alt+l"],
      description: "Move current node up in array",
    },
    moveNodeDown: {
      keys: ["Alt+ArrowDown", "Alt+k"],
      description: "Move current node down in array",
    },
    moveNodeToParentPreviousSibling: {
      keys: ["Alt+ArrowLeft", "Alt+j"],
      description: "Move node to become previous sibling of parent",
    },
    moveNodeToParentNextSibling: {
      keys: ["Alt+Shift+ArrowLeft", "Alt+Shift+j"],
      description: "Move node to become next sibling of parent",
    },
    moveNodeIntoNextSiblingsFirstChild: {
      keys: ["Alt+ArrowRight", "Alt+n", "Alt+Shift+ArrowDown"],
      description: "Move node into next sibling's first position",
    },
    moveNodeIntoPreviousSiblingsLastChild: {
      keys: ["Alt+Shift+ArrowUp", "Alt+Shift+ArrowRight"],
      description: "Move node into previous sibling's last position",
    },
  },
  edit: {
    delete: {
      keys: ["Delete", "Backspace"],
      description: "Clear field content",
    },
  },
};

// Function to generate optimized key mapping from command definitions
export function createKeyMapping(mode: EditorModeType): KeyMapping {
  const keyMapping: KeyMapping = {};
  const commands = COMMAND_DEFINITIONS[mode];

  for (const [commandName, definition] of Object.entries(commands)) {
    for (const keyCombo of definition.keys) {
      keyMapping[keyCombo] = commandName;
    }
  }

  return keyMapping;
}

// Cached key mappings for performance
const cachedKeyMappings: Partial<Record<EditorModeType, KeyMapping>> = {};

export function getKeyMapping(mode: EditorModeType): KeyMapping {
  if (!cachedKeyMappings[mode]) {
    cachedKeyMappings[mode] = createKeyMapping(mode);
  }
  return cachedKeyMappings[mode]!;
}

// Legacy export for backwards compatibility
export const KEY_MAPPINGS: Record<EditorModeType, KeyMapping> = {
  view: getKeyMapping("view"),
  edit: getKeyMapping("edit"),
};

// Utility functions for introspection and help systems

/**
 * Get all available commands for a specific mode
 */
export function getAvailableCommands(mode: EditorModeType): string[] {
  return Object.keys(COMMAND_DEFINITIONS[mode]);
}

/**
 * Get all key combinations for a specific command in a mode
 */
export function getKeysForCommand(mode: EditorModeType, commandName: string): string[] {
  const command = COMMAND_DEFINITIONS[mode]?.[commandName];
  return command ? [...command.keys] : [];
}

/**
 * Get command description
 */
export function getCommandDescription(
  mode: EditorModeType,
  commandName: string
): string | undefined {
  const command = COMMAND_DEFINITIONS[mode]?.[commandName];
  return command?.description;
}

/**
 * Get the command name for a key combination
 */
export function getCommandForKey(mode: EditorModeType, keyCombo: string): string | undefined {
  const keyMapping = getKeyMapping(mode);
  return keyMapping[keyCombo];
}

/**
 * Get all commands with their key bindings and descriptions for a mode
 */
export function getAllCommandInfo(mode: EditorModeType): Array<{
  command: string;
  keys: string[];
  description?: string;
}> {
  const commands = COMMAND_DEFINITIONS[mode];
  return Object.entries(commands).map(([command, definition]) => ({
    command,
    keys: [...definition.keys],
    description: definition.description,
  }));
}

// Helper to serialize key event to string for lookup
// Modifiers are always in alphabetical order: Alt+Ctrl+Shift+Key
export function getKeyComboString(e: React.KeyboardEvent): string {
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
