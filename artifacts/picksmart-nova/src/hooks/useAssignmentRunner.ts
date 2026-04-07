import { useState, useCallback } from "react";
import type { Assignment } from "@/data/assignments";
import type { AssignmentStop } from "@/data/assignmentStops";

export type RunnerState =
  | 'idle'
  | 'intro'
  | 'pallet_alpha'
  | 'pallet_bravo'
  | 'picking'
  | 'wrong_code'
  | 'confirm_qty'
  | 'outro'
  | 'completed';

export interface UseAssignmentRunnerReturn {
  runnerState: RunnerState;
  currentStopIndex: number;
  pickedStopIds: Set<string>;
  elapsedSeconds: number;
  setElapsedSeconds: React.Dispatch<React.SetStateAction<number>>;
  start: (assignment: Assignment, stops: AssignmentStop[]) => void;
  advance: (assignment: Assignment, stops: AssignmentStop[]) => void;
  submitCode: (code: string, currentStop: AssignmentStop, stops: AssignmentStop[]) => "correct" | "wrong";
  confirmQty: (assignment: Assignment, stops: AssignmentStop[]) => void;
  reset: () => void;
  progressPercent: (stops: AssignmentStop[]) => number;
}

export function useAssignmentRunner(): UseAssignmentRunnerReturn {
  const [runnerState, setRunnerState] = useState<RunnerState>('idle');
  const [currentStopIndex, setCurrentStopIndex] = useState(0);
  const [pickedStopIds, setPickedStopIds] = useState<Set<string>>(new Set());
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const reset = useCallback(() => {
    setRunnerState('idle');
    setCurrentStopIndex(0);
    setPickedStopIds(new Set());
    setElapsedSeconds(0);
  }, []);

  const start = useCallback((_assignment: Assignment, _stops: AssignmentStop[]) => {
    setRunnerState('intro');
  }, []);

  const advance = useCallback((assignment: Assignment, stops: AssignmentStop[]) => {
    if (runnerState === 'intro') {
      setRunnerState('pallet_alpha');
    } else if (runnerState === 'pallet_alpha') {
      if (assignment.totalPallets > 1) {
        setRunnerState('pallet_bravo');
      } else {
        setRunnerState('picking');
      }
    } else if (runnerState === 'pallet_bravo') {
      setRunnerState('picking');
    } else if (runnerState === 'outro') {
      setRunnerState('completed');
    }
  }, [runnerState]);

  const submitCode = useCallback((code: string, currentStop: AssignmentStop, _stops: AssignmentStop[]): "correct" | "wrong" => {
    if (code.trim().toUpperCase() === currentStop.checkCode.toUpperCase()) {
      return "correct";
    }
    return "wrong";
  }, []);

  const confirmQty = useCallback((_assignment: Assignment, stops: AssignmentStop[]) => {
    const currentStop = stops[currentStopIndex];
    if (currentStop) {
      setPickedStopIds(prev => new Set([...prev, currentStop.id]));
    }
    if (currentStopIndex < stops.length - 1) {
      setCurrentStopIndex(prev => prev + 1);
      setRunnerState('picking');
    } else {
      setRunnerState('outro');
    }
  }, [currentStopIndex]);

  const progressPercent = useCallback((stops: AssignmentStop[]) => {
    if (stops.length === 0) return 0;
    return Math.round((pickedStopIds.size / stops.length) * 100);
  }, [pickedStopIds]);

  return {
    runnerState,
    currentStopIndex,
    pickedStopIds,
    elapsedSeconds,
    setElapsedSeconds,
    start,
    advance,
    submitCode,
    confirmQty,
    reset,
    progressPercent,
  };
}
