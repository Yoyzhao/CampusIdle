import { GoogleGenAI, Type } from "@google/genai";
import { Category, ItemType } from "../types";

// Initialize Gemini Client
// Note: In a real environment, ensure API_KEY is set. 
// For this demo, we assume process.env.API_KEY is available.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const generateItemDescription = async (title: string, category: Category, type: ItemType): Promise<{ description: string, suggestedPrice: number }> => {
  try {
    const prompt = `
      我是一个大学生，想在校园二手平台上发布一个物品。
      物品名称: "${title}"
      类别: "${category}"
      交易方式: "${type}"
      
      请帮我生成一段活泼、吸引人的简短描述（不超过80字），突出适合学生的特点。
      同时，根据物品名称估算一个合理的二手价格（人民币，数字），如果是由“以物易物”或“赠送”，价格设为0。
      
      请以JSON格式返回。
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            suggestedPrice: { type: Type.NUMBER }
          },
          required: ["description", "suggestedPrice"]
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    
    throw new Error("Empty response from AI");
  } catch (error) {
    console.error("Gemini generation error:", error);
    // Fallback if AI fails
    return {
      description: "这个东西很棒，快来看看吧！(AI生成暂时不可用)",
      suggestedPrice: 0
    };
  }
};