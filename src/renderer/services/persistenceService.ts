export interface AnalysisResult {
  analysisId: string;
  url: string;
  status: string;
  [key: string]: unknown;
}

export interface ChatMessage {
  role: string;
  content: string;
}

export class PersistenceService {
  constructor(private readonly userId: string) {}

  async saveAnalysisResult(result: AnalysisResult): Promise<void> {
    await window.api.storeSet(`${this.userId}:analyses:${result.analysisId}`, result);
  }

  async saveChatHistory(analysisId: string, messages: ChatMessage[]): Promise<void> {
    await window.api.storeSet(`${this.userId}:chat:${analysisId}`, messages);
  }

  // fallow-ignore-next-line unused-class-member
  async loadChatHistory(analysisId: string): Promise<ChatMessage[]> {
    const stored = (await window.api.storeGet(`${this.userId}:chat:${analysisId}`)) as
      | ChatMessage[]
      | null;
    return stored ?? [];
  }
}
