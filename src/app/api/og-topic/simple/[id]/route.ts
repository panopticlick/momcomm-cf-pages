import { getTopicProductsSimpleData } from '@/services/topics/get-topic-products-simple-data'
import { TopicProductsSimpleResponse } from '@/services/topics/get-topic-products-simple-data'

export const revalidate = 604800 // 7 days

export async function GET(
  __request: Request,
  { params }: { params: Promise<TopicProductsSimpleResponse> },
) {
  const { id } = await params
  const data = await getTopicProductsSimpleData(Number(id))
  return Response.json(data)
}
