#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";
import pkg from "sqlite3";
const { Database } = pkg;
import * as path from "path";
import * as os from "os";

const execAsync = promisify(exec);

class BearMCPServer {
  private server: Server;
  private bearDbPath: string;

  constructor() {
    // Bear database path in Group Containers
    this.bearDbPath = path.join(
      os.homedir(),
      'Library/Group Containers/9K33E3U3T4.net.shinyfrog.bear/Application Data/database.sqlite'
    );
    this.server = new Server(
      {
        name: "bear-mcp-server",
        version: "0.1.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "create_note",
          description: "Create a new note in Bear",
          inputSchema: {
            type: "object",
            properties: {
              title: {
                type: "string",
                description: "Title of the note",
              },
              content: {
                type: "string",
                description: "Content of the note (supports Markdown)",
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Tags to add to the note",
              },
            },
            required: ["title", "content"],
          },
        },
        {
          name: "search_notes",
          description: "Search for notes in Bear and return results with content",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Search query",
              },
              limit: {
                type: "number",
                description: "Maximum number of results to return",
                default: 10,
              },
            },
            required: ["query"],
          },
        },
        {
          name: "get_note",
          description: "Get a specific note by title or ID",
          inputSchema: {
            type: "object",
            properties: {
              identifier: {
                type: "string",
                description: "Note title or unique identifier",
              },
            },
            required: ["identifier"],
          },
        },
        {
          name: "open_note",
          description: "Open a note in Bear app",
          inputSchema: {
            type: "object",
            properties: {
              identifier: {
                type: "string",
                description: "Note title or unique identifier",
              },
            },
            required: ["identifier"],
          },
        },
        {
          name: "list_tags",
          description: "List all tags in Bear",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "update_note",
          description: "Update an existing note in Bear by title or ID (replaces entire content)",
          inputSchema: {
            type: "object",
            properties: {
              identifier: {
                type: "string",
                description: "Note title or unique identifier to update",
              },
              title: {
                type: "string",
                description: "New title for the note (optional)",
              },
              content: {
                type: "string",
                description: "New content for the note (replaces existing content)",
              },
              tags: {
                type: "array",
                items: { type: "string" },
                description: "Tags to add to the note (optional)",
              },
            },
            required: ["identifier", "content"],
          },
        },
        {
          name: "append_to_note",
          description: "Append content to an existing note in Bear",
          inputSchema: {
            type: "object",
            properties: {
              identifier: {
                type: "string",
                description: "Note title or unique identifier to append to",
              },
              content: {
                type: "string",
                description: "Content to append to the note",
              },
              separator: {
                type: "string",
                description: "Separator to use before appended content (default: '\\n\\n')",
                default: "\n\n",
              },
            },
            required: ["identifier", "content"],
          },
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      try {
        switch (name) {
          case "create_note":
            return await this.createNote(args as any);
          case "search_notes":
            return await this.searchNotes(args as any);
          case "get_note":
            return await this.getNote(args as any);
          case "open_note":
            return await this.openNote(args as any);
          case "list_tags":
            return await this.listTags();
          case "update_note":
            return await this.updateNote(args as any);
          case "append_to_note":
            return await this.appendToNote(args as any);
          default:
            throw new Error(`Tool ${name} not found`);
        }
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error: ${error instanceof Error ? error.message : String(error)}`,
            },
          ],
        };
      }
    });
  }

  private async createNote(args: {
    title: string;
    content: string;
    tags?: string[];
  }) {
    const { title, content, tags = [] } = args;
    
    let bearUrl = `bear://x-callback-url/create?title=${encodeURIComponent(title)}&text=${encodeURIComponent(content)}`;
    
    if (tags.length > 0) {
      const tagsString = tags.map(tag => `#${tag}`).join(' ');
      bearUrl += `&tags=${encodeURIComponent(tagsString)}`;
    }

    try {
      await execAsync(`open "${bearUrl}"`);
      return {
        content: [
          {
            type: "text",
            text: `Note "${title}" created successfully in Bear`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to create note: ${error}`);
    }
  }

  private async updateNote(args: {
    identifier: string;
    title?: string;
    content: string;
    tags?: string[];
  }) {
    const { identifier, title, content, tags = [] } = args;
    
    // Use Bear's add-text API which can update existing notes
    let bearUrl = `bear://x-callback-url/add-text?mode=replace&text=${encodeURIComponent(content)}`;
    
    // If title is provided, use it; otherwise use the identifier
    const noteTitle = title || identifier;
    bearUrl += `&title=${encodeURIComponent(noteTitle)}`;
    
    // Add tags if provided
    if (tags.length > 0) {
      const tagsString = tags.map(tag => `#${tag}`).join(' ');
      bearUrl += `&tags=${encodeURIComponent(tagsString)}`;
    }

    try {
      await execAsync(`open "${bearUrl}"`);
      return {
        content: [
          {
            type: "text",
            text: `Note "${noteTitle}" updated successfully in Bear`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to update note: ${error}`);
    }
  }

  private async appendToNote(args: {
    identifier: string;
    content: string;
    separator?: string;
  }) {
    const { identifier, content, separator = '\n\n' } = args;
    
    // Use Bear's add-text API with append mode
    let bearUrl = `bear://x-callback-url/add-text?mode=append&text=${encodeURIComponent(separator + content)}&title=${encodeURIComponent(identifier)}`;

    try {
      await execAsync(`open "${bearUrl}"`);
      return {
        content: [
          {
            type: "text",
            text: `Content appended to note "${identifier}" successfully in Bear`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to append to note: ${error}`);
    }
  }

  private async searchNotes(args: { query: string; limit?: number }) {
    const { query, limit = 10 } = args;
    
    return new Promise<any>((resolve, reject) => {
      const db = new Database(this.bearDbPath, pkg.OPEN_READONLY, (err) => {
        if (err) {
          reject(new Error(`Failed to open Bear database: ${err.message}`));
          return;
        }
      });

      // Search in title and text content
      const searchSql = `
        SELECT 
          ZTITLE as title,
          ZTEXT as text,
          ZUNIQUEIDENTIFIER as identifier,
          datetime(ZMODIFICATIONDATE + 978307200, 'unixepoch') as modification_date,
          datetime(ZCREATIONDATE + 978307200, 'unixepoch') as creation_date
        FROM ZSFNOTE 
        WHERE 
          ZTRASHED = 0 
          AND ZPERMANENTLYDELETED = 0 
          AND (ZTITLE LIKE ? OR ZTEXT LIKE ?)
        ORDER BY ZMODIFICATIONDATE DESC 
        LIMIT ?
      `;

      const searchParam = `%${query}%`;
      
      db.all(searchSql, [searchParam, searchParam, limit], (err, rows: any[]) => {
        if (err) {
          db.close();
          reject(new Error(`Database query failed: ${err.message}`));
          return;
        }

        db.close();

        if (rows.length === 0) {
          resolve({
            content: [
              {
                type: "text",
                text: `No notes found matching "${query}"`,
              },
            ],
          });
          return;
        }

        const resultText = `Found ${rows.length} note(s) matching "${query}":\n\n` +
          rows.map((note, index) => {
            const title = note.title || 'Untitled';
            const preview = note.text ? note.text.substring(0, 100).replace(/\n/g, ' ') + '...' : '';
            const modDate = note.modification_date ? new Date(note.modification_date).toLocaleDateString() : '';
            return `${index + 1}. **${title}**\n   ${preview}\n   Modified: ${modDate}\n   ID: ${note.identifier}`;
          }).join('\n\n');

        resolve({
          content: [
            {
              type: "text",
              text: resultText,
            },
          ],
        });
      });
    });
  }

  private async getNote(args: { identifier: string }) {
    const { identifier } = args;
    
    return new Promise<any>((resolve, reject) => {
      const db = new Database(this.bearDbPath, pkg.OPEN_READONLY, (err) => {
        if (err) {
          reject(new Error(`Failed to open Bear database: ${err.message}`));
          return;
        }
      });

      // Search by title or unique identifier
      const getSql = `
        SELECT 
          ZTITLE as title,
          ZTEXT as text,
          ZUNIQUEIDENTIFIER as identifier,
          datetime(ZMODIFICATIONDATE + 978307200, 'unixepoch') as modification_date,
          datetime(ZCREATIONDATE + 978307200, 'unixepoch') as creation_date
        FROM ZSFNOTE 
        WHERE 
          ZTRASHED = 0 
          AND ZPERMANENTLYDELETED = 0 
          AND (ZTITLE = ? OR ZUNIQUEIDENTIFIER = ?)
        LIMIT 1
      `;
      
      db.get(getSql, [identifier, identifier], (err, row: any) => {
        if (err) {
          db.close();
          reject(new Error(`Database query failed: ${err.message}`));
          return;
        }

        db.close();

        if (!row) {
          resolve({
            content: [
              {
                type: "text",
                text: `Note "${identifier}" not found`,
              },
            ],
          });
          return;
        }

        const title = row.title || 'Untitled';
        const text = row.text || '';
        const modDate = row.modification_date ? new Date(row.modification_date).toLocaleDateString() : '';
        const createDate = row.creation_date ? new Date(row.creation_date).toLocaleDateString() : '';

        resolve({
          content: [
            {
              type: "text",
              text: `**${title}**\n\nCreated: ${createDate}\nModified: ${modDate}\nID: ${row.identifier}\n\n---\n\n${text}`,
            },
          ],
        });
      });
    });
  }

  private async openNote(args: { identifier: string }) {
    const { identifier } = args;
    
    const bearUrl = `bear://x-callback-url/open-note?title=${encodeURIComponent(identifier)}`;

    try {
      await execAsync(`open "${bearUrl}"`);
      return {
        content: [
          {
            type: "text",
            text: `Note "${identifier}" opened in Bear`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to open note: ${error}`);
    }
  }

  private async listTags() {
    return new Promise<any>((resolve, reject) => {
      const db = new Database(this.bearDbPath, pkg.OPEN_READONLY, (err) => {
        if (err) {
          reject(new Error(`Failed to open Bear database: ${err.message}`));
          return;
        }
      });

      const tagsSql = `
        SELECT 
          ZTITLE as title,
          ZUNIQUEIDENTIFIER as identifier
        FROM ZSFNOTETAG 
        WHERE ZTITLE IS NOT NULL
        ORDER BY ZTITLE
      `;
      
      db.all(tagsSql, [], (err, rows: any[]) => {
        if (err) {
          db.close();
          reject(new Error(`Database query failed: ${err.message}`));
          return;
        }

        db.close();

        if (rows.length === 0) {
          resolve({
            content: [
              {
                type: "text",
                text: "No tags found in Bear",
              },
            ],
          });
          return;
        }

        const tagsList = rows.map(tag => `• ${tag.title}`).join('\n');
        resolve({
          content: [
            {
              type: "text",
              text: `Found ${rows.length} tag(s):\n\n${tagsList}`,
            },
          ],
        });
      });
    });
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error(`Bear MCP server running on stdio`);
  }
}

const server = new BearMCPServer();
server.run().catch(console.error);