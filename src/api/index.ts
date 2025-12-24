import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export interface BearUrlParams {
  [key: string]: string | boolean | undefined;
}

export interface ApiResult {
  success: boolean;
  error?: string;
}

export class BearApi {
  private token?: string;

  constructor(token?: string) {
    this.token = token;
  }

  /**
   * Build a Bear URL with encoded parameters
   */
  private buildUrl(action: string, params: BearUrlParams = {}): string {
    const url = new URL(`bear://x-callback-url/${action}`);

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }

    if (this.token) {
      url.searchParams.set('token', this.token);
    }

    return url.toString();
  }

  /**
   * Execute a Bear URL scheme command
   */
  private async executeUrl(url: string): Promise<ApiResult> {
    try {
      await execAsync(`open "${url}"`);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Check if Bear is running
   */
  async isBearRunning(): Promise<boolean> {
    try {
      const { stdout } = await execAsync('pgrep -x Bear');
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Create a new note
   */
  async createNote(params: {
    title: string;
    text: string;
    tags?: string[];
  }): Promise<ApiResult> {
    const tagsString = params.tags?.map((t) => `#${t}`).join(' ');
    return this.executeUrl(
      this.buildUrl('create', {
        title: params.title,
        text: params.text,
        tags: tagsString,
        open_note: 'no',
        show_window: 'no',
      })
    );
  }

  /**
   * Update an existing note (replace content)
   */
  async updateNote(params: {
    title: string;
    text: string;
    tags?: string[];
  }): Promise<ApiResult> {
    const tagsString = params.tags?.map((t) => `#${t}`).join(' ');
    return this.executeUrl(
      this.buildUrl('add-text', {
        title: params.title,
        text: params.text,
        mode: 'replace_all',
        tags: tagsString,
        open_note: 'no',
        show_window: 'no',
      })
    );
  }

  /**
   * Append content to a note
   */
  async appendToNote(params: {
    title: string;
    text: string;
  }): Promise<ApiResult> {
    return this.executeUrl(
      this.buildUrl('add-text', {
        title: params.title,
        text: params.text,
        mode: 'append',
        open_note: 'no',
        show_window: 'no',
      })
    );
  }

  /**
   * Open a note in Bear
   */
  async openNote(identifier: string): Promise<ApiResult> {
    return this.executeUrl(
      this.buildUrl('open-note', { title: identifier })
    );
  }

  /**
   * Trash a note
   */
  async trashNote(params: {
    identifier: string;
    showWindow?: boolean;
  }): Promise<ApiResult> {
    return this.executeUrl(
      this.buildUrl('trash', {
        search: params.identifier,
        show_window: params.showWindow ? 'yes' : 'no',
      })
    );
  }

  /**
   * Archive a note
   */
  async archiveNote(params: {
    identifier: string;
    showWindow?: boolean;
  }): Promise<ApiResult> {
    return this.executeUrl(
      this.buildUrl('archive', {
        search: params.identifier,
        show_window: params.showWindow ? 'yes' : 'no',
      })
    );
  }

  /**
   * Delete a tag
   */
  async deleteTag(params: {
    name: string;
    showWindow?: boolean;
  }): Promise<ApiResult> {
    return this.executeUrl(
      this.buildUrl('delete-tag', {
        name: params.name,
        show_window: params.showWindow ? 'yes' : 'no',
      })
    );
  }
}
