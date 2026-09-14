"use client";

import { useState, useCallback, useId } from "react";
import type { EckardtDomainDef, EckardtStage, TreatmentModality } from "@/data/calculators/gastroenterology/eckardt-score-achalasia";

interface Props {
  domains: EckardtDomainDef[];
  stages: EckardtStage[];
  treatmentModalities: TreatmentModality[];
}

function ScoreGauge({ score, max = 12 }: { score: number; max?: number }) {
  const pct = Math.min((score / max) * 100, 100);
  const color =
    score <= 3 ? "#059669" : score <= 6 ? "#d97706" : "#dc2626";
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <span className="text-5xl font-black tabular-nums" style={{ color }}>
          {score}
        </span>
        <span className="text-lg text-slate-400 dark:text-slate-500">/ {max}</span>
      </div>
      <div className="h-3 w-full overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <div className="flex justify-between text-xs text-slate-400 dark:text-slate-500">
        <span>0 — Remission</span>
        <span>12 — Severe</span>
      </div>
    </div>
  );
}

function DomainCard({
  domain,
  value,
  onChange,
}: {
  domain: EckardtDomainDef;
  value: number;
  onChange: (v: number) => void;
}) {
  const groupId = useId();
  return (
    <fieldset className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900/60">
      <legend className="mb-1 font-semibold text-slate-900 dark:text-slate-100">
        {domain.label}
      </legend>
      <p className="mb-3 text-xs text-slate-500 dark:text-slate-400">{domain.description}</p>
      <div className="space-y-2">
        {domain.options.map((opt) => {
          const inputId = `${groupId}-${opt.value}`;
          const isSelected = value === opt.value;
          return (
            <label
              key={opt.value}
              htmlFor={inputId}
              className={`flex cursor-pointer items-start gap-3 rounded-lg border px-3 py-2.5 text-sm transition-all ${
                isSelected
                  ? "border-emerald-500 bg-emerald-50 dark:border-emerald-600 dark:bg-emerald-950/40"
                  : "border-transparent bg-slate-50 hover:border-slate-300 dark:bg-slate-800/40 dark:hover:border-slate-600"
              }`}
            >
              <input
                id={inputId}
                type="radio"
                name={`${groupId}-domain`}
                value={opt.value}
                checked={isSelected}
                onChange={() => onChange(opt.value)}
                className="mt-0.5 shrink-0 accent-emerald-600"
              />
              <span className="flex-1">
                <span className="font-medium text-slate-900 dark:text-slate-100">
                  {opt.label}
                </span>{" "}
                <span className="text-slate-500 dark:text-slate-400">— {opt.description}</span>
              </span>
              <span
                className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums ${
                  isSelected
                    ? "bg-emerald-600 text-white"
                    : "bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300"
                }`}
              >
                {opt.value}
              </span>
            </label>
          );
        })}
      </div>
      {value > 0 && (
        <div className="mt-3 rounded-lg bg-blue-50 p-3 dark:bg-blue-950/20">
          <p className="text-xs leading-relaxed text-blue-800 dark:text-blue-300">
            <strong>Clinical note:</strong> {domain.clinicalNote}
          </p>
        </div>
      )}
    </fieldset>
  );
}

function StageResult({ stage, score }: { stage: EckardtStage; score: number }) {
  const colorMap = {
    emerald: {
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-400 dark:border-emerald-700",
      badge: "bg-emerald-600 text-white",
      text: "text-emerald-900 dark:text-emerald-100",
      subtle: "text-emerald-700 dark:text-emerald-300",
    },
    amber: {
      bg: "bg-amber-50 dark:bg-amber-950/20",
      border: "border-amber-400 dark:border-amber-700",
      badge: "bg-amber-600 text-white",
      text: "text-amber-900 dark:text-amber-100",
      subtle: "text-amber-700 dark:text-amber-300",
    },
    red: {
      bg: "bg-red-50 dark:bg-red-950/20",
      border: "border-red-400 dark:border-red-700",
      badge: "bg-red-600 text-white",
      text: "text-red-900 dark:text-red-100",
      subtle: "text-red-700 dark:text-red-300",
    },
  };
  const c = colorMap[stage.color];

  return (
    <div id="after-score" className={`rounded-xl border-2 ${c.border} ${c.bg} p-5 space-y-4`}>
      <div className="flex flex-wrap items-center gap-3">
        <span className={`rounded-full px-3 py-1 text-sm font-bold ${c.badge}`}>
          {stage.stage}
        </span>
        <span className={`font-semibold text-lg ${c.text}`}>{stage.label}</span>
      </div>

      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${c.subtle} mb-2`}>
          Recommendation
        </h3>
        <p className={`text-sm leading-relaxed ${c.text}`}>{stage.recommendation}</p>
      </div>

      <div>
        <h3 className={`text-xs font-semibold uppercase tracking-wider ${c.subtle} mb-2`}>
          Clinical Context
        </h3>
        <p className={`text-sm leading-relaxed ${c.text}`}>{stage.details}</p>
      </div>

      <div className={`text-xs ${c.subtle}`}>
        Score {score} — {stage.label} · Eckardt Score ≤3 = clinical remission threshold
      </div>
    </div>
  );
}

export default function EckardtCalculator({ domains, stages, treatmentModalities }: Props) {
  const [values, setValues] = useState<Record<string, number>>({});
  const [scored, setScored] = useState(false);

  const setDomain = useCallback((key: string, value: number) => {
    setValues((prev) => ({ ...prev, [key]: value }));
    setScored(false);
  }, []);

  const totalScore = domains.reduce((sum, d) => sum + (values[d.key] ?? 0), 0);
  const allAnswered = domains.every((d) => values[d.key] !== undefined);

  const stage = stages.find(
    (s) => totalScore >= s.scoreRange[0] && totalScore <= s.scoreRange[1]
  ) ?? stages[stages.length - 1];

  function handleCalculate() {
    setScored(true);
    const el = document.getElementById("after-score");
    if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "nearest" }), 100);
  }

  function handleReset() {
    setValues({});
    setScored(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  return (
    <div className="space-y-6">
      {/* Live score strip */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 dark:border-slate-800 dark:bg-slate-900/60">
        <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
          Total Eckardt Score
        </h2>
        <ScoreGauge score={totalScore} />
        {!allAnswered && (
          <p className="mt-3 text-xs text-slate-400 dark:text-slate-500">
            Complete all 4 domains below to calculate the score.
          </p>
        )}
      </div>

      {/* Domain cards grid */}
      <div className="grid gap-4 sm:grid-cols-2">
        {domains.map((domain) => (
          <DomainCard
            key={domain.key}
            domain={domain}
            value={values[domain.key] ?? -1}
            onChange={(v) => setDomain(domain.key, v)}
          />
        ))}
      </div>

      {/* Domain score summary */}
      {allAnswered && (
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900/40">
          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
            Score Breakdown
          </h3>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {domains.map((d) => (
              <div key={d.key} className="text-center rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <div className="text-2xl font-black text-slate-800 dark:text-slate-100 tabular-nums">
                  {values[d.key] ?? 0}
                </div>
                <div className="mt-1 text-xs text-slate-500 dark:text-slate-400">{d.shortLabel}</div>
              </div>
            ))}
          </div>
          <div className="mt-3 flex justify-between items-center border-t border-slate-200 dark:border-slate-700 pt-3">
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Total Score</span>
            <span className="text-2xl font-black tabular-nums text-slate-900 dark:text-slate-50">{totalScore} / 12</span>
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          id="calculate-eckardt-score"
          onClick={handleCalculate}
          disabled={!allAnswered}
          className="flex-1 sm:flex-none rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-emerald-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Calculate Score
        </button>
        <button
          onClick={handleReset}
          className="rounded-xl border border-slate-300 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
        >
          Reset
        </button>
      </div>

      {/* Result */}
      {scored && allAnswered && (
        <StageResult stage={stage} score={totalScore} />
      )}
    </div>
  );
}
