import { INTEREST_WEIGHT, SKILL_WEIGHT } from '../../config/scoring.js';

function skillLevels(ratings) {
  return new Map(ratings.map(({ skillId, level }) => [skillId, level]));
}

export function calculateSkillScore(requirements, levels) {
  let weightedCoverage = 0;
  let totalWeight = 0;

  for (const { skillId, requiredLevel, weight } of requirements) {
    const level = levels.get(skillId) ?? 0;
    weightedCoverage += weight * Math.min(level / requiredLevel, 1);
    totalWeight += weight;
  }

  return totalWeight ? (weightedCoverage / totalWeight) * 100 : 0;
}

function addPoints(totals, interestAreaId, points) {
  totals.set(interestAreaId, (totals.get(interestAreaId) ?? 0) + points);
}

function compareScores(left, right) {
  // Keep floating-point noise from deciding an otherwise tied rank.
  const precision = 1e10;
  return Math.round(right * precision) - Math.round(left * precision);
}

export function calculateInterestScores(questions, answers) {
  const selectedOptions = new Map(
    answers.map(({ questionId, optionId }) => [questionId, optionId]),
  );
  const totals = new Map();
  const maximums = new Map();
  let complete = questions.length > 0;

  for (const question of questions) {
    const selected = question.options.find(
      ({ id }) => id === selectedOptions.get(question.id),
    );
    if (selected) {
      for (const { interestAreaId, points } of selected.weights) {
        addPoints(totals, interestAreaId, points);
      }
    } else {
      complete = false;
    }

    const questionMaximums = new Map();
    for (const option of question.options) {
      for (const { interestAreaId, points } of option.weights) {
        questionMaximums.set(
          interestAreaId,
          Math.max(points, questionMaximums.get(interestAreaId) ?? 0),
        );
      }
    }
    for (const [interestAreaId, points] of questionMaximums) {
      addPoints(maximums, interestAreaId, points);
    }
  }

  const scores = new Map(
    Array.from(maximums, ([interestAreaId, maximum]) => [
      interestAreaId,
      maximum ? ((totals.get(interestAreaId) ?? 0) / maximum) * 100 : 0,
    ]),
  );
  return { complete, scores };
}

export function rankCareerMatches({ careers, ratings, questions, answers }) {
  const levels = skillLevels(ratings);
  const interest = calculateInterestScores(questions, answers);

  const matches = careers.map(
    ({ id, title, requiredSkills, interestAreaId }) => {
      const skillScore = calculateSkillScore(requiredSkills, levels);
      const interestScore = interest.complete
        ? (interest.scores.get(interestAreaId) ?? 0)
        : 0;
      const totalScore = interest.complete
        ? SKILL_WEIGHT * skillScore + INTEREST_WEIGHT * interestScore
        : skillScore;
      return {
        careerId: id,
        careerTitle: title,
        skillScore,
        interestScore,
        totalScore,
      };
    },
  );

  matches.sort(
    (left, right) =>
      compareScores(left.totalScore, right.totalScore) ||
      compareScores(left.skillScore, right.skillScore) ||
      left.careerTitle.localeCompare(right.careerTitle, 'en') ||
      left.careerId.localeCompare(right.careerId, 'en'),
  );

  return {
    mode: interest.complete ? 'SKILLS_AND_INTERESTS' : 'SKILLS_ONLY',
    results: matches.map((match, index) => ({ ...match, rank: index + 1 })),
  };
}

export function analyzeSkillGap(requirements, ratings) {
  const levels = skillLevels(ratings);
  const gaps = [];
  const met = [];
  for (const requirement of requirements) {
    const studentLevel = levels.get(requirement.skillId) ?? 0;
    const gap = requirement.requiredLevel - studentLevel;
    const entry = { ...requirement, studentLevel };
    if (gap > 0)
      gaps.push({ ...entry, gap, priority: requirement.weight * gap });
    else met.push(entry);
  }

  gaps.sort((left, right) => right.priority - left.priority);
  return {
    gaps,
    met,
    readinessPercent: Math.round(calculateSkillScore(requirements, levels)),
  };
}

export function orderRoadmapSteps(gaps) {
  return [...gaps].sort(
    (left, right) =>
      left.skill.stage - right.skill.stage || right.priority - left.priority,
  );
}
