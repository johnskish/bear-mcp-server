# Bear MCP Server

A Model Context Protocol (MCP) server that provides integration with the Bear notes application on macOS. This server allows AI assistants like Claude to interact with your Bear notes through a secure, standardized interface.

## Features

### Note Management
- **Create Notes**: Create new notes with titles, content, and tags
- **Search Notes**: Full-text search through titles and content
- **Get Notes**: Retrieve specific notes by title or unique identifier
- **Update Notes**: Replace entire note content
- **Append to Notes**: Add content to existing notes
- **Open Notes**: Open notes in the Bear app
- **Trash Notes**: Move notes to trash
- **Archive Notes**: Archive notes

### Tag Management
- **List Tags**: View all tags in your Bear collection
- **Get Notes by Tag**: Retrieve all notes with a specific tag
- **Delete Tags**: Remove tags from Bear

### Advanced Features
- **Recent Notes**: Get notes modified in the last N days
- **Backlinks**: Find notes that link to a given note

## Requirements

- **Node.js**: Version 18 or higher
- **Bear App**: Must be installed on macOS
- **macOS**: Required for Bear app integration

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/johnskish/bear-mcp-server.git
   cd bear-mcp-server
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Build the project:
   ```bash
   npm run build
   ```

## Configuration

### Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `BEAR_DB_PATH` | Custom path to Bear's SQLite database | Auto-detected |
| `BEAR_API_TOKEN` | Bear API token for URL scheme operations | None |
| `BEAR_PREFER_API` | Prefer API over direct DB when token set | `false` |

### Claude Desktop Setup

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "bear": {
      "command": "node",
      "args": ["/path/to/bear-mcp-server/build/index.js"]
    }
  }
}
```

**Note**: If you have multiple Node.js versions, use the full path to the Node binary that matches the version used during `npm install`.

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

### Type Checking
```bash
npm run typecheck
```

## Available Tools

### Note Operations

#### `create_note`
Creates a new note in Bear.
- `title` (required): Title of the note
- `content` (required): Content of the note (supports Markdown)
- `tags` (optional): Array of tags to add to the note

#### `search_notes`
Searches for notes in Bear and returns results with content.
- `query` (required): Search query
- `limit` (optional): Maximum number of results (default: 10, max: 100)

#### `get_note`
Retrieves a specific note by title or ID.
- `identifier` (required): Note title or unique identifier

#### `update_note`
Updates an existing note (replaces entire content).
- `identifier` (required): Note title or unique identifier
- `content` (required): New content for the note
- `title` (optional): New title for the note
- `tags` (optional): Array of tags to add

#### `append_to_note`
Appends content to an existing note.
- `identifier` (required): Note title or unique identifier
- `content` (required): Content to append
- `separator` (optional): Separator before appended content (default: `\n\n`)

#### `open_note`
Opens a specific note in the Bear app.
- `identifier` (required): Note title or unique identifier

#### `trash_note`
Moves a note to trash.
- `identifier` (required): Note title or unique identifier
- `show_window` (optional): Whether to show Bear window (default: false)

#### `archive_note`
Archives a note.
- `identifier` (required): Note title or unique identifier
- `show_window` (optional): Whether to show Bear window (default: false)

#### `get_recent_notes`
Gets notes modified in the last N days.
- `days` (optional): Number of days to look back (default: 7, max: 365)
- `limit` (optional): Maximum number of results (default: 50, max: 100)

#### `get_note_backlinks`
Gets notes that link to a given note.
- `identifier` (required): Note title or unique identifier

### Tag Operations

#### `list_tags`
Lists all tags in your Bear collection.

#### `get_notes_by_tag`
Gets all notes with a specific tag.
- `tag` (required): Tag name (without # prefix)
- `limit` (optional): Maximum number of results (default: 50, max: 100)

#### `delete_tag`
Deletes a tag from Bear.
- `name` (required): Tag name (without # prefix)
- `show_window` (optional): Whether to show Bear window (default: false)

## Technical Details

### Database Access

The server reads from Bear's SQLite database located at:
```
~/Library/Group Containers/9K33E3U3T4.net.shinyfrog.bear/Application Data/database.sqlite
```

- **Read operations**: Direct SQLite access using `better-sqlite3` (fast, synchronous)
- **Write operations**: Bear's URL scheme API (`bear://x-callback-url/...`)

### Response Format

All tools return structured JSON responses:

```json
{
  "count": 3,
  "notes": [
    {
      "id": "unique-identifier",
      "title": "Note Title",
      "content": "Note content...",
      "createdAt": "2024-12-24T10:00:00.000Z",
      "modifiedAt": "2024-12-24T12:30:00.000Z",
      "isPinned": false,
      "isArchived": false
    }
  ]
}
```

### Project Structure

```
src/
├── index.ts           # Entry point
├── server.ts          # MCP server and tool registration
├── config/
│   └── index.ts       # Configuration management
├── database/
│   ├── index.ts       # BearDatabase class
│   ├── queries.ts     # SQL query constants
│   └── types.ts       # Type definitions
├── api/
│   └── index.ts       # Bear URL scheme API
└── schemas/
    └── index.ts       # Zod validation schemas
```

## License

MIT

## Author

Created for use with Model Context Protocol compatible AI assistants.
