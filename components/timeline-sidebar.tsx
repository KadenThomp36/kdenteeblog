"use client";

import { useEffect, useState } from "react";
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
} from "date-fns";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "lucide-react";

interface Post {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  eventDate: string | null;
}

interface MonthData {
  month: string;
  year: number;
  count: number;
  posts: Post[];
  frequency: number; // 0-1 scale for visualization
}

export function TimelineSidebar() {
  const [timeline, setTimeline] = useState<MonthData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      const response = await fetch("/api/timeline");
      if (response.ok) {
        const data = await response.json();
        setTimeline(data);
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="hidden lg:block fixed right-8 top-24 w-72">
        <Card className="p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-32 bg-muted rounded" />
          </div>
        </Card>
      </div>
    );
  }

  if (timeline.length === 0) return null;

  const maxCount = Math.max(...timeline.map((m) => m.count));

  return (
    <div className="hidden lg:block fixed right-8 top-24 w-72 max-h-[calc(100vh-8rem)] z-40">
      <Card className="overflow-hidden backdrop-blur-sm bg-background/95 border-2">
        <div className="p-6 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-5 w-5 text-primary" />
            <h3 className="font-bold text-lg">Activity Timeline</h3>
          </div>
          <p className="text-xs text-muted-foreground">
            Post frequency over time
          </p>
        </div>

        <div className="overflow-y-auto max-h-[calc(100vh-16rem)] scrollbar-thin scrollbar-thumb-primary/20 scrollbar-track-transparent">
          <div className="p-4 space-y-3">
            {timeline.map((month, index) => {
              const barHeight = (month.count / maxCount) * 100;
              const opacity = 0.3 + month.frequency * 0.7;

              return (
                <div
                  key={`${month.year}-${month.month}`}
                  className="group relative"
                >
                  <div className="flex items-center gap-3">
                    {/* Frequency Bar */}
                    <div className="w-16 h-12 bg-muted rounded-md overflow-hidden relative flex items-end">
                      <div
                        className="w-full bg-gradient-to-t from-primary to-primary/60 transition-all duration-300 group-hover:from-primary/80 group-hover:to-primary/40"
                        style={{
                          height: `${barHeight}%`,
                          opacity: opacity,
                        }}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-bold text-foreground/80 drop-shadow-sm">
                          {month.count}
                        </span>
                      </div>
                    </div>

                    {/* Date and Posts */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="font-semibold text-sm">
                          {month.month}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {month.year}
                        </span>
                      </div>

                      {/* Post Pills */}
                      <div className="flex flex-wrap gap-1">
                        {month.posts.slice(0, 3).map((post) => (
                          <a
                            key={post.id}
                            href={`/posts/${post.slug}`}
                            className="group/post"
                          >
                            <Badge
                              variant="secondary"
                              className="text-[10px] px-1.5 py-0 max-w-[180px] truncate hover:bg-primary/20 transition-colors cursor-pointer"
                            >
                              {post.title}
                            </Badge>
                          </a>
                        ))}
                        {month.posts.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] px-1.5 py-0"
                          >
                            +{month.posts.length - 3}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Hover Tooltip */}
                  <div className="absolute left-0 top-full mt-2 hidden group-hover:block z-50 w-64 animate-in fade-in-0 zoom-in-95">
                    <Card className="p-3 shadow-lg border-2">
                      <div className="font-semibold text-sm mb-2">
                        {month.month} {month.year}
                      </div>
                      <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
                        {month.posts.map((post) => (
                          <a
                            key={post.id}
                            href={`/posts/${post.slug}`}
                            className="block text-xs hover:text-primary transition-colors line-clamp-1"
                          >
                            • {post.title}
                          </a>
                        ))}
                      </div>
                    </Card>
                  </div>

                  {/* Connecting Line */}
                  {index < timeline.length - 1 && (
                    <div className="absolute left-8 top-12 w-px h-3 bg-border" />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom Gradient Fade */}
        <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent pointer-events-none" />
      </Card>
    </div>
  );
}
