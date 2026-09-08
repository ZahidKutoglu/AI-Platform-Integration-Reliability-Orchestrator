"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { time: string; availability: number; platform: string };

const strokes = ["#1d1d1f", "#b25e09", "#0b74de", "#5b4dff"];

export function ReliabilityChart({ data }: { data: Point[] }) {
  const platformKeys = Array.from(new Set(data.map((point) => point.platform)));
  const byTime = new Map<string, Record<string, string | number>>();
  for (const point of data) {
    const key = point.time.slice(0, 13);
    const current = byTime.get(key) ?? { time: key };
    current[point.platform] = point.availability;
    byTime.set(key, current);
  }
  const series = Array.from(byTime.values());
  const names: Record<string, string> = {
    chatgpt: "ChatGPT Enterprise",
    claude: "Claude",
    replit: "Replit",
    n8n: "n8n",
  };

  if (series.length === 0) {
    return <p className="py-16 text-center text-[14px] text-muted">Not enough health history to chart yet.</p>;
  }

  return (
    <div className="h-[280px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <XAxis dataKey="time" hide />
          <YAxis domain={["dataMin - 0.4", 100]} hide />
          <Tooltip
            contentStyle={{
              borderRadius: 16,
              border: "1px solid rgba(29,29,31,0.08)",
              boxShadow: "none",
              fontSize: 13,
            }}
            formatter={(value, name) => [`${Number(value).toFixed(2)}%`, names[String(name)] ?? String(name)]}
          />
          {platformKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={strokes[index % strokes.length]}
              fill="rgba(29,29,31,0.04)"
              strokeWidth={1.6}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
