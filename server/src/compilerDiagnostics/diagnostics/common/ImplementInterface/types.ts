/**
 * Types for ImplementInterface code action.
 */

/** Contract info extracted from CST + BindingGraph */
export interface ContractInfo {
  /** Unique identifier: "uri::name" */
  id: string;
  /** Contract/interface name */
  name: string;
  /** File URI */
  uri: string;
  /** Recursively resolved parent contracts/interfaces */
  parents: ContractInfo[];
  /** Functions extracted from CST */
  functions: FunctionInfo[];
  /** Character offsets in file [start, end) */
  charRange: [number, number];
}

/** Function info extracted from CST */
export interface FunctionInfo {
  /** Function name (null for receive/fallback) */
  name: string | null;
  /** Normalized type text per param (for matching) */
  paramTypeTexts: string[];
  /**
   * Parameter list text, including the surrounding parentheses — e.g.
   * `(uint256 a, mapping(uint => uint) m)`. Pulled directly from the
   * parameters AST node's CST; consumers don't have to round-trip through
   * a larger signature string.
   */
  paramListText: string;
  /** "public" | "external" | "internal" | "private" | null */
  visibility: string | null;
  /** "pure" | "view" | "payable" | null */
  mutability: string | null;
  /** false = abstract (semicolon body) */
  hasBody: boolean;
  /** Return type text (for code generation) */
  returnsText: string | null;
  /** Whether function is marked virtual */
  isVirtual: boolean;
}

export interface ContractIdToInfoMapping {
  [key: string]: ContractInfo;
}

export interface InheritanceLookupTable {
  [key: string]: string[];
}

export interface LinearizationContext {
  linearizations: { [key: string]: string[] };
  contracts: ContractIdToInfoMapping;
}

export interface FunctionRecord {
  definition: FunctionInfo;
  implementedIn: string[];
}
