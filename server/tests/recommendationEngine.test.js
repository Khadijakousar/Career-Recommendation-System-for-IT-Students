import { expect, test } from 'vitest';
import {
  analyzeSkillGap,
  calculateInterestScores,
  calculateSkillScore,
  orderRoadmapSteps,
  rankCareerMatches,
} from '../src/modules/recommendations/engine.js';

const requirement = (skillId, requiredLevel, weight, stage = 1) => ({
  skillId,
  requiredLevel,
  weight,
  skill: { stage },
});
const weight = (interestAreaId, points) => ({ interestAreaId, points });
const choice = (id, ...weights) => ({ id, weights });
const level = (skillId, value) => ({ skillId, level: value });
const answer = (questionId, optionId) => ({ questionId, optionId });
const career = (id, title, interestAreaId, ...requiredSkills) => ({
  id,
  title,
  interestAreaId,
  requiredSkills,
});

test('skills that meet or exceed every requirement give a 100% match', () => {
  const required = [requirement('js', 4, 5), requirement('sql', 3, 2)];
  expect(
    calculateSkillScore(
      required,
      new Map([
        ['js', 4],
        ['sql', 5],
      ]),
    ),
  ).toBe(100);
  expect(calculateSkillScore(required, new Map())).toBe(0);
  expect(calculateSkillScore([], new Map([['js', 4]]))).toBe(0);
});

test('partially covered skill requirements are weighted by importance', () => {
  const required = [
    requirement('js', 4, 4),
    requirement('sql', 5, 2),
    requirement('git', 1, 1),
  ];
  expect(
    calculateSkillScore(
      required,
      new Map([
        ['js', 2],
        ['sql', 5],
      ]),
    ),
  ).toBeCloseTo(400 / 7);
});

test('interest scores divide selected points by the sum of each question maximum', () => {
  const questions = [
    {
      id: 'q1',
      options: [
        choice('a', weight('web', 2), weight('data', 4)),
        choice('b', weight('web', 5), weight('data', 1)),
      ],
    },
    {
      id: 'q2',
      options: [
        choice('c', weight('web', 3), weight('data', 1)),
        choice('d', weight('data', 5)),
      ],
    },
  ];
  const interest = calculateInterestScores(questions, [
    answer('q1', 'a'),
    answer('q2', 'c'),
  ]);

  expect(interest.complete).toBe(true);
  expect(interest.scores.get('web')).toBe(62.5);
  expect(interest.scores.get('data')).toBeCloseTo(500 / 9);
  const outcomes = rankCareerMatches({
    careers: [
      career('web', 'Web Developer', 'web', requirement('js', 4, 2)),
      career('other', 'Other Career', 'other'),
    ],
    ratings: [level('js', 2)],
    questions,
    answers: [answer('q1', 'a'), answer('q2', 'c')],
  });

  expect(outcomes.mode).toBe('SKILLS_AND_INTERESTS');
  expect(outcomes.results[0]).toMatchObject({
    skillScore: 50,
    interestScore: 62.5,
    totalScore: 55,
  });
  expect(outcomes.results[1]).toMatchObject({
    skillScore: 0,
    interestScore: 0,
    totalScore: 0,
  });
});

test.each(['empty', 'unanswered', 'partial', 'invalid'])(
  'an %s questionnaire uses the skill score alone',
  (state) => {
    const questions =
      state === 'empty'
        ? []
        : [
            { id: 'q1', options: [choice('a', weight('web', 5))] },
            { id: 'q2', options: [choice('b', weight('web', 5))] },
          ];
    const answers = {
      empty: [],
      unanswered: [],
      partial: [answer('q1', 'a')],
      invalid: [answer('q1', 'a'), answer('q2', 'a')],
    }[state];
    const outcome = rankCareerMatches({
      careers: [career('web', 'Web Developer', 'web', requirement('js', 4, 1))],
      ratings: [level('js', 3)],
      questions,
      answers,
    });
    expect(outcome.mode).toBe('SKILLS_ONLY');
    expect(outcome.results[0]).toMatchObject({
      skillScore: 75,
      totalScore: 75,
      interestScore: 0,
      rank: 1,
    });
  },
);

test('ties are broken by skill match and then alphabetically by title', () => {
  const questions = [
    {
      id: 'q',
      options: [
        choice('selected', weight('area-b', 3)),
        choice('other', weight('area-b', 4), weight('area-a', 5)),
      ],
    },
  ];
  const careers = [
    career('zebra', 'Zebra', 'area-b', requirement('skill', 4, 1)),
    career('apple', 'Apple', 'area-b', requirement('skill', 4, 1)),
    career('mango', 'Mango', 'area-a', requirement('skill', 2, 1)),
  ];
  const inputs = {
    careers,
    ratings: [level('skill', 2)],
    questions,
    answers: [answer('q', 'selected')],
  };
  const { results } = rankCareerMatches(inputs);
  expect(
    results.map(({ careerId, totalScore, rank }) => [
      careerId,
      totalScore,
      rank,
    ]),
  ).toEqual([
    ['mango', 60, 1],
    ['apple', 60, 2],
    ['zebra', 60, 3],
  ]);
  expect(
    rankCareerMatches({ ...inputs, careers: [...careers].reverse() }).results,
  ).toEqual(results);
});

test('floating-point noise in tied skill coverage does not change the ranking', () => {
  const { results } = rankCareerMatches({
    careers: [
      career(
        'zebra',
        'Zebra',
        'web',
        requirement('first', 5, 1),
        requirement('second', 5, 1),
        requirement('missing', 1, 1),
      ),
      career(
        'apple',
        'Apple',
        'web',
        requirement('third', 5, 1),
        requirement('missing', 1, 2),
      ),
    ],
    ratings: [level('first', 1), level('second', 2), level('third', 3)],
    questions: [],
    answers: [],
  });
  expect(results.map(({ careerId }) => careerId)).toEqual(['apple', 'zebra']);
  expect(results[0].totalScore).toBeCloseTo(20);
  expect(results[1].totalScore).toBeCloseTo(20);
});

test('an empty catalog produces an empty ranking', () => {
  expect(
    rankCareerMatches({ careers: [], ratings: [], questions: [], answers: [] }),
  ).toEqual({ mode: 'SKILLS_ONLY', results: [] });
});

test('skill gaps use importance times missing levels and order roadmap steps by stage', () => {
  const requirements = [
    requirement('basics', 3, 2, 1),
    requirement('advanced', 5, 4, 3),
    requirement('another-foundation', 3, 3, 1),
    requirement('met', 2, 1, 2),
  ];
  const ratings = [level('met', 4), level('basics', 1)];
  const analysis = analyzeSkillGap(requirements, ratings);

  expect(
    analysis.gaps.map(({ skillId, gap, priority }) => [skillId, gap, priority]),
  ).toEqual([
    ['advanced', 5, 20],
    ['another-foundation', 3, 9],
    ['basics', 2, 4],
  ]);
  expect(analysis.met).toEqual([{ ...requirements[3], studentLevel: 4 }]);
  expect(analysis.readinessPercent).toBe(17);
  expect(
    orderRoadmapSteps(analysis.gaps).map(({ skillId }) => skillId),
  ).toEqual(['another-foundation', 'basics', 'advanced']);
  expect(analysis.gaps[0].skillId).toBe('advanced');
  expect(
    orderRoadmapSteps(analyzeSkillGap([requirements[3]], ratings).gaps),
  ).toEqual([]);
});
