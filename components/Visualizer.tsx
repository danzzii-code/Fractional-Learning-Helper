
import React from 'react';
import { MathProblem } from '../types';
import { Citrus, Apple, Star, Cherry } from 'lucide-react';

interface VisualizerProps {
  problem: MathProblem;
  isPartitioned?: boolean;
  onRulerClick?: (value: number) => void;
  onSegmentClick?: (index: number) => void;
  activeSegments?: number;
}

export const Visualizer: React.FC<VisualizerProps> = ({ 
  problem, 
  isPartitioned = true,
  onRulerClick,
  onSegmentClick,
  activeSegments = 0
}) => {
  
  // Helper to render fraction vertically
  const renderVerticalFraction = (numerator: number | string, denominator: number | string) => (
    <div className="inline-flex flex-col items-center align-middle mx-1" style={{ verticalAlign: 'middle' }}>
      <span className="font-bold text-black border-b-2 border-black px-1 leading-none mb-0.5 text-sm md:text-base">{numerator}</span>
      <span className="font-bold text-black leading-none text-sm md:text-base">{denominator}</span>
    </div>
  );

  // --- RENDER MODE: LENGTH (Number Line) ---
  if (problem.subType === 'length') {
    const segments = Array.from({ length: problem.totalGroups }, (_, i) => i);
    
    return (
      <div className="w-full py-8 px-4">
        {/* Title / Explanation specific to length */}
        <div className="mb-6 flex items-center justify-center text-center text-gray-600 font-medium flex-wrap">
          <span>{problem.totalItems}cm의</span>
          {renderVerticalFraction(problem.targetGroups, problem.totalGroups)}
          <span>은(는) 얼마인지 알아보기</span>
        </div>

        {/* Wrapper with padding for the unit label */}
        <div className="relative pt-6 pb-2 pr-12">
          
          {/* Number Line */}
          <div className="relative h-8 w-full border-b-2 border-black mb-1">
            {Array.from({ length: problem.totalItems + 1 }).map((_, i) => {
               const isClickableRuler = !isPartitioned && onRulerClick && i > 0;
               return (
                <div 
                  key={i} 
                  className="absolute bottom-0 flex flex-col items-center" 
                  style={{ left: `${(i / problem.totalItems) * 100}%`, transform: 'translateX(-50%)' }}
                >
                  {/* Tick Mark */}
                  <div className="h-3 w-0.5 bg-black"></div>
                  {/* Number Label */}
                  <span 
                    onClick={() => isClickableRuler && onRulerClick(i)}
                    className={`
                      absolute top-full mt-2 text-sm md:text-base font-bold whitespace-nowrap select-none
                      ${isClickableRuler ? 'cursor-pointer text-pink-500 hover:text-pink-700 hover:scale-125 transition-transform animate-pulse' : ''}
                    `}
                  >
                    {i}
                  </span>
                </div>
               );
            })}
          </div>

          {/* Unit Label */}
          <div className="absolute right-0 top-[2.6rem] text-sm md:text-base font-bold text-gray-600">
            (cm)
          </div>

          {/* Bar Model */}
          <div className="relative w-full mt-8">
            {!isPartitioned ? (
              // Unpartitioned State (Empty Bar)
              <div className="w-full h-12 border-2 border-gray-300 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400 text-sm animate-pulse">
                 👆 눈금 숫자를 눌러서 한 묶음(단위분수)을 찾아보세요!
              </div>
            ) : (
              // Partitioned State (Grid)
              <div className="flex w-full h-12 border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
                {segments.map((index) => {
                  // Determine active state: 
                  // If onSegmentClick is present (Interactive Mode), use activeSegments count.
                  // Otherwise (Static Answer Mode), use problem.targetGroups.
                  const isActive = onSegmentClick 
                    ? index < activeSegments 
                    : index < problem.targetGroups;
                  
                  const isInteractive = !!onSegmentClick;

                  return (
                    <div 
                      key={index}
                      onClick={() => isInteractive && onSegmentClick && onSegmentClick(index)}
                      className={`
                        flex-1 border-r border-gray-200 last:border-r-0 transition-all duration-300 relative
                        ${isActive ? 'bg-sky-300/80' : 'bg-white'}
                        ${isInteractive ? 'cursor-pointer hover:bg-sky-100' : ''}
                      `}
                    >
                      {isActive && (
                         <div className="w-full h-full border-r-2 border-sky-400 last:border-none"></div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            
            {isPartitioned && onSegmentClick && (
               <div className="text-center text-xs text-gray-400 mt-2">
                 👆 칸을 클릭해서 {problem.targetGroups}칸을 색칠해보세요!
               </div>
            )}
          </div>

        </div>
      </div>
    );
  }

  // --- RENDER MODE: DISCRETE ITEMS ---
  const renderIcon = (size: number) => {
    const props = { size, className: "text-secondary fill-orange-200 drop-shadow-sm" };
    switch (problem.itemType) {
      case 'apple': return <Apple {...props} className="text-red-500 fill-red-200" />;
      case 'strawberry': return <Cherry {...props} className="text-pink-600 fill-pink-300" />;
      case 'star': return <Star {...props} className="text-yellow-400 fill-yellow-100" />;
      case 'orange':
      default: return <Citrus {...props} />;
    }
  };

  // Unpartitioned State: Show ungrouped items (Simple Grid)
  if (!isPartitioned && problem.subType === 'discrete') {
    return (
       <div className="flex flex-col items-center">
          <div className="mb-4 text-center text-gray-500 font-medium animate-pulse">
            몇 묶음인지 맞추면 그림이 묶여요!
          </div>
          <div className="flex flex-wrap justify-center gap-4 p-4 max-w-lg bg-white/50 rounded-2xl border-2 border-dashed border-gray-200">
            {Array.from({ length: problem.totalItems }).map((_, i) => (
              <div key={i} className="animate-bounce-slow">
                {renderIcon(40)}
              </div>
            ))}
          </div>
       </div>
    );
  }

  // Partitioned State: Show grouped items
  const groups = Array.from({ length: problem.totalGroups }, (_, i) => i);

  return (
    <div className="flex flex-col items-center">
      {problem.lessonType === 'value_finding' && (
        <div className="mb-4 flex items-center justify-center text-center text-gray-600 font-medium flex-wrap">
          <span>{problem.totalItems}의</span>
          {renderVerticalFraction(problem.targetGroups, problem.totalGroups)}
          <span>는 얼마인지 알아보기</span>
        </div>
      )}
      
      <div className="flex flex-wrap justify-center gap-4 md:gap-8 py-4 animate-in zoom-in duration-500">
        {groups.map((groupIndex) => {
          // In 'value_finding', we visually highlight the 'target' groups to help them count.
          // In 'representation', we usually show them equally, but highlighting the target helps understanding too.
          const isTargetGroup = groupIndex < problem.targetGroups;

          return (
            <div 
              key={groupIndex} 
              className={`
                relative flex gap-1 p-3 rounded-xl border-4 transition-all duration-300
                ${isTargetGroup 
                  ? 'bg-white border-primary shadow-md scale-105 z-10' 
                  : 'bg-white/60 border-gray-200 opacity-80'
                }
              `}
            >
              {Array.from({ length: problem.groupSize }).map((_, itemIndex) => (
                <div key={itemIndex} className="animate-bounce-slow">
                  {renderIcon(40)}
                </div>
              ))}
              
              {/* Group Number Badge */}
              <div className="absolute -top-3 -right-3 w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs text-gray-500 font-bold border border-gray-200">
                {groupIndex + 1}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
