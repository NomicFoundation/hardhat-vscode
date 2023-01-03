import { Transaction } from "@sentry/types";
import { Project } from "../frameworks/base/Project";

export function addFrameworkTag(transaction: Transaction, project: Project) {
  transaction.tags = {
    ...(transaction.tags ?? {}),
    ...frameworkTag(project),
  };
}

export function frameworkTag(project: Project) {
  return { framework: project.frameworkName() };
}
