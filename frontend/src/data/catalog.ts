/**
 * Nombre legible de una mascota o categoría de producto. En la base se guardan
 * en minúscula (`petType` y `category`), por ejemplo "perro" o "higiene".
 */
export function labelFor(value: string): string {
  const known: Record<string, string> = {
    perro: 'Perros',
    gato: 'Gatos',
    arena: 'Piedras sanitarias',
    higiene: 'Higiene y cuidado',
    camas: 'Camas y cuchas',
  }
  return known[value] ?? value.charAt(0).toUpperCase() + value.slice(1)
}
