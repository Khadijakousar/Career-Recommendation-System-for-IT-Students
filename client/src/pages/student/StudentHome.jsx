import { Link } from 'react-router-dom';
import StudentPage from './StudentPage.jsx';

const tasks = [
  [
    '/profile',
    'Academic profile',
    'Enter your program, semester, and completed courses.',
  ],
  [
    '/assessment/skills',
    'Skills assessment',
    'Rate your current level in each skill.',
  ],
  [
    '/assessment/interests',
    'Interest assessment',
    'Choose the answers that best reflect what you enjoy.',
  ],
  [
    '/recommendations',
    'Career recommendations',
    'See which careers match your assessments.',
  ],
];

export default function StudentHome() {
  return (
    <StudentPage
      title="Student dashboard"
      description="Manage your profile, update your assessments, and view career recommendations."
    >
      <ul className="divide-y divide-line border-y border-line">
        {tasks.map(([path, title, description]) => (
          <li key={path}>
            <Link
              to={path}
              className="block px-2 py-4 transition-colors hover:bg-accent/5 focus-visible:outline-accent motion-reduce:transition-none sm:px-4"
            >
              <span className="font-semibold text-accent">{title}</span>
              <span className="mt-1 block text-sm text-muted">
                {description}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </StudentPage>
  );
}
