import api from "@/lib/api";

type PingResponse = {
  pong: boolean;
  message: string;
};

export async function PingCard() {
  let data: PingResponse | null = null;
  let error: string | null = null;

  try {
    const res = await api.get<PingResponse>("/ping");
    data = res.data;
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <div className="w-full max-w-xl rounded border border-border bg-card p-10 shadow-2xl text-center">
      <p className="mb-2 text-xs font-mono uppercase tracking-widest text-muted-foreground">
        Backend connection test
      </p>
      <h1 className="mb-8 text-3xl font-bold tracking-tight text-foreground">
        GET /ping
      </h1>

      {data ? (
        <div className="rounded border border-green-700 bg-green-950/40 px-8 py-6">
          <span className="block text-6xl font-black text-green-400 mb-3">
            {data.pong ? "PONG" : "no pong?"}
          </span>
          <p className="text-green-300 text-lg font-medium">{data.message}</p>
        </div>
      ) : (
        <div className="rounded border border-red-700 bg-red-950/40 px-8 py-6">
          <span className="block text-4xl font-black text-red-400 mb-3">
            FAILED
          </span>
          <p className="text-red-300 font-mono text-sm">{error}</p>
        </div>
      )}

      <p className="mt-8 text-xs font-mono text-muted-foreground/60">
        API_URL: {process.env.API_URL}
      </p>
    </div>
  );
}
