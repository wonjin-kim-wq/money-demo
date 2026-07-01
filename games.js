document.addEventListener('DOMContentLoaded', () => {
    const gameOverlay = document.getElementById('game-overlay');
    const closeOverlayBtn = document.getElementById('close-overlay');
    const overlayTitle = document.getElementById('overlay-title');
    const overlayContent = document.getElementById('overlay-content');
    const bettingCartSheet = document.getElementById('betting-cart-sheet');
    const closeCartBtn = document.getElementById('close-cart');
    
    // 조작된 확률을 위한 플레이 횟수 카운터
    window.playCount = 0;

    // Web Audio API 셋업 (사운드 이펙트용)
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    let audioCtx;

    function initAudio() {
        if (!audioCtx) {
            audioCtx = new AudioContext();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function playSound(type) {
        if (!audioCtx) return;
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        if (type === 'tick') {
            osc.type = 'square';
            osc.frequency.setValueAtTime(800, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.05, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
        } else if (type === 'win') {
            // 코인 쏟아지는 경쾌한 소리
            osc.type = 'sine';
            osc.frequency.setValueAtTime(500, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(1200, audioCtx.currentTime + 0.3);
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
        } else if (type === 'lose') {
            // 둔탁하고 기분 나쁜 소리 (버저)
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(150, audioCtx.currentTime);
            osc.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.5);
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.5);
        } else if (type === 'chip') {
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(1000, audioCtx.currentTime);
            gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.05);
        }
    }

    // 시각적 잭팟/패배 이펙트
    function showWinEffect() {
        playSound('win');
        const container = document.getElementById('mobile-container');
        const winOverlay = document.createElement('div');
        winOverlay.style.position = 'absolute';
        winOverlay.style.top = '0'; winOverlay.style.left = '0';
        winOverlay.style.width = '100%'; winOverlay.style.height = '100%';
        winOverlay.style.backgroundColor = 'rgba(255, 215, 0, 0.3)';
        winOverlay.style.zIndex = '2000';
        winOverlay.style.pointerEvents = 'none';
        winOverlay.style.animation = 'flash 0.3s 3'; // CSS의 flash 재사용
        container.appendChild(winOverlay);
        
        // 코인 비
        for(let i=0; i<30; i++) {
            let coin = document.createElement('div');
            coin.innerText = '🪙';
            coin.style.position = 'absolute';
            coin.style.left = Math.random() * 100 + '%';
            coin.style.top = '-10%';
            coin.style.fontSize = (Math.random() * 20 + 15) + 'px';
            coin.style.zIndex = '2001';
            coin.style.transition = 'top 1s cubic-bezier(0.25, 0.46, 0.45, 0.94), transform 1s linear';
            container.appendChild(coin);
            
            setTimeout(() => {
                coin.style.top = '110%';
                coin.style.transform = `rotate(${Math.random() * 720}deg)`;
            }, 50);
            
            setTimeout(() => coin.remove(), 1050);
        }
        setTimeout(() => winOverlay.remove(), 1000);
    }

    function showLoseEffect() {
        playSound('lose');
        const container = document.getElementById('mobile-container');
        // 강제 흔들림 (CSS 정의 필요 없도록 직접 인라인 처리)
        container.animate([
            { transform: 'translateX(0)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(-10px)' },
            { transform: 'translateX(10px)' },
            { transform: 'translateX(0)' }
        ], { duration: 400 });
        
        const loseOverlay = document.createElement('div');
        loseOverlay.style.position = 'absolute';
        loseOverlay.style.top = '0'; loseOverlay.style.left = '0';
        loseOverlay.style.width = '100%'; loseOverlay.style.height = '100%';
        loseOverlay.style.backgroundColor = 'rgba(255, 0, 0, 0.6)';
        loseOverlay.style.zIndex = '2000';
        loseOverlay.style.pointerEvents = 'none';
        container.appendChild(loseOverlay);
        
        setTimeout(() => loseOverlay.remove(), 500);
    }

    // 오버레이 닫기
    closeOverlayBtn.addEventListener('click', () => {
        gameOverlay.classList.add('hidden');
        overlayContent.innerHTML = ''; 
    });

    closeCartBtn.addEventListener('click', () => {
        bettingCartSheet.classList.add('hidden');
    });
    
    const cartNavBtn = document.querySelectorAll('.nav-item')[0];
    if (cartNavBtn) {
        cartNavBtn.addEventListener('click', () => {
            if (!window.isAuthenticated) return;
            initAudio();
            bettingCartSheet.classList.remove('hidden');
        });
    }

    document.querySelectorAll('.casino-card').forEach((card) => {
        card.addEventListener('click', () => {
            if (!window.isAuthenticated) return;
            initAudio();
            const title = card.querySelector('.card-title').innerText;
            if (title.includes('바카라')) openBaccaratGame(title);
            else if (title.includes('홀짝')) openMiniGame(title, 'lotus');
            else if (title.includes('사다리')) openMiniGame(title, 'ladder');
            else openConstruction(title);
        });
    });

    document.querySelectorAll('.menu-item').forEach(menu => {
        menu.addEventListener('click', () => {
            if (!window.isAuthenticated) return;
            initAudio();
            const title = menu.innerText;
            if (title.includes('충전')) openDeposit(title);
            else openConstruction(title);
        });
    });

    function openConstruction(title) {
        overlayTitle.innerText = title;
        overlayContent.innerHTML = `
            <div style="text-align:center; padding: 50px 20px; color: var(--text-muted);">
                <h2>🚧 준비 중인 게임입니다 🚧</h2>
                <p>교육용 데모 버전에서는 '바카라', '홀짝', '충전' 위주로 체험이 가능합니다.</p>
            </div>
        `;
        gameOverlay.classList.remove('hidden');
    }

    // ==========================================
    // 바카라 / 스피드바카라 (확률 조작 포함)
    // ==========================================
    function openBaccaratGame(title) {
        gameOverlay.setAttribute('data-current-game', title);
        overlayTitle.innerText = title;
        closeOverlayBtn.innerText = '닫기';
        closeOverlayBtn.style.color = 'var(--accent-primary)';
        closeOverlayBtn.style.fontWeight = 'normal';
        gameOverlay.classList.remove('hidden');
        
        let isSpeed = title.includes('스피드');
        let bettingTime = isSpeed ? 7 : 12; // 더욱 짧고 자극적으로
        
        overlayContent.innerHTML = `
            <div class="game-container">
                <div class="dealer-area" id="dealer-bg">
                    <div class="card-animation-area">
                        <span style="font-size: 5rem;">🃏</span><span style="font-size: 5rem;">🃏</span>
                    </div>
                    <div class="timer-bar-container">
                        <div id="baccarat-timer" class="timer-bar"></div>
                    </div>
                    <div style="position: absolute; top: 10px; right: 10px; color: yellow; font-size: 0.9rem; font-weight: bold; background: rgba(0,0,0,0.5); padding: 5px; border-radius: 4px;">
                        마감까지: <span id="baccarat-time-text">${bettingTime}</span>초
                    </div>
                </div>
                
                <div style="text-align: center; color: #fff; font-size: 1rem; margin-top: 5px;">현재 잔액: <b style="color:var(--accent-primary);">${window.userBalance.toLocaleString()}</b> 원</div>
                <div style="text-align: center; color: #aaa; font-size: 0.8rem;">(1회 배팅: 10,000 원)</div>

                <div class="betting-board" id="baccarat-board">
                    <div class="bet-area player" data-type="player" data-rate="2.00">
                        <b style="font-size: 1.2rem;">플레이어</b>
                        <span class="bet-rate">2.00</span>
                    </div>
                    <div class="bet-area tie" data-type="tie" data-rate="8.00">
                        <b style="font-size: 1.2rem;">타이</b>
                        <span class="bet-rate">8.00</span>
                    </div>
                    <div class="bet-area banker" data-type="banker" data-rate="1.95">
                        <b style="font-size: 1.2rem;">뱅커</b>
                        <span class="bet-rate">1.95</span>
                    </div>
                </div>
            </div>
        `;

        const timerBar = document.getElementById('baccarat-timer');
        const timeText = document.getElementById('baccarat-time-text');
        const board = document.getElementById('baccarat-board');
        
        let timeLeft = bettingTime;
        let isBettingClosed = false;
        let userBets = { player: 0, banker: 0, tie: 0 };
        let selectedType = null;
        
        board.querySelectorAll('.bet-area').forEach(area => {
            area.addEventListener('click', () => {
                if (isBettingClosed) {
                    playSound('lose');
                    alert('배팅이 마감되었습니다.');
                    return;
                }
                if (window.userBalance < 10000) {
                    playSound('lose');
                    alert('잔액이 부족합니다. 충전해주세요.');
                    return;
                }
                
                playSound('chip');
                window.updateBalance(-10000);
                const type = area.getAttribute('data-type');
                userBets[type] += 10000;
                selectedType = type; // 조작을 위해 기록
                
                const chip = document.createElement('div');
                chip.className = 'chip';
                chip.innerText = '1만';
                chip.style.marginTop = (Math.random() * 20 - 10) + 'px';
                chip.style.marginLeft = (Math.random() * 20 - 10) + 'px';
                area.appendChild(chip);
                
                // 해당 영역 하이라이트 유지
                board.querySelectorAll('.bet-area').forEach(a => a.classList.remove('selected'));
                area.classList.add('selected');
            });
        });

        // 조급함 유발 타이머
        const interval = setInterval(() => {
            if (!gameOverlay.classList.contains('hidden') && gameOverlay.getAttribute('data-current-game') === title) {
                timeLeft -= 0.1;
                timeText.innerText = Math.max(0, Math.ceil(timeLeft));
                
                let percent = (timeLeft / bettingTime) * 100;
                timerBar.style.width = percent + '%';
                
                // 마지막 3초: 초조함 유발
                if (timeLeft <= 3.5 && timeLeft > 0) {
                    // 0.5초마다 틱 소리
                    if (Math.abs(timeLeft % 0.5) < 0.1) playSound('tick');
                    
                    if (!timerBar.classList.contains('warning')) {
                        timerBar.classList.add('warning');
                        timeText.style.color = 'red';
                        timeText.style.fontSize = '1.5rem';
                        document.getElementById('dealer-bg').style.boxShadow = 'inset 0 0 50px rgba(255,0,0,0.5)';
                    }
                }
                
                if (timeLeft <= 0) {
                    clearInterval(interval);
                    isBettingClosed = true;
                    timeText.innerText = '마감';
                    timerBar.style.width = '0%';
                    timerBar.classList.remove('warning');
                    document.getElementById('dealer-bg').style.boxShadow = 'none';
                    
                    showBaccaratResult(selectedType);
                }
            } else {
                clearInterval(interval);
            }
        }, 100);

        function showBaccaratResult(betType) {
            window.playCount++;
            
            // 핵심: 조작된 확률 (4번까지는 사용자가 건 쪽에 무조건 승리, 이후 무조건 패배)
            let result;
            if (betType) {
                if (window.playCount <= 4) {
                    // 무조건 적중
                    result = betType;
                } else {
                    // 무조건 실패 (사용자가 안 건 쪽 선택)
                    const others = ['player', 'banker', 'tie'].filter(t => t !== betType);
                    result = others[Math.floor(Math.random() * others.length)];
                }
            } else {
                // 배팅 안했으면 그냥 랜덤
                const outcomes = ['player', 'banker', 'tie'];
                result = outcomes[Math.floor(Math.random() * 3)];
            }

            const resultName = result === 'player' ? '플레이어' : (result === 'banker' ? '뱅커' : '타이');
            
            let winAmount = 0;
            if (userBets[result] > 0) {
                let rate = parseFloat(document.querySelector(`.bet-area.${result}`).getAttribute('data-rate'));
                winAmount = userBets[result] * rate;
                window.updateBalance(winAmount);
            }
            
            board.querySelectorAll('.bet-area').forEach(a => {
                a.style.opacity = '0.3';
                a.classList.remove('selected');
            });
            document.querySelector(`.bet-area.${result}`).style.opacity = '1';
            document.querySelector(`.bet-area.${result}`).classList.add('selected');
            
            const popup = document.createElement('div');
            popup.className = 'result-popup';
            
            if (winAmount > 0) {
                showWinEffect();
                popup.innerHTML = `
                    <h2 style="font-size: 2rem;">${resultName} 승!</h2>
                    <div class="amount" style="font-size: 2.5rem; font-weight: bold; color: #ffd700;">+${winAmount.toLocaleString()} 원</div>
                    <p style="color:#fff;">계속해서 칩을 쓸어담으세요!</p>
                `;
            } else {
                showLoseEffect();
                popup.innerHTML = `
                    <h2 style="color: #ff3366;">${resultName} 승...</h2>
                    <div style="color:red; font-size: 1.5rem; font-weight: bold; margin-top: 10px;">전액 탕진</div>
                    <p style="color:#aaa;">아쉽네요. 다음 판에 복구하세요.</p>
                `;
            }
            
            overlayContent.appendChild(popup);
            
            setTimeout(() => {
                if (!gameOverlay.classList.contains('hidden')) {
                    // 다시 게임 화면 렌더링해서 무한 반복 유도
                    openBaccaratGame(title);
                }
            }, 3000);
        }
    }

    // ==========================================
    // 미니게임 (사다리 / 홀짝) 공통 모듈 (확률 조작, 바람잡이 포함)
    // ==========================================
    let chatInterval = null;

    function openMiniGame(title, gameType) {
        gameOverlay.setAttribute('data-current-game', title);
        overlayTitle.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; position: relative;">
                <span style="color:#fff; font-weight:bold;">${title}</span>
                <span id="help-btn" style="position: absolute; right: 0; background: #333; border: 1px solid #555; color: #fff; font-size: 0.8rem; padding: 2px 8px; border-radius: 12px; cursor: pointer;">? 게임 방법</span>
            </div>
        `;
        closeOverlayBtn.innerText = '< 뒤로';
        closeOverlayBtn.style.color = '#ffd700';
        closeOverlayBtn.style.fontWeight = 'bold';
        
        gameOverlay.classList.remove('hidden');
        if(chatInterval) clearInterval(chatInterval);
        
        let isLadder = gameType === 'ladder';
        let animHtml = '';
        if (isLadder) {
            animHtml = `
                <svg class="ladder-svg-container" id="ladder-svg" viewBox="0 0 100 100">
                    <!-- 초기 더미 렌더링 (execute 시점에 실제 로직 렌더링) -->
                    <line x1="20" y1="10" x2="20" y2="90" class="ladder-base-line" />
                    <line x1="80" y1="10" x2="80" y2="90" class="ladder-base-line" />
                    <line x1="20" y1="30" x2="80" y2="30" class="ladder-base-line" />
                    <line x1="20" y1="50" x2="80" y2="50" class="ladder-base-line" />
                    <line x1="20" y1="70" x2="80" y2="70" class="ladder-base-line" />
                </svg>
                <div class="ladder-result" id="ladder-result-text"></div>
            `;
        } else {
            animHtml = `
                <div class="powerball-machine">
                    <div class="pb-ball">🎱</div>
                    <div class="pb-ball">🔴</div>
                    <div class="pb-ball">🔵</div>
                    <div class="pb-result" id="pb-result"></div>
                </div>
            `;
        }
        let optionsHtml = '';
        
        if (isLadder) {
            optionsHtml = `
                <div class="mg-btn blue-btn option-btn" data-type="left">
                    <span class="title">좌출발</span><span class="rate">1.95</span>
                </div>
                <div class="mg-btn red-btn option-btn" data-type="right">
                    <span class="title">우출발</span><span class="rate">1.95</span>
                </div>
                <div class="mg-btn blue-btn option-btn" data-type="3line">
                    <span class="title">3줄</span><span class="rate">1.95</span>
                </div>
                <div class="mg-btn red-btn option-btn" data-type="4line">
                    <span class="title">4줄</span><span class="rate">1.95</span>
                </div>
            `;
        } else {
            optionsHtml = `
                <div class="mg-btn blue-btn option-btn" data-type="odd">
                    <span class="title">홀</span><span class="rate">1.95</span>
                </div>
                <div class="mg-btn red-btn option-btn" data-type="even">
                    <span class="title">짝</span><span class="rate">1.95</span>
                </div>
                <div class="mg-btn blue-btn option-btn" data-type="under">
                    <span class="title">언더</span>
                    <span style="font-size: 0.75rem; color: #ffd700; margin: 2px 0; font-weight: bold;">(72.5 미만)</span>
                    <span class="rate">1.95</span>
                </div>
                <div class="mg-btn red-btn option-btn" data-type="over">
                    <span class="title">오버</span>
                    <span style="font-size: 0.75rem; color: #ffd700; margin: 2px 0; font-weight: bold;">(72.5 초과)</span>
                    <span class="rate">1.95</span>
                </div>
            `;
        }

        // 스코어보드 생성 (과거 패턴)
        let scoreboardHtml = '';
        for(let i=0; i<40; i++) {
            let color = Math.random() > 0.5 ? 'red' : 'blue';
            scoreboardHtml += `<span class="sb-dot ${color}"></span>`;
        }
        
        let helpModalHtml = `
            <div id="help-modal" class="hidden" style="position: absolute; top: 0; right: 0; background: rgba(0,0,0,0.95); border: 1px solid var(--accent-primary); padding: 15px; border-radius: 8px; color: #fff; z-index: 2000; width: 250px; box-shadow: 0 0 15px rgba(0,0,0,0.8);">
                <h4 style="margin: 0 0 10px 0; color: #ffd700; border-bottom: 1px solid #555; padding-bottom: 5px;">📖 게임 방법</h4>
                <ul style="padding-left: 20px; margin: 0; font-size: 0.85rem; line-height: 1.6;">
                    <li><b style="color:var(--accent-primary);">[좌/우 출발]</b>: 사다리가 처음 시작되는 위치</li>
                    <li><b style="color:var(--accent-primary);">[3줄/4줄]</b>: 세로줄을 연결하는 가로줄의 총 개수</li>
                    <li><b style="color:var(--accent-primary);">[홀/짝]</b>: 사다리/공 추첨의 최종 번호 결과</li>
                    <li><b style="color:var(--accent-primary);">[언더/오버]</b>: 결과값이 기준점(72.5) 미만인지 초과인지 예측</li>
                </ul>
            </div>
        `;

        overlayContent.innerHTML = `
            ${helpModalHtml}
            <div class="minigame-layout">
                <div class="minigame-screen">
                    <div class="round-info">제 ${Math.floor(Math.random()*100)+150}회차</div>
                    <div id="mg-anim-container">${animHtml}</div>
                    <div class="timer" id="mg-timer">00:15</div>
                </div>
                
                <div style="text-align: center; color: #fff; font-size: 1rem; margin-top: 5px;">현재 잔액: <b id="mg-current-balance" style="color:var(--accent-primary);">${window.userBalance.toLocaleString()}</b> 원</div>
                
                <div class="minigame-options">
                    ${optionsHtml}
                </div>
                
                <div class="quick-bet-area">
                    <div class="quick-btn-grid">
                        <button class="quick-btn" data-val="10000">+1만</button>
                        <button class="quick-btn" data-val="50000">+5만</button>
                        <button class="quick-btn" data-val="100000">+10만</button>
                        <button class="quick-btn" data-val="1000000">+100만</button>
                        <button class="quick-btn max" data-val="max">MAX</button>
                        <button class="quick-btn reset" data-val="reset">초기화</button>
                    </div>
                    <div class="amount-input-box">
                        <span>베팅 금액</span>
                        <b id="mg-bet-amount">0</b>
                    </div>
                    <button class="btn-full-pink" id="mg-bet-btn" style="padding: 15px; font-size: 1.2rem;">베팅하기</button>
                </div>
                
                <div class="scoreboard-area">
                    <div class="scoreboard-header">📈 최근 결과 (출목표)</div>
                    <div class="scoreboard-grid" id="mg-scoreboard">
                        ${scoreboardHtml}
                    </div>
                </div>
                
                <div class="fake-chat-box" id="fake-chat-box">
                    <div class="chat-msg"><span class="name">관리자</span><span class="text">욕설 및 도배는 제재 대상입니다.</span></div>
                </div>
            </div>
        `;
        
        let selectedOption = null;
        let currentBet = 0;
        let isBettingClosed = false;
        
        const betAmountText = document.getElementById('mg-bet-amount');
        const betBtn = document.getElementById('mg-bet-btn');
        const timerText = document.getElementById('mg-timer');
        const chatBox = document.getElementById('fake-chat-box');
        
        const helpBtn = document.getElementById('help-btn');
        const helpModal = document.getElementById('help-modal');
        if (helpBtn && helpModal) {
            helpBtn.addEventListener('mouseenter', () => helpModal.classList.remove('hidden'));
            helpBtn.addEventListener('mouseleave', () => helpModal.classList.add('hidden'));
            helpBtn.addEventListener('click', () => helpModal.classList.toggle('hidden'));
        }
        
        // 퀵 버튼 로직
        overlayContent.querySelectorAll('.quick-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if(isBettingClosed) return;
                playSound('chip');
                const val = btn.getAttribute('data-val');
                if (val === 'reset') {
                    currentBet = 0;
                } else if (val === 'max') {
                    currentBet = window.userBalance;
                } else {
                    currentBet += parseInt(val);
                }
                if (currentBet > window.userBalance) currentBet = window.userBalance;
                betAmountText.innerText = currentBet.toLocaleString();
            });
        });
        
        // 옵션 선택 로직
        overlayContent.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if(isBettingClosed) return;
                playSound('chip');
                overlayContent.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedOption = btn.getAttribute('data-type');
            });
        });
        
        // 바람잡이 채팅 로직
        const fakeNames = ["수익왕", "김회장", "오늘만산다", "홀짝의신", "박프로", "사다리타자", "건물주되자", "ㅅㅅㅅ", "픽스터정"];
        const fakeMsgs = [
            "이번엔 무조건 짝입니다 탑승하세요", 
            "아까 100만 먹음 ㅋㅋㅋ", 
            "좌출발 픽 확실합니까?", 
            "오늘만 500환전 ㅅㅅㅅ", 
            "줄 꺾일때 됐음 반대로 가자", 
            "믿고 풀벳 갑니다", 
            "관리자님 충전 확인좀요"
        ];
        
        chatInterval = setInterval(() => {
            if (gameOverlay.classList.contains('hidden') || gameOverlay.getAttribute('data-current-game') !== title) {
                clearInterval(chatInterval);
                return;
            }
            if (Math.random() > 0.3) {
                const name = fakeNames[Math.floor(Math.random() * fakeNames.length)];
                const msg = fakeMsgs[Math.floor(Math.random() * fakeMsgs.length)];
                const div = document.createElement('div');
                div.className = 'chat-msg';
                div.innerHTML = `<span class="name">${name}</span><span class="text">${msg}</span>`;
                chatBox.appendChild(div);
                chatBox.scrollTop = chatBox.scrollHeight;
            }
        }, 1500);
        
        // 타이머 및 베팅 로직
        let timeLeft = 12; // 자극적으로 짧게
        const gameInterval = setInterval(() => {
            if (gameOverlay.classList.contains('hidden') || gameOverlay.getAttribute('data-current-game') !== title) {
                clearInterval(gameInterval);
                return;
            }
            timeLeft--;
            
            let secs = timeLeft < 10 ? '0' + timeLeft : timeLeft;
            timerText.innerText = `00:${secs}`;
            
            if (timeLeft <= 3 && timeLeft > 0) {
                timerText.classList.add('urgent');
                playSound('tick');
            }
            
            if (timeLeft <= 0) {
                clearInterval(gameInterval);
                timerText.innerText = "마감";
                timerText.classList.remove('urgent');
                isBettingClosed = true;
                
                if(betBtn.innerText === '베팅하기') {
                    betBtn.disabled = true;
                    betBtn.innerText = '베팅 마감됨';
                    betBtn.style.backgroundColor = '#555';
                    executeGameResult();
                } else if (betBtn.innerText === '베팅 완료 (대기중)') {
                    executeGameResult();
                }
            }
        }, 1000);
        
        betBtn.addEventListener('click', () => {
            if (isBettingClosed || betBtn.disabled) return;
            if (!selectedOption) {
                playSound('lose');
                alert('베팅할 옵션을 선택해주세요.');
                return;
            }
            if (currentBet <= 0) {
                playSound('lose');
                alert('베팅 금액을 설정해주세요.');
                return;
            }
            if (currentBet > window.userBalance) {
                playSound('lose');
                alert('잔액이 부족합니다.');
                return;
            }
            
            playSound('chip');
            window.updateBalance(-currentBet);
            document.getElementById('mg-current-balance').innerText = window.userBalance.toLocaleString();
            betBtn.disabled = true;
            betBtn.innerText = '베팅 완료 (대기중)';
            betBtn.style.backgroundColor = '#555';
        });
        
        function executeGameResult() {
            playSound('tick');
            
            window.playCount++;
            let winResult;
            let finalStart, finalLines, isOdd, resultNum, winAmount = 0;
            let won = false;

            if (isLadder) {
                // 사다리 로직 결정
                if (!selectedOption) {
                    finalStart = Math.random() > 0.5 ? 'left' : 'right';
                    finalLines = Math.random() > 0.5 ? 3 : 4;
                    window.playCount--; 
                } else if (window.playCount <= 4) {
                    // 무조건 승리
                    if (selectedOption === 'left' || selectedOption === 'right') {
                        finalStart = selectedOption;
                        finalLines = Math.random() > 0.5 ? 3 : 4;
                    } else {
                        finalLines = selectedOption === '3line' ? 3 : 4;
                        finalStart = Math.random() > 0.5 ? 'left' : 'right';
                    }
                } else {
                    // 무조건 패배
                    if (selectedOption === 'left' || selectedOption === 'right') {
                        finalStart = selectedOption === 'left' ? 'right' : 'left';
                        finalLines = Math.random() > 0.5 ? 3 : 4;
                    } else {
                        finalLines = selectedOption === '3line' ? 4 : 3;
                        finalStart = Math.random() > 0.5 ? 'left' : 'right';
                    }
                }

                // 결과 도출
                isOdd = false;
                if (finalStart === 'left' && finalLines === 4) isOdd = true;
                if (finalStart === 'right' && finalLines === 3) isOdd = true;
                resultNum = isOdd ? (Math.floor(Math.random() * 5) * 2 + 1) : (Math.floor(Math.random() * 5) * 2 + 2);
                
                if (selectedOption === finalStart || selectedOption === finalLines+'line') won = true;
                winResult = won ? selectedOption : 'fake';

                // SVG 렌더링
                const svgBase = document.getElementById('ladder-svg');
                let svgHtml = `
                    <line x1="20" y1="10" x2="20" y2="90" class="ladder-base-line" />
                    <line x1="80" y1="10" x2="80" y2="90" class="ladder-base-line" />
                `;
                const ySpacing = 80 / (finalLines + 1);
                for(let i=1; i<=finalLines; i++) {
                    let y = 10 + i * ySpacing;
                    svgHtml += `<line x1="20" y1="${y}" x2="80" y2="${y}" class="ladder-base-line" />`;
                }
                
                let currentX = (finalStart === 'left') ? 20 : 80;
                let pathD = `M ${currentX} 10 `;
                for(let i=1; i<=finalLines; i++) {
                    let y = 10 + i * ySpacing;
                    pathD += `L ${currentX} ${y} `;
                    currentX = (currentX === 20) ? 80 : 20;
                    pathD += `L ${currentX} ${y} `;
                }
                pathD += `L ${currentX} 90`;
                
                svgHtml += `<path id="ladder-active" class="ladder-active-path" d="${pathD}" />`;
                svgBase.innerHTML = svgHtml;
                
                const activePath = document.getElementById('ladder-active');
                const pathLength = activePath.getTotalLength();
                activePath.style.strokeDasharray = pathLength;
                activePath.style.strokeDashoffset = pathLength;
                
                activePath.getBoundingClientRect(); // reflow
                activePath.style.transition = 'stroke-dashoffset 3s linear';
                activePath.style.strokeDashoffset = '0';

            } else {
                // 파워볼 로직 결정
                if (!selectedOption) {
                    let allOpts = ['odd', 'even', 'under', 'over'];
                    winResult = allOpts[Math.floor(Math.random() * allOpts.length)];
                    window.playCount--; 
                } else if (window.playCount <= 4) {
                    winResult = selectedOption;
                    won = true;
                } else {
                    let allOpts = ['odd', 'even', 'under', 'over'];
                    let others = allOpts.filter(o => o !== selectedOption);
                    winResult = others[Math.floor(Math.random() * others.length)];
                }

                if (winResult === 'odd' || winResult === 'under') {
                    resultNum = Math.floor(Math.random() * 5) * 2 + 1; // 홀수
                } else {
                    resultNum = Math.floor(Math.random() * 5) * 2 + 2; // 짝수
                }

                const pbRes = document.getElementById('pb-result');
                pbRes.innerText = resultNum;
                pbRes.style.backgroundColor = (resultNum % 2 !== 0) ? '#1a73e8' : '#ea4335';
                pbRes.classList.add('show');
            }
            
            
            setTimeout(() => {
                if(!selectedOption || betBtn.innerText === '베팅 마감됨' && currentBet === 0) {
                    setTimeout(() => openMiniGame(title, gameType), 2000);
                    return;
                }
                
                if (won) {
                    winAmount = currentBet * 1.95;
                    window.updateBalance(winAmount);
                    document.getElementById('mg-current-balance').innerText = window.userBalance.toLocaleString();
                }
                
                // 결과 번호 표시 (사다리의 경우)
                if (isLadder) {
                    const lRes = document.getElementById('ladder-result-text');
                    lRes.innerText = (resultNum % 2 !== 0) ? '홀' : '짝';
                    lRes.style.color = (resultNum % 2 !== 0) ? '#1a73e8' : '#ea4335';
                    lRes.classList.add('show');
                }
                
                overlayContent.querySelectorAll('.option-btn').forEach(b => {
                    if (b.getAttribute('data-type') === winResult) {
                        b.classList.add('active');
                        b.style.boxShadow = '0 0 20px #ffd700';
                        b.style.backgroundColor = 'rgba(255,215,0,0.5)';
                    } else {
                        b.style.opacity = '0.3';
                    }
                });
                
                const sb = document.getElementById('mg-scoreboard');
                const dot = document.createElement('span');
                dot.className = `sb-dot ${(resultNum % 2 !== 0) ? 'blue' : 'red'}`; 
                sb.insertBefore(dot, sb.firstChild);
                
                // 팝업 표시
                const popup = document.createElement('div');
                popup.className = 'result-popup';
                
                if (winAmount > 0) {
                    showWinEffect();
                    popup.innerHTML = `
                        <h2 style="font-size: 2rem;">🎉 적중 성공! 🎉</h2>
                        <div class="amount" style="font-size: 2.5rem; font-weight: bold; color: #ffd700;">+${winAmount.toLocaleString()} 원</div>
                        <p style="color:#fff;">패턴을 완벽히 읽으셨네요!</p>
                    `;
                } else {
                    showLoseEffect();
                    popup.innerHTML = `
                        <h2 style="color: #ff3366;">❌ 미적중 실패 ❌</h2>
                        <div style="color:red; font-size: 1.5rem; font-weight: bold; margin-top: 10px;">-${currentBet.toLocaleString()} 원</div>
                        <p style="color:#aaa;">아쉽습니다. 다음 회차를 노리세요.</p>
                    `;
                }
                overlayContent.appendChild(popup);
                
                setTimeout(() => {
                    openMiniGame(title, gameType); // 재시작
                }, 3000);
                
            }, 3000); // 애니메이션 대기 시간
        }
    }

    // ==========================================
    // 충전 / 환전 화면
    // ==========================================
    function openDeposit(title) {
        overlayTitle.innerText = title;
        closeOverlayBtn.innerText = '닫기';
        closeOverlayBtn.style.color = 'var(--accent-primary)';
        closeOverlayBtn.style.fontWeight = 'normal';
        gameOverlay.classList.remove('hidden');
        
        overlayContent.innerHTML = `
            <div class="deposit-form">
                <h4 style="font-size: 1.2rem;">입금 계좌 안내 (대포통장 주의)</h4>
                <div class="deposit-box">
                    <p style="color: #ff3366; font-weight: bold;">입금하실 전용 가상계좌입니다.</p>
                    <p class="acc-num" style="font-size: 1.5rem; margin: 15px 0;">국민은행 9483-02-192837</p>
                    <p>예금주: (주)유령법인솔루션</p>
                </div>
                
                <div class="input-group" style="margin-top: 10px;">
                    <label style="color:#aaa; font-size:1rem; display:block; margin-bottom:5px;">입금할 금액</label>
                    <input type="number" id="deposit-amount" placeholder="최소 10,000원 이상" style="font-size: 1.2rem; padding: 15px;">
                </div>
                
                <button id="btn-submit-deposit" class="btn-full-pink" style="margin-top: 10px; padding: 15px; font-size: 1.2rem;">입금 신청 완료하기</button>
            </div>
        `;
        
        document.getElementById('btn-submit-deposit').addEventListener('click', () => {
            const amt = parseInt(document.getElementById('deposit-amount').value);
            if (isNaN(amt) || amt < 10000) {
                playSound('lose');
                alert('10,000원 이상 입력해주세요.');
                return;
            }
            playSound('win');
            alert(`[경고]\n이 계좌는 보이스피싱 및 불법 도박 자금 세탁에 사용되는 대포통장입니다.\n데모를 위해 가상으로 ${amt.toLocaleString()}원이 충전됩니다.`);
            
            window.updateBalance(amt);
            closeOverlayBtn.click();
        });
    }
});
