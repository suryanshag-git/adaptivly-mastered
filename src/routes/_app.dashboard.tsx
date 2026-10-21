import { PageHeader, StatCard } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { getAdaptiveRecommendations } from "@/server-actions/adaptive-dashboard";
import {
  Flame, Trophy, Award, Clock, Target, CheckCircle2,
  ArrowRight, Play, Code2, Bot, Sparkles, Coins, Zap, BookOpen, Layers, Activity, FileQuestion, Video, HelpCircle, ChevronRight, Loader2
} from "lucide-react";
import { ResponsiveContainer, RadialBarChart, RadialBar, PolarAngleAxis, AreaChart, Area, XAxis, Tooltip } from "recharts";
import { useAuth, supabaseBrowser } from "@/hooks/use-auth";
import { useEffect, useState } from "react";

export const Route = createFileRoute("/_app/dashboard")({ component: Dashboard });

/* ─── Types ──────────────────────────────────────────────────────────────── */
interface ProfileData {
  full_name: string;
  streak: number;
  xp: number;
  coins: number;
  daily_goal: number;
  learning_path: string;
  onboarding_done: boolean;
}

interface DashboardData {
  profile: ProfileData | null;
  badgeCount: number;
  todaySolved: number;
  totalSolved: number;
  todayTasks: Array<{ id: string; title: string; tag: string; done: boolean }>;
  weekData: Array<{ day: string; problems: number }>;
}

/* ─── Heatmap ─────────────────────────────────────────────────────────────── */
function Heatmap({ data }: { data: number[] }) {
  const shades = [
    "bg-muted/40",
    "bg-primary/20",
    "bg-primary/40",
    "bg-primary/65",
    "bg-primary/90",
  ];
  const vals = data.length >= 140 ? data.slice(-140) : [...Array(140 - data.length).fill(0), ...data];
  return (
    <div className="grid grid-flow-col grid-rows-7 gap-1">
      {vals.map((v, i) => (
        <div
          key={i}
          title={`${v} problems`}
          className={`h-3 w-3 rounded-sm ${shades[Math.min(v, 4)]} transition-transform hover:scale-125 cursor-pointer`}
        />
      ))}
    </div>
  );
}

/* ─── Dashboard ──────────────────────────────────────────────────────────── */
function Dashboard() {
  const { user, token } = useAuth();
  const navigate = useNavigate();

  const { data: recs, isLoading: recsLoading } = useQuery({
    queryKey: ["adaptive_recommendations"],
    queryFn: async () => {
      if (!token) return null;
      return getAdaptiveRecommendations({ data: { token } });
    },
    enabled: !!token,
  });

  const [data, setData] = useState<DashboardData>({
    profile: null,
    badgeCount: 0,
    todaySolved: 0,
    totalSolved: 0,
    todayTasks: [],
    weekData: ["M", "T", "W", "T", "F", "S", "S"].map(day => ({ day, problems: 0 })),
  });
  const [heatmap, setHeatmap] = useState<number[]>(Array(140).fill(0));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    async function load() {
      try {
        const today = new Date().toISOString().split("T")[0];
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const tenWeeksAgo = new Date(Date.now() - 70 * 86400000).toISOString();

        const [profileRes, badgesRes, todaySubsRes, totalSubsRes, tasksRes, weekSubsRes] =
          await Promise.all([
            supabaseBrowser.from("profiles").select("*").eq("id", user!.id).maybeSingle(),
            supabaseBrowser.from("user_achievements").select("id", { count: "exact" }).eq("user_id", user!.id),
            supabaseBrowser.from("submissions").select("id", { count: "exact" })
              .eq("user_id", user!.id).gte("submitted_at", today),
            supabaseBrowser.from("user_problem_status").select("problem_id", { count: "exact" })
              .eq("user_id", user!.id).eq("solved", true),
            supabaseBrowser.from("planner_tasks").select("*")
              .eq("user_id", user!.id).gte("scheduled_at", today).lte("scheduled_at", today + "T23:59:59"),
            supabaseBrowser.from("submissions").select("submitted_at")
              .eq("user_id", user!.id).gte("submitted_at", weekAgo),
          ]);

        // Build week data
        const days = ["S", "M", "T", "W", "T", "F", "S"];
        const weekMap: Record<string, number> = {};
        (weekSubsRes.data ?? []).forEach((s: any) => {
          const d = new Date(s.submitted_at).getDay();
          weekMap[d] = (weekMap[d] ?? 0) + 1;
        });
        const weekData = Array.from({ length: 7 }, (_, i) => {
          const dayIdx = (new Date().getDay() - 6 + i + 7) % 7;
          return { day: days[dayIdx], problems: weekMap[dayIdx] ?? 0 };
        });

        // Build simple heatmap from total submissions (show 0-4 per day)
        const heatData = Array(140).fill(0);
        const heatRes = await supabaseBrowser.from("submissions")
          .select("submitted_at").eq("user_id", user!.id).gte("submitted_at", tenWeeksAgo);
        (heatRes.data ?? []).forEach((s: any) => {
          const diff = Math.floor((Date.now() - new Date(s.submitted_at).getTime()) / 86400000);
          if (diff < 140) heatData[139 - diff] = Math.min((heatData[139 - diff] ?? 0) + 1, 4);
        });
        setHeatmap(heatData);

        setData({
          profile: profileRes.data as ProfileData | null,
          badgeCount: badgesRes.count ?? 0,
          todaySolved: todaySubsRes.count ?? 0,
          totalSolved: totalSubsRes.count ?? 0,
          todayTasks: (tasksRes.data ?? []).map((t: any) => ({
            id: t.id, title: t.title, tag: t.tag ?? "Task", done: t.done,
          })),
          weekData,
        });
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [user]);

  const { profile, badgeCount, todaySolved, totalSolved, todayTasks, weekData } = data;
  const dailyGoal = profile?.daily_goal ?? 5;
  const goalPct = Math.min(Math.round((todaySolved / dailyGoal) * 100), 100);
  const firstName = profile?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "there";
  const xpDisplay = profile ? (profile.xp >= 1000 ? `${(profile.xp / 1000).toFixed(1)}K` : String(profile.xp)) : "0";

  const toggleTask = async (id: string, done: boolean) => {
    await supabaseBrowser.from("planner_tasks").update({ done: !done }).eq("id", id);
    setData(prev => ({
      ...prev,
      todayTasks: prev.todayTasks.map(t => t.id === id ? { ...t, done: !t.done } : t),
    }));
  };

  const completedTasksCount = todayTasks.filter(t => t.done).length;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Welcome back, ${firstName} 👋`}
        description={
          profile?.streak
            ? `You're on a ${profile.streak}-day streak. Keep your momentum going today.`
            : "Your adaptive learning path is ready — solve your first problem today!"
        }
      >
        <div className="flex items-center gap-2.5">
          {profile?.streak ? (
            <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-500 dark:text-amber-400 gap-1.5 px-3 py-1 font-mono text-xs">
              <Flame className="h-3.5 w-3.5 text-amber-500 animate-pulse" /> {profile.streak} Day Streak
            </Badge>
          ) : null}
          <Button className="bg-gradient-primary shadow-elegant rounded-xl gap-2 font-semibold text-xs h-9 px-4" asChild>
            <Link to="/practice"><Play className="h-3.5 w-3.5" /> Continue Session</Link>
          </Button>
        </div>
      </PageHeader>

      {/* ── BENTO ROW 1: Hero Command Center (8 cols) + Telemetry Pillar (4 cols) ── */}
      <div className="grid gap-5 lg:grid-cols-12 items-stretch">
        {/* Dominant Hero Command Tile */}
        <div className="lg:col-span-8 rounded-3xl border border-border/60 bg-card/90 backdrop-blur-md p-7 md:p-8 shadow-soft relative overflow-hidden flex flex-col justify-between transition-all hover:shadow-elegant">
          {/* Subtle top edge starlight rim and corner ambient glow */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.07] via-transparent to-transparent pointer-events-none" />
          <div className="absolute -top-24 -left-24 h-56 w-56 rounded-full blur-3xl opacity-20 bg-primary pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="max-w-xl space-y-3">
              <div className="flex items-center gap-2">
                <Badge className="border-primary/20 bg-primary/10 text-primary gap-1 text-[11px] font-mono tracking-wide uppercase px-2.5 py-0.5">
                  <Sparkles className="h-3 w-3" /> Focus Milestone
                </Badge>
                <span className="text-xs text-muted-foreground font-mono">
                  Track: {profile?.learning_path ?? "DSA Master"}
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-extrabold tracking-tight font-display text-foreground">
                {goalPct >= 100
                  ? "🎉 Daily Target Conquered!"
                  : `You're ${goalPct}% through today's target`}
              </h2>

              <p className="text-sm text-muted-foreground leading-relaxed">
                {goalPct >= 100
                  ? `Incredible work. You've solved ${todaySolved} problems today and secured your daily XP bonus.`
                  : `Solve ${Math.max(dailyGoal - todaySolved, 0)} more problem${dailyGoal - todaySolved !== 1 ? "s" : ""} to complete today's target of ${dailyGoal} problems.`}
              </p>

              {/* Progress bar and numeric readout */}
              <div className="pt-2 max-w-md space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="font-semibold text-foreground">{todaySolved} / {dailyGoal} Problems Completed</span>
                  <span className="font-bold text-primary">{goalPct}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-primary transition-all duration-500 shadow-glow"
                    style={{ width: `${goalPct}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Radial progress ring */}
            <div className="relative h-32 w-32 shrink-0 grid place-items-center self-center md:self-auto">
              <ResponsiveContainer width="100%" height="100%">
                <RadialBarChart innerRadius="74%" outerRadius="100%" data={[{ v: goalPct }]} startAngle={90} endAngle={-270}>
                  <PolarAngleAxis type="number" domain={[0, 100]} tick={false} />
                  <RadialBar dataKey="v" cornerRadius={12} fill="var(--primary)" background={{ fill: "color-mix(in oklab, var(--card) 40%, var(--muted))" }} />
                </RadialBarChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-lg font-black font-display tracking-tight text-foreground">{goalPct}%</span>
                <span className="text-[10px] uppercase font-mono text-muted-foreground tracking-wider">Goal</span>
              </div>
            </div>
          </div>

          {/* Quick Launcher strip */}
          {recs?.todaysLearning && (
            <div className="relative z-10 mt-6 pt-5 border-t border-border/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                  <BookOpen className="h-4 w-4 text-primary" />
                </div>
                <div className="truncate">
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-wider">Recommended Next Step</div>
                  <div className="text-xs font-bold text-foreground truncate">{recs.todaysLearning.topic}</div>
                </div>
              </div>

              <Button size="sm" className="rounded-xl bg-primary text-primary-foreground font-semibold text-xs gap-1.5 shrink-0" asChild>
                <Link to={recs.todaysLearning.path}>
                  <span>Start Module</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          )}
        </div>

        {/* Telemetry Pillar (4 cols) */}
        <div className="lg:col-span-4 flex flex-col gap-3.5 justify-between">
          {/* Streak Feature Tile */}
          <div className="rounded-2xl border border-amber-500/20 bg-card/90 backdrop-blur-sm p-4.5 shadow-soft transition-all duration-200 hover:shadow-elegant hover:border-amber-500/40 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Streak Momentum</span>
              <div className="text-2xl font-extrabold font-display tracking-tight text-foreground flex items-center gap-2">
                <span>{profile?.streak ?? 0}</span>
                <span className="text-xs font-semibold text-muted-foreground font-sans">Days Active</span>
              </div>
              <div className="text-[11px] text-amber-500/90 font-medium flex items-center gap-1">
                <Flame className="h-3 w-3" /> Daily consistency multiplier active
              </div>
            </div>
            <div className="h-11 w-11 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0 text-amber-500">
              <Flame className="h-6 w-6" />
            </div>
          </div>

          {/* XP Tile */}
          <div className="rounded-2xl border border-border/40 bg-card/90 backdrop-blur-sm p-4.5 shadow-soft transition-all duration-200 hover:shadow-elegant hover:border-primary/30 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-widest font-mono">Accumulated Mastery</span>
              <div className="text-2xl font-extrabold font-display tracking-tight text-foreground flex items-center gap-2">
                <span>{xpDisplay}</span>
                <span className="text-xs font-semibold text-muted-foreground font-sans">XP Total</span>
              </div>
              <div className="text-[11px] text-emerald-brand font-medium">↑ Leveling towards Senior Tier</div>
            </div>
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-primary">
              <Trophy className="h-5 w-5" />
            </div>
          </div>

          {/* Coins & Badges Twin Dock */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-2xl border border-border/40 bg-card/90 backdrop-blur-sm p-3.5 shadow-soft flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0 text-yellow-500">
                <Coins className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">Coins</div>
                <div className="text-base font-extrabold font-display leading-tight">{profile?.coins ?? 0}</div>
              </div>
            </div>

            <div className="rounded-2xl border border-border/40 bg-card/90 backdrop-blur-sm p-3.5 shadow-soft flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-emerald-brand/10 flex items-center justify-center shrink-0 text-emerald-brand">
                <Award className="h-4.5 w-4.5" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] uppercase font-mono text-muted-foreground font-semibold">Badges</div>
                <div className="text-base font-extrabold font-display leading-tight">{badgeCount} Earned</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BENTO ROW 2: Adaptive Intelligence Studio (7 cols) + Focused Task Dock (5 cols) ── */}
      <div className="grid gap-5 lg:grid-cols-12 items-stretch">
        {/* Adaptive Intelligence Studio */}
        <div className="lg:col-span-7 rounded-3xl border border-border/50 bg-card/90 backdrop-blur-md p-6 shadow-soft flex flex-col justify-between transition-all hover:shadow-elegant">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                  <Activity className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="font-extrabold font-display text-base tracking-tight text-foreground">Adaptive Intelligence Engine</h3>
                  <p className="text-xs text-muted-foreground">Diagnostics dynamically tailoring your weak spots.</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px] font-mono border-primary/20 text-primary">Live Calibration</Badge>
            </div>

            {recsLoading ? (
              <div className="py-12 flex items-center justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-primary" />
              </div>
            ) : recs ? (
              <div className="grid gap-4 sm:grid-cols-2 pt-4">
                {/* Weak Topics */}
                <div className="rounded-2xl border border-border/40 bg-muted/20 p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-semibold text-muted-foreground uppercase">
                    <span>Weak Areas (&lt;60%)</span>
                    <Award className="h-3.5 w-3.5 text-destructive" />
                  </div>
                  <div className="space-y-2">
                    {recs.weakTopics.map((wt) => (
                      <div key={wt.name} className="space-y-1">
                        <div className="flex justify-between text-xs">
                          <span className="font-semibold text-foreground truncate max-w-[130px]">{wt.name}</span>
                          <span className="font-mono text-destructive font-bold">{wt.score}%</span>
                        </div>
                        <Progress value={wt.score} className="h-1 rounded-full bg-muted" />
                      </div>
                    ))}
                    {recs.weakTopics.length === 0 && (
                      <div className="text-xs text-muted-foreground py-3 text-center">Zero weak topics identified — mastery confirmed!</div>
                    )}
                  </div>
                </div>

                {/* Spaced Revision */}
                <div className="rounded-2xl border border-border/40 bg-muted/20 p-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-mono font-semibold text-muted-foreground uppercase">
                      <span>Memory Retention</span>
                      <Layers className="h-3.5 w-3.5 text-emerald-brand" />
                    </div>
                    <div className="text-sm font-bold text-foreground">{recs.todaysRevision.topic}</div>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                      Review interval due: last practiced {recs.todaysRevision.daysSinceReview} days ago. Retain your neural pathways.
                    </p>
                  </div>

                  <Button size="sm" variant="outline" className="mt-3 w-full rounded-xl text-xs font-semibold" asChild>
                    <Link to={recs.todaysRevision.path}>{recs.todaysRevision.actionLabel}</Link>
                  </Button>
                </div>
              </div>
            ) : null}
          </div>

          {/* Quick Deck Bar */}
          {recs && (
            <div className="mt-5 pt-4 border-t border-border/40 grid grid-cols-2 gap-2.5">
              <Link to={recs.todaysFlashcards.path} className="flex items-center justify-between p-2.5 rounded-xl border border-border/30 hover:bg-muted/30 transition-colors text-xs font-medium">
                <span className="truncate">🗂️ {recs.todaysFlashcards.deckName} ({recs.todaysFlashcards.cardCount})</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </Link>
              <Link to={recs.todaysQuiz.path} className="flex items-center justify-between p-2.5 rounded-xl border border-border/30 hover:bg-muted/30 transition-colors text-xs font-medium">
                <span className="truncate">📝 {recs.todaysQuiz.topic} Quiz</span>
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              </Link>
            </div>
          )}
        </div>

        {/* Focused Task Dock */}
        <div className="lg:col-span-5 rounded-3xl border border-border/50 bg-card/90 backdrop-blur-md p-6 shadow-soft flex flex-col justify-between transition-all hover:shadow-elegant">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-border/40">
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold font-display text-base tracking-tight text-foreground">Today's Agenda</h3>
                <Badge variant="outline" className="font-mono text-[10px]">
                  {completedTasksCount} / {todayTasks.length} Done
                </Badge>
              </div>
              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-primary" asChild>
                <Link to="/planner">Open Planner →</Link>
              </Button>
            </div>

            <div className="pt-3">
              {todayTasks.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center gap-2">
                  <div className="h-10 w-10 rounded-xl bg-muted/40 flex items-center justify-center text-muted-foreground">
                    <Target className="h-5 w-5" />
                  </div>
                  <p className="text-xs text-muted-foreground">All daily goals clear! Add a custom revision task.</p>
                  <Button size="sm" variant="outline" className="rounded-xl text-xs mt-1" asChild>
                    <Link to="/planner">+ Add Agenda Item</Link>
                  </Button>
                </div>
              ) : (
                <div className="space-y-2">
                  {todayTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => toggleTask(t.id, t.done)}
                      className={`w-full flex items-center gap-3 rounded-xl border p-2.5 transition-all text-left ${
                        t.done ? "border-emerald-brand/20 bg-emerald-brand/[0.04]" : "border-border/40 hover:border-primary/30 hover:bg-muted/30"
                      }`}
                    >
                      <CheckCircle2 className={`h-4 w-4 shrink-0 transition-colors ${t.done ? "text-emerald-brand" : "text-muted-foreground/30"}`} />
                      <div className="flex-1 min-w-0">
                        <span className={`text-xs ${t.done ? "text-muted-foreground line-through font-normal" : "font-semibold text-foreground"}`}>{t.title}</span>
                      </div>
                      <Badge variant="outline" className="text-[9px] font-mono shrink-0 uppercase">{t.tag}</Badge>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-border/30 flex items-center justify-between text-xs text-muted-foreground">
            <span className="font-mono">Adaptive scheduling</span>
            <span className="text-emerald-brand font-semibold">SM-2 Spaced Repetition</span>
          </div>
        </div>
      </div>

      {/* ── BENTO ROW 3: Activity Tapestry (8 cols) + Velocity Chart (4 cols) ── */}
      <div className="grid gap-5 lg:grid-cols-12 items-stretch">
        {/* Learning Activity Tapestry */}
        <div className="lg:col-span-8 rounded-3xl border border-border/50 bg-card/90 backdrop-blur-md p-6 shadow-soft transition-all hover:shadow-elegant">
          <div className="flex items-center justify-between mb-5 pb-3 border-b border-border/40">
            <div>
              <h3 className="font-extrabold font-display text-base tracking-tight text-foreground">Activity Tapestry</h3>
              <p className="text-xs text-muted-foreground">20-week submission consistency heatmap.</p>
            </div>
            <Badge variant="outline" className="border-emerald-brand/30 bg-emerald-brand/10 text-emerald-brand font-mono text-xs font-bold">
              {totalSolved} Solved Total
            </Badge>
          </div>

          <div className="overflow-x-auto py-1">
            <Heatmap data={heatmap} />
          </div>

          <div className="mt-4 flex items-center justify-between text-xs text-muted-foreground pt-3 border-t border-border/30">
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <span>Less</span>
              {["bg-muted/40", "bg-primary/20", "bg-primary/40", "bg-primary/65", "bg-primary/90"].map((c, i) => (
                <div key={i} className={`h-2.5 w-2.5 rounded-sm ${c}`} />
              ))}
              <span>More</span>
            </div>
            <span className="font-mono text-[11px]">Calculated from real execution runs</span>
          </div>
        </div>

        {/* Weekly Velocity Gauge & Quick Actions */}
        <div className="lg:col-span-4 rounded-3xl border border-border/50 bg-card/90 backdrop-blur-md p-6 shadow-soft flex flex-col justify-between transition-all hover:shadow-elegant">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-extrabold font-display text-base tracking-tight text-foreground">Weekly Velocity</h3>
                <p className="text-xs text-muted-foreground">Problems completed per day</p>
              </div>
              <Badge variant="outline" className="font-mono text-[10px]">
                {weekData.reduce((s, d) => s + d.problems, 0)} Solved
              </Badge>
            </div>

            <div className="h-28 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={weekData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--primary)" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="var(--primary)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" tick={{ fontSize: 10, fill: "var(--muted-foreground)" }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 12, fontSize: 11 }} />
                  <Area type="monotone" dataKey="problems" stroke="var(--primary)" strokeWidth={2} fill="url(#areaGrad)" dot={{ r: 2.5, fill: "var(--primary)" }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Actions dock */}
          <div className="pt-3 border-t border-border/40 space-y-2">
            {[
              { label: "Interactive Code Practice", icon: Code2, to: "/practice", color: "text-emerald-brand", bg: "bg-emerald-brand/10" },
              { label: "Socratic AI Tutor", icon: Bot, to: "/ai-tutor", color: "text-primary", bg: "bg-primary/10" },
              { label: "Curriculum Tracks", icon: BookOpen, to: "/subjects", color: "text-cyan-400", bg: "bg-cyan-400/10" },
            ].map((a) => (
              <Link
                key={a.to}
                to={a.to}
                className="flex items-center gap-2.5 rounded-xl border border-border/40 p-2 hover:border-primary/40 hover:bg-muted/30 transition-all text-xs font-semibold text-foreground group"
              >
                <div className={`h-7 w-7 rounded-lg ${a.bg} flex items-center justify-center shrink-0`}>
                  <a.icon className={`h-3.5 w-3.5 ${a.color}`} />
                </div>
                <span className="flex-1 truncate">{a.label}</span>
                <ArrowRight className="h-3 w-3 text-muted-foreground group-hover:text-primary transition-transform group-hover:translate-x-0.5" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
