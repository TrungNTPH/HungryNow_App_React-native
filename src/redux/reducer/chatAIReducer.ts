import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import {
  sendChatMessageThunk,
  clearChatHistoryThunk,
} from '../actions/chatAIAction';

export type ChatRole = 'user' | 'assistant';
export type ChatMessage = {
  id: string;
  role: ChatRole;
  content: string;
  at: number;
};

type ChatMeta = {
  counts?: { foods: number; combos: number };
  model?: string;
  lang?: 'vi' | 'en';
};

type ChatAIState = {
  messages: ChatMessage[];
  sending: boolean;
  error: string | null;
  pendingRequestId: string | null;
  meta: ChatMeta | null;
};

const MAX_MESSAGES = 200;

const initialState: ChatAIState = {
  messages: [],
  sending: false,
  error: null,
  pendingRequestId: null,
  meta: null,
};

let _id = 0;
const nextId = () => `${Date.now()}_${++_id}`;

const pushMessage = (arr: ChatMessage[], msg: ChatMessage) => {
  arr.push(msg);
  if (arr.length > MAX_MESSAGES) {
    arr.splice(0, arr.length - MAX_MESSAGES);
  }
};

const chatAISlice = createSlice({
  name: 'chatAI',
  initialState,
  reducers: {
    appendLocalUserMessage(state, action: PayloadAction<{ content: string }>) {
      pushMessage(state.messages, {
        id: nextId(),
        role: 'user',
        content: action.payload.content,
        at: Date.now(),
      });
      state.error = null;
    },
    appendAssistantMessage(state, action: PayloadAction<{ content: string }>) {
      pushMessage(state.messages, {
        id: nextId(),
        role: 'assistant',
        content: action.payload.content,
        at: Date.now(),
      });
    },
    clearLocalMessages(state) {
      state.messages = [];
      state.error = null;
      state.meta = null;
      state.pendingRequestId = null;
      state.sending = false;
    },
  },
  extraReducers: builder => {
    builder
      .addCase(sendChatMessageThunk.pending, (state, action) => {
        state.pendingRequestId = action.meta.requestId;
        state.sending = true;
        state.error = null;
      })
      .addCase(sendChatMessageThunk.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.pendingRequestId) return;
        state.sending = false;
        state.pendingRequestId = null;
        const { counts, model, lang } = action.payload as any;
        state.meta = { counts, model, lang };
        const reply =
          action.payload.reply?.trim() ||
          (lang === 'vi'
            ? 'Mình chưa có gợi ý phù hợp lúc này.'
            : 'I don’t have a suitable suggestion right now.');
        pushMessage(state.messages, {
          id: nextId(),
          role: 'assistant',
          content: reply,
          at: Date.now(),
        });
      })
      .addCase(sendChatMessageThunk.rejected, (state, action) => {
        if (action.meta.requestId !== state.pendingRequestId) return;
        state.sending = false;
        state.pendingRequestId = null;
        const errMsg =
          (action.payload as string) ||
          action.error?.message ||
          'AI response failed';
        if (errMsg.toLowerCase() === 'canceled') return;
        state.error = errMsg;
        const lang = state.meta?.lang || 'vi';
        const apology =
          lang === 'vi'
            ? 'Xin lỗi, hiện mình chưa thể trả lời. Vui lòng thử lại sau.'
            : 'Sorry, I cannot respond right now. Please try again later.';
        const last = state.messages[state.messages.length - 1];
        if (!(last && last.role === 'assistant' && last.content === apology)) {
          pushMessage(state.messages, {
            id: nextId(),
            role: 'assistant',
            content: apology,
            at: Date.now(),
          });
        }
      })
      .addCase(clearChatHistoryThunk.fulfilled, state => {
        state.messages = [];
        state.error = null;
        state.meta = null;
        state.pendingRequestId = null;
        state.sending = false;
      })
      .addCase(clearChatHistoryThunk.rejected, (state, action) => {
        const errMsg =
          (action.payload as string) ||
          action.error?.message ||
          'Clear history failed';
        state.error = errMsg;
      });
  },
});

export const {
  appendLocalUserMessage,
  appendAssistantMessage,
  clearLocalMessages,
} = chatAISlice.actions;
export default chatAISlice.reducer;
export const chatMessagesSelector = (s: any) => s.chatAI?.messages || [];
export const chatSendingSelector = (s: any) => s.chatAI?.sending || false;
export const chatErrorSelector = (s: any) => s.chatAI?.error || null;
export const chatMetaSelector = (s: any) => s.chatAI?.meta || null;
export const chatLangSelector = (s: any) => s.chatAI?.meta?.lang || 'vi';
