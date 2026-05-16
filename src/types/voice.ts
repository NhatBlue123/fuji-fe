/* ------------------------------------------------------------------ */
/* Voice Chat Types — Non-Realtime (Whisper → GPT → TTS)                */
/* ------------------------------------------------------------------ */

/** Request body gửi BE để chat voice */
export interface VoiceChatRequest {
  level: string;
  context: string;
  goals?: string; // mục tiêu học tập của người dùng, để AI có thể cá nhân hóa phản hồi
  inputVoice: string; // base64 encoded audio
  audioFormat?: string; // định dạng âm thanh của audio input
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

export interface VoiceSessionFeedback {
  scoreGrammar: number | null;
  scoreVocabulary: number | null;
  totalScore: number | null;
  feedbackText: string | null;
  strengths: string[];
  improvements: string[];
}

export interface VoiceEvaluationState {
  status: "waiting" | "completed" | "failed";
}

export interface VoiceEndSessionResponse {
  success: boolean;
  session: string;
  feedback?: VoiceSessionFeedback | null;
  evaluation?: VoiceEvaluationState | null;
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
  feedbackGeneratedAt?: string | null;
  feedback?: VoiceSessionFeedback | null;
  evaluation?: VoiceEvaluationState | null;
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
