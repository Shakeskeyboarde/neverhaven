/**
 * Immutable 2D vector.
 */
export interface GamePosition {
  /**
   * Offset to the North (X) in meters from the center of a parent. Game world
   * tiles are 2x2 meters.
   */
  readonly north: number;

  /**
   * Offset to the East (Z) in meters from the center of a parent. Game world
   * tiles are 2x2 meters.
   */
  readonly east: number;
}
