import React from 'react';

/**
 * ActionBlock – reusable dashboard card
 *
 * Props
 * ─────
 * @param {string}      title        – Heading shown in ALL-CAPS
 * @param {React.node}  icon         – Icon element (emoji, SVG, or component)
 * @param {string}      description  – Short description text
 * @param {string}      action       – Button label
 * @param {function}    onClick      – Button click handler
 * @param {string}      [accentColor]– Tailwind color class for icon bg, e.g. 'bg-indigo-500'
 * @param {string}      [badge]      – Optional status badge text (e.g. 'LIVE', 'NUEVO')
 * @param {string}      [badgeColor] – Tailwind bg class for badge
 * @param {boolean}     [disabled]   – Greys out the card
 * @param {React.node}  [metric]     – Optional live metric shown below description
 */
export default function ActionBlock({
  title,
  icon,
  description,
  action,
  onClick,
  accentColor = 'bg-indigo-500',
  badge,
  badgeColor = 'bg-emerald-500',
  disabled = false,
  metric,
}) {
  return (
    <article
      className={`
        relative flex flex-col gap-3 rounded-2xl border border-white/10 p-5
        bg-gradient-to-br from-[#1e2535] to-[#111827]
        shadow-lg transition-transform duration-200
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5 hover:shadow-indigo-500/10'}
        animate-[fadeIn_0.4s_ease-out_both]
      `}
      aria-label={title}
    >
      {/* ── Badge ── */}
      {badge && (
        <span
          className={`absolute top-3 right-3 text-[10px] font-bold tracking-widest px-2 py-0.5 rounded-full text-white ${badgeColor}`}
        >
          {badge}
        </span>
      )}

      {/* ── Icon ── */}
      <div
        className={`w-12 h-12 flex items-center justify-center rounded-xl text-2xl text-white shadow-md ${accentColor}`}
        aria-hidden="true"
      >
        {icon}
      </div>

      {/* ── Text ── */}
      <div className="flex flex-col gap-1 flex-1">
        <h3 className="text-xs font-bold tracking-widest uppercase text-slate-400">
          {title}
        </h3>
        <p className="text-sm text-slate-200 leading-relaxed">{description}</p>
        {metric && (
          <div className="mt-1 text-xs text-slate-400 font-mono">{metric}</div>
        )}
      </div>

      {/* ── Action button ── */}
      <button
        disabled={disabled}
        onClick={onClick}
        className={`
          mt-auto w-full py-2.5 rounded-xl text-sm font-semibold tracking-wide
          transition-colors duration-150 focus:outline-none focus-visible:ring-2
          focus-visible:ring-indigo-400 focus-visible:ring-offset-1
          focus-visible:ring-offset-[#111827]
          ${
            disabled
              ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
              : 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-sm'
          }
        `}
      >
        {action}
      </button>
    </article>
  );
}
