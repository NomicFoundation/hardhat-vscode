/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable no-console */
import path from "path";
import fs from "fs";

// whitelist templates to process
const relativeTemplatePaths = [
  "../client/README.template.md",
  "../coc/README.template.md",
  "../server/README.template.md",
];

// get templates' absolute paths
const templatePaths = relativeTemplatePaths.map((p) =>
  path.resolve(__dirname, p)
);

// generate interpolated file for each template
for (const templatePath of templatePaths) {
  try {
    generateFile(templatePath);
  } catch (error) {
    console.log(`Error while processing ${templatePath}: ${error}`);
  }
}

function generateFile(templatePath: string) {
  console.log(`Processing template ${templatePath}`);

  // read template content
  let templateContent = fs.readFileSync(templatePath).toString();

  // find all import statements inside the template
  const regex = /\[include '.+'\]/g;
  const importStatements = templateContent.match(regex) ?? [];

  // replace import statements with imported file's content
  for (const importStatement of importStatements) {
    const importedRelativePath = importStatement.match(/'(.+)'/)![1];
    const importedPath = path.resolve(
      path.dirname(templatePath),
      importedRelativePath
    );
    console.log(`  Importing ${importedRelativePath}`);
    const importedContent = fs.readFileSync(importedPath).toString();

    templateContent = templateContent.replace(importStatement, importedContent);
  }

  // create an interpolated file with the final content (foo.template.md => foo.md)
  const interpolatedFilePath = templatePath.replace(/\.template\.md$/i, ".md");
  fs.writeFileSync(interpolatedFilePath, templateContent);

  console.log(`  Wrote ${interpolatedFilePath}`);
}
