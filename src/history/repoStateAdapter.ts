import { execFile } from "node:child_process";
import { mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import type { PoolState, PostHistory } from "../domain/history.js";
import {
  createEmptyStateSnapshot,
  type HistoryStore,
  type StateSnapshot,
  type WriteStateOptions,
} from "./historyStore.js";

const execFileAsync = promisify(execFile);

const POST_HISTORY_FILE = "post-history.json";
const POOL_STATE_FILE = "pool-state.json";

type BranchStatus = {
  local: boolean;
  remote: boolean;
};

type RepoStateAdapterOptions = {
  repoDir?: string;
  stateBranch?: string;
  remoteName?: string;
  authorName?: string;
  authorEmail?: string;
  cloneSource?: string;
  pushChanges?: boolean;
};

export class RepoStateAdapter implements HistoryStore {
  private readonly repoDir: string;
  private readonly stateBranch: string;
  private readonly remoteName: string;
  private readonly authorName: string;
  private readonly authorEmail: string;
  private readonly cloneSource: string | undefined;
  private readonly pushChanges: boolean;

  constructor(options: RepoStateAdapterOptions = {}) {
    this.repoDir = path.resolve(options.repoDir ?? process.cwd());
    this.stateBranch = options.stateBranch ?? "state";
    this.remoteName = options.remoteName ?? "origin";
    this.authorName =
      options.authorName ?? process.env.GIT_AUTHOR_NAME ?? process.env.GITHUB_ACTOR ?? "github-actions[bot]";
    this.authorEmail =
      options.authorEmail ??
      process.env.GIT_AUTHOR_EMAIL ??
      "41898282+github-actions[bot]@users.noreply.github.com";
    this.cloneSource = options.cloneSource
      ? path.resolve(this.repoDir, options.cloneSource)
      : undefined;
    this.pushChanges = options.pushChanges ?? true;
  }

  async read(): Promise<StateSnapshot> {
    const workspace = await this.createWorkspace(false);

    if (!workspace) {
      return createEmptyStateSnapshot();
    }

    try {
      return await this.readSnapshotFrom(workspace);
    } finally {
      await this.cleanup(workspace);
    }
  }

  async write(snapshot: StateSnapshot, options: WriteStateOptions = {}): Promise<void> {
    const workspace = await this.createWorkspace(true);
    if (!workspace) {
      throw new Error("State workspace could not be created.");
    }

    try {
      await this.writeSnapshotTo(workspace, snapshot);
      await this.runGit(["add", POST_HISTORY_FILE, POOL_STATE_FILE], workspace);

      const hasChanges = await this.hasStagedChanges(workspace);
      if (!hasChanges) {
        return;
      }

      const commitMessage =
        options.commitMessage ??
        `chore: update state snapshot (${new Date().toISOString()})`;

      await this.runGit(
        [
          "commit",
          "-m",
          commitMessage,
        ],
        workspace,
        {
          GIT_AUTHOR_NAME: this.authorName,
          GIT_AUTHOR_EMAIL: this.authorEmail,
          GIT_COMMITTER_NAME: this.authorName,
          GIT_COMMITTER_EMAIL: this.authorEmail,
        },
      );

      if (this.pushChanges) {
        await this.runGit(["push", "-u", this.remoteName, this.stateBranch], workspace);
      }
    } finally {
      await this.cleanup(workspace);
    }
  }

  async getRecent(limit: number): Promise<PostHistory[]> {
    const snapshot = await this.read();

    return [...snapshot.postHistory]
      .sort((left, right) => {
        return new Date(right.postedAt).getTime() - new Date(left.postedAt).getTime();
      })
      .slice(0, limit);
  }

  private async createWorkspace(createIfMissing: boolean): Promise<string | null> {
    const workspace = await mkdtemp(path.join(tmpdir(), "twitter-bot-state-"));

    try {
      const cloneSource = await this.getCloneSource();
      await this.runGit(["clone", "--quiet", cloneSource, workspace], this.repoDir);

      const branchStatus = await this.getBranchStatus(workspace);
      if (branchStatus.remote) {
        await this.runGit(
          ["checkout", "-B", this.stateBranch, `${this.remoteName}/${this.stateBranch}`],
          workspace,
        );
        return workspace;
      }

      if (branchStatus.local) {
        await this.runGit(["checkout", this.stateBranch], workspace);
        return workspace;
      }

      if (!createIfMissing) {
        await this.cleanup(workspace);
        return null;
      }

      await this.runGit(["checkout", "--orphan", this.stateBranch], workspace);
      await this.clearWorkingTree(workspace);
      await this.writeSnapshotTo(workspace, createEmptyStateSnapshot());
      await this.runGit(["add", POST_HISTORY_FILE, POOL_STATE_FILE], workspace);
      await this.runGit(
        ["commit", "-m", "chore: init state branch"],
        workspace,
        {
          GIT_AUTHOR_NAME: this.authorName,
          GIT_AUTHOR_EMAIL: this.authorEmail,
          GIT_COMMITTER_NAME: this.authorName,
          GIT_COMMITTER_EMAIL: this.authorEmail,
        },
      );
      if (this.pushChanges) {
        await this.runGit(["push", "-u", this.remoteName, this.stateBranch], workspace);
      }

      return workspace;
    } catch (error) {
      await this.cleanup(workspace);
      throw error;
    }
  }

  private async getCloneSource(): Promise<string> {
    if (this.cloneSource) {
      return this.cloneSource;
    }

    try {
      const { stdout } = await this.runGit(["remote", "get-url", this.remoteName], this.repoDir);
      const cloneSource = stdout.trim();

      return cloneSource === "" ? this.repoDir : cloneSource;
    } catch {
      return this.repoDir;
    }
  }

  private async getBranchStatus(workspace: string): Promise<BranchStatus> {
    let remote = false;
    let local = false;

    try {
      await this.runGit(["ls-remote", "--exit-code", "--heads", this.remoteName, this.stateBranch], workspace);
      remote = true;
    } catch {
      remote = false;
    }

    try {
      const { stdout } = await this.runGit(["branch", "--list", this.stateBranch], workspace);
      local = stdout.trim() !== "";
    } catch {
      local = false;
    }

    return { local, remote };
  }

  private async readSnapshotFrom(workspace: string): Promise<StateSnapshot> {
    const postHistory = await this.readJsonFile<PostHistory[]>(
      path.join(workspace, POST_HISTORY_FILE),
      [],
    );
    const poolState = await this.readJsonFile<PoolState>(
      path.join(workspace, POOL_STATE_FILE),
      {},
    );

    return {
      postHistory,
      poolState,
    };
  }

  private async writeSnapshotTo(workspace: string, snapshot: StateSnapshot): Promise<void> {
    await writeFile(
      path.join(workspace, POST_HISTORY_FILE),
      `${JSON.stringify(snapshot.postHistory, null, 2)}\n`,
      "utf8",
    );
    await writeFile(
      path.join(workspace, POOL_STATE_FILE),
      `${JSON.stringify(snapshot.poolState, null, 2)}\n`,
      "utf8",
    );
  }

  private async readJsonFile<T>(filePath: string, fallback: T): Promise<T> {
    try {
      const content = await readFile(filePath, "utf8");
      return JSON.parse(content) as T;
    } catch (error) {
      if (isMissingFileError(error)) {
        return fallback;
      }

      throw error;
    }
  }

  private async hasStagedChanges(workspace: string): Promise<boolean> {
    try {
      await this.runGit(["diff", "--cached", "--quiet"], workspace);
      return false;
    } catch (error) {
      if (isCommandExitCode(error, 1)) {
        return true;
      }

      throw error;
    }
  }

  private async clearWorkingTree(workspace: string): Promise<void> {
    const entries = await readdir(workspace);

    await Promise.all(
      entries.map(async (entry) => {
        if (entry === ".git") {
          return;
        }

        await rm(path.join(workspace, entry), { force: true, recursive: true });
      }),
    );
  }

  private async runGit(args: string[], cwd: string, extraEnv: NodeJS.ProcessEnv = {}) {
    return execFileAsync("git", args, {
      cwd,
      env: {
        ...process.env,
        ...extraEnv,
      },
    });
  }

  private async cleanup(workspace: string): Promise<void> {
    await rm(workspace, { recursive: true, force: true });
  }
}

function isMissingFileError(error: unknown): error is NodeJS.ErrnoException {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}

function isCommandExitCode(error: unknown, exitCode: number): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === exitCode;
}
