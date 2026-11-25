export default function StudentPage({ title, description, children }) {
  return (
    <div className="max-w-3xl">
      <h1 className="font-display text-4xl leading-tight tracking-tight sm:text-5xl">
        {title}
      </h1>
      <p className="mt-3 leading-relaxed text-muted">{description}</p>
      <div className="mt-7">{children}</div>
    </div>
  );
}
