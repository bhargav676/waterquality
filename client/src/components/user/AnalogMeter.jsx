import React, { useEffect, useRef } from "react";

const AnalogMeter = ({
  value = 0,
  min = 0,
  max = 10,
  unit = "",
  label = "",
  dangerMin,
  dangerMax,
  tickStep = 1,
  color = "#14b8a6"
}) => {
  // DIAL SIZING
  const SIZE = 200;
  const CX = SIZE / 2;
  const CY = SIZE / 2 + 10;
  const RADIUS = 80;
  const ARC_START = 135;
  const ARC_END = 405;
  const NEEDLE_LEN = RADIUS - 8;

  // Clamp value and map to angle
  const safeValue = value == null || isNaN(value) ? min : Math.max(min, Math.min(max, Number(value)));
  const percent = Math.max(0, Math.min(1, (safeValue - min) / (max - min)));
  const angleRange = ARC_END - ARC_START;
  const angle = ARC_START + percent * angleRange;
  const needleAngle = angle - 270;

  // Ensure dangerMin and dangerMax are numbers
  const safeDangerMin = Number(dangerMin);
  const safeDangerMax = Number(dangerMax);

  // Determine the color of the value based on the range
  let valueColorClass = "text-slate-800";
  let valueBgClass = "bg-transparent";
  if (!isNaN(safeDangerMin) && !isNaN(safeDangerMax)) {
    console.log({
      safeValue,
      safeDangerMin,
      safeDangerMax,
      isNormal: safeValue >= safeDangerMin && safeValue <= safeDangerMax,
      isBelow: safeValue < safeDangerMin,
      isAbove: safeValue > safeDangerMax
    });
    if (safeValue >= safeDangerMin && safeValue <= safeDangerMax) {
      valueColorClass = "text-green-700";
      valueBgClass = "bg-green-50";
    } else if (safeValue < safeDangerMin) {
      valueColorClass = "text-yellow-500";
      valueBgClass = "bg-yellow-50";
    } else if (safeValue > safeDangerMax) {
      valueColorClass = "text-red-600";
      valueBgClass = "bg-red-50";
    }
  }

  // Animate the needle
  const needleRef = useRef();
  useEffect(() => {
    if (!needleRef.current) return;
    needleRef.current.style.transition = "transform 0.9s cubic-bezier(0.25, 1, 0.5, 1)";
    needleRef.current.style.transform = `rotate(${needleAngle}deg)`;
  }, [needleAngle]);

  // Draw scale ticks (major and minor)
  const ticks = [];
  const minorTickStep = tickStep / 4;
  for (let t = min; t <= max; t += minorTickStep) {
    const tPercent = (t - min) / (max - min);
    const tAngle = ARC_START + tPercent * (ARC_END - ARC_START);
    const rad = (Math.PI / 180) * tAngle;
    const isMajor = Math.abs(t % tickStep) < 0.001;
    const tickLength = isMajor ? 6 : 3;
    const x1 = CX + (RADIUS - tickLength) * Math.cos(rad);
    const y1 = CY + (RADIUS - tickLength) * Math.sin(rad);
    const x2 = CX + (RADIUS + tickLength) * Math.cos(rad);
    const y2 = CY + (RADIUS + tickLength) * Math.sin(rad);
    const lx = CX + (RADIUS - 24) * Math.cos(rad);
    const ly = CY + (RADIUS - 24) * Math.sin(rad) + 5;

    ticks.push(
      <g key={t}>
        <line x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4b5563" strokeWidth={isMajor ? 2 : 1} />
        {isMajor && (
          <text
            x={lx}
            y={ly}
            textAnchor="middle"
            fontSize="12"
            fontFamily="Arial, sans-serif"
            fill="#1f2937"
            fontWeight="500"
            style={{ filter: "drop-shadow(0 1px 1px rgba(0,0,0,0.2))" }}
          >
            {t % 1 === 0 ? t : t.toFixed(1)}
          </text>
        )}
      </g>
    );
  }

  // Arc path function
  function arcPath(cx, cy, r, start, end) {
    const rad = Math.PI / 180;
    const x1 = cx + r * Math.cos(rad * start);
    const y1 = cy + r * Math.sin(rad * start);
    const x2 = cx + r * Math.cos(rad * end);
    const y2 = cy + r * Math.sin(rad * end);
    const largeArc = end - start > 180 ? 1 : 0;
    return `M${x1} ${y1} A${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
  }

  // Main arc with metallic effect
  const mainArc = (
    <path
      d={arcPath(CX, CY, RADIUS, ARC_START, ARC_END)}
      fill="none"
      stroke="url(#metallicGradient)"
      strokeWidth="14"
      strokeLinecap="round"
      filter="url(#glow)"
    />
  );

  // Meter needle points (thinner and more realistic)
  const pointerBase = 4;
  const pointerHeight = NEEDLE_LEN;

  return (
    <div className="w-full flex flex-col items-center justify-center pt-2 pb-1 group">
      <svg width={SIZE} height={SIZE * 0.75} viewBox={`0 0 ${SIZE} ${SIZE * 0.75}`}>
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          <linearGradient id="metallicGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: "#b0b7c0", stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: "#d1d9e0", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#b0b7c0", stopOpacity: 1 }} />
          </linearGradient>
          <radialGradient id="backgroundGradient" cx="50%" cy="50%" r="50%">
            <stop offset="0%" style={{ stopColor: "#f9fafb", stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: "#e5e7eb", stopOpacity: 1 }} />
          </radialGradient>
        </defs>
        <circle
          cx={CX}
          cy={CY}
          r={RADIUS + 12}
          fill="url(#backgroundGradient)"
          stroke="#d1d5db"
          strokeWidth="1.5"
          filter="drop-shadow(2px 2px 4px rgba(0,0,0,0.15))"
          className="transition-all duration-300 group-hover:filter group-hover:drop-shadow-[3px_3px_5px_rgba(0,0,0,0.2)]"
        />
        {mainArc}
        {ticks}
        <g
          ref={needleRef}
          style={{
            transform: `rotate(${needleAngle}deg)`,
            transformOrigin: `${CX}px ${CY}px`
          }}
        >
          <path
            d={`
              M${CX - pointerBase},${CY}
              L${CX},${CY - NEEDLE_LEN}
              L${CX + pointerBase},${CY}
              Z
            `}
            fill="#2d3748"
            stroke="#4b5563"
            strokeWidth="1"
            filter="drop-shadow(1px 1px 2px rgba(0,0,0,0.3))"
            className="transition-all duration-300 group-hover:filter group-hover:drop-shadow-[2px_2px_3px_rgba(0,0,0,0.4)]"
          />
          <circle cx={CX} cy={CY} r="8" fill="#d1d5db" stroke="#4b5563" strokeWidth="1.5" />
          <circle cx={CX} cy={CY} r="4" fill="#9ca3af" />
        </g>
        <ellipse
          cx={CX}
          cy={CY - 22}
          rx={RADIUS * 0.85}
          ry="10"
          fill="white"
          opacity=".15"
          className="transition-opacity duration-300 group-hover:opacity-[.2]"
        />
      </svg>
      <div className="flex flex-col items-center mt-2">
        <span className={`text-3xl font-bold ${valueColorClass} tracking-tight ${valueBgClass} px-3 py-1 rounded-md`}>
          {value !== null && value !== undefined && !isNaN(value) ? value.toFixed(2) : "--"}
          {unit && <span className="ml-1 text-base font-medium">{unit}</span>}
        </span>
        {label && (
          <span className="text-xs mt-1 text-slate-500 font-medium">{label}</span>
        )}
      </div>
    </div>
  );
};

export default AnalogMeter;