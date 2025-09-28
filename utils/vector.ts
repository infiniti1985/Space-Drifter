
import type { Vector2D } from '../types';

export const add = (v1: Vector2D, v2: Vector2D): Vector2D => ({
  x: v1.x + v2.x,
  y: v1.y + v2.y,
});

export const subtract = (v1: Vector2D, v2: Vector2D): Vector2D => ({
  x: v1.x - v2.x,
  y: v1.y - v2.y,
});

export const scale = (v: Vector2D, scalar: number): Vector2D => ({
  x: v.x * scalar,
  y: v.y * scalar,
});

export const magnitude = (v: Vector2D): number => {
  return Math.sqrt(v.x * v.x + v.y * v.y);
};

export const normalize = (v: Vector2D): Vector2D => {
  const mag = magnitude(v);
  if (mag === 0) return { x: 0, y: 0 };
  return scale(v, 1 / mag);
};

export const distance = (p1: Vector2D, p2: Vector2D): number => {
    return magnitude(subtract(p1, p2));
};
