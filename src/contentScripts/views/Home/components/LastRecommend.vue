<script setup lang="ts">
import type { Ref } from 'vue'
import { onClickOutside } from '@vueuse/core'
import type { Item as AppVideoItem, ThreePointV2 } from '~/models/video/appForYou'
import type { Item as VideoItem } from '~/models/video/forYou'
import type { GridLayout } from '~/logic'
import { settings } from '~/logic'

const props = defineProps<{
  gridLayout: GridLayout
}>()

const gridValue = computed((): string => {
  if (props.gridLayout === 'adaptive')
    return '~ 2xl:cols-5 xl:cols-4 lg:cols-3 md:cols-2 gap-5'
  if (props.gridLayout === 'twoColumns')
    return '~ cols-1 xl:cols-2 gap-4'
  return '~ cols-1 gap-4'
})

const videoList = inject('recommendCache') as VideoItem[]
const appVideoList = inject('recommendCacheAPP') as AppVideoItem[]
const recommendCacheRecord = inject('recommendCacheStrorageRecord') as Ref<number[]>
// const isLoading = ref<boolean>(true)
const needToLoginFirst = ref<boolean>(false)
const containerRef = ref<HTMLElement>() as Ref<HTMLElement>
const noMoreContent = ref<boolean>(false)
const { handleReachBottom, handlePageRefresh, scrollbarRef } = useBewlyApp()
const showVideoOptions = ref<boolean>(false)
const videoOptions = ref<ThreePointV2[] | undefined>([])
const videoOptionsPosition = reactive<{ top: string, left: string }>({ top: '0', left: '0' })
// const activatedVideoId = ref<number>(0)
const activatedVideo = ref<AppVideoItem | null>()
const videoCardRef = ref(null)
const dislikedVideoIds = ref<number[]>([])

const trans2home = inject('trans2home') as () => void

watch(videoList, () => {
  noMoreContent.value = settings.value.recommendationMode === 'web' && videoList.length <= recommendCacheRecord.value[0]
})

watch(appVideoList, () => {
  noMoreContent.value = settings.value.recommendationMode === 'app' && appVideoList.length <= recommendCacheRecord.value[0]
})

onClickOutside(videoCardRef, () => {
  closeVideoOptions()
})

onMounted(() => {
  initPageAction()
  initData()
})

onActivated(() => {
  initPageAction()
})

function initData() {
  noMoreContent.value = settings.value.recommendationMode === 'web'
    ? videoList.length <= recommendCacheRecord.value[0]
    : appVideoList.length <= recommendCacheRecord.value[0]
}

function initPageAction() {
  handleReachBottom.value = () => {

  }

  handlePageRefresh.value = async () => {
    trans2home()
  }
}

function handleMoreClick(e: MouseEvent, data: AppVideoItem) {
  if (activatedVideo.value && activatedVideo.value.idx === data.idx) {
    closeVideoOptions()
    return
  }
  showVideoOptions.value = true
  // activatedVideo.value.idx = data.idx
  activatedVideo.value = data
  const osInstance = scrollbarRef.value?.osInstance()
  const scrollTop = osInstance.elements().viewport.scrollTop || 0
  videoOptions.value = data.three_point_v2
  videoOptionsPosition.top = `${e.clientY + scrollTop}px`
  videoOptionsPosition.left = `${e.clientX}px`
}

function handleMoreCommand(command: string) {
  if (activatedVideo.value)
    dislikedVideoIds.value.push(activatedVideo.value.idx)

  // eslint-disable-next-line no-empty
  switch (command) {}

  // if (command === 'close')
  //   closeVideoOptions()
}

function closeVideoOptions() {
  showVideoOptions.value = false
  activatedVideo.value = null
}

// function handleVideoOptionsCommand(command: string) {
//   if (command === 'close')
//     closeVideoOptions()
// }

function jumpToLoginPage() {
  location.href = 'https://passport.bilibili.com/login'
}

defineExpose({ initData })
</script>

<template>
  <div>
    <!-- By directly using predefined unocss grid properties, it is possible to dynamically set the grid attribute -->
    <div hidden grid="~ 2xl:cols-5 xl:cols-4 lg:cols-3 md:cols-2 gap-5" />
    <div hidden grid="~ cols-1 xl:cols-2 gap-4" />
    <div hidden grid="~ cols-1 gap-4" />

    <!-- dislike popup -->
    <div v-show="showVideoOptions">
      <div
        style="backdrop-filter: var(--bew-filter-glass-1);"
        :style="{ transform: `translate(${videoOptionsPosition.left}, ${videoOptionsPosition.top})` }"
        p-2 bg="$bew-elevated-1" rounded="$bew-radius" pos="absolute top-0 left-0"
        w-150px m="t-4 l-[calc(-150px+1rem)]"
        shadow="$bew-shadow-1" z-10
      >
        <ul flex="~ col gap-1">
          <li
            v-for="option in videoOptions" :key="option.type"
            bg="hover:$bew-fill-2" p="x-4 y-2" rounded="$bew-radius-half" cursor-pointer
            @click="handleMoreCommand('')"
          >
            {{ option.title }}
          </li>
        </ul>
      </div>
    </div>

    <Empty v-if="needToLoginFirst" mt-6 :description="$t('common.please_log_in_first')">
      <Button type="primary" @click="jumpToLoginPage()">
        {{ $t('common.login') }}
      </Button>
    </Empty>

    <div
      v-else
      ref="containerRef"
      m="b-0 t-0" relative w-full h-full
      :grid="gridValue"
    >
      <template v-if="settings.recommendationMode === 'web'">
        <VideoCard
          v-for="video in videoList.slice(recommendCacheRecord[0])"
          :id="video.id"
          :key="video.id"
          :duration="video.duration"
          :title="video.title"
          :cover="video.pic"
          :author="video.owner.name"
          :author-face="video.owner.face"
          :mid="video.owner.mid"
          :view="video.stat.view"
          :danmaku="video.stat.danmaku"
          :published-timestamp="video.pubdate"
          :bvid="video.bvid"
          :cid="video.cid"
          :uri="video.uri"
          show-preview
          :horizontal="gridLayout !== 'adaptive'"
        />
      </template>
      <template v-else>
        <VideoCard
          v-for="video in appVideoList.slice(recommendCacheRecord[0])"
          :id="video.args.aid ?? 0"
          ref="videoCardRef"
          :key="video.args.aid"
          :duration-str="video.cover_right_text"
          :title="`${video.title}`"
          :cover="`${video.cover}`"
          :author="video?.mask?.avatar.text"
          :author-face="video?.mask?.avatar.cover"
          :mid="video?.mask?.avatar.up_id "
          :capsule-text="video?.desc?.split('·')[1]"
          :bvid="video.bvid"
          :view-str="video.cover_left_text_1"
          :danmaku-str="video.cover_left_text_2"
          :cid="video?.player_args?.cid"
          :uri="video.uri"
          show-preview
          :horizontal="gridLayout !== 'adaptive'"
          more-btn
          :more-btn-active="video.idx === activatedVideo?.idx"
          :show-dislike-options="dislikedVideoIds.includes(video.idx)"
          @more-click="(e) => handleMoreClick(e, video)"
        />
      </template>
    </div>

    <!-- no more content -->
    <Empty v-if="noMoreContent" class="pb-4" :description="$t('common.no_more_content')" />
  </div>
</template>

<style lang="scss" scoped>
</style>
