"use client";

import { useEffect, useState, useCallback, useRef, KeyboardEvent } from "react";
import { format, eachDayOfInterval, startOfYear, endOfYear } from "date-fns";

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

interface MonthGroup {
  month: string;
  year: string;
  displayName: string;
  startIndex: number;
  endIndex: number;
  postCount: number;
}

export function TimelineSidebar() {
  const [activities, setActivities] = useState<DayActivity[]>([]);
  const [monthGroups, setMonthGroups] = useState<MonthGroup[]>([]);
  const [hoveredMonth, setHoveredMonth] = useState<MonthGroup | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const [viewportTop, setViewportTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(20);
  const [isDragging, setIsDragging] = useState(false);

  const timelineRef = useRef<HTMLDivElement>(null);
  const dragStartY = useRef(0);
  const dragStartViewport = useRef(0);

  useEffect(() => {
    fetchTimeline();
  }, []);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(min-width: 1024px)");

    const updateScrollbar = (e: MediaQueryListEvent | MediaQueryList) => {
      if (e.matches && activities.length > 0) {
        document.documentElement.classList.add("hide-scrollbar");
        document.body.classList.add("hide-scrollbar");
      } else {
        document.documentElement.classList.remove("hide-scrollbar");
        document.body.classList.remove("hide-scrollbar");
      }
    };

    updateScrollbar(mediaQuery);
    mediaQuery.addEventListener("change", updateScrollbar);

    return () => {
      mediaQuery.removeEventListener("change", updateScrollbar);
      document.documentElement.classList.remove("hide-scrollbar");
      document.body.classList.remove("hide-scrollbar");
    };
  }, [activities.length]);

  useEffect(() => {
    const handleScroll = () => {
      if (isDragging) return;

      const scrollTop = window.scrollY;
      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollPercent = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      const viewportPercent =
        (window.innerHeight / document.documentElement.scrollHeight) * 100;

      setViewportTop(Math.min(scrollPercent, 100 - viewportPercent));
      setViewportHeight(Math.max(viewportPercent, 8));
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll, { passive: true });

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [isDragging]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      setIsDragging(true);
      dragStartY.current = e.clientY;
      dragStartViewport.current = viewportTop;
    },
    [viewportTop],
  );

  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!timelineRef.current) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const deltaY = e.clientY - dragStartY.current;
      const deltaPercent = (deltaY / rect.height) * 100;
      const newTop = Math.max(
        0,
        Math.min(
          100 - viewportHeight,
          dragStartViewport.current + deltaPercent,
        ),
      );

      setViewportTop(newTop);

      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollTo = (newTop / (100 - viewportHeight)) * docHeight;
      window.scrollTo({ top: scrollTo });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, viewportHeight]);

  const handleTimelineClick = useCallback(
    (e: React.MouseEvent) => {
      if (!timelineRef.current || isDragging) return;

      const rect = timelineRef.current.getBoundingClientRect();
      const clickY = e.clientY - rect.top;
      const clickPercent = (clickY / rect.height) * 100;

      const targetTop = Math.max(
        0,
        Math.min(100 - viewportHeight, clickPercent - viewportHeight / 2),
      );

      const docHeight =
        document.documentElement.scrollHeight - window.innerHeight;
      const scrollTo = (targetTop / (100 - viewportHeight)) * docHeight;

      window.scrollTo({ top: scrollTo, behavior: "smooth" });
    },
    [viewportHeight, isDragging],
  );

  const fetchTimeline = async () => {
    try {
      const response = await fetch("/api/timeline");
      if (response.ok) {
        const posts: Post[] = await response.json();

        if (posts.length === 0) {
          setIsLoading(false);
          return;
        }

        const dates = posts.map((p) => new Date(p.eventDate || p.createdAt));
        const minDate = startOfYear(
          new Date(Math.min(...dates.map((d) => d.getTime()))),
        );
        const maxDate = endOfYear(
          new Date(Math.max(...dates.map((d) => d.getTime()))),
        );

        const allDays = eachDayOfInterval({
          start: minDate,
          end: maxDate,
        }).reverse();
        const dayMap = new Map<string, DayActivity>();

        allDays.forEach((date) => {
          dayMap.set(format(date, "yyyy-MM-dd"), {
            date,
            count: 0,
            posts: [],
          });
        });

        posts.forEach((post) => {
          const date = new Date(post.eventDate || post.createdAt);
          const key = format(date, "yyyy-MM-dd");
          const day = dayMap.get(key);
          if (day) {
            day.count++;
            day.posts.push(post);
          }
        });

        const activitiesArray = Array.from(dayMap.values());
        setActivities(activitiesArray);

        const months: MonthGroup[] = [];
        let currentMonth = "";
        let startIndex = 0;

        activitiesArray.forEach((activity, index) => {
          const monthKey = format(activity.date, "yyyy-MM");
          if (monthKey !== currentMonth) {
            if (currentMonth) {
              const monthPosts = activitiesArray
                .slice(startIndex, index)
                .reduce((sum, a) => sum + a.count, 0);
              months.push({
                month: format(activitiesArray[startIndex].date, "MM"),
                year: format(activitiesArray[startIndex].date, "yyyy"),
                displayName: format(
                  activitiesArray[startIndex].date,
                  "MMM yyyy",
                ),
                startIndex,
                endIndex: index - 1,
                postCount: monthPosts,
              });
            }
            currentMonth = monthKey;
            startIndex = index;
          }
        });

        if (startIndex < activitiesArray.length) {
          const monthPosts = activitiesArray
            .slice(startIndex)
            .reduce((sum, a) => sum + a.count, 0);
          months.push({
            month: format(activitiesArray[startIndex].date, "MM"),
            year: format(activitiesArray[startIndex].date, "yyyy"),
            displayName: format(activitiesArray[startIndex].date, "MMM yyyy"),
            startIndex,
            endIndex: activitiesArray.length - 1,
            postCount: monthPosts,
          });
        }

        setMonthGroups(months);
      }
    } catch (error) {
      console.error("Error fetching timeline:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLDivElement>) => {
    const scrollAmount = 10;
    const docHeight =
      document.documentElement.scrollHeight - window.innerHeight;

    switch (e.key) {
      case "ArrowUp":
      case "k":
        e.preventDefault();
        window.scrollBy({
          top: -docHeight * (scrollAmount / 100),
          behavior: "smooth",
        });
        break;
      case "ArrowDown":
      case "j":
        e.preventDefault();
        window.scrollBy({
          top: docHeight * (scrollAmount / 100),
          behavior: "smooth",
        });
        break;
      case "Home":
        e.preventDefault();
        window.scrollTo({ top: 0, behavior: "smooth" });
        break;
      case "End":
        e.preventDefault();
        window.scrollTo({ top: docHeight, behavior: "smooth" });
        break;
    }
  }, []);

  if (isLoading || activities.length === 0) return null;

  const maxCount = Math.max(...activities.map((a) => a.count), 1);

  return (
    <div
      className="fixed right-6 top-24 hidden lg:flex flex-col items-end z-40 focus:outline-none"
      onKeyDown={handleKeyDown}
      tabIndex={0}
      role="navigation"
      aria-label="Timeline navigation"
    >
      <div className="relative h-[calc(100vh-12rem)] flex flex-col justify-between">
        {/* Timeline track */}
        <div
          ref={timelineRef}
          className="absolute right-0 top-0 bottom-0 w-px bg-border/30 cursor-pointer"
          onClick={handleTimelineClick}
        >
          {/* Activity dots */}
          {activities.map((activity, index) => {
            if (activity.count === 0) return null;
            const yPosition = (index / activities.length) * 100;
            const size = 3 + (activity.count / maxCount) * 3;

            return (
              <div
                key={format(activity.date, "yyyy-MM-dd")}
                className="absolute right-1/2 translate-x-1/2 rounded-full bg-primary/70"
                style={{
                  top: `${yPosition}%`,
                  width: `${size}px`,
                  height: `${size}px`,
                }}
              />
            );
          })}

          {/* Viewport indicator */}
          <div
            className={`absolute -left-[2px] -right-[2px] rounded-full transition-colors ${
              isDragging
                ? "bg-primary cursor-grabbing"
                : "bg-primary/40 cursor-grab hover:bg-primary/70"
            }`}
            style={{
              top: `${viewportTop}%`,
              height: `${Math.max(viewportHeight, 4)}%`,
              minHeight: "12px",
            }}
            onMouseDown={handleMouseDown}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Month labels */}
        <div className="pr-4 h-full relative">
          {monthGroups.map((month) => {
            const yPosition = (month.startIndex / activities.length) * 100;
            const isHovered = hoveredMonth?.displayName === month.displayName;

            return (
              <div
                key={`${month.year}-${month.month}`}
                className="absolute right-4 flex items-center gap-2 group"
                style={{ top: `${yPosition}%` }}
                onMouseEnter={() => setHoveredMonth(month)}
                onMouseLeave={() => setHoveredMonth(null)}
              >
                {month.postCount > 0 && (
                  <span
                    className={`text-[9px] font-medium tabular-nums text-primary transition-opacity ${
                      isHovered ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    {month.postCount}
                  </span>
                )}

                <span
                  className={`text-[10px] tracking-[0.05em] transition-all ${
                    month.postCount > 0
                      ? "text-muted-foreground font-medium"
                      : "text-muted-foreground/30"
                  } ${isHovered ? "text-primary" : ""}`}
                >
                  {format(
                    new Date(parseInt(month.year), parseInt(month.month) - 1),
                    "MMM",
                  )}
                </span>

                {(month.month === "01" || monthGroups.indexOf(month) === 0) && (
                  <span className="text-[9px] text-muted-foreground/50 tracking-wide">
                    {month.year}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
