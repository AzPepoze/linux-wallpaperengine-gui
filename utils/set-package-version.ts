import { execFileSync } from "node:child_process";
import { readFileSync, writeFileSync } from "node:fs";

const TAG_VERSION = /^v(\d+)\.(\d+)\.(\d+)$/;
const mode = process.argv.find((argument) => argument.startsWith("--mode="))?.slice(7);
const dryRun = process.argv.includes("--dry-run");

if (mode !== "main" && mode !== "release") {
	throw new Error("Usage: bun utils/set-package-version.ts --mode=main|release [--dry-run]");
}

function runGit(args: string[]): string {
	return execFileSync("git", args, { encoding: "utf8" }).trim();
}

function releaseVersionFromTag(tag: string): string {
	const match = TAG_VERSION.exec(tag);
	if (!match) {
		throw new Error(`Expected a release tag in the form vX.Y.Z, received: ${tag}`);
	}

	return `${match[1]}.${match[2]}.${match[3]}`;
}

function latestReleaseVersion(): string {
	const tags = runGit(["tag", "--merged", "HEAD", "--list", "v*", "--sort=-version:refname"]);
	const tag = tags.split("\n").find((candidate) => TAG_VERSION.test(candidate));
	if (!tag) {
		throw new Error("No stable vX.Y.Z release tag is reachable from HEAD.");
	}

	return releaseVersionFromTag(tag);
}

function currentCommit(): string {
	return (process.env.GITHUB_SHA || runGit(["rev-parse", "HEAD"])).slice(0, 7);
}

const version = mode === "release"
	? releaseVersionFromTag(process.env.GITHUB_REF_NAME || runGit(["describe", "--exact-match", "--tags", "HEAD"]))
	: `${latestReleaseVersion()}-dev.${currentCommit()}`;

if (dryRun) {
	console.log(version);
	process.exit(0);
}

const packagePath = "package.json";
const contents = readFileSync(packagePath, "utf8");
if (!/^\s*"version":\s*"[^"]+"/m.test(contents)) {
	throw new Error("package.json does not contain a version field.");
}

const updated = contents.replace(/^(\s*"version":\s*)"[^"]+"/m, `$1"${version}"`);
if (updated !== contents) {
	writeFileSync(packagePath, updated);
}

console.log(`Set package version to ${version}`);
