import type { ExecOptions } from "@actions/exec";
import { getExecOutput } from "@actions/exec";
import * as glob from "@actions/glob";
import stripAnsi from "strip-ansi";

export async function getOpamLocalPackages(): Promise<string[]> {
  const globber = await glob.create("*.opam");
  const fpaths = await globber.glob();
  return fpaths;
}

export async function getOpamPackageVersion(pname: string): Promise<string> {
  const options: ExecOptions = {
    env: {
      ...process.env,
      PATH: process.env["PATH"] ?? "",
      OPAMCOLOR: "never",
    },
  };
  const opamPackageVersion = await getExecOutput(
    "opam",
    ["show", pname, "--field=version"],
    options
  );
  if (opamPackageVersion.exitCode !== 0) {
    throw new Error(opamPackageVersion.stderr);
  }
  const version = stripAnsi(opamPackageVersion.stdout.trim().normalize());
  return version;
}
