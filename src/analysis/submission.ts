import * as github from "@actions/github";
import {
  BuildTarget,
  Package,
  PackageCache,
  Snapshot,
  submitSnapshot,
} from "@github/dependency-submission-toolkit";
import { PackageURL } from "packageurl-js";

import { version as actionVersion } from "../../package.json";
import type { Dependency, OpamPackage } from "./opam-detector";

function parseDependencies(
  cache: PackageCache,
  dependencies: Dependency[]
): Package[] {
  const packages = dependencies.map((dependency) => {
    const purl = new PackageURL(
      "opam",
      null,
      dependency.name,
      dependency.version,
      null,
      null
    );
    if (cache.hasPackage(purl)) {
      return cache.package(purl);
    }
    const pkgs = [];
    if (dependency.dependencies !== undefined) {
      pkgs.push(...parseDependencies(cache, dependency.dependencies));
    }
    return cache.package(purl).dependsOnPackages(pkgs);
  });
  return packages;
}

function createBuildTarget(opamPackage: OpamPackage) {
  const cache = new PackageCache();
  const topLevelDependencies = parseDependencies(
    cache,
    opamPackage.dependencies
  );
  const buildTarget = new BuildTarget(opamPackage.name, opamPackage.path);
  for (const topLevelDependency of topLevelDependencies) {
    buildTarget.addBuildDependency(topLevelDependency);
  }
  return buildTarget;
}

export async function submit(opamPackage: OpamPackage) {
  const buildTarget = createBuildTarget(opamPackage);
  const snapshot = new Snapshot(
    {
      name: "ocaml/setup-ocaml/analysis",
      url: "https://github.com/ocaml/setup-ocaml/tree/master/analysis",
      version: actionVersion,
    },
    github.context,
    {
      correlator: opamPackage.path,
      id: github.context.runId.toString(),
    }
  );
  snapshot.addManifest(buildTarget);
  await submitSnapshot(snapshot);
}
