import { GoogleGenAI, Type } from "@google/genai";
import { FoodItem } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFoodText = async (text: string): Promise<FoodItem | null> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Tu es un expert nutritionniste. Analyse le texte suivant décrivant un aliment ou un repas et estime ses valeurs nutritionnelles. Texte: "${text}". Sois réaliste.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING, description: "Nom court et clair de l'aliment" },
            calories: { type: Type.INTEGER, description: "Estimation des calories (kcal)" },
            protein: { type: Type.NUMBER, description: "Protéines en grammes" },
            carbs: { type: Type.NUMBER, description: "Glucides en grammes" },
            fat: { type: Type.NUMBER, description: "Lipides en grammes" },
            quantity: { type: Type.STRING, description: "Quantité estimée (ex: 100g, 1 portion)" }
          },
          required: ["name", "calories", "protein", "carbs", "fat"]
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return null;

    const data = JSON.parse(jsonText);
    
    return {
      id: crypto.randomUUID(),
      ...data
    };
  } catch (error) {
    console.error("Erreur lors de l'analyse Gemini:", error);
    return null;
  }
};

export const getMotivationalMessage = async (caloriesLeft: number, streak: number): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: "gemini-3-flash-preview",
            contents: `Génère une phrase courte, amusante et motivante (max 15 mots) pour un utilisateur qui suit son régime. 
            Contexte: Il lui reste ${caloriesLeft} calories aujourd'hui. Série actuelle: ${streak} jours.
            Ton: Amical, encourageant, un peu humoristique.`,
            config: {
                maxOutputTokens: 50,
            }
        });
        return response.text || "Continue comme ça !";
    } catch (e) {
        return "Tu es sur la bonne voie !";
    }
}
