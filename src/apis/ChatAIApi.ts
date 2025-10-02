import axiosClient from './axiosClient';

export type ChatConsultResponse = {
  success: boolean;
  reply?: string;
  message?: string;
  counts?: { foods: number; combos: number };
  model?: string;
  trace?: string;
  lang?: 'vi' | 'en';
};

function unwrap<T = any>(res: any): T {
  if (
    res &&
    typeof res === 'object' &&
    'data' in res &&
    ('status' in res || 'headers' in res)
  ) {
    return (res as any).data as T;
  }
  return res as T;
}

type ConsultOptions = {
  lang?: 'vi' | 'en';
  signal?: AbortSignal;
  timeoutMs?: number;
};

const detectClientLanguage = (): string | undefined => {
  try {
    const g: any = globalThis as any;
    const nav = g?.navigator;
    if (nav?.language) return String(nav.language);
    if (Array.isArray(nav?.languages) && nav.languages[0])
      return String(nav.languages[0]);
    const intl = (Intl as any)?.DateTimeFormat?.().resolvedOptions?.();
    if (intl?.locale) return String(intl.locale);
  } catch {}
  return undefined;
};

const ChatAIApi = {
  async consult(
    question: string,
    opts: ConsultOptions = {},
  ): Promise<ChatConsultResponse> {
    const q = question?.trim();
    if (!q) throw new Error('Question is required');

    const payload: any = { question: q };
    if (opts.lang) payload.lang = opts.lang;

    const acceptLang =
      (opts.lang === 'vi' ? 'vi' : opts.lang === 'en' ? 'en' : undefined) ??
      detectClientLanguage();

    const config: any = {
      signal: opts.signal,
      timeout: typeof opts.timeoutMs === 'number' ? opts.timeoutMs : 25_000,
      headers: acceptLang ? { 'Accept-Language': acceptLang } : undefined,
    };

    try {
      const raw = await axiosClient.post('/ai/consult', payload, config);
      const data = unwrap<ChatConsultResponse>(raw);
      if (data?.success) return data;
      throw new Error(data?.message || 'AI response failed');
    } catch (err: any) {
      if (err?.code === 'ERR_CANCELED') {
        throw new Error('canceled');
      }
      const msg =
        err?.response?.data?.message || err?.message || 'Network/Server error';
      throw new Error(msg);
    }
  },

  async clearHistory(signal?: AbortSignal): Promise<void> {
    try {
      const raw = await axiosClient.delete('/ai/history', {
        signal,
        timeout: 10_000,
      });
      const data = unwrap<{ success: boolean; message?: string }>(raw);
      if (data?.success) return;
      throw new Error(data?.message || 'Clear history failed');
    } catch (err: any) {
      if (err?.code === 'ERR_CANCELED') {
        throw new Error('canceled');
      }
      const msg =
        err?.response?.data?.message || err?.message || 'Network/Server error';
      throw new Error(msg);
    }
  },
};

export default ChatAIApi;
