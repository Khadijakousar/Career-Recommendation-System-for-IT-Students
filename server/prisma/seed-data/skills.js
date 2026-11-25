function resource(title, url, provider, type = 'DOCS') {
  return { title, url, provider, type };
}

function skill(key, name, category, stage, resources) {
  return { key, name, category, stage, resources };
}

export const skills = [
  skill('programming', 'Programming Fundamentals', 'Programming', 1, [
    resource(
      'CS50x Introduction to Computer Science',
      'https://cs50.harvard.edu/x/',
      'Harvard',
      'COURSE',
    ),
    resource(
      'The Python Tutorial',
      'https://docs.python.org/3/tutorial/',
      'Python',
    ),
  ]),
  skill('git', 'Git', 'Programming', 1, [
    resource('Pro Git', 'https://git-scm.com/book/en/v2', 'Git', 'BOOK'),
    resource(
      'GitHub Hello World',
      'https://docs.github.com/en/get-started/start-your-journey/hello-world',
      'GitHub',
      'ARTICLE',
    ),
  ]),
  skill('data-structures', 'Data Structures', 'Programming', 2, [
    resource(
      'Open Data Structures',
      'https://opendatastructures.org/',
      'Pat Morin',
      'BOOK',
    ),
    resource(
      'CS50x Data Structures',
      'https://cs50.harvard.edu/x/weeks/5/',
      'Harvard',
      'VIDEO',
    ),
  ]),
  skill('algorithms', 'Algorithms', 'Programming', 2, [
    resource(
      'Introduction to Algorithms',
      'https://ocw.mit.edu/courses/6-006-introduction-to-algorithms-fall-2011/',
      'MIT OpenCourseWare',
      'COURSE',
    ),
    resource(
      'CS50x Algorithms',
      'https://cs50.harvard.edu/x/weeks/3/',
      'Harvard',
      'VIDEO',
    ),
  ]),
  skill('python', 'Python', 'Programming', 1, [
    resource(
      'Python Getting Started',
      'https://www.python.org/about/gettingstarted/',
      'Python',
      'ARTICLE',
    ),
    resource(
      'The Python Tutorial',
      'https://docs.python.org/3/tutorial/',
      'Python',
    ),
  ]),
  skill('java', 'Java', 'Programming', 1, [
    resource('Learn Java', 'https://dev.java/learn/', 'Dev.java'),
    resource(
      'The Java Tutorials',
      'https://docs.oracle.com/javase/tutorial/',
      'Oracle',
    ),
  ]),
  skill('shell', 'Shell Scripting', 'Programming', 2, [
    resource('ShellCheck', 'https://www.shellcheck.net/', 'ShellCheck'),
    resource(
      'Learning the Shell',
      'https://linuxcommand.org/lc3_learning_the_shell.php',
      'LinuxCommand.org',
      'ARTICLE',
    ),
  ]),
  skill('html', 'HTML', 'Web Development', 1, [
    resource(
      'HTML Reference',
      'https://developer.mozilla.org/en-US/docs/Web/HTML',
      'MDN',
    ),
    resource('Learn HTML', 'https://web.dev/learn/html', 'web.dev', 'COURSE'),
  ]),
  skill('css', 'CSS', 'Web Development', 1, [
    resource(
      'CSS Reference',
      'https://developer.mozilla.org/en-US/docs/Web/CSS',
      'MDN',
    ),
    resource('Learn CSS', 'https://web.dev/learn/css', 'web.dev', 'COURSE'),
  ]),
  skill('javascript', 'JavaScript', 'Web Development', 2, [
    resource(
      'JavaScript Guide',
      'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
      'MDN',
    ),
    resource(
      'The Modern JavaScript Tutorial',
      'https://javascript.info/',
      'JavaScript.info',
      'COURSE',
    ),
  ]),
  skill('react', 'React', 'Web Development', 3, [
    resource('React Quick Start', 'https://react.dev/learn', 'React'),
    resource(
      'React API Reference',
      'https://react.dev/reference/react',
      'React',
    ),
  ]),
  skill('apis', 'HTTP and REST APIs', 'Web Development', 2, [
    resource(
      'HTTP Reference',
      'https://developer.mozilla.org/en-US/docs/Web/HTTP',
      'MDN',
    ),
    resource(
      'Express Routing',
      'https://expressjs.com/en/guide/routing.html',
      'Express',
    ),
  ]),
  skill('node', 'Node.js', 'Web Development', 3, [
    resource(
      'Introduction to Node.js',
      'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs',
      'Node.js',
    ),
    resource(
      'Installing Express',
      'https://expressjs.com/en/starter/installing.html',
      'Express',
    ),
  ]),
  skill('sql', 'SQL', 'Data and Databases', 1, [
    resource(
      'PostgreSQL SQL Tutorial',
      'https://www.postgresql.org/docs/current/tutorial-sql.html',
      'PostgreSQL',
    ),
    resource(
      'SQLite SQL Language',
      'https://www.sqlite.org/lang.html',
      'SQLite',
    ),
  ]),
  skill('data-modeling', 'Relational Data Modeling', 'Data and Databases', 2, [
    resource(
      'Foreign Keys Tutorial',
      'https://www.postgresql.org/docs/current/tutorial-fk.html',
      'PostgreSQL',
    ),
    resource(
      'PostgreSQL Constraints',
      'https://www.postgresql.org/docs/current/ddl-constraints.html',
      'PostgreSQL',
    ),
  ]),
  skill('postgresql', 'PostgreSQL', 'Data and Databases', 3, [
    resource(
      'PostgreSQL Documentation',
      'https://www.postgresql.org/docs/current/',
      'PostgreSQL',
    ),
    resource(
      'PostgreSQL Transactions',
      'https://www.postgresql.org/docs/current/tutorial-transactions.html',
      'PostgreSQL',
    ),
  ]),
  skill('spreadsheets', 'Spreadsheets', 'Data and Databases', 1, [
    resource(
      'How to Use Google Sheets',
      'https://support.google.com/docs/answer/6000292',
      'Google',
    ),
    resource(
      'LibreOffice Calc Help',
      'https://help.libreoffice.org/latest/en-US/text/scalc/main0000.html',
      'LibreOffice',
    ),
  ]),
  skill('statistics', 'Statistics', 'Data and Databases', 2, [
    resource(
      'Introductory Statistics 2e',
      'https://openstax.org/details/books/introductory-statistics-2e',
      'OpenStax',
      'BOOK',
    ),
    resource(
      'Engineering Statistics Handbook',
      'https://www.itl.nist.gov/div898/handbook/',
      'NIST',
      'BOOK',
    ),
  ]),
  skill('visualization', 'Data Visualization', 'Data and Databases', 2, [
    resource(
      'Matplotlib Tutorials',
      'https://matplotlib.org/stable/tutorials/index.html',
      'Matplotlib',
    ),
    resource(
      'Seaborn Tutorial',
      'https://seaborn.pydata.org/tutorial.html',
      'Seaborn',
    ),
  ]),
  skill('pandas', 'Data Cleaning with pandas', 'Data and Databases', 2, [
    resource(
      'Getting Started with pandas',
      'https://pandas.pydata.org/docs/getting_started/index.html',
      'pandas',
    ),
    resource(
      'pandas User Guide',
      'https://pandas.pydata.org/docs/user_guide/index.html',
      'pandas',
    ),
  ]),
  skill(
    'machine-learning',
    'Machine Learning Basics',
    'Data and Databases',
    3,
    [
      resource(
        'Machine Learning Crash Course',
        'https://developers.google.com/machine-learning/crash-course',
        'Google',
        'COURSE',
      ),
      resource(
        'Scikit-learn User Guide',
        'https://scikit-learn.org/stable/user_guide.html',
        'scikit-learn',
      ),
    ],
  ),
  skill('linux', 'Linux', 'Infrastructure', 1, [
    resource(
      'The Linux Command Line for Beginners',
      'https://ubuntu.com/tutorials/command-line-for-beginners',
      'Ubuntu',
    ),
    resource(
      'Debian Reference',
      'https://www.debian.org/doc/manuals/debian-reference/',
      'Debian',
      'BOOK',
    ),
  ]),
  skill('networking', 'Networking Basics', 'Infrastructure', 1, [
    resource(
      'How Does the Internet Work?',
      'https://developer.mozilla.org/en-US/docs/Learn_web_development/Howto/Web_mechanics/How_does_the_Internet_work',
      'MDN',
      'ARTICLE',
    ),
    resource(
      'DNS Glossary',
      'https://developer.mozilla.org/en-US/docs/Glossary/DNS',
      'MDN',
    ),
  ]),
  skill('containers', 'Docker Containers', 'Infrastructure', 2, [
    resource(
      'Get Started with Docker',
      'https://docs.docker.com/get-started/',
      'Docker',
    ),
    resource('Docker Compose', 'https://docs.docker.com/compose/', 'Docker'),
  ]),
  skill('ci', 'Continuous Integration', 'Infrastructure', 3, [
    resource(
      'Understand GitHub Actions',
      'https://docs.github.com/en/actions/get-started/understand-github-actions',
      'GitHub',
    ),
    resource(
      'GitHub Actions Quickstart',
      'https://docs.github.com/en/actions/writing-workflows/quickstart',
      'GitHub',
    ),
  ]),
  skill('cloud', 'Cloud Computing Basics', 'Infrastructure', 2, [
    resource(
      'What Is Cloud Computing?',
      'https://docs.aws.amazon.com/whitepapers/latest/aws-overview/what-is-cloud-computing.html',
      'AWS',
    ),
    resource(
      'Describe Cloud Computing',
      'https://learn.microsoft.com/en-us/training/modules/describe-cloud-compute/',
      'Microsoft Learn',
      'COURSE',
    ),
  ]),
  skill('web-security', 'Web Security Basics', 'Security', 2, [
    resource('OWASP Top 10', 'https://owasp.org/www-project-top-ten/', 'OWASP'),
    resource(
      'MDN Web Security',
      'https://developer.mozilla.org/en-US/docs/Web/Security',
      'MDN',
    ),
  ]),
  skill('access-control', 'Authentication and Authorization', 'Security', 3, [
    resource(
      'Authentication Cheat Sheet',
      'https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html',
      'OWASP',
    ),
    resource(
      'Authorization Cheat Sheet',
      'https://cheatsheetseries.owasp.org/cheatsheets/Authorization_Cheat_Sheet.html',
      'OWASP',
    ),
  ]),
  skill('android', 'Android Development', 'Mobile Development', 3, [
    resource(
      'Android Training Courses',
      'https://developer.android.com/courses',
      'Android Developers',
      'COURSE',
    ),
    resource(
      'Introduction to Activities',
      'https://developer.android.com/guide/components/activities/intro-activities',
      'Android Developers',
    ),
  ]),
  skill('testing', 'Software Testing', 'Quality Assurance', 2, [
    resource(
      'Getting Started with Vitest',
      'https://vitest.dev/guide/',
      'Vitest',
    ),
    resource(
      'Node.js Test Runner',
      'https://nodejs.org/api/test.html',
      'Node.js',
    ),
  ]),
];
