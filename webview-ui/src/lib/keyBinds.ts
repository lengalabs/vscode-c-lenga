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
}

export interface NodeChildEditCallbacks {
  onInsertChildFirst?: () => void;
  onInsertChildLast?: () => void;
}

// Navigation
export interface NodeNavigationCallbacks
  extends NodeParentNavigationCallbacks,
    NodeChildNavigationCallbacks {}

export interface NodeParentNavigationCallbacks {
  onNavigateToParent?: () => void;
  onNavigateToPreviousSibling?: () => void;
  onNavigateToNextSibling?: () => void;
}

export interface NodeChildNavigationCallbacks {
  onNavigateToFirstChild?: () => void;
  onNavigateToLastChild?: () => void;
}

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
 *   - Navigation:
 *     - previousSibling: Navigate to previous sibling (mapped to ArrowUp)
 *     - nextSibling: Navigate to next sibling (mapped to ArrowDown)
 *     - parentNode: Navigate to parent node (mapped to ArrowLeft)
 *     - firstChild: Navigate to first child (mapped to ArrowRight)
 *     - lastChild: Navigate to last child (mapped to Shift+ArrowRight)
 *
 * - Edit mode (for array fields):
 *   - insertChildFirst: Insert new element at beginning (mapped to Enter key)
 *   - insertChildLast: Insert new element at end (mapped to Shift+Enter key)
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
 *     insertChildFirst: () => { ... }
 *   });
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
}

export interface NodeNavigationCommandHandlers
  extends NodeParentNavigationCommandHandlers,
    NodeChildNavigationCommandHandlers {}

export interface NodeParentNavigationCommandHandlers {
  // Navigation
  navigateToPreviousSibling: Callback;
  navigateToNextSibling: Callback;
  navigateToParent: Callback;
}

export interface NodeChildNavigationCommandHandlers {
  navigateToFirstChild: Callback;
  navigateToLastChild: Callback;
}

// Key combination to command name mapping
type KeyMapping = {
  [key: string]: string;
};

export const KEY_MAPPINGS: Record<EditorModeType, KeyMapping> = {
  view: {
    // Insertion
    Enter: "insertSibling",
    "Shift+Enter": "insertSiblingBefore",
    "Ctrl+Enter": "insertChildFirst",
    "Ctrl+Shift+Enter": "insertChildLast",
    // Deletion
    Delete: "delete",
    // Navigation
    ArrowUp: "navigateToPreviousSibling",
    ArrowDown: "navigateToNextSibling",
    ArrowLeft: "navigateToParent",
    ArrowRight: "navigateToFirstChild",
    "Shift+ArrowRight": "navigateToLastChild",
  },
  edit: {
    Delete: "delete",
  },
};

// Helper to serialize key event to string for lookup
// Modifiers are always in alphabetical order: Alt+Ctrl+Shift+Key
export function getKeyComboString(e: React.KeyboardEvent): string {
  const parts: string[] = [];
  if (e.altKey) parts.push("Alt");
  if (e.ctrlKey) parts.push("Ctrl");
  if (e.shiftKey) parts.push("Shift");
  parts.push(e.key);
  return parts.join("+");
}
