import { respondToJoin } from "../../../services/customerService";
import Text from "../../../components/ui/Text";

/**
 * JoinRequestsPanel — floating panel showing pending join requests for the table session.
 */
export default function JoinRequestsPanel({ requests, onResolve }) {
  if (requests.length === 0) return null;

  return (
    <div className="fixed bottom-[85px] md:bottom-5 left-0 right-0 z-40 flex justify-center px-4 pointer-events-none">
      <div className="w-full md:max-w-3xl lg:max-w-full bg-slate-800 border border-white/10 rounded-2xl shadow-xl overflow-hidden pointer-events-auto">
        <div className="px-4 py-2.5 border-b border-white/10 flex items-center gap-2">
          <span className="text-base">🔔</span>
          <Text size="sm" weight="semibold">
            Join Requests ({requests.length})
          </Text>
        </div>
        <div className="divide-y divide-white/5">
          {requests.map((req) => (
            <div
              key={req.request_id}
              className="px-4 py-3 flex items-center justify-between gap-3"
            >
              <Text size="sm" color="muted" className="flex-1 truncate">
                <span className="text-white font-medium">{req.joiner_name}</span> wants to join
              </Text>
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={async () => {
                    await respondToJoin(req.request_id, true).catch(() => {});
                    onResolve(req.request_id);
                  }}
                  className="w-8 h-8 rounded-full bg-green-500/20 border border-green-500/30 text-green-400 flex items-center justify-center text-base hover:bg-green-500/40 transition-colors"
                  title="Accept"
                >
                  ✓
                </button>
                <button
                  onClick={async () => {
                    await respondToJoin(req.request_id, false).catch(() => {});
                    onResolve(req.request_id);
                  }}
                  className="w-8 h-8 rounded-full bg-red-500/20 border border-red-500/30 text-red-400 flex items-center justify-center text-base hover:bg-red-500/40 transition-colors"
                  title="Reject"
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
