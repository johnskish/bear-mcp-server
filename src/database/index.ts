import Database from 'better-sqlite3';
import * as fs from 'fs';
import { QUERIES } from './queries.js';
import type { NoteRow, TagRow } from './types.js';

// Core Data epoch offset (Jan 1, 2001 -> Unix epoch)
const CORE_DATA_EPOCH_OFFSET = 978307200;

interface RawNoteRow {
  Z_PK: number;
  ZTITLE: string | null;
  ZTEXT: string | null;
  ZUNIQUEIDENTIFIER: string;
  ZCREATIONDATE: number | null;
  ZMODIFICATIONDATE: number | null;
  ZTRASHED: number;
  ZARCHIVED: number;
  ZPINNED: number;
}

interface RawTagRow {
  ZTITLE: string;
  ZUNIQUEIDENTIFIER: string;
}

interface RawPkRow {
  Z_PK: number;
}

export class BearDatabase {
  private db: Database.Database | null = null;
  private readonly dbPath: string;

  constructor(dbPath: string) {
    this.dbPath = dbPath;
  }

  /**
   * Verify database exists and is accessible
   */
  verifyDatabaseExists(): { exists: boolean; error?: string } {
    if (!fs.existsSync(this.dbPath)) {
      return {
        exists: false,
        error: `Bear database not found at: ${this.dbPath}. Is Bear installed?`,
      };
    }
    return { exists: true };
  }

  /**
   * Get or create database connection (lazy initialization)
   */
  private getConnection(): Database.Database {
    if (!this.db) {
      const check = this.verifyDatabaseExists();
      if (!check.exists) {
        throw new Error(check.error);
      }
      this.db = new Database(this.dbPath, { readonly: true });
    }
    return this.db;
  }

  /**
   * Convert Core Data timestamp to JS Date
   */
  private toJsDate(coreDataTimestamp: number | null): Date | null {
    if (coreDataTimestamp === null) return null;
    return new Date((coreDataTimestamp + CORE_DATA_EPOCH_OFFSET) * 1000);
  }

  /**
   * Map raw database row to NoteRow type
   */
  private mapNoteRow(row: RawNoteRow): NoteRow {
    return {
      pk: row.Z_PK,
      title: row.ZTITLE || 'Untitled',
      text: row.ZTEXT || '',
      identifier: row.ZUNIQUEIDENTIFIER,
      creationDate: this.toJsDate(row.ZCREATIONDATE),
      modificationDate: this.toJsDate(row.ZMODIFICATIONDATE),
      isTrashed: row.ZTRASHED === 1,
      isArchived: row.ZARCHIVED === 1,
      isPinned: row.ZPINNED === 1,
    };
  }

  /**
   * Search notes by query string
   */
  searchNotes(query: string, limit: number = 10): NoteRow[] {
    const db = this.getConnection();
    const searchParam = `%${query}%`;
    const stmt = db.prepare(QUERIES.SEARCH_NOTES);
    const rows = stmt.all(searchParam, searchParam, limit) as RawNoteRow[];
    return rows.map((row) => this.mapNoteRow(row));
  }

  /**
   * Get a single note by title or unique identifier
   */
  getNote(identifier: string): NoteRow | null {
    const db = this.getConnection();
    const stmt = db.prepare(QUERIES.GET_NOTE);
    const row = stmt.get(identifier, identifier) as RawNoteRow | undefined;
    return row ? this.mapNoteRow(row) : null;
  }

  /**
   * Get all notes with a specific tag
   */
  getNotesByTag(tagName: string, limit: number = 50): NoteRow[] {
    const db = this.getConnection();
    const stmt = db.prepare(QUERIES.GET_NOTES_BY_TAG);
    const rows = stmt.all(tagName, limit) as RawNoteRow[];
    return rows.map((row) => this.mapNoteRow(row));
  }

  /**
   * Get notes modified within the last N days
   */
  getRecentNotes(days: number = 7, limit: number = 50): NoteRow[] {
    const db = this.getConnection();
    const cutoffTimestamp =
      Date.now() / 1000 - CORE_DATA_EPOCH_OFFSET - days * 24 * 60 * 60;
    const stmt = db.prepare(QUERIES.GET_RECENT_NOTES);
    const rows = stmt.all(cutoffTimestamp, limit) as RawNoteRow[];
    return rows.map((row) => this.mapNoteRow(row));
  }

  /**
   * Get all tags
   */
  listTags(): TagRow[] {
    const db = this.getConnection();
    const stmt = db.prepare(QUERIES.LIST_TAGS);
    const rows = stmt.all() as RawTagRow[];
    return rows.map((row) => ({
      title: row.ZTITLE,
      identifier: row.ZUNIQUEIDENTIFIER,
    }));
  }

  /**
   * Get notes that link to a given note (backlinks)
   */
  getNoteBacklinks(noteIdentifier: string): NoteRow[] {
    const db = this.getConnection();

    // First get the note's Z_PK
    const notePkStmt = db.prepare(QUERIES.GET_NOTE_PK);
    const noteResult = notePkStmt.get(noteIdentifier, noteIdentifier) as
      | RawPkRow
      | undefined;
    if (!noteResult) return [];

    // Then get all notes that link to this note
    const stmt = db.prepare(QUERIES.GET_BACKLINKS);
    const rows = stmt.all(noteResult.Z_PK) as RawNoteRow[];
    return rows.map((row) => this.mapNoteRow(row));
  }

  /**
   * Close database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
