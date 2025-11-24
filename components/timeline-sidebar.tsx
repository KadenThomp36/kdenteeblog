"use client";

import { useEffect, useState, useRef } from "react";
import {
  format,
  eachDayOfInterval,
  startOfYear,
  endOfYear,
  isSameDay,
} from "date-fns";

interface Post {
  id: string;
  title: string;
  slug: string;
  createdAt: string;
  eventDate: string | null;
}

interface DayActivity {
  date: Date;
  count: number;
  posts: Post[];
}

export function TimelineSidebar() {
  const [activities, setActivities] = useState<DayActivity[]>([]);
  const [hoveredDay, setHoveredDay] = useState<DayActivity | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchTimeline();
  }, []);

  const fetchTimeline = async () => {
    try {
      const response = await fetch("/api/timeline");
      if (response.ok) {
        const posts: Post[] = await response.json();

        if (posts.length === 0) {
          setIsLoading(false);
          return;
        }

        // Get date range
        const dates = posts.map((p) => new Date(p.eventDate || p.createdAt));
        const minDate = startOfYear(
          new Date(Math.min(...dates.map((d) => d.getTime()))),
        );
        const maxDate = endOfYear(
          new Date(Math.max(...dates.map((d) => d.getTime()))),
        );

        // Create day buckets
        const allDays = eachDayOfInterval({ start: minDate, end: maxDate });
        const dayMap = new Map<string, DayActivity>();

        allDays.forEach((date) => {
          dayMap.set(format(date, "yyyy-MM-dd"), {
            date,
            count: 0,
            posts: [],
          });
        });

        // Fill in posts
        posts.forEach((post) => {
          const date = new Date(post.eventDate || post.createdAt);
          const key = format(date, "yyyy-MM-dd");
          const day = dayMap.get(key);
          if (day) {
            day.count++;
            day.posts.push(post);
          }
        });

        setActivities(Array.from(dayMap.values()));
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading || activities.length === 0) return null;

  const maxCount = Math.max(...activities.map((a) => a.count), 1);
  const containerHeight = activities.length * 2; // 2px per day

  return (
    <>
      {/* Timeline Sidebar */}
      <div
        ref={containerRef}
        className="fixed right-8 top-24 w-24 h-[calc(100vh-12rem)] hidden lg:flex flex-col items-center opacity-60 hover:opacity-100 transition-opacity duration-300"
      >
        {/* Vertical center line */}
        <div className="relative w-full h-full flex items-center justify-center">
          <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-transparent via-border to-transparent" />

          {/* Scrollable activity bars */}
          <div className="relative w-full h-full overflow-y-auto scrollbar-thin">
            <div
              style={{ height: `${containerHeight}px` }}
              className="relative"
            >
              {activities.map((activity, index) => {
                const barWidth =
                  activity.count > 0
                    ? 8 + (activity.count / maxCount) * 40 // 8px to 48px
                    : 0;
                const opacity =
                  activity.count > 0
                    ? 0.3 + (activity.count / maxCount) * 0.7
                    : 0;

                return (
                  <div
                    key={format(activity.date, "yyyy-MM-dd")}
                    className="absolute left-1/2 -translate-x-1/2 group cursor-pointer"
                    style={{
                      top: `${index * 2}px`,
                      height: "2px",
                    }}
                    onMouseEnter={() => setHoveredDay(activity)}
                    onMouseLeave={() => setHoveredDay(null)}
                  >
                    {activity.count > 0 && (
                      <>
                        {/* Left bar */}
                        <div
                          className="absolute right-0 top-0 h-full bg-primary transition-all duration-200 group-hover:bg-primary/80"
                          style={{
                            width: `${barWidth / 2}px`,
                            opacity,
                          }}
                        />
                        {/* Right bar */}
                        <div
                          className="absolute left-0 top-0 h-full bg-primary transition-all duration-200 group-hover:bg-primary/80"
                          style={{
                            width: `${barWidth / 2}px`,
                            opacity,
                          }}
                        />
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Month markers */}
          <div className="absolute left-full ml-2 top-0 bottom-0 pointer-events-none">
            {activities
              .filter((a, i) => {
                if (i === 0) return true;
                return (
                  format(a.date, "MM") !== format(activities[i - 1].date, "MM")
                );
              })
              .map((activity, index) => {
                const dayIndex = activities.findIndex(
                  (a) =>
                    format(a.date, "yyyy-MM-dd") ===
                    format(activity.date, "yyyy-MM-dd"),
                );
                return (
                  <div
                    key={format(activity.date, "yyyy-MM")}
                    className="absolute text-[10px] text-muted-foreground whitespace-nowrap"
                    style={{ top: `${dayIndex * 2}px` }}
                  >
                    {format(activity.date, "MMM yy")}
                  </div>
                );
              })}
          </div>
        </div>
      </div>

      {/* Hover tooltip */}
      {hoveredDay && hoveredDay.count > 0 && (
        <div className="fixed right-36 top-1/2 -translate-y-1/2 z-50 animate-in fade-in-0 zoom-in-95 slide-in-from-right-5 duration-200">
          <div className="bg-popover/95 backdrop-blur-sm border-2 border-border rounded-lg p-3 shadow-lg max-w-xs">
            <div className="font-semibold text-sm mb-2">
              {format(hoveredDay.date, "MMMM d, yyyy")}
            </div>
            <div className="text-xs text-muted-foreground mb-2">
              {hoveredDay.count} {hoveredDay.count === 1 ? "post" : "posts"}
            </div>
            <div className="space-y-1 max-h-32 overflow-y-auto scrollbar-thin">
              {hoveredDay.posts.map((post) => (
                <a
                  key={post.id}
                  href={`/posts/${post.slug}`}
                  className="block text-xs hover:text-primary transition-colors line-clamp-2"
                >
                  • {post.title}
                </a>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
