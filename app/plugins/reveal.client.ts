const STAGGER_MS = 35
const MAX_STEPS = 14

function applyReveal(el: HTMLElement, explicitIndex?: number): void {
  const index =
    typeof explicitIndex === 'number'
      ? explicitIndex
      : el.parentElement
        ? Array.prototype.indexOf.call(el.parentElement.children, el)
        : 0
  const step = Math.min(Math.max(index, 0), MAX_STEPS)
  el.style.setProperty('--reveal-delay', `${step * STAGGER_MS}ms`)
  el.classList.add('reveal')
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('reveal', {
    mounted(el: HTMLElement, binding) {
      applyReveal(el, typeof binding.value === 'number' ? binding.value : undefined)
    },
  })
})
