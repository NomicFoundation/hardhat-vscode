import { DocumentsAnalyzerMap } from "@common/types";

export type ProjectContext = {
  projectBasePath: string;
  solFileIndex: DocumentsAnalyzerMap;
};
