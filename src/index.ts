#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

class BearMCPServer {
  private server: Server;

  constructor() {
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
          description: "Search for notes in Bear",
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

  private async searchNotes(args: { query: string; limit?: number }) {
    const { query, limit = 10 } = args;
    
    const bearUrl = `bear://x-callback-url/search?term=${encodeURIComponent(query)}&show_window=no`;

    try {
      await execAsync(`open "${bearUrl}"`);
      return {
        content: [
          {
            type: "text",
            text: `Search initiated for "${query}" in Bear. Check Bear app for results.`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to search notes: ${error}`);
    }
  }

  private async getNote(args: { identifier: string }) {
    const { identifier } = args;
    
    const bearUrl = `bear://x-callback-url/open-note?title=${encodeURIComponent(identifier)}`;

    try {
      await execAsync(`open "${bearUrl}"`);
      return {
        content: [
          {
            type: "text",
            text: `Opening note "${identifier}" in Bear`,
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to get note: ${error}`);
    }
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
    const bearUrl = "bear://x-callback-url/tags";

    try {
      await execAsync(`open "${bearUrl}"`);
      return {
        content: [
          {
            type: "text",
            text: "Bear tags view opened. Check Bear app for tag list.",
          },
        ],
      };
    } catch (error) {
      throw new Error(`Failed to list tags: ${error}`);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("Bear MCP server running on stdio");
  }
}

const server = new BearMCPServer();
server.run().catch(console.error);