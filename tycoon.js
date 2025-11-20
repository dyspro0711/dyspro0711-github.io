// -----------------------------------------------------------
// 0. Game Constants and Setup (상수 및 초기 설정)
// -----------------------------------------------------------

const LOCAL_STORAGE_KEY = 'cookieTycoonData_v12'; // 버전 변경 (버그 수정)
const ENDING_GOAL = 1e18;
const BUFF_DURATION_SECONDS = 60;
const BUFF_CPS_MULTIPLIER = 5;
const SPECIAL_TIER_COST_FACTOR = 500;
const SPECIAL_TIER_COST_INCREASE = 10;
const AUTOSAVE_INTERVAL_MS = 30000;
const LUCK_ITEM_BASE_DROP_RATE = 0.00005155; 

const CRAFT_BUFF_DURATION_SECONDS = 300; // 5분
const CRAFT_BUFF_CPS_MULTIPLIER = 10;
// [추가] 클릭 포션 상수
const CLICK_POTION_DURATION_SECONDS = 30;
const CLICK_POTION_MULTIPLIER = 5;


// -----------------------------------------------------------
// 1. Global State Variables (전역 상태 변수)
// -----------------------------------------------------------
let score = 0;
let totalCookiesEver = 0;
let clickBaseValue = 1;
let clickValue = 1;
let cps = 0;
let prestigePoints = 0;
let prestigeCount = 0; 
let prestigeBonus = 1.0;
let gachaBonus = 1.0; 
let luckBonus = 1.0;
let isBuffActive = false; 
let buffEndTime = 0;
let isGameLoaded = false;
let lastSaveTime = new Date().getTime();
let gameLoopInterval = null;
let lastTime = performance.now();

let gachaCost = 100; 
let permanentGachaBonus_CPS = 1.0; 

let researchPoints = 0;
let researchGodBonus = 1.0; 

// 제작 포션 상태 변수
let isCraftBuffActive = false; 
let craftBuffEndTime = 0;
let craftBuffCpsMultiplier = 1.0;

// [신규 추가] 클릭 포션 상태 변수
let isClickBuffActive = false; 
let clickBuffEndTime = 0; 
let clickBuffMultiplier = 1.0; 


// -----------------------------------------------------------
// 2. Data Definitions (건물, 업그레이드, 아이템 정의)
// -----------------------------------------------------------
const buildings = [
    { id: 'cursor', name: '커서', icon: '🖱️', description: '클릭당 쿠키와 초당 +0.3 쿠키를 만듭니다.', baseCost: 15, baseCps: 0.3, count: 0, costMultiplier: 1.2 },
    { id: 'grandma', name: '할머니', icon: '👵', description: '따뜻한 사랑으로 초당 +0.5 쿠키를 만듭니다.', baseCost: 100, baseCps: 0.5, count: 0, costMultiplier: 1.2 },
    { id: 'farm', name: '농장', icon: '🌾', description: '쿠키 씨앗을 키워 초당 +4 쿠키를 만듭니다.', baseCost: 1100, baseCps: 4, count: 0, costMultiplier: 1.2 },
    { id: 'mine', name: '광산', icon: '⛏️', description: '쿠키 반죽을 채굴하여 초당 +20 쿠키를 만듭니다.', baseCost: 12000, baseCps: 20, count: 0, costMultiplier: 1.2 },
    { id: 'factory', name: '공장', icon: '🏭', description: '자동화된 생산 라인으로 초당 +100 쿠키를 만듭니다.', baseCost: 130000, baseCps: 100, count: 0, costMultiplier: 1.2 },
    { id: 'temple', name: '쿠키 신전', icon: '🏛️', description: '쿠키 신을 모셔 초당 +500 쿠키를 만듭니다.', baseCost: 1400000, baseCps: 500, count: 0, costMultiplier: 1.2 },
    { id: 'bank', name: '쿠키 은행', icon: '🏦', description: '이자 농사로 초당 +3000 쿠키를 만듭니다.', baseCost: 20000000, baseCps: 3000, count: 0, costMultiplier: 1.2 },
    { id: 'wizard_tower', name: '마법사의 탑', icon: '🧙', description: '마나로 쿠키를 소환하여 초당 +18000 쿠키를 만듭니다.', baseCost: 300000000, baseCps: 18000, count: 0, costMultiplier: 1.2 },
    { id: 'transport_ship', name: '수송선', icon: '🚀', description: '우주를 누비며 초당 +100000 쿠키를 가져옵니다.', baseCost: 5000000000, baseCps: 100000, count: 0, costMultiplier: 1.2 },
    { id: 'alchemy_lab', name: '연금술 실험실', icon: '⚗️', description: '모든 것을 쿠키로 변환하여 초당 +500000 쿠키를 만듭니다.', baseCost: 90000000000, baseCps: 500000, count: 0, costMultiplier: 1.2 },
    { id: 'portal', name: '포털', icon: '🌀', description: '다른 차원에서 쿠키를 빨아들여 초당 +3000000 쿠키를 만듭니다.', baseCost: 1500000000000, baseCps: 3000000, count: 0, costMultiplier: 1.2 },
    { id: 'time_machine', name: '타임머신', icon: '⏳', description: '과거의 쿠키를 가져와 초당 +45,000,000 쿠키를 만듭니다.', baseCost: 1e14, baseCps: 45000000, count: 0, costMultiplier: 1.2 },
    { id: 'antimatter_condenser', name: '반물질 응축기', icon: '⚛️', description: '반물질을 쿠키로 변환하여 초당 +675,000,000 쿠키를 만듭니다.', baseCost: 1e16, baseCps: 675000000, count: 0, costMultiplier: 1.2 }
];
const clickUpgrades = [
    { id: 'finger_tip', name: '손가락 단련', description: '클릭당 생산량 x2', baseCost: 100, multiplier: 2, isPurchased: false },
    { id: 'double_click', name: '더블 클릭 매크로', description: '클릭당 생산량 x2', baseCost: 5000, multiplier: 2, isPurchased: false },
    { id: 'hyper_click', name: '하이퍼 클릭 회로', description: '클릭당 생산량 x2', baseCost: 1e6, multiplier: 2, isPurchased: false },
    { id: 'cosmic_click', name: '우주적 클릭 증폭', description: '클릭당 생산량 x2', baseCost: 1e9, multiplier: 2, isPurchased: false },
];
const specialUpgrades = buildings.map(b => {
    if (b.id === 'cursor') return null;
    return {
        buildingId: b.id,
        buildingName: b.name,
        tiers: [
            { id: 1, name: '초가속화 I', multiplier: 2, costFactor: 1, isPurchased: false },
            { id: 2, name: '메가 증폭 II', multiplier: 4, costFactor: SPECIAL_TIER_COST_INCREASE, isPurchased: false },
            { id: 3, name: '갤럭시 배가 III', multiplier: 8, costFactor: SPECIAL_TIER_COST_INCREASE * 10, isPurchased: false },
            { id: 4, name: '퀀텀 융합 IV', multiplier: 16, costFactor: SPECIAL_TIER_COST_INCREASE * 100, isPurchased: false },
            { id: 5, name: '무한 동력 V', multiplier: 32, costFactor: SPECIAL_TIER_COST_INCREASE * 1000, isPurchased: false },
        ]
    };
}).filter(u => u !== null);

const newGachaItems = [
    { id: 'C', name: 'Common', percent: 49.04, color: 'gacha-common', description: 'cps 10%증가.' }, 
    { id: 'U', name: 'Uncommon', percent: 37.0, color: 'gacha-uncommon', description: 'cps 20%증가.' },
    { id: 'R', name: 'Rare', percent: 10.0, color: 'gacha-rare', description: 'cps 50%증가.' },
    { id: 'L', name: 'Legendary', percent: 2.4, color: 'gacha-legendary', description: '영구적인 전역 생산량 +100% 증가.' },
    { id: 'Mystic', name: 'Mystic', percent: 1.0, color: 'gacha-mystic', description: 'cps 200%증가.' },
    { id: 'God', name: 'God', percent: 0.5, color: 'gacha-god', description: '연구 포인트 획득량 영구적으로 2배 증가.' },
    { id: 'Secret', name: 'Secret', percent: 0.05, color: 'gacha-secret', description: '전역 생산량 영구적으로 500% 증가.' },
    { id: 'Cookie', name: 'Cookie', percent: 0.01, color: 'gacha-cookie', description: '전역 생산량 영구적으로 1000% 증가.' }
];

const dropItems = [
    // 영구 유지 아이템 (isPermanent: true)
    { id: 'shadow', name: '그림자 쿠키', icon: '🌑', color: 'text-gray-400', rarity: 0.0001718, count: 0, passive: false, isPermanent: true },
    { id: 'divine', name: '신성한 쿠키', icon: '✨', color: 'text-yellow-400', rarity: 0.0001718, count: 0, passive: false, isPermanent: true },
    { id: 'time', name: '시간의 쿠키 (버프)', icon: '⏳', color: 'text-blue-500', rarity: 0.0005155, count: 0, passive: false, isPermanent: true },
    { id: 'luck', name: '행운의 쿠키 (즉시 사용)', icon: '🍀', color: 'text-green-500', rarity: LUCK_ITEM_BASE_DROP_RATE, count: 0, passive: false, isPermanent: true },
    { id: 'explosion', name: '폭발 쿠키 (즉시 사용)', icon: '💥', color: 'text-red-500', rarity: 0.0005155, count: 0, passive: false, isPermanent: true },
    { id: 'dragon_scale', name: '용의 비늘', icon: '🐲', color: 'text-red-600', rarity: 0.0001, count: 0, passive: false, isPermanent: true },
    
    // 재료 아이템 (isPermanent: false)
    { id: 'bronze_dust', name: '청동 가루', icon: '✨', color: 'text-yellow-600', rarity: 0.005, count: 0, passive: false, isPermanent: false },
    { id: 'silver_shard', name: '은 조각', icon: '✨', color: 'text-gray-300', rarity: 0.004, count: 0, passive: false, isPermanent: false },
    { id: 'gold_leaf', name: '금박', icon: '✨', color: 'text-yellow-400', rarity: 0.003, count: 0, passive: false, isPermanent: false },
    { id: 'sapphire_chip', name: '사파이어 조각', icon: '💎', color: 'text-blue-400', rarity: 0.002, count: 0, passive: false, isPermanent: false },
    { id: 'ruby_fragment', name: '루비 파편', icon: '💎', color: 'text-red-400', rarity: 0.002, count: 0, passive: false, isPermanent: false },
    { id: 'emerald_gem', name: '에메랄드 원석', icon: '💎', color: 'text-green-400', rarity: 0.001, count: 0, passive: false, isPermanent: false },
    { id: 'ancient_gear', name: '고대 부품', icon: '⚙️', color: 'text-gray-500', rarity: 0.001, count: 0, passive: false, isPermanent: false },
    { id: 'mystic_orb', name: '신비한 보주', icon: '🔮', color: 'text-purple-400', rarity: 0.0005, count: 0, passive: false, isPermanent: false },
    { id: 'cosmic_essence', name: '우주 정수', icon: '🌌', color: 'text-indigo-400', rarity: 0.0002, count: 0, passive: false, isPermanent: false },
    { id: 'forgotten_scroll', name: '잊힌 두루마리', icon: '📜', color: 'text-yellow-200', rarity: 0.0005, count: 0, passive: false, isPermanent: false },
    { id: 'starlight_dust', name: '별빛 가루', icon: '🌟', color: 'text-yellow-300', rarity: 0.005, count: 0, passive: false, isPermanent: false },
    { id: 'shadow_dust', name: '그림자 가루', icon: '🌑', color: 'text-purple-700', rarity: 0.001, count: 0, passive: false, isPermanent: false },
    { id: 'holy_spark', name: '신성한 불꽃', icon: '✨', color: 'text-white', rarity: 0.001, count: 0, passive: false, isPermanent: false },
    { id: 'chaos_shard', name: '혼돈의 파편', icon: '💥', color: 'text-red-500', rarity: 0.0001, count: 0, passive: false, isPermanent: false }
];

const craftingRecipes = [
    // 영구 패시브 아이템
    {
        id: 'cookie_catalyst', 
        name: '쿠키 촉매제', 
        description: 'CPS를 1.05배 증가시킵니다. (영구)', 
        icon: '🔥', 
        type: 'cps', 
        multiplier: 1.05,
        isCrafted: false, 
        cost: [
            { itemId: 'bronze_dust', quantity: 10 },
            { itemId: 'silver_shard', quantity: 5 },
        ]
    },
    // 버프 포션 아이템 (CPS 포션)
    {
        id: 'super_potion', 
        name: '슈퍼 부스트 포션', 
        description: '사용 시 5분 동안 CPS가 10배 증가합니다.',
        icon: '🧪', 
        type: 'potion', 
        multiplier: CRAFT_BUFF_CPS_MULTIPLIER, 
        duration: CRAFT_BUFF_DURATION_SECONDS, 
        isCrafted: false, 
        craftCount: 0, 
        cost: [
            { itemId: 'sapphire_chip', quantity: 10 },
            { itemId: 'ruby_fragment', quantity: 10 },
            { itemId: 'forgotten_scroll', quantity: 5 },
        ]
    },
    // 버프 포션 아이템 (클릭 포션)
    {
        id: 'click_potion', 
        name: '클릭 가속 포션', 
        description: '사용 시 30초 동안 클릭당 생산량이 5배 증가합니다.', 
        icon: '⚡', 
        type: 'click_potion', 
        multiplier: CLICK_POTION_MULTIPLIER, 
        duration: CLICK_POTION_DURATION_SECONDS, 
        isCrafted: false, 
        craftCount: 0, 
        cost: [
            { itemId: 'starlight_dust', quantity: 40 }, 
            { itemId: 'gold_leaf', quantity: 10 }, 
            { itemId: 'silver_shard', quantity: 30 }, 
        ]
    },
    // 뽑기 리셋 아이템 (소모성)
    {
        id: 'gacha_reset_item', 
        name: '초심자의 나침반', 
        description: '사용 시 뽑기 비용을 100 쿠키로 초기화합니다. (1회성, 영구 보너스 유지)',
        icon: '🧭', 
        type: 'gacha_reset_item', 
        isCrafted: false, 
        craftCount: 0, 
        cost: [
            { itemId: 'dragon_scale', quantity: 5 },
            { itemId: 'bronze_dust', quantity: 100 },
            { itemId: 'time', quantity: 15 },
            { itemId: 'cosmic_essence', quantity: 6 },
        ]
    },
    // 나머지 영구 패시브 아이템
    {
        id: 'lucky_charm', 
        name: '행운의 부적', 
        description: '드랍 아이템 획득 확률이 2배 증가합니다. (영구)', 
        icon: '🌟',
        type: 'luck', 
        multiplier: 2,
        isCrafted: false, 
        cost: [
            { itemId: 'luck', quantity: 2 }, 
            { itemId: 'divine', quantity: 2 },
        ]
    },
    {
        id: 'hyper_booster', 
        name: '하이퍼 부스터', 
        description: '클릭당 생산량을 2배 증가시킵니다. (영구)',
        icon: '⚡', 
        type: 'click', 
        multiplier: 2,
        isCrafted: false, 
        cost: [
            { itemId: 'explosion', quantity: 2 }, 
            { itemId: 'shadow', quantity: 5 },
        ]
    },
    {
        id: 'catalyst_2', 
        name: '쿠키 촉매제 II', 
        description: 'CPS를 1.1배 증가시킵니다. (영구)',
        icon: '🔥', 
        type: 'cps', 
        multiplier: 1.1,
        isCrafted: false, 
        cost: [
            { itemId: 'bronze_dust', quantity: 50 },
            { itemId: 'silver_shard', quantity: 25 },
        ]
    },
    {
        id: 'booster_2', 
        name: '하이퍼 부스터 II', 
        description: '클릭당 생산량을 1.5배 증가시킵니다. (영구)',
        icon: '⚡', 
        type: 'click', 
        multiplier: 1.5,
        isCrafted: false, 
        cost: [
            { itemId: 'starlight_dust', quantity: 50 },
            { itemId: 'gold_leaf', quantity: 10 },
        ]
    },
    {
        id: 'lucky_charm_2', 
        name: '행운의 부적 II', 
        description: '드랍 아이템 획득 확률이 1.2배 증가합니다. (영구)',
        icon: '🌟', 
        type: 'luck', 
        multiplier: 1.2,
        isCrafted: false, 
        cost: [
            { itemId: 'sapphire_chip', quantity: 10 },
            { itemId: 'ruby_fragment', quantity: 10 },
        ]
    },
    {
        id: 'catalyst_3', 
        name: '쿠키 촉매제 III', 
        description: 'CPS를 1.2배 증가시킵니다. (영구)',
        icon: '🔥', 
        type: 'cps', 
        multiplier: 1.2,
        isCrafted: false, 
        cost: [
            { itemId: 'emerald_gem', quantity: 10 },
            { itemId: 'ancient_gear', quantity: 15 },
        ]
    },
    {
        id: 'booster_3', 
        name: '하이퍼 부스터 III', 
        description: '클릭당 생산량을 2배 증가시킵니다. (영구)',
        icon: '⚡', 
        type: 'click', 
        multiplier: 2.0,
        isCrafted: false, 
        cost: [
            { itemId: 'mystic_orb', quantity: 5 },
            { itemId: 'forgotten_scroll', quantity: 10 },
        ]
    },
    {
        id: 'catalyst_4', 
        name: '우주 촉매제', 
        description: 'CPS를 1.5배 증가시킵니다. (영구)',
        icon: '🌌', 
        type: 'cps', 
        multiplier: 1.5,
        isCrafted: false, 
        cost: [
            { itemId: 'cosmic_essence', quantity: 10 },
            { itemId: 'shadow_dust', quantity: 20 },
            { itemId: 'holy_spark', quantity: 20 },
        ]
    },
    {
        id: 'final_booster', 
        name: '궁극의 부스터', 
        description: '클릭당 생산량을 3배 증가시킵니다. (영구)',
        icon: '🐲', 
        type: 'click', 
        multiplier: 3.0,
        isCrafted: false, 
        cost: [
            { itemId: 'dragon_scale', quantity: 5 },
            { itemId: 'chaos_shard', quantity: 10 },
        ]
    },
];

const researchTree = [
    { id: 'core_prod_1', name: '쿠키 공학', description: '모든 건물 생산량 영구 +1% (반복 가능)', baseCost: 1, level: 0, costMultiplier: 1.5, type: 'repeatable' },
    { id: 'core_click_1', name: '클릭 동기화', description: 'CPS의 0.1%를 클릭당 쿠키에 영구 추가', baseCost: 3, isPurchased: false, type: 'onetime' },
    { id: 'meta_prestige_1', name: '환생의 지혜', description: '환생 시 획득 프레스티지 +5%', baseCost: 5, isPurchased: false, type: 'onetime' },
    { id: 'qol_bulk_1', name: '대량 구매 해금', description: '건물 10개/100개씩 구매 버튼 해금', baseCost: 10, isPurchased: false, type: 'onetime' },
    { 
        id: 'meta_craft_keep', 
        name: '불멸의 연금술', 
        description: '제작된 모든 아이템(패시브)이 환생 후에도 영구적으로 유지됩니다.', 
        baseCost: 20, 
        isPurchased: false, 
        type: 'onetime' 
    }
];

// -----------------------------------------------------------
// 3. Helper Functions (도우미 함수)
// -----------------------------------------------------------

function formatNumber(num) {
    if (num === null || num === undefined) return '0';
    if (num < 1e3) return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    
    const suffixes = ["K", "M", "B", "T", "Qd", "Qn", "Sx", "Sp", "Oc", "No", "Dc"];
    let suffixIndex = -1;
    let shortNum = num;

    for (let i = 0; i < suffixes.length; i++) {
        if (Math.abs(shortNum) >= 1e3) {
            shortNum /= 1e3;
            suffixIndex = i;
        } else {
            break;
        }
    }
    
    if (suffixIndex === -1) return Math.floor(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return shortNum.toFixed(2).replace(/\.00$/, '') + suffixes[suffixIndex];
}

function calculateEnhancementBonus(level) {
    if (level <= 0) return 1.0;
    
    // 1. 선형 보너스 (1 + 레벨 * 0.1)
    const linearBonus = 1.0 + (level * 0.1);
    
    // 2. 등급별 기하급수 승수
    let gradeMultiplier = 1.0; // 1-10강 (기본)
    
    if (level >= 11 && level <= 20) {
        gradeMultiplier = 1.5; // 희귀
    } else if (level >= 21 && level <= 30) {
        gradeMultiplier = 2.5; // 전설
    } else if (level >= 31 && level <= 40) {
        gradeMultiplier = 5.0; // 신화
    } else if (level >= 41) { // 41-50강 (궁극)
        gradeMultiplier = 10.0;
    }

    return linearBonus * gradeMultiplier;
}

function showTemporaryMessage(message, bgColor = 'bg-green-500') {
    const msgEl = document.getElementById('temporary-message');
    if (!msgEl) { console.warn("Temporary message element not found!"); return; }
    msgEl.textContent = message;
    msgEl.className = `fixed bottom-5 left-1/2 transform -translate-x-1/2 p-3 rounded-xl shadow-2xl z-50 text-white font-semibold opacity-100 ${bgColor} pointer-events-none transition-opacity duration-300`;
    setTimeout(() => {
        msgEl.classList.remove('opacity-100');
        msgEl.classList.add('opacity-0');
    }, 1500);
}

function createClickAnimation(amount) {
    const cookieBtn = document.getElementById('cookie');
    if (!cookieBtn) return;
    const clickText = document.createElement('div');
    
    if (amount < 1 && !isBuffActive && !isCraftBuffActive && !isClickBuffActive) return; 
    
    clickText.textContent = `+${formatNumber(amount)}`;
    clickText.className = 'absolute font-extrabold text-2xl text-yellow-300 pointer-events-none opacity-100 transition-all duration-1000';
    
    const rect = cookieBtn.getBoundingClientRect();
    const startX = Math.random() * (rect.width * 0.5) - (rect.width * 0.25);
    const startY = Math.random() * (rect.height * 0.5) - (rect.height * 0.25);
    clickText.style.left = `${rect.left + rect.width / 2 + startX}px`;
    clickText.style.top = `${rect.top + rect.height / 2 + startY}px`;
    clickText.style.zIndex = '100';

    document.body.appendChild(clickText);

    requestAnimationFrame(() => {
        clickText.style.transition = 'opacity 1s, transform 1s';
        clickText.style.transform = 'translate(0, -60px) scale(1.5)';
        clickText.style.opacity = '0';
    });
    setTimeout(() => {
        if (clickText) clickText.remove();
    }, 1000);
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content-item').forEach(el => {
        el.classList.add('hidden');
    });
    const selectedTab = document.getElementById(tabId);
    if (selectedTab) {
        selectedTab.classList.remove('hidden');
    }

    document.querySelectorAll('.tab-button').forEach(btn => {
        btn.classList.remove('active', 'bg-gray-600', 'border-b-4', 'border-yellow-500');
        btn.classList.add('bg-gray-700');
    });
    const selectedButton = document.querySelector(`[data-tab="${tabId}"]`);
    if (selectedButton) {
        selectedButton.classList.add('active', 'bg-gray-600');
        selectedButton.classList.remove('bg-gray-700');
    }
}


// -----------------------------------------------------------
// 4. Game Logic & Core Calculations (핵심 로직)
// -----------------------------------------------------------

function getBuildingCost(building) {
    return building.baseCost * Math.pow(building.costMultiplier, building.count);
}

function calculateGameStats() {
    let newCPS = 0;
    let newClickBaseValue = 1;

    // 1. 건물 CPS 계산 및 특수 업그레이드 적용
    buildings.forEach(b => {
        let buildingCPS = b.baseCps * b.count;
        
        const specialUpgradeGroup = specialUpgrades.find(u => u.buildingId === b.id);
        if (specialUpgradeGroup) {
            let tierMultiplier = 1;
            specialUpgradeGroup.tiers.forEach(tier => {
                if (tier.isPurchased) {
                    tierMultiplier = tier.multiplier;
                }
            });
            buildingCPS *= tierMultiplier;
        }

        newCPS += buildingCPS;
        if (b.id === 'cursor') {
            newClickBaseValue += b.baseCps * b.count; 
        }
    });

    // 2. 클릭 업그레이드 적용 
    clickUpgrades.forEach(u => {
        if (u.isPurchased) {
            newClickBaseValue *= u.multiplier;
        }
    });

    // 3. 제작 아이템 (패시브) 적용
    let craftCpsBonus = 1.0;
    let craftClickBonus = 1.0;
    let craftLuckBonus = 1.0;

    craftingRecipes.forEach(recipe => {
        if (recipe.isCrafted && (recipe.type === 'cps' || recipe.type === 'click' || recipe.type === 'luck')) { 
            if (recipe.type === 'cps') {
                craftCpsBonus *= recipe.multiplier;
            } else if (recipe.type === 'click') {
                craftClickBonus *= recipe.multiplier;
            } else if (recipe.type === 'luck') {
                craftLuckBonus *= recipe.multiplier;
            }
        }
    });
    
    newCPS *= craftCpsBonus;
    newClickBaseValue *= craftClickBonus;
    luckBonus = craftLuckBonus; 

    // 4. 프레스티지 보너스 적용
    prestigeBonus = 1.0 + (prestigePoints * 0.02);
    newCPS *= prestigeBonus;
    newClickBaseValue *= prestigeBonus;

    // 5. 뽑기 보너스 적용
    newCPS *= permanentGachaBonus_CPS;
    newClickBaseValue *= permanentGachaBonus_CPS;

    // 6. 연구 트리 보너스 적용
    const researchCoreProd = researchTree.find(r => r.id === 'core_prod_1');
    const coreProdBonus = (researchCoreProd.level * 0.01); 
    newCPS *= (1.0 + coreProdBonus);
    newClickBaseValue *= (1.0 + coreProdBonus);

    // 7. 시간 가속 버프 적용 (CPS)
    if (isBuffActive) {
        newCPS *= BUFF_CPS_MULTIPLIER;
    }

    // 8. 제작 아이템 버프 적용 (CPS) - 포션 버프
    if (isCraftBuffActive) {
        newCPS *= craftBuffCpsMultiplier;
    }

    // 9. 제작 아이템 버프 적용 (클릭) - 클릭 포션 버프
    if (isClickBuffActive) {
        newClickBaseValue *= clickBuffMultiplier;
    }
    
    // 10. 클릭 동기화 적용 (CPS가 모두 계산된 후)
    const researchClickSync = researchTree.find(r => r.id === 'core_click_1');
    if (researchClickSync.isPurchased) {
        newClickBaseValue += (newCPS * 0.001); 
    }

    // 최종 값 업데이트
    cps = newCPS;
    clickBaseValue = newClickBaseValue;
    clickValue = newClickBaseValue;
}

function clickCookie() {
    if (!isGameLoaded) return;
    score += clickValue;
    totalCookiesEver += clickValue;
    createClickAnimation(clickValue);
    checkItemDrop();
    updateUI();
    renderBuildings(); 
    renderUpgrades(); 
    renderCrafting(); 
    renderInventory(); 
}

function checkItemDrop() {
    const luckMultiplier = luckBonus;
    dropItems.forEach(item => {
        const actualDropRate = item.rarity * luckMultiplier;
        if (Math.random() < actualDropRate) {
            item.count++;
            showTemporaryMessage(`${item.icon} ${item.name} 획득!`, 'bg-indigo-600');
        }
    });
}

function buyBuilding(buildingId, amount = 1) {
    const building = buildings.find(b => b.id === buildingId);
    if (!building) return;

    let cost = 0;
    let currentCount = building.count;
    for(let i=0; i < amount; i++) {
        cost += building.baseCost * Math.pow(building.costMultiplier, currentCount + i);
    }

    if (score >= cost) {
        score -= cost;
        building.count += amount; 
        calculateGameStats();
        updateUI();
        renderBuildings();
        renderUpgrades();
        renderCrafting();
    } else {
        showTemporaryMessage('쿠키가 부족합니다!', 'bg-red-600');
    }
}

function buyUpgrade(upgradeId) {
    // 1. 클릭 증폭 업그레이드 처리
    const upgrade = clickUpgrades.find(u => u.id === upgradeId);
    if (upgrade && !upgrade.isPurchased) {
        if (score >= upgrade.baseCost) {
            score -= upgrade.baseCost;
            upgrade.isPurchased = true;
            showTemporaryMessage(`${upgrade.name} 구매 완료!`, 'bg-blue-600');
            calculateGameStats();
            updateUI();
            renderUpgrades();
        } else {
            showTemporaryMessage('쿠키가 부족합니다!', 'bg-red-600');
        }
        return;
    }

    // 2. 특수 티어 업그레이드 처리
    const [buildingId, tierIdStr] = upgradeId.split('_');
    if (buildingId && tierIdStr) {
        const tierId = parseInt(tierIdStr, 10);
        const specialGroup = specialUpgrades.find(u => u.buildingId === buildingId);
        if (!specialGroup) return;
        const building = buildings.find(b => b.id === buildingId);
        if (!building) return;
        const tier = specialGroup.tiers.find(t => t.id === tierId);
        if (!tier || tier.isPurchased) return;
        if (tier.id > 1) {
            const prevTier = specialGroup.tiers.find(t => t.id === tier.id - 1);
            if (!prevTier || !prevTier.isPurchased) {
                showTemporaryMessage('이전 티어 업그레이드가 필요합니다.', 'bg-yellow-600');
                return;
            }
        }
        const cost = building.baseCost * tier.costFactor;
        if (score >= cost) {
            score -= cost;
            tier.isPurchased = true;
            showTemporaryMessage(`${building.name}의 ${tier.name} 업그레이드 구매 완료!`, 'bg-blue-600');
            calculateGameStats();
            updateUI();
            renderUpgrades();
        } else {
            showTemporaryMessage('쿠키가 부족합니다!', 'bg-red-600');
        }
    }
}

function craftItem(recipeId) {
    const recipe = craftingRecipes.find(r => r.id === recipeId);
    if (!recipe) return;

    // [수정] 모든 포션/소모성 아이템 타입 확인
    const isConsumable = recipe.type === 'potion' || recipe.type === 'click_potion' || recipe.type === 'gacha_reset_item';
    
    // 패시브 아이템이고 이미 제작되었으면 중단
    if (!isConsumable && recipe.isCrafted) return;

    let canCraft = true;
    recipe.cost.forEach(costItem => {
        const inventoryItem = dropItems.find(i => i.id === costItem.itemId);
        if (!inventoryItem || inventoryItem.count < costItem.quantity) {
            canCraft = false;
        }
    });

    if (canCraft) {
        recipe.cost.forEach(costItem => {
            const inventoryItem = dropItems.find(i => i.id === costItem.itemId);
            inventoryItem.count -= costItem.quantity;
        });
        
        if (isConsumable) { // [수정] 포션/소모성 아이템은 수량 증가
            recipe.craftCount++;
            showTemporaryMessage(`${recipe.icon} ${recipe.name} 제작 완료! 인벤토리에서 확인하세요.`, 'bg-teal-500');
        } else {
            // 패시브 아이템
            recipe.isCrafted = true;
            showTemporaryMessage(`${recipe.name} 제작 완료! 패시브 효과가 적용됩니다.`, 'bg-teal-500');
            calculateGameStats();
        }
        
        updateUI();
        renderCrafting();
        renderInventory();
    } else {
        showTemporaryMessage('제작 재료가 부족합니다!', 'bg-red-600');
    }
}

function useItem(itemId) {
    const item = dropItems.find(i => i.id === itemId);
    
    // 1. 드랍 아이템 사용
    if (item && item.count > 0) {
        if (item.id === 'time') {
            if (isBuffActive) {
                showTemporaryMessage('이미 시간 가속 버프가 활성화되어 있습니다.', 'bg-yellow-600');
                return;
            }
            item.count--;
            isBuffActive = true;
            buffEndTime = new Date().getTime() + (BUFF_DURATION_SECONDS * 1000);
            showTemporaryMessage(`⏳ 시간 가속 버프 발동! CPS x${BUFF_CPS_MULTIPLIER} (60초)`, 'bg-blue-500');
            calculateGameStats();
        } else if (item.id === 'explosion') {
            const bonusCookies = score * 0.10;
            item.count--;
            score += bonusCookies;
            totalCookiesEver += bonusCookies;
            showTemporaryMessage(`💥 폭발 쿠키 사용! +${formatNumber(bonusCookies)} 쿠키 획득!`, 'bg-red-500');
        } else if (item.id === 'luck') {
            const bonusCookies = score * 0.01;
            item.count--;
            score += bonusCookies;
            totalCookiesEver += bonusCookies;
            showTemporaryMessage(`🍀 행운 쿠키 사용! +${formatNumber(bonusCookies)} 쿠키 획득!`, 'bg-green-500');
        } else {
            showTemporaryMessage('이 아이템은 사용 불가한 재료입니다.', 'bg-gray-500');
            return;
        }
    } 
    // 2. 포션/소모성 아이템 사용 (제작 레시피를 통해 찾음)
    else {
        // [수정] gacha_reset_item 타입 추가
        const potionRecipe = craftingRecipes.find(r => 
            (r.id === itemId && (r.type === 'potion' || r.type === 'click_potion' || r.type === 'gacha_reset_item'))
        );
        
        if (potionRecipe && potionRecipe.craftCount > 0) {
            
            if (potionRecipe.type === 'potion') { // CPS 포션
                if (isCraftBuffActive) {
                    showTemporaryMessage('이미 CPS 제작 버프가 활성화되어 있습니다.', 'bg-yellow-600');
                    return;
                }
                potionRecipe.craftCount--;
                isCraftBuffActive = true;
                craftBuffCpsMultiplier = potionRecipe.multiplier;
                craftBuffEndTime = new Date().getTime() + (potionRecipe.duration * 1000);
                showTemporaryMessage(`${potionRecipe.icon} ${potionRecipe.name} 발동! CPS x${potionRecipe.multiplier} (${potionRecipe.duration / 60}분)`, 'bg-purple-500');
                
            } else if (potionRecipe.type === 'click_potion') { // 클릭 포션
                if (isClickBuffActive) {
                    showTemporaryMessage('이미 클릭 제작 버프가 활성화되어 있습니다.', 'bg-yellow-600');
                    return;
                }
                potionRecipe.craftCount--;
                isClickBuffActive = true;
                clickBuffMultiplier = potionRecipe.multiplier;
                clickBuffEndTime = new Date().getTime() + (potionRecipe.duration * 1000);
                showTemporaryMessage(`${potionRecipe.icon} ${potionRecipe.name} 발동! 클릭 x${potionRecipe.multiplier} (30초)`, 'bg-red-500');
            
            } else if (potionRecipe.type === 'gacha_reset_item') { // [신규] 뽑기 리셋
                if (gachaCost <= 100) { 
                    showTemporaryMessage('뽑기 비용이 이미 100 쿠키입니다.', 'bg-yellow-600');
                    return; 
                }
                potionRecipe.craftCount--;
                gachaCost = 100; // 뽑기 비용 초기화
                showTemporaryMessage(`${potionRecipe.icon} ${potionRecipe.name} 사용! 뽑기 비용이 100 쿠키로 초기화됩니다.`, 'bg-green-500');
            }
            
            calculateGameStats();
        } else {
            showTemporaryMessage('사용할 수량이 없거나 알 수 없는 아이템입니다.', 'bg-gray-500');
            return;
        }
    }
    
    updateUI();
    renderInventory();
    renderCrafting(); 
}

function tryGacha() {
    if (score < gachaCost) {
        showTemporaryMessage(`뽑기에 ${formatNumber(gachaCost)} 쿠키가 필요합니다.`, 'bg-red-600');
        return;
    }

    score -= gachaCost;
    gachaCost *= 10;

    let roll = Math.random() * 100; 
    let cumulativePercent = 0;
    let resultItem = null;

    for (const item of newGachaItems) {
        cumulativePercent += item.percent;
        if (roll <= cumulativePercent) {
            resultItem = item;
            break;
        }
    }
    
    if (!resultItem) {
        resultItem = newGachaItems[0];
    }

    const resultDisplay = document.getElementById('gacha-results');
    resultDisplay.innerHTML = `<span class="${resultItem.color} font-bold">[${resultItem.name}]</span> 획득! <p class="text-sm">${resultItem.description}</p>`;
    resultDisplay.classList.add('animate-pulse');
    setTimeout(() => resultDisplay.classList.remove('animate-pulse'), 1000);
    showTemporaryMessage(`${resultItem.name} 획득!`, 'bg-red-800');

    applyGachaEffect(resultItem.id);

    renderGachaItems(); 
}

function applyGachaEffect(itemId) {
    switch (itemId) {
        case 'C':
            permanentGachaBonus_CPS += 0.1;
            score += (clickValue * 10); 
            showTemporaryMessage('Common 효과! 영구 CPS +0.1%!', 'bg-gray-500');
            break;
        case 'U':
            permanentGachaBonus_CPS += 0.2;
            showTemporaryMessage('Uncommon 효과! 영구 CPS +0.2%', 'bg-gray-500');
            break;
        case 'R':
            permanentGachaBonus_CPS += 0.5;
            showTemporaryMessage('Rare 효과! 영구 CPS +0.5%', 'bg-yellow-500');
            break;
        case 'L':
            permanentGachaBonus_CPS += 1.0;
            showTemporaryMessage('Legendary 효과! 영구 전역 생산량 +100% 적용!', 'bg-blue-500');
            break;
        case 'Mystic':
            permanentGachaBonus_CPS += 2.0;
            showTemporaryMessage('Mystic 효과! 영구 전역 생산량 +200% 적용!', 'bg-purple-500');
            break;
        case 'God':
            researchGodBonus = 2.0; 
            showTemporaryMessage('God 효과! 연구 포인트 획득량 영구 2배!', 'bg-purple-500');
            break;
        case 'Secret':
            permanentGachaBonus_CPS += 5.0;
            showTemporaryMessage('Secret 효과! 영구 전역 생산량 +500% 적용!', 'bg-red-500'); 
            break;
        case 'Cookie':
            permanentGachaBonus_CPS += 10.0;
            showTemporaryMessage('Cookie 효과! 영구 전역 생산량 +1000% 적용!', 'bg-orange-500');
            break;
    }
    calculateGameStats();
    updateUI();
}

function calculatePrestigePoints() {
    if (totalCookiesEver < 1e9) return 0;
    const logValue = Math.log10(totalCookiesEver);
    let points = Math.floor(15 * logValue - 135); 

    const researchPrestige = researchTree.find(r => r.id === 'meta_prestige_1');
    if (researchPrestige && researchPrestige.isPurchased) {
        points *= 1.05; 
    }
    
    return Math.max(0, Math.floor(points)); 
}

function ascend() {
    const potentialPoints = calculatePrestigePoints();
    const pointsToAdd = potentialPoints - prestigePoints;
    
    if (pointsToAdd < 1) {
        showTemporaryMessage('최소 1 프레스티지 포인트를 얻어야 환생할 수 있습니다.', 'bg-yellow-600');
        return;
    }

    const confirmAscend = () => {
        prestigePoints += pointsToAdd; 
        prestigeCount++; 
        
        const researchPointsToAdd = Math.floor(pointsToAdd / 10) * researchGodBonus;
        if (researchPointsToAdd > 0) {
            researchPoints += researchPointsToAdd;
            showTemporaryMessage(`+${formatNumber(researchPointsToAdd)} 연구 포인트 획득!`, 'bg-blue-500');
        }

        // 1. 기본 값 초기화
        score = 0;
        totalCookiesEver = 0;
        cps = 0;
        clickBaseValue = 1;
        
        // [수정] 뽑기 비용은 '초심자의 나침반' 사용 여부와 관계없이 환생 횟수에 따라 리셋됩니다.
        gachaCost = 100 * Math.pow(10, prestigeCount); 

        // 2. 버프 초기화
        isBuffActive = false;
        buffEndTime = 0;
        isCraftBuffActive = false;
        craftBuffEndTime = 0;
        craftBuffCpsMultiplier = 1.0;
        isClickBuffActive = false;
        clickBuffEndTime = 0;
        clickBuffMultiplier = 1.0;

        // 3. 건물/업그레이드/제작 초기화
        buildings.forEach(b => b.count = 0);
        clickUpgrades.forEach(u => u.isPurchased = false);
        specialUpgrades.forEach(g => g.tiers.forEach(t => t.isPurchased = false));
        
        const keepCraftedResearch = researchTree.find(r => r.id === 'meta_craft_keep');

        // '불멸의 연금술' 연구가 구매되지 않은 경우에만 초기화
        if (!keepCraftedResearch || !keepCraftedResearch.isPurchased) {
            craftingRecipes.filter(r => r.type !== 'potion' && r.type !== 'click_potion' && r.type !== 'gacha_reset_item').forEach(r => r.isCrafted = false);
        } else {
             showTemporaryMessage('🌟 제작 아이템이 불멸의 연금술로 유지되었습니다.', 'bg-yellow-800');
        }
        
        // 포션/소모성 아이템 수량은 초기화
        craftingRecipes.filter(r => r.type === 'potion' || r.type === 'click_potion' || r.type === 'gacha_reset_item').forEach(r => r.craftCount = 0); 

        // 4. 드랍 아이템 초기화 (isPermanent: true인 아이템은 유지)
        dropItems.forEach(i => {
            if (!i.isPermanent) {
                i.count = 0;
            }
        });

        calculateGameStats();
        updateUI();
        renderBuildings();
        renderUpgrades();
        renderInventory();
        renderCrafting();
        renderResearchTree(); 
        
        document.getElementById('confirmation-modal')?.remove();
        showTemporaryMessage(`🌌 환생 완료! +${formatNumber(pointsToAdd)} 프레스티지 포인트 획득!`, 'bg-purple-600');
        switchTab('building-tab');
    };

    const modalHtml = `
    <div id="confirmation-modal" class="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50 p-4">
        <div class="bg-gray-800 p-6 rounded-2xl shadow-2xl border border-purple-700 max-w-sm w-full">
            <h3 class="text-2xl font-bold text-purple-400 mb-3">🌌 환생 확인</h3>
            <p class="text-gray-300 mb-4">정말로 환생하시겠습니까?</p>
            <p class="text-yellow-400 font-semibold p-3 bg-purple-900/50 rounded-lg mb-5">
                +${formatNumber(pointsToAdd)} 프레스티지 포인트를 획득하고, 대부분의 진행도(일부 아이템/연구/뽑기 보너스 제외)가 초기화됩니다.
            </p>
            <div class="flex space-x-4 pt-3">
                <button id="confirm-ascend" class="flex-1 bg-purple-600 text-white font-bold py-2 rounded-lg hover:bg-purple-700 transition-colors">
                    환생 실행
                </button>
                <button id="cancel-ascend" class="flex-1 bg-gray-600 text-white font-bold py-2 rounded-lg hover:bg-gray-700 transition-colors">
                    취소
                </button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);
    
    document.getElementById('confirm-ascend').onclick = confirmAscend;
    document.getElementById('cancel-ascend').onclick = () => document.getElementById('confirmation-modal').remove();
}

function resetGameData() {
    const isConfirmed = window.confirm("정말로 모든 게임 기록을 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다!");
    
    if (isConfirmed) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        alert("게임 기록이 초기화되었습니다.");
        location.reload();
    }
}


// -----------------------------------------------------------
// 5. Game Loop & Update (게임 루프 및 상태 업데이트)
// -----------------------------------------------------------

function gameLoop(timestamp) {
    if (!isGameLoaded) {
        gameLoopInterval = requestAnimationFrame(gameLoop);
        return;
    }

    const delta = timestamp - lastTime;
    lastTime = timestamp;

    const cookiesToAdd = cps * (delta / 1000);
    score += cookiesToAdd;
    totalCookiesEver += cookiesToAdd;

    // 시간의 쿠키 버프 체크 (CPS)
    if (isBuffActive) {
        if (new Date().getTime() > buffEndTime) {
            isBuffActive = false;
            showTemporaryMessage('⏳ 시간 가속 버프가 종료되었습니다.', 'bg-gray-500');
            calculateGameStats();
        }
    }

    // 제작 포션 버프 체크 (CPS)
    if (isCraftBuffActive) {
        if (new Date().getTime() > craftBuffEndTime) {
            isCraftBuffActive = false;
            craftBuffCpsMultiplier = 1.0;
            showTemporaryMessage('🧪 CPS 제작 버프가 종료되었습니다.', 'bg-gray-500');
            calculateGameStats();
        }
    }
    
    // 클릭 포션 버프 체크 (클릭)
    if (isClickBuffActive) {
        if (new Date().getTime() > clickBuffEndTime) {
            isClickBuffActive = false;
            clickBuffMultiplier = 1.0;
            showTemporaryMessage('⚡ 클릭 제작 버프가 종료되었습니다.', 'bg-gray-500');
            calculateGameStats();
        }
    }

    if (score >= ENDING_GOAL) {
        document.getElementById('ending-message').classList.remove('hidden');
    } else {
        document.getElementById('ending-message').classList.add('hidden');
    }

    if (new Date().getTime() - lastSaveTime > AUTOSAVE_INTERVAL_MS) {
        saveGame(true);
        lastSaveTime = new Date().getTime();
    }

    updateUI();
    renderBuildings();
    renderUpgrades();
    renderCrafting();
    renderResearchTree(); 
    
    gameLoopInterval = requestAnimationFrame(gameLoop);
}

function updateUI() {
    document.getElementById('score').innerHTML = formatNumber(score);
    document.getElementById('cps-display').querySelector('span').textContent = formatNumber(cps);
    document.getElementById('click-value-display').querySelector('span').textContent = formatNumber(clickValue);

    const potentialPoints = calculatePrestigePoints();
    const pointsToAdd = potentialPoints - prestigePoints;
    
    document.getElementById('prestige-points').textContent = formatNumber(prestigePoints);
    
    const ppBonus = ((prestigeBonus - 1.0) * 100).toFixed(2);
    const gachaBonus = ((permanentGachaBonus_CPS - 1.0) * 100).toFixed(1);

    document.getElementById('prestige-bonus-display').innerHTML = `
        프레스티지 보너스: <span class="font-bold text-purple-400">${ppBonus}%</span>
        (클릭/CPS x${prestigeBonus.toFixed(2)})
    `;
    document.getElementById('gacha-bonus-display').innerHTML = `
        뽑기 보너스(영구): <span class="font-bold text-red-400">+${gachaBonus}%</span>
        (클릭/CPS x${permanentGachaBonus_CPS.toFixed(1)})
    `;

    const godBonusDisplay = document.getElementById('god-bonus-display');
    if (godBonusDisplay) {
        if (researchGodBonus > 1.0) {
            godBonusDisplay.textContent = `연구 포인트 획득: x${researchGodBonus.toFixed(1)}`;
            godBonusDisplay.classList.remove('hidden');
        } else {
            godBonusDisplay.classList.add('hidden');
        }
    }

    const ascensionInfo = document.getElementById('ascension-info');
    const ascensionButton = document.getElementById('ascension-button');

    if (pointsToAdd > 0) {
        ascensionInfo.textContent = `환생 시 +${formatNumber(pointsToAdd)} 포인트를 획득하고 모든 것이 초기화됩니다.`;
        ascensionInfo.classList.remove('hidden');
        ascensionButton.classList.remove('opacity-50', 'cursor-not-allowed');
        ascensionButton.classList.add('hover:bg-purple-700');
    } else {
        ascensionInfo.textContent = '아직 환생으로 획득할 포인트가 없습니다.';
        ascensionInfo.classList.add('hidden');
        ascensionButton.classList.add('opacity-50', 'cursor-not-allowed');
        ascensionButton.classList.remove('hover:bg-purple-700');
    }

    document.getElementById('gacha-cost-display').textContent = formatNumber(gachaCost);
    const gachaButton = document.getElementById('gacha-button');
    if (score >= gachaCost) {
        gachaButton.classList.remove('opacity-50', 'cursor-not-allowed');
    } else {
        gachaButton.classList.add('opacity-50', 'cursor-not-allowed');
    }
    document.getElementById('luck-bonus-display').textContent = `드랍 확률 보너스: x${luckBonus.toFixed(1)}`;

    const buffDisplay = document.getElementById('buff-status-display');
    let buffMessages = [];
    if (isBuffActive) {
        const remainingTime = Math.ceil((buffEndTime - new Date().getTime()) / 1000);
        buffMessages.push(`⏳ 시간 쿠키 (x${BUFF_CPS_MULTIPLIER}) - ${remainingTime}초`);
    }
    if (isCraftBuffActive) {
        const remainingTime = Math.ceil((craftBuffEndTime - new Date().getTime()) / 1000);
        buffMessages.push(`🧪 제작 포션 (CPS x${craftBuffCpsMultiplier}) - ${remainingTime}초`);
    }
    if (isClickBuffActive) {
        const remainingTime = Math.ceil((clickBuffEndTime - new Date().getTime()) / 1000);
        buffMessages.push(`⚡ 클릭 포션 (클릭 x${clickBuffMultiplier}) - ${remainingTime}초`);
    }

    if (buffMessages.length > 0) {
        buffDisplay.innerHTML = buffMessages.join(' | ');
        buffDisplay.classList.remove('hidden');
    } else {
        buffDisplay.classList.add('hidden');
    }

    // [핵심 수정] ID를 'luck-rate-display'로 변경하고 innerHTML로 값을 설정합니다.
    const luckBonusDisplay = document.getElementById('luck-rate-display');
    if (luckBonusDisplay) {
        luckBonusDisplay.innerHTML = `x${luckBonus.toFixed(2)}`;
    }
    // --- 단어장 사이트 버튼 활성화 로직 (환생 3회 조건) ---
    const wordbookLink = document.getElementById('wordbook-link');
    const wordbookDesc = document.getElementById('wordbook-desc');
    const wordbookURL = 'https://bangok.riroschool.kr/word.php?db=1201'; // 목표 URL

    if (wordbookLink && wordbookDesc) {
        if (prestigeCount >= 3) {
            // [잠금 해제 상태] (환생 3회 이상)
            wordbookDesc.textContent = '리로그 스쿨 단어장 사이트로 바로 이동합니다.';
            wordbookLink.href = wordbookURL; // 실제 링크 설정
            wordbookLink.target = '_blank';   // 새 탭에서 열기
            
            // Tailwind 클래스: 활성화 (노란색 배경, 커서 허용)
            wordbookLink.classList.remove('opacity-50', 'cursor-not-allowed', 'bg-gray-600', 'hover:bg-gray-600');
            wordbookLink.classList.add('bg-yellow-600', 'hover:bg-yellow-700');
            
        } else {
            // [잠금 상태] (환생 3회 미만)
            wordbookDesc.textContent = `환생을 3회 이상 달성하면 잠금 해제됩니다. (현재 ${prestigeCount}회)`;
            wordbookLink.href = '#';          // 링크 비활성화
            wordbookLink.target = '_self';    // 새 탭 방지
            
            // Tailwind 클래스: 비활성화 (회색 배경, 커서 금지, 반투명)
            wordbookLink.classList.remove('bg-yellow-600', 'hover:bg-yellow-700');
            wordbookLink.classList.add('opacity-50', 'cursor-not-allowed', 'bg-gray-600', 'hover:bg-gray-600');
        }
    }
}

// -----------------------------------------------------------
// 6. Rendering Functions (UI 렌더링)
// -----------------------------------------------------------

function renderBuildings() {
    const container = document.getElementById('buildings-container');
    if (!container) return;
    let html = '';
    buildings.forEach(b => {
        const cost = getBuildingCost(b);
        const canAfford = score >= cost;
        
        const researchBulk = researchTree.find(r => r.id === 'qol_bulk_1');
        const bulkUnlocked = researchBulk && researchBulk.isPurchased;
        
        const itemHtml = `
            <div class="building-item p-3 flex items-center space-x-4 ${canAfford ? '' : 'opacity-50 pointer-events-none'} border-l-4 ${canAfford ? 'border-yellow-500' : 'border-gray-600'}">
                <div class="text-4xl">${b.icon}</div>
                <div class="flex-grow">
                    <p class="font-bold text-lg">${b.name} (<span class="text-yellow-300">${formatNumber(b.count)}</span>)</p>
                    <p class="text-xs text-gray-400">${b.description}</p>
                    <p class="text-sm font-semibold ${canAfford ? 'text-yellow-500' : 'text-red-400'}">비용: ${formatNumber(cost)} Cookies</p>
                </div>
                <div class="flex flex-col space-y-1 min-w-[70px]">
                    <button onclick="${canAfford ? `buyBuilding('${b.id}', 1)` : ''}" class="bg-yellow-500 text-gray-900 font-bold py-1 px-3 rounded-lg shadow-md hover:bg-yellow-400 transition-colors ${canAfford ? '' : 'opacity-50 cursor-not-allowed'}">
                        구매 (1)
                    </button>
                    ${bulkUnlocked ? `
                    <button onclick="${score >= getBuildingCost(b) * 10 ? `buyBuilding('${b.id}', 10)` : ''}" class="bg-yellow-600 text-gray-900 font-bold py-1 px-2 rounded-lg shadow-md hover:bg-yellow-500 transition-colors text-sm ${score >= getBuildingCost(b) * 10 ? '' : 'opacity-50 cursor-not-allowed'}">
                        x10
                    </button>
                    <button onclick="${score >= getBuildingCost(b) * 100 ? `buyBuilding('${b.id}', 100)` : ''}" class="bg-yellow-700 text-gray-900 font-bold py-1 px-2 rounded-lg shadow-md hover:bg-yellow-600 transition-colors text-sm ${score >= getBuildingCost(b) * 100 ? '' : 'opacity-50 cursor-not-allowed'}">
                        x100
                    </button>
                    ` : ''}
                </div>
            </div>
        `;
        html += itemHtml;
    });
    container.innerHTML = html;
}

function renderUpgrades() {
    const clickContainer = document.getElementById('click-upgrades-container');
    if (!clickContainer) return;
    let clickHtml = '';
    const specialContainer = document.getElementById('special-upgrades-container');
    if (!specialContainer) return;
    let specialHtml = '';

    // 1. 클릭 업그레이드 렌더링
    clickUpgrades.forEach(u => {
        const isPurchased = u.isPurchased;
        const cost = u.baseCost;
        const canAfford = score >= cost;
        const isDisabled = isPurchased || !canAfford;

        clickHtml += `
            <div class="upgrade-item p-3 ${isPurchased ? 'upgrade-purchased' : isDisabled ? 'upgrade-disabled' : 'cursor-pointer'}" 
                 onclick="${isDisabled ? '' : `buyUpgrade('${u.id}')`}">
                <p class="font-bold text-lg">${u.name} ${isPurchased ? '✔️' : ''}</p>
                <p class="text-sm text-gray-400">${u.description}</p>
                <p class="text-sm font-semibold ${isPurchased ? 'text-green-300' : isDisabled ? 'text-red-400' : 'text-yellow-500'}">
                    ${isPurchased ? '구매 완료' : `비용: ${formatNumber(cost)} Cookies`}
                </p>
            </div>
        `;
    });
    clickContainer.innerHTML = clickHtml;

    // 2. 특수 티어 업그레이드 렌더링
    specialUpgrades.forEach(g => {
        const building = buildings.find(b => b.id === g.buildingId);
        if (!building) return;

        let prevTierPurchased = true; 

        g.tiers.forEach(tier => {
            const isPurchased = tier.isPurchased;
            const cost = building.baseCost * tier.costFactor;
            const canAfford = score >= cost;
            const isDisabled = isPurchased || !canAfford || !prevTierPurchased;
            
            let cssClass = 'upgrade-item p-3';
            if (isPurchased) {
                cssClass += ' upgrade-purchased';
            } else if (isDisabled) {
                cssClass += ' upgrade-disabled';
            } else {
                cssClass += ' cursor-pointer';
            }
            
            const description = !prevTierPurchased ? `(이전 티어 필요)` : `${g.buildingName} 생산량 x${tier.multiplier}`;

            specialHtml += `
                <div class="${cssClass}" 
                     onclick="${isDisabled ? '' : `buyUpgrade('${g.buildingId}_${tier.id}')`}">
                    
                    <p class="font-bold text-lg">${g.buildingName} - ${tier.name} ${isPurchased ? '✔️' : ''}</p>
                    <p class="text-sm text-gray-400">${description}</p>
                    <p class="text-sm font-semibold ${isPurchased ? 'text-green-300' : isDisabled ? 'text-red-400' : 'text-yellow-500'}">
                        ${isPurchased ? '구매 완료' : `비용: ${formatNumber(cost)} Cookies`}
                    </p>
                </div>
            `;
            
            if (!isPurchased) {
                prevTierPurchased = false;
            }
        });
    });

    specialContainer.innerHTML = specialHtml;
}

function renderInventory() {
    const container = document.getElementById('inventory-container');
    if (!container) return;
    let html = '';
    
    // 드랍 아이템 렌더링
    dropItems.forEach(item => {
        const isUsable = (item.id === 'time' && !isBuffActive) || (item.id === 'explosion') || (item.id === 'luck');
        const canUse = item.count > 0 && isUsable;
        const isMaterial = !isUsable && !item.isPermanent; 
        const actionText = isMaterial ? '제작 재료' : canUse ? '클릭하여 사용' : '사용 불가';

        const description = item.id === 'time' ? `사용 시 60초간 CPS x${BUFF_CPS_MULTIPLIER} 버프 활성화` : 
                            item.id === 'explosion' ? '사용 시 현재 쿠키의 10%를 보너스로 획득' : 
                            item.id === 'luck' ? '사용 시 현재 쿠키의 1%를 보너스로 획득' : 
                            item.isPermanent ? '환생 후 유지되는 특수 아이템입니다.' : 
                            '제작 재료로 사용되는 희귀 아이템입니다.';
        
        html += `
            <div class="inventory-item p-3 flex flex-col space-y-1 ${canUse ? 'cursor-pointer hover:bg-gray-700' : 'cursor-default'} border-l-4 ${item.color.replace('text-', 'border-')}">
                <p class="font-bold text-lg flex justify-between items-center">
                    ${item.icon} ${item.name}
                    <span class="${item.color} font-extrabold text-xl">${formatNumber(item.count)}</span>
                </p>
                <p class="text-xs text-gray-400">${description}</p>
                <p class="text-xs text-blue-400 mt-1">${actionText}</p>
                
                <button onclick="${canUse ? `useItem('${item.id}')` : ''}" 
                        class="mt-2 bg-blue-600 text-white py-1 rounded transition-colors ${canUse ? 'hover:bg-blue-700' : 'opacity-50 cursor-not-allowed'}">
                    ${canUse ? '사용하기' : (isMaterial ? '재료' : '특수')}
                </button>
            </div>
        `;
    });

    // 제작 포션/소모성 아이템 렌더링
    craftingRecipes.filter(r => r.type === 'potion' || r.type === 'click_potion' || r.type === 'gacha_reset_item').forEach(item => {
        const isCpsPotion = item.type === 'potion';
        const isClickPotion = item.type === 'click_potion';
        const isResetItem = item.type === 'gacha_reset_item';
        
        let isActive = false;
        if (isCpsPotion) isActive = isCraftBuffActive;
        else if (isClickPotion) isActive = isClickBuffActive;
        else if (isResetItem) isActive = (gachaCost <= 100); // 이미 100원이면 비활성화

        const canUse = item.craftCount > 0 && !isActive;
        
        let color = 'text-gray-400';
        if (isCpsPotion) color = 'text-purple-400';
        else if (isClickPotion) color = 'text-red-500';
        else if (isResetItem) color = 'text-green-400';

        let durationText = '';
        if (isCpsPotion) durationText = `${item.duration / 60}분`;
        else if (isClickPotion) durationText = `${item.duration}초`;
        else if (isResetItem) durationText = '1회성 초기화';
        
        let buttonColor = 'bg-gray-600';
        if (isCpsPotion) buttonColor = 'bg-purple-600';
        else if (isClickPotion) buttonColor = 'bg-red-600';
        else if (isResetItem) buttonColor = 'bg-green-600';
        
        let actionText = '사용 불가';
        if (canUse) {
            actionText = `클릭하여 사용 (${durationText})`;
        } else if (isResetItem && isActive) {
            actionText = '이미 100 쿠키입니다';
        } else if (item.craftCount <= 0) {
            actionText = '수량이 부족합니다';
        } else if (isActive) {
            actionText = '버프 활성화 중';
        }

        html += `
            <div class="inventory-item p-3 flex flex-col space-y-1 ${canUse ? 'cursor-pointer hover:bg-gray-700' : 'cursor-default'} border-l-4 ${color.replace('text-', 'border-')}">
                <p class="font-bold text-lg flex justify-between items-center">
                    ${item.icon} ${item.name}
                    <span class="${color} font-extrabold text-xl">${formatNumber(item.craftCount)}</span>
                </p>
                <p class="text-xs text-gray-400">${item.description}</p>
                <p class="text-xs text-blue-400 mt-1">${actionText}</p>
                
                <button onclick="${canUse ? `useItem('${item.id}')` : ''}" 
                        class="mt-2 ${buttonColor} text-white py-1 rounded transition-colors ${canUse ? 'hover:opacity-75' : 'opacity-50 cursor-not-allowed'}">
                    ${canUse ? '사용하기' : '사용 불가'}
                </button>
            </div>
        `;
    });
    
    container.innerHTML = html;
    
    // [수정] 행운 보너스 표기 (ID 변경)
    const luckRate = document.getElementById('luck-rate-display');
    if (luckRate) {
        luckRate.innerHTML = `x${luckBonus.toFixed(2)}`;
    }
}

function renderCrafting() {
    const container = document.getElementById('crafting-list-container');
    if (!container) return;
    let html = '';

    craftingRecipes.forEach(recipe => {
        const isConsumable = recipe.type === 'potion' || recipe.type === 'click_potion' || recipe.type === 'gacha_reset_item';
        const isCrafted = isConsumable ? recipe.craftCount > 0 : recipe.isCrafted;
        
        let canCraft = isConsumable ? true : !recipe.isCrafted; // 소모성 아이템은 항상 제작 가능
        let costHtml = '';
        recipe.cost.forEach(costItem => {
            const item = dropItems.find(i => i.id === costItem.itemId);
            const owned = item ? item.count : 0;
            const hasEnough = owned >= costItem.quantity;
            if (!hasEnough) canCraft = false;
            
            costHtml += `<span class="${hasEnough ? 'text-green-400' : 'text-red-400'}">${item.icon} ${item.name} ${owned}/${costItem.quantity}</span>, `;
        });
        costHtml = costHtml.slice(0, -2); 

        const isDisabled = !canCraft && !isConsumable; // 패시브인데 재료 부족
        
        let craftedStatus = '';
        if (isConsumable) {
            craftedStatus = `<p class="font-bold text-lg">${recipe.icon} ${recipe.name} (${recipe.craftCount}개 보유)</p>`;
        } else {
            craftedStatus = `<p class="font-bold text-lg">${recipe.icon} ${recipe.name} ${recipe.isCrafted ? '✔️' : ''}</p>`;
        }
        
        html += `
            <div class="crafting-item p-3 ${recipe.isCrafted && !isConsumable ? 'upgrade-purchased' : (isDisabled || (!canCraft && isConsumable)) ? 'crafting-disabled' : 'cursor-pointer'}"
                 onclick="${(isDisabled || (!canCraft && isConsumable)) ? '' : `craftItem('${recipe.id}')`}">
                
                ${craftedStatus}
                <p class="text-sm text-gray-400">${recipe.description}</p>
                <p class="text-xs mt-2 font-semibold ${canCraft ? 'text-yellow-500' : 'text-red-400'}">
                    재료: ${costHtml}
                </p>
                <button class="mt-3 w-full bg-teal-600 text-white font-bold py-1 rounded transition-colors ${canCraft ? 'hover:bg-teal-700' : 'opacity-50 cursor-not-allowed'}">
                    ${isConsumable ? '제작하기' : (recipe.isCrafted ? '제작됨' : '제작하기')}
                </button>
            </div>
        `;
    });
    container.innerHTML = html;
}

function renderGachaItems() {
    const container = document.getElementById('gacha-list-container');
    if (!container) return;
    let html = `
        <p class="text-center text-gray-400 col-span-full">
            현재 영구 CPS 보너스 (C~Cookie): <span class="font-bold text-yellow-300">+${((permanentGachaBonus_CPS - 1.0) * 100).toFixed(1)}%</span>
        </p>
        <p class="text-center text-gray-400 col-span-full text-xs">
            (기타 효과는 획득 시 즉시 적용됩니다)
        </p>
    `;
    container.innerHTML = html;
}

function getResearchCost(research) {
    if (research.type === 'onetime') return research.baseCost;
    return Math.floor(research.baseCost * Math.pow(research.costMultiplier, research.level));
}

function buyResearch(researchId) {
    const research = researchTree.find(r => r.id === researchId);
    if (!research) return;
    if (research.type === 'onetime' && research.isPurchased) return;

    const cost = getResearchCost(research);
    if (researchPoints >= cost) {
        researchPoints -= cost;
        if (research.type === 'repeatable') {
            research.level++;
        } else {
            research.isPurchased = true;
        }
        showTemporaryMessage(`${research.name} 구매 완료!`, 'bg-blue-600');
        
        if (research.id === 'qol_bulk_1') {
            renderBuildings(); 
        }

        calculateGameStats();
        updateUI();
        renderResearchTree();
    } else {
        showTemporaryMessage('연구 포인트가 부족합니다!', 'bg-red-600');
    }
}

function renderResearchTree() {
    const container = document.getElementById('research-tree-container');
    if (!container) return; 
    
    const rpDisplay = document.getElementById('research-points-display');
    if(rpDisplay) rpDisplay.textContent = formatNumber(researchPoints);
    
    let html = '';
    researchTree.forEach(r => {
        const cost = getResearchCost(r);
        const canAfford = researchPoints >= cost;
        const isPurchased = (r.type === 'onetime' && r.isPurchased);
        const isDisabled = isPurchased || !canAfford;

        let statusHtml = '';
        if (isPurchased) {
            statusHtml = '<p class="text-sm font-semibold text-green-300">구매 완료</p>';
        } else if (r.type === 'repeatable') {
            statusHtml = `<p class="text-sm font-semibold ${canAfford ? 'text-yellow-500' : 'text-red-400'}">
                레벨 ${r.level} &rarr; ${r.level + 1} | 비용: ${formatNumber(cost)} RP
            </p>`;
        } else {
            statusHtml = `<p class="text-sm font-semibold ${canAfford ? 'text-yellow-500' : 'text-red-400'}">
                비용: ${formatNumber(cost)} RP
            </p>`;
        }

        html += `
            <div class="upgrade-item p-3 ${isPurchased ? 'upgrade-purchased' : isDisabled ? 'upgrade-disabled' : 'cursor-pointer'}"
                 onclick="${isDisabled ? '' : `buyResearch('${r.id}')`}">
                <p class="font-bold text-lg">${r.name} ${isPurchased ? '✔️' : (r.level > 0 ? `(Lvl ${r.level})` : '')}</p>
                <p class="text-sm text-gray-400">${r.description}</p>
                ${statusHtml}
            </div>
        `;
    });
    container.innerHTML = html;
}

// -----------------------------------------------------------
// 8. Save and Load (저장 및 불러오기)
// -----------------------------------------------------------

function saveGame(isAuto = false) {
    const saveData = {
        score,
        totalCookiesEver,
        prestigePoints,
        prestigeCount, 
        isBuffActive,
        buffEndTime,
        isCraftBuffActive,
        craftBuffEndTime,
        craftBuffCpsMultiplier,
        isClickBuffActive, 
        clickBuffEndTime, 
        clickBuffMultiplier, 
        gachaCost,
        permanentGachaBonus_CPS,
        researchPoints,
        researchGodBonus,
        researchTreeData: researchTree.map(r => ({ id: r.id, level: r.level, isPurchased: r.isPurchased })),
        buildings: buildings.map(b => ({ id: b.id, count: b.count })), 
        clickUpgrades: clickUpgrades.map(u => ({ id: u.id, isPurchased: u.isPurchased })),
        specialUpgrades: specialUpgrades.map(g => ({
            buildingId: g.buildingId,
            tiers: g.tiers.map(t => ({ id: t.id, isPurchased: t.isPurchased }))
        })),
        dropItems: dropItems.map(i => ({ id: i.id, count: i.count })),
        craftingRecipes: craftingRecipes.map(r => ({ id: r.id, isCrafted: r.isCrafted, craftCount: r.craftCount || 0 })), 
        lastSaveTime: new Date().getTime(),
    };

    try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(saveData));
        if (!isAuto) {
            showTemporaryMessage('💾 게임이 수동으로 저장되었습니다.', 'bg-blue-600');
        } else {
            console.log('Autosave complete.');
        }
    } catch (e) {
        console.error('Error saving game to localStorage:', e);
        showTemporaryMessage('저장 중 오류가 발생했습니다!', 'bg-red-700');
    }
}

function loadGame() {
    try {
        const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (!savedData) {
            console.log('No save data found.');
            isGameLoaded = true;
            return;
        }

        const data = JSON.parse(savedData);

        score = data.score || 0;
        totalCookiesEver = data.totalCookiesEver || 0;
        prestigePoints = data.prestigePoints || 0;
        
        isBuffActive = data.isBuffActive || false;
        buffEndTime = data.buffEndTime || 0;
        
        isCraftBuffActive = data.isCraftBuffActive || false;
        craftBuffEndTime = data.craftBuffEndTime || 0;
        craftBuffCpsMultiplier = data.craftBuffCpsMultiplier || 1.0;
        
        isClickBuffActive = data.isClickBuffActive || false;
        clickBuffEndTime = data.clickBuffEndTime || 0;
        clickBuffMultiplier = data.clickBuffMultiplier || 1.0;

        lastSaveTime = data.lastSaveTime || new Date().getTime();

        prestigeCount = data.prestigeCount || 0;
        // [수정] gachaCost 로드 (저장된 값이 없으면 환생 횟수 기반으로 계산)
        const baseGachaCost = 100 * Math.pow(10, prestigeCount); 
        gachaCost = data.gachaCost || baseGachaCost; 
        
        permanentGachaBonus_CPS = data.permanentGachaBonus_CPS || 1.0;

        researchPoints = data.researchPoints || 0;
        researchGodBonus = data.researchGodBonus || 1.0;
        if (data.researchTreeData) {
            data.researchTreeData.forEach(savedR => {
                const r = researchTree.find(res => res.id === savedR.id);
                if (r) {
                    if (r.type === 'repeatable') r.level = savedR.level || 0;
                    else r.isPurchased = savedR.isPurchased || false;
                }
            });
        }

        if (data.buildings) {
            data.buildings.forEach(savedB => {
                const b = buildings.find(building => building.id === savedB.id);
                if (b) {
                    b.count = savedB.count;
                }
            });
        }
        if (data.clickUpgrades) {
            data.clickUpgrades.forEach(savedU => {
                const u = clickUpgrades.find(upgrade => upgrade.id === savedU.id);
                if (u) u.isPurchased = savedU.isPurchased;
            });
        }
        if (data.specialUpgrades) {
            data.specialUpgrades.forEach(savedG => {
                const g = specialUpgrades.find(group => group.buildingId === savedG.buildingId);
                if (g && savedG.tiers) {
                    savedG.tiers.forEach(savedT => {
                        const t = g.tiers.find(tier => tier.id === savedT.id);
                        if (t) t.isPurchased = savedT.isPurchased;
                    });
                }
            });
        }
        if (data.dropItems) {
            data.dropItems.forEach(savedI => {
                const i = dropItems.find(item => item.id === savedI.id);
                if (i) i.count = savedI.count;
            });
        }
        if (data.craftingRecipes) {
            data.craftingRecipes.forEach(savedR => {
                const r = craftingRecipes.find(item => item.id === savedR.id);
                if (r) {
                    r.isCrafted = savedR.isCrafted;
                    if (r.type === 'potion' || r.type === 'click_potion' || r.type === 'gacha_reset_item') r.craftCount = savedR.craftCount || 0; 
                }
            });
        }

        // 만료된 버프 체크
        if (isBuffActive && new Date().getTime() > buffEndTime) {
            isBuffActive = false;
        }
        if (isCraftBuffActive && new Date().getTime() > craftBuffEndTime) {
            isCraftBuffActive = false;
            craftBuffCpsMultiplier = 1.0;
        }
        if (isClickBuffActive && new Date().getTime() > clickBuffEndTime) {
            isClickBuffActive = false;
            clickBuffMultiplier = 1.0;
        }

        console.log('Game data loaded.');

    } catch (e) {
        console.error('Error loading game from localStorage:', e);
        localStorage.removeItem(LOCAL_STORAGE_KEY); 
    } finally {
        isGameLoaded = true; 
    }
}

// -----------------------------------------------------------
// 9. Game Initialization (게임 초기화)
// -----------------------------------------------------------

function initializeGame() {
    loadGame(); 
    calculateGameStats(); 

    switchTab('building-tab');
    
    // 초기 렌더링
    renderBuildings();
    renderUpgrades();
    renderInventory();
    renderCrafting();
    renderGachaItems();
    renderResearchTree(); 
    updateUI(); 

    document.getElementById('loading-message').classList.add('hidden');
    document.getElementById('game-content').classList.remove('hidden');

    // 이벤트 리스너 설정
    document.getElementById('cookie').addEventListener('click', clickCookie);
    document.getElementById('manual-save-button').addEventListener('click', () => saveGame(false));
    document.getElementById('ascension-button').addEventListener('click', ascend);
    document.getElementById('gacha-button').addEventListener('click', tryGacha);
    document.getElementById('reset-game-button').addEventListener('click', resetGameData);

    // 탭 버튼 이벤트 설정
    document.querySelectorAll('.tab-button').forEach(button => {
        button.addEventListener('click', (e) => {
            const tabId = e.currentTarget.getAttribute('data-tab');
            switchTab(tabId);
        });
    });

    // 게임 루프 시작
    gameLoop(performance.now());
}

// 페이지 로드 시 게임 시작
window.onload = initializeGame;
