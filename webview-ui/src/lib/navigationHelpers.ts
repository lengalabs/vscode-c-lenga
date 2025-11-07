import React from "react";
import { NodeParentNavigationCallbacks } from "./keyBinds";

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

export function createParentNativationCallbacks(refs: ParentRefs): NodeParentNavigationCallbacks {
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

function focusOn(element?: HTMLElement): (() => void) | undefined {
  return (
    element &&
    (() => {
      element.focus();
    })
  );
}
