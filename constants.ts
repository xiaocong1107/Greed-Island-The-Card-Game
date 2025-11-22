import { Card, CardRank, CardType, Location } from './types';

export const LOCATIONS: Location[] = [
  { 
    id: 'start',
    name: "起点 (草原)", 
    description: "新玩家抵达的辽阔草原，微风吹拂，景色宜人。", 
    difficulty: 1,
    imageUrl: "https://picsum.photos/seed/grassland_hxh/800/600"
  },
  { 
    id: 'antokiba',
    name: "安多尼拔 (悬赏都市)", 
    description: "充满奖金猎人的繁华市场城镇，也被称为“悬赏都市”。这里举办着各种月例大会。", 
    difficulty: 2,
    imageUrl: "https://picsum.photos/seed/market_town_hxh/800/600"
  },
  { 
    id: 'masadora',
    name: "玛莎多拉 (魔法都市)", 
    description: "巨大的岩石都市。以出售咒语卡和魔法商店闻名，是获取咒语的关键地点。", 
    difficulty: 4,
    imageUrl: "https://picsum.photos/seed/rock_city_magic/800/600"
  },
  { 
    id: 'soufrabi',
    name: "寿富拉比 (海港都市)", 
    description: "充满海盗的沿海城市。这里的灯塔隐藏着秘密。", 
    difficulty: 7,
    imageUrl: "https://picsum.photos/seed/pirate_port_hxh/800/600"
  },
  { 
    id: 'aiai',
    name: "恋爱都市爱爱", 
    description: "粉红色的浪漫都市，这里是恋爱与邂逅的场所。但也潜伏着高等级的念兽。", 
    difficulty: 9,
    imageUrl: "https://picsum.photos/seed/romantic_city_pink/800/600"
  },
  {
    id: 'forest',
    name: "大森林",
    description: "未开发的原始森林，是各种珍稀怪兽的栖息地。",
    difficulty: 6,
    imageUrl: "https://picsum.photos/seed/jungle_deep/800/600"
  }
];

export const INITIAL_SPELLS: Card[] = [
  {
    id: 'spell-1',
    number: 1001,
    name: '分析 (Analysis)',
    rank: CardRank.G,
    type: CardType.SPELL,
    description: '查看目标卡片或玩家的详细情报。',
    limit: 50
  },
  {
    id: 'spell-2',
    number: 1002,
    name: '同行 (Accompany)',
    rank: CardRank.F,
    type: CardType.SPELL,
    description: '飞往指定的玩家或城镇（即使未去过也可以）。',
    limit: 40
  },
  {
    id: 'spell-3',
    number: 1003,
    name: '磁力 (Magnetic Force)',
    rank: CardRank.F,
    type: CardType.SPELL,
    description: '飞往去过的玩家或城镇。',
    limit: 80
  }
];

// Reference list for 00-99 Cards
// In a real app, this would be a database. We define key ones here.
export const FULL_SPECIFIED_CARDS: Record<number, Partial<Card>> = {
  0: { name: "统治者的祝福", rank: CardRank.SS, description: "集齐01-99号卡片并在问答中获胜的人可获得的卡片。" },
  1: { name: "一坪的密林", rank: CardRank.SS, description: "巨大的森林入口。" },
  2: { name: "一坪的海岸线", rank: CardRank.SS, description: "通往海神栖息处的海底洞窟入口。" },
  3: { name: "涌泉之壶", rank: CardRank.A, description: "会有清澈的水源源不断地涌出来的壶。" },
  4: { name: "美肌温泉", rank: CardRank.A, description: "对皮肤非常好的温泉，据说一天只要泡30分钟，就能拥有像婴儿一样的肌肤。" },
  6: { name: "酒之泉", rank: CardRank.A, description: "汲取这个泉水放置一个星期，就会变成酒。" },
  7: { name: "怀孕之石", rank: CardRank.S, description: "随身携带这块石头一个月（3kg），无论男女都能怀孕。" },
  17: { name: "大天使的吐息", rank: CardRank.SS, description: "天使的一口气，可以治愈任何濒死的重伤和不治之症。需一口气用完。" },
  25: { name: "风险骰子", rank: CardRank.B, description: "掷出大凶会发生可怕的事情，但掷出大吉会有非常好的运气。" },
  38: { name: "疯狂博士的肌肉增强剂", rank: CardRank.A, description: "每天喝可以变成绝世猛男，但必须要一直喝下去。" },
  45: { name: "回信蚂蚁", rank: CardRank.B, description: "把写好的信交给它，它一定会把回信带回来。" },
  57: { name: "浮游石", rank: CardRank.S, description: "大小约一克拉，只要带在身上，人就可以漂浮在空中。" },
  75: { name: "奇运亚历山大石", rank: CardRank.A, description: "拥有此宝石的人，会遇到其他人绝对遇不到的幸运。" },
  84: { name: "圣骑士的首饰", rank: CardRank.D, description: "不仅能反弹咒语，还可以解除卡片上的诅咒。" },
  85: { name: "蓝色行星", rank: CardRank.SS, description: "只能在指定成分的大气层中构成的蓝色矿石，像宇宙中看到的地球。" },
  95: { name: "秘密斗篷", rank: CardRank.A, description: "披上这件斗篷，就可以完全隐藏自己的身形。" },
  // Generic filler for logic, in a real game we'd map all 100
};

export const getSpecifiedCard = (number: number): Card => {
  const defined = FULL_SPECIFIED_CARDS[number];
  if (defined) {
    return {
      id: `spec-${number}-${Date.now()}`,
      number: number,
      name: defined.name!,
      rank: defined.rank! as CardRank,
      type: CardType.SPECIFIED,
      description: defined.description!,
      limit: 10
    };
  }
  // Fallback generator for undefined numbers in demo
  return {
    id: `spec-${number}-${Date.now()}`,
    number: number,
    name: `神秘物品 No.${number}`,
    rank: CardRank.B,
    type: CardType.SPECIFIED,
    description: "贪婪之岛上的一件稀有物品。",
    limit: 10
  };
};