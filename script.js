
    let ALL_MONSTERS = []; // 모든 몬스터 데이터를 저장할 배열
    const ITEMS_PER_PAGE = 5; // 페이지 당 표시할 몬스터 수
    let currentPage = 1;
    let totalPages = 1;

    const listContainer = document.querySelector('.monster-list');
    const basicInfoContainer = document.querySelector('.basic-info');
    const detailContentContainer = document.querySelector('.detail-content');
    const currentPageSpan = document.querySelector('.current-page');
    const prevPageNav = document.querySelector('.prev-page');
    const nextPageNav = document.querySelector('.next-page');

    // 1. 데이터 로드 함수 (data.json 사용)
    async function loadData() {
        try {
            const response = await fetch('data.json');
            if (!response.ok) {
                throw new Error('data.json 파일을 불러오지 못했습니다.');
            }
            ALL_MONSTERS = await response.json();
            totalPages = Math.ceil(ALL_MONSTERS.length / ITEMS_PER_PAGE);
            
            // 초기 렌더링 시작
            renderMonsterList(currentPage);
            // 초기 선택된 몬스터 상세 정보 렌더링 (첫 페이지의 첫 몬스터)
            if (ALL_MONSTERS.length > 0) {
                renderDetailPanel(ALL_MONSTERS[0]);
                // listContainer.querySelector(`.monster-item[data-id="${ALL_MONSTERS[0].id}"]`).classList.add('selected');
                // DOM이 렌더링된 후에 선택되도록 setTimeout 사용 (안정성 확보)
                 setTimeout(() => {
                    const firstItem = document.querySelector('.monster-list .monster-item');
                    if(firstItem) firstItem.classList.add('selected');
                }, 0);
            }
            updatePaginationControls();
        } catch (error) {
            console.error("데이터 로드 오류:", error);
            listContainer.innerHTML = `<p style="text-align:center;">데이터를 불러오는 데 실패했습니다: ${error.message}</p>`;
        }
    }

    // 2. 몬스터 목록 렌더링 함수
    function renderMonsterList(page) {
        listContainer.innerHTML = '';
        const startIndex = (page - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const pageMonsters = ALL_MONSTERS.slice(startIndex, endIndex);

        pageMonsters.forEach(monster => {
            const html = `
                <div class="monster-item" data-id="${monster.id}">
                    <span class="monster-name">${monster.id}. ${monster.name} <span class="monster-star">★${monster.star}</span></span>
                    <button class="detail-btn">상세보기</button>
                </div>
            `;
            listContainer.innerHTML += html;
        });

        // 이벤트 리스너 할당
        document.querySelectorAll('.monster-item').forEach(item => {
            item.addEventListener('click', handleMonsterSelect);
        });
    }

    // 3. 몬스터 선택 처리 함수
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

// 4. 상세 패널 렌더링 함수
function renderDetailPanel(monster) {
    // 기본 정보 렌더링 
    let basicHtml = '<h3>기본 정보</h3><div class="basic-info-content">';
    
    // 🚨 수정된 부분: '종류(species)' 항목 추가 🚨
    const basicData = {
        '도감번호': monster.basic.도감번호,
        '이름': monster.basic.이름,
        '종류': monster.species || '미확인', // ⬅️ 새로운 '종류(species)' 항목 추가
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


    // 상세 정보 렌더링 (기존과 동일)
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


    // 5. 페이지네이션 컨트롤 업데이트
    function updatePaginationControls() {
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

    // 6. 페이지 이동 처리
    function changePage(direction) {
        const newPage = currentPage + direction;
        if (newPage >= 1 && newPage <= totalPages) {
            currentPage = newPage;
            renderMonsterList(currentPage);
            updatePaginationControls();
            
            // 페이지 이동 후, 새 페이지의 첫 번째 몬스터를 자동 선택 및 상세 정보 표시
            const firstMonsterInNewPage = ALL_MONSTERS[(currentPage - 1) * ITEMS_PER_PAGE];
            if (firstMonsterInNewPage) {
                renderDetailPanel(firstMonsterInNewPage);
                // 새로 렌더링된 DOM 요소에 selected 클래스 추가
                setTimeout(() => {
                    const firstItem = document.querySelector('.monster-list .monster-item');
                    if(firstItem) firstItem.classList.add('selected');
                }, 0);
            }
        }
    }

    // 새로운 DOM 요소 선언 (이 위치가 더 적절함)
    const guideContent = document.getElementById('guide-content');
    const settingContent = document.getElementById('setting-content');
    const tabBtns = document.querySelectorAll('.tab-btn');
    
 // 1. 다크 모드 스위치 요소를 가져옵니다.
        const darkModeToggle = document.getElementById('darkmode-switch');
        const body = document.body;

        // 2. 다크 모드 상태를 로컬 저장소에서 불러오는 함수
        function loadDarkModeState() {
            // 로컬 저장소에 'dark-mode' 상태가 'enabled'로 저장되어 있는지 확인
            const isDarkModeEnabled = localStorage.getItem('dark-mode') === 'enabled';
            
            if (isDarkModeEnabled) {
                // 활성화 상태라면 body에 'dark-mode' 클래스 추가
                body.classList.add('dark-mode');
                // 스위치 체크 상태로 설정
                darkModeToggle.checked = true;
            } else {
                // 비활성화 상태라면 클래스 제거 (기본 라이트 모드)
                body.classList.remove('dark-mode');
                darkModeToggle.checked = false;
            }
        }

        // 3. 스위치 변경 이벤트 리스너 설정
        darkModeToggle.addEventListener('change', () => {
            if (darkModeToggle.checked) {
                // 스위치가 켜지면
                body.classList.add('dark-mode');
                localStorage.setItem('dark-mode', 'enabled'); // 상태 저장
            } else {
                // 스위치가 꺼지면
                body.classList.remove('dark-mode');
                localStorage.setItem('dark-mode', 'disabled'); // 상태 저장
            }
        });

        // 페이지 로드 시 저장된 상태를 적용
        loadDarkModeState();

    // 7. 탭 전환 처리 함수
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

    // 초기 로드 시 데이터 불러오기
    document.addEventListener('DOMContentLoaded', loadData);
