import { TextDocument, Diagnostic } from "@common/types";

export type validationJobOptions = {
  isCompilerDownloaded: boolean;
};

export interface ValidationJob {
  run(
    uri: string,
    document: TextDocument,
    unsavedDocuments: TextDocument[]
  ): Promise<{ [uri: string]: Diagnostic[] }>;
  close(): void;
}
