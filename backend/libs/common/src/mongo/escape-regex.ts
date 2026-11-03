/** Para usar texto del usuario dentro de $regex sin que actúe como expresión. */
export function escapeRegex(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
