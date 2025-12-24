# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/claude-code) when working with this repository.

## Project Overview

Bear MCP Server is a Model Context Protocol server that integrates with the Bear notes app on macOS. It provides 13 tools for AI assistants to create, read, update, and manage Bear notes.

## Architecture

```
src/
├── index.ts           # Entry point - bootstraps the server
├── server.ts          # BearMcpServer class - registers all 13 tools
├── config/index.ts    # Configuration from env vars
├── database/
│   ├── index.ts       # BearDatabase class - SQLite read operations
│   ├── queries.ts     # SQL query constants
│   └── types.ts       # NoteRow, TagRow interfaces
├── api/index.ts       # BearApi class - URL scheme write operations
└── schemas/index.ts   # Zod schemas for tool input validation
```

### Key Design Decisions

- **Read operations**: Use `better-sqlite3` for direct, synchronous SQLite access to Bear's database
- **Write operations**: Use Bear's `bear://x-callback-url/` URL scheme (safe, supported API)
- **Validation**: Zod schemas for all tool inputs with automatic JSON schema generation
- **Responses**: Structured JSON instead of formatted text strings

## Common Commands

```bash
npm run build      # Compile TypeScript to build/
npm run dev        # Run with tsx (development)
npm start          # Run compiled JS (production)
npm run typecheck  # Type check without emitting
```

## Database Location

Bear's SQLite database:
```
~/Library/Group Containers/9K33E3U3T4.net.shinyfrog.bear/Application Data/database.sqlite
```

Key tables:
- `ZSFNOTE` - Notes (ZTITLE, ZTEXT, ZUNIQUEIDENTIFIER, ZTRASHED, ZARCHIVED, etc.)
- `ZSFNOTETAG` - Tags (ZTITLE, ZUNIQUEIDENTIFIER)
- `Z_5TAGS` - Note-tag junction (Z_5NOTES, Z_13TAGS)
- `ZSFNOTEBACKLINK` - Backlinks (ZLINKEDBY, ZLINKINGTO)

Date fields use Core Data epoch (seconds since Jan 1, 2001). Convert with: `+ 978307200` to Unix timestamp.

## Tools (13 total)

**Note Operations**: create_note, search_notes, get_note, update_note, append_to_note, open_note, trash_note, archive_note, get_recent_notes, get_note_backlinks

**Tag Operations**: list_tags, get_notes_by_tag, delete_tag

## Testing

Test database access:
```bash
node -e "
const { BearDatabase } = require('./build/database/index.js');
const { loadConfig } = require('./build/config/index.js');
const db = new BearDatabase(loadConfig().databasePath);
console.log('Tags:', db.listTags().length);
console.log('Recent:', db.getRecentNotes(7, 5).map(n => n.title));
db.close();
"
```

## Node.js Version Note

`better-sqlite3` is a native module compiled for a specific Node.js version. If Claude Desktop uses a different Node version than `npm install`, you'll get `NODE_MODULE_VERSION` errors. Solution: use the same Node binary in Claude Desktop config as used for installation.
