import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Valida e processa uma string base64 de imagem
 * @param base64String String base64 da imagem
 * @param mimeType Tipo MIME da imagem (padrão: image/jpeg)
 * @param fallbackUrl URL de fallback caso a string base64 seja inválida
 * @returns URL da imagem processada (data URI ou fallback)
 */
export function processImageBase64(
  base64String: string | null | undefined,
  mimeType: string = 'image/jpeg',
  fallbackUrl: string = '/placeholder.svg?height=100&width=150'
): string {
  // Se não houver string base64, retornar fallback
  if (!base64String) {
    return fallbackUrl;
  }

  try {
    // Verificar se é uma string base64 válida
    if (typeof base64String !== 'string' || base64String.trim() === '') {
      return fallbackUrl;
    }

    // Se já for uma data URI completa, retornar como está
    if (base64String.startsWith('data:')) {
      return base64String;
    }

    // Tentar remover caracteres inválidos que possam estar na string base64
    const cleanBase64 = base64String.replace(/[^A-Za-z0-9+/=]/g, '');
    
    // Verificar se a string base64 limpa é válida
    try {
      // Teste simples para verificar se é uma string base64 válida
      // (isso não garante que seja uma imagem válida, apenas que é base64 válido)
      atob(cleanBase64);
      return `data:${mimeType};base64,${cleanBase64}`;
    } catch (e) {
      console.error("String base64 inválida:", e);
      return fallbackUrl;
    }
  } catch (error) {
    console.error("Erro ao processar imagem base64:", error);
    return fallbackUrl;
  }
}

