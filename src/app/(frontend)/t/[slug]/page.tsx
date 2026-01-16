import { permanentRedirect } from 'next/navigation'

export default async function LegacyTopicRedirect({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const { slug } = await params
  const { n } = await searchParams
  const nodeId = typeof n === 'string' ? n : undefined

  const target = nodeId ? `/gear/${slug}?n=${nodeId}` : `/gear/${slug}`
  permanentRedirect(target)
}
