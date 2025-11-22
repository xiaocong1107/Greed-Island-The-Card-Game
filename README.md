# 贪婪之岛 (Greed Island): The Card Game

![Game Status](https://img.shields.io/badge/Status-Playable-success)
![Tech Stack](https://img.shields.io/badge/Tech-React%20%7C%20TypeScript%20%7C%20Gemini%20AI-blue)
![Style](https://img.shields.io/badge/Style-Cyberpunk%20%2F%20Retro-purple)

> “去吧，去享受这场游戏吧！” —— 这是一个致敬《全职猎人》(Hunter x Hunter) 贪婪之岛篇章的文字冒险卡牌游戏。

本项目利用 **Google Gemini API** 担任人工智能“游戏管理员 (Game Master)”，为玩家提供无限可能的探索场景、动态的战斗反馈以及沉浸式的集卡体验。

## 🌟 项目亮点 (Highlights)

### 1. AI 驱动的无限叙事 (AI-Driven Narrative)
不同于传统 RPG 固定脚本，本作的核心逻辑由 **Gemini 2.5 Flash** 模型驱动：
- **动态场景生成**：根据玩家当前的等级、位置（如魔法都市、寿富拉比等）生成独特的遭遇事件。
- **智能判定系统**：AI 根据玩家选择（攻击、逃跑、交涉等）和玩家属性，实时计算伤害数值、XP 获取及剧情走向。
- **结构化输出**：AI 不仅输出剧情文本，还返回严格的 JSON 数据来控制游戏状态（血量扣除、物品掉落）。

### 2. 深度还原的卡牌系统 (Authentic Card System)
忠实复刻了原著中的集卡书（Binder）机制：
- **指定口袋 (0-99)**：包含“一坪的海岸线”、“大天使的吐息”等经典卡片，拥有详细的卡片描述和等级（SS-H）。
- **自由口袋**：用于存放道具卡和怪兽卡，最大容量限制。
- **卡片实体化/卡片化**：实现了卡片收集、分类展示以及通过点击查看详情的功能。
- **咒语系统**：包含“同行”、“磁力”等咒语卡，可实际触发游戏逻辑（如瞬间移动）。

### 3. 完整的 RPG 核心循环 (Core RPG Loop)
- **成长体系**：包含 HP（生命值）、XP（经验值）、Level（等级）、ATK/DEF（攻防）属性。
- **状态机管理**：实现了 `IDLE` (探索前) -> `DECISION` (遭遇抉择) -> `RESOLVING` (结算动画) -> `VICTORY/GAME_OVER` 的完整游戏状态流转。
- **视觉反馈**：
  - 动态背景：根据当前地图自动切换环境氛围图。
  - 战斗特效：受伤震动、升级金光、获取物品提示。
  - 像素/电子风 UI：使用 Orbitron 字体和扫描线效果，营造游戏机氛围。

### 4. 多结局机制 (Multiple Endings)
- **通关条件**：集齐 100 张指定口袋卡片。
- **结局选择**：触发通关后，玩家可以在 UI 中从集卡书中挑选 3 张卡片带回“现实世界”，完美致敬原著结局。
- **失败惩罚**：HP 归零后显示评分报告，包含收集进度和最终得分。

---

## 🎮 功能演示 (Features)

### 探索与遭遇 (Exploration)
点击“探索”按钮，AI GM 会生成如下场景：
> **场景**：在森林深处遇到了一只独眼巨人。
> **选项**：
> 1. [AGGRESSIVE] 正面攻击
> 2. [DEFENSIVE] 设下陷阱
> 3. [RISKY] 试图偷窃它的宝物

### 集卡书 (The Book)
点击“书 (BOOK)”按钮打开界面：
- **可视化网格**：清晰展示 0-99 号卡位的收集情况。
- **空位提示**：未收集的卡片显示为虚线框或“空”。
- **详细信息**：点击卡片可查看大图、Rank 等级和卡片说明。

### 战斗与结算
- 做出选择后，系统会根据概率和属性进行判定。
- 成功可能获得 XP、恢复 HP 或掉落稀有卡片。
- 失败则会扣除 HP，屏幕出现红色闪烁警告。

---

## 🛠 技术栈 (Tech Stack)

- **Frontend Framework**: React 19
- **Language**: TypeScript
- **AI Integration**: `@google/genai` SDK (Gemini 2.5 Flash)
- **Styling**: Tailwind CSS (用于快速构建响应式布局和动画)
- **Icons**: Lucide React
- **Fonts**: Google Fonts (Orbitron, Roboto Mono)

---

## 📂 项目结构 (Project Structure)

```bash
/
├── index.html          # 入口 HTML (包含 Tailwind CDN)
├── index.tsx           # React 挂载点
├── App.tsx             # 主应用逻辑 (状态机、UI 布局)
├── types.ts            # TypeScript 接口定义 (Card, PlayerState, GameLog)
├── constants.ts        # 静态游戏数据 (Locations, Special Cards, Initial Spells)
├── services/
│   └── geminiService.ts # AI 服务层 (Prompt 工程, JSON 解析)
└── components/
    ├── Binder.tsx      # 集卡书组件 (包含 Tab 切换、网格布局)
    └── CardView.tsx    # 单张卡片渲染组件
```

## 🚀 如何运行 (How to Run)

1. **配置 API Key**:
   本项目依赖 Google Gemini API。请确保环境变量 `process.env.API_KEY` 已正确设置。

2. **安装依赖**:
   ```bash
   npm install
   ```

3. **启动开发服务器**:
   ```bash
   npm start
   ```

## 🔮 未来计划 (Future Plans)

- [ ] **PVP 系统**: 允许玩家之间使用咒语卡（如“抢夺”、“破坏”）。
- [ ] **更多原著卡片**: 补全所有 100 张指定卡片的详细设定。
- [ ] **存档功能**: 利用 LocalStorage 保存游戏进度。
- [ ] **商店系统**: 在玛莎多拉购买咒语卡。

---

*本项目仅供学习与娱乐，致敬富坚义博老师的《全职猎人》。*
