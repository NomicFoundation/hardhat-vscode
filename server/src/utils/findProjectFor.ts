import { NoProject } from "@analyzer/NoProject";
import { ISolProject, SolProjectMap } from "@common/types";

const noProj = new NoProject();

export function findProjectFor(
  { projects }: { projects: SolProjectMap },
  uri: string
): ISolProject {
  for (const project of Object.values(projects)) {
    if (uri.startsWith(project.basePath)) {
      return project;
    }
  }

  return noProj;
}
