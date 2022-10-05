export interface ErrorDetail {
  source: string;
  code?: number;
  type: string;
  message: string;
}

export interface BuildInputError {
  _isBuildInputError: true;

  projectWideErrors: ErrorDetail[];
  fileSpecificErrors: {
    [uri: string]: Array<{
      startOffset?: number;
      endOffset?: number;
      error: ErrorDetail;
    }>;
  };
}
