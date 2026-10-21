import { PageHeader } from "@/components/app-layout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Lock, Clock, Sparkles, ArrowRight, Zap, BookOpen, Code2, Server, Brain, Globe, Cpu } from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth, supabaseBrowser } from "@/hooks/use-auth";
import { LEARNING_PATHS } from "@/routes/onboarding";
import { toast } from "sonner";

export const Route = createFileRoute("/_app/learning-paths")({ component: LearningPaths });

const topicsByPath: Record<string, Array<{ name: string; diff: string; time: string; icon: any; problemId?: number }>> = {
  "FAANG Full Prep": [
    { name: "Arrays & Hashing", diff: "Easy", time: "8h", icon: Code2, problemId: 1 },
    { name: "Two Pointers", diff: "Easy", time: "6h", icon: Code2, problemId: 4 },
    { name: "Sliding Window", diff: "Medium", time: "10h", icon: Code2, problemId: 4 },
    { name: "Stack & Queues", diff: "Medium", time: "12h", icon: Code2, problemId: 9 },
    { name: "Binary Search", diff: "Medium", time: "10h", icon: Code2, problemId: 3 },
    { name: "Linked Lists", diff: "Medium", time: "8h", icon: Code2, problemId: 8 },
    { name: "Trees & BST", diff: "Hard", time: "16h", icon: Brain, problemId: 10 },
    { name: "Graphs", diff: "Hard", time: "20h", icon: Brain, problemId: 10 },
    { name: "Dynamic Programming", diff: "Hard", time: "24h", icon: Brain, problemId: 5 },
    { name: "System Design", diff: "Expert", time: "20h", icon: Server },
  ],
  "DSA Intensive": [
    { name: "Arrays & Hashing", diff: "Easy", time: "8h", icon: Code2, problemId: 1 },
    { name: "Two Pointers", diff: "Easy", time: "6h", icon: Code2, problemId: 4 },
    { name: "Binary Search", diff: "Medium", time: "10h", icon: Code2, problemId: 3 },
    { name: "Trees & BST", diff: "Hard", time: "16h", icon: Brain, problemId: 10 },
    { name: "Graphs", diff: "Hard", time: "20h", icon: Brain, problemId: 10 },
    { name: "Dynamic Programming", diff: "Hard", time: "24h", icon: Brain, problemId: 5 },
  ],
  "System Design Pro": [
    { name: "High Level Architecture", diff: "Medium", time: "12h", icon: Server },
    { name: "Database Scaling & Sharding", diff: "Hard", time: "16h", icon: Server },
    { name: "Caching & CDN", diff: "Medium", time: "10h", icon: Server },
    { name: "Load Balancers & Gateways", diff: "Medium", time: "8h", icon: Server },
    { name: "Distributed Messaging & Queues", diff: "Hard", time: "14h", icon: Server },
  ],
  "Full Stack Dev": [
    { name: "Frontend & React", diff: "Medium", time: "15h", icon: Globe },
    { name: "Node.js & API Design", diff: "Medium", time: "15h", icon: Server },
    { name: "SQL & NoSQL Databases", diff: "Medium", time: "12h", icon: Server },
    { name: "CI/CD & Deployment", diff: "Hard", time: "10h", icon: Globe },
  ],
  "AI/ML Engineer": [
    { name: "Python for Data Science", diff: "Easy", time: "10h", icon: Cpu },
    { name: "Linear Algebra & Probability", diff: "Medium", time: "14h", icon: Cpu },
    { name: "Classical ML Algorithms", diff: "Medium", time: "18h", icon: Brain },
    { name: "Deep Learning & Neural Nets", diff: "Hard", time: "25h", icon: Brain },
    { name: "LLMs & RAG Architectures", diff: "Hard", time: "20h", icon: Brain },
  ],
};

const diffColors: Record<string, string> = {
  Easy: "border-emerald-brand/40 text-emerald-brand",
  Medium: "border-amber-500/40 text-amber-600 dark:text-amber-400",
  Hard: "border-destructive/40 text-destructive",
  Expert: "border-purple-500/40 text-purple-500",
};

function LearningPaths() {
  const { user } = useAuth();
  const [activePath, setActivePath] = useState("FAANG Full Prep");
  const [solvedCount, setSolvedCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabaseBrowser
      .from("profiles")
      .select("learning_path")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.learning_path) setActivePath(data.learning_path);
      });

    supabaseBrowser
      .from("user_problem_status")
      .select("problem_id", { count: "exact" })
      .eq("user_id", user.id)
      .eq("solved", true)
      .then(({ count }) => {
        setSolvedCount(count ?? 0);
      });
  }, [user]);

  const selectPath = async (name: string) => {
    setActivePath(name);
    if (user) {
      const { error } = await supabaseBrowser
        .from("profiles")
        .upsert({ id: user.id, learning_path: name });
      if (error) {
        toast.error(error.message || "Failed to switch path.");
      } else {
        toast.success(`Switched active path to ${name}!`);
      }
    }
  };

  const currentTopics = topicsByPath[activePath] ?? topicsByPath["FAANG Full Prep"];
  const totalTopics = currentTopics.length;

  return (
    <div className="space-y-6">
      <PageHeader title="Learning Paths" description="Your adaptive roadmap to becoming interview-ready.">
        <Button className="bg-gradient-primary shadow-elegant rounded-xl gap-2" asChild>
          <Link to="/practice"><Zap className="h-4 w-4" /> Start Practice</Link>
        </Button>
      </PageHeader>

      {/* Path selector */}
      <div className="grid gap-4 md:grid-cols-3">
        {LEARNING_PATHS.map((p) => {
          const isActive = activePath === p.id;
          const Icon = p.icon;
          return (
            <Card
              key={p.id}
              onClick={() => selectPath(p.id)}
              className={`relative overflow-hidden border p-5 shadow-soft transition-all cursor-pointer hover:-translate-y-0.5 hover:shadow-elegant ${
                isActive ? "border-primary/50 bg-primary/5 ring-2 ring-primary/20" : "border-border/40"
              }`}
            >
              {isActive && (
                <Badge className="absolute top-3 right-3 bg-gradient-primary text-[10px]">Active</Badge>
              )}
              <div className="flex items-center gap-3 mb-3">
                <div className={`grid h-10 w-10 place-items-center rounded-xl ${p.bg}`}>
                  <Icon className={`h-5 w-5 ${p.color}`} />
                </div>
                <div>
                  <h3 className="font-bold">{p.label}</h3>
                  <span className="text-xs text-muted-foreground">{p.weeks} weeks program</span>
                </div>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.desc}</p>
            </Card>
          );
        })}
      </div>

      {/* Active Roadmap */}
      <Card className="border-border/40 p-6 shadow-soft">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <Badge className="mb-2 bg-gradient-primary text-white">Roadmap</Badge>
            <h2 className="text-xl font-bold">{activePath} Curriculum</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Master topics sequentially to unlock next levels</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-muted-foreground">Overall Solved</span>
              <div className="text-lg font-black">{solvedCount} problems</div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {currentTopics.map((topic, i) => {
            const Icon = topic.icon;
            // First 2 topics open, others unlocked based on solvedCount
            const isUnlocked = i <= Math.min(Math.floor(solvedCount / 2) + 1, currentTopics.length - 1);
            const isDone = i < Math.floor(solvedCount / 2);

            return (
              <div
                key={topic.name}
                className={`flex items-center gap-4 rounded-xl border p-4 transition-all ${
                  isDone
                    ? "border-emerald-brand/30 bg-emerald-brand/5"
                    : isUnlocked
                    ? "border-primary/30 bg-card hover:border-primary/60 shadow-soft"
                    : "border-border/30 bg-muted/20 opacity-60"
                }`}
              >
                <div className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${
                  isDone ? "bg-emerald-brand/10 text-emerald-brand" : isUnlocked ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
                }`}>
                  {isDone ? <CheckCircle2 className="h-5 w-5" /> : isUnlocked ? <Icon className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-sm">{topic.name}</span>
                    <Badge variant="outline" className={`text-[10px] ${diffColors[topic.diff]}`}>{topic.diff}</Badge>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> Est. {topic.time}</span>
                  </div>
                </div>

                <div>
                  {isDone ? (
                    <Badge className="bg-emerald-brand/15 text-emerald-brand hover:bg-emerald-brand/20 border-emerald-brand/30">Completed</Badge>
                  ) : isUnlocked ? (
                    <Button size="sm" className="rounded-xl bg-gradient-primary gap-1" asChild>
                      <Link to="/practice" search={topic.problemId ? { id: topic.problemId } : { topic: topic.name }}>
                        Start <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  ) : (
                    <Badge variant="outline" className="text-muted-foreground">Locked</Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
