import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const formatAverage = (value) => Number(value).toFixed(1);

export default function DashboardSkillsChart({ groups }) {
  const rated = groups.filter(({ ratedCount }) => ratedCount > 0);

  return (
    <>
      <div aria-hidden="true" className="min-w-0 border border-line px-2 py-3">
        <ResponsiveContainer
          width="100%"
          height={Math.max(130, rated.length * 40 + 36)}
        >
          <BarChart
            data={rated}
            layout="vertical"
            margin={{ right: 12 }}
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
              dataKey="category"
              width={122}
              interval={0}
              tickFormatter={(name) =>
                name.length > 18 ? `${name.slice(0, 17)}…` : name
              }
              tick={{ fontSize: 12, fill: 'var(--color-ink)' }}
            />
            <Tooltip
              formatter={(value) => [
                `${formatAverage(value)} of 5`,
                'Average rating',
              ]}
            />
            <Bar
              dataKey="averageLevel"
              fill="var(--color-accent)"
              barSize={12}
              isAnimationActive={false}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <dl className="sr-only">
        {groups.map(({ category, averageLevel, ratedCount, totalCount }) => (
          <div key={category}>
            <dt>{category}</dt>
            <dd>
              {ratedCount
                ? `${formatAverage(averageLevel)} of 5, ${ratedCount} of ${totalCount} rated`
                : 'No ratings'}
            </dd>
          </div>
        ))}
      </dl>
    </>
  );
}
