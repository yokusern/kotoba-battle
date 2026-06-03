"use client";
// ================================================================
// TYPES
// ================================================================
export type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";
export type JudgeResult = "win" | "lose" | "draw";
export type AIType = "random" | "aggressive" | "highAtk" | "counter" | "balanced" | "adaptive" | "optimal" | "mirror";

export interface Card {
  id: string;
  name: string;
  attack: number;
  rarity: Rarity;
  category: string;
  tags: string[];
  beats: string[];
  losesTo: string[];
  effect?: string;
  description: string;
  image: string;
}

export interface Stage {
  id: number;
  name: string;
  hp: number;
  ai: AIType;
  description: string;
  categories: string[];
  rarities: Rarity[];
  deckSize: number;
}

export interface ParsedEffect {
  type: string;
  value: number;
}

export interface BattleResult {
  result: JudgeResult;
  superEffective: boolean;
  damageToEnemy: number;
  damageToPlayer: number;
  message: string;
}

export interface SaveData {
  currentStage: number;
  deck: string[];
  clearedStages: number[];
  totalWins: number;
  totalLosses: number;
  totalDraws: number;
  bestStage: number;
  damageRecord: Record<string, number>;
}

// ================================================================
// JUDGE
// ================================================================
export function judge(playerCard: Card, enemyCard: Card): JudgeResult {
  const playerWins = playerCard.beats.some(b => enemyCard.tags.includes(b));
  const enemyWins = enemyCard.beats.some(b => playerCard.tags.includes(b));

  if (playerWins && !enemyWins) return "win";
  if (!playerWins && enemyWins) return "lose";
  if (playerWins && enemyWins) {
    return playerCard.attack >= enemyCard.attack ? "win" : "lose";
  }
  const diff = playerCard.attack - enemyCard.attack;
  if (diff > 2) return "win";
  if (diff < -2) return "lose";
  return "draw";
}

export function calcBattle(
  playerCard: Card,
  enemyCard: Card,
  playerAtkBoost: number,
  playerShield: number,
): BattleResult {
  // Special: 運 = random
  if (playerCard.effect === "random" || enemyCard.effect === "random") {
    const r = Math.random() < 0.5;
    return r
      ? { result: "win", superEffective: false, damageToEnemy: playerCard.attack + playerAtkBoost, damageToPlayer: 0, message: "運がよかった！" }
      : { result: "lose", superEffective: false, damageToEnemy: 0, damageToPlayer: enemyCard.attack, message: "運が悪かった…" };
  }

  const result = judge(playerCard, enemyCard);
  const superEffective = playerCard.beats.some(b => enemyCard.tags.includes(b));
  const enemySuperEffective = enemyCard.beats.some(b => playerCard.tags.includes(b));

  let damageToEnemy = 0;
  let damageToPlayer = 0;
  let message = "";

  const pAtk = playerCard.attack + playerAtkBoost;

  if (result === "win") {
    damageToEnemy = superEffective ? Math.floor(pAtk * 1.5) : pAtk;
    message = superEffective ? "相性勝ち！ CRITICAL!" : "勝利！";
  } else if (result === "lose") {
    const raw = enemySuperEffective ? Math.floor(enemyCard.attack * 1.5) : enemyCard.attack;
    damageToPlayer = Math.max(0, raw - playerShield);
    message = enemySuperEffective ? "相性で負けた…" : "敗北…";
  } else {
    message = "相打ち";
  }

  return { result, superEffective, damageToEnemy, damageToPlayer, message };
}

// ================================================================
// EFFECT PARSING
// ================================================================
export function parseEffects(effect: string | undefined): ParsedEffect[] {
  if (!effect) return [];
  return effect.split(",").map(e => {
    const [type, val] = e.split(":");
    return { type: type.trim(), value: val ? parseInt(val) : 0 };
  });
}

// ================================================================
// DECK BUILDING
// ================================================================
export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function buildStarterDeck(allCards: Card[]): Card[] {
  const commons = allCards.filter(c => c.rarity === "common");
  const attack = shuffle(commons.filter(c => !c.effect && c.attack >= 3)).slice(0, 5);
  const defense = shuffle(commons.filter(c => c.tags.includes("防御") || c.tags.includes("盾"))).slice(0, 2);
  const heal = shuffle(commons.filter(c => c.effect?.startsWith("heal"))).slice(0, 2);
  const used = new Set([...attack, ...defense, ...heal].map(c => c.id));
  const rest = shuffle(commons.filter(c => !used.has(c.id))).slice(0, 6);
  return shuffle([...attack, ...defense, ...heal, ...rest]);
}

export function buildEnemyDeck(allCards: Card[], stage: Stage): Card[] {
  const pool = allCards.filter(c =>
    stage.categories.includes(c.category) || stage.rarities.includes(c.rarity)
  );
  const filtered = pool.filter(c => stage.rarities.includes(c.rarity));
  const base = filtered.length >= stage.deckSize
    ? shuffle(filtered).slice(0, stage.deckSize)
    : shuffle([...filtered, ...shuffle(pool)]).slice(0, stage.deckSize);
  return shuffle(base.length >= 5 ? base : shuffle(allCards).slice(0, stage.deckSize));
}

// ================================================================
// AI
// ================================================================
export function aiSelectCard(
  ai: AIType,
  hand: Card[],
  playerLastCard: Card | null,
  playerCardUsage: Record<string, number>,
  playerHand: Card[],
  enemyHp: number,
  enemyMaxHp: number,
): Card {
  if (hand.length === 0) throw new Error("empty hand");

  switch (ai) {
    case "random":
      return hand[Math.floor(Math.random() * hand.length)];

    case "aggressive":
    case "highAtk":
      return hand.reduce((best, c) => c.attack > best.attack ? c : best);

    case "counter": {
      if (!playerLastCard) return hand[Math.floor(Math.random() * hand.length)];
      const counters = hand.filter(c =>
        c.beats.some(b => playerLastCard.tags.includes(b))
      );
      return counters.length > 0
        ? counters.reduce((best, c) => c.attack > best.attack ? c : best)
        : hand.reduce((best, c) => c.attack > best.attack ? c : best);
    }

    case "balanced": {
      const hpRatio = enemyHp / enemyMaxHp;
      if (hpRatio < 0.4) {
        const healCards = hand.filter(c => c.effect?.startsWith("heal"));
        if (healCards.length > 0) return healCards[0];
      }
      return hand.reduce((best, c) => c.attack > best.attack ? c : best);
    }

    case "adaptive": {
      // Find most used player category and use cards that beat it
      const topCategory = Object.entries(playerCardUsage)
        .sort(([, a], [, b]) => b - a)[0]?.[0];
      if (topCategory) {
        const counters = hand.filter(c =>
          c.beats.some(b => b === topCategory)
        );
        if (counters.length > 0) return counters[0];
      }
      return hand.reduce((best, c) => c.attack > best.attack ? c : best);
    }

    case "optimal": {
      // Score each hand card against likely player cards
      if (playerHand.length === 0) return hand[Math.floor(Math.random() * hand.length)];
      let bestCard = hand[0];
      let bestScore = -999;
      for (const ec of hand) {
        let score = 0;
        for (const pc of playerHand) {
          const r = judge(pc, ec); // from player's perspective
          if (r === "lose") score += ec.attack; // enemy wins
          else if (r === "win") score -= pc.attack;
        }
        if (score > bestScore) { bestScore = score; bestCard = ec; }
      }
      return bestCard;
    }

    case "mirror": {
      // Pick highest attack (same logic as player would)
      return hand.reduce((best, c) => c.attack > best.attack ? c : best);
    }

    default:
      return hand[Math.floor(Math.random() * hand.length)];
  }
}

// ================================================================
// SAVE / LOAD
// ================================================================
const SAVE_KEY = "kotoba-battle-save";

export function loadSave(): SaveData | null {
  try {
    const s = localStorage.getItem(SAVE_KEY);
    return s ? JSON.parse(s) : null;
  } catch { return null; }
}

export function writeSave(data: SaveData): void {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch {}
}

export function clearSave(): void {
  try { localStorage.removeItem(SAVE_KEY); } catch {}
}

export function emptySave(deckIds: string[]): SaveData {
  return {
    currentStage: 1,
    deck: deckIds,
    clearedStages: [],
    totalWins: 0,
    totalLosses: 0,
    totalDraws: 0,
    bestStage: 1,
    damageRecord: {},
  };
}
