export function formatNumber(num: number): string {
  if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(1)}M`;
  }
  if (num >= 1_000) {
    return `${(num / 1_000).toFixed(0)}K`;
  }
  return num.toString();
}

export function formatDate(date: string): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function getVelocityColor(velocity: string): string {
  switch (velocity) {
    case 'breakout':
      return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    case 'rising':
      return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    case 'stable':
      return 'text-sky-400 bg-sky-500/10 border-sky-500/30';
    case 'declining':
      return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
    default:
      return 'text-gray-400 bg-gray-500/10 border-gray-500/30';
  }
}

export function getScoreColor(score: number): string {
  if (score >= 90) return 'text-rose-400';
  if (score >= 80) return 'text-amber-400';
  if (score >= 70) return 'text-emerald-400';
  if (score >= 50) return 'text-sky-400';
  return 'text-gray-400';
}

export function getScoreBarColor(score: number): string {
  if (score >= 90) return 'bg-rose-500';
  if (score >= 80) return 'bg-amber-500';
  if (score >= 70) return 'bg-emerald-500';
  if (score >= 50) return 'bg-sky-500';
  return 'bg-gray-500';
}

export function getCategoryColor(category: string): string {
  const map: Record<string, string> = {
    'Frontier Model': 'text-violet-300 bg-violet-500/10 border-violet-500/30',
    'Open Source': 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    Safety: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
    Agents: 'text-sky-300 bg-sky-500/10 border-sky-500/30',
    Multimodal: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
    Society: 'text-pink-300 bg-pink-500/10 border-pink-500/30',
    Policy: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
    Industry: 'text-indigo-300 bg-indigo-500/10 border-indigo-500/30',
    Infrastructure: 'text-orange-300 bg-orange-500/10 border-orange-500/30',
  };
  return map[category] || 'text-gray-300 bg-gray-500/10 border-gray-500/30';
}

export function getCompanyColor(company: string): string {
  const map: Record<string, string> = {
    OpenAI: 'text-emerald-300 bg-emerald-500/10 border-emerald-500/30',
    Anthropic: 'text-amber-300 bg-amber-500/10 border-amber-500/30',
    'Google DeepMind': 'text-sky-300 bg-sky-500/10 border-sky-500/30',
    Meta: 'text-blue-300 bg-blue-500/10 border-blue-500/30',
    ByteDance: 'text-rose-300 bg-rose-500/10 border-rose-500/30',
    Microsoft: 'text-cyan-300 bg-cyan-500/10 border-cyan-500/30',
    xAI: 'text-gray-300 bg-gray-500/10 border-gray-500/30',
  };
  return map[company] || 'text-gray-300 bg-gray-500/10 border-gray-500/30';
}

export function getRegionLabel(region: string): string {
  const map: Record<string, string> = {
    global: 'Global',
    usa: 'USA',
    india: 'India',
    eu: 'EU',
  };
  return map[region] || region;
}
