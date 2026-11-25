const levels = [
  { value: 1, label: '1 · Foundation' },
  { value: 2, label: '2 · Intermediate' },
  { value: 3, label: '3 · Advanced' },
];
const resourceTypes = [
  { value: 'COURSE', label: 'Course' },
  { value: 'VIDEO', label: 'Video' },
  { value: 'ARTICLE', label: 'Article' },
  { value: 'BOOK', label: 'Book' },
  { value: 'DOCS', label: 'Documentation' },
];

export const catalogSections = {
  careers: {
    title: 'Careers',
    singular: 'career',
    columns: ['Career', 'Interest area', 'Required skills'],
    describe: (item) => [
      item.title,
      item.interestArea.name,
      item.requiredSkills.length || 'None',
    ],
    fields: [
      { name: 'title', label: 'Career title', initial: '' },
      {
        name: 'slug',
        label: 'URL slug',
        initial: '',
        hint: 'Use lowercase letters and hyphens.',
      },
      {
        name: 'interestAreaId',
        label: 'Interest area',
        source: 'interest-areas',
        initial: '',
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        initial: '',
      },
    ],
  },
  skills: {
    title: 'Skills',
    singular: 'skill',
    columns: ['Skill', 'Category', 'Stage'],
    describe: (item) => [
      item.name,
      item.category,
      levels.find(({ value }) => value === item.stage)?.label,
    ],
    fields: [
      { name: 'name', label: 'Skill name', initial: '' },
      { name: 'category', label: 'Category', initial: '' },
      {
        name: 'stage',
        label: 'Learning stage',
        initial: 1,
        type: 'number',
        options: levels,
      },
      {
        name: 'description',
        label: 'Description',
        type: 'textarea',
        initial: '',
        optional: true,
      },
    ],
  },
  'interest-areas': {
    title: 'Interest areas',
    singular: 'interest area',
    columns: ['Interest area'],
    describe: (item) => [item.name],
    fields: [{ name: 'name', label: 'Interest area name', initial: '' }],
  },
  'interest-questions': {
    title: 'Questions',
    singular: 'question',
    columns: ['Question', 'Order', 'Options'],
    describe: (item) => [item.text, item.order, item.options.length],
    fields: [
      { name: 'text', label: 'Question', type: 'textarea', initial: '' },
      {
        name: 'order',
        label: 'Display order',
        type: 'number',
        initial: 1,
        min: 1,
      },
    ],
  },
  resources: {
    title: 'Resources',
    singular: 'resource',
    columns: ['Resource', 'Skill', 'Type', 'Access'],
    describe: (item) => [
      item.title,
      item.skill.name,
      resourceTypes.find(({ value }) => value === item.type)?.label,
      item.isFree ? 'Free' : 'Paid',
    ],
    fields: [
      { name: 'title', label: 'Resource title', initial: '' },
      { name: 'skillId', label: 'Skill', source: 'skills', initial: '' },
      { name: 'url', label: 'Resource URL', type: 'url', initial: '' },
      {
        name: 'type',
        label: 'Resource type',
        options: resourceTypes,
        initial: 'DOCS',
      },
      { name: 'provider', label: 'Provider', initial: '', optional: true },
      {
        name: 'isFree',
        label: 'Free resource',
        type: 'checkbox',
        initial: true,
      },
    ],
  },
};
