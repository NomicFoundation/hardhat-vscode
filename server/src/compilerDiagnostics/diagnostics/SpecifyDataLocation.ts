/* eslint-disable @typescript-eslint/no-non-null-assertion */
import {
  CodeAction,
  CodeActionKind,
  Diagnostic,
  Range,
} from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import _ from "lodash";
import { ResolveActionsContext } from "../types";
import { SolcError, ServerState } from "../../types";
import { passThroughConversion } from "../conversions/passThroughConversion";

const MUST_SPECIFY_LOCATION_REGEX = /must be(.*)for/;
const CANNOT_SPECIFY_REGEX = /can only be specified for/;
const DATA_LOCATION_REGEX = /storage|memory|calldata/g;
const DATA_LOCATION_WHITESPACE_REGEX = /(storage|memory|calldata)(\s|$)/g;

export class SpecifyDataLocation {
  public code = "6651";
  public blocks: string[] = [];

  public fromHardhatCompilerError(
    document: TextDocument,
    error: SolcError
  ): Diagnostic {
    return passThroughConversion(document, error);
  }

  public resolveActions(
    serverState: ServerState,
    diagnostic: Diagnostic,
    context: ResolveActionsContext
  ): CodeAction[] {
    const { document, uri } = context;

    if (MUST_SPECIFY_LOCATION_REGEX.test(diagnostic.message)) {
      // A variable declaration didn't specify data location and it should (e.g. arrays)
      // Build a list of valid locations and sort by custom criteria (most frequent first)
      const allowedLocations = this._getAllowedLocationsFromMessage(
        diagnostic.message
      ).sort(
        (a, b) =>
          this._getLocationSortWeight(a) - this._getLocationSortWeight(b)
      );

      return allowedLocations.map((location) =>
        this._buildAddLocationAction(location, document, uri, diagnostic.range)
      );
    } else if (CANNOT_SPECIFY_REGEX.test(diagnostic.message)) {
      // A variable declaration specified data location and it shouldn't (e.g. an integer)
      return [this._buildRemoveLocationAction(document, uri, diagnostic.range)];
    } else {
      throw new Error(
        `Unexpected ${this.code} error message: ${diagnostic.message}`
      );
    }
  }

  private _getAllowedLocationsFromMessage(message: string) {
    const allowedLocationSubstring = message.match(MUST_SPECIFY_LOCATION_REGEX);

    return allowedLocationSubstring![1].match(DATA_LOCATION_REGEX) ?? [];
  }

  private _buildAddLocationAction(
    location: string,
    document: TextDocument,
    uri: string,
    range: Range
  ): CodeAction {
    // Find the declaration text, e.g. 'uint[] foo'
    const variableDeclaration = document.getText(range);

    // Remove any potential existing data location
    const normalizedVariableDeclaration =
      this._removeDataLocationFromDeclaration(variableDeclaration);

    // Split into array of words by whitespaces
    const tokens = normalizedVariableDeclaration.split(/\s+/);

    // Add data location after type
    const type = tokens.shift();
    const newDeclaration = [type, location, ...tokens].join(" ");

    return {
      title: `Specify '${location}' as data location`,
      kind: CodeActionKind.QuickFix,
      isPreferred: false,
      edit: {
        changes: {
          [uri]: [
            {
              range,
              newText: newDeclaration,
            },
          ],
        },
      },
    };
  }

  private _buildRemoveLocationAction(
    document: TextDocument,
    uri: string,
    range: Range
  ): CodeAction {
    // Find the declaration text, e.g. 'uint[] foo'
    const variableDeclaration = document.getText(range);

    // Remove any potential existing data location
    const normalizedVariableDeclaration =
      this._removeDataLocationFromDeclaration(variableDeclaration);

    // Replace multiple whitespaces with single ones
    const newDeclaration = normalizedVariableDeclaration.replace(/\s+/g, " ");

    return {
      title: `Remove specified data location`,
      kind: CodeActionKind.QuickFix,
      isPreferred: false,
      edit: {
        changes: {
          [uri]: [
            {
              range,
              newText: newDeclaration,
            },
          ],
        },
      },
    };
  }

  private _removeDataLocationFromDeclaration(declaration: string): string {
    return declaration.replace(DATA_LOCATION_WHITESPACE_REGEX, "");
  }

  // We want the most frequent options to be at the top
  private _getLocationSortWeight(location: string) {
    switch (location) {
      case "memory":
        return 0;
      case "storage":
        return 1;
      case "calldata":
        return 2;
      default:
        return 3;
    }
  }
}
