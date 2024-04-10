<script lang="ts" setup>
import draggable from 'vuedraggable'

import { removeHttpFromUrl } from '~/utils/main'

interface Props {
  modelValue: number[]
}

interface PeopleInfo {
  uid: number
  name: string
  avatar: string
  isIncluded: boolean
}

const prop = defineProps<Props>()
const emits = defineEmits(['update:modelValue'])
const isLoading = ref<boolean>(true)
let props = JSON.parse(JSON.stringify(prop.modelValue)) as number[]
const showList = reactive<PeopleInfo[]>([])
const isNoContent = computed(() => showList.length !== 0)
const pageIndex = ref<number>(0)
const pageStr = computed(() => `${pageIndex.value + 1} / ${Math.ceil(props.length / 50)}`)
const cachePage = computed(() => Math.ceil(showList.length / 50))
const execList = computed(() => showList.slice(pageIndex.value * 50 + 0, Math.min(pageIndex.value * 50 + 50, props.length)))
const peopleInfoCache = ref<Map<number, PeopleInfo>>(new Map<number, PeopleInfo>())
onMounted(async () => {
  await getPeopleInfo()
})

watch(() => JSON.parse(JSON.stringify(prop.modelValue)), (newValue) => {
  if (newValue.length < props.length)
    return
  isLoading.value = true
  props = JSON.parse(JSON.stringify(newValue)) as number[]
  showList.length = 0
  getPeopleInfo()
})

async function getPeopleInfo() {
  let uids = [] as number[]
  if (peopleInfoCache.value.size) {
    for (let i = cachePage.value * 50; i < Math.min(cachePage.value * 50 + 50, props.length); i++) {
      if (peopleInfoCache.value.has(props[i]))
        showList.push(peopleInfoCache.value.get(props[i])!)
      else
        uids.push(props[i])
    }
  }
  else {
    uids = props.slice(cachePage.value * 50 + 0, Math.min(cachePage.value * 50 + 50, props.length))
  }
  if (!uids.length) {
    isLoading.value = false
    return
  }

  const response = await browser.runtime.sendMessage({
    contentScriptQuery: 'getPeopleInfo',
    uids,
  })

  if (!response?.data) {
    isLoading.value = false
    return
  }

  if (response.code === 0) {
    showList.push(...response.data.map((item: any) => {
      peopleInfoCache.value.set(item.mid, {
        uid: item.mid,
        name: item.name,
        avatar: `${removeHttpFromUrl(item.face)}@50w_50h_1c`,
        isIncluded: true,
      })
      return {
        uid: item.mid,
        name: item.name,
        avatar: `${removeHttpFromUrl(item.face)}@50w_50h_1c`,
        isIncluded: true,
      }
    }))
    isLoading.value = false
  }
}

function handelIntercepter(element: PeopleInfo) {
  if (element.isIncluded) {
    showList.find(item => item.uid === element.uid)!.isIncluded = false
    emits('update:modelValue', showList.filter(item => item.isIncluded).map(item => item.uid))
  }
  else {
    showList.find(item => item.uid === element.uid)!.isIncluded = true
    emits('update:modelValue', showList.filter(item => item.isIncluded).map(item => item.uid))
  }
}

async function nextPage() {
  if (pageIndex.value < cachePage.value - 1) {
    pageIndex.value++
  }
  else if (pageIndex.value < Math.ceil(props.length / 50) - 1) {
    isLoading.value = true
    await getPeopleInfo()
      .then(() => {
        pageIndex.value++
      })
  }
}

function prevPage() {
  if (pageIndex.value > 0)
    pageIndex.value--
}
</script>

<template>
  <div v-if="isLoading" flex items-center justify-center w-full>
    <span :style="{ color: 'var(--bew-text-2)' }">{{ $t('common.loading') }}</span>
  </div>

  <div v-else-if="!isNoContent" flex items-center justify-center w-full>
    <span :style="{ color: 'var(--bew-text-2)' }">{{ $t('common.no_more_content') }}</span>
  </div>

  <div v-else>
    <draggable v-model="execList" :component-data="{ style: 'display: flex; gap: 0.5rem; flex-wrap: wrap;' }">
      <template #item="{ element }">
        <div
          flex="~ gap-2 items-center" p="x-4 y-2" bg="$bew-fill-1" rounded="$bew-radius" duration-300
          :style="{
            background: element.isIncluded ? 'var(--bew-theme-color)' : 'var(--bew-fill-1)',
            color: element.isIncluded ? 'white' : 'var(--bew-text-1)',
          }"
        >
          <img :src="element.avatar" width="30" height="30" object-cover @click="handelIntercepter(element)">
          <span v-if="element.isIncluded">{{ element.name }}</span>
        </div>
      </template>
    </draggable>

    <div flex items-center justify-center w-full>
      <Button v-if="pageIndex !== 0" size="small" type="secondary" @click="prevPage">
        {{ $t('common.prev') }}
      </Button>
      <span m-8>{{ $t('common.page', { count: pageStr }, pageStr) }}</span>
      <Button v-if="pageIndex < Math.ceil(props.length / 50) - 1" size="small" type="secondary" @click="nextPage">
        {{ $t('common.next') }}
      </Button>
    </div>
  </div>
</template>

<style lang="scss" scoped></style>
