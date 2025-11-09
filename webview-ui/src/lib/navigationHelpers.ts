import React from "react";
import {
  NodeChildNavigationCallbacks,
  NodeFieldNavigationCallbacks,
  NodeParentNavigationCallbacks,
} from "./keyBinds";

export interface ParentRefs {
  previousSibling?: React.RefObject<HTMLElement>;
  nextSibling?: React.RefObject<HTMLElement>;
  parent?: React.RefObject<HTMLElement>;
}

export interface ChildRefs {
  firstChild?: React.RefObject<HTMLElement>;
  lastChild?: React.RefObject<HTMLElement>;
}

export interface Refs extends ParentRefs, ChildRefs {}

export function createParentNavigationCallbacks(refs: ParentRefs): NodeParentNavigationCallbacks {
  const onNavigateToParent = () => {
    refs.parent?.current?.focus();
  };
  const callbacks: NodeParentNavigationCallbacks = {
    onNavigateToParent,
    onNavigateToPreviousSibling: () => {
      (focusOn(refs.previousSibling?.current) ?? onNavigateToParent)();
    },
    onNavigateToNextSibling: () => {
      (focusOn(refs.nextSibling?.current) ?? onNavigateToParent)();
    },
  };
  return callbacks;
}

export function createChildNavigationCallbacks(refs: ChildRefs): NodeChildNavigationCallbacks {
  const callbacks: NodeChildNavigationCallbacks = {
    onNavigateToFirstChild: () => {
      focusOn(refs.firstChild?.current)?.();
    },
    onNavigateToLastChild: () => {
      focusOn(refs.lastChild?.current)?.();
    },
  };
  return callbacks;
}

function focusOn(element?: HTMLElement): (() => void) | undefined {
  return (
    element &&
    (() => {
      element.focus();
    })
  );
}

export interface FieldDefinition {
  key: string;
  ref: React.RefObject<HTMLElement>;
}

export function createFieldNavigationCallbacks(
  fields: FieldDefinition[],
  selectedKey: string | null
): NodeFieldNavigationCallbacks {
  const currentIndex =
    selectedKey !== null ? fields.findIndex((field) => field.key === selectedKey) : -1;
  console.log("createFieldNavigationCallbacks", { fields, selectedKey, currentIndex });
  return {
    onNavigateToPreviousField: () => {
      console.log("onNavigateToPreviousField called", {
        fields: fields.length,
        currentIndex,
        selectedKey,
      });
      if (fields.length === 0) return;

      let targetIndex: number;
      if (currentIndex > 0) {
        // Move to previous field
        console.log("Moving to previous field");
        targetIndex = currentIndex - 1;
      } else {
        console.log("Wrapping to last field");
        // Wrap to last field
        targetIndex = fields.length - 1;
      }

      const targetField = fields[targetIndex];
      console.log("navigating to previous field", { targetIndex, targetKey: targetField.key });
      if (targetField.ref.current) {
        targetField.ref.current.focus();
      }
    },
    onNavigateToNextField: () => {
      console.log("onNavigateToNextField called", {
        fields: fields.length,
        currentIndex,
        selectedKey,
      });
      if (fields.length === 0) return;

      let targetIndex: number;
      if (currentIndex >= 0 && currentIndex < fields.length - 1) {
        // Move to next field
        targetIndex = currentIndex + 1;
      } else {
        // Wrap to first field
        targetIndex = 0;
      }

      const targetField = fields[targetIndex];
      console.log("navigating to next field", { targetIndex, targetKey: targetField.key });
      if (targetField.ref.current) {
        targetField.ref.current.focus();
      }
    },
  };
}
