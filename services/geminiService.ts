
import { GoogleGenAI } from "@google/genai";
import { ExplanationRequest, MathProblem } from "../types";

// Use process.env.API_KEY as defined in vite.config.ts definition
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const POSITIVE_FEEDBACKS = [
  "우와! 정말 대단해요! 완벽하게 이해했네요! 🎉",
  "정답입니다! 수학 천재가 분명해요! 🌟",
  "참 잘했어요! 다음 문제도 식은 죽 먹기겠죠? 💪",
  "훌륭합니다! 냠냠 분수도 기뻐하고 있어요! 🍊",
  "짝짝짝! 정확하게 맞췄어요! 최고예요! 👍",
  "와우! 실력이 점점 늘고 있어요! 멋져요! ✨"
];

const RETRY_FEEDBACKS = [
  "아깝네요! 천천히 다시 한번 생각해볼까요? 🧐",
  "괜찮아요! 그림을 자세히 보면 알 수 있어요! 힘내요! 💪",
  "거의 다 왔어요! 묶음을 다시 한번 세어볼까요? 🔍",
  "실수는 성공의 어머니! 다시 도전해봐요! ✨",
  "조금만 더 생각해보면 정답을 찾을 수 있을 거예요! 🍀"
];

export const getRandomFeedback = (isCorrect: boolean) => {
  const list = isCorrect ? POSITIVE_FEEDBACKS : RETRY_FEEDBACKS;
  return list[Math.floor(Math.random() * list.length)];
};

export const getMathExplanation = async (request: ExplanationRequest): Promise<string> => {
  try {
    const { problem, isCorrect, userNumerator, userDenominator, userValue } = request;

    let prompt = "";
    
    // --- LESSON 1: REPRESENTATION (분수로 나타내기) ---
    if (problem.lessonType === 'representation') {
      if (isCorrect) {
        prompt = `
          You are a cheerful elementary math teacher in Korea.
          Context: The student correctly identified that ${problem.targetItems} items out of ${problem.totalItems} (grouped by ${problem.groupSize}) represents ${problem.targetGroups}/${problem.totalGroups}.
          
          Give a short, very enthusiastic compliment in Korean (Hangul). Use emojis.
          Make it different every time.
          Example: "우와! 전체를 ${problem.totalGroups}묶음으로 나눈 것 중 ${problem.targetGroups}묶음이니까 정답이야! 최고! 🌟"
          IMPORTANT: Reply ONLY in Korean.
        `;
      } else {
        prompt = `
          You are a kind elementary math teacher in Korea.
          Context: The student answered ${userNumerator}/${userDenominator} but the answer is ${problem.targetGroups}/${problem.totalGroups}.
          Visuals: ${problem.totalItems} items grouped into ${problem.totalGroups} groups. We selected ${problem.targetGroups} groups.

          Explain simply: "Total groups is the denominator. Selected groups is the numerator."
          Keep it short and encouraging.
          IMPORTANT: Reply ONLY in Korean.
        `;
      }
    } 
    // --- LESSON 2: VALUE FINDING (분수만큼은 얼마인지 알아보기) ---
    else {
      if (isCorrect) {
        prompt = `
          You are a cheerful elementary math teacher.
          Context: The student correctly calculated that ${problem.targetGroups}/${problem.totalGroups} of ${problem.totalItems} is ${problem.targetItems}.
          
          Compliment them on understanding "Part of a Whole".
          Make it different every time.
          Example: "맞았어! 전체를 ${problem.totalGroups}로 똑같이 나눈 것 중 ${problem.targetGroups}만큼이니까 ${problem.targetItems}개(cm)야! 정말 잘했어! 🎉"
          IMPORTANT: Reply ONLY in Korean.
        `;
      } else {
        prompt = `
          You are a kind math teacher.
          Context: The problem asked for ${problem.targetGroups}/${problem.totalGroups} of ${problem.totalItems}.
          The correct answer is ${problem.targetItems}, but student guessed ${userValue}.
          
          Logic to explain: 
          1. First find 1/${problem.totalGroups}. ${problem.totalItems} divided by ${problem.totalGroups} is ${problem.groupSize}.
          2. Then multiply by ${problem.targetGroups}. ${problem.groupSize} times ${problem.targetGroups} is ${problem.targetItems}.
          
          Explain this step-by-step very simply in Korean.
          IMPORTANT: Reply ONLY in Korean.
        `;
      }
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        temperature: 0.9,
      }
    });

    return response.text || getRandomFeedback(isCorrect);
  } catch (error) {
    console.error("Gemini API Error:", error);
    return getRandomFeedback(request.isCorrect);
  }
};

export const getInitialGreeting = async (): Promise<string> => {
  return "안녕! 냠냠 분수랑 같이 신나는 모험 떠나볼까?";
}