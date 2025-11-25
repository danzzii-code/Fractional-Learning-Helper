
export type LessonType = 'representation' | 'value_finding';

export interface MathProblem {
  lessonType: LessonType;
  subType: 'discrete' | 'length'; // 'discrete' for items, 'length' for number line
  totalItems: number;      // Total count or Total Length (cm)
  groupSize: number;       // Items per group or Length per segment
  totalGroups: number;     // Denominator
  targetGroups: number;    // Numerator
  targetItems: number;     // The Answer (Count or Length)
  itemType: 'orange' | 'apple' | 'strawberry' | 'star' | 'ruler';
}

export interface ExplanationRequest {
  problem: MathProblem;
  userNumerator?: string;
  userDenominator?: string;
  userValue?: string; // For Lesson 2 answer
  isCorrect: boolean;
}
