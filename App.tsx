import React, { useState, useEffect } from 'react';
import { MathProblem, LessonType } from './types';
import { Visualizer } from './components/Visualizer';
import { getMathExplanation, getInitialGreeting, getRandomFeedback } from './services/geminiService';
import { Sparkles, ArrowRight, RefreshCw, CheckCircle2, XCircle, Home, Calculator } from 'lucide-react';
import { APP_TITLE, APP_SUBTITLE } from './constants';

// --- PROBLEM GENERATOR ---
const generateProblem = (lessonType: LessonType): MathProblem => {
  const itemTypes = ['orange', 'apple', 'strawberry', 'star'] as const;
  
  // Common Logic
  const multipliers = [2, 3, 4, 5];
  const groupSize = multipliers[Math.floor(Math.random() * multipliers.length)];
  
  const maxGroups = Math.floor(20 / groupSize);
  const minGroups = 2; 
  const totalGroups = Math.floor(Math.random() * (maxGroups - minGroups + 1)) + minGroups; // Denominator
  const totalItems = groupSize * totalGroups; // Whole (or Total Length)
  
  const targetGroups = Math.floor(Math.random() * (totalGroups - 1)) + 1; // Numerator
  const targetItems = targetGroups * groupSize; // The Answer value

  // Lesson 2 Specific: Decide if it's Discrete (Fruit) or Length (Ruler)
  let subType: 'discrete' | 'length' = 'discrete';
  let itemType: any = itemTypes[Math.floor(Math.random() * itemTypes.length)];

  if (lessonType === 'value_finding') {
    // 50% chance for length problem in Lesson 2
    if (Math.random() > 0.5) {
      subType = 'length';
      itemType = 'ruler';
      // For length, keep numbers small enough to fit on a mobile screen nicely
    }
  }

  return {
    lessonType,
    subType,
    totalItems,
    groupSize,
    totalGroups,
    targetGroups,
    targetItems,
    itemType
  };
};

const App: React.FC = () => {
  const [selectedLesson, setSelectedLesson] = useState<LessonType | null>(null);
  const [problem, setProblem] = useState<MathProblem | null>(null);
  
  // Inputs for Lesson 1
  const [numerator, setNumerator] = useState('');
  const [denominator, setDenominator] = useState('');
  const [userTotalGroups, setUserTotalGroups] = useState(''); // For Step 1: Grouping input
  
  // Inputs for Lesson 2
  const [userValue, setUserValue] = useState(''); // For Final Answer
  const [userUnitValue, setUserUnitValue] = useState(''); // For Lesson 2 Step 1: Unit Value input (e.g., 1/3 is ?)
  
  // State for partitioning/interaction
  const [isPartitioned, setIsPartitioned] = useState(true); // Controls if items are grouped or ruler is grid-lined
  const [activeSegments, setActiveSegments] = useState(0);  // For interactive ruler coloring

  const [feedback, setFeedback] = useState<string>('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [tutorMessage, setTutorMessage] = useState<string>("로딩 중...");

  // Initialize
  useEffect(() => {
    const init = async () => {
      const msg = await getInitialGreeting();
      setTutorMessage(msg);
    };
    init();
  }, []);

  const startLesson = (type: LessonType) => {
    setSelectedLesson(type);
    setProblem(generateProblem(type));
    resetState(type);
  };

  const resetState = (type: LessonType | null) => {
    setNumerator('');
    setDenominator('');
    setUserValue('');
    setUserTotalGroups('');
    setUserUnitValue('');
    setActiveSegments(0);
    setIsCorrect(null);
    setFeedback('');
    setTutorMessage("문제를 잘 보고 풀어보세요!");
    
    // Initial Partition State Logic
    if (type === 'representation') {
      // Lesson 1: Start ungrouped (false)
      setIsPartitioned(false);
    } else if (type === 'value_finding') {
      // Lesson 2: Both Length and Discrete start unpartitioned/interactive
      setIsPartitioned(false);
    } else {
      setIsPartitioned(true);
    }
  };

  const goHome = () => {
    setSelectedLesson(null);
    setProblem(null);
    resetState(null);
    getInitialGreeting().then(setTutorMessage);
  };

  const handleNext = () => {
    if (selectedLesson) {
      setProblem(generateProblem(selectedLesson));
      resetState(selectedLesson);
    }
  };

  // --- HANDLERS ---

  // Lesson 1 Step 1: Check Total Groups
  const checkTotalGroups = () => {
    if (!problem) return;
    const val = parseInt(userTotalGroups);
    if (isNaN(val)) {
      setTutorMessage("묶음 수를 입력해주세요!");
      return;
    }

    if (val === problem.totalGroups) {
      setIsPartitioned(true); // Triggers the grouping animation
      setTutorMessage(getRandomFeedback(true) + " 이제 분수를 입력해보세요!");
    } else {
      setTutorMessage(`아니에요! 전체 ${problem.totalItems}개를 ${problem.groupSize}개씩 묶어보세요.`);
    }
  };

  // Lesson 2 Discrete Step 1: Check Unit Value (e.g. 1/3 of 15)
  const checkUnitValue = () => {
    if (!problem) return;
    const val = parseInt(userUnitValue);
    if (isNaN(val)) {
      setTutorMessage("숫자를 입력해주세요!");
      return;
    }

    // In value finding, unit value is the groupSize (e.g. 15 items / 3 groups = 5 items)
    if (val === problem.groupSize) {
      setIsPartitioned(true); // Visualizer groups the items
      setTutorMessage(getRandomFeedback(true) + " 맞아요! 그림이 묶였어요. 이제 전체 값을 구해볼까요?");
    } else {
      setTutorMessage(`아니에요. 전체 ${problem.totalItems}개를 ${problem.totalGroups}묶음으로 똑같이 나누면 한 묶음에 몇 개일까요?`);
    }
  };

  // Lesson 2 (Length): Handle Ruler Click for Partitioning
  const handleRulerClick = (value: number) => {
    if (!problem) return;
    if (value === problem.groupSize) {
      setIsPartitioned(true);
      setTutorMessage(getRandomFeedback(true) + ` 맞아요! 한 칸이 ${value}cm입니다. 이제 ${problem.targetGroups}칸을 색칠해보세요!`);
    } else {
      setTutorMessage(`전체 ${problem.totalItems}cm를 ${problem.totalGroups}칸으로 똑같이 나누려면 한 칸이 얼마여야 할까요?`);
    }
  };

  // Lesson 2 (Length): Handle Segment Click for Coloring
  const handleSegmentClick = (index: number) => {
    if (!problem) return;
    const newCount = index + 1;
    
    if (newCount > problem.targetGroups) {
      setTutorMessage(`잠깐! 분자가 ${problem.targetGroups}이니까 ${problem.targetGroups}칸만 색칠해야 해요!`);
      return;
    }

    setActiveSegments(newCount);
    if (newCount === problem.targetGroups) {
       setTutorMessage(`잘했어요! 이제 ${problem.targetGroups}칸은 몇 cm인지 적어보세요.`);
    }
  };

  // Final Check
  const handleCheck = async () => {
    if (!problem) return;

    let correct = false;

    if (selectedLesson === 'representation') {
      const num = parseInt(numerator);
      const den = parseInt(denominator);
      if (isNaN(num) || isNaN(den)) {
        setTutorMessage("숫자를 모두 입력해주세요!");
        return;
      }
      correct = num === problem.targetGroups && den === problem.totalGroups;
    } else {
      const val = parseInt(userValue);
      if (isNaN(val)) {
        setTutorMessage("정답을 입력해주세요!");
        return;
      }
      correct = val === problem.targetItems;
    }

    setLoading(true);
    setIsCorrect(correct);
    setTutorMessage(getRandomFeedback(correct)); 

    // Get AI feedback in background
    const aiFeedback = await getMathExplanation({
      problem,
      isCorrect: correct,
      userNumerator: numerator,
      userDenominator: denominator,
      userValue: userValue
    });
    
    setTutorMessage(aiFeedback);
    setLoading(false);
  };

  // --- RENDER: HOME SCREEN ---
  if (!selectedLesson) {
    return (
      <div className="min-h-screen bg-[#FFF0F5] flex flex-col items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="animate-bounce-slow">
             <Sparkles size={60} className="text-pink-400 mx-auto mb-4" />
          </div>
          <h1 className="text-4xl font-display text-pink-600 mb-2">3학년 2학기 분수 천재되기</h1>
          <p className="text-gray-500 mb-8">공부할 내용을 선택해주세요!</p>

          <div className="grid gap-4">
            <button 
              onClick={() => startLesson('representation')}
              className="bg-white hover:bg-pink-50 border-4 border-pink-200 rounded-3xl p-6 flex items-center gap-4 shadow-lg hover:scale-105 transition-all group text-left"
            >
              <div className="bg-pink-100 p-3 rounded-full group-hover:bg-pink-200">
                <Calculator className="text-pink-500" size={32} />
              </div>
              <div>
                <div className="text-sm text-pink-400 font-bold mb-1">2차시</div>
                <div className="text-xl font-bold text-gray-700">분수로 나타내기</div>
                <div className="text-xs text-gray-400 mt-1">부분과 전체의 관계 알기</div>
              </div>
            </button>

            <button 
              onClick={() => startLesson('value_finding')}
              className="bg-white hover:bg-blue-50 border-4 border-blue-200 rounded-3xl p-6 flex items-center gap-4 shadow-lg hover:scale-105 transition-all group text-left"
            >
              <div className="bg-blue-100 p-3 rounded-full group-hover:bg-blue-200">
                <Calculator className="text-blue-500" size={32} />
              </div>
              <div>
                <div className="text-sm text-blue-400 font-bold mb-1">3~4차시</div>
                <div className="text-xl font-bold text-gray-700">분수만큼 알아보기</div>
                <div className="text-xs text-gray-400 mt-1">전체에 대한 분수의 값 구하기</div>
              </div>
            </button>
          </div>
          
          <div className="mt-12 text-gray-400 text-sm">
            안녕! 냠냠 분수랑 같이 신나는 모험 떠나볼까?
          </div>
        </div>
      </div>
    );
  }

  // --- RENDER: PROBLEM SCREEN ---
  if (!problem) return <div className="flex h-screen items-center justify-center bg-pink-50 text-pink-400 font-display text-2xl animate-pulse">문제 만드는 중...</div>;

  const isRepresentation = selectedLesson === 'representation';

  return (
    <div className="min-h-screen bg-[#FDF2F8] flex flex-col items-center justify-center p-4 font-sans selection:bg-pink-200">
      
      {/* Main Card */}
      <div className="w-full max-w-2xl bg-white rounded-[2.5rem] border-[6px] border-pink-300 shadow-[0_10px_0_rgb(249,168,212)] overflow-hidden relative">
        
        {/* Header Badge */}
        <div className="absolute -top-1 left-1/2 transform -translate-x-1/2 w-full px-4 flex justify-center">
          <div className="bg-[#BE185D] text-white px-6 py-2 rounded-b-2xl shadow-lg flex items-center gap-2">
            <Sparkles size={20} className="text-yellow-300" />
            <h1 className="font-display text-lg md:text-xl tracking-wider truncate">
              {isRepresentation ? '분수로 나타내기' : '분수만큼 알아보기'}
            </h1>
            <Sparkles size={20} className="text-yellow-300" />
          </div>
        </div>

        {/* Home Button */}
        <button 
          onClick={goHome} 
          className="absolute top-4 left-4 text-gray-400 hover:text-pink-500 transition-colors"
          aria-label="Go Home"
        >
          <Home size={28} />
        </button>

        <div className="pt-20 pb-10 px-6 md:px-12 text-center">
          
          {/* Visualizer */}
          <div className="bg-blue-50 rounded-3xl p-2 mb-8 border-2 border-blue-100 min-h-[200px] flex items-center justify-center">
            <Visualizer 
              problem={problem} 
              isPartitioned={isPartitioned} 
              onRulerClick={handleRulerClick}
              onSegmentClick={handleSegmentClick}
              activeSegments={activeSegments}
            />
          </div>

          {/* --- LESSON 1 UI: INTERACTIVE GROUPING & FRACTION --- */}
          {isRepresentation && (
            <div className="text-left space-y-6 text-lg md:text-2xl font-medium text-gray-700 leading-relaxed">
              {/* Step 1: Calculate Groups */}
              <div className="flex items-center flex-wrap gap-3">
                <CheckCircle2 className="text-black mt-1 flex-shrink-0" size={24} />
                <p>
                  <span className="font-bold text-black">{problem.totalItems}</span>를 
                  <span className="font-bold text-black mx-1">{problem.groupSize}</span>씩 묶으면
                </p>
                <input 
                  type="tel" 
                  value={userTotalGroups}
                  onChange={(e) => setUserTotalGroups(e.target.value)}
                  disabled={isPartitioned} // Disable after correct
                  className={`w-16 h-12 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-4 transition-colors ${isPartitioned ? 'bg-green-50 border-green-400 text-green-600' : 'border-gray-300 focus:border-pink-400'}`}
                  placeholder="?"
                />
                <p>묶음입니다.</p>
                {!isPartitioned && (
                  <button 
                    onClick={checkTotalGroups}
                    className="bg-pink-400 hover:bg-pink-500 text-white text-sm px-4 py-2 rounded-lg shadow-sm ml-2"
                  >
                    확인
                  </button>
                )}
              </div>

              {/* Step 2: Fraction Input (Visible after Step 1) */}
              {isPartitioned && (
                <div className="flex items-center flex-wrap gap-3 animate-fade-in-up border-t-2 border-dashed border-gray-200 pt-4">
                   <ArrowRight className="text-pink-500" size={28} strokeWidth={4} />
                   <p className="mr-2">
                     <span className="font-bold text-black">{problem.targetGroups}</span>는 
                     <span className="font-bold text-black mx-1">{problem.totalGroups}</span>의
                   </p>
                   <div className="inline-flex flex-col items-center align-middle mx-2 relative top-2">
                      <input 
                        type="tel" 
                        value={numerator}
                        onChange={(e) => setNumerator(e.target.value)}
                        disabled={isCorrect === true}
                        className={`w-16 h-12 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-4 transition-colors ${isCorrect === true ? 'bg-green-50 border-green-400 text-green-600' : isCorrect === false ? 'bg-red-50 border-red-400 text-red-600' : 'border-gray-300 focus:border-pink-400'}`}
                        placeholder="?"
                      />
                      <div className="w-full h-1 bg-gray-800 my-1 rounded-full"></div>
                      <input 
                        type="tel" 
                        value={denominator}
                        onChange={(e) => setDenominator(e.target.value)}
                        disabled={isCorrect === true}
                        className={`w-16 h-12 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-4 transition-colors ${isCorrect === true ? 'bg-green-50 border-green-400 text-green-600' : isCorrect === false ? 'bg-red-50 border-red-400 text-red-600' : 'border-gray-300 focus:border-pink-400'}`}
                        placeholder="?"
                      />
                   </div>
                   <p>입니다.</p>
                </div>
              )}
            </div>
          )}

          {/* --- LESSON 2 UI: VALUE INPUT --- */}
          {!isRepresentation && (
            <div className="text-left space-y-6 text-lg md:text-2xl font-medium text-gray-700 leading-relaxed">
              
              {problem.subType === 'discrete' ? (
                /* Discrete Logic Text */
                <>
                  <div className="flex items-center flex-wrap gap-1 md:gap-2">
                     <ArrowRight className="text-pink-500 mr-1 md:mr-2 flex-shrink-0" size={24} strokeWidth={3} />
                     <span>전체</span>
                     <span className="font-bold text-black">{problem.totalItems}</span>
                     <span>의</span>
                     <div className="inline-flex flex-col items-center align-middle mx-1">
                        <span className="font-bold text-black border-b-2 border-black px-1 leading-none mb-0.5">1</span>
                        <span className="font-bold text-black leading-none">{problem.totalGroups}</span>
                     </div>
                     <span>은(는)</span>
                     {/* Unit Value Input */}
                     <input 
                        type="tel" 
                        value={userUnitValue}
                        onChange={(e) => setUserUnitValue(e.target.value)}
                        disabled={isPartitioned} // Disable after correct
                        className={`w-16 h-12 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-4 transition-colors mx-1 ${isPartitioned ? 'bg-green-50 border-green-400 text-green-600' : 'border-gray-300 focus:border-blue-400'}`}
                        placeholder="?"
                     />
                     <span>입니다.</span>
                     {!isPartitioned && (
                        <button 
                          onClick={checkUnitValue}
                          className="bg-blue-400 hover:bg-blue-500 text-white text-sm px-4 py-2 rounded-lg shadow-sm ml-2"
                        >
                          확인
                        </button>
                     )}
                  </div>
                  
                  {isPartitioned && (
                    <div className="flex items-center flex-wrap gap-1 md:gap-2 animate-fade-in-up mt-4">
                       <CheckCircle2 className="text-black mr-1 md:mr-2" size={24} />
                       <span>그렇다면</span>
                       <span className="font-bold text-black">{problem.totalItems}</span>
                       <span>의</span>
                       <div className="inline-flex flex-col items-center align-middle mx-1">
                          <span className="font-bold text-black border-b-2 border-black px-1 leading-none mb-0.5">{problem.targetGroups}</span>
                          <span className="font-bold text-black leading-none">{problem.totalGroups}</span>
                       </div>
                       <span>는</span>
                       <input 
                          type="tel" 
                          value={userValue}
                          onChange={(e) => setUserValue(e.target.value)}
                          disabled={isCorrect === true}
                          className={`w-20 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-4 transition-colors mx-2 ${isCorrect === true ? 'bg-green-50 border-green-400 text-green-600' : isCorrect === false ? 'bg-red-50 border-red-400 text-red-600' : 'border-gray-300 focus:border-blue-400'}`}
                          placeholder="?"
                        />
                        <span>입니다.</span>
                    </div>
                  )}
                </>
              ) : (
                /* Length Logic Text */
                <>
                   <div className="flex items-center flex-wrap gap-2 animate-fade-in-up justify-center text-xl md:text-2xl">
                     <div className="flex items-center">
                       <span className="font-bold text-black">{problem.totalItems} cm</span>의
                     </div>
                     
                     <div className="inline-flex flex-col items-center align-middle mx-2">
                       <span className="font-bold text-black border-b-2 border-black px-2 leading-none mb-1">{problem.targetGroups}</span>
                       <span className="font-bold text-black leading-none">{problem.totalGroups}</span>
                     </div>

                     <div className="flex items-center gap-2 flex-wrap">
                        <span>은(는)</span>
                        <input 
                          type="tel" 
                          value={userValue}
                          onChange={(e) => setUserValue(e.target.value)}
                          disabled={isCorrect === true}
                          className={`w-20 h-14 text-center text-2xl font-bold border-2 rounded-lg focus:outline-none focus:ring-4 transition-colors ${isCorrect === true ? 'bg-green-50 border-green-400 text-green-600' : isCorrect === false ? 'bg-red-50 border-red-400 text-red-600' : 'border-gray-300 focus:border-blue-400'}`}
                          placeholder="?"
                        />
                        <span className="font-bold text-black">cm</span>
                        <span>입니다.</span>
                     </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Controls (Shared) */}
          <div className="mt-10 flex flex-col items-center gap-4">
            {/* Show check button only for Lesson 2 OR Lesson 1 Step 2 */}
            {isCorrect === null && isPartitioned && (
              <button 
                onClick={handleCheck}
                disabled={loading || (isRepresentation ? (!numerator || !denominator) : !userValue)}
                className="w-full md:w-auto bg-pink-500 hover:bg-pink-600 active:bg-pink-700 text-white text-xl font-bold py-4 px-12 rounded-2xl shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? '확인 중...' : '정답 확인하기'}
              </button>
            )}

            {isCorrect !== null && (
               <div className={`w-full p-4 rounded-2xl flex flex-col items-center gap-3 animate-in fade-in zoom-in duration-300 ${isCorrect ? 'bg-green-100' : 'bg-orange-100'}`}>
                  <div className="flex items-center gap-2 text-xl font-bold">
                    {isCorrect ? <CheckCircle2 className="text-green-600" /> : <XCircle className="text-orange-600" />}
                    <span className={isCorrect ? 'text-green-700' : 'text-orange-800'}>
                      {isCorrect ? '정답입니다!' : '다시 생각해보세요!'}
                    </span>
                  </div>
                  
                  <div className="bg-white/80 p-3 rounded-xl w-full text-gray-700 text-sm md:text-base">
                     💡 <b>선생님 말씀:</b> {tutorMessage}
                  </div>

                  <button 
                    onClick={handleNext}
                    className="mt-2 bg-white hover:bg-gray-50 text-gray-700 font-bold py-2 px-6 rounded-xl border-2 border-gray-200 flex items-center gap-2 shadow-sm"
                  >
                    <RefreshCw size={18} />
                    다음 문제
                  </button>
               </div>
            )}
            
            {isCorrect === null && !loading && (
              <div className="mt-4 text-gray-500 text-sm bg-white/50 px-4 py-2 rounded-full">
                 🤖 {tutorMessage}
              </div>
            )}
          </div>

        </div>
      </div>
      
      <footer className="mt-8 text-pink-300 text-sm font-medium">
        Math Helper with Gemini
      </footer>
    </div>
  );
};

export default App;