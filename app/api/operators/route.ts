import { NextResponse } from 'next/server';
import { getOperators } from '@/lib/supabase-operators';

export async function GET() {
  try {
    const { data, error } = await getOperators();
    
    if (error) {
      console.error("Erro ao buscar operadores:", error);
      return NextResponse.json({ error: "Erro ao buscar operadores" }, { status: 500 });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error("Erro na API de operadores:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
} 