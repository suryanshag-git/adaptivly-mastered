// src/server-actions/adaptive-dashboard.ts
// Server function that generates adaptive recommendations for the dashboard.
// Uses createServerFn so it always runs on the server — never bundled into client code.

import { createServerFn } from '@tanstack/react-start';
import { z } from 'zod';

const tokenSchema = z.object({ token: z.string() });

/** Returns weak topics, revision topic, flashcard deck, quiz topic, and today's learning step. */
export const getAdaptiveRecommendations = createServerFn({ method: 'GET' })
  .validator((data: unknown) => tokenSchema.parse(data))
  .handler(async ({ data }) => {
    const { requireUserId } = await import('@/server/auth');
    const { supabase } = await import('@/server/db');

    const userId = await requireUserId(data.token);

    // ── Fetch all user submissions with topic + difficulty ────────────────────
    const { data: subs } = await supabase
      .from('submissions')
      .select('status, runtime_ms, created_at, problems(topic, difficulty)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // ── Aggregate by topic ────────────────────────────────────────────────────
    const topicMap: Record<string, { total: number; accepted: number; lastDate: string }> = {};
    for (const s of subs ?? []) {
      const topic = (s as any).problems?.topic ?? 'General';
      if (!topicMap[topic]) topicMap[topic] = { total: 0, accepted: 0, lastDate: s.created_at };
      topicMap[topic].total++;
      if (s.status === 'Accepted') topicMap[topic].accepted++;
    }

    // ── Weak topics (<60% accuracy, at least 1 attempt) ──────────────────────
    const weakTopics = Object.entries(topicMap)
      .map(([name, v]) => ({ name, score: Math.round((v.accepted / v.total) * 100) }))
      .filter(t => t.score < 60)
      .sort((a, b) => a.score - b.score)
      .slice(0, 3);

    // ── Spaced-revision topic (longest since last practice) ───────────────────
    const revisionEntry = Object.entries(topicMap)
      .filter(([, v]) => v.total > 0)
      .sort(([, a], [, b]) => new Date(a.lastDate).getTime() - new Date(b.lastDate).getTime())[0];

    const revisionTopic = revisionEntry?.[0] ?? 'Dynamic Programming';
    const revisionDays = revisionEntry
      ? Math.floor((Date.now() - new Date(revisionEntry[1].lastDate).getTime()) / 86400000)
      : 7;

    // ── Recommended next problem topic (weakest area) ─────────────────────────
    const focusTopic = weakTopics[0]?.name ?? revisionTopic;

    // ── Today's learning step ─────────────────────────────────────────────────
    const pathMap: Record<string, string> = {
      Arrays: '/practice',
      Graphs: '/practice',
      'Dynamic Programming': '/practice',
      'System Design': '/subjects',
      Web: '/subjects',
      ML: '/subjects',
    };

    const todaysLearning = {
      topic: `Practice: ${focusTopic}`,
      path: pathMap[focusTopic] ?? '/practice',
    };

    const todaysRevision = {
      topic: revisionTopic,
      daysSinceReview: revisionDays,
      path: '/practice',
      actionLabel: `Review ${revisionTopic} →`,
    };

    const todaysFlashcards = {
      deckName: `${focusTopic} Flashcards`,
      cardCount: 10,
      path: '/flashcards',
    };

    const todaysQuiz = {
      topic: focusTopic,
      path: '/assessment',
    };

    return { weakTopics, todaysLearning, todaysRevision, todaysFlashcards, todaysQuiz };
  });

// Alias kept for backwards compat with any old imports
export const getAdaptiveRecommendation = getAdaptiveRecommendations;
