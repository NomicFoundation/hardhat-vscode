import { DocumentsAnalyzerMap, ISolProject } from "@common/types";

export type ProjectContext = {
  project: ISolProject;
  solFileIndex: DocumentsAnalyzerMap;
};
