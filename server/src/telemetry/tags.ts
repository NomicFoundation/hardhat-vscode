import { setTag, Span } from "@sentry/core";
import { Project } from "../frameworks/base/Project";

export function addFrameworkTag(project: Project, span?: Span) {
  if (span !== undefined) {
    span.setAttributes({
      ...frameworkTag(project),
    });
  } else {
    setTag("framework", project.frameworkName());
  }
}

export function frameworkTag(project: Project) {
  return { framework: project.frameworkName() };
}
