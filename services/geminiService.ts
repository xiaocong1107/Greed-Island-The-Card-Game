import { GoogleGenAI, Type } from "@google/genai";
import { Card, Scenario, ActionResolution, PlayerState, Choice } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_ID = "gemini-2.5-flash";

// 1. Start a Scenario (Encounter or Event)
export const startScenario = async (
  player: PlayerState
): Promise<Scenario> => {
  try {
    const prompt = `
      你现在是动漫《全职猎人》(Hunter x Hunter) 中“贪婪之岛 (Greed Island)”游戏的 Game Master (GM)。
      
      玩家信息:
      - 名字: ${player.name} (Lv.${player.level})
      - 位置: ${player.currentLocation.name} (难度: ${player.currentLocation.difficulty})
      - 当前状态: HP ${player.hp}/${player.maxHp}, ATK ${player.attack}, DEF ${player.defense}.
      
      请生成一个 RPG 互动场景。
      - 可能是怪兽遭遇、NPC互动、或者发现神秘地点。
      - 必须提供 2 到 3 个行动选项供玩家选择 (例如: "战斗", "逃跑", "交涉", "偷窃", "调查").
      - 选项应该有不同的风险和潜在收益。
      
      请仅返回 JSON。
    `;

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "场景标题" },
            description: { type: Type.STRING, description: "场景描述 (中文)" },
            monsterName: { type: Type.STRING, nullable: true },
            choices: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  text: { type: Type.STRING, description: "选项描述 (如: '正面攻击')" },
                  type: { type: Type.STRING, enum: ['AGGRESSIVE', 'DEFENSIVE', 'NEUTRAL', 'RISKY'] }
                },
                required: ["id", "text", "type"]
              }
            }
          },
          required: ["title", "description", "choices"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from GM");
    return JSON.parse(text) as Scenario;

  } catch (error) {
    console.error("Scenario Error:", error);
    return {
      title: "寂静的道路",
      description: "你走在路上，周围异常安静。似乎没有什么特别的事情发生。",
      choices: [{ id: "continue", text: "继续前进", type: "NEUTRAL" }]
    };
  }
};

// 2. Resolve the User's Choice
export const resolveAction = async (
  player: PlayerState,
  scenario: Scenario,
  choiceId: string
): Promise<ActionResolution> => {
  try {
    const selectedChoice = scenario.choices.find(c => c.id === choiceId) || scenario.choices[0];

    const prompt = `
      我是玩家。
      当前场景: ${scenario.description}
      我的属性: Lv.${player.level}, HP ${player.hp}, ATK ${player.attack}.
      
      我选择了: "${selectedChoice.text}"。
      
      请做为 GM 判定结果:
      1. 叙述发生了什么 (Narrative)。
      2. 计算伤害 (DamageTaken): 根据敌人强弱和我方防御。如果我选择逃跑且失败，也会受伤。
      3. 计算 XP (XpGained): 成功解决事件获得 XP。
      4. 物品/卡片奖励 (RewardCard): 
         - 5% 几率获得 '指定口袋 (SPECIFIED)' (0-99号)。
         - 40% 几率获得 '道具' 或 '怪兽' 卡片。
         - 失败则无奖励。
      5. 装备/属性提升 (NewStatBuff): 极低几率(1%)获得属性提升道具。

      请仅返回 JSON。
    `;

    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            narrative: { type: Type.STRING },
            damageTaken: { type: Type.INTEGER },
            xpGained: { type: Type.INTEGER },
            hpRestored: { type: Type.INTEGER },
            rewardCard: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                name: { type: Type.STRING },
                rank: { type: Type.STRING, enum: ["SS", "S", "A", "B", "C", "D", "E", "F", "G", "H"] },
                type: { type: Type.STRING, enum: ["SPECIFIED", "ITEM", "MONSTER", "SPELL"] },
                description: { type: Type.STRING },
                number: { type: Type.INTEGER },
              },
              required: ["name", "rank", "type", "description", "number"]
            },
            newStatBuff: {
              type: Type.OBJECT,
              nullable: true,
              properties: {
                stat: { type: Type.STRING, enum: ["attack", "defense", "maxHp"] },
                amount: { type: Type.INTEGER },
                sourceName: { type: Type.STRING }
              }
            }
          },
          required: ["narrative", "damageTaken", "xpGained", "hpRestored"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No resolution from GM");
    return JSON.parse(text) as ActionResolution;

  } catch (error) {
    console.error("Resolution Error:", error);
    return {
      narrative: "发生了一些干扰，结果无法判定。",
      damageTaken: 0,
      xpGained: 0,
      hpRestored: 0
    };
  }
};

export const consultBook = async (query: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: MODEL_ID,
      contents: `你是贪婪之岛的集卡书 (Book)。请以电子向导的口吻，用中文简短回答此查询: ${query}`,
    });
    return response.text || "无数据。";
  } catch (e) {
    return "连接错误。";
  }
};
