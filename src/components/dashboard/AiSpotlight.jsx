import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import Card from '../ui/Card';

const PROMPTS = [
  'Which projects are behind schedule?',
  'Who has the most assigned tasks?',
  'What tasks are due this week?',
];

export default function AiSpotlight() {
  const navigate = useNavigate();
  return (
    <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-brand-600 via-brand-700 to-violet-700 p-5 text-white shadow-float">
      <div className="pointer-events-none absolute -right-10 -top-16 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-20 left-10 h-44 w-44 rounded-full bg-violet-300/20 blur-3xl" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/15 ring-1 ring-inset ring-white/20">
            <Sparkles className="h-4 w-4" />
          </span>
          <div>
            <p className="text-[13px] font-semibold leading-tight">Pulse AI</p>
            <p className="text-[10px] text-white/60">Connected to your live workspace</p>
          </div>
        </div>
        <h3 className="mt-4 max-w-xs text-lg font-semibold leading-snug tracking-tight text-balance">
          Ask anything. It already knows your projects, tasks and team.
        </h3>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {PROMPTS.map((prompt) => (
            <button
              key={prompt}
              type="button"
              onClick={() => navigate('/assistant', { state: { prompt } })}
              className="rounded-full bg-white/10 px-3 py-1.5 text-[11px] font-medium text-white/90 ring-1 ring-inset ring-white/15 backdrop-blur transition hover:bg-white/20"
            >
              {prompt}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => navigate('/assistant')}
          className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-3.5 py-2 text-xs font-semibold text-brand-700 shadow-sm transition hover:bg-brand-50"
        >
          Open assistant
          <ArrowRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </Card>
  );
}
