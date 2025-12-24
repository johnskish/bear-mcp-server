export interface NoteRow {
  pk: number;
  title: string;
  text: string;
  identifier: string;
  creationDate: Date | null;
  modificationDate: Date | null;
  isTrashed: boolean;
  isArchived: boolean;
  isPinned: boolean;
}

export interface TagRow {
  title: string;
  identifier: string;
}
