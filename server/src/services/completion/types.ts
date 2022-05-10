import { DocumentsAnalyzerMap, ISolProject } from "@common/types";

export interface ProjectContext {
  project: ISolProject;
  solFileIndex: DocumentsAnalyzerMap;
}
