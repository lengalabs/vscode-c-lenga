import React from "react";
import * as objects from "../../../src/language_objects/cNodes";
import { EditorMode, EditorModeType } from "../context/line/lineContext";

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
  bind: { keys: string; mode?: EditorModeType }[];
  description?: string;
}

// Key combination to command name mapping
type KeyMapping = {
  [key: string]: string;
};

// Command definitions organized by mode
type CommandDefinitions = {
  [commandName: string]: CommandDefinition;
};

// Define commands with their key combinations and descriptions
export const COMMAND_DEFINITIONS: CommandDefinitions = {
  // Insertion
  insertSibling: {
    bind: [{ keys: "Enter", mode: EditorMode.View }],
    description: "Create a sibling node after",
  },
  insertSiblingBefore: {
    bind: [{ keys: "Shift+Enter", mode: EditorMode.View }],
    description: "Create a sibling node before",
  },
  insertChildFirst: {
    bind: [{ keys: "Ctrl+Enter", mode: EditorMode.View }],
    description: "Insert new element at beginning",
  },
  insertChildLast: {
    bind: [{ keys: "Ctrl+Shift+Enter", mode: EditorMode.View }],
    description: "Insert new element at end",
  },
  // Deletion
  delete: {
    bind: [
      { keys: "Delete", mode: EditorMode.View },
      { keys: "Backspace", mode: EditorMode.View },
    ],
    description: "Remove the current node",
  },
  // Navigation
  navigateToPreviousSibling: {
    bind: [
      { keys: "ArrowUp", mode: EditorMode.View },
      { keys: "l", mode: EditorMode.View },
    ],
    description: "Navigate to previous sibling",
  },
  navigateToNextSibling: {
    bind: [
      { keys: "ArrowDown", mode: EditorMode.View },
      { keys: "k", mode: EditorMode.View },
    ],
    description: "Navigate to next sibling",
  },
  navigateToParent: {
    bind: [
      { keys: "ArrowLeft", mode: EditorMode.View },
      { keys: "j", mode: EditorMode.View },
    ],
    description: "Navigate to parent node",
  },
  navigateToFirstChild: {
    bind: [
      { keys: "ArrowRight", mode: EditorMode.View },
      { keys: "ñ", mode: EditorMode.View },
      { keys: "n", mode: EditorMode.View },
    ],
    description: "Navigate to first child",
  },
  navigateToLastChild: {
    bind: [
      { keys: "Shift+ArrowRight", mode: EditorMode.View },
      { keys: "Shift+ñ", mode: EditorMode.View },
      { keys: "Shift+n", mode: EditorMode.View },
    ],
    description: "Navigate to last child",
  },
  navigateToPreviousField: {
    bind: [
      { keys: "Shift+ArrowUp", mode: EditorMode.View },
      { keys: "Shift+l", mode: EditorMode.View },
      { keys: "o", mode: EditorMode.View },
    ],
    description: "Navigate to previous field in same object",
  },
  navigateToNextField: {
    bind: [
      { keys: "Shift+ArrowDown", mode: EditorMode.View },
      { keys: "Shift+k", mode: EditorMode.View },
      { keys: "i", mode: EditorMode.View },
    ],
    description: "Navigate to next field in same object",
  },
  // Movement/Permutation
  moveNodeUp: {
    bind: [
      { keys: "Alt+ArrowUp", mode: EditorMode.View },
      { keys: "Alt+l", mode: EditorMode.View },
    ],
    description: "Move current node up in array",
  },
  moveNodeDown: {
    bind: [
      { keys: "Alt+ArrowDown", mode: EditorMode.View },
      { keys: "Alt+k", mode: EditorMode.View },
    ],
    description: "Move current node down in array",
  },
  moveNodeToParentPreviousSibling: {
    bind: [
      { keys: "Alt+ArrowLeft", mode: EditorMode.View },
      { keys: "Alt+j", mode: EditorMode.View },
    ],
    description: "Move node to become previous sibling of parent",
  },
  moveNodeToParentNextSibling: {
    bind: [
      { keys: "Alt+Shift+ArrowLeft", mode: EditorMode.View },
      { keys: "Alt+Shift+j", mode: EditorMode.View },
    ],
    description: "Move node to become next sibling of parent",
  },
  moveNodeIntoNextSiblingsFirstChild: {
    bind: [
      { keys: "Alt+ArrowRight", mode: EditorMode.View },
      { keys: "Alt+ñ", mode: EditorMode.View },
      { keys: "Alt+n", mode: EditorMode.View },
      { keys: "Alt+Shift+ArrowDown", mode: EditorMode.View },
    ],
    description: "Move node into next sibling's first position",
  },
  moveNodeIntoPreviousSiblingsLastChild: {
    bind: [
      { keys: "Alt+Shift+ArrowUp", mode: EditorMode.View },
      { keys: "Alt+Shift+ñ", mode: EditorMode.View },
      { keys: "Alt+Shift+n", mode: EditorMode.View },
      { keys: "Alt+Shift+ArrowRight", mode: EditorMode.View },
    ],
    description: "Move node into previous sibling's last position",
  },
};

// Function to generate optimized key mapping from command definitions
export function createKeyMapping(mode: EditorModeType): KeyMapping {
  const keyMapping: KeyMapping = {};

  for (const [commandName, definition] of Object.entries(COMMAND_DEFINITIONS)) {
    // Filter bindings for the specific mode (or no mode specified)
    const bindings = definition.bind.filter((binding) => !binding.mode || binding.mode === mode);

    for (const binding of bindings) {
      keyMapping[binding.keys] = commandName;
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
  const availableCommands: string[] = [];

  for (const [commandName, definition] of Object.entries(COMMAND_DEFINITIONS)) {
    // Check if command has bindings for this mode
    const hasBindingForMode = definition.bind.some(
      (binding) => !binding.mode || binding.mode === mode
    );
    if (hasBindingForMode) {
      availableCommands.push(commandName);
    }
  }

  return availableCommands;
}

/**
 * Get all key combinations for a specific command in a mode
 */
export function getKeysForCommand(mode: EditorModeType, commandName: string): string[] {
  const command = COMMAND_DEFINITIONS[commandName];
  if (!command) return [];

  const bindings = command.bind.filter((binding) => !binding.mode || binding.mode === mode);
  return bindings.map((binding) => binding.keys);
}

/**
 * Get command description
 */
export function getCommandDescription(commandName: string): string | undefined {
  const command = COMMAND_DEFINITIONS[commandName];
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
  const commandInfo: Array<{
    command: string;
    keys: string[];
    description?: string;
  }> = [];

  for (const [commandName, definition] of Object.entries(COMMAND_DEFINITIONS)) {
    const keysForMode = getKeysForCommand(mode, commandName);
    if (keysForMode.length > 0) {
      commandInfo.push({
        command: commandName,
        keys: keysForMode,
        description: definition.description,
      });
    }
  }

  return commandInfo;
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
