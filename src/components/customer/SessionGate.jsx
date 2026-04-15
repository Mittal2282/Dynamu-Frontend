import { useCallback, useEffect, useRef, useState } from "react";
import {
  checkSession,
  getJoinStatus,
  requestJoinSession,
  startSession,
} from "../../services/customerService";
import { connectTableSocket, disconnectTableSocket } from "../../services/socketService";
import { authStore } from "../../store/authStore";
import Button from "../ui/Button";
import { Spinner } from "../ui/Spinner";
import Text from "../ui/Text";

/**
 * SessionGate — shown before the customer menu loads.
 *
 * States:
 *   checking       → verifying if a session exists
 *   name_entry     → fresh table — ask for name to start session
 *   join_or_create → active session found — show Join / Create options
 *   name_entry_new → user chose Create New — ask for their name
 *   waiting        → join request sent — polling for approval
 *   rejected       → join request rejected
 *   expired        → join request timed out
 *   error          → network / unexpected error
 *
 * Props:
 *   qrCodeId      {string}
 *   tableNumber   {string|number}
 *   onSessionReady(sessionData, guestName)  — called when gate is cleared
 */
export default function SessionGate({ qrCodeId, tableNumber, onSessionReady }) {
  const [gateState, setGateState] = useState("checking");
  const [existingName, setExistingName] = useState(""); // host's name
  const [anyoneOnline, setAnyoneOnline] = useState(false);
  const [nameInput, setNameInput] = useState("");
  const [nameError, setNameError] = useState("");
  const [countdown, setCountdown] = useState(60);
  const [errorMsg, setErrorMsg] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const requestIdRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const countdownRef = useRef(null);
  const inputRef = useRef(null);

  // ── Focus input when name entry states appear ───────────────────────────
  useEffect(() => {
    if (gateState === "name_entry" || gateState === "name_entry_new") {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [gateState]);

  // ── Initial check ───────────────────────────────────────────────────────
  useEffect(() => {
    async function check() {
      try {
        let existingToken = authStore.getState().sessionToken;
        // Zustand v5 persist hydrates asynchronously — fall back to localStorage
        // directly so a page refresh doesn't lose the token before hydration completes.
        if (!existingToken) {
          try {
            const stored = JSON.parse(localStorage.getItem("AuthStore") || "{}");
            existingToken = stored?.state?.sessionToken ?? null;
          } catch {
            /* ignore parse errors */
          }
        }
        const result = await checkSession(qrCodeId, existingToken);

        if (!result.has_session) {
          setGateState("name_entry");
          return;
        }

        if (result.already_member) {
          // Same device already has this session — skip gate
          onSessionReady(result, authStore.getState().guestName || "");
          return;
        }

        setExistingName(result.customer_name || "");
        setAnyoneOnline(result.anyone_online);
        setGateState("join_or_create");
      } catch {
        setGateState("name_entry"); // fallback: treat as fresh table
      }
    }
    check();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [qrCodeId]);

  // ── Watch for session appearing while on name_entry (real-time via socket) ──
  useEffect(() => {
    if (gateState !== "name_entry") return;

    const socket = connectTableSocket(qrCodeId);

    const onSessionStarted = (payload) => {
      disconnectTableSocket();
      setExistingName(payload.customer_name || "");
      setAnyoneOnline(payload.anyone_online ?? true);
      setGateState("join_or_create");
    };

    socket.on("session:started", onSessionStarted);

    return () => {
      socket.off("session:started", onSessionStarted);
      disconnectTableSocket();
    };
  }, [gateState, qrCodeId]);

  // ── Polling (waiting for approval) ─────────────────────────────────────
  const stopPolling = useCallback(() => {
    clearInterval(pollIntervalRef.current);
    clearInterval(countdownRef.current);
  }, []);

  const startPolling = useCallback(() => {
    setCountdown(60);

    // Countdown timer
    countdownRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // Poll every 2s
    pollIntervalRef.current = setInterval(async () => {
      if (!requestIdRef.current) return;
      try {
        const result = await getJoinStatus(requestIdRef.current);
        if (result.status === "approved") {
          stopPolling();
          onSessionReady(result, nameInput.trim());
        } else if (result.status === "rejected") {
          stopPolling();
          setGateState("rejected");
        } else if (result.status === "expired") {
          stopPolling();
          setGateState("expired");
        }
      } catch {
        stopPolling();
        setGateState("expired");
      }
    }, 2000);
  }, [nameInput, onSessionReady, stopPolling]);

  useEffect(() => () => stopPolling(), [stopPolling]);

  // ── Handlers ────────────────────────────────────────────────────────────
  const validateName = () => {
    const v = nameInput.trim();
    if (!v) {
      setNameError("Please enter your name");
      return null;
    }
    if (v.length > 30) {
      setNameError("Name must be 30 characters or less");
      return null;
    }
    setNameError("");
    return v;
  };

  const handleNameConfirm = async () => {
    const name = validateName();
    if (!name) return;
    setIsSubmitting(true);
    // Disconnect the table socket before the HTTP call so we don't receive
    // our own session:started event and briefly flash the join_or_create screen.
    disconnectTableSocket();
    try {
      const sessionData = await startSession(qrCodeId, tableNumber, name, false);
      onSessionReady(sessionData, name);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Failed to start session. Please try again.");
      setGateState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateNew = async () => {
    const name = validateName();
    if (!name) return;
    setIsSubmitting(true);
    disconnectTableSocket();
    try {
      const sessionData = await startSession(qrCodeId, tableNumber, name, true);
      onSessionReady(sessionData, name);
    } catch (err) {
      setErrorMsg(err?.response?.data?.message || "Failed to create session. Please try again.");
      setGateState("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleJoin = async () => {
    const name = validateName();
    if (!name) return;
    setIsSubmitting(true);
    try {
      const result = await requestJoinSession(qrCodeId, name);
      requestIdRef.current = result.request_id;
      setGateState("waiting");
      startPolling();
    } catch (err) {
      // Session may have ended between check and join
      console.log(err);
      setGateState("name_entry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelWaiting = () => {
    stopPolling();
    requestIdRef.current = null;
    setGateState("join_or_create");
  };

  const handleRetry = () => {
    setNameInput("");
    setNameError("");
    setGateState("join_or_create");
  };

  // ── Render ───────────────────────────────────────────────────────────────
  const card = (children) => (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center px-5">
      <div className="w-full max-w-sm bg-slate-900 border border-white/10 rounded-3xl p-7 flex flex-col gap-5">
        {children}
      </div>
    </div>
  );

  if (gateState === "checking") {
    return card(
      <div className="flex flex-col items-center gap-3 py-4">
        <Spinner size="lg" />
        <Text size="sm" color="muted">
          Checking table…
        </Text>
      </div>,
    );
  }

  if (gateState === "name_entry") {
    return card(
      <>
        <div className="text-center">
          <div className="text-4xl mb-3">👋</div>
          <Text as="h1" size="xl" weight="bold">
            Welcome!
          </Text>
          <Text size="sm" color="muted" className="mt-1">
            What's your name?
          </Text>
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleNameConfirm();
            }}
            placeholder="Your name"
            maxLength={30}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition-colors"
          />
          {nameError && (
            <Text size="xs" className="text-red-400">
              {nameError}
            </Text>
          )}
        </div>
        <Button onClick={handleNameConfirm} className="w-full" loading={isSubmitting}>
          Start Session
        </Button>
      </>,
    );
  }

  if (gateState === "join_or_create") {
    return card(
      <>
        <div className="text-center">
          <div className="text-4xl mb-3">🍽️</div>
          <Text as="h1" size="lg" weight="bold">
            {existingName ? `${existingName}'s Session` : "Active Session"}
          </Text>
          <Text size="sm" color="muted" className="mt-1">
            {existingName
              ? `${existingName} is already at this table.`
              : "There's already an active session at this table."}
          </Text>
        </div>

        <div className="flex flex-col gap-3">
          <input
            ref={inputRef}
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Your name"
            maxLength={30}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition-colors"
          />
          {nameError && (
            <Text size="xs" className="text-red-400">
              {nameError}
            </Text>
          )}
        </div>

        <div className="flex flex-col gap-3">
          {anyoneOnline && (
            <Button onClick={handleJoin} className="w-full" loading={isSubmitting}>
              Join {existingName ? `${existingName}'s` : "the"} session
            </Button>
          )}
          {!anyoneOnline && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-3">
              <Text size="xs" className="text-amber-400 text-center">
                No active members online — you can't join right now
              </Text>
            </div>
          )}
          <button
            onClick={() => {
              validateName() !== null && setGateState("name_entry_new");
            }}
            className="w-full py-3 rounded-2xl border border-white/10 text-sm text-slate-300 hover:bg-white/5 transition-colors"
          >
            Create new session
          </button>
        </div>
      </>,
    );
  }

  if (gateState === "name_entry_new") {
    return card(
      <>
        <div className="text-center">
          <div className="text-4xl mb-3">🆕</div>
          <Text as="h1" size="lg" weight="bold">
            New Session
          </Text>
          <Text size="sm" color="muted" className="mt-1">
            This will clear the existing cart and orders.
          </Text>
        </div>
        <div className="flex flex-col gap-2">
          <input
            ref={inputRef}
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreateNew();
            }}
            placeholder="Your name"
            maxLength={30}
            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-brand transition-colors"
          />
          {nameError && (
            <Text size="xs" className="text-red-400">
              {nameError}
            </Text>
          )}
        </div>
        <div className="flex flex-col gap-2">
          <Button onClick={handleCreateNew} className="w-full" loading={isSubmitting}>
            Start my session
          </Button>
          <button
            onClick={() => setGateState("join_or_create")}
            className="text-sm text-slate-300 hover:text-white transition-colors py-1"
          >
            ← Back
          </button>
        </div>
      </>,
    );
  }

  if (gateState === "waiting") {
    return card(
      <>
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <Spinner size="lg" />
          <div>
            <Text as="h1" size="lg" weight="bold">
              Waiting for approval
            </Text>
            <Text size="sm" color="muted" className="mt-1">
              {existingName
                ? `${existingName} needs to approve your request`
                : "A session member needs to approve your request"}
            </Text>
          </div>
          <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
            <Text size="lg" weight="bold" color="brand">
              {countdown}
            </Text>
          </div>
          <button
            onClick={handleCancelWaiting}
            className="text-sm text-slate-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </>,
    );
  }

  if (gateState === "rejected") {
    return card(
      <>
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="text-4xl">❌</div>
          <div>
            <Text as="h1" size="lg" weight="bold">
              Request Rejected
            </Text>
            <Text size="sm" color="muted" className="mt-1">
              Your request to join was declined.
            </Text>
          </div>
          <Button onClick={handleRetry} className="w-full">
            Try again
          </Button>
        </div>
      </>,
    );
  }

  if (gateState === "expired") {
    return card(
      <>
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="text-4xl">⏱️</div>
          <div>
            <Text as="h1" size="lg" weight="bold">
              No Response
            </Text>
            <Text size="sm" color="muted" className="mt-1">
              No one approved your request in time.
            </Text>
          </div>
          <div className="flex flex-col gap-2 w-full">
            <Button onClick={handleRetry} className="w-full">
              Try again
            </Button>
            <button
              onClick={() => {
                setNameInput("");
                setGateState("name_entry_new");
              }}
              className="text-sm text-slate-300 hover:text-white transition-colors py-1"
            >
              Create new session instead
            </button>
          </div>
        </div>
      </>,
    );
  }

  if (gateState === "error") {
    return card(
      <>
        <div className="flex flex-col items-center gap-4 py-2 text-center">
          <div className="text-4xl">⚠️</div>
          <div>
            <Text as="h1" size="lg" weight="bold">
              Something went wrong
            </Text>
            <Text size="sm" color="muted" className="mt-1">
              {errorMsg}
            </Text>
          </div>
          <Button
            onClick={() => {
              setGateState("name_entry");
              setNameInput("");
            }}
            className="w-full"
          >
            Try again
          </Button>
        </div>
      </>,
    );
  }

  return null;
}
