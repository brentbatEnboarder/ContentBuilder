export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  attachments?: FileAttachment[];
}

export interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
}

export interface PageContent {
  text: string;
  images: string[];
}

export interface Page {
  id: string;
  title: string;
  createdAt: Date;
  updatedAt: Date;
  content?: PageContent;
  chatHistory?: ChatMessage[];
}

export interface PageDraft extends Omit<Page, 'id' | 'createdAt' | 'updatedAt'> {
  id?: string;
}
