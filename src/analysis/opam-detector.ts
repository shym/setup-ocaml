import type { ExecOptions } from "@actions/exec";
import { getExecOutput } from "@actions/exec";
import stripAnsi from "strip-ansi";

export interface Dependency {
  name: string;
  version: string;
  devRepo?: string;
  dependencies?: Dependency[];
}

export interface OpamPackage {
  name: string;
  path: string;
  version: string;
  dependencies: Dependency[];
}

export async function getDependencies(pname: string): Promise<Dependency[]> {
  const options: ExecOptions = {
    env: {
      ...process.env,
      PATH: process.env["PATH"] ?? "",
      OPAMCOLOR: "never",
    },
  };
  const opamPackages = await getExecOutput(
    "opam",
    [
      "list",
      "--columns=name,installed-version,dev-repo:",
      "--installed",
      "--separator=;",
      "--with-doc",
      "--with-test",
      `--required-by=${pname}`,
    ],
    options
  );
  if (opamPackages.exitCode !== 0) {
    throw new Error(opamPackages.stderr);
  }
  const lines = opamPackages.stdout.split("\n").slice(2, -1);
  const dependencies = lines.map((line) => {
    const columns = line
      .split(";")
      .map((column) =>
        encodeURIComponent(
          stripAnsi(column.replaceAll('"', "").trim().normalize())
        )
      );
    const dependency = {} as Dependency;
    columns.forEach((column, index) => {
      if (index === 0) {
        dependency.name = column;
      } else if (index === 1) {
        dependency.version = column;
      } else if (index === 2) {
        dependency.devRepo = column;
      }
    });
    return dependency;
  });
  return dependencies;
}
