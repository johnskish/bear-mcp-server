import * as path from 'path';
import * as os from 'os';

export interface BearConfig {
  /** Database path for direct SQLite access */
  databasePath: string;

  /** Optional API token for Bear URL scheme calls that support it */
  apiToken?: string;

  /** Server name for MCP registration */
  serverName: string;

  /** Server version */
  serverVersion: string;

  /** If true and token is set, prefer API over direct DB for supported operations */
  preferApiToken: boolean;
}

export function loadConfig(): BearConfig {
  const defaultDbPath = path.join(
    os.homedir(),
    'Library/Group Containers/9K33E3U3T4.net.shinyfrog.bear/Application Data/database.sqlite'
  );

  return {
    databasePath: process.env.BEAR_DB_PATH || defaultDbPath,
    apiToken: process.env.BEAR_API_TOKEN,
    serverName: 'bear-mcp-server',
    serverVersion: '2.0.0',
    preferApiToken: process.env.BEAR_PREFER_API === 'true',
  };
}
