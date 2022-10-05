import { SolFileIndexMap } from "@common/types";
import { Project } from "../../frameworks/base/Project";

export interface ProjectContext {
  project: Project;
  solFileIndex: SolFileIndexMap;
}
