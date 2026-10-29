// src/services/git/commitService.js
import { repositoryService } from "./repositoryService.js";
import { env } from "../utils/env.js";

/**
 * Extract commits from a repository up to a maximum count.
 * Returns an array of commit objects with fields required by the specification.
 */
export async function getCommits(repoPath) {
  const max = env.MAX_COMMITS || 1000;
  // git log format: fields separated by unit separator (0x1f) for easy parsing
  const format = [
    "%H", // full hash
    "%h", // short hash
    "%P", // parent hashes
    "%an", // author name
    "%ae", // author email
    "%ad", // author date (ISO)
    "%cn", // committer name
    "%ce", // committer email
    "%cd", // committer date (ISO)
    "%s", // subject
    "%b" // body
  ].join("%x1f");

  const args = [
    "log",
    `-n${max}`,
    "--pretty=format:" + format,
    "--numstat",
    "--date=iso"
  ];

  const raw = await repositoryService.runGit(args, repoPath);
  const lines = raw.split("\n");
  const commits = [];
  let i = 0;
  while (i < lines.length) {
    const meta = lines[i].split("\x1f");
    if (meta.length < 11) break; // malformed line, stop parsing
    const [fullHash, shortHash, parentStr, authorName, authorEmail, authorDate, committerName, committerEmail, committerDate, subject, body] = meta;
    const commit = {
      hash: fullHash,
      shortHash,
      parents: parentStr ? parentStr.split(/\s+/).filter(Boolean) : [],
      author: { name: authorName, email: authorEmail, date: authorDate },
      committer: { name: committerName, email: committerEmail, date: committerDate },
      message: subject + (body ? "\n" + body : ""),
      changedFiles: [],
      insertions: 0,
      deletions: 0,
      isMerge: parentStr && parentStr.trim().split(/\s+/).length > 1,
    };
    i++;
    // Consume numstat lines until we hit the next commit meta line or end of output
    while (i < lines.length && lines[i].trim() !== "") {
      const parts = lines[i].split("\t");
      if (parts.length === 3) {
        const [ins, del, file] = parts;
        const insNum = ins === "-" ? 0 : parseInt(ins, 10);
        const delNum = del === "-" ? 0 : parseInt(del, 10);
        commit.changedFiles.push({ file, insertions: insNum, deletions: delNum });
        commit.insertions += insNum;
        commit.deletions += delNum;
      }
      i++;
    }
    commits.push(commit);
    // Skip possible empty line separating commits
    while (i < lines.length && lines[i].trim() === "") i++;
  }
  return commits;
}

export const commitService = { getCommits };
