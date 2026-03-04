import { GoogleGenAI } from "@google/genai";
import { Category, FinancialContext } from "../types";

const API_KEY = process.env.GEMINI_API_KEY;

export interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export async function sendMessageToNova(
  history: Message[],
  userMessage: string,
  context: FinancialContext
): Promise<string> {
  if (!API_KEY) {
    console.error("Missing GEMINI_API_KEY");
    return "Error: API Key no configurada. Por favor configura GEMINI_API_KEY en tu entorno.";
  }

  const ai = new GoogleGenAI({ apiKey: API_KEY });

  const systemPrompt = `Eres NOVA, asesora de crédito personal experta para ${context.userName}.
ESTADO ACTUAL (${new Date().toLocaleDateString()}):
  Deuda tarjeta: $${context.currentDebt} (${context.utilizationRate.toFixed(1)}% de $${context.creditLimit})
  Fase del ciclo: ${context.cyclePhase} — ${context.cycleMessage}
  Próximo evento: ${context.nextEventName} en ${context.daysToEvent} días
  Promedio diario: $${context.dailyAverage}
  Saldo disponible total: $${context.totalLiquidity}
Responde siempre en español. Sé concisa y proactiva.
Si el usuario menciona un gasto, identifica: monto, categoría sugerida, impacto en ciclo.

Funciones de Nova
•	Responder preguntas sobre el estado financiero del usuario.
•	Categorizar gastos mencionados en la conversación.
•	Advertir proactivamente sobre fechas críticas del ciclo.
•	Simular escenarios ('¿qué pasa si gasto 100k esta semana?').
•	Celebrar logros crediticios (pago total, ciclo perfecto).`;

  try {
    const model = "gemini-2.5-flash";
    
    // Convert history to Gemini format
    // Gemini expects 'user' and 'model' roles
    const chatHistory = history.map(msg => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }]
    }));

    const chat = ai.chats.create({
      model: model,
      history: chatHistory,
      config: {
        systemInstruction: systemPrompt,
      },
    });

    const result = await chat.sendMessage({ message: userMessage });
    return result.text || "Lo siento, no pude generar una respuesta.";
  } catch (error) {
    console.error("Nova Error:", error);
    return "Lo siento, tuve un problema al procesar tu mensaje. Verifica tu conexión o API Key.";
  }
}

export async function categorizeExpense(description: string): Promise<Category> {
  // 1. Try simple keyword matching first for speed (Client-side heuristic)
  const lower = description.toLowerCase();
  
  // Fast path for obvious ones
  if (lower.includes('uber') || lower.includes('gasolina') || lower.includes('texaco')) return Category.GAS;
  if (lower.includes('netflix') || lower.includes('spotify') || lower.includes('hbo') || lower.includes('youtube')) return Category.SUBSCRIPTIONS;
  if (lower.includes('rappi') || lower.includes('restaurante') || lower.includes('mcdonalds')) return Category.DINING_OUT;
  if (lower.includes('universidad') || lower.includes('fotocopia')) return Category.FOOD_UNIVERSITY;
  if (lower.includes('regalo')) return Category.GIFTS;
  if (lower.includes('weed')) return Category.WEED;
  if (lower.includes('cerveza') || lower.includes('licor') || lower.includes('bar')) return Category.ALCOHOL;

  // 2. Use Gemini for intelligent categorization if available
  if (API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: API_KEY });
      const prompt = `
        Categorize the following expense description into exactly one of these categories:
        ${Object.values(Category).join(', ')}
        
        Description: "${description}"
        
        Return ONLY the category name exactly as listed above. If unsure, return "${Category.OTHER}".
      `;
      
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });
      
      const responseText = response.text?.trim();
      
      // Validate that the response is a valid category
      if (responseText && Object.values(Category).includes(responseText as Category)) {
        return responseText as Category;
      }
    } catch (error) {
      console.warn("AI categorization failed, falling back to OTHER", error);
    }
  }

  return Category.OTHER;
}
