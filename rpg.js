// 1. 캔버스 설정
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- 2. 게임 핵심 객체 정의 ---

// 플레이어 객체
let player = {
    x: 50,
    y: 50,
    width: 20,
    height: 20,
    color: 'blue',
    speed: 4
};

// 게임 월드에 배치될 오브젝트들 (자원, 적)
// type: 'resource' (자원) 또는 'enemy' (적)
let gameObjects = [
    // 자원
    { id: '나무 1', x: 150, y: 100, width: 30, height: 30, color: 'green', type: 'resource' },
    { id: '나무 2', x: 200, y: 300, width: 30, height: 30, color: 'green', type: 'resource' },
    { id: '바위 1', x: 400, y: 80, width: 25, height: 25, color: 'gray', type: 'resource' },
    
    // 적
    { id: '슬라임 1', x: 300, y: 200, width: 20, height: 20, color: 'red', type: 'enemy' }
];

// --- 3. 키보드 입력 처리 ---

// 현재 눌린 키를 저장하는 객체
let keys = {};

document.addEventListener('keydown', (e) => {
    keys[e.code] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.code] = false;
});

// --- 4. 게임 로직 (업데이트) ---

// 두 사각형이 겹치는지 확인하는 헬퍼 함수
function checkCollision(rect1, rect2) {
    return (
        rect1.x < rect2.x + rect2.width &&
        rect1.x + rect1.width > rect2.x &&
        rect1.y < rect2.y + rect2.height &&
        rect1.y + rect1.height > rect2.y
    );
}

// 매 프레임마다 게임 상태를 업데이트하는 함수
function update() {
    // 1. 플레이어 이동 처리
    if (keys['ArrowUp'] && player.y > 0) {
        player.y -= player.speed;
    }
    if (keys['ArrowDown'] && player.y < canvas.height - player.height) {
        player.y += player.speed;
    }
    if (keys['ArrowLeft'] && player.x > 0) {
        player.x -= player.speed;
    }
    if (keys['ArrowRight'] && player.x < canvas.width - player.width) {
        player.x += player.speed;
    }

    // 2. 행동 (스페이스바) 처리
    if (keys['Space']) {
        // gameObjects 배열을 뒤에서부터 순회 (삭제 시 인덱스 꼬임 방지)
        for (let i = gameObjects.length - 1; i >= 0; i--) {
            let obj = gameObjects[i];
            
            // 플레이어와 오브젝트가 충돌했는지 확인
            if (checkCollision(player, obj)) {
                if (obj.type === 'resource') {
                    console.log(`[채집 성공] ${obj.id}을(를) 획득했습니다.`);
                } else if (obj.type === 'enemy') {
                    console.log(`[전투 승리] ${obj.id}을(를) 처치했습니다.`);
                }
                
                // 오브젝트를 월드에서 제거
                gameObjects.splice(i, 1);
            }
        }
        
        // 스페이스바를 계속 누르고 있는 것을 방지하기 위해 한 번만 실행
        keys['Space'] = false; 
    }
}

// --- 5. 렌더링 (그리기) ---

// 매 프레임마다 화면을 그리는 함수
function render() {
    // 1. 캔버스를 깨끗하게 지웁니다 (흰색 배경)
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // 2. 모든 게임 오브젝트(자원, 적) 그리기
    for (let obj of gameObjects) {
        ctx.fillStyle = obj.color;
        ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
    }

    // 3. 플레이어 그리기 (항상 맨 위에)
    ctx.fillStyle = player.color;
    ctx.fillRect(player.x, player.y, player.width, player.height);
}

// --- 6. 게임 루프 (시작!) ---

function gameLoop() {
    update(); // 게임 상태 업데이트
    render(); // 화면 그리기
    
    // 이 함수를 계속해서 반복 호출 (애니메이션)
    requestAnimationFrame(gameLoop);
}

// 게임 루프 시작
gameLoop();
