/**
 * SaveManager - localStorage への永続化管理
 * Hi-Score・ランキング・設定値を保存/復元する
 */

const KEYS = {
  HI_SCORE: 'rushBreaker_hiScore',
  RANKING: 'rushBreaker_ranking',
} as const;

export type RankEntry = {
  score: number;
  date: string; // YYYY-MM-DD
};

const MAX_RANK = 5;

export class SaveManager {
  /** Hi-Score を取得（なければ 0） */
  static getHiScore(): number {
    return Number(localStorage.getItem(KEYS.HI_SCORE) ?? 0);
  }

  /** Hi-Score を保存 */
  static saveHiScore(score: number): void {
    const current = this.getHiScore();
    if (score > current) {
      localStorage.setItem(KEYS.HI_SCORE, String(score));
    }
  }

  /** ランキング上位 N 件を取得 */
  static getRanking(): RankEntry[] {
    try {
      const raw = localStorage.getItem(KEYS.RANKING);
      if (!raw) return [];
      return JSON.parse(raw) as RankEntry[];
    } catch {
      return [];
    }
  }

  /**
   * スコアを追加してランキングを更新する
   * @returns 新しいランキング（最大 MAX_RANK 件）
   */
  static addScore(score: number): RankEntry[] {
    const ranking = this.getRanking();
    const now = new Date();
    const m   = String(now.getMonth() + 1).padStart(2, '0');
    const d   = String(now.getDate()).padStart(2, '0');
    const h   = String(now.getHours()).padStart(2, '0');
    const min = String(now.getMinutes()).padStart(2, '0');
    const today = `${m}/${d} ${h}:${min}`;
    ranking.push({ score, date: today });
    ranking.sort((a, b) => b.score - a.score);
    const newRanking = ranking.slice(0, MAX_RANK);
    localStorage.setItem(KEYS.RANKING, JSON.stringify(newRanking));
    this.saveHiScore(score);
    return newRanking;
  }
}
