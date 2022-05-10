import {
  isArrayTypeName,
  isCustomErrorDefinition,
  isElementaryTypeName,
  isEventDefinition,
  isFunctionDefinition,
  isMapping,
  isUserDefinedTypeName,
  isVariableDeclaration,
} from "@analyzer/utils/typeGuards";
import { EmptyNodeType } from "@common/types";
import {
  BaseASTNode,
  CustomErrorDefinition,
  EventDefinition,
  FunctionDefinition,
  ModifierInvocation,
  UserDefinedTypeName,
  VariableDeclaration,
} from "@solidity-parser/parser/dist/src/ast-types";

export function astToText(astNode: BaseASTNode | EmptyNodeType): string | null {
  if (isFunctionDefinition(astNode)) {
    return functionDefinitionToText(astNode);
  }

  if (isVariableDeclaration(astNode)) {
    return variableDeclarationToText(astNode);
  }

  if (isCustomErrorDefinition(astNode)) {
    return customErrorDefinitionToText(astNode);
  }

  if (isEventDefinition(astNode)) {
    return eventDefinitionToText(astNode);
  }

  return null;
}

export function variableDeclarationToText(variable: VariableDeclaration) {
  if (variable.typeName === null) {
    return null;
  }

  const typeText = resolveTypeTextFromAst(variable.typeName);

  if (typeText === null) {
    return null;
  }

  const visibility =
    variable.visibility === "default" ? null : variable.visibility;

  const constant = variable.isDeclaredConst === true ? "constant" : null;

  const storageLocation = variable.storageLocation;

  const identifierName = variable.name;

  const hoverText = [
    typeText,
    visibility,
    constant,
    storageLocation,
    identifierName,
  ]
    .filter((text: string | null | undefined): text is string => Boolean(text))
    .map((text) => text.trim())
    .join(" ");

  return hoverText;
}

export function customErrorDefinitionToText(
  customErrorDefinition: CustomErrorDefinition
): string | null {
  const params = parameterListToText(customErrorDefinition.parameters);

  return `error ${customErrorDefinition.name}${params ?? "()"}`;
}

export function eventDefinitionToText(
  eventDefinition: EventDefinition
): string | null {
  const params = parameterListToText(eventDefinition.parameters);

  return `event ${eventDefinition.name}${params ?? "()"}`;
}

export function functionDefinitionToText(
  astFunctionDef: FunctionDefinition
): string | null {
  const introKeyword = astFunctionDef.isConstructor
    ? "constructor"
    : "function";

  const functionName = astFunctionDef.name;
  const params = parameterListToText(astFunctionDef.parameters);
  const paramsList = `${functionName}${params ?? "()"}`;

  const visibility =
    astFunctionDef.visibility === "default" ? null : astFunctionDef.visibility;

  const mutability = astFunctionDef.stateMutability;

  const virtual = astFunctionDef.isVirtual ? "virtual" : null;

  const override = overrideToText(astFunctionDef.override);

  const modifierList = astFunctionDef.modifiers.map((m) =>
    modifierInvocationToText(m)
  );

  const returns = parameterListToText(astFunctionDef.returnParameters);
  const returnsList = returns === null ? null : `returns ${returns}`;

  const hoverText = [
    introKeyword, // what about constructor
    paramsList,
    visibility,
    mutability,
    virtual,
    override,
    ...modifierList,
    returnsList,
  ]
    .filter(
      (text: string | null | undefined): text is string =>
        text !== null && text !== undefined
    )
    .map((text) => (text === " " ? " " : text.trim()))
    .join(" ");

  return hoverText;
}

function overrideToText(overrides: UserDefinedTypeName[] | null) {
  if (overrides === null) {
    return null;
  }

  if (overrides.length === 0) {
    return "override";
  }

  const names = overrides.map((o) => o.namePath);

  return `override(${names.join(", ")})`;
}

function modifierInvocationToText(
  invocation: ModifierInvocation
): string | null {
  if (invocation.arguments === null) {
    return invocation.name;
  }

  // TODO: display the arguments
  return invocation.name;
}

function parameterListToText(parameterList: VariableDeclaration[] | null) {
  if (parameterList === null || parameterList.length === 0) {
    return null;
  }

  const params = parameterList.map((p) => variableDeclarationToText(p));

  return `(${params.join(", ")})`;
}

export function resolveTypeTextFromAst(
  typeAstNode: BaseASTNode | EmptyNodeType
): string | null {
  if (isElementaryTypeName(typeAstNode)) {
    return typeAstNode.name ?? null;
  }

  if (isUserDefinedTypeName(typeAstNode)) {
    return typeAstNode.namePath ?? null;
  }

  if (isArrayTypeName(typeAstNode)) {
    const baseTypeText = resolveTypeTextFromAst(typeAstNode.baseTypeName);
    return `${baseTypeText}[]`;
  }

  if (isMapping(typeAstNode)) {
    const keyText = resolveTypeTextFromAst(typeAstNode.keyType);
    const valueText = resolveTypeTextFromAst(typeAstNode.valueType);

    if (keyText === null || valueText === null) {
      return "mapping";
    }

    return `mapping(${keyText} => ${valueText})`;
  }

  return null;
}
