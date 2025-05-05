export interface ErrorDetail {
  source: string;
  code?: number;
  type: string;
  message: string;
}

export interface FileSpecificError {
  startOffset?: number;
  endOffset?: number;
  error: ErrorDetail;
}

export interface BuildInputError {
  _isBuildInputError: true;

  projectWideErrors: ErrorDetail[];
  fileSpecificErrors: {
    [uri: string]: FileSpecificError[];
  };
}

export interface InitializationFailedError {
  _isInitializationFailedError: true;

  error: string;
}
