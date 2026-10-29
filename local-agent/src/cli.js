// src/cli.js
#!/usr/bin/env node
import { Command } from "commander";
import { analyzeLocalRepository, ReportSchema } from "./analyzer.js";
import fs from "fs/promises";
import path from "path";

const program = new Command();

program
  .name("repo-seance")
  .description("Local analysis CLI for Repo Séance")
  .version("0.1.0");

program
  .command("analyze <repoPath>")
  .description("Analyze a local Git repository and produce a JSON report")
  .option("-p, --profile <profile>", "analysis profile (quick|standard|deep)", "standard")
  .option("-m, --max-commits <number>", "maximum number of commits to process")
  .option("-o, --output <file>", "output report file (default: ./repo-seance-report.json)")
  .option("--include-source", "include source code excerpts in evidence (may increase file size)")
  .action(async (repoPath, options) => {
    try {
      const report = await analyzeLocalRepository({
        repoPath,
        profile: options.profile,
        maxCommits: options.maxCommits,
      });

      const outputPath = options.output ? path.resolve(options.output) : path.resolve("./repo-seance-report.json");
      // Ensure we are not writing outside the cwd unintentionally
      const cwd = process.cwd();
      if (!outputPath.startsWith(cwd)) {
        console.error("Error: Output path must be inside the current working directory.");
        process.exit(2);
      }

      await fs.writeFile(outputPath, JSON.stringify(report, null, 2), { encoding: "utf8" });
      console.log(`Report written to ${outputPath}`);
    } catch (err) {
      console.error(`Analysis failed: ${err.message}`);
      process.exit(1);
    }
  });

program
  .command("validate-report <file>")
  .description("Validate a previously exported Repo Séance JSON report")
  .action(async (file) => {
    try {
      const data = await fs.readFile(path.resolve(file), "utf8");
      const parsed = JSON.parse(data);
      ReportSchema.parse(parsed);
      console.log("Report is valid.");
    } catch (err) {
      console.error(`Invalid report: ${err.message}`);
      process.exit(1);
    }
  });

program.parseAsync(process.argv);
