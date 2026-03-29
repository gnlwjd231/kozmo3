/**
 * Linear interpolation
 * @param {number} start - 현재값
 * @param {number} end   - 목표값
 * @param {number} t     - 보간 계수 (0~1), 작을수록 느리고 부드럽게
 */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}
