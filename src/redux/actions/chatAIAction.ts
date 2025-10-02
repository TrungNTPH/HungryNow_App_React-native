import { createAsyncThunk } from '@reduxjs/toolkit';
import ChatAIApi, { ChatConsultResponse } from '../../apis/ChatAIApi';

type SendPayload = { question: string; lang?: 'vi' | 'en' };
type SendResult = Pick<
  ChatConsultResponse,
  'reply' | 'counts' | 'model' | 'lang'
>;

export const sendChatMessageThunk = createAsyncThunk<
  SendResult,
  SendPayload,
  { rejectValue: string }
>(
  'chatAI/sendChatMessage',
  async ({ question, lang }, { rejectWithValue, signal }) => {
    const q = (question || '').trim();
    if (!q) return rejectWithValue('Question is required');
    try {
      const data = await ChatAIApi.consult(q, { lang, signal });
      return {
        reply: data.reply || '',
        counts: data.counts,
        model: data.model,
        lang: data.lang,
      };
    } catch (err: any) {
      const msg = err?.message || 'AI response failed';
      return rejectWithValue(msg);
    }
  },
);

export const clearChatHistoryThunk = createAsyncThunk<
  void,
  void,
  { rejectValue: string }
>('chatAI/clearChatHistory', async (_, { rejectWithValue, signal }) => {
  try {
    await ChatAIApi.clearHistory(signal);
    return;
  } catch (err: any) {
    const msg = err?.message || 'Clear history failed';
    return rejectWithValue(msg);
  }
});
