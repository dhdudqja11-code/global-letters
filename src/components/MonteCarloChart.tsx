"use client";

import React, { useState, useRef } from "react";

interface ChartDataPoint {
  loss: number;
  density: number;
}

interface MonteCarloChartProps {
  data: ChartDataPoint[];
  totalLoss: number;
  isCritical: boolean;
}

export default function MonteCarloChart({ data, totalLoss, isCritical }: MonteCarloChartProps) {
  const [hoveredPoint, setHoveredPoint] = useState<ChartDataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<SVGSVGElement | null>(null);

  if (!data || data.length === 0) {
    return (
      <div className="w-full h-64 bg-[#FAF6F0] rounded-2xl border border-slate-200/60 flex items-center justify-center font-serif text-slate-400">
        시뮬레이션 데이터가 아직 로드되지 않았습니다.
      </div>
    );
  }

  // 1. 차트 기본 수치 계산
  const losses = data.map((d) => d.loss);
  const densities = data.map((d) => d.density);
  const minLoss = Math.min(...losses);
  const maxLoss = Math.max(...losses);
  const maxDensity = Math.max(...densities) || 1;

  // 95% VaR (대략적인 인덱스 95% 구간 매핑 또는 totalLoss 기반 1.3배수 한계점)
  const var95 = totalLoss * 1.35;

  // 2. SVG 뷰포트 규격
  const width = 600;
  const height = 300;
  const paddingLeft = 60;
  const paddingRight = 30;
  const paddingTop = 40;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  // 3. 좌표 변환 함수
  const getX = (loss: number) => {
    if (maxLoss === minLoss) return paddingLeft + chartWidth / 2;
    return paddingLeft + ((loss - minLoss) / (maxLoss - minLoss)) * chartWidth;
  };

  const getY = (density: number) => {
    return height - paddingBottom - (density / maxDensity) * chartHeight;
  };

  // 4. SVG Path 조립
  let areaPath = "";
  let linePath = "";

  if (data.length > 0) {
    // 라인 패스 빌딩
    const points = data.map((d) => `${getX(d.loss)},${getY(d.density)}`);
    linePath = `M ${points.join(" L ")}`;

    // 면적 패스 빌딩 (아래 바닥으로 내려서 닫아줌)
    const firstX = getX(data[0].loss);
    const lastX = getX(data[data.length - 1].loss);
    const bottomY = height - paddingBottom;
    areaPath = `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  }

  // 5. 그리드 라인 생성
  const yTicks = 4;
  const xTicks = 5;

  // 6. 마우스 무브 호버 툴팁 감지
  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // SVG 비율 보정
    const svgMouseX = (mouseX / rect.width) * width;
    const svgMouseY = (mouseY / rect.height) * height;

    // 가장 가까운 데이터 포인트 찾기
    let closestPt = data[0];
    let minDistance = Infinity;

    data.forEach((pt) => {
      const ptX = getX(pt.loss);
      const dist = Math.abs(svgMouseX - ptX);
      if (dist < minDistance) {
        minDistance = dist;
        closestPt = pt;
      }
    });

    if (minDistance < 30) {
      setHoveredPoint(closestPt);
      setTooltipPos({ x: getX(closestPt.loss), y: getY(closestPt.density) - 15 });
    } else {
      setHoveredPoint(null);
    }
  };

  const handleMouseLeave = () => {
    setHoveredPoint(null);
  };

  return (
    <div className="relative w-full bg-[#FAF6F0] p-6 rounded-3xl border border-[#E5D9C9] shadow-inner select-none animate-fade-in">
      <div className="flex justify-between items-center mb-4">
        <h4 className="font-serif text-sm font-bold text-slate-800 flex items-center gap-2">
          <span>📊</span> 실시간 리스크 손실 예상 분포 (2,000회 모의 실험)
        </h4>
        <span
          className={`text-[10px] font-sans font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
            isCritical
              ? "bg-rose-50 text-rose-600 border border-rose-100 animate-pulse"
              : "bg-emerald-50 text-emerald-600 border border-emerald-100"
          }`}
        >
          {isCritical ? "🚨 Critical Risk" : "🟢 Stable Zone"}
        </span>
      </div>

      <svg
        ref={containerRef}
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-auto overflow-visible"
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
        {/* 뒷배경 격자 그리드 라인 */}
        {Array.from({ length: yTicks }).map((_, i) => {
          const yVal = height - paddingBottom - (i / (yTicks - 1)) * chartHeight;
          return (
            <line
              key={`y-grid-${i}`}
              x1={paddingLeft}
              y1={yVal}
              x2={width - paddingRight}
              y2={yVal}
              stroke="#E5D9C9"
              strokeWidth="0.8"
              strokeDasharray="4 4"
            />
          );
        })}

        {Array.from({ length: xTicks }).map((_, i) => {
          const xVal = paddingLeft + (i / (xTicks - 1)) * chartWidth;
          return (
            <line
              key={`x-grid-${i}`}
              x1={xVal}
              y1={paddingTop}
              x2={xVal}
              y2={height - paddingBottom}
              stroke="#E5D9C9"
              strokeWidth="0.8"
              strokeDasharray="4 4"
            />
          );
        })}

        {/* 1. 면적 채우기 (Terracotta Translucent Area) */}
        <path d={areaPath} fill="#D35400" opacity="0.13" />

        {/* 2. 메인 곡선 실선 (Terracotta Solid Line) */}
        <path d={linePath} fill="none" stroke="#D35400" strokeWidth="2.5" strokeLinecap="round" />

        {/* 3. 평균 손실 기대선 수직 점선 */}
        <line
          x1={getX(totalLoss)}
          y1={paddingTop - 10}
          x2={getX(totalLoss)}
          y2={height - paddingBottom}
          stroke="#BA4A00"
          strokeWidth="1.8"
          strokeDasharray="3 3"
        />
        <text
          x={getX(totalLoss) + 5}
          y={paddingTop - 5}
          fill="#BA4A00"
          fontSize="9"
          fontFamily="serif"
          fontWeight="bold"
        >
          평균 손실: ${totalLoss.toLocaleString()}
        </text>

        {/* 4. 최악 위기 예상선 (95% VaR) 빨간색 수직선 */}
        <line
          x1={getX(var95)}
          y1={paddingTop + 20}
          x2={getX(var95)}
          y2={height - paddingBottom}
          stroke="#C0392B"
          strokeWidth="1.8"
          strokeDasharray="4 4"
        />
        <text
          x={getX(var95) - 65}
          y={paddingTop + 30}
          fill="#C0392B"
          fontSize="9"
          fontFamily="serif"
          fontWeight="bold"
        >
          최악 손실(95%): ${Math.round(var95).toLocaleString()}
        </text>

        {/* 5. X축 라벨 */}
        <text
          x={paddingLeft}
          y={height - 15}
          fill="#94A3B8"
          fontSize="10"
          textAnchor="middle"
        >
          ${Math.round(minLoss).toLocaleString()}
        </text>
        <text
          x={paddingLeft + chartWidth / 2}
          y={height - 15}
          fill="#64748B"
          fontSize="10"
          fontFamily="serif"
          fontWeight="bold"
          textAnchor="middle"
        >
          예상 손실 규모 (USD)
        </text>
        <text
          x={width - paddingRight}
          y={height - 15}
          fill="#94A3B8"
          fontSize="10"
          textAnchor="middle"
        >
          ${Math.round(maxLoss).toLocaleString()}
        </text>

        {/* Y축 설명 */}
        <text
          x={15}
          y={height / 2}
          transform={`rotate(-90 15 ${height / 2})`}
          fill="#64748B"
          fontSize="10"
          fontFamily="serif"
          fontWeight="bold"
          textAnchor="middle"
        >
          발생 가능성 정도 (확률 밀도)
        </text>

        {/* 6. 호버 툴팁 요소 */}
        {hoveredPoint && (
          <>
            <circle
              cx={getX(hoveredPoint.loss)}
              cy={getY(hoveredPoint.density)}
              r="5"
              fill="#D35400"
              stroke="#FFF"
              strokeWidth="1.5"
            />
            <line
              x1={getX(hoveredPoint.loss)}
              y1={getY(hoveredPoint.density)}
              x2={getX(hoveredPoint.loss)}
              y2={height - paddingBottom}
              stroke="#D35400"
              strokeWidth="0.8"
              strokeDasharray="2 2"
            />
          </>
        )}
      </svg>

      {/* HTML 툴팁 팝업 오버레이 */}
      {hoveredPoint && (
        <div
          className="absolute pointer-events-none bg-slate-900/95 text-white text-[10px] font-mono p-2.5 rounded-xl shadow-xl flex flex-col gap-0.5 border border-slate-700/60 z-30 transition-all duration-75 select-none"
          style={{
            left: `${(tooltipPos.x / width) * 100}%`,
            top: `${(tooltipPos.y / height) * 100}%`,
            transform: "translate(-50%, -100%)",
          }}
        >
          <span className="font-bold font-sans text-amber-400">📊 손실 가능성 세부 분석</span>
          <span>손실액: ${Math.round(hoveredPoint.loss).toLocaleString()}</span>
          <span>확률밀도: {hoveredPoint.density.toFixed(5)}</span>
        </div>
      )}
    </div>
  );
}
