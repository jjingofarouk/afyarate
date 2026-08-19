/**
 * "How it works" strip for the home page, a three-step, numbered walkthrough
 * (not a row of cards) so the page mixes layout types: a horizontal connector
 * line links the steps, each with an icon badge and short copy.
 */
export default function HowItWorks({
  steps,
}: {
  steps: { icon: React.ReactNode; title: string; text: string }[];
}) {
  return (
    <ol className="relative grid grid-cols-1 gap-8 sm:grid-cols-3 sm:gap-6">
      {steps.map((step, i) => (
        <li key={step.title} className="relative flex flex-col items-center text-center sm:items-start sm:text-left">
          {i < steps.length - 1 && (
            <span
              aria-hidden
              className="absolute left-1/2 top-5 hidden h-px w-full -translate-x-1/2 border-t-2 border-dashed border-emerald-200 dark:border-emerald-900/50 sm:block"
            />
          )}
          <div className="relative grid size-10 place-items-center rounded-2xl bg-emerald-600 text-white shadow-lg shadow-emerald-600/20">
            {step.icon}
            <span className="absolute -right-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-slate-900 text-[10px] font-bold text-white dark:bg-slate-100 dark:text-slate-900">
              {i + 1}
            </span>
          </div>
          <h3 className="mt-4 text-base font-bold tracking-tight text-slate-900 dark:text-slate-50">
            {step.title}
          </h3>
          <p className="mt-1.5 max-w-xs text-sm leading-relaxed text-slate-600 dark:text-slate-400">
            {step.text}
          </p>
        </li>
      ))}
    </ol>
  );
}