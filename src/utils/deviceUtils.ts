/**
 * デバイス判定ユーティリティ
 */

/**
 * タッチ専用デバイス（スマホ・タブレット）かどうかを返す。
 * マウスなどホバー操作が使えるPC（タッチスクリーン付きも含む）は false。
 * CSS メディアクエリ `(hover: hover) and (pointer: fine)` でマウスを判定。
 */
export function isTouchOnlyDevice(): boolean {
  // マウス操作可能なデバイスはPC扱い
  return !window.matchMedia('(hover: hover) and (pointer: fine)').matches;
}
