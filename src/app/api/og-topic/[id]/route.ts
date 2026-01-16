import { getTopicProductsData } from '@/services/topics/get-topic-products-data'
import { TopicProductsResponse } from '@/services/topics/get-topic-products-data'

export const revalidate = 604800 // 7 days

export async function GET(
  __request: Request,
  { params }: { params: Promise<TopicProductsResponse> },
) {
  const { id } = await params
  const data = await getTopicProductsData(Number(id))
  return Response.json(data)
}
