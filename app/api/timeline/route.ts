import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { format, parseISO } from "date-fns";

export async function GET() {
  try {
    const posts = await db.post.findMany({
      where: {
        published: true,
      },
      select: {
        id: true,
        title: true,
        slug: true,
        createdAt: true,
        eventDate: true,
      },
      orderBy: [
        {
          eventDate: "desc",
        },
        {
          createdAt: "desc",
        },
      ],
    });

    // Group posts by month
    const monthMap = new Map<string, any>();

    posts.forEach((post) => {
      const date = post.eventDate || post.createdAt;
      const monthKey = format(new Date(date), "yyyy-MM");
      const monthName = format(new Date(date), "MMMM");
      const year = new Date(date).getFullYear();

      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, {
          month: monthName,
          year: year,
          count: 0,
          posts: [],
        });
      }

      const monthData = monthMap.get(monthKey);
      monthData.count++;
      monthData.posts.push(post);
    });

    // Convert to array and calculate frequency
    const timeline = Array.from(monthMap.values());
    const maxCount = Math.max(...timeline.map((m) => m.count));

    timeline.forEach((month) => {
      month.frequency = month.count / maxCount;
    });

    return NextResponse.json(timeline);
  } catch (error: any) {
    console.error("Error fetching timeline:", error);
    return NextResponse.json(
      { error: error.message || "Internal Server Error" },
      { status: 500 },
    );
  }
}
