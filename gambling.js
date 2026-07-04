document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('simulation-modal');
    const idInput = document.getElementById('sim-id');
    const pwInput = document.getElementById('sim-pw');
    const progressWrapper = document.getElementById('progress-wrapper');
    const progressBar = document.getElementById('progress-bar');
    const statusText = document.getElementById('sim-status');
    const flashOverlay = document.getElementById('flash-overlay');
    const userBalanceSpan = document.getElementById('user-balance');
    
    // 글로벌 상태
    window.isAuthenticated = false;
    window.userBalance = 0;

    // 페이지 로드 시 모달 숨김
    modal.style.display = 'none';

    const adPopup = document.getElementById('ad-popup-modal');
    // 로드 시 팝업 띄우기 (만약 로컬스토리지에 숨김 처리 안 되어 있다면)
    if (localStorage.getItem('hideAdPopup') !== 'true') {
        adPopup.style.display = 'flex';
    }

    const closeAdPopup = () => {
        adPopup.style.display = 'none';
        localStorage.setItem('hideAdPopup', 'true'); // 한번 보면 숨김 처리
    };

    document.getElementById('btn-ad-close').addEventListener('click', closeAdPopup);
    document.getElementById('btn-ad-confirm').addEventListener('click', closeAdPopup);

    // 화면 내의 거의 모든 유도 버튼들 (.sim-trigger)
    const triggerBtns = document.querySelectorAll('.sim-trigger');
    triggerBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (!window.isAuthenticated) {
                // 비로그인 상태일 때만 모달 열기
                modal.style.display = 'flex';
            }
        });
    });

    // 타이핑 효과 함수
    const typeWriter = (element, text, speed, callback) => {
        let i = 0;
        element.value = '';
        const typing = setInterval(() => {
            if (i < text.length) {
                element.value += text.charAt(i);
                i++;
            } else {
                clearInterval(typing);
                if (callback) setTimeout(callback, 300); // 다음 입력 전 대기
            }
        }, speed);
    };

    // 모달 내부의 버튼(로그인, 회원가입 등) 클릭 시 본격적인 시뮬레이션 시작
    const innerBtns = document.querySelectorAll('.sim-trigger-inner');
    let isSimulating = false;

    innerBtns.forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            if (isSimulating) return;
            isSimulating = true;
            
            // 프로그레스 바 및 상태 텍스트 노출
            progressWrapper.classList.remove('hidden');
            statusText.classList.remove('hidden');
            
            // 번쩍임 효과 시작
            flashOverlay.classList.add('flash-anim');

            startSimulation();
        });
    });

    // 시뮬레이션 시퀀스
    const startSimulation = () => {
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += 1;
            if (progress <= 100) {
                progressBar.style.width = `${progress}%`;
            }
        }, 50); // 데모를 위해 속도 약간 상향

        setTimeout(() => {
            statusText.innerText = "단말기 고유번호 및 기기 정보 추출 중...";
            typeWriter(idInput, "hack_user_" + Math.floor(Math.random() * 1000), 50, () => {
                statusText.innerText = "연락처 및 사진첩 권한 자동 승인 중...";
                typeWriter(pwInput, "********", 50, () => {
                    statusText.innerText = "가상 계좌 자동 발급 및 명의 도용 진행 완료...";
                    
                    setTimeout(() => {
                        clearInterval(progressInterval);
                        progressBar.style.width = "100%";
                        statusText.style.color = "#ff3366";
                        statusText.innerText = "⚠️ 회원가입이 강제 완료되었습니다! ⚠️";
                        
                        // 잠시 후 꽁머니 지급 및 게임 진입 허용
                        setTimeout(() => {
                            flashOverlay.classList.remove('flash-anim');
                            alert('⚠️ [경고] 당신의 정보가 유출되는 전형적인 불법 사이트 수법입니다.\n\n하지만 데모를 위해, 꽁머니 100,000원이 지급되었습니다.\n이제 닫기 버튼을 누르고 도박의 덫에 빠지는 과정을 직접 체험해 보세요.');
                            
                            // 로그인 완료 처리
                            modal.style.display = 'none';
                            window.isAuthenticated = true;
                            window.userBalance = 100000;
                            
                            // 잔액 업데이트
                            userBalanceSpan.innerText = window.userBalance.toLocaleString() + ' 원';
                            userBalanceSpan.classList.remove('hidden');
                            
                            // 커스텀 이벤트 발생시켜서 games.js에서 감지하도록 함
                            document.dispatchEvent(new Event('loginComplete'));
                        }, 1500);
                    }, 1500);
                });
            });
        }, 500);
    };

    // 글로벌 잔액 업데이트 함수
    window.updateBalance = function(amount) {
        window.userBalance += amount;
        userBalanceSpan.innerText = window.userBalance.toLocaleString() + ' 원';
        
        // 잔액 변동 시 깜빡임 효과
        userBalanceSpan.style.color = amount > 0 ? '#0f0' : '#f00';
        setTimeout(() => {
            userBalanceSpan.style.color = '#fff';
        }, 500);
    };

    // 뒤로가기 방지 로직 보류 (게임 플레이를 위해)
    // window.history.pushState(null, null, window.location.href);
    // window.onpopstate = function () {
    //     window.history.go(1);
    // };
});
