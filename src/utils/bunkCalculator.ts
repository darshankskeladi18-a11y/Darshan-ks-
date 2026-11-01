import { BunkCalculationResult, AlertLevel, WhatIfResult, DayOfWeek } from '../types/attendance';

/**
 * Calculates attendance metrics, safe bunk cushions, and recovery requirements.
 *
 * Safe Bunks Formula (when % >= Target):
 * floor((Attended * 100) / Target - Total)
 *
 * Catch-Up Formula (when % < Target):
 * ceil((Target * Total - 100 * Attended) / (100 - Target))
 */
export function calculateBunkMetrics(
  attended: number,
  total: number,
  targetPercentage: number = 75
): BunkCalculationResult {
  const safeAttended = Math.max(0, Math.floor(attended || 0));
  const safeTotal = Math.max(safeAttended, Math.floor(total || 0));
  const absent = safeTotal - safeAttended;

  // Percentage calculation
  const percentage = safeTotal === 0 ? 100 : Number(((safeAttended / safeTotal) * 100).toFixed(1));
  const target = Math.min(100, Math.max(1, targetPercentage));

  let safeBunks = 0;
  let classesNeeded = 0;
  let alertLevel: AlertLevel = 'SAFE';
  let statusLabel = 'On Track';
  let advice = '';
  let recoveryProjectedPercentage: number | undefined;

  if (safeTotal === 0) {
    return {
      total: 0,
      attended: 0,
      absent: 0,
      percentage: 100,
      target,
      safeBunks: 0,
      classesNeeded: 0,
      alertLevel: 'SAFE',
      statusLabel: 'No Classes Yet',
      advice: 'Classes have not started yet. Maintain regular attendance from day one to build a strong cushion!',
      isEligible: true,
    };
  }

  if (percentage >= target) {
    // Student meets or exceeds requirement
    if (target === 100) {
      safeBunks = 0;
    } else {
      const maxAllowedTotal = (safeAttended * 100) / target;
      // Never negative
      safeBunks = Math.max(0, Math.floor(maxAllowedTotal - safeTotal));
    }

    if (percentage >= target + 5) {
      alertLevel = 'SAFE';
      statusLabel = 'Safe Buffer';
      advice = safeBunks > 0
        ? `You can safely miss ${safeBunks} more ${safeBunks === 1 ? 'class' : 'classes'} and still remain at or above ${target}%.`
        : `You are above ${target}%, but missing even 1 class will drop you close to the edge.`;
    } else {
      alertLevel = 'WARNING';
      statusLabel = 'Borderline Warning';
      advice = safeBunks > 0
        ? `Caution: Near threshold! You have at most ${safeBunks} safe ${safeBunks === 1 ? 'bunk' : 'bunks'} remaining.`
        : `Caution: Exactly on boundary. Missing a single class will cause an attendance shortage.`;
    }
  } else {
    // Shortage detected! Student needs to catch up
    alertLevel = 'CRITICAL';
    statusLabel = 'Critical Shortage';

    if (target >= 100) {
      classesNeeded = 999;
      advice = 'Mathematical 100% is no longer reachable with existing absences. Apply for medical or academic condonation.';
    } else {
      const numerator = target * safeTotal - 100 * safeAttended;
      const denominator = 100 - target;
      classesNeeded = Math.max(1, Math.ceil(numerator / denominator));

      // Calculate projected percentage after attending those consecutive classes
      const projectedNewTotal = safeTotal + classesNeeded;
      const projectedNewAttended = safeAttended + classesNeeded;
      recoveryProjectedPercentage = Number(((projectedNewAttended / projectedNewTotal) * 100).toFixed(1));

      advice = `Shortage alert: You must attend the next ${classesNeeded} consecutive ${
        classesNeeded === 1 ? 'class' : 'classes'
      } without any absences to recover back to ${recoveryProjectedPercentage}% (≥ ${target}%).`;
    }
  }

  return {
    total: safeTotal,
    attended: safeAttended,
    absent,
    percentage,
    target,
    safeBunks: Math.max(0, safeBunks), // Guarantee never negative
    classesNeeded,
    alertLevel,
    statusLabel,
    advice,
    isEligible: percentage >= target,
    recoveryProjectedPercentage,
  };
}

/**
 * Calculates aggregate stats across multiple subjects
 */
export function calculateOverallMetrics(
  subjects: { attendedClasses: number; totalClasses: number; targetPercentage?: number }[],
  globalTarget: number = 75
): BunkCalculationResult & { subjectCount: number; shortageCount: number; warningCount: number; safeCount: number } {
  let totalAttended = 0;
  let totalClasses = 0;
  let shortageCount = 0;
  let warningCount = 0;
  let safeCount = 0;

  for (const sub of subjects) {
    totalAttended += Math.max(0, sub.attendedClasses || 0);
    totalClasses += Math.max(0, sub.totalClasses || 0);
    const subTarget = sub.targetPercentage || globalTarget;
    const subMetric = calculateBunkMetrics(sub.attendedClasses, sub.totalClasses, subTarget);
    if (subMetric.alertLevel === 'CRITICAL') shortageCount++;
    else if (subMetric.alertLevel === 'WARNING') warningCount++;
    else safeCount++;
  }

  const overall = calculateBunkMetrics(totalAttended, totalClasses, globalTarget);

  return {
    ...overall,
    subjectCount: subjects.length,
    shortageCount,
    warningCount,
    safeCount,
  };
}

/**
 * Simulates future attendance scenarios ("What-If")
 */
export function simulateWhatIf(
  currentAttended: number,
  currentTotal: number,
  attendUpcoming: number,
  missUpcoming: number,
  targetPercentage: number = 75
): WhatIfResult {
  const safeCurrAttended = Math.max(0, currentAttended);
  const safeCurrTotal = Math.max(safeCurrAttended, currentTotal);

  const safeAttendUp = Math.max(0, Math.floor(attendUpcoming || 0));
  const safeMissUp = Math.max(0, Math.floor(missUpcoming || 0));

  const projectedAttended = safeCurrAttended + safeAttendUp;
  const projectedTotal = safeCurrTotal + safeAttendUp + safeMissUp;
  const projectedAbsent = projectedTotal - projectedAttended;

  const currentMetrics = calculateBunkMetrics(safeCurrAttended, safeCurrTotal, targetPercentage);
  const projectedMetrics = calculateBunkMetrics(projectedAttended, projectedTotal, targetPercentage);

  const delta = Number((projectedMetrics.percentage - currentMetrics.percentage).toFixed(1));

  let advice = '';
  if (projectedMetrics.percentage >= targetPercentage) {
    if (delta >= 0) {
      advice = `Attendance increases by +${delta}% to ${projectedMetrics.percentage}%, giving you ${projectedMetrics.safeBunks} safe bunks.`;
    } else {
      advice = `Even with ${safeMissUp} missed classes, your attendance stays above threshold at ${projectedMetrics.percentage}% (≥ ${targetPercentage}%).`;
    }
  } else {
    advice = `Warning: This scenario drops attendance to ${projectedMetrics.percentage}%, which is ${
      (targetPercentage - projectedMetrics.percentage).toFixed(1)
    }% below requirement! You will need ${projectedMetrics.classesNeeded} consecutive classes to recover.`;
  }

  return {
    currentPercentage: currentMetrics.percentage,
    projectedPercentage: projectedMetrics.percentage,
    delta,
    currentAttended: safeCurrAttended,
    currentTotal: safeCurrTotal,
    projectedAttended,
    projectedTotal,
    projectedAbsent,
    projectedAlertLevel: projectedMetrics.alertLevel,
    projectedSafeBunks: Math.max(0, projectedMetrics.safeBunks),
    projectedClassesNeeded: projectedMetrics.classesNeeded,
    advice,
  };
}

/**
 * Maps Javascript Date getDay() (0 = Sunday, 1 = Monday...) to DayOfWeek enum
 */
export function getDayOfWeekFromDate(dateStr?: string): DayOfWeek {
  const date = dateStr ? new Date(`${dateStr}T12:00:00`) : new Date();
  const dayIndex = date.getDay(); // 0 is Sunday, 1 is Monday ... 6 is Saturday
  const map: Record<number, DayOfWeek> = {
    1: 'MONDAY',
    2: 'TUESDAY',
    3: 'WEDNESDAY',
    4: 'THURSDAY',
    5: 'FRIDAY',
    6: 'SATURDAY',
    0: 'MONDAY', // Sunday defaults to next Monday for timetable previews
  };
  return map[dayIndex] || 'MONDAY';
}

export const DAYS_OF_WEEK: { key: DayOfWeek; label: string; short: string }[] = [
  { key: 'MONDAY', label: 'Monday', short: 'Mon' },
  { key: 'TUESDAY', label: 'Tuesday', short: 'Tue' },
  { key: 'WEDNESDAY', label: 'Wednesday', short: 'Wed' },
  { key: 'THURSDAY', label: 'Thursday', short: 'Thu' },
  { key: 'FRIDAY', label: 'Friday', short: 'Fri' },
  { key: 'SATURDAY', label: 'Saturday', short: 'Sat' },
];
