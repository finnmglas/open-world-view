import api from "@/lib/api";

type PingResponse = {
  pong: boolean;
  message: string;
};

export default async function Home() {
  let data: PingResponse | null = null;
  let error: string | null = null;

  try {
    const res = await api.get<PingResponse>("/ping");
    data = res.data;
  } catch (e) {
    error = e instanceof Error ? e.message : "Unknown error";
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 font-sans p-8">
      <div className="w-full max-w-xl rounded-2xl border border-zinc-800 bg-zinc-900 p-10 shadow-2xl text-center">
        <p className="mb-2 text-xs font-mono uppercase tracking-widest text-zinc-500">
          Backend connection test
        </p>
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-white">
          GET /ping
        </h1>

        {data ? (
          <div className="rounded-xl bg-green-950 border border-green-700 px-8 py-6">
            <span className="block text-6xl font-black text-green-400 mb-3">
              {data.pong ? "PONG" : "no pong?"}
            </span>
            <p className="text-green-300 text-lg font-medium">{data.message}</p>
          </div>
        ) : (
          <div className="rounded-xl bg-red-950 border border-red-700 px-8 py-6">
            <span className="block text-4xl font-black text-red-400 mb-3">
              FAILED
            </span>
            <p className="text-red-300 font-mono text-sm">{error}</p>
          </div>
        )}

        <p className="mt-8 text-xs font-mono text-zinc-600">
          API_URL: {process.env.API_URL}
        </p>
      </div>
    </div>
  );
}
