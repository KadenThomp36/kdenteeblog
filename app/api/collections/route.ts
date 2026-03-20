import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function GET() {
  try {
    const collections = await db.collection.findMany({
      where: {
        published: true,
      },
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    })

    return NextResponse.json(collections)
  } catch (error: any) {
    console.error("Error fetching collections:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    const body = await req.json()
    const { title, slug, description, coverImage, published } = body

    if (!title || !slug) {
      return NextResponse.json({ error: "Missing required fields: title and slug are required" }, { status: 400 })
    }

    const collection = await db.collection.create({
      data: {
        title,
        slug,
        description: description || null,
        coverImage: coverImage || null,
        published: published || false,
        authorId: session.user.id,
      },
    })

    return NextResponse.json(collection)
  } catch (error: any) {
    console.error("Error creating collection:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
