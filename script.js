// =========================================================
// I. 전역 변수 및 DOM 요소 선언
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

// 다크 모드 및 설정 관련 DOM 요소
const darkModeToggle = document.getElementById('darkmode-switch');
const imageModeToggle = document.getElementById('image-mode-switch');
// 🆕 [추가됨] 두꺼운 테두리 토글 스위치 선택
const thickBorderToggle = document.getElementById('thick-border-switch'); 

const body = document.body;

// 몬스터 보기 모드 및 페이지당 아이템 설정 관련 DOM 요소
const modeSelectGroup = document.querySelector('.mode-select-group');
const itemsPerPageSelect = document.getElementById('items-per-page-select');
let currentViewMode = localStorage.getItem('view-mode') || 'card'; 

// 몬스터 설정 상태 변수 (Local Storage에서 로드)
let isImageMode = localStorage.getItem('image-mode') === 'enabled';
// 🆕 [추가됨] 두꺼운 테두리 모드 상태 변수
let isThickBorderMode = localStorage.getItem('thick-border-mode') === 'enabled';


// =========================================================
// II. 핵심 기능 함수 정의
// =========================================================

/**
 * JSON 가이드 데이터를 파싱하여 HTML 블록으로 변환
 */
function parseGuide(guideArray) {
    let htmlOutput = '';
    const regex = /(.+?)\[(.+?)\]/; // 정규식: 제목[내용]

    if (!guideArray) return ''; // 예외 처리

    guideArray.forEach(item => {
        const match = item.match(regex);

        if (match) {
            const title = match[1].trim(); 
            const contentString = match[2].trim(); 
            
            const contentItems = contentString.split(',').map(s => s.trim()).filter(s => s.length > 0);

            if (contentItems.length > 0) {
                htmlOutput += `<div class="guide-block">`;
                htmlOutput += `<h3 class="guide-block-title">${title}</h3>`;
                htmlOutput += `<ul class="guide-block-list">`;
                contentItems.forEach(content => {
                    const formattedContent = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
                    htmlOutput += `<li>${formattedContent}</li>`;
                });
                htmlOutput += `</ul>`;
                htmlOutput += `</div>`; 
            }
        } else {
            const formattedItem = item.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
            if (formattedItem.trim() !== "") {
                 htmlOutput += `<p class="guide-normal-text">${formattedItem}</p>`;
            }
        }
    });

    if (htmlOutput) {
        return `<div class="guide-container">${htmlOutput}</div>`;
    }
    return '<div class="guide-container"><p class="guide-normal-text">정보가 준비 중입니다.</p></div>';
}

// 헬퍼 함수: 이전에 선택된 항목을 제거하고 현재 항목을 선택
function selectMonsterItem(element, monster) {
    const previouslySelected = listContainer.querySelector('.monster-item.selected');
    if (previouslySelected) {
        previouslySelected.classList.remove('selected');
    }

    if (element) { 
        element.classList.add('selected');
    }
    
    if (monster) { 
        renderDetailPanel(monster);
    }
}

// 헬퍼 함수: 목록 렌더링 후 첫 번째 항목 선택
function selectFirstMonster() {
    const firstItem = listContainer.querySelector('.monster-item');
    if (firstItem) {
        const monsterId = parseInt(firstItem.dataset.id); 
        const firstMonster = ALL_MONSTERS.find(m => m.id === monsterId);
        selectMonsterItem(firstItem, firstMonster);
    } else {
        basicInfoContainer.innerHTML = '<h3>몬스터 목록 없음</h3>';
        detailContentContainer.innerHTML = '';
    }
}

// 1. 몬스터 선택 처리 함수 
function handleMonsterSelect(event) {
    const selectedItem = event.currentTarget; 
    const monsterId = parseInt(selectedItem.dataset.id);
    const selectedMonster = ALL_MONSTERS.find(m => m.id === monsterId);

    selectMonsterItem(selectedItem, selectedMonster);
}

// 2. 상세 패널 렌더링 함수
function renderDetailPanel(monster) {
    if (!monster || !monster.basic) {
        basicInfoContainer.innerHTML = '<h3>오류 발생</h3><p>선택된 몬스터 정보가 유효하지 않습니다.</p>';
        detailContentContainer.innerHTML = '';
        return;
    }

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
        basicHtml += `<p><strong>${key}:</strong> ${value || 'N/A'}</p>`; 
    }
    basicHtml += '</div>';
    basicInfoContainer.innerHTML = basicHtml;

    let detailHtml = `<h3>${monster.detail?.title || '상세 정보'}</h3>`; 
    
    if (monster.detail?.guide && monster.detail.guide.length > 0) {
        detailHtml += parseGuide(monster.detail.guide);
    } else {
         detailHtml += '<div class="guide-container"><p class="guide-normal-text">정보가 준비 중입니다.</p></div>';
    }

    detailContentContainer.innerHTML = detailHtml;
}

/**
 * 몬스터 아이템 HTML 생성 (카드 뷰)
 * - 이미지 모드 및 두꺼운 테두리 모드 상태를 반영합니다.
 */
function generateCardHtml(monster, monsterColor) {
    let detailButtonHtml = '<button class="detail-btn" style="display:none;">상세</button>';
    let innerContent = '';
    
    // 🆕 테두리 스타일 변수 초기화
    let itemStyle = ''; 
    
    // 🆕 두꺼운 테두리 모드 활성화 시 몬스터 상징색을 테두리 색상으로 지정
    if (isThickBorderMode) {
        itemStyle = `border-color: ${monsterColor};`; 
    }

    // 이미지 모드 활성화 시 이미지 태그 생성
    if (isImageMode) {
        const imgSrc = `micon${monster.basic.도감번호}.png`;
        // 이미지가 있으면 보여주고, 로드 실패(onerror)시 숨겨서 배경색이 보이게 함
        innerContent = `<img src="${imgSrc}" class="card-monster-img" alt="${monster.name}" onerror="this.style.display='none'">`;
    }

    return `
        <div class="monster-item" data-id="${monster.id}" style="${itemStyle}">
            <div class="monster-symbol-info" style="background-color: ${monsterColor};">
                ${innerContent}
            </div>
            <span class="monster-name">${monster.name}</span>
            ${detailButtonHtml}
        </div>
    `;
}

/**
 * 몬스터 아이템 HTML 생성 (목록/페이지 뷰)
 * 🚨 [수정됨]: 상징색을 이용한 중앙 세로선 추가 (monster-color-bar)
 */
function generatePaginationHtml(monster, monsterColor) {
    let detailButtonHtml = '<button class="detail-btn">상세</button>';
    const monsterIdCode = String(monster.id).padStart(3, '0'); 

    return `
        <div class="monster-item" data-id="${monster.id}">
            <div class="monster-symbol-info" style="border-bottom-color:${monsterColor};">
                <div class="monster-color-bar" style="background-color: ${monsterColor};"></div>
                <span class="monster-id-code">${monsterIdCode}</span> 
            </div>
            <span class="monster-name">${monster.name}</span>
            ${detailButtonHtml}
        </div>
    `;
}

// 3. 몬스터 목록 렌더링 함수
function renderMonsterList(page) {
    if (!listContainer) return; 

    listContainer.innerHTML = '';
    
    // 🆕 [수정됨] 관련 클래스 모두 제거 후 재설정
    listContainer.classList.remove('card-view', 'pagination-view', 'image-hidden', 'thick-border');
    
    listContainer.classList.add(currentViewMode === 'card' ? 'card-view' : 'pagination-view');

    let monstersToRender = [];
    
    if (currentViewMode === 'card') {
        monstersToRender = ALL_MONSTERS; // 카드뷰는 전체 표시
    } else {
        // 목록형 뷰의 경우 페이징 처리
        const startIndex = (page - 1) * ITEMS_PER_PAGE; 
        const endIndex = startIndex + ITEMS_PER_PAGE; 
        monstersToRender = ALL_MONSTERS.slice(startIndex, endIndex);
    }
    
    let listHtml = '';

    // 몬스터 목록 렌더링 및 모드별 클래스 추가
    if (currentViewMode === 'card') {
        // 이미지 모드가 비활성화 상태일 때 image-hidden 클래스 추가 (CSS에서 6px 높이 적용)
        if (!isImageMode) {
            listContainer.classList.add('image-hidden');
        }
        // 🆕 두꺼운 테두리 모드가 활성화 상태일 때 thick-border 클래스 추가 (CSS에서 굵은 테두리 적용)
        if (isThickBorderMode) {
            listContainer.classList.add('thick-border');
        }
    }

    monstersToRender.forEach(monster => {
        const monsterColor = monster.color_code || 'var(--accent-color)'; 
        
        if (currentViewMode === 'card') {
            listHtml += generateCardHtml(monster, monsterColor);
        } else {
            listHtml += generatePaginationHtml(monster, monsterColor);
        }
    });

    listContainer.innerHTML = listHtml;

    document.querySelectorAll('.monster-item').forEach(item => {
        item.addEventListener('click', handleMonsterSelect);
    });
    
    updatePaginationControls();
    selectFirstMonster();
}


// 4. 페이지네이션 컨트롤 업데이트
function updatePaginationControls() {
    const paginationDiv = document.querySelector('.pagination');
    
    if (!paginationDiv || !currentPageSpan || !prevPageNav || !nextPageNav) return; 
    
    if (currentViewMode === 'card') {
        paginationDiv.style.display = 'none';
        return;
    }
    
    paginationDiv.style.display = 'flex'; 
    currentPageSpan.textContent = `${currentPage} / ${totalPages}`;
    
    if (currentPage <= 1) { 
        prevPageNav.classList.add('disabled');
    } else {
        prevPageNav.classList.remove('disabled');
    }

    if (currentPage >= totalPages) { 
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
    }
}

// 6. 탭 전환 처리 함수
function handleTabSwitch(event) {
    const tabBtn = event.target.closest('.tab-btn');
    if (!tabBtn) return;

    const targetTab = tabBtn.dataset.tab;

    tabBtns.forEach(btn => btn.classList.remove('active'));
    tabBtn.classList.add('active');

    if (guideContent && settingContent) {
        if (targetTab === 'guide') {
            guideContent.style.display = 'block';
            settingContent.style.display = 'none';
        } else if (targetTab === 'setting') {
            guideContent.style.display = 'none';
            settingContent.style.display = 'block';
        }
    }
}

// 7. 다크 모드 상태 로드 함수
function loadDarkModeState() {
    const isDarkModeEnabled = localStorage.getItem('dark-mode') === 'enabled';
    
    if (isDarkModeEnabled) {
        body.classList.add('dark-mode');
        if(darkModeToggle) darkModeToggle.checked = true;
    } else {
        body.classList.remove('dark-mode');
        if(darkModeToggle) darkModeToggle.checked = false;
    }
}

// 8. 이미지 모드 상태 로드 및 적용 함수
function loadImageModeState() {
    if (imageModeToggle) {
        imageModeToggle.checked = isImageMode;
    }
}

// 🆕 [추가됨] 두꺼운 테두리 모드 상태 로드 및 적용 함수
function loadThickBorderModeState() {
    if (thickBorderToggle) {
        thickBorderToggle.checked = isThickBorderMode;
    }
}

// 9. 데이터 로드 및 초기 설정 함수 
async function loadData() {
    loadItemsPerPageState(); 
    
    try {
        const response = await fetch('data.json');
        if (!response.ok) {
            throw new Error('data.json 파일을 불러오지 못했습니다.');
        }
        ALL_MONSTERS = await response.json();
        
        totalPages = Math.ceil(ALL_MONSTERS.length / ITEMS_PER_PAGE); 
        
        renderMonsterList(currentPage);
        
    } catch (error) {
        console.error("데이터 로드 오류:", error);
        if (listContainer) {
            listContainer.innerHTML = `<p style="text-align:center;">데이터를 불러오는 데 실패했습니다: ${error.message}</p>`;
        }
    }
}

// 10. 몬스터 목록 보기 방식 전환 함수 
function changeViewMode(newMode) {
    if (currentViewMode !== newMode) {
        currentViewMode = newMode;
        localStorage.setItem('view-mode', newMode); 
        
        currentPage = 1; 
        
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        const newActiveBtn = document.querySelector(`.mode-btn[data-mode="${newMode}"]`);
        if (newActiveBtn) {
            newActiveBtn.classList.add('active');
        }
        
        if (newMode === 'pagination') {
            totalPages = Math.ceil(ALL_MONSTERS.length / ITEMS_PER_PAGE);
        }
        
        renderMonsterList(currentPage);
    }
}

// 11. 뷰 모드 초기 상태 로드 및 적용
function loadViewModeState() {
    currentViewMode = localStorage.getItem('view-mode') || 'card';
    
    const initialActiveBtn = document.querySelector(`.mode-btn[data-mode="${currentViewMode}"]`);
    if (initialActiveBtn) {
        document.querySelectorAll('.mode-btn').forEach(btn => btn.classList.remove('active'));
        initialActiveBtn.classList.add('active');
    }
}

// 12. 페이지당 아이템 개수 상태 로드 및 적용
function loadItemsPerPageState() {
    const storedValue = localStorage.getItem('items-per-page');
    if (storedValue) {
        ITEMS_PER_PAGE = parseInt(storedValue);
    }
    
    if (itemsPerPageSelect) {
        itemsPerPageSelect.value = ITEMS_PER_PAGE;
    }
}

// 13. 페이지당 아이템 개수 변경 처리 
function handleItemsPerPageChange() {
    if (!itemsPerPageSelect) return;
    
    const newValue = parseInt(itemsPerPageSelect.value);
    if (ITEMS_PER_PAGE !== newValue) {
        ITEMS_PER_PAGE = newValue;
        localStorage.setItem('items-per-page', newValue); 
        
        currentPage = 1;
        totalPages = Math.ceil(ALL_MONSTERS.length / ITEMS_PER_PAGE);
        
        renderMonsterList(currentPage);
    }
}


// =========================================================
// III. 이벤트 리스너 및 초기화
// =========================================================

// 페이지네이션 버튼 이벤트 리스너
if(prevPageNav) { 
    prevPageNav.addEventListener('click', () => {
        if (currentPage > 1) {
            changePage(-1);
        }
    });
}

if(nextPageNav) { 
    nextPageNav.addEventListener('click', () => {
        if (currentPage < totalPages) {
            changePage(1);
        }
    });
}

// 탭 버튼 이벤트 리스너 추가
tabBtns.forEach(btn => {
    btn.addEventListener('click', handleTabSwitch);
});

// 다크 모드 스위치 변경 이벤트 리스너
if(darkModeToggle){
    darkModeToggle.addEventListener('change', () => {
        if (darkModeToggle.checked) {
            body.classList.add('dark-mode');
            localStorage.setItem('dark-mode', 'enabled'); 
        } else {
            body.classList.remove('dark-mode');
            localStorage.setItem('dark-mode', 'disabled'); 
        }
    });
}

// 이미지 모드 스위치 변경 이벤트 리스너
if(imageModeToggle) {
    imageModeToggle.addEventListener('change', () => {
        isImageMode = imageModeToggle.checked;
        localStorage.setItem('image-mode', isImageMode ? 'enabled' : 'disabled');
        renderMonsterList(currentPage);
    });
}

// 🆕 [추가됨] 두꺼운 테두리 모드 스위치 변경 이벤트 리스너
if(thickBorderToggle) {
    thickBorderToggle.addEventListener('change', () => {
        isThickBorderMode = thickBorderToggle.checked;
        localStorage.setItem('thick-border-mode', isThickBorderMode ? 'enabled' : 'disabled');
        // 설정 변경 시 즉시 리스트 다시 렌더링 (카드뷰에 즉각 반영)
        renderMonsterList(currentPage);
    });
}

// 뷰 모드 버튼 이벤트 리스너
if (modeSelectGroup) {
    modeSelectGroup.addEventListener('click', (event) => {
        const targetBtn = event.target.closest('.mode-btn');
        if (targetBtn) {
            const mode = targetBtn.dataset.mode;
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
    // 1. 상태 로드
    loadDarkModeState();
    loadViewModeState();
    loadImageModeState(); 
    loadThickBorderModeState(); // 🆕 두꺼운 테두리 모드 상태 로드
    
    // 2. 데이터 및 콘텐츠 로드
    loadData();

    // 3. 초기 탭 설정
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

// Footer 생성 (선택 사항)
const footerHTML = "<footer>[v1.5] 설산의 고대수(古代獸), 환수(幻獣)</footer>";
const container = document.querySelector('.container');
if (container) {
    container.insertAdjacentHTML('beforeend', footerHTML);
}
