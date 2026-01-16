import * as migration_20251224_051348_init from './20251224_051348_init'
import * as migration_20251225_094253_topic_redirect_to from './20251225_094253_topic_redirect_to'
import * as migration_20251226_130428 from './20251226_130428'
import * as migration_20251226_135630_topic_change from './20251226_135630_topic_change'
import * as migration_20251231_160556 from './20251231_160556'
import * as migration_20260101_030857 from './20260101_030857'
import * as migration_20260104_111746_add_active_to_ai_block from './20260104_111746_add_active_to_ai_block'
import * as migration_20260107_073109 from './20260107_073109'
import * as migration_20260109_025055 from './20260109_025055'
import * as migration_20260109_071347_add_keywords_to_posts from './20260109_071347_add_keywords_to_posts'
import * as migration_20260112_074816_media_folder from './20260112_074816_media_folder'

export const migrations = [
  {
    up: migration_20251224_051348_init.up,
    down: migration_20251224_051348_init.down,
    name: '20251224_051348_init',
  },
  {
    up: migration_20251225_094253_topic_redirect_to.up,
    down: migration_20251225_094253_topic_redirect_to.down,
    name: '20251225_094253_topic_redirect_to',
  },
  {
    up: migration_20251226_130428.up,
    down: migration_20251226_130428.down,
    name: '20251226_130428',
  },
  {
    up: migration_20251226_135630_topic_change.up,
    down: migration_20251226_135630_topic_change.down,
    name: '20251226_135630_topic_change',
  },
  {
    up: migration_20251231_160556.up,
    down: migration_20251231_160556.down,
    name: '20251231_160556',
  },
  {
    up: migration_20260101_030857.up,
    down: migration_20260101_030857.down,
    name: '20260101_030857',
  },
  {
    up: migration_20260104_111746_add_active_to_ai_block.up,
    down: migration_20260104_111746_add_active_to_ai_block.down,
    name: '20260104_111746_add_active_to_ai_block',
  },
  {
    up: migration_20260107_073109.up,
    down: migration_20260107_073109.down,
    name: '20260107_073109',
  },
  {
    up: migration_20260109_025055.up,
    down: migration_20260109_025055.down,
    name: '20260109_025055',
  },
  {
    up: migration_20260109_071347_add_keywords_to_posts.up,
    down: migration_20260109_071347_add_keywords_to_posts.down,
    name: '20260109_071347_add_keywords_to_posts',
  },
  {
    up: migration_20260112_074816_media_folder.up,
    down: migration_20260112_074816_media_folder.down,
    name: '20260112_074816_media_folder',
  },
]
