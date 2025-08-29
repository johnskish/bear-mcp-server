# Bear MCP Server

A Model Context Protocol (MCP) server that provides integration with the Bear notes application. This server allows AI assistants like Claude to interact with your Bear notes through a secure, standardized interface.

## Features

- **Create Notes**: Create new notes in Bear with titles, content, and tags
- **Search Notes**: Search through your Bear notes by title or content
- **Get Notes**: Retrieve specific notes by title or unique identifier
- **Update Notes**: Update existing notes (replace entire content)
- **Append to Notes**: Add content to existing notes
- **Open Notes**: Open specific notes in the Bear app
- **List Tags**: View all tags in your Bear collection

## Requirements

- **Node.js**: Version 18 or higher
- **Bear App**: Must be installed on macOS
- **macOS**: Required for Bear app integration

## Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
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

## Usage

### Development Mode
```bash
npm run dev
```

### Production Mode
```bash
npm start
```

The server runs on stdio and communicates via the Model Context Protocol.

## Available Tools

### `create_note`
Creates a new note in Bear.
- `title` (required): Title of the note
- `content` (required): Content of the note (supports Markdown)
- `tags` (optional): Array of tags to add to the note

### `search_notes`
Searches for notes in Bear and returns results with content previews.
- `query` (required): Search query
- `limit` (optional): Maximum number of results (default: 10)

### `get_note`
Retrieves a specific note by title or ID.
- `identifier` (required): Note title or unique identifier

### `update_note`
Updates an existing note (replaces entire content).
- `identifier` (required): Note title or unique identifier
- `content` (required): New content for the note
- `title` (optional): New title for the note
- `tags` (optional): Array of tags to add

### `append_to_note`
Appends content to an existing note.
- `identifier` (required): Note title or unique identifier
- `content` (required): Content to append
- `separator` (optional): Separator before appended content (default: "\n\n")

### `open_note`
Opens a specific note in the Bear app.
- `identifier` (required): Note title or unique identifier

### `list_tags`
Lists all tags in your Bear collection.

## Database Access

The server reads from Bear's SQLite database located at:
```
~/Library/Group Containers/9K33E3U3T4.net.shinyfrog.bear/Application Data/database.sqlite
```

The server uses read-only access for search operations and Bear's URL scheme for write operations.

## License

MIT

## Author

Created for use with Model Context Protocol compatible AI assistants.