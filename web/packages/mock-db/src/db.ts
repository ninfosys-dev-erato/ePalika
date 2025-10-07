import { chalaniSeeds } from "./seeds/chalaniSeeds";

/**
 * Singleton in-memory DB — preserved across hot reloads.
 */
const globalDB =
  (window as any).__EPALIKA_MOCK_DB__ || {
    chalanis: chalaniSeeds,
    dartas: [],
    users: [],
    orgUnits: [],
    counters: [],
  };

(window as any).__EPALIKA_MOCK_DB__ = globalDB;

export const mockDB = globalDB;
