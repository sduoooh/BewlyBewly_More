<script lang="ts" setup>
type Size = 'small' | 'medium' | 'large'
interface Props {
  modelValue: number // 使用基本类型 number
  size?: Size
}
const props = withDefaults(defineProps<Props>(), { size: 'medium' })

const emits = defineEmits(['update:modelValue'])

const modelValue = ref<number>(props.modelValue)

watch(() => props.modelValue, (newValue) => {
  modelValue.value = newValue
})

function updateValue(event: Event) {
  const inputElement = event.target as HTMLInputElement
  const value = Number.parseInt(inputElement.value.replace(/^(0+)|[^\d]+/g, ''), 10)
  if (!Number.isNaN(value)) { // 验证 value 是否为 NaN
    emits('update:modelValue', value)
  }
  else {
    modelValue.value = 1
    emits('update:modelValue', 1)
  }
}
</script>

<template>
  <input
    :value="modelValue" type="text" class="b-input"
    p="x-4 y-2"
    rounded="$bew-radius" outline-none transition-all duration-300
    bg="$bew-fill-1"
    focus:shadow focus:ring="2px $bew-theme-color"
    @input="updateValue($event)"
    @blur="updateValue($event)"
  >
</template>

<style lang="scss" scoped>

</style>
