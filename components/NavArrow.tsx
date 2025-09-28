import React from 'react';
import type { Vector2D } from '../types';
import * as Vec from '../utils/vector';

interface NavArrowProps {
  target: Vector2D;
  source: Vector2D;
  cameraScale: number;
  viewportWidth: number;
  viewportHeight: number;
  color: string;
  label: string;
  isSecondary?: boolean;
}

// How far from the edge of the screen the arrow should be
const PADDING = 60; 

const NavArrow: React.FC<NavArrowProps> = ({ target, source, cameraScale, viewportWidth, viewportHeight, color, label, isSecondary = false }) => {
  const center = { x: viewportWidth / 2, y: viewportHeight / 2 };

  // Calculate where the target would appear on screen if it were visible
  const targetScreenPos = {
    x: (target.x - source.x) * cameraScale + center.x,
    y: (target.y - source.y) * cameraScale + center.y,
  };

  // Check if the target is on-screen. If so, don't render the arrow.
  const isTargetVisible =
    targetScreenPos.x > PADDING &&
    targetScreenPos.x < viewportWidth - PADDING &&
    targetScreenPos.y > PADDING &&
    targetScreenPos.y < viewportHeight - PADDING;

  if (isTargetVisible) {
    return null;
  }

  // Calculate the angle from the ship to the star
  const angleRad = Math.atan2(target.y - source.y, target.x - source.x);
  const angleDeg = angleRad * (180 / Math.PI);

  // Clamp the arrow's position to the edges of the screen
  const boundX = viewportWidth - PADDING;
  const boundY = viewportHeight - PADDING;
  const tan = Math.tan(angleRad);
  
  let x = center.x;
  let y = center.y;

  // Use trigonometry to find the intersection point with the screen boundary
  if (Math.abs(tan) < boundY / boundX) {
      // Intersects left or right edge
      x = center.x + (boundX / 2) * Math.sign(Math.cos(angleRad));
      y = center.y + (boundX / 2) * tan * Math.sign(Math.cos(angleRad));
  } else {
      // Intersects top or bottom edge
      x = center.x + (boundY / 2 / tan) * Math.sign(Math.sin(angleRad));
      y = center.y + (boundY / 2) * Math.sign(Math.sin(angleRad));
  }
  
  // Calculate distance and format it for readability
  const distance = Vec.distance(source, target);
  const distanceDisplay = distance > 1000 ? `${(distance / 1000).toFixed(1)}k` : `${Math.round(distance)}`;

  const arrowHeight = isSecondary ? 12 : 16;
  const borderSize = isSecondary ? 6 : 8;

  return (
    <div
      className="font-mono-retro fixed flex flex-col items-center z-50 pointer-events-none transition-all duration-100 ease-linear"
      style={{
        left: `${x}px`,
        top: `${y}px`,
        // Position and rotate the arrow container to point at the target
        transform: `translate(-50%, -50%) rotate(${angleDeg + 90}deg)`,
        color: color,
      }}
      aria-live="polite"
      aria-label={`${label} is ${distanceDisplay} units away`}
    >
      {/* A CSS triangle for the arrow head */}
      <div 
        className="w-0 h-0"
        style={{
          borderLeft: `${borderSize}px solid transparent`,
          borderRight: `${borderSize}px solid transparent`,
          borderBottom: `${arrowHeight}px solid ${color}`,
        }}
      />
      {/* Counter-rotate the text to keep it upright */}
      <span className={`mt-1 ${isSecondary ? 'text-xs' : 'text-sm'}`} style={{ transform: 'rotate(-90deg)' }}>
        {distanceDisplay}
      </span>
    </div>
  );
};

export default NavArrow;
