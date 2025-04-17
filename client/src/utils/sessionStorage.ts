// Session-specific storage utilities

export interface SurveyData {
  completed?: boolean;
  lastStep?: number;
  data?: Record<string, any>;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sender?: 'user' | 'ai';
  id?: string;
  timestamp?: string;
}

export class SessionStorageManager {
  private static SURVEY_KEY = 'ecosense_survey';
  private static CHAT_HISTORY_KEY = 'ecosense_chat_history';

  // Survey methods
  static saveSurvey(surveyData: SurveyData): void {
    try {
      sessionStorage.setItem(this.SURVEY_KEY, JSON.stringify(surveyData));
    } catch (error) {
      console.error('Error saving survey to sessionStorage:', error);
    }
  }

  static getSurvey(): SurveyData | null {
    try {
      const surveyData = sessionStorage.getItem(this.SURVEY_KEY);
      return surveyData ? JSON.parse(surveyData) : null;
    } catch (error) {
      console.error('Error retrieving survey from sessionStorage:', error);
      return null;
    }
  }

  static clearSurvey(): void {
    try {
      sessionStorage.removeItem(this.SURVEY_KEY);
    } catch (error) {
      console.error('Error clearing survey from sessionStorage:', error);
    }
  }

  // Chat history methods
  static saveChatMessage(message: ChatMessage): void {
    try {
      const chatHistory = this.getChatHistory();
      chatHistory.push(message);
      sessionStorage.setItem(this.CHAT_HISTORY_KEY, JSON.stringify(chatHistory));
    } catch (error) {
      console.error('Error saving chat message to sessionStorage:', error);
    }
  }

  static getChatHistory(): ChatMessage[] {
    try {
      const chatHistoryStr = sessionStorage.getItem(this.CHAT_HISTORY_KEY);
      return chatHistoryStr ? JSON.parse(chatHistoryStr) : [];
    } catch (error) {
      console.error('Error retrieving chat history from sessionStorage:', error);
      return [];
    }
  }

  static clearChatHistory(): void {
    try {
      sessionStorage.removeItem(this.CHAT_HISTORY_KEY);
    } catch (error) {
      console.error('Error clearing chat history from sessionStorage:', error);
    }
  }
}

// Export for direct use in components
export default SessionStorageManager;
