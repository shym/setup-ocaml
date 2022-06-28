import * as core from "@actions/core";
import * as path from "path";

import { getOpamLocalPackages, getOpamPackageVersion } from "./opam";
import type { OpamPackage } from "./opam-detector";
import { getDependencies } from "./opam-detector";
import { submit } from "./submission";

export async function analysis(): Promise<void> {
  const ppaths = await getOpamLocalPackages();
  if (ppaths.length > 0) {
    for (const ppath of ppaths) {
      const { name: pname } = path.parse(ppath);
      const githubWorkspace = process.env["GITHUB_WORKSPACE"] ?? process.cwd();
      const opamPackagePath = path.normalize(
        path.relative(githubWorkspace, ppath)
      );
      core.startGroup("Calculate dependencies for a opam build-target");
      const dependencies = await getDependencies(pname);
      for (const dependency of dependencies) {
        const dependencies = await getDependencies(dependency.name);
        dependency.dependencies = dependencies;
      }
      core.endGroup();
      core.startGroup(
        "Submits the dependencies list to the Dependency Submission API"
      );
      const version = await getOpamPackageVersion(pname);
      const opamPackage: OpamPackage = {
        name: pname,
        path: opamPackagePath,
        version,
        dependencies,
      };
      await submit(opamPackage);
      core.endGroup();
    }
  }
}
