/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** URL del API Gateway, por ejemplo http://localhost:3000 */
  readonly VITE_API_URL?: string
  /** WhatsApp de la tienda, solo dígitos con código de país */
  readonly VITE_WHATSAPP_NUMBER?: string
}
