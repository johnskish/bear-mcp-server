import { z } from 'zod';

// ============ Common Schemas ============

const identifierSchema = z
  .string()
  .min(1, 'Identifier cannot be empty')
  .describe('Note title or unique identifier');

const limitSchema = z
  .number()
  .int()
  .min(1)
  .max(100)
  .default(10)
  .describe('Maximum number of results to return');

const tagsSchema = z
  .array(z.string())
  .optional()
  .describe('Tags to add to the note');

// ============ Tool Input Schemas ============

// create_note
export const CreateNoteSchema = z.object({
  title: z.string().min(1, 'Title cannot be empty').describe('Title of the note'),
  content: z.string().describe('Content of the note (supports Markdown)'),
  tags: tagsSchema,
});

// search_notes
export const SearchNotesSchema = z.object({
  query: z.string().min(1, 'Search query cannot be empty').describe('Search query'),
  limit: limitSchema,
});

// get_note
export const GetNoteSchema = z.object({
  identifier: identifierSchema,
});

// open_note
export const OpenNoteSchema = z.object({
  identifier: identifierSchema,
});

// update_note
export const UpdateNoteSchema = z.object({
  identifier: identifierSchema.describe('Note title or unique identifier to update'),
  title: z.string().optional().describe('New title for the note (optional)'),
  content: z.string().describe('New content for the note (replaces existing content)'),
  tags: tagsSchema,
});

// append_to_note
export const AppendToNoteSchema = z.object({
  identifier: identifierSchema.describe('Note title or unique identifier to append to'),
  content: z.string().min(1, 'Content cannot be empty').describe('Content to append to the note'),
  separator: z
    .string()
    .default('\n\n')
    .describe("Separator to use before appended content (default: '\\n\\n')"),
});

// list_tags (no parameters)
export const ListTagsSchema = z.object({});

// ============ NEW TOOL SCHEMAS ============

// get_notes_by_tag
export const GetNotesByTagSchema = z.object({
  tag: z
    .string()
    .min(1, 'Tag name cannot be empty')
    .describe('The tag name to search for (without # prefix)'),
  limit: limitSchema.default(50),
});

// trash_note
export const TrashNoteSchema = z.object({
  identifier: identifierSchema.describe('Note title or unique identifier to trash'),
  show_window: z
    .boolean()
    .default(false)
    .describe('Whether to show Bear window after operation'),
});

// archive_note
export const ArchiveNoteSchema = z.object({
  identifier: identifierSchema.describe('Note title or unique identifier to archive'),
  show_window: z
    .boolean()
    .default(false)
    .describe('Whether to show Bear window after operation'),
});

// delete_tag
export const DeleteTagSchema = z.object({
  name: z
    .string()
    .min(1, 'Tag name cannot be empty')
    .describe('The tag name to delete (without # prefix)'),
  show_window: z
    .boolean()
    .default(false)
    .describe('Whether to show Bear window after operation'),
});

// get_recent_notes
export const GetRecentNotesSchema = z.object({
  days: z
    .number()
    .int()
    .min(1)
    .max(365)
    .default(7)
    .describe('Number of days to look back'),
  limit: limitSchema.default(50),
});

// get_note_backlinks
export const GetNoteBacklinksSchema = z.object({
  identifier: identifierSchema.describe('Note title or unique identifier to find backlinks for'),
});

// ============ Type Exports ============

export type CreateNoteInput = z.infer<typeof CreateNoteSchema>;
export type SearchNotesInput = z.infer<typeof SearchNotesSchema>;
export type GetNoteInput = z.infer<typeof GetNoteSchema>;
export type OpenNoteInput = z.infer<typeof OpenNoteSchema>;
export type UpdateNoteInput = z.infer<typeof UpdateNoteSchema>;
export type AppendToNoteInput = z.infer<typeof AppendToNoteSchema>;
export type ListTagsInput = z.infer<typeof ListTagsSchema>;
export type GetNotesByTagInput = z.infer<typeof GetNotesByTagSchema>;
export type TrashNoteInput = z.infer<typeof TrashNoteSchema>;
export type ArchiveNoteInput = z.infer<typeof ArchiveNoteSchema>;
export type DeleteTagInput = z.infer<typeof DeleteTagSchema>;
export type GetRecentNotesInput = z.infer<typeof GetRecentNotesSchema>;
export type GetNoteBacklinksInput = z.infer<typeof GetNoteBacklinksSchema>;
