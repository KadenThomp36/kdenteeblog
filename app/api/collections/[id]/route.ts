import { NextResponse } from "next/server"
import { auth } from "@/auth"
import { db } from "@/lib/db"

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const collection = await db.collection.findUnique({
      where: {
        id,
      },
      include: {
        posts: {
          orderBy: {
            order: "asc",
          },
        },
      },
    })

    if (!collection) {
      return NextResponse.json({ error: "Collection not found" }, { status: 404 })
    }

    return NextResponse.json(collection)
  } catch (error: any) {
    console.error("Error fetching collection:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    const { id } = await params
    const body = await req.json()
    const { title, slug, description, coverImage, published } = body

    if (!title || !slug) {
      return NextResponse.json({ error: "Missing required fields: title and slug are required" }, { status: 400 })
    }

    const collection = await db.collection.update({
      where: {
        id,
      },
      data: {
        title,
        slug,
        description: description || null,
        coverImage: coverImage || null,
        published: published || false,
      },
    })

    return NextResponse.json(collection)
  } catch (error: any) {
    console.error("Error updating collection:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized - Please log in" }, { status: 401 })
    }

    const { id } = await params

    await db.collection.delete({
      where: {
        id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Error deleting collection:", error)
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 })
  }
}
