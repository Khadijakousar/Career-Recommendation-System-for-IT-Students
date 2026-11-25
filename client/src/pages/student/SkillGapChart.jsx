import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

function shortName(name) {
  return name.length > 15 ? `${name.slice(0, 14)}…` : name;
}

export default function SkillGapChart({ gaps }) {
  const data = gaps.map(({ skill, studentLevel, requiredLevel }) => ({
    name: skill.name,
    studentLevel,
    requiredLevel,
  }));

  return (
    <section aria-labelledby="gap-chart-title" className="space-y-3">
      <h2 id="gap-chart-title" className="font-display text-2xl">
        Skill gaps by priority
      </h2>
      <div
        className="flex flex-wrap gap-4 text-sm text-muted"
        aria-hidden="true"
      >
        <span className="flex items-center gap-2">
          <span className="size-3 bg-accent" />
          Your level
        </span>
        <span className="flex items-center gap-2">
          <span className="size-3 border border-muted bg-line" />
          Required level
        </span>
      </div>
      <div
        className="min-w-0 border border-line px-2 py-3"
        role="img"
        aria-label="Bar chart of current and required levels. Full values are in the skill requirements table."
      >
        <ResponsiveContainer
          width="100%"
          height={Math.max(150, data.length * 48 + 42)}
        >
          <BarChart
            data={data}
            layout="vertical"
            margin={{ right: 10 }}
            accessibilityLayer={false}
          >
            <CartesianGrid horizontal={false} stroke="var(--color-line)" />
            <XAxis
              type="number"
              domain={[0, 5]}
              ticks={[0, 1, 2, 3, 4, 5]}
              tick={{ fontSize: 12, fill: 'var(--color-muted)' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              width={112}
              interval={0}
              tickFormatter={shortName}
              tick={{ fontSize: 12, fill: 'var(--color-ink)' }}
            />
            <Tooltip />
            <Bar
              dataKey="studentLevel"
              name="Your level"
              fill="var(--color-accent)"
              barSize={9}
              isAnimationActive={false}
            />
            <Bar
              dataKey="requiredLevel"
              name="Required level"
              fill="var(--color-line)"
              stroke="var(--color-muted)"
              barSize={9}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
