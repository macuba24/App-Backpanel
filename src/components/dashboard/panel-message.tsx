export function PanelMessage({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-xl border-2 border-black bg-card p-8">
      <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
      <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{body}</p>
    </section>
  );
}
