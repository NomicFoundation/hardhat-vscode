/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenDocuments } from "../../../types";
import { CompilationDetails } from "../../base/CompilationDetails";
import { FileBelongsResult } from "../../base/Project";
import { LogLevel } from "./WorkerLogger";

export enum MessageType {
  INITIALIZED,
  LOG,
  ERROR_RESPONSE,
  FILE_BELONGS_REQUEST,
  FILE_BELONGS_RESPONSE,
  RESOLVE_IMPORT_REQUEST,
  RESOLVE_IMPORT_RESPONSE,
  BUILD_COMPILATION_REQUEST,
  BUILD_COMPILATION_RESPONSE,
  INITIALIZATION_FAILURE,
  INVALIDATE_BUILD_CACHE,
}

export abstract class Message {
  public abstract type: MessageType;
}

export abstract class RequestMessage extends Message {
  constructor(public requestId: number) {
    super();
  }
}

export abstract class ResponseMessage extends Message {
  constructor(public requestId: number) {
    super();
  }
}

export class ErrorResponseMessage extends ResponseMessage {
  public type = MessageType.ERROR_RESPONSE;

  constructor(
    requestId: number,
    public error: any
  ) {
    super(requestId);
  }
}

export class InitializedMessage extends Message {
  public type = MessageType.INITIALIZED;
}

export class LogMessage extends Message {
  public type = MessageType.LOG;

  constructor(
    public logMessage: string,
    public level: LogLevel
  ) {
    super();
  }
}

export class FileBelongsRequest extends RequestMessage {
  public type = MessageType.FILE_BELONGS_REQUEST;

  constructor(
    requestId: number,
    public uri: string
  ) {
    super(requestId);
  }
}

export class FileBelongsResponse extends ResponseMessage {
  public type = MessageType.FILE_BELONGS_RESPONSE;
  constructor(
    requestId: number,
    public result: FileBelongsResult
  ) {
    super(requestId);
  }
}

export class ResolveImportRequest extends RequestMessage {
  public type = MessageType.RESOLVE_IMPORT_REQUEST;

  constructor(
    requestId: number,
    public from: string,
    public importPath: string,
    public projectBasePath: string
  ) {
    super(requestId);
  }
}

export class ResolveImportResponse extends ResponseMessage {
  public type = MessageType.RESOLVE_IMPORT_RESPONSE;
  constructor(
    requestId: number,
    public path: string | undefined
  ) {
    super(requestId);
  }
}

export class BuildCompilationRequest extends RequestMessage {
  public type = MessageType.BUILD_COMPILATION_REQUEST;
  constructor(
    requestId: number,
    public sourceUri: string,
    public openDocuments: OpenDocuments
  ) {
    super(requestId);
  }
}

export class BuildCompilationResponse extends ResponseMessage {
  public type = MessageType.BUILD_COMPILATION_RESPONSE;
  constructor(
    requestId: number,
    public compilationDetails: CompilationDetails
  ) {
    super(requestId);
  }
}

export class InitializationFailureMessage extends Message {
  public type = MessageType.INITIALIZATION_FAILURE;

  constructor(public reason: string) {
    super();
  }
}

export class InvalidateBuildCacheMessage extends Message {
  public type = MessageType.INVALIDATE_BUILD_CACHE;

  constructor() {
    super();
  }
}
