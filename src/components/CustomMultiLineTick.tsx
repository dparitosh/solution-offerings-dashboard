import React from 'react';
import { wrapTextIntoLines } from '../utils/calculations';

interface CustomMultiLineTickProps {
  x?: number;
  y?: number;
  payload?: {
    value: string | number;
  };
  maxChars?: number;
  fontSize?: number;
  maxLines?: number;
  lineHeight?: number;
  fill?: string;
  fontWeight?: number | string;
}

export const CustomMultiLineTick: React.FC<CustomMultiLineTickProps> = ({
  x = 0,
  y = 0,
  payload,
  maxChars = 12,
  fontSize = 8,
  maxLines = 4,
  lineHeight = 10,
  fill = '#475569',
  fontWeight = 500,
}) => {
  if (!payload || payload.value === undefined || payload.value === null) return null;
  const rawText = String(payload.value);
  const lines = wrapTextIntoLines(rawText, maxChars, maxLines);

  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={8}
        textAnchor="middle"
        fill={fill}
        fontSize={fontSize}
        fontWeight={fontWeight}
        className="select-none"
      >
        <title>{rawText}</title>
        {lines.map((line, idx) => (
          <tspan x={0} dy={idx === 0 ? 0 : lineHeight} key={idx}>
            {line}
          </tspan>
        ))}
      </text>
    </g>
  );
};
