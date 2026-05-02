/**
 * TaskCenterPage — user-facing task list with instructions modal and submit flow.
 */
import { useState, useEffect, useCallback } from "react";
import toast from "react-hot-toast";
import {
  ListChecks,
  DollarSign,
  Star,
  CheckCircle2,
  Clock,
  ChevronRight,
  Zap,
} from "lucide-react";
import axiosInstance from "../api/axiosInstance";
import useAuth from "../hooks/useAuth";
import Modal from "../components/ui/Modal";
import Button from "../components/ui/Button";
import Badge from "../components/ui/Badge";

// ─── VIP badge config ──────────────────────────────────────────────────────

const VIP_COLOR = { 0: "neutral", 1: "info", 2: "warning", 3: "success" };

// ─── Helpers ──────────────────────────────────────────────────────────────

function fmtAmount(val) {
  return Number(val ?? 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

// ─── Task Card ─────────────────────────────────────────────────────────────

function TaskCard({ task, completionMap, onStart }) {
  const todayCount = completionMap[task.id] ?? 0;
  const remaining = task.daily_limit - todayCount;
  const exhausted = remaining <= 0;

  return (
    <div className="card rounded-2xl p-5 flex flex-col gap-4 hover:glow transition-all duration-300 animate-fade-in-up">
      {/* Header row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold theme-text truncate">{task.title}</h3>
          <p className="text-sm theme-text-secondary mt-1 line-clamp-2">
            {task.description || "Complete this task to earn a reward."}
          </p>
        </div>
        {task.vip_level_required > 0 && (
          <Badge color={VIP_COLOR[task.vip_level_required] ?? "neutral"} size="sm">
            <Star className="w-3 h-3" />
            VIP {task.vip_level_required}
          </Badge>
        )}
      </div>

      {/* Reward + limit row */}
      <div className="flex items-center gap-3 text-sm">
        <div className="flex items-center gap-1.5 font-semibold text-emerald-400">
          <DollarSign className="w-4 h-4 shrink-0" />
          {fmtAmount(task.reward_amount)} USDT
        </div>
        <span className="text-(--border-hover)">·</span>
        <div className="flex items-center gap-1.5 theme-text-muted">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          {exhausted
            ? "Daily limit reached"
            : `${remaining} of ${task.daily_limit} left today`}
        </div>
      </div>

      {/* Action */}
      <Button
        size="sm"
        variant={exhausted ? "secondary" : "primary"}
        disabled={exhausted}
        iconRight={exhausted ? undefined : ChevronRight}
        className="w-full"
        onClick={() => !exhausted && onStart(task)}
      >
        {exhausted ? "Completed for today" : "Start Task"}
      </Button>
    </div>
  );
}

// ─── Success overlay ───────────────────────────────────────────────────────

function SuccessOverlay({ amount, onDone }) {
  return (
    <div className="flex flex-col items-center gap-5 py-4 text-center">
      {/* Animated check */}
      <div className="relative">
        <div className="w-20 h-20 rounded-full bg-emerald-500/15 flex items-center justify-center animate-scale-in">
          <CheckCircle2 className="w-10 h-10 text-emerald-400" />
        </div>
        {/* Sparkle ring */}
        <div className="absolute inset-0 rounded-full border-2 border-emerald-400/30 animate-ping" />
      </div>

      <div>
        <p className="text-2xl font-bold theme-text">Task Submitted!</p>
        <p className="text-base theme-text-secondary mt-1">
          Your submission is under review.
        </p>
        <p className="text-sm theme-text-muted mt-2">
          Once approved,{" "}
          <span className="text-emerald-400 font-semibold">
            +${fmtAmount(amount)} USDT
          </span>{" "}
          will be credited to your wallet.
        </p>
      </div>

      <Button onClick={onDone} className="w-full">
        Back to Tasks
      </Button>
    </div>
  );
}

// ─── Main component ────────────────────────────────────────────────────────

export default function TaskCenterPage() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [completionMap, setCompletionMap] = useState({}); // taskId → today's count
  const [loading, setLoading] = useState(true);

  // Modal state
  const [selectedTask, setSelectedTask] = useState(null);
  const [modalPhase, setModalPhase] = useState("instructions"); // "instructions" | "success"
  const [submitting, setSubmitting] = useState(false);
  const [earnedAmount, setEarnedAmount] = useState(0);

  // ── Fetch tasks + today's completions ────────────────────────────────────

  const loadData = useCallback(async () => {
    try {
      const [tasksRes, myRes] = await Promise.all([
        axiosInstance.get("/tasks/"),
        axiosInstance.get("/tasks/my-completions/"),
      ]);

      const taskList = tasksRes.data.results ?? tasksRes.data;
      setTasks(taskList);

      // Build a map: taskId → count of non-rejected completions today
      const today = new Date().toISOString().slice(0, 10);
      const map = {};
      const completions = myRes.data.results ?? myRes.data;
      for (const c of completions) {
        if (c.status === "rejected") continue;
        if (!c.created_at.startsWith(today)) continue;
        map[c.task] = (map[c.task] ?? 0) + 1;
      }
      setCompletionMap(map);
    } catch {
      // Leave existing state
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleStart = (task) => {
    setSelectedTask(task);
    setModalPhase("instructions");
    setSubmitting(false);
  };

  const handleCloseModal = () => {
    if (submitting) return;
    setSelectedTask(null);
    setModalPhase("instructions");
  };

  const handleSubmit = async () => {
    if (!selectedTask) return;
    setSubmitting(true);
    try {
      const res = await axiosInstance.post("/tasks/submit/", {
        task_id: selectedTask.id,
      });

      const reward = res.data.task_reward ?? selectedTask.reward_amount;
      setEarnedAmount(reward);
      setModalPhase("success");

      // Increment today's count in map so the card shows "Completed" immediately
      setCompletionMap((prev) => ({
        ...prev,
        [selectedTask.id]: (prev[selectedTask.id] ?? 0) + 1,
      }));

      // NOTE: balance is NOT updated here — it only changes after admin approves.
      // The user will see the updated balance on their next wallet page refresh.

      toast.success(`Task submitted — pending admin review!`, {
        duration: 4000,
        icon: "🎉",
      });
    } catch (err) {
      const detail = err.response?.data?.detail;
      if (err.response?.status === 429) {
        toast.error(detail || "Daily limit reached for this task.");
        handleCloseModal();
        loadData(); // re-sync completion map
      } else {
        toast.error(detail || "Submission failed. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleSuccessDone = () => {
    setSelectedTask(null);
    setModalPhase("instructions");
  };

  // ── Render ────────────────────────────────────────────────────────────────

  const vipLevel = user?.vip_level ?? 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-8 animate-fade-in-up">
        <div>
          <h1 className="text-2xl font-bold theme-text flex items-center gap-2">
            <ListChecks className="w-6 h-6 text-primary-400 shrink-0" />
            Task Center
          </h1>
          <p className="text-sm theme-text-secondary mt-0.5">
            Complete tasks to earn USDT rewards.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm theme-text-muted">
          <Zap className="w-4 h-4 text-amber-400" />
          Your VIP level:{" "}
          <Badge color={VIP_COLOR[vipLevel] ?? "neutral"} size="sm" className="ml-1">
            {vipLevel === 0 ? "Regular" : `VIP ${vipLevel}`}
          </Badge>
        </div>
      </div>

      {/* Task grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="card rounded-2xl p-5 animate-pulse h-44" />
          ))}
        </div>
      ) : tasks.length === 0 ? (
        <div className="card rounded-2xl p-12 text-center animate-fade-in-up">
          <ListChecks className="w-12 h-12 theme-text-muted mx-auto mb-4 opacity-40" />
          <p className="text-base font-medium theme-text">No tasks available</p>
          <p className="text-sm theme-text-muted mt-1">
            Check back later or upgrade your VIP level for more tasks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tasks.map((task, i) => (
            <div key={task.id} style={{ animationDelay: `${i * 60}ms` }}>
              <TaskCard
                task={task}
                completionMap={completionMap}
                onStart={handleStart}
              />
            </div>
          ))}
        </div>
      )}

      {/* Task instructions + submit modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={handleCloseModal}
        title={modalPhase === "success" ? undefined : selectedTask?.title}
        size="md"
      >
        {selectedTask && modalPhase === "success" ? (
          <SuccessOverlay amount={earnedAmount} onDone={handleSuccessDone} />
        ) : selectedTask ? (
          <div className="space-y-5">
            {/* Reward callout */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
              <DollarSign className="w-5 h-5 text-emerald-400 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-400">
                  Reward: {fmtAmount(selectedTask.reward_amount)} USDT
                </p>
                <p className="text-xs theme-text-muted mt-0.5">
                  Credited after admin review
                </p>
              </div>
            </div>

            {/* Description */}
            {selectedTask.description && (
              <div>
                <p className="text-xs font-semibold theme-text-muted uppercase tracking-wider mb-2">
                  About this task
                </p>
                <p className="text-sm theme-text leading-relaxed">
                  {selectedTask.description}
                </p>
              </div>
            )}

            {/* Instructions */}
            {selectedTask.instructions ? (
              <div>
                <p className="text-xs font-semibold theme-text-muted uppercase tracking-wider mb-2">
                  Instructions
                </p>
                <div className="text-sm theme-text leading-relaxed whitespace-pre-line bg-(--bg-input) rounded-xl p-4 border theme-border">
                  {selectedTask.instructions}
                </div>
              </div>
            ) : (
              <div className="text-sm theme-text-muted text-center py-2">
                No specific instructions. Complete the task and submit.
              </div>
            )}

            {/* Daily limit info */}
            <p className="text-xs theme-text-muted text-center">
              Daily limit: {selectedTask.daily_limit} completion
              {selectedTask.daily_limit !== 1 ? "s" : ""} per day
            </p>

            {/* Submit button */}
            <Button
              className="w-full"
              loading={submitting}
              icon={CheckCircle2}
              onClick={handleSubmit}
            >
              {submitting ? "Submitting…" : "Submit Task"}
            </Button>
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
