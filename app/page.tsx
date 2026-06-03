"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { ALL_CARDS } from "../lib/cards";
import { STAGES } from "../lib/stages";
import {
  judge, calcBattle, parseEffects, shuffle,
  buildStarterDeck, buildEnemyDeck, aiSelectCard,
  loadSave, writeSave, clearSave, emptySave,
  type AIType, type Card, type Stage, type JudgeResult, type SaveData,
} from "../lib/engine";
import { getSpriteStyle } from "../lib/sprites";

// ═══════════════════════ CONSTANTS ═══════════════════════
const MAX_HAND = 7;
const PLAYER_MAX_HP = 80;
const DRAW_PER_TURN = 2;

const RARITY_LABEL: Record<string, string> = {
  common:"コモン", rare:"レア", epic:"エピック", legendary:"レジェンダリー", mythic:"ミシック",
};
const RARITY_COLOR: Record<string, string> = {
  common:"#6b7280", rare:"#4a9eff", epic:"#a855f7", legendary:"#f59e0b", mythic:"#ff0077",
};
const RARITY_ORDER = ["common","rare","epic","legendary","mythic"];
const CAT_ICON: Record<string, string> = {
  自然:"🌿", 道具:"🔧", 日常:"🏠", 生物:"🐾", 兵器:"⚔️",
  食べ物:"🍚", 現代:"📱", 回復:"💊", 災害:"🌪️", 宇宙:"✨",
  概念:"💭", 防具:"🛡️", 素材:"🔩", テクノロジー:"💻", 鉱物:"💎", 建物:"🏢",
};

// ═══════════════════════ CARD IMAGE ═══════════════════════
function CardImage({ card, className = "" }: { card: Card; className?: string }) {
  const [err, setErr] = useState(false);
  const sprite = getSpriteStyle(card.id);

  if (!err && sprite) {
    return (
      <div
        className={className}
        style={{ ...sprite, width: "100%", height: "100%" }}
        onError={() => setErr(true)}
      />
    );
  }
  if (!err) {
    return (
      <img
        src={card.image}
        alt={card.name}
        className={`w-full h-full object-cover ${className}`}
        onError={() => setErr(true)}
        style={{ display: "block" }}
      />
    );
  }
  // Text fallback
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <span className="text-4xl font-black" style={{ color: "var(--text)" }}>{card.name[0]}</span>
    </div>
  );
}

// ═══════════════════════ CARD COMPONENT ═══════════════════════
function CardComp({
  card, selected, onClick, small, disabled, glow, clashClass = "",
}: {
  card: Card; selected?: boolean; onClick?: () => void;
  small?: boolean; disabled?: boolean; glow?: boolean; clashClass?: string;
}) {
  const mythic = card.rarity === "mythic";
  const catClass = `cat-${card.category}`;
  const rarityClass = `rarity-${card.rarity}`;

  const borderCls = selected ? "border-amber-400 scale-105 shadow-amber-400/40" :
    glow ? "border-green-400/80" : rarityClass;

  if (small) {
    return (
      <button
        onClick={onClick}
        disabled={disabled}
        className={`
          relative rounded-xl border-2 transition-all duration-200 select-none flex-shrink-0
          ${borderCls} ${clashClass}
          ${disabled ? "opacity-50 cursor-not-allowed" : "hover:scale-105 hover:-translate-y-1 active:scale-95 cursor-pointer"}
          ${selected ? "shadow-lg shadow-amber-400/40" : ""}
          ${catClass}
        `}
        style={{ width: 72, minHeight: 98 }}
      >
        <div className="p-1.5 text-center">
          <div className={`text-[10px] font-bold ${mythic ? "rarity-mythic-text" : ""}`}
            style={{ color: mythic ? undefined : RARITY_COLOR[card.rarity] }}>
            {card.rarity[0].toUpperCase()}
          </div>
          <div className="text-sm font-black leading-tight mt-0.5" style={{ color:"var(--text)", wordBreak:"break-all" }}>
            {card.name}
          </div>
          <div className="text-xs font-bold mt-1" style={{ color: RARITY_COLOR[card.rarity] }}>
            {card.attack}
          </div>
          <div className="text-[9px]">{CAT_ICON[card.category]}</div>
        </div>
      </button>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`
        relative rounded-2xl border-2 overflow-hidden transition-all duration-200 select-none
        ${onClick && !disabled ? "hover:scale-[1.02] cursor-pointer" : ""}
        ${disabled ? "opacity-60" : ""}
        ${borderCls} ${clashClass} ${catClass}
      `}
      style={{ width: 154, minHeight: 218 }}
    >
      <div className="px-3 pt-3 pb-1 flex items-center justify-between">
        <span className={`text-[11px] font-bold ${mythic ? "rarity-mythic-text" : ""}`}
          style={{ color: mythic ? undefined : RARITY_COLOR[card.rarity] }}>
          {RARITY_LABEL[card.rarity]}
        </span>
        <span className="text-[11px]">{CAT_ICON[card.category]}</span>
      </div>

      {/* Image area */}
      <div className="mx-2 rounded-lg overflow-hidden" style={{ height: 78, background:"rgba(0,0,0,0.3)" }}>
        <CardImage card={card} className="rounded-lg" />
      </div>

      <div className="px-3 pt-1.5 text-base font-black text-center leading-tight" style={{ color:"var(--text)" }}>
        {card.name}
      </div>
      <div className="px-3 pt-0.5 flex items-center justify-between">
        <span className="text-[10px]" style={{ color:"var(--muted)" }}>{card.category}</span>
        <span className="text-sm font-black" style={{ color: RARITY_COLOR[card.rarity] }}>ATK {card.attack}</span>
      </div>
      {card.effect && (
        <div className="mx-2 mt-1 rounded px-1.5 py-0.5 text-[9px] font-bold text-center"
          style={{ background:"rgba(90,184,112,0.12)", color:"#5ab870" }}>
          ✨ {card.effect}
        </div>
      )}
      <div className="px-3 pt-1 pb-3 text-[10px] leading-snug" style={{ color:"var(--muted)" }}>
        {card.description}
      </div>
    </div>
  );
}

// ═══════════════════════ HP BAR ═══════════════════════
function HPBar({ hp, maxHp, label }: { hp:number; maxHp:number; label:string }) {
  const pct = Math.max(0, Math.min(100, (hp/maxHp)*100));
  const cls = pct>50?"hp-bar-high":pct>25?"hp-bar-mid":"hp-bar-low";
  return (
    <div>
      <div className="flex justify-between text-xs mb-1" style={{ color:"var(--muted)" }}>
        <span>{label}</span>
        <span className="font-mono" style={{ color:"var(--text)" }}>{Math.max(0,hp)} / {maxHp}</span>
      </div>
      <div className="h-3 rounded-full overflow-hidden" style={{ background:"var(--border)" }}>
        <div className={`hp-bar h-full rounded-full ${cls}`} style={{ width:`${pct}%` }} />
      </div>
    </div>
  );
}

// ═══════════════════════ TYPES ═══════════════════════
type Screen = "title"|"stage-select"|"battle"|"reward"|"collection"|"game-over"|"victory";
type ClashColor = ""|"white"|"red"|"green"|"gold"|"rainbow";
type BattlePhase = "player-select"|"cards-entering"|"cards-facing"|"buildup"|"impact"|"result-shown";

interface Particle { id:number; x:number; y:number; vx:number; vy:number; color:string; life:number; }
interface FloatingText { id:number; text:string; color:string; size:string; x:number; y:number; }

interface PlayerState {
  hp:number; deck:Card[]; hand:Card[]; discard:Card[];
  atkBoost:number; shield:number; reviveReady:boolean;
}
interface EnemyState {
  name:string; hp:number; maxHp:number;
  deck:Card[]; hand:Card[]; discard:Card[];
  ai:AIType; description:string; lastCard:Card|null;
}
interface BattleState {
  phase:BattlePhase; turn:number;
  playerCard:Card|null; enemyCard:Card|null;
  result:JudgeResult|null; superEffective:boolean; overkill:boolean;
  damageToEnemy:number; damageToPlayer:number; message:string;
  log:string[]; cardUsage:Record<string,number>;
}

// ═══════════════════════ HELPERS ═══════════════════════
function drawCards(deck:Card[], hand:Card[], discard:Card[], n:number) {
  let d=[...deck], h=[...hand], dis=[...discard];
  for (let i=0;i<n;i++) {
    if (d.length===0){d=shuffle(dis);dis=[];}
    if (d.length===0) break;
    h.push(d.shift()!);
  }
  while (h.length>MAX_HAND) dis.push(h.splice(Math.floor(Math.random()*h.length),1)[0]);
  return {deck:d, hand:h, discard:dis};
}

function ensureHand(e:EnemyState):EnemyState {
  if (e.hand.length>0) return e;
  const d=shuffle([...e.deck,...e.discard]);
  return {...e, deck:d.slice(5), hand:d.slice(0,5), discard:[]};
}

let particleSeq=0;
let floatSeq=0;

// ═══════════════════════ MAIN ═══════════════════════
export default function KotobaBattle() {
  const [screen, setScreen] = useState<Screen>("title");
  const [save, setSave] = useState<SaveData|null>(null);
  const [playerDeck, setPlayerDeck] = useState<Card[]>([]);
  const [currentStage, setCurrentStage] = useState<Stage>(STAGES[0]);
  const [player, setPlayer] = useState<PlayerState|null>(null);
  const [enemy, setEnemy] = useState<EnemyState|null>(null);
  const [battle, setBattle] = useState<BattleState|null>(null);
  const [selectedIdx, setSelectedIdx] = useState<number|null>(null);
  const [rewardCards, setRewardCards] = useState<Card[]>([]);
  const [rewardFlipped, setRewardFlipped] = useState<boolean[]>([false,false,false]);
  const [finalStage, setFinalStage] = useState(1);

  // Effects
  const [clashColor, setClashColor] = useState<ClashColor>("");
  const [isShaking, setIsShaking] = useState(false);
  const [shakeIntensity, setShakeIntensity] = useState<"sm"|"lg">("sm");
  const [flashColor, setFlashColor] = useState("rgba(255,255,255,0.7)");
  const [flashActive, setFlashActive] = useState(false);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [floatingTexts, setFloatingTexts] = useState<FloatingText[]>([]);
  const [criticalText, setCriticalText] = useState("");
  const [criticalColor, setCriticalColor] = useState("white");
  const [bgPulse, setBgPulse] = useState<""|"subtle"|"medium"|"intense">("");

  // Combo
  const [combo, setCombo] = useState(0);
  const [comboVisible, setComboVisible] = useState(false);
  const [pendingRevenge, setPendingRevenge] = useState(false);

  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const playerRef = useRef(player);
  const enemyRef = useRef(enemy);
  const battleRef = useRef(battle);
  const selectedRef = useRef(selectedIdx);
  const comboRef = useRef(combo);
  const pendingRevengeRef = useRef(pendingRevenge);

  playerRef.current = player;
  enemyRef.current = enemy;
  battleRef.current = battle;
  selectedRef.current = selectedIdx;
  comboRef.current = combo;
  pendingRevengeRef.current = pendingRevenge;

  const addTimer = (fn:()=>void, ms:number) => {
    const id = setTimeout(fn, ms);
    timers.current.push(id);
    return id;
  };
  const clearTimers = () => { timers.current.forEach(clearTimeout); timers.current=[]; };

  useEffect(() => { const s=loadSave(); if(s){setSave(s); const d=s.deck.map(id=>ALL_CARDS.find(c=>c.id===id)).filter(Boolean) as Card[]; setPlayerDeck(d);} }, []);
  useEffect(() => () => clearTimers(), []);

  // ── Particles ──────────────────────────────
  const spawnParticles = useCallback((x:number, y:number, count:number, colorFn:()=>string) => {
    const newP: Particle[] = [];
    for (let i=0;i<count;i++) {
      const angle = (Math.PI*2*i)/count + (Math.random()-0.5)*0.5;
      const speed = 120 + Math.random()*180;
      newP.push({ id:particleSeq++, x, y, vx:Math.cos(angle)*speed, vy:Math.sin(angle)*speed, color:colorFn(), life:700+Math.random()*400 });
    }
    setParticles(p=>[...p, ...newP]);
    setTimeout(()=>{ const ids=new Set(newP.map(p=>p.id)); setParticles(p=>p.filter(pp=>!ids.has(pp.id))); }, 1200);
  }, []);

  const addFloat = useCallback((text:string, color:string, size:string, x:number, y:number) => {
    const id = floatSeq++;
    setFloatingTexts(f=>[...f, {id,text,color,size,x,y}]);
    setTimeout(()=>setFloatingTexts(f=>f.filter(t=>t.id!==id)), 1400);
  }, []);

  const doFlash = useCallback((color:string, ms=120) => {
    setFlashColor(color); setFlashActive(true);
    setTimeout(()=>setFlashActive(false), ms);
  }, []);

  const doShake = useCallback((intensity:"sm"|"lg"=("sm"), ms=300) => {
    setShakeIntensity(intensity); setIsShaking(true);
    setTimeout(()=>setIsShaking(false), ms);
  }, []);

  // ── Start / Continue ──────────────────────
  const startNewGame = useCallback(()=>{
    clearSave();
    const d=buildStarterDeck(ALL_CARDS);
    const s=emptySave(d.map(c=>c.id));
    setPlayerDeck(d); setSave(s); writeSave(s);
    setCombo(0); setScreen("stage-select");
  },[]);

  const continueGame = useCallback(()=>setScreen("stage-select"),[]);

  // ── Enter battle ──────────────────────────
  const enterBattle = useCallback((stage:Stage)=>{
    setCurrentStage(stage);
    const isMirror=stage.ai==="mirror";
    const enemyPool = isMirror?[...playerDeck]:buildEnemyDeck(ALL_CARDS, stage);
    const eShuffled=shuffle([...enemyPool]);
    const eHand=eShuffled.splice(0,5);
    const pShuffled=shuffle([...playerDeck]);
    const pHand=pShuffled.splice(0,5);

    setPlayer({hp:PLAYER_MAX_HP, deck:pShuffled, hand:pHand, discard:[], atkBoost:0, shield:0, reviveReady:false});
    setEnemy({name:stage.name, hp:stage.hp, maxHp:stage.hp, deck:eShuffled, hand:eHand, discard:[], ai:stage.ai, description:stage.description, lastCard:null});
    setBattle({phase:"player-select", turn:1, playerCard:null, enemyCard:null, result:null, superEffective:false, overkill:false, damageToEnemy:0, damageToPlayer:0, message:"", log:[], cardUsage:{}});
    setSelectedIdx(null); setClashColor(""); setBgPulse(""); setScreen("battle");
  },[playerDeck]);

  // ── Confirm card — main animation chain ──
  const confirmCard = useCallback(()=>{
    const p=playerRef.current; const e=enemyRef.current; const b=battleRef.current;
    const idx=selectedRef.current;
    if (!p||!e||!b||idx===null) return;

    const pCard=p.hand[idx];
    if(!pCard) return;

    let safeE=ensureHand(e);
    const eCard:Card = aiSelectCard(safeE.ai, safeE.hand, safeE.lastCard, b.cardUsage, p.hand, safeE.hp, safeE.maxHp);

    // Pre-calc result
    const br = calcBattle(pCard, eCard, p.atkBoost+comboRef.current, p.shield);
    const overkill = br.damageToEnemy > 0 && br.damageToEnemy >= safeE.hp;

    // Determine clash color & timings
    let cc: ClashColor = "green";
    let buildupMs = 500;
    if (br.result==="draw")     { cc="white";   buildupMs=500;  }
    else if (br.result==="lose"){ cc="red";     buildupMs=500;  }
    else if (overkill)          { cc="rainbow"; buildupMs=1500; }
    else if (br.superEffective) { cc="gold";    buildupMs=1000; }

    // Phase 1: cards entering
    setBattle(prev=>prev?{...prev, phase:"cards-entering", playerCard:pCard, enemyCard:eCard}:prev);

    // Phase 2: facing (0.6s)
    addTimer(()=> setBattle(prev=>prev?{...prev, phase:"cards-facing"}:prev), 600);

    // Phase 3: buildup start (1.1s)
    addTimer(()=>{ setBattle(prev=>prev?{...prev,phase:"buildup"}:prev); setClashColor(cc); }, 1100);

    // Phase 4: impact
    const impactAt = 1100+buildupMs;
    addTimer(()=>{
      setBattle(prev=>prev?{...prev,phase:"impact",result:br.result,superEffective:br.superEffective,overkill,damageToEnemy:br.damageToEnemy,damageToPlayer:br.damageToPlayer,message:br.message}:prev);

      // Effects by result
      if (overkill) {
        doFlash("rgba(255,255,255,0.85)", 200);
        doShake("lg", 900);
        spawnParticles(window.innerWidth/2, window.innerHeight/2, 28, ()=>{
          const cs=["#ff0077","#7700ff","#00aaff","#00ff88","#f59e0b"];
          return cs[Math.floor(Math.random()*cs.length)];
        });
        addFloat("OVERKILL!!!", "#f59e0b", "2.5rem", window.innerWidth/2, window.innerHeight*0.35);
        setCriticalText("OVERKILL!!!"); setCriticalColor("#f59e0b");
        addFloat(`-${br.damageToEnemy}`, "#f59e0b", "2rem", window.innerWidth/2, window.innerHeight*0.25);
      } else if (br.superEffective && br.result==="win") {
        doFlash("rgba(234,179,8,0.4)", 150);
        doShake("sm", 400);
        spawnParticles(window.innerWidth/2, window.innerHeight/2, 16, ()=>"#f59e0b");
        addFloat("SUPER EFFECTIVE!", "#f59e0b", "1.8rem", window.innerWidth/2, window.innerHeight*0.35);
        setCriticalText("SUPER EFFECTIVE!"); setCriticalColor("#f59e0b");
        addFloat(`-${br.damageToEnemy}`, "#22c55e", "1.6rem", window.innerWidth/2, window.innerHeight*0.25);
      } else if (br.result==="win") {
        spawnParticles(window.innerWidth/2, window.innerHeight/2, 8, ()=>"#22c55e");
        addFloat(`-${br.damageToEnemy}`, "#22c55e", "1.4rem", window.innerWidth/2, window.innerHeight*0.3);
        setCriticalText(""); setCriticalColor("");
      } else if (br.result==="lose") {
        doFlash("rgba(224,85,85,0.35)", 150);
        doShake("sm", 300);
        addFloat(`-${br.damageToPlayer}`, "#e05555", "1.4rem", window.innerWidth/2, window.innerHeight*0.65);
        setCriticalText(""); setCriticalColor("");
      } else {
        setCriticalText(""); setCriticalColor("");
      }

      // Combo
      const prevCombo=comboRef.current;
      if (br.result==="win") {
        const newCombo=prevCombo+1;
        setCombo(newCombo);
        if (pendingRevengeRef.current) {
          setPendingRevenge(false);
          addFloat("REVENGE! +3", "#a855f7", "1.8rem", window.innerWidth/2-60, window.innerHeight*0.45);
        }
        if (newCombo===3) addFloat("🔥 COMBO x3 +2", "#f59e0b", "1.6rem", window.innerWidth*0.8, window.innerHeight*0.4);
        if (newCombo===5) addFloat("🔥🔥 COMBO x5 +5!", "#ff7700", "1.8rem", window.innerWidth*0.8, window.innerHeight*0.4);
        if (newCombo>=7)  addFloat("🌟 UNSTOPPABLE!!!", "#ff0077", "2rem", window.innerWidth*0.8, window.innerHeight*0.4);
        setComboVisible(true);
      } else if (br.result==="lose") {
        if (prevCombo>=3) setPendingRevenge(true);
        setCombo(0); setComboVisible(false);
      }
    }, impactAt);

    // Phase 5: apply result (impact + 1.6s)
    addTimer(()=>{
      setCriticalText("");
      setClashColor("");
      applyResult(pCard, eCard, safeE, br.damageToEnemy, br.damageToPlayer, br.result, br.superEffective, overkill);
    }, impactAt+1600);
  },[spawnParticles, addFloat, doFlash, doShake]);

  // ── Apply result ──────────────────────────
  const applyResult = useCallback((
    pCard:Card, eCard:Card, safeE:EnemyState,
    dmgE:number, dmgP:number, result:JudgeResult,
    superEffective:boolean, overkill:boolean,
  )=>{
    const p=playerRef.current; const b=battleRef.current; const idx=selectedRef.current;
    if (!p||!b||idx===null) return;

    let newPHp=p.hp-dmgP;
    let newEHp=Math.max(0,safeE.hp-dmgE);
    let nAtk=0, nShield=0, nRevive=p.reviveReady;
    let nd=[...p.deck], nh=[...p.hand].filter((_,i)=>i!==idx), ndis=[...p.discard,pCard];

    for (const eff of parseEffects(pCard.effect)) {
      if (eff.type==="heal")      newPHp=Math.min(PLAYER_MAX_HP, newPHp+eff.value);
      if (eff.type==="atkBoost")  nAtk=eff.value;
      if (eff.type==="selfDmg")   newPHp-=eff.value;
      if (eff.type==="shield")    nShield=eff.value;
      if (eff.type==="revive")    nRevive=true;
      if (eff.type==="draw") { const dr=drawCards(nd,nh,ndis,eff.value); nd=dr.deck; nh=dr.hand; ndis=dr.discard; }
    }

    // Combo ATK bonus
    const cBonus = comboRef.current>=7?8:comboRef.current>=5?5:comboRef.current>=3?2:0;
    const revengeBonus = pendingRevengeRef.current && result==="win"?3:0;

    if (newPHp<=0 && nRevive) { newPHp=1; nRevive=false; addFloat("REVIVE!", "#ff0077","1.6rem",window.innerWidth/2,window.innerHeight/2); }

    const drawn=drawCards(nd,nh,ndis,DRAW_PER_TURN); nd=drawn.deck; nh=drawn.hand; ndis=drawn.discard;

    const newEhand=safeE.hand.filter(c=>c.id!==eCard.id);
    const newEDiscard=[...safeE.discard,eCard];
    const newE=ensureHand({...safeE,hp:newEHp,hand:newEhand,discard:newEDiscard,lastCard:eCard});

    const newUsage={...b.cardUsage,[pCard.category]:(b.cardUsage[pCard.category]??0)+1};
    const newLog=[...b.log,`T${b.turn}: ${pCard.name} vs ${eCard.name} → ${result}`];

    // Update bg pulse based on enemy HP
    const ePct=newEHp/safeE.maxHp;
    setBgPulse(ePct>0.7?"":ePct>0.4?"subtle":ePct>0.2?"medium":"intense");

    if (newEHp<=0) { handleVictory(newLog); return; }
    if (newPHp<=0) { handleDefeat(); return; }

    setPlayer({hp:newPHp,deck:nd,hand:nh,discard:ndis,atkBoost:nAtk+revengeBonus,shield:nShield,reviveReady:nRevive});
    setEnemy(newE);
    setBattle(prev=>prev?{...prev,phase:"player-select",turn:prev.turn+1,playerCard:null,enemyCard:null,result:null,superEffective:false,overkill:false,damageToEnemy:0,damageToPlayer:0,message:"",cardUsage:newUsage,log:newLog}:prev);
    setSelectedIdx(null);
  },[addFloat]);

  // ── Victory / Defeat ──────────────────────
  const handleVictory = useCallback((log:string[])=>{
    const sid=currentStage.id;
    setSave(prev=>{
      if(!prev) return prev;
      const cleared=[...new Set([...prev.clearedStages,sid])];
      const updated:SaveData={...prev,clearedStages:cleared,currentStage:Math.min(10,sid+1),bestStage:Math.max(prev.bestStage,sid),totalWins:prev.totalWins+1};
      writeSave(updated); return updated;
    });
    const rarities=sid<=3?["common","common","rare"]:sid<=6?["rare","rare","epic"]:sid<=8?["epic","epic","legendary"]:["legendary","mythic","legendary"];
    const pool=ALL_CARDS.filter(c=>!playerDeck.some(d=>d.id===c.id));
    const rewards=rarities.map(r=>{
      const rp=pool.filter(c=>c.rarity===r); const src=rp.length>0?rp:pool;
      return src[Math.floor(Math.random()*src.length)];
    }).filter(Boolean).slice(0,3);
    setRewardCards(rewards);
    setRewardFlipped([false,false,false]);
    addTimer(()=>setScreen("reward"), 500);
  },[currentStage, playerDeck]);

  const handleDefeat = useCallback(()=>{
    setFinalStage(currentStage.id);
    setSave(prev=>{ if(!prev) return prev; const u={...prev,totalLosses:prev.totalLosses+1}; writeSave(u); return u; });
    addTimer(()=>setScreen("game-over"), 800);
  },[currentStage]);

  // ── Reward pick ──────────────────────────
  const flipRewardCard = useCallback((i:number)=>{
    const card=rewardCards[i];
    if(!card||rewardFlipped[i]) return;
    const ri=RARITY_ORDER.indexOf(card.rarity);
    const delay=ri===0?0:ri===1?500:ri===2?800:ri===3?1200:1800;

    setRewardFlipped(prev=>prev.map((v,idx)=>idx===i?true:v));
    if (ri>=3) {
      addTimer(()=>doFlash(ri>=4?"rgba(255,0,119,0.4)":"rgba(245,158,11,0.4)",200), delay);
      if (ri>=3) addTimer(()=>spawnParticles(window.innerWidth/2,window.innerHeight/2,ri>=4?24:14,()=>ri>=4?["#ff0077","#7700ff","#00aaff"][Math.floor(Math.random()*3)]:"#f59e0b"),delay);
    }
  },[rewardCards,rewardFlipped,doFlash,spawnParticles]);

  const pickReward = useCallback((card:Card|null)=>{
    if (card) {
      const newDeck=[...playerDeck,card].slice(0,20);
      setPlayerDeck(newDeck);
      setSave(prev=>{ if(!prev) return prev; const u={...prev,deck:newDeck.map(c=>c.id)}; writeSave(u); return u; });
    }
    if (currentStage.id>=10) setScreen("victory");
    else setScreen("stage-select");
  },[playerDeck, currentStage]);

  // ══════════════════════ RENDER ══════════════════════

  // ── TITLE ─────────────────────────────────
  if (screen==="title") return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{background:"var(--bg)"}}>
      <div className="fixed inset-0 pointer-events-none" style={{background:"radial-gradient(ellipse at 50% 80%, rgba(99,36,209,0.08),transparent 60%)"}} />
      <div className="w-full max-w-md text-center relative z-10">
        <div className="anim-float inline-block mb-4"><span className="text-7xl">🃏</span></div>
        <h1 className="text-5xl font-black mb-2" style={{color:"var(--accent)"}}>ことばバトル</h1>
        <p className="text-base mb-1" style={{color:"var(--muted)"}}>言葉で戦うカードバトルRPG</p>
        <p className="text-sm mb-8" style={{color:"var(--muted)"}}>「火」は「水」に負け、「包丁」は「風船」を切る。</p>
        <div className="space-y-3 mb-6">
          <button onClick={startNewGame}
            className="w-full py-4 rounded-2xl font-bold text-base transition-all hover:scale-[1.02] active:scale-[0.98]"
            style={{background:"var(--accent)",color:"var(--bg)",boxShadow:"0 4px 24px rgba(200,151,58,0.35)"}}>
            🆕 はじめる
          </button>
          {save && (
            <button onClick={continueGame}
              className="w-full py-4 rounded-2xl font-bold text-base border-2 transition-all hover:scale-[1.02]"
              style={{borderColor:"var(--border)",color:"var(--text)",background:"var(--surface)"}}>
              💾 つづきから（Stage {save.currentStage}）
            </button>
          )}
          {save && (
            <button onClick={()=>setScreen("collection")}
              className="w-full py-3 rounded-2xl font-bold text-sm border transition-all hover:scale-[1.02]"
              style={{borderColor:"var(--border)",color:"var(--muted)",background:"var(--surface)"}}>
              📖 図鑑 ({ALL_CARDS.length}枚)
            </button>
          )}
        </div>
        <div className="rounded-2xl p-4 text-left space-y-1.5" style={{background:"var(--surface)",border:"1px solid var(--border)"}}>
          <div className="text-xs font-bold uppercase tracking-widest mb-2" style={{color:"var(--accent)"}}>ルール</div>
          {["🔴 相性で勝つと1.5倍ダメージ","⚡ 相性なしは純粋にATK比較","🎯 3連勝でコンボボーナス発動","💊 回復カードでHPを戻せる","🔟 全10ステージをクリアせよ"]
            .map(r=><div key={r} className="text-sm" style={{color:"var(--muted)"}}>{r}</div>)}
        </div>
      </div>
    </main>
  );

  // ── STAGE SELECT ──────────────────────────
  if (screen==="stage-select") {
    const cleared=save?.clearedStages??[];
    const maxUnlocked=cleared.length>0?Math.max(...cleared)+1:1;
    return (
      <main className="min-h-screen px-4 py-8" style={{background:"var(--bg)"}}>
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h2 className="text-2xl font-black" style={{color:"var(--text)"}}>ステージ選択</h2>
              <p className="text-xs" style={{color:"var(--muted)"}}>デッキ: {playerDeck.length}枚</p>
            </div>
            <button onClick={()=>setScreen("title")} className="text-xs px-3 py-1.5 rounded-lg border"
              style={{borderColor:"var(--border)",color:"var(--muted)",background:"var(--surface)"}}>← タイトル</button>
          </div>
          <div className="space-y-2">
            {STAGES.map(stage=>{
              const isCleared=cleared.includes(stage.id);
              const isUnlocked=stage.id<=maxUnlocked;
              const isHidden=stage.id===10&&!cleared.includes(9);
              const isNext=stage.id===maxUnlocked&&!isCleared;
              if (isHidden) return (
                <div key={stage.id} className="rounded-xl p-4 border-2 opacity-50" style={{background:"var(--surface)",borderColor:"var(--border)"}}>
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🔒</span>
                    <div><div className="font-bold" style={{color:"var(--muted)"}}>Stage 10: ???</div><div className="text-xs" style={{color:"var(--muted)"}}>Stage 9クリアで解放</div></div>
                  </div>
                </div>
              );
              return (
                <button key={stage.id} disabled={!isUnlocked} onClick={()=>isUnlocked&&enterBattle(stage)}
                  className={`w-full rounded-xl p-4 border-2 text-left transition-all ${isUnlocked?"hover:scale-[1.01] cursor-pointer":"opacity-50 cursor-not-allowed"}`}
                  style={{background:isNext?"rgba(200,151,58,0.08)":"var(--surface)", borderColor:isNext?"#c8973a":isCleared?"#5ab870":"var(--border)", boxShadow:isNext?"0 0 16px rgba(200,151,58,0.15)":undefined}}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{isCleared?"✅":!isUnlocked?"🔒":isNext?"⚔️":"🎯"}</span>
                      <div>
                        <div className="font-bold" style={{color:isNext?"var(--accent)":"var(--text)"}}>Stage {stage.id}: {stage.name}</div>
                        <div className="text-xs" style={{color:"var(--muted)"}}>{stage.description}</div>
                      </div>
                    </div>
                    <div className="text-right text-xs" style={{color:"var(--muted)"}}><div>HP {stage.hp}</div></div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </main>
    );
  }

  // ── BATTLE ────────────────────────────────
  if (screen==="battle"&&player&&enemy&&battle) {
    const isAnimating = battle.phase!=="player-select";
    const ePct = enemy.hp/enemy.maxHp;
    const bgColor = ePct>0.7?"#0a090d":ePct>0.4?"#120a0a":ePct>0.2?"#1a0808":"#200505";

    const clashCls = clashColor?`clash-${clashColor}`:"";

    return (
      <div className={`min-h-[100dvh] flex flex-col relative ${isShaking?`shake-${shakeIntensity}`:""} ${bgPulse?`bg-pulse-${bgPulse}`:""}`}
        style={{background:bgColor, maxWidth:480, margin:"0 auto"}}>

        {/* Flash overlay */}
        <div className={`flash-overlay ${flashActive?"active":""}`} style={{background:flashColor}} />

        {/* Particles */}
        {particles.map(pt=>(
          <div key={pt.id} className="particle" style={{
            left:pt.x, top:pt.y, background:pt.color,
            animation:`float-up-fade ${pt.life}ms ease-out forwards`,
            transform:`translate(${pt.vx*0.01*pt.life/100}px,${pt.vy*0.01*pt.life/100}px)`
          }} />
        ))}

        {/* Floating texts */}
        {floatingTexts.map(ft=>(
          <div key={ft.id} className="floating-text" style={{left:ft.x,top:ft.y,color:ft.color,fontSize:ft.size,transform:"translate(-50%,-50%)"}}>
            {ft.text}
          </div>
        ))}

        {/* Enemy header */}
        <div className="px-4 pt-4 pb-3 flex-shrink-0" style={{background:"var(--surface)",borderBottom:"1px solid var(--border)"}}>
          <div className="flex items-center justify-between mb-2">
            <div>
              <span className="text-xs font-mono uppercase tracking-widest" style={{color:"var(--muted)"}}>Stage {currentStage.id}</span>
              <div className="text-lg font-black" style={{color:"var(--danger)"}}>{enemy.name}</div>
            </div>
            <div className="text-right">
              <div className="text-xs" style={{color:"var(--muted)"}}>Turn {battle.turn}</div>
              {combo>=3 && (
                <div className="text-xs font-bold combo-fire" style={{color:"#f59e0b"}}>🔥 x{combo}</div>
              )}
            </div>
          </div>
          <HPBar hp={enemy.hp} maxHp={enemy.maxHp} label={enemy.name} />
          {ePct<=0.2 && <div className="text-xs font-bold mt-1 text-center" style={{color:"#f59e0b"}}>💥 あと少しで撃破！</div>}
        </div>

        {/* Arena */}
        <div className="flex-1 flex flex-col px-4 py-3 gap-2 relative">

          {/* Critical text */}
          {criticalText && (
            <div className={`absolute top-4 left-0 right-0 text-center pointer-events-none z-10 ${criticalColor==="rarity-mythic-text"?"rarity-mythic-text":""} ${criticalText.includes("OVERKILL")?"overkill-text":"critical-text"}`}
              style={{color:criticalColor,fontSize:"1.5rem",fontWeight:900,textShadow:`0 0 20px ${criticalColor}`}}>
              {criticalText}
            </div>
          )}

          {/* Enemy card */}
          <div className="flex justify-center" style={{minHeight:130}}>
            {battle.enemyCard ? (
              <div className={`
                ${battle.phase==="cards-entering"?"clash-enter-enemy":""}
                ${battle.phase==="result-shown"&&battle.result==="win"?"card-blasting":""}`}>
                <CardComp card={battle.enemyCard} clashClass={clashCls} />
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-2xl border-2 border-dashed w-40 h-28"
                style={{borderColor:"var(--border)",color:"var(--muted)"}}>
                {battle.phase==="player-select"?"？":"…"}
              </div>
            )}
          </div>

          {/* VS / result */}
          <div className="flex items-center justify-center py-1.5 rounded-xl relative"
            style={{background:battle.result?"rgba(255,255,255,0.04)":"transparent", minHeight:48}}>
            {battle.result ? (
              <div className="text-center anim-pop">
                <div className="text-2xl font-black" style={{color:battle.result==="win"?"var(--good)":battle.result==="lose"?"var(--danger)":"var(--muted)"}}>
                  {battle.result==="win"?"🏆 勝利！":battle.result==="lose"?"💀 敗北…":"⚡ 相打ち"}
                </div>
                <div className="text-xs" style={{color:"var(--muted)"}}>{battle.message}</div>
              </div>
            ) : (
              <div className="text-sm font-bold" style={{color:"var(--muted)"}}>
                {battle.phase==="cards-facing"?"── VS ──":battle.phase==="buildup"?"…":battle.phase==="player-select"?"カードを選ぼう":""}
              </div>
            )}
          </div>

          {/* Player card */}
          <div className="flex justify-center" style={{minHeight:130}}>
            {battle.playerCard ? (
              <div className={`
                ${battle.phase==="cards-entering"?"clash-enter-player":""}
                ${battle.phase==="result-shown"&&battle.result==="lose"?"card-cracking":""}`}>
                <CardComp card={battle.playerCard} clashClass={clashCls} />
              </div>
            ) : (
              <div className="flex items-center justify-center rounded-2xl border-2 border-dashed w-40 h-28"
                style={{borderColor:"var(--border)",color:"var(--muted)"}}>
                {selectedIdx!==null?"▼ 確定する":"カードを選ぶ"}
              </div>
            )}
          </div>

          {/* Confirm button */}
          {battle.phase==="player-select"&&selectedIdx!==null && (
            <button onClick={confirmCard}
              className="absolute bottom-0 left-4 right-4 py-3 rounded-xl font-bold anim-pop transition-all hover:scale-[1.02]"
              style={{background:"var(--accent)",color:"var(--bg)",boxShadow:"0 4px 16px rgba(200,151,58,0.4)"}}>
              このカードで戦う！
            </button>
          )}
        </div>

        {/* Hand */}
        <div className="flex-shrink-0 px-4 pt-2 pb-4"
          style={{background:"var(--surface)",borderTop:"1px solid var(--border)"}}>
          <HPBar hp={player.hp} maxHp={PLAYER_MAX_HP} label="あなた" />
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1">
            {player.hand.map((card,i)=>(
              <CardComp key={`${card.id}-${i}`} card={card} small selected={selectedIdx===i}
                disabled={isAnimating}
                onClick={()=>battle.phase==="player-select"&&setSelectedIdx(i)} />
            ))}
          </div>
          <div className="flex justify-between mt-1 text-[10px]" style={{color:"var(--muted)"}}>
            <span>山札:{player.deck.length} 捨:{player.discard.length}</span>
            {player.atkBoost>0&&<span style={{color:"var(--accent)"}}>ATK+{player.atkBoost}</span>}
            {player.shield>0&&<span style={{color:"var(--rare)"}}>🛡 {player.shield}</span>}
          </div>
        </div>
      </div>
    );
  }

  // ── REWARD ────────────────────────────────
  if (screen==="reward") {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-4 py-8" style={{background:"var(--bg)"}}>
        {/* Flash overlay */}
        <div className={`flash-overlay ${flashActive?"active":""}`} style={{background:flashColor}} />
        {particles.map(pt=>(
          <div key={pt.id} className="particle" style={{left:pt.x,top:pt.y,background:pt.color}} />
        ))}

        <div className="w-full max-w-lg">
          <div className="text-center mb-8 anim-slide-up">
            <div className="text-4xl mb-2">🎉</div>
            <h2 className="text-2xl font-black" style={{color:"var(--accent)"}}>Stage {currentStage.id} クリア！</h2>
            <p className="text-sm mt-1" style={{color:"var(--muted)"}}>1枚を選んでデッキに加えよう（タップして開封）</p>
          </div>

          <div className="flex gap-4 justify-center mb-8 flex-wrap">
            {rewardCards.map((card,i)=>{
              const ri=RARITY_ORDER.indexOf(card.rarity);
              const isFlipped=rewardFlipped[i];
              const isSlow=ri>=3;
              return (
                <div key={i} className="card-flip-wrap anim-pop" style={{width:154,height:220,position:"relative",animationDelay:`${i*0.12}s`}}
                  onClick={()=>!isFlipped&&flipRewardCard(i)}>
                  <div className={`card-flip-inner ${isSlow?"slow":""} ${isFlipped?"flipped":""}`} style={{width:"100%",height:"100%"}}>
                    {/* Back */}
                    <div className="card-flip-back">
                      <div className="rounded-2xl border-2 w-full h-full overflow-hidden relative"
                        style={{background:"var(--surface2)",borderColor:"#2a3560",cursor:"pointer"}}>
                        <img
                          src="/cards/card-back.webp"
                          alt="カード裏面"
                          className="w-full h-full object-cover"
                          onError={(e)=>{ (e.target as HTMLImageElement).style.display="none"; }}
                        />
                        <div className="absolute inset-0 flex items-end justify-center pb-3 pointer-events-none">
                          <div className="text-[10px] font-bold" style={{color:"rgba(150,180,255,0.7)"}}>タップして開封</div>
                        </div>
                      </div>
                    </div>
                    {/* Front */}
                    <div className="card-flip-front">
                      <CardComp card={card} glow onClick={()=>pickReward(card)} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {rewardCards.some((_,i)=>rewardFlipped[i]) && (
            <div className="text-center">
              <button onClick={()=>pickReward(null)}
                className="text-sm px-6 py-2 rounded-xl border transition-all hover:opacity-80"
                style={{borderColor:"var(--border)",color:"var(--muted)",background:"var(--surface)"}}>
                スキップ（カードを取らない）
              </button>
            </div>
          )}
        </div>
      </main>
    );
  }

  // ── COLLECTION ───────────────────────────
  if (screen==="collection") {
    const groups = ["common","rare","epic","legendary","mythic"].map(r=>({
      rarity:r, cards:ALL_CARDS.filter(c=>c.rarity===r)
    }));
    return (
      <main className="min-h-screen px-4 py-6" style={{background:"var(--bg)"}}>
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-black" style={{color:"var(--text)"}}>📖 ことば図鑑</h2>
            <button onClick={()=>setScreen("title")} className="text-xs px-3 py-1.5 rounded-lg border"
              style={{borderColor:"var(--border)",color:"var(--muted)",background:"var(--surface)"}}>← 戻る</button>
          </div>
          <div className="text-sm mb-5" style={{color:"var(--muted)"}}>{ALL_CARDS.length}枚のことばカード</div>
          {groups.map(g=>(
            <div key={g.rarity} className="mb-6">
              <div className="text-xs font-bold uppercase tracking-widest mb-3" style={{color:RARITY_COLOR[g.rarity]}}>
                {RARITY_LABEL[g.rarity]} — {g.cards.length}枚
              </div>
              <div className="grid grid-cols-2 gap-2">
                {g.cards.map(card=>(
                  <div key={card.id} className={`rounded-xl border p-2 flex items-center gap-2 rarity-${card.rarity} ${`cat-${card.category}`}`}
                    style={{borderWidth:"1px"}}>
                    <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0" style={{background:"rgba(0,0,0,0.3)"}}>
                      <CardImage card={card} />
                    </div>
                    <div>
                      <div className="text-sm font-bold" style={{color:"var(--text)"}}>{card.name}</div>
                      <div className="text-[10px]" style={{color:"var(--muted)"}}>ATK {card.attack} · {card.category}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </main>
    );
  }

  // ── GAME OVER ─────────────────────────────
  if (screen==="game-over") return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{background:"var(--bg)"}}>
      <div className="w-full max-w-sm text-center anim-pop">
        <div className="text-6xl mb-4">💀</div>
        <h2 className="text-3xl font-black mb-2" style={{color:"var(--danger)"}}>GAME OVER</h2>
        <p className="mb-6" style={{color:"var(--muted)"}}>Stage {finalStage} で敗北…</p>
        <div className="rounded-xl p-4 mb-6 text-left space-y-2" style={{background:"var(--surface)",border:"1px solid var(--border)"}}>
          <div className="flex justify-between text-sm"><span style={{color:"var(--muted)"}}>到達</span><span className="font-bold">Stage {finalStage}</span></div>
          <div className="flex justify-between text-sm"><span style={{color:"var(--muted)"}}>勝利数</span><span className="font-bold" style={{color:"var(--good)"}}>{save?.totalWins??0}</span></div>
          <div className="flex justify-between text-sm"><span style={{color:"var(--muted)"}}>敗北数</span><span className="font-bold" style={{color:"var(--danger)"}}>{save?.totalLosses??0}</span></div>
        </div>
        <div className="space-y-3">
          <button onClick={startNewGame} className="w-full py-4 rounded-2xl font-bold transition-all hover:scale-[1.02]"
            style={{background:"var(--accent)",color:"var(--bg)"}}>最初からやり直す</button>
          <button onClick={()=>setScreen("stage-select")} className="w-full py-3 rounded-2xl font-bold border transition-all hover:opacity-80"
            style={{borderColor:"var(--border)",color:"var(--text)",background:"var(--surface)"}}>クリア済みで練習</button>
        </div>
      </div>
    </main>
  );

  // ── VICTORY ───────────────────────────────
  if (screen==="victory") return (
    <main className="min-h-screen flex flex-col items-center justify-center px-4" style={{background:"var(--bg)"}}>
      <div className="w-full max-w-sm text-center anim-pop">
        <div className="text-6xl mb-4 anim-float">🏆</div>
        <h2 className="text-3xl font-black mb-2 rarity-mythic-text">VICTORY!</h2>
        <p className="mb-6 text-sm" style={{color:"var(--muted)"}}>全10ステージクリア！言葉の真の使い手になった。</p>
        <div className="space-y-3">
          <button onClick={startNewGame} className="w-full py-4 rounded-2xl font-bold transition-all hover:scale-[1.02]"
            style={{background:"var(--accent)",color:"var(--bg)"}}>🔄 もう一度プレイ</button>
          <a href={`https://x.com/intent/tweet?text=${encodeURIComponent("ことばバトル全10ステージクリア！言葉で戦うカードRPG\n→ kotoba-battle.vercel.app")}`}
            target="_blank" rel="noopener noreferrer"
            className="block w-full py-3 rounded-2xl font-bold text-center border"
            style={{background:"var(--surface)",color:"var(--text)",borderColor:"var(--border)"}}>
            𝕏 Xでシェア
          </a>
        </div>
      </div>
    </main>
  );

  return null;
}
