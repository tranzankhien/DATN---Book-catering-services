import { apiClient } from './apiClient';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface SuggestedDishItem {
  id?: number;
  dishId?: number;
  name?: string;
  dishName?: string;
  code?: string;
  imageUrl?: string;
  categoryName?: string;
  price: number;
  quantityPerTable?: number;
}

export interface SuggestedMenu {
  name: string;
  pricePerTable: number;
  dishes: SuggestedDishItem[];
}

export interface AiChatResponse {
  reply: string;
  suggestedQuestions: string[];
  suggestedMenu?: SuggestedMenu | null;
}

export const chatbotService = {
  async sendMessage(message: string, history: ChatMessage[]): Promise<AiChatResponse> {
    const response = await apiClient.post<{ data: AiChatResponse }>('/ai/chat', {
      message,
      history,
    });
    return response.data.data;
  },
};
