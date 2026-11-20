import { useState, useEffect, useCallback, useMemo } from "react";
import { fetch } from "@tauri-apps/plugin-http";
import { check, Update } from "@tauri-apps/plugin-updater";
import { relaunch } from "@tauri-apps/plugin-process";
import { getVersion } from "@tauri-apps/api/app";
import { getCachedUpdateResult, setCachedUpdateResult } from "../utils/updateCache";
import { UPDATE_CHECK_TIMEOUT_MS, withTimeout } from "../utils/updateTimeout";
import { isNewerVersion } from "../utils/versionCompare";

export interface GitHubRelease {
  tag_name: string;
  name: string;
  body: string;
  published_at: string;
  html_url: string;
  assets: Array<{
    name: string;
    browser_download_url: string;
  }>;
}

export interface UpdateState {
  isChecking: boolean;
  hasUpdate: boolean;
  isDownloading: boolean;
  isInstalling: boolean;
  downloadProgress: number;
  error: string | null;
  updateInfo: Update | null;
  releaseInfo: GitHubRelease | null;
  currentVersion: string;
  /** A newer release exists but only a manual download is possible. */
  manualUpdateAvailable: boolean;
}

export interface UseGitHubUpdaterReturn {
  state: UpdateState;
  checkForUpdates: (forceCheck?: boolean) => Promise<void>;
  downloadAndInstall: () => Promise<void>;
  dismissUpdate: () => void;
}

const GITHUB_RELEASE_URL =
  "https://api.github.com/repos/ndokutovich/ai-code-history-viewer/releases/latest";

const RELEASE_REQUEST_HEADERS = {
  Accept: "application/vnd.github.v3+json",
  "User-Agent": "Claude-Code-History-Viewer",
};

export function useGitHubUpdater(): UseGitHubUpdaterReturn {
  const [state, setState] = useState<UpdateState>({
    isChecking: false,
    hasUpdate: false,
    isDownloading: false,
    isInstalling: false,
    downloadProgress: 0,
    error: null,
    updateInfo: null,
    releaseInfo: null,
    currentVersion: "",
    manualUpdateAvailable: false,
  });

  // Get current version
  useEffect(() => {
    getVersion().then((version) => {
      setState((prev) => ({ ...prev, currentVersion: version }));
    });
  }, []);

  const fetchGitHubRelease =
    useCallback(async (): Promise<GitHubRelease | null> => {
      const attempt = async (
        label: string,
        doFetch: (url: string, init: RequestInit) => Promise<Response>
      ): Promise<GitHubRelease | null> => {
        const started = Date.now();
        try {
          const response = await withTimeout(
            doFetch(GITHUB_RELEASE_URL, {
              method: "GET",
              headers: RELEASE_REQUEST_HEADERS,
            }),
            UPDATE_CHECK_TIMEOUT_MS,
            `${label} timed out`
          );

          if (!response.ok) {
            throw new Error(`GitHub API error: ${response.status}`);
          }

          const release = (await response.json()) as GitHubRelease;
          console.info(
            `Release feed answered via ${label} in ${Date.now() - started}ms`
          );
          return release;
        } catch (error) {
          console.warn(
            `Release feed via ${label} failed after ${Date.now() - started}ms:`,
            error
          );
          return null;
        }
      };

      // The plugin's HTTP client runs in Rust and has been seen to stall
      // indefinitely on this network. The webview's own fetch goes elsewhere
      // and the GitHub API allows CORS, so it is a real second chance.
      return (
        (await attempt("plugin-http", fetch)) ??
        (await attempt("window.fetch", (url, init) => globalThis.fetch(url, init)))
      );
    }, []);

  const checkForUpdates = useCallback(async (forceCheck: boolean = false) => {
    try {
      setState((prev) => ({ ...prev, isChecking: true, error: null }));

      // Check cache if not a forced check
      if (!forceCheck && state.currentVersion) {
        const cached = getCachedUpdateResult(state.currentVersion);
        if (cached) {
          setState((prev) => ({
            ...prev,
            isChecking: false,
            hasUpdate: cached.hasUpdate,
            updateInfo: null, // Don't cache Tauri update object
            manualUpdateAvailable: false,
            releaseInfo: cached.releaseInfo,
          }));
          return;
        }
      }

      // Fetch release info from GitHub API. The plugin's HTTP client runs the
      // request in Rust; its AbortSignal is a courtesy, so the race is what
      // actually bounds a stalled connection.
      const releaseInfo = await withTimeout(
        fetchGitHubRelease(),
        UPDATE_CHECK_TIMEOUT_MS,
        "Could not reach the release feed"
      );

      if (!releaseInfo) {
        throw new Error("Could not fetch release information.");
      }
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Release info:', releaseInfo);
      }

      // The native updater is the only path that can install, but it is also
      // the one that hangs on a filtering proxy. Its failure must not hide a
      // release we already know about: fall back to the release feed.
      const nativeStarted = Date.now();
      let update: Awaited<ReturnType<typeof check>> = null;
      let nativeFailure: string | null = null;
      try {
        update = await withTimeout(
          check({ timeout: UPDATE_CHECK_TIMEOUT_MS }),
          UPDATE_CHECK_TIMEOUT_MS,
          "Update check timed out"
        );
      } catch (nativeError) {
        nativeFailure =
          nativeError instanceof Error ? nativeError.message : String(nativeError);
        console.warn(
          `Native update check failed after ${Date.now() - nativeStarted}ms: ${nativeFailure}`
        );
      }

      const feedHasUpdate = isNewerVersion(releaseInfo.tag_name, state.currentVersion);
      const hasUpdate = update ? true : feedHasUpdate;
      const manualUpdateAvailable = hasUpdate && !update;

      if (manualUpdateAvailable) {
        console.warn(
          `Release ${releaseInfo.tag_name} is newer than ${state.currentVersion}; ` +
            "offering a manual download because the native updater did not return an update."
        );
      }

      // Cache the result (only when current version is available)
      if (state.currentVersion) {
        setCachedUpdateResult(hasUpdate, releaseInfo, state.currentVersion);
      }

      setState((prev) => ({
        ...prev,
        isChecking: false,
        hasUpdate,
        manualUpdateAvailable,
        updateInfo: update || null,
        releaseInfo,
        error: nativeFailure && !hasUpdate ? nativeFailure : null,
      }));
    } catch (error) {
      console.error("Update check failed:", error);
      setState((prev) => ({
        ...prev,
        isChecking: false,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while checking for updates.",
      }));
    }
  }, [fetchGitHubRelease, state.currentVersion]);

  const downloadAndInstall = useCallback(async () => {
    try {
      // If updateInfo is null (e.g., from cache hit), re-fetch the Update object
      let updateObj = state.updateInfo;
      if (!updateObj) {
        updateObj =
          (await withTimeout(
            check({ timeout: UPDATE_CHECK_TIMEOUT_MS }),
            UPDATE_CHECK_TIMEOUT_MS,
            "Update check timed out"
          )) ?? null;
        if (!updateObj) {
          setState((prev) => ({
            ...prev,
            error: "Could not prepare the update for download. Please try again.",
          }));
          return;
        }
        setState((prev) => ({ ...prev, updateInfo: updateObj }));
      }

      setState((prev) => ({ ...prev, isDownloading: true, error: null }));

      // Download progress listener
      let downloaded = 0;
      let total = 0;
      await updateObj.downloadAndInstall((event) => {
        switch (event.event) {
          case "Started":
            // Capture total file size if available
            if (typeof event.data?.contentLength === "number") {
              total = event.data.contentLength;
            }
            downloaded = 0;
            setState((prev) => ({ ...prev, downloadProgress: 0 }));
            break;
          case "Progress": {
            // Accumulate downloaded bytes
            if (typeof event.data?.chunkLength === "number") {
              downloaded += event.data.chunkLength;
            }
            // Calculate progress based on total or show incremental progress
            const progress = total > 0
              ? Math.min(100, Math.round((downloaded / total) * 100))
              : undefined;
            setState((prev) => ({
              ...prev,
              // If total is unknown, show incremental progress up to 99%
              downloadProgress: typeof progress === "number"
                ? progress
                : Math.min(99, (prev.downloadProgress || 0) + 1),
            }));
            break;
          }
          case "Finished":
            setState((prev) => ({
              ...prev,
              isDownloading: false,
              isInstalling: true,
              downloadProgress: 100,
            }));
            break;
        }
      });

      // Relaunch app after installation completes
      await relaunch();
    } catch (error) {
      setState((prev) => ({
        ...prev,
        isDownloading: false,
        isInstalling: false,
        error:
          error instanceof Error
            ? error.message
            : "An error occurred while installing the update.",
      }));
    }
  }, [state.updateInfo]);

  const dismissUpdate = useCallback(() => {
    setState((prev) => ({
      ...prev,
      hasUpdate: false,
      updateInfo: null,
      releaseInfo: null,
      error: null,
    }));
  }, []);

  // Auto-execution is managed by SmartUpdater, removed from here

  return useMemo(
    () => ({
      state,
      checkForUpdates,
      downloadAndInstall,
      dismissUpdate,
    }),
    [state, checkForUpdates, downloadAndInstall, dismissUpdate]
  );
}
