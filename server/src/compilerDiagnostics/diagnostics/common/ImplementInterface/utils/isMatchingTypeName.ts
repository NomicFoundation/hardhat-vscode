import {
  TypeName,
  ElementaryTypeName,
  UserDefinedTypeName,
  Mapping,
  ArrayTypeName,
  FunctionTypeName,
} from "@common/types";

/**
 * Perform value equality on the AST node for TypeNames.
 *
 * e.g. `function x() returns (uint120 result)` the `unint120
 * would be parsed as a TypeName in the solidity-parser ast.
 * @param leftTypeName - a type name ast node
 * @param rightTypeName - a type name ast node
 * @returns whether they match in shape, type and subtype
 */
export function isMatchingTypeName(
  leftTypeName: TypeName,
  rightTypeName: TypeName
): boolean {
  if (leftTypeName.type !== rightTypeName.type) {
    return false;
  }

  if (isElementaryTypeName(leftTypeName)) {
    if (!isElementaryTypeName(rightTypeName)) {
      return false;
    }

    return leftTypeName.name === rightTypeName.name;
  }

  if (isUserDefinedTypeName(leftTypeName)) {
    if (!isUserDefinedTypeName(rightTypeName)) {
      return false;
    }

    return leftTypeName.namePath === rightTypeName.namePath;
  }

  if (isMapping(leftTypeName)) {
    if (!isMapping(rightTypeName)) {
      return false;
    }

    return (
      isMatchingTypeName(leftTypeName.keyType, rightTypeName.keyType) &&
      isMatchingTypeName(leftTypeName.valueType, rightTypeName.valueType)
    );
  }

  if (isArrayTypeName(leftTypeName)) {
    if (!isArrayTypeName(rightTypeName)) {
      return false;
    }

    return isMatchingTypeName(
      leftTypeName.baseTypeName,
      rightTypeName.baseTypeName
    );
  }

  if (isFunctionTypeName(leftTypeName)) {
    if (!isFunctionTypeName(rightTypeName)) {
      return false;
    }

    const allParameterTypesMatch =
      leftTypeName.parameterTypes.length ===
        rightTypeName.parameterTypes.length &&
      leftTypeName.parameterTypes.every((leftParamType, i) => {
        const rightParamType = rightTypeName.parameterTypes[i];
        return (
          leftParamType.typeName &&
          rightParamType.typeName &&
          isMatchingTypeName(leftParamType.typeName, rightParamType.typeName)
        );
      });

    const allReturnTypesMatch =
      leftTypeName.returnTypes.length === rightTypeName.returnTypes.length &&
      leftTypeName.returnTypes.every((leftReturnType, i) => {
        const rightReturnType = rightTypeName.returnTypes[i];
        return (
          leftReturnType.typeName &&
          rightReturnType.typeName &&
          isMatchingTypeName(leftReturnType.typeName, rightReturnType.typeName)
        );
      });

    return allParameterTypesMatch && allReturnTypesMatch;
  }

  return throwOnUnknownTypeName(leftTypeName);
}

function isElementaryTypeName(
  typeName: TypeName
): typeName is ElementaryTypeName {
  return typeName.type === "ElementaryTypeName";
}

function isUserDefinedTypeName(
  typeName: TypeName
): typeName is UserDefinedTypeName {
  return typeName.type === "UserDefinedTypeName";
}

function isMapping(typeName: TypeName): typeName is Mapping {
  return typeName.type === "Mapping";
}

function isArrayTypeName(typeName: TypeName): typeName is ArrayTypeName {
  return typeName.type === "ArrayTypeName";
}

function isFunctionTypeName(typeName: TypeName): typeName is FunctionTypeName {
  return typeName.type === "FunctionTypeName";
}

function throwOnUnknownTypeName(typeName: never): boolean {
  throw new Error(`Unknown type name ${typeName}`);
}
