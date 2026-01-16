import { getTopicOgData } from '@/services/topics/get-topic-og-data'

export const revalidate = 604800 // 7 days

export async function GET(__request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const data = await getTopicOgData(slug)
  return Response.json(data)
}
