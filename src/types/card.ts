export type StudyStatus = 'NOT_LEARNED' | 'LEARNED' | 'REVIEW';

export interface Card {
  id: number;
  kanji: string;
  hiragana: string;
  meaning: string;
  example: string;
  cardOrder: number;
}
