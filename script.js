// =========================================================
// I. 전역 변수 및 DOM 요소 선언 (변경 없음)
// =========================================================

let ALL_MONSTERS = []; 
let ITEMS_PER_PAGE = 8; 
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

// 몬스터 보기 모드 및 페이지당 아이템 설정 관련 DOM 요소
const modeSelectGroup = document.querySelector('.mode-select-group');
const itemsPerPageSelect = document.getElementById('items-per-page-select');
let currentViewMode = localStorage.getItem('view-mode') || 'card'; 


// =========================================================
// II. 핵심 기능 함수 정의
// =========================================================

// 🟢 [추가된 함수] JSON 가이드 데이터를 파싱하여 HTML 블록으로 변환
/**
 * '제목[내용1, 내용2, ...]' 패턴을 찾아 구조화된 HTML 블록으로 변환합니다.
 * @param {Array<string>} guideArray - 몬스터의 detail.guide 배열
 * @returns {string} - 구조화된 HTML 문자열
 */
function parseGuide(guideArray) {
    let htmlOutput = '';
    
    // 정규 표현식: (제목) [ (내용) ] 패턴을 찾음
    const regex = /(.+?)\[(.+?)\]/;

    guideArray.forEach(item => {
        const match = item.match(regex);

        if (match) {
            const title = match[1].trim(); // gg
            const contentString = match[2].trim(); // aa, dd
            
            // 내용을 쉼표(,)를 기준으로 분리하여 배열로 만듭니다.
            const contentItems = contentString.split(',').map(s => s.trim()).filter(s => s.length > 0);

            if (contentItems.length > 0) {
                // 블록 제목
                htmlOutput += `<h3 class="guide-block-title">${title}</h3>`;
                
                // 블록 내용 리스트
                htmlOutput += `<ul class="guide-block-list">`;
                contentItems.forEach(content => {
                    // **강조** 마크다운을 <strong> 태그로 간단 변환
                    const formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    htmlOutput += `<li>${formattedContent}</li>`;
                });
                htmlOutput += `</ul>`;
            }
        } else {
            // 패턴에 맞지 않는 일반 텍스트 처리
            // **강조** 마크다운을 <strong> 태그로 간단 변환하여 출력
            const formattedItem = item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            htmlOutput += `<p class="guide-normal-text">${formattedItem}</p>`;
        }
    });

    if (htmlOutput) {
        return `<div class="guide-container">${htmlOutput}</div>`;
    }
    return '정보가 준비 중입니다.';
}

// 헬퍼 함수: 이전에 선택된 항목을 제거하고 현재 항목을 선택합니다.
function selectMonsterItem(element, monster) {
    // 🟢 [개선] 현재 컨테이너 내에서 이전에 선택된 항목(하나)만 찾아서 제거
    const previouslySelected = listContainer.querySelector('.monster-item.selected');
    if (previouslySelected) {
        previouslySelected.classList.remove('selected');
    }

    // 현재 클릭된 아이템 선택
    element.classList.add('selected');
    
    // 상세 정보 렌더링
    if (monster) {
        renderDetailPanel(monster);
    }
}

// 🟢 [추가] 헬퍼 함수: 목록 렌더링 후 첫 번째 항목을 선택합니다.
function selectFirstMonster() {
    // 렌더링이 완료된 후, 첫 번째 항목을 찾습니다.
    const firstItem = listContainer.querySelector('.monster-item');
    if (firstItem) {
        const monsterId = parseInt(firstItem.dataset.id);
        const firstMonster = ALL_MONSTERS.find(m => m.id === monsterId);
        
        // selectMonsterItem 함수를 사용하여 안전하게 선택 상태를 적용합니다.
        selectMonsterItem(firstItem, firstMonster);
    }
}


// 1. 몬스터 선택 처리 함수 
function handleMonsterSelect(event) {
    const selectedItem = event.currentTarget;
    const monsterId = parseInt(selectedItem.dataset.id);
    const selectedMonster = ALL_MONSTERS.find(m => m.id === monsterId);

    // 🟢 [개선] selectMonsterItem 헬퍼 함수 호출로 로직 통합
    selectMonsterItem(selectedItem, selectedMonster);
}

// 2. 상세 패널 렌더링 함수 🟢 [수정] guide 배열 처리 로직을 parseGuide 함수로 대체
function renderDetailPanel(monster) {
    // 기본 정보 렌더링 
    let basicHtml = '<h3>기본 정보</h3><div class="basic-info-content">';
    
    const basicData = {
        '도감번호': monster.basic.도감번호,
        '이름': monster.basic.이름,
        '종류': monster.species || '미확인', 
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


    // 상세 정보 (가이드) 렌더링 🟢 [핵심 수정 부분]
    let detailHtml = `<h3>${monster.detail.title || '상세 정보'}</h3>`;
    
    if (monster.detail.guide && monster.detail.guide.length > 0) {
        // 🟢 parseGuide 함수를 사용하여 구조화된 HTML 생성
        detailHtml += parseGuide(monster.detail.guide);
    } else {
         detailHtml += '<div class="guide-container"><p class="guide-normal-text">정보가 준비 중입니다.</p></div>';
    }

    // detailContentContainer.innerHTML에 직접 렌더링
    detailContentContainer.innerHTML = detailHtml;
}


// 3. 몬스터 목록 렌더링 함수 
function renderMonsterList(page) {
    listContainer.innerHTML = '';
    
    // 뷰 모드에 따라 클래스 변경
    listContainer.classList.remove('card-view', 'pagination-view');
    listContainer.classList.add(currentViewMode === 'card' ? 'card-view' : 'pagination-view');

    let pageMonsters = [];
    
    if (currentViewMode === 'card') {
        // 카드형일 때: 페이지네이션 무시, 모든 몬스터 표시
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
            // 카드형일 때: 이름만 표시 (번호, 별 제외)
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
    
    // 🟢 [개선] 렌더링 완료 후, 첫 번째 몬스터 선택 상태를 직접 적용
    selectFirstMonster();
}

// 4. 페이지네이션 컨트롤 업데이트 (변경 없음)
function updatePaginationControls() {
    const paginationDiv = document.querySelector('.pagination');
    
    if (!paginationDiv) return;
    
    if (currentViewMode === 'card') {
        // 카드형일 때: 페이지네이션 영역을 완전히 숨깁니다.
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

// 5. 페이지 이동 처리 
function changePage(direction) {
    if (currentViewMode === 'card') return; 
    
    const newPage = currentPage + direction;
    if (newPage >= 1 && newPage <= totalPages) {
        currentPage = newPage;
        renderMonsterList(currentPage);
        updatePaginationControls();
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

// 8. 데이터 로드 및 초기 설정 함수 
async function loadData() {
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('data.json 파일을 불러오지 못했습니다.');
        }
        ALL_MONSTERS = await response.json();
        
        // ITEMS_PER_PAGE를 기반으로 totalPages 계산
        totalPages = Math.ceil(ALL_MONSTERS.length / ITEMS_PER_PAGE); 
        
        // 초기 렌더링 시작 (renderMonsterList 내부에서 selectFirstMonster 호출됨)
        renderMonsterList(currentPage);
        
    } catch (error) {
        console.error("데이터 로드 오류:", error);
        listContainer.innerHTML = `<p style="text-align:center;">데이터를 불러오는 데 실패했습니다: ${error.message}</p>`;
    }
}

// 9. 몬스터 목록 보기 방식 전환 함수 
function changeViewMode(newMode) {
    if (currentViewMode !== newMode) {
        currentViewMode = newMode;
        localStorage.setItem('view-mode', newMode); 
        
        // 뷰 모드 전환 시 페이지를 1로 초기화 (페이지형일 때)
        currentPage = 1; 
        
        // 버튼 활성화 상태 업데이트
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        const newActiveBtn = document.querySelector(`.mode-btn[data-mode="${newMode}"]`);
        if (newActiveBtn) {
            newActiveBtn.classList.add('active');
        }
        
        // 몬스터 목록을 새로운 모드로 다시 렌더링 (renderMonsterList 내부에서 selectFirstMonster 호출됨)
        renderMonsterList(currentPage);
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

// 11. 페이지당 아이템 개수 상태 로드 및 적용 (변경 없음)
function loadItemsPerPageState() {
    const storedValue = localStorage.getItem('items-per-page');
    ITEMS_PER_PAGE = storedValue ? parseInt(storedValue) : 8;
    
    if (itemsPerPageSelect) {
        itemsPerPageSelect.value = ITEMS_PER_PAGE;
    }
}

// 12. 페이지당 아이템 개수 변경 처리 
function handleItemsPerPageChange() {
    const newValue = parseInt(itemsPerPageSelect.value);
    if (ITEMS_PER_PAGE !== newValue) {
        ITEMS_PER_PAGE = newValue;
        localStorage.setItem('items-per-page', newValue); 
        
        // 페이지 개수 변경 시, 현재 페이지를 1로 리셋하고 전체 페이지 수를 재계산
        currentPage = 1;
        totalPages = Math.ceil(ALL_MONSTERS.length / ITEMS_PER_PAGE);
        
        // 렌더링 (renderMonsterList 내부에서 selectFirstMonster 호출됨)
        renderMonsterList(currentPage);
    }
}


// =========================================================
// III. 이벤트 리스너 및 초기화 (변경 없음)
// =========================================================

// 페이지네이션 버튼 이벤트 리스너
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

// 탭 버튼 이벤트 리스너 추가
tabBtns.forEach(btn => {
    btn.addEventListener('click', handleTabSwitch);
});

// 다크 모드 스위치 변경 이벤트 리스너
darkModeToggle.addEventListener('change', () => {
    if (darkModeToggle.checked) {
        body.classList.add('dark-mode');
        localStorage.setItem('dark-mode', 'enabled'); 
    } else {
        body.classList.remove('dark-mode');
        localStorage.setItem('dark-mode', 'disabled'); 
    }
});

// 뷰 모드 버튼 이벤트 리스너
if (modeSelectGroup) {
    modeSelectGroup.addEventListener('click', (event) => {
        const target = event.target;
        if (target.classList.contains('mode-btn')) {
            const mode = target.dataset.mode;
            changeViewMode(mode);
        }
    });
}

// 페이지당 아이템 개수 변경 이벤트 리스너
if (itemsPerPageSelect) {
    itemsPerPageSelect.addEventListener('change', handleItemsPerPageChange);
}


// 최종 초기화: DOMContentLoaded 시점에 실행
document.addEventListener('DOMContentLoaded', () => {
    // 1. 다크 모드 상태를 먼저 로드하여 테마를 적용합니다.
    loadDarkModeState();
    
    // 2. 뷰 모드 상태를 로드하여 초기 모드 버튼을 활성화합니다.
    loadViewModeState();

    // 3. 페이지당 아이템 개수 상태를 로드합니다.
    loadItemsPerPageState();
    
    // 4. 데이터 및 콘텐츠를 로드합니다. 
    loadData();

    // 5. 초기 탭 설정: 'Guide' 탭을 활성화하고 'Setting' 탭을 숨깁니다.
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
