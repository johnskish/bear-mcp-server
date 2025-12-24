#!/usr/bin/env node

import { BearMcpServer } from './server.js';

const server = new BearMcpServer();
server.run().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});