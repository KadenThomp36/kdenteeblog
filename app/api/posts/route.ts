import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { title, slug, excerpt, content, coverImage, published } = body

    if (!title || !slug || !content) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const post = await db.post.create({
      data: {
        title,
        slug,
        excerpt,
        content,
        coverImage,
        published,
        authorId: session.user.id,
      },
    })

    return NextResponse.json(post)
  } catch (error) {
    console.error("Error creating post:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
