import { logError } from "../logging";

export const unavailableOrMisconfiguredError = (entity: string | undefined): void => {
  logError(`Entity "${entity ?? "Unknown"}" is not available or misconfigured`);
};
