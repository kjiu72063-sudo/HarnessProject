import { useState, useEffect } from 'react';

interface HealthResponse {
  status: string;
  service: string;
}

function ApiStatus({ loading, health }: { loading: boolean; health: HealthResponse | null }) {
  return (
    <div className="mt-8 px-6 py-4 bg-[#1A1D24] rounded-lg border border-[#374151]">
      <div className="flex items-center gap-3">
        <span className="text-xs text-[#6B7280] font-mono">API STATUS</span>
        {loading ? (
          <span className="text-xs text-[#F59E0B] font-mono">connecting...</span>
        ) : health ? (
          <span className="text-xs text-[#10B981] font-mono">
            {health.status} — {health.service}
          </span>
        ) : (
          <span className="text-xs text-[#EF4444] font-mono">offline</span>
        )}
      </div>
    </div>
  );
}

export default function App() {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        setHealth(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });
  }, []);

  return (
    <div className="min-h-screen bg-[#0F1115] text-white flex flex-col items-center justify-center">
      <div className="flex flex-col items-center gap-6">
        <div className="flex items-center gap-3">
          <div className="w-3 h-3 rounded-full bg-[#F59E0B] animate-pulse" />
          <h1 className="text-2xl font-bold tracking-tight">Harness Platform</h1>
        </div>
        <p className="text-sm text-[#6B7280] max-w-md text-center">
          元应用开发平台 — 基于 Harness Engineering + LangGraph
        </p>
        <ApiStatus loading={loading} health={health} />
        <div className="mt-4 grid grid-cols-4 gap-2 text-xs text-[#6B7280] font-mono">
          <span>React 19</span>
          <span>·</span>
          <span>FastAPI</span>
          <span>·</span>
        </div>
        <div className="text-xs text-[#6B7280] font-mono">
          LangGraph · PostgreSQL · OpenAI
        </div>
      </div>
    </div>
  );
}
