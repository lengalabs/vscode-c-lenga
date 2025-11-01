import { describe, it, expect } from "vitest";
import { findDeclarationsInScope } from "./findDeclarations";
import * as objects from "../../../src/language_objects/cNodes";
import { buildMaps, ParentInfo } from "../components/context";

// Helper to create a parent map from nodes
function buildParentMap(node: objects.SourceFile): Map<string, ParentInfo> {
  const { parentMap } = buildMaps(node);
  return parentMap;
}

describe("findDeclarationsInScope", () => {
  it("should find global declarations before reference position", () => {
    // int x;
    // int y;
    // void foo() {
    //   x; <- reference here
    // }
    // int z;
    const decl1: objects.Declaration = {
      id: "decl1",
      type: "declaration",
      primitiveType: "int",
      identifier: "x",
    };

    const decl2: objects.Declaration = {
      id: "decl2",
      type: "declaration",
      primitiveType: "int",
      identifier: "y",
    };

    const reference: objects.Reference = {
      id: "ref1",
      type: "reference",
      declarationId: "decl1",
      identifier: "x",
    };

    const compoundStmt: objects.CompoundStatement = {
      id: "compound1",
      type: "compoundStatement",
      codeBlock: [reference],
    };

    const funcDef: objects.FunctionDefinition = {
      id: "func1",
      type: "functionDefinition",
      returnType: "void",
      identifier: "foo",
      parameterList: [],
      compoundStatement: compoundStmt,
    };

    const decl3: objects.Declaration = {
      id: "decl3",
      type: "declaration",
      primitiveType: "int",
      identifier: "z",
    };

    const sourceFile: objects.SourceFile = {
      id: "source",
      type: "sourceFile",
      code: [decl1, decl2, funcDef, decl3],
    };

    const parentMap = buildParentMap(sourceFile);

    const result = findDeclarationsInScope(reference, parentMap);

    expect(result.map((d) => d.identifier)).toContain("x");
    expect(result.map((d) => d.identifier)).toContain("y");
    expect(result.map((d) => d.identifier)).toContain("foo");
    expect(result.map((d) => d.identifier)).not.toContain("z");
  });

  it("should find function declarations before reference position", () => {
    // void foo();
    // void bar();
    // void test() {
    //   foo(); <- reference here
    // }
    // void baz();
    const funcDecl1: objects.FunctionDeclaration = {
      id: "func1",
      type: "functionDeclaration",
      returnType: "void",
      identifier: "foo",
      parameterList: [],
    };

    const funcDecl2: objects.FunctionDeclaration = {
      id: "func2",
      type: "functionDeclaration",
      returnType: "void",
      identifier: "bar",
      parameterList: [],
    };

    const reference: objects.Reference = {
      id: "ref1",
      type: "reference",
      declarationId: "func1",
      identifier: "foo",
    };

    const compoundStmt: objects.CompoundStatement = {
      id: "compound1",
      type: "compoundStatement",
      codeBlock: [reference],
    };

    const funcDefTest: objects.FunctionDefinition = {
      id: "funcTest",
      type: "functionDefinition",
      returnType: "void",
      identifier: "test",
      parameterList: [],
      compoundStatement: compoundStmt,
    };

    const funcDecl3: objects.FunctionDeclaration = {
      id: "func3",
      type: "functionDeclaration",
      returnType: "void",
      identifier: "baz",
      parameterList: [],
    };

    const sourceFile: objects.SourceFile = {
      id: "source",
      type: "sourceFile",
      code: [funcDecl1, funcDecl2, funcDefTest, funcDecl3],
    };

    const parentMap = buildParentMap(sourceFile);

    const result = findDeclarationsInScope(reference, parentMap);

    expect(result.map((d) => d.identifier)).toContain("foo");
    expect(result.map((d) => d.identifier)).toContain("bar");
    expect(result.map((d) => d.identifier)).toContain("test");
    expect(result.map((d) => d.identifier)).not.toContain("baz");
  });

  it("should find function parameters inside function body", () => {
    // void foo(int x, int y) {
    //   x; <- reference here
    // }
    const param1: objects.FunctionParameter = {
      id: "param1",
      type: "functionParameter",
      paramType: "int",
      identifier: "x",
    };

    const param2: objects.FunctionParameter = {
      id: "param2",
      type: "functionParameter",
      paramType: "int",
      identifier: "y",
    };

    const reference: objects.Reference = {
      id: "ref1",
      type: "reference",
      declarationId: "param1",
      identifier: "x",
    };

    const compoundStmt: objects.CompoundStatement = {
      id: "compound1",
      type: "compoundStatement",
      codeBlock: [reference],
    };

    const funcDef: objects.FunctionDefinition = {
      id: "func1",
      type: "functionDefinition",
      returnType: "void",
      identifier: "foo",
      parameterList: [param1, param2],
      compoundStatement: compoundStmt,
    };

    const sourceFile: objects.SourceFile = {
      id: "source",
      type: "sourceFile",
      code: [funcDef],
    };

    const parentMap = buildParentMap(sourceFile);

    const result = findDeclarationsInScope(reference, parentMap);

    // Should find both parameters and the function itself
    expect(result.length).toBeGreaterThanOrEqual(2);
    expect(result.map((d) => d.identifier)).toContain("x");
    expect(result.map((d) => d.identifier)).toContain("y");
  });

  it("should find local declarations before reference in same scope", () => {
    // void foo() {
    //   int x;
    //   int y;
    //   x; <- reference here
    //   int z;
    // }
    const decl1: objects.Declaration = {
      id: "decl1",
      type: "declaration",
      primitiveType: "int",
      identifier: "x",
    };

    const decl2: objects.Declaration = {
      id: "decl2",
      type: "declaration",
      primitiveType: "int",
      identifier: "y",
    };

    const reference: objects.Reference = {
      id: "ref1",
      type: "reference",
      declarationId: "decl1",
      identifier: "x",
    };

    const decl3: objects.Declaration = {
      id: "decl3",
      type: "declaration",
      primitiveType: "int",
      identifier: "z",
    };

    const compoundStmt: objects.CompoundStatement = {
      id: "compound1",
      type: "compoundStatement",
      codeBlock: [decl1, decl2, reference, decl3],
    };

    const funcDef: objects.FunctionDefinition = {
      id: "func1",
      type: "functionDefinition",
      returnType: "void",
      identifier: "foo",
      parameterList: [],
      compoundStatement: compoundStmt,
    };

    const sourceFile: objects.SourceFile = {
      id: "source",
      type: "sourceFile",
      code: [funcDef],
    };

    const parentMap = buildParentMap(sourceFile);

    const result = findDeclarationsInScope(reference, parentMap);

    expect(result.map((d) => d.identifier)).toContain("x");
    expect(result.map((d) => d.identifier)).toContain("y");
    expect(result.map((d) => d.identifier)).not.toContain("z");
  });

  it("should find declarations from outer scopes", () => {
    // int global;
    // void foo(int param) {
    //   int local;
    //   {
    //     global; <- reference here should see global, param, and local
    //   }
    // }
    const globalDecl: objects.Declaration = {
      id: "global",
      type: "declaration",
      primitiveType: "int",
      identifier: "global",
    };

    const param: objects.FunctionParameter = {
      id: "param",
      type: "functionParameter",
      paramType: "int",
      identifier: "param",
    };

    const localDecl: objects.Declaration = {
      id: "local",
      type: "declaration",
      primitiveType: "int",
      identifier: "local",
    };

    const reference: objects.Reference = {
      id: "ref1",
      type: "reference",
      declarationId: "global",
      identifier: "global",
    };

    const innerCompound: objects.CompoundStatement = {
      id: "inner",
      type: "compoundStatement",
      codeBlock: [reference],
    };

    const outerCompound: objects.CompoundStatement = {
      id: "outer",
      type: "compoundStatement",
      codeBlock: [localDecl, innerCompound],
    };

    const funcDef: objects.FunctionDefinition = {
      id: "func1",
      type: "functionDefinition",
      returnType: "void",
      identifier: "foo",
      parameterList: [param],
      compoundStatement: outerCompound,
    };

    const sourceFile: objects.SourceFile = {
      id: "source",
      type: "sourceFile",
      code: [globalDecl, funcDef],
    };

    const parentMap = buildParentMap(sourceFile);

    const result = findDeclarationsInScope(reference, parentMap);

    expect(result.map((d) => d.identifier)).toContain("global");
    expect(result.map((d) => d.identifier)).toContain("param");
    expect(result.map((d) => d.identifier)).toContain("local");
  });

  it("should not include duplicate identifiers", () => {
    // int x;
    // int x; <- shadowing
    // void test() {
    //   x; <- reference (should only have one 'x' in results)
    // }
    const decl1: objects.Declaration = {
      id: "decl1",
      type: "declaration",
      primitiveType: "int",
      identifier: "x",
    };

    const decl2: objects.Declaration = {
      id: "decl2",
      type: "declaration",
      primitiveType: "int",
      identifier: "x",
    };

    const reference: objects.Reference = {
      id: "ref1",
      type: "reference",
      declarationId: "decl2",
      identifier: "x",
    };

    const compoundStmt: objects.CompoundStatement = {
      id: "compound1",
      type: "compoundStatement",
      codeBlock: [reference],
    };

    const funcDef: objects.FunctionDefinition = {
      id: "func1",
      type: "functionDefinition",
      returnType: "void",
      identifier: "test",
      parameterList: [],
      compoundStatement: compoundStmt,
    };

    const sourceFile: objects.SourceFile = {
      id: "source",
      type: "sourceFile",
      code: [decl1, decl2, funcDef],
    };

    const parentMap = buildParentMap(sourceFile);

    const result = findDeclarationsInScope(reference, parentMap);

    // Should only have one 'x' (deduplication)
    const xDecls = result.filter((d) => d.identifier === "x");
    expect(xDecls).toHaveLength(1);
  });

  it("should find function definitions", () => {
    // void foo() {
    // }
    // void bar() {
    //  foo(); <- reference here
    // }
    // void baz() {
    // }

    const funcDef1: objects.FunctionDefinition = {
      id: "func1",
      type: "functionDefinition",
      returnType: "void",
      identifier: "foo",
      parameterList: [],
      compoundStatement: {
        id: "compound1",
        type: "compoundStatement",
        codeBlock: [],
      },
    };

    const funcDef2: objects.FunctionDefinition = {
      id: "func2",
      type: "functionDefinition",
      returnType: "void",
      identifier: "bar",
      parameterList: [],
      compoundStatement: {
        id: "compound2",
        type: "compoundStatement",
        codeBlock: [],
      },
    };

    const reference: objects.Reference = {
      id: "ref1",
      type: "reference",
      declarationId: "func1",
      identifier: "foo",
    };

    funcDef2.compoundStatement.codeBlock.push(reference);

    const funcDef3: objects.FunctionDefinition = {
      id: "func3",
      type: "functionDefinition",
      returnType: "void",
      identifier: "baz",
      parameterList: [],
      compoundStatement: {
        id: "compound3",
        type: "compoundStatement",
        codeBlock: [],
      },
    };

    const sourceFile: objects.SourceFile = {
      id: "source",
      type: "sourceFile",
      code: [funcDef1, funcDef2, funcDef3],
    };

    const parentMap = buildParentMap(sourceFile);

    const result = findDeclarationsInScope(reference, parentMap);

    expect(result.map((d) => d.identifier)).toContain("foo");
    expect(result.map((d) => d.identifier)).toContain("bar");
    expect(result.map((d) => d.identifier)).not.toContain("baz");
  });
});
