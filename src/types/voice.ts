/* ------------------------------------------------------------------ */
/* Voice Chat Types — Non-Realtime (Whisper → GPT → TTS)                */
/* ------------------------------------------------------------------ */

/** Request body gửi BE để chat voice */
export interface VoiceChatRequest {
  level: string;
  context: string;
  goals?: string;
  inputVoice: string;
  audioFormat?: string;
  preferredVoice?: string;
  memorySummary?: string;
  session?: string;
  topicId?: number;
  scenarioId?: number;
}

/** Furigana segment từ n8n */
export interface FuriganaSegment {
  kanji: string;
  hiragana: string;
  romaji: string;
  meaning: string;
}

/** Furigana data đầy đủ */
export interface FuriganaData {
  text: string;
  segments: FuriganaSegment[];
  translation: string;
}

/** Response từ BE khi chat voice */
export interface VoiceChatResponse {
  success: boolean;
  session: string;
  transcript: string;
  aiResponse: {
    text: string;
    furigana?: FuriganaData;
  };
  audioBase64: string;
  audioFormat: string;
  createdAt: string;
}

/** Lịch sử session */
export interface VoiceSessionHistory {
  id: number;
  sessionCode: string;
  level: string;
  context: string;
  style: string;
  goals: string;
  status: string;
  voice: string;
  createdAt: string;
  endedAt: string | null;
  transcripts?: VoiceTranscriptItem[];
}

export interface VoiceTranscriptItem {
  role: "user" | "assistant";
  transcript: string;
  translationVi?: string;
  furigana?: FuriganaData;
  audioBase64?: string;
  audioFormat?: string;
  audioUrl?: string;
  createdAt: string;
}

/** Scenario trong topic */
export interface VoiceScenario {
  id: number;
  title?: string;
  situation: string;
  aiRole: string;
  aiPersonality?: string;
  sampleConversation?: string;
  openingLine?: string;
  level: string;
}

/** Topic cho voice chat */
export interface VoiceTopic {
  id: number;
  title: string;
  scenarios: VoiceScenario[];
}

/** State cho voice chat hook */
export interface VoiceState {
  status: "idle" | "recording" | "processing" | "playing" | "error";
  sessionCode: string | null;
  error: string | null;
  transcriptHistory: VoiceTranscriptItem[];
}
