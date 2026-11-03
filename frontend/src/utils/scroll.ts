/** Alto del header fijo + un respiro, para que la sección no quede tapada. */
export function headerOffset(): number {
  const header = document.querySelector('header')
  return (header?.getBoundingClientRect().height ?? 0) + 16
}

/**
 * Desplaza suavemente hasta la sección del hash (#servicios, #quienes-somos)
 * descontando el header fijo, y la anima al llegar. Devuelve false si la
 * sección todavía no está en la página.
 */
export function scrollToSection(hash: string): boolean {
  if (!hash) return false
  const el = document.getElementById(hash.replace(/^#/, ''))
  if (!el) return false

  const reduceMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
  const top = el.getBoundingClientRect().top + window.scrollY - headerOffset()
  window.scrollTo({ top, behavior: reduceMotion ? 'auto' : 'smooth' })

  // Reinicia la animación de llegada aunque ya se haya mostrado antes.
  el.classList.remove('section-arrive')
  void el.offsetWidth
  el.classList.add('section-arrive')
  el.addEventListener('animationend', () => el.classList.remove('section-arrive'), { once: true })
  return true
}
