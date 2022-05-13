import { SolFileIndexMap, ISolProject } from "@common/types";

export interface ProjectContext {
  project: ISolProject;
  solFileIndex: SolFileIndexMap;
}
