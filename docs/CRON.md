```bash
#
curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:3000/api/cron/search-term-asin-jobs

#
curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:3000/api/cron/process-tasks

#
curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:3000/api/cron/products/scraper

#
curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:3000/api/cron/products/create

#
curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:3000/api/cron/products/paapi5


#
curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:3000/api/cron/topics

curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:3000/api/cron/topics/update

curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:3000/api/cron/topics/nodes

curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:3000/api/cron/topics/publish

# dedupe topics
curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:3000/api/cron/topics/dedupe

# AI dedupe topics
curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:3000/api/cron/topics/dedupe/with-ai


# ai block
curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:3000/api/cron/topics/ai-block/build

# ai block job
curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:3000/api/cron/topics/ai-block/job

# brand

curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:3000/api/cron/brands/update/asin_count

curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:3000/api/cron/brands/update/stats


curl -H "Authorization: Bearer YOUR_CRON_SECRET_HERE" http://localhost:3000/api/cron/brands/update/brand-topics

```
