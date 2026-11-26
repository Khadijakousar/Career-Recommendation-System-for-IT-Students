export const interestAreas = {
  web: 'Web Development',
  data: 'Data Analysis',
  'machine-learning': 'Machine Learning',
  security: 'Cybersecurity',
  devops: 'DevOps and Cloud',
  mobile: 'Mobile Development',
  qa: 'Software Quality Assurance',
  database: 'Database Administration',
};

function option(text, points) {
  return { text, points };
}

function question(key, text, options) {
  return { key, text, options };
}

export const interestQuestions = [
  question(
    'class-project',
    'Which class project would you most like to build?',
    [
      option('A website for a student club', { web: 5 }),
      option('A campus events app for phones', { mobile: 5 }),
      option('A report based on survey results', { data: 5 }),
      option('A tool that categorizes campus feedback', {
        'machine-learning': 5,
        data: 2,
      }),
    ],
  ),
  question(
    'first-task',
    'Which task would you pick first on a software team?',
    [
      option('Build the layout and interactions for a new page', {
        web: 5,
        mobile: 2,
      }),
      option('Write test cases and reproduce reported bugs', { qa: 5 }),
      option('Set up automated builds and releases', { devops: 5, qa: 1 }),
      option('Design the tables and relationships for the data', {
        database: 5,
      }),
    ],
  ),
  question(
    'troubleshooting',
    'Which problem would you most enjoy investigating?',
    [
      option('A database query that takes too long', { database: 5 }),
      option('A sign-in that looks suspicious', { security: 5 }),
      option('A mobile app that crashes on certain devices', {
        mobile: 5,
        qa: 2,
      }),
      option('A service that fails after deployment', { devops: 5 }),
    ],
  ),
  question('weekend', 'Which topic would you study in your free time?', [
    option('Responsive website layouts', { web: 5 }),
    option('Charts and data storytelling', { data: 5 }),
    option('How to evaluate a prediction model', { 'machine-learning': 5 }),
    option('Security monitoring and safe access', { security: 5 }),
  ]),
  question('release', 'What would you check before a release?', [
    option('Whether tests cover the ways people use the app', {
      qa: 5,
      web: 1,
    }),
    option('Whether the deployment and rollback steps work', { devops: 5 }),
    option('Whether a backup can be restored', { database: 5 }),
    option('Whether sensitive features require the correct permissions', {
      security: 5,
    }),
  ]),
  question(
    'data',
    'What would you do with a large collection of student activity records?',
    [
      option('Summarize common patterns and present them clearly', { data: 5 }),
      option('Test whether a model can predict a useful outcome', {
        'machine-learning': 5,
      }),
      option('Normalize the tables and make searches faster', { database: 5 }),
      option('Review who can access the records', { security: 5 }),
    ],
  ),
  question(
    'prototype',
    'What part of a prototype would you most like to improve?',
    [
      option('Make the site accessible and easier to navigate', { web: 5 }),
      option('Make the phone app easier to use on the move', { mobile: 5 }),
      option('Catch problems before a demo', { qa: 5 }),
      option('Make the test environment easy to recreate', { devops: 5 }),
    ],
  ),
  question('evidence', 'Which result would feel most rewarding?', [
    option('A report that helps someone make a decision', { data: 5 }),
    option('A model that improves on a simple baseline', {
      'machine-learning': 5,
    }),
    option('An app that works smoothly on a phone', { mobile: 5 }),
    option('An automated check that catches a recurring bug', { qa: 5 }),
  ]),
  question(
    'handover',
    'What would you like to demonstrate during a project handover?',
    [
      option('A polished walkthrough of the website', { web: 5 }),
      option('A release going live through an automated pipeline', {
        devops: 5,
      }),
      option('How authorized users are separated from other users', {
        security: 5,
      }),
      option('How to recover the system from a database backup', {
        database: 5,
      }),
    ],
  ),
  question(
    'feedback',
    'How would you respond to feedback that an app is confusing?',
    [
      option('Revise the web screens and navigation', { web: 5 }),
      option('Improve the phone app’s forms and controls', { mobile: 5 }),
      option('Measure where most users stop or make mistakes', { data: 5 }),
      option('Reproduce the issue and add it to the test cases', { qa: 5 }),
    ],
  ),
  question(
    'team-role',
    'Which responsibility would you pick for a semester-long team project?',
    [
      option('Keep shared development environments working', { devops: 5 }),
      option('Prepare data and compare model results', {
        'machine-learning': 5,
      }),
      option('Organize the app’s stored data and write queries', {
        database: 5,
      }),
      option('Review where the design needs security controls', {
        security: 5,
      }),
    ],
  ),
  question(
    'focus',
    'Which activity would you choose for a longer practical assignment?',
    [
      option('Build a mobile app that works with limited connectivity', {
        mobile: 5,
      }),
      option('Compare several ways of displaying the same dataset', {
        data: 5,
      }),
      option('Train a model and explain where its predictions go wrong', {
        'machine-learning': 5,
      }),
      option('Build a suite of repeatable tests for a small service', {
        qa: 5,
      }),
    ],
  ),
];
