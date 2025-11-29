// =========================================================
// I. 전역 변수 및 DOM 요소 선언
// =========================================================

// 몬스터 데이터 및 페이지네이션 상태 변수
let ALL_MONSTERS = []; // 모든 몬스터 데이터를 저장할 배열
const ITEMS_PER_PAGE = 8; // 페이지 당 표시할 몬스터 수 (페이지형에서만 사용)
let currentPage = 1;
let totalPages = 1;

// DOM 요소 선택
const listContainer = document.querySelector('.monster-list');
const basicInfoContainer = document.querySelector('.basic-info');
const detailContentContainer = document.querySelector('.detail-content');
const currentPageSpan = document.querySelector('.current-page');
const prevPageNav = document.querySelector('.prev-page');
const nextPageNav = document.querySelector('.next-page');

// 탭/콘텐츠 관련 DOM 요소
const guideContent = document.getElementById('guide-content');
const settingContent = document.getElementById('setting-content');
const tabBtns = document.querySelectorAll('.tab-btn');

// 다크 모드 관련 DOM 요소
const darkModeToggle = document.getElementById('darkmode-switch');
const body = document.body;

// 🟢 [추가] 몬스터 보기 모드 관련 변수 및 DOM 요소
const modeSelectGroup = document.querySelector('.mode-select-group');
// 초기 설정은 'card'로 지정합니다.
let currentViewMode = localStorage.getItem('view-mode') || 'card'; 

// =========================================================
// II. 핵심 기능 함수 정의
// =========================================================

// 1. 몬스터 선택 처리 함수
function handleMonsterSelect(event) {
    // 모든 선택 해제
    document.querySelectorAll('.monster-item').forEach(item => {
        item.classList.remove('selected');
    });

    // 현재 클릭된 아이템 선택
    const selectedItem = event.currentTarget;
    selectedItem.classList.add('selected');

    const monsterId = parseInt(selectedItem.dataset.id);
    const selectedMonster = ALL_MONSTERS.find(m => m.id === monsterId);

    if (selectedMonster) {
        renderDetailPanel(selectedMonster);
    }
}

// 2. 상세 패널 렌더링 함수 (변경 없음)
function renderDetailPanel(monster) {
    // 기본 정보 렌더링 
    let basicHtml = '<h3>기본 정보</h3><div class="basic-info-content">';
    
    const basicData = {
        '도감번호': monster.basic.도감번호,
        '이름': monster.basic.이름,
        '종류': monster.species || '미확인', // '종류(species)' 항목
        '희귀도': monster.basic.희귀도,
        '출현지역': monster.location || '미확인', 
        '일반패턴': monster.basic.일반패턴,
        '분노패턴': monster.basic.분노패턴,
        '특수패턴1': monster.basic.특수패턴1,
        '특수패턴2': monster.basic.특수패턴2,
        '공격속성': monster.basic.main_attack_element,
        '약점속성': monster.basic.weakness_element
    };

    for (const [key, value] of Object.entries(basicData)) {
        basicHtml += `<p><strong>${key}:</strong> ${value}</p>`;
    }
    basicHtml += '</div>';
    basicInfoContainer.innerHTML = basicHtml;


    // 상세 정보 렌더링
    let detailHtml = `<h3>${monster.detail.title || '상세 정보'}</h3><div class="guide-content"><ul>`;
    if (monster.detail.guide && monster.detail.guide.length > 0) {
        monster.detail.guide.forEach(line => {
            detailHtml += `<li>${line}</li>`;
        });
    } else {
         detailHtml += '<li>정보가 준비 중입니다.</li>';
    }

    detailHtml += '</ul></div>';
    detailContentContainer.innerHTML = detailHtml;
}

// 3. 몬스터 목록 렌더링 함수 🟢 [수정] - 카드형일 때 이름만 표시
function renderMonsterList(page) {
    listContainer.innerHTML = '';
    
    // 뷰 모드에 따라 클래스 변경
    listContainer.classList.remove('card-view', 'pagination-view');
    listContainer.classList.add(currentViewMode === 'card' ? 'card-view' : 'pagination-view');

    let pageMonsters = [];
    
    if (currentViewMode === 'card') {
        // 🚨 카드형일 때: 페이지네이션 무시, 모든 몬스터 표시
        pageMonsters = ALL_MONSTERS;
    } else {
        // 페이지형일 때: 기존 페이지네이션 로직 적용
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        pageMonsters = ALL_MONSTERS.slice(startIndex, endIndex);
    }
    
    pageMonsters.forEach(monster => {
        
        let monsterDisplayName = '';
        let detailButtonHtml = '';

        if (currentViewMode === 'card') {
            // 🚨 카드형일 때: 이름만 표시 (번호, 별 제외)
            monsterDisplayName = monster.name;
        } else {
            // 페이지형일 때: 번호, 이름, 별, 상세보기 버튼 모두 표시
            const starHtml = `<span class="monster-star">★${monster.star}</span>`;
            monsterDisplayName = `${monster.id}. ${monster.name} ${starHtml}`;
            detailButtonHtml = '<button class="detail-btn">상세보기</button>';
        }

        const html = `
            <div class="monster-item" data-id="${monster.id}">
                <span class="monster-name">${monsterDisplayName}</span>
                ${detailButtonHtml}
            </div>
        `;
        listContainer.innerHTML += html;
    });

    // 이벤트 리스너 할당
    document.querySelectorAll('.monster-item').forEach(item => {
        item.addEventListener('click', handleMonsterSelect);
    });
    
    // 페이지네이션 컨트롤 표시/숨김 처리
    updatePaginationControls();
}

// 4. 페이지네이션 컨트롤 업데이트 🟢 [수정] - 카드형일 때 완전히 숨김
function updatePaginationControls() {
    const paginationDiv = document.querySelector('.pagination');
    
    if (!paginationDiv) return;
    
    if (currentViewMode === 'card') {
        // 🚨 카드형일 때: 페이지네이션 영역을 완전히 숨깁니다.
        paginationDiv.style.display = 'none';
        return;
    }
    
    // 페이지형일 때: 페이지네이션 로직 적용
    paginationDiv.style.display = 'flex'; 
    currentPageSpan.textContent = `${currentPage} / ${totalPages}`;
    
    // 이전 버튼 상태
    if (currentPage === 1) {
        prevPageNav.classList.add('disabled');
    } else {
        prevPageNav.classList.remove('disabled');
    }

    // 다음 버튼 상태
    if (currentPage === totalPages) {
        nextPageNav.classList.add('disabled');
    } else {
        nextPageNav.classList.remove('disabled');
    }
}

// 5. 페이지 이동 처리 🟢 [수정] - 카드형일 때 작동 방지
function changePage(direction) {
    if (currentViewMode === 'card') return; // 🚨 카드형일 때는 페이지 이동을 막습니다.
    
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderMonsterList(currentPage);
        updatePaginationControls();
        
        // 페이지 이동 후, 새 페이지의 첫 번째 몬스터를 자동 선택 및 상세 정보 표시
        const firstMonsterInNewPage = ALL_MONSTERS[(currentPage - 1) * ITEMS_PER_PAGE];
        if (firstMonsterInNewPage) {
            renderDetailPanel(firstMonsterInNewPage);
            // DOM이 렌더링된 후에 선택되도록 setTimeout 사용
            setTimeout(() => {
                const firstItem = document.querySelector('.monster-list .monster-item');
                if(firstItem) firstItem.classList.add('selected');
            }, 0);
        }
    }
}

// 6. 탭 전환 처리 함수 (변경 없음)
function handleTabSwitch(event) {
    const targetTab = event.currentTarget.dataset.tab;

    // 탭 버튼 활성화 상태 업데이트
    tabBtns.forEach(btn => btn.classList.remove('active'));
    event.currentTarget.classList.add('active');

    // 콘텐츠 표시/숨김
    if (targetTab === 'guide') {
        guideContent.style.display = 'block';
        settingContent.style.display = 'none';
    } else if (targetTab === 'setting') {
        guideContent.style.display = 'none';
        settingContent.style.display = 'block';
    }
}

// 7. 다크 모드 상태 로드 함수 (변경 없음)
function loadDarkModeState() {
    const isDarkModeEnabled = localStorage.getItem('dark-mode') === 'enabled';
    
    if (isDarkModeEnabled) {
        body.classList.add('dark-mode');
        darkModeToggle.checked = true;
    } else {
        body.classList.remove('dark-mode');
        darkModeToggle.checked = false;
    }
}

// 8. 데이터 로드 및 초기 설정 함수 🟢 [수정] - totalPages 계산은 페이지형을 위해 유지
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('data.json 파일을 불러오지 못했습니다.');
        }
        ALL_MONSTERS = await response.json();
        // totalPages 계산은 페이지형을 위해 유지
        totalPages = Math.ceil(ALL_MONSTERS.length / ITEMS_PER_PAGE); 
        
        // 초기 렌더링 시작 (현재 뷰 모드 반영)
        renderMonsterList(currentPage);
        
        // 초기 선택된 몬스터 상세 정보 렌더링
        if (ALL_MONSTERS.length > 0) {
            renderDetailPanel(ALL_MONSTERS[0]);
             setTimeout(() => {
                const firstItem = document.querySelector('.monster-list .monster-item');
                if(firstItem) firstItem.classList.add('selected');
            }, 0);
        }
        
    } catch (error) {
        console.error("데이터 로드 오류:", error);
        listContainer.innerHTML = `<p style="text-align:center;">데이터를 불러오는 데 실패했습니다: ${error.message}</p>`;
    }
}

// 9. 몬스터 목록 보기 방식 전환 함수 🟢 [수정] - 페이지 초기화 추가
function changeViewMode(newMode) {
    if (currentViewMode !== newMode) {
        currentViewMode = newMode;
        localStorage.setItem('view-mode', newMode); // 상태 저장
        
        // 뷰 모드 전환 시 페이지를 1로 초기화 (페이지형일 때)
        currentPage = 1; 
        
        // 버튼 활성화 상태 업데이트
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        const newActiveBtn = document.querySelector(`.mode-btn[data-mode="${newMode}"]`);
        if (newActiveBtn) {
            newActiveBtn.classList.add('active');
        }
        
        // 몬스터 목록을 새로운 모드로 다시 렌더링
        renderMonsterList(currentPage);
        
        // 목록 전환 후에도 첫 번째 몬스터는 선택된 상태로 유지
        setTimeout(() => {
            const firstItem = document.querySelector('.monster-list .monster-item');
            if(firstItem) firstItem.classList.add('selected');
        }, 0);
    }
}

// 10. 뷰 모드 초기 상태 로드 및 적용 (변경 없음)
function loadViewModeState() {
    currentViewMode = localStorage.getItem('view-mode') || 'card';
    
    const initialActiveBtn = document.querySelector(`.mode-btn[data-mode="${currentViewMode}"]`);
    if (initialActiveBtn) {
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        initialActiveBtn.classList.add('active');
    }
}


// =========================================================
// III. 이벤트 리스너 및 초기화
// =========================================================

// 페이지네이션 버튼 이벤트 리스너 (변경 없음)
prevPageNav.addEventListener('click', () => {
    if (currentPage > 1) {
        changePage(-1);
    }
});

nextPageNav.addEventListener('click', () => {
    if (currentPage < totalPages) {
        changePage(1);
    }
});

// 탭 버튼 이벤트 리스너 추가 (변경 없음)
tabBtns.forEach(btn => {
    btn.addEventListener('click', handleTabSwitch);
});

// 다크 모드 스위치 변경 이벤트 리스너 (변경 없음)
darkModeToggle.addEventListener('change', () => {
    if (darkModeToggle.checked) {
        body.classList.add('dark-mode');
        localStorage.setItem('dark-mode', 'enabled'); // 상태 저장
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('dark-mode', 'disabled'); // 상태 저장
    }
});

// 뷰 모드 버튼 이벤트 리스너 (변경 없음)
if (modeSelectGroup) {
    modeSelectGroup.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('mode-btn')) {
            const mode = target.dataset.mode;
            changeViewMode(mode);
        }
    });
}


// 최종 초기화: DOMContentLoaded 시점에 실행 (변경 없음)
document.addEventListener('DOMContentLoaded', () => {
    // 1. 다크 모드 상태를 먼저 로드하여 테마를 적용합니다.
    loadDarkModeState();
    
    // 2. 뷰 모드 상태를 로드하여 초기 모드 버튼을 활성화합니다.
    loadViewModeState();
    
    // 3. 데이터 및 콘텐츠를 로드합니다.
    loadData();

    // 4. 초기 탭 설정: 'Guide' 탭을 활성화하고 'Setting' 탭을 숨깁니다.
    const guideTabBtn = document.querySelector('.tab-btn[data-tab="guide"]');
    if (guideTabBtn) {
        guideTabBtn.classList.add('active');
    }

    if (guideContent) {
        guideContent.style.display = 'block';
    }
    if (settingContent) {
        settingContent.style.display = 'none';
    }
});
