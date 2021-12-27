import {CompletionItemKind} from "@common/types";

const elementaryTypeNames = ["address", "bool", "string", "var"];
const ints = [
  "int",
  "int8",
  "int16",
  "int24",
  "int32",
  "int40",
  "int48",
  "int56",
  "int64",
  "int72",
  "int80",
  "int88",
  "int96",
  "int104",
  "int112",
  "int120",
  "int128",
  "int136",
  "int144",
  "int152",
  "int160",
  "int168",
  "int176",
  "int184",
  "int192",
  "int200",
  "int208",
  "int216",
  "int224",
  "int232",
  "int240",
  "int248",
  "int256",
];
const uints = [
  "uint",
  "uint8",
  "uint16",
  "uint24",
  "uint32",
  "uint40",
  "uint48",
  "uint56",
  "uint64",
  "uint72",
  "uint80",
  "uint88",
  "uint96",
  "uint104",
  "uint112",
  "uint120",
  "uint128",
  "uint136",
  "uint144",
  "uint152",
  "uint160",
  "uint168",
  "uint176",
  "uint184",
  "uint192",
  "uint200",
  "uint208",
  "uint216",
  "uint224",
  "uint232",
  "uint240",
  "uint248",
  "uint256",
];
const bytes = [
  "byte",
  "bytes",
  "bytes1",
  "bytes2",
  "bytes3",
  "bytes4",
  "bytes5",
  "bytes6",
  "bytes7",
  "bytes8",
  "bytes9",
  "bytes10",
  "bytes11",
  "bytes12",
  "bytes13",
  "bytes14",
  "bytes15",
  "bytes16",
  "bytes17",
  "bytes18",
  "bytes19",
  "bytes20",
  "bytes21",
  "bytes22",
  "bytes23",
  "bytes24",
  "bytes25",
  "bytes26",
  "bytes27",
  "bytes28",
  "bytes29",
  "bytes30",
  "bytes31",
  "bytes32",
];
const fixed = "fixed";
const ufixed = "ufixed";

const functionVisibilitySpecifiers = [
  "public",
  "private",
  "external",
  "internal",
];
const modifiers = [
  "pure",
  "view",
  "payable",
  "constant",
  "immutable",
  "anonymous",
  "indexed",
  "virtual",
  "override",
];
const reservedKeywords = [
  "after",
  "alias",
  "apply",
  "auto",
  "case",
  "copyof",
  "default",
  "define",
  "final",
  "immutable",
  "implements",
  "in",
  "inline",
  "let",
  "macro",
  "match",
  "mutable",
  "null",
  "of",
  "partial",
  "promise",
  "return",
  "reference",
  "relocatable",
  "sealed",
  "sizeof",
  "static",
  "supports",
  "switch",
  "typedef",
  "typeof",
  "unchecked",
];
const statements = ["assert", "revert", "require"];

const globalFunctions = [
  "gasleft",
  "blockhash",
  "keccak256",
  "sha256",
  "ripemd160",
  "ecrecover",
  "addmod",
  "mulmod",
  "selfdestruct",
];

type GlobalVariablesType = {[globalVariable: string]: string[]};
export const globalVariables: GlobalVariablesType = {
  abi: [
    "decode",
    "encode",
    "encodePacked",
    "encodeWithSelector",
    "encodeWithSignature",
    "encodeWithSelector",
  ],
  bytes: ["concat"],
  block: [
    "chainid",
    "coinbase",
    "difficulty",
    "gaslimit",
    "number",
    "timestamp",
  ],
  msg: ["data", "sender", "value"],
  tx: ["gasprice", "origin"],
};

export const defaultCompletion = [
  // --------------- Global Functions ---------------
  ...globalFunctions.map((globalFunction) => {
    return {
      label: globalFunction,
      kind: CompletionItemKind.Function,
    };
  }),

  // --------------- Global Variables ---------------
  ...Object.keys(globalVariables).map((globalVariable) => {
    return {
      label: globalVariable,
      kind: CompletionItemKind.Variable,
    };
  }),

  // --------------- Keywords ---------------
  ...functionVisibilitySpecifiers.map((functionVisibilitySpecifier) => {
    return {
      label: functionVisibilitySpecifier,
      kind: CompletionItemKind.Keyword,
    };
  }),
  ...modifiers.map((modifier) => {
    return {
      label: modifier,
      kind: CompletionItemKind.Keyword,
    };
  }),
  ...reservedKeywords.map((reservedKeyword) => {
    return {
      label: reservedKeyword,
      kind: CompletionItemKind.Keyword,
    };
  }),
  ...statements.map((statement) => {
    return {
      label: statement,
      kind: CompletionItemKind.Keyword,
    };
  }),

  ...elementaryTypeNames.map((elementaryTypeName) => {
    return {
      label: elementaryTypeName,
      kind: CompletionItemKind.Keyword,
    };
  }),
  ...ints.map((intType) => {
    return {
      label: intType,
      kind: CompletionItemKind.Keyword,
    };
  }),
  ...uints.map((uintType) => {
    return {
      label: uintType,
      kind: CompletionItemKind.Keyword,
    };
  }),
  ...bytes.map((byteType) => {
    return {
      label: byteType,
      kind: CompletionItemKind.Keyword,
    };
  }),
  {
    label: fixed,
    kind: CompletionItemKind.Keyword,
  },
  {
    label: ufixed,
    kind: CompletionItemKind.Keyword,
  },
];
