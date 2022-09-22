import { ISolProject } from "@common/types";
import path from "path";
import ProjectlessProject from "../projects/Projectless/ProjectlessProject";
import { ServerState } from "../types";

export function findProjectFor(
  serverState: ServerState,
  uri: string
): ISolProject {
  for (const project of Object.values(serverState.projects)) {
    if (uri.startsWith(project.basePath)) {
      return project;
    }
  }

  return new ProjectlessProject(serverState, path.dirname(uri));
}
