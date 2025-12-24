import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { BearDatabase } from './database/index.js';
import { BearApi } from './api/index.js';
import { loadConfig } from './config/index.js';
import * as schemas from './schemas/index.js';
import type { NoteRow } from './database/types.js';

export class BearMcpServer {
  private mcp: McpServer;
  private db: BearDatabase;
  private api: BearApi;

  constructor() {
    const config = loadConfig();

    this.db = new BearDatabase(config.databasePath);
    this.api = new BearApi(config.apiToken);

    this.mcp = new McpServer({
      name: config.serverName,
      version: config.serverVersion,
    });

    this.registerTools();
  }

  /**
   * Format a note for structured response
   */
  private formatNote(note: NoteRow): object {
    return {
      id: note.identifier,
      title: note.title,
      content: note.text,
      createdAt: note.creationDate?.toISOString() ?? null,
      modifiedAt: note.modificationDate?.toISOString() ?? null,
      isPinned: note.isPinned,
      isArchived: note.isArchived,
    };
  }

  /**
   * Format notes list for structured response
   */
  private formatNotes(notes: NoteRow[]): object {
    return {
      count: notes.length,
      notes: notes.map((n) => this.formatNote(n)),
    };
  }

  private registerTools(): void {
    // ============ EXISTING TOOLS ============

    // create_note
    this.mcp.tool(
      'create_note',
      'Create a new note in Bear',
      schemas.CreateNoteSchema.shape,
      async (args) => {
        const result = await this.api.createNote({
          title: args.title,
          text: args.content,
          tags: args.tags,
        });

        if (!result.success) {
          return {
            content: [
              { type: 'text' as const, text: `Failed to create note: ${result.error}` },
            ],
            isError: true,
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: true,
                message: `Note "${args.title}" created successfully`,
              }),
            },
          ],
        };
      }
    );

    // search_notes
    this.mcp.tool(
      'search_notes',
      'Search for notes in Bear and return results with content',
      schemas.SearchNotesSchema.shape,
      async (args) => {
        const notes = this.db.searchNotes(args.query, args.limit);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                ...this.formatNotes(notes),
                query: args.query,
              }),
            },
          ],
        };
      }
    );

    // get_note
    this.mcp.tool(
      'get_note',
      'Get a specific note by title or ID',
      schemas.GetNoteSchema.shape,
      async (args) => {
        const note = this.db.getNote(args.identifier);

        if (!note) {
          return {
            content: [
              {
                type: 'text' as const,
                text: JSON.stringify({ found: false, identifier: args.identifier }),
              },
            ],
          };
        }

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({ found: true, note: this.formatNote(note) }),
            },
          ],
        };
      }
    );

    // open_note
    this.mcp.tool(
      'open_note',
      'Open a note in Bear app',
      schemas.OpenNoteSchema.shape,
      async (args) => {
        const result = await this.api.openNote(args.identifier);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: result.success,
                message: result.success
                  ? `Opened note "${args.identifier}" in Bear`
                  : `Failed to open note: ${result.error}`,
              }),
            },
          ],
          isError: !result.success,
        };
      }
    );

    // list_tags
    this.mcp.tool(
      'list_tags',
      'List all tags in Bear',
      schemas.ListTagsSchema.shape,
      async () => {
        const tags = this.db.listTags();

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                count: tags.length,
                tags: tags.map((t) => t.title),
              }),
            },
          ],
        };
      }
    );

    // update_note
    this.mcp.tool(
      'update_note',
      'Update an existing note in Bear by title or ID (replaces entire content)',
      schemas.UpdateNoteSchema.shape,
      async (args) => {
        const noteTitle = args.title || args.identifier;
        const result = await this.api.updateNote({
          title: noteTitle,
          text: args.content,
          tags: args.tags,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: result.success,
                message: result.success
                  ? `Note "${noteTitle}" updated successfully`
                  : `Failed to update note: ${result.error}`,
              }),
            },
          ],
          isError: !result.success,
        };
      }
    );

    // append_to_note
    this.mcp.tool(
      'append_to_note',
      'Append content to an existing note in Bear',
      schemas.AppendToNoteSchema.shape,
      async (args) => {
        const result = await this.api.appendToNote({
          title: args.identifier,
          text: args.separator + args.content,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: result.success,
                message: result.success
                  ? `Content appended to note "${args.identifier}"`
                  : `Failed to append: ${result.error}`,
              }),
            },
          ],
          isError: !result.success,
        };
      }
    );

    // ============ NEW TOOLS ============

    // get_notes_by_tag
    this.mcp.tool(
      'get_notes_by_tag',
      'Get all notes with a specific tag',
      schemas.GetNotesByTagSchema.shape,
      async (args) => {
        const notes = this.db.getNotesByTag(args.tag, args.limit);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                ...this.formatNotes(notes),
                tag: args.tag,
              }),
            },
          ],
        };
      }
    );

    // trash_note
    this.mcp.tool(
      'trash_note',
      'Move a note to trash',
      schemas.TrashNoteSchema.shape,
      async (args) => {
        const result = await this.api.trashNote({
          identifier: args.identifier,
          showWindow: args.show_window,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: result.success,
                message: result.success
                  ? `Note "${args.identifier}" moved to trash`
                  : `Failed to trash note: ${result.error}`,
              }),
            },
          ],
          isError: !result.success,
        };
      }
    );

    // archive_note
    this.mcp.tool(
      'archive_note',
      'Archive a note',
      schemas.ArchiveNoteSchema.shape,
      async (args) => {
        const result = await this.api.archiveNote({
          identifier: args.identifier,
          showWindow: args.show_window,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: result.success,
                message: result.success
                  ? `Note "${args.identifier}" archived`
                  : `Failed to archive note: ${result.error}`,
              }),
            },
          ],
          isError: !result.success,
        };
      }
    );

    // delete_tag
    this.mcp.tool(
      'delete_tag',
      'Delete a tag from Bear',
      schemas.DeleteTagSchema.shape,
      async (args) => {
        const result = await this.api.deleteTag({
          name: args.name,
          showWindow: args.show_window,
        });

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                success: result.success,
                message: result.success
                  ? `Tag "${args.name}" deleted`
                  : `Failed to delete tag: ${result.error}`,
              }),
            },
          ],
          isError: !result.success,
        };
      }
    );

    // get_recent_notes
    this.mcp.tool(
      'get_recent_notes',
      'Get notes modified in the last N days',
      schemas.GetRecentNotesSchema.shape,
      async (args) => {
        const notes = this.db.getRecentNotes(args.days, args.limit);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                ...this.formatNotes(notes),
                days: args.days,
              }),
            },
          ],
        };
      }
    );

    // get_note_backlinks
    this.mcp.tool(
      'get_note_backlinks',
      'Get notes that link to a given note',
      schemas.GetNoteBacklinksSchema.shape,
      async (args) => {
        const notes = this.db.getNoteBacklinks(args.identifier);

        return {
          content: [
            {
              type: 'text' as const,
              text: JSON.stringify({
                ...this.formatNotes(notes),
                targetNote: args.identifier,
              }),
            },
          ],
        };
      }
    );
  }

  /**
   * Start the server
   */
  async run(): Promise<void> {
    // Verify database exists on startup
    const dbCheck = this.db.verifyDatabaseExists();
    if (!dbCheck.exists) {
      console.error(`Error: ${dbCheck.error}`);
      process.exit(1);
    }

    const transport = new StdioServerTransport();
    await this.mcp.connect(transport);
    console.error('Bear MCP server running on stdio');
  }
}
