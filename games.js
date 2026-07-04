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
            else if (title.includes('환전')) openWithdrawal(title);
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
    // 공통 확률 조작 알고리즘 (백만원 만들기 달성 유도)
    // ==========================================
    function getRiggedOutcome(betAmount, rate) {
        // 이미 100만 원 달성 시 무조건 패배시켜 환전 유도
        if (window.userBalance >= 1000000) {
            return false;
        }

        // 파산(올인) 방지: 현재 잔액이 0원(전액 베팅)인 경우 무조건 승리시켜 생존시킴
        if (window.userBalance === 0 && betAmount > 0) {
            return true;
        }

        const winAmount = betAmount * rate;
        // 5판도 안됐는데 100만 원 초과 시 너무 빠르므로 패배 유도 (단, 올인은 위에서 걸러짐)
        if (window.userBalance + winAmount >= 1000000 && window.playCount < 5) {
            return false;
        }

        // 기본적으로 75%의 높은 승률을 주어 서서히 돈을 불려나가게 함
        return Math.random() < 0.75;
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
            
            let result;
            if (betType) {
                // 스마트 확률 조작 알고리즘 연동 (배팅금액 10000원 고정)
                let rate = parseFloat(document.querySelector(`.bet-area.${betType}`).getAttribute('data-rate'));
                let isWin = getRiggedOutcome(10000, rate);
                
                if (isWin) {
                    result = betType;
                } else {
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
                if (window.userBalance >= 1000000) {
                    alert("💰 목표 금액 1,000,000원을 달성했습니다!\n이제 메인 화면의 [환전] 메뉴로 이동하여 수익금을 출금해 보세요.");
                }
                
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
                    <div class="amount-input-box" style="display: flex; justify-content: space-between; align-items: center;">
                        <div style="text-align: left;">
                            <span style="font-size: 0.8rem; color: #aaa;">베팅 금액</span><br>
                            <b id="mg-bet-amount" style="font-size: 1.2rem;">0</b>
                        </div>
                        <div style="text-align: right;">
                            <span style="font-size: 0.8rem; color: #ffd700;">예상 당첨금 (배당: <span id="mg-rate-display">1.95</span>)</span><br>
                            <b id="mg-expected-win" style="font-size: 1.2rem; color: #ffd700;">0</b>
                        </div>
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
        
        let selectedOptions = [];
        let currentBet = 0;
        let isBettingClosed = false;
        
        const betAmountText = document.getElementById('mg-bet-amount');
        const expectedWinText = document.getElementById('mg-expected-win');
        const rateDisplayText = document.getElementById('mg-rate-display');
        const betBtn = document.getElementById('mg-bet-btn');
        const timerText = document.getElementById('mg-timer');
        const chatBox = document.getElementById('fake-chat-box');
        
        function updateExpectedWin() {
            let currentRate = selectedOptions.length === 2 ? 3.80 : 1.95;
            rateDisplayText.innerText = currentRate.toFixed(2);
            expectedWinText.innerText = Math.floor(currentBet * currentRate).toLocaleString();
        }

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
                updateExpectedWin();
            });
        });
        
        // 옵션 그룹 정의
        const getGroup = (type) => {
            if (['left', 'right'].includes(type)) return 'group1';
            if (['3line', '4line'].includes(type)) return 'group2';
            if (['odd', 'even'].includes(type)) return 'group1';
            if (['under', 'over'].includes(type)) return 'group2';
            return 'group1';
        };

        // 옵션 선택 로직 (묶음 배팅 적용)
        overlayContent.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                if(isBettingClosed) return;
                playSound('chip');
                
                const type = btn.getAttribute('data-type');
                const group = getGroup(type);
                
                const index = selectedOptions.indexOf(type);
                if (index > -1) {
                    selectedOptions.splice(index, 1);
                    btn.classList.remove('active');
                } else {
                    const existingInGroup = selectedOptions.find(opt => getGroup(opt) === group);
                    if (existingInGroup) {
                        selectedOptions = selectedOptions.filter(opt => opt !== existingInGroup);
                        overlayContent.querySelector(`.option-btn[data-type="${existingInGroup}"]`).classList.remove('active');
                    }
                    
                    if (selectedOptions.length < 2) {
                        selectedOptions.push(type);
                        btn.classList.add('active');
                    }
                }
                
                updateExpectedWin();
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
            if (selectedOptions.length === 0) {
                playSound('lose');
                alert('베팅할 옵션을 1개 이상 선택해주세요.');
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
            let finalStart, finalLines, isOdd, resultNum, winAmount = 0;
            let won = false;

            if (isLadder) {
                // 사다리 로직 결정
                if (selectedOptions.length === 0) {
                    finalStart = Math.random() > 0.5 ? 'left' : 'right';
                    finalLines = Math.random() > 0.5 ? 3 : 4;
                    window.playCount--; 
                } else {
                    let rate = selectedOptions.length === 2 ? 3.80 : 1.95;
                    won = getRiggedOutcome(currentBet, rate);
                    
                    if (won) {
                        // 승리: 선택한 조건 모두 일치
                        finalStart = selectedOptions.includes('left') ? 'left' : (selectedOptions.includes('right') ? 'right' : (Math.random() > 0.5 ? 'left' : 'right'));
                        finalLines = selectedOptions.includes('3line') ? 3 : (selectedOptions.includes('4line') ? 4 : (Math.random() > 0.5 ? 3 : 4));
                    } else {
                        // 패배: 최소 1개 조건 빗나가게
                        if (selectedOptions.length === 2) {
                            let failFirst = Math.random() > 0.5;
                            let failSecond = !failFirst || Math.random() > 0.5;
                            
                            let targetStart = selectedOptions.includes('left') ? 'left' : (selectedOptions.includes('right') ? 'right' : null);
                            let targetLines = selectedOptions.includes('3line') ? 3 : (selectedOptions.includes('4line') ? 4 : null);
                            
                            if (targetStart && failFirst) targetStart = targetStart === 'left' ? 'right' : 'left';
                            if (targetLines && failSecond) targetLines = targetLines === 3 ? 4 : 3;
                            
                            finalStart = targetStart || (Math.random() > 0.5 ? 'left' : 'right');
                            finalLines = targetLines || (Math.random() > 0.5 ? 3 : 4);
                        } else {
                            if (selectedOptions.includes('left') || selectedOptions.includes('right')) {
                                finalStart = selectedOptions.includes('left') ? 'right' : 'left';
                                finalLines = Math.random() > 0.5 ? 3 : 4;
                            } else {
                                finalLines = selectedOptions.includes('3line') ? 4 : 3;
                                finalStart = Math.random() > 0.5 ? 'left' : 'right';
                            }
                        }
                    }
                }

                // 결과 도출
                isOdd = false;
                if (finalStart === 'left' && finalLines === 4) isOdd = true;
                if (finalStart === 'right' && finalLines === 3) isOdd = true;
                resultNum = isOdd ? (Math.floor(Math.random() * 5) * 2 + 1) : (Math.floor(Math.random() * 5) * 2 + 2);

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
                if (selectedOptions.length === 0) {
                    resultNum = Math.floor(Math.random() * 5) * 2 + 1; // 기본 랜덤 생성
                    window.playCount--; 
                } else {
                    let rate = selectedOptions.length === 2 ? 3.80 : 1.95;
                    won = getRiggedOutcome(currentBet, rate);
                    
                    let targetOddEven = selectedOptions.includes('odd') ? 'odd' : (selectedOptions.includes('even') ? 'even' : (Math.random() > 0.5 ? 'odd' : 'even'));
                    let targetUnderOver = selectedOptions.includes('under') ? 'under' : (selectedOptions.includes('over') ? 'over' : (Math.random() > 0.5 ? 'under' : 'over'));
                    
                    if (!won) {
                        // 패배 시 최소 하나 어긋나게 조작
                        if (selectedOptions.length === 2) {
                            let failFirst = Math.random() > 0.5;
                            let failSecond = !failFirst || Math.random() > 0.5;
                            if (failFirst) targetOddEven = targetOddEven === 'odd' ? 'even' : 'odd';
                            if (failSecond) targetUnderOver = targetUnderOver === 'under' ? 'over' : 'under';
                        } else {
                            if (selectedOptions.includes('odd') || selectedOptions.includes('even')) {
                                targetOddEven = targetOddEven === 'odd' ? 'even' : 'odd';
                            } else {
                                targetUnderOver = targetUnderOver === 'under' ? 'over' : 'under';
                            }
                        }
                    }

                    // 15 ~ 130 난수 생성하여 target 조건 맞추기
                    let min = targetUnderOver === 'under' ? 15 : 73;
                    let max = targetUnderOver === 'under' ? 72 : 130;
                    
                    let generated = min + Math.floor(Math.random() * (max - min));
                    let isGeneratedOdd = generated % 2 !== 0;
                    let needOdd = targetOddEven === 'odd';
                    
                    if (isGeneratedOdd !== needOdd) {
                        generated += 1;
                        if (generated > max) generated -= 2;
                    }
                    resultNum = generated;
                }

                const pbRes = document.getElementById('pb-result');
                pbRes.innerText = resultNum;
                pbRes.style.backgroundColor = (resultNum % 2 !== 0) ? '#1a73e8' : '#ea4335';
                pbRes.classList.add('show');
            }
            
            
            setTimeout(() => {
                if(selectedOptions.length === 0 || betBtn.innerText === '베팅 마감됨' && currentBet === 0) {
                    setTimeout(() => openMiniGame(title, gameType), 2000);
                    return;
                }
                
                if (won) {
                    let rate = selectedOptions.length === 2 ? 3.80 : 1.95;
                    winAmount = currentBet * rate;
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
                
                // 정답 옵션 하이라이트
                let correctOptions = [];
                if (isLadder) {
                    correctOptions.push(finalStart);
                    correctOptions.push(finalLines + 'line');
                } else {
                    correctOptions.push(resultNum % 2 !== 0 ? 'odd' : 'even');
                    correctOptions.push(resultNum < 72.5 ? 'under' : 'over');
                }
                
                overlayContent.querySelectorAll('.option-btn').forEach(b => {
                    if (correctOptions.includes(b.getAttribute('data-type'))) {
                        b.classList.add('active');
                        b.style.boxShadow = '0 0 20px #ffd700';
                        b.style.backgroundColor = 'rgba(255,215,0,0.5)';
                    } else {
                        b.style.opacity = '0.3';
                        b.classList.remove('active');
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
                    if (window.userBalance >= 1000000) {
                        alert("💰 목표 금액 1,000,000원을 달성했습니다!\n이제 메인 화면의 [환전] 메뉴로 이동하여 수익금을 출금해 보세요.");
                    }
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

    // ==========================================
    // 환전 먹튀 시뮬레이션
    // ==========================================
    function openWithdrawal(title) {
        overlayTitle.innerText = title;
        closeOverlayBtn.innerText = '닫기';
        closeOverlayBtn.style.color = 'var(--accent-primary)';
        closeOverlayBtn.style.fontWeight = 'normal';
        gameOverlay.classList.remove('hidden');
        
        overlayContent.innerHTML = `
            <div class="withdrawal-form">
                <div style="text-align: center; margin-bottom: 20px;">
                    <p style="color: var(--text-muted); font-size: 0.9rem;">현재 출금 가능 잔액</p>
                    <h2 style="color: var(--accent-primary); margin: 5px 0; font-size: 2rem;">${window.userBalance.toLocaleString()} 원</h2>
                </div>
                
                <div class="input-group">
                    <label style="color:#aaa; font-size:1rem; display:block; margin-bottom:5px;">환전 신청 금액</label>
                    <div style="display: flex; gap: 10px;">
                        <input type="number" id="withdrawal-amount" placeholder="최소 30,000원 이상" style="flex: 1; font-size: 1.2rem; padding: 15px;">
                        <button id="btn-withdraw-max" style="background: #333; color: var(--accent-primary); border: 1px solid #555; border-radius: 8px; padding: 0 20px; font-weight: bold; cursor: pointer;">MAX</button>
                    </div>
                </div>
                
                <button id="btn-submit-withdrawal" class="btn-full-pink" style="margin-top: 20px; padding: 15px; font-size: 1.2rem;">환전 신청하기</button>

                <div id="withdrawal-loading" class="hidden" style="text-align: center; margin-top: 30px;">
                    <div class="withdrawal-loader"></div>
                    <p style="color: var(--accent-primary); margin-top: 15px; font-weight: bold;">환전 요청을 처리 중입니다...</p>
                    <p style="color: #aaa; font-size: 0.8rem;">잠시만 기다려주세요.</p>
                </div>
            </div>
        `;
        
        const amountInput = document.getElementById('withdrawal-amount');
        const maxBtn = document.getElementById('btn-withdraw-max');
        const submitBtn = document.getElementById('btn-submit-withdrawal');
        const loadingDiv = document.getElementById('withdrawal-loading');
        
        maxBtn.addEventListener('click', () => {
            amountInput.value = window.userBalance;
        });

        submitBtn.addEventListener('click', () => {
            const amt = parseInt(amountInput.value);
            if (isNaN(amt) || amt < 30000) {
                playSound('lose');
                alert('최소 30,000원 이상 환전 가능합니다.');
                return;
            }
            if (amt > window.userBalance) {
                playSound('lose');
                alert('보유 잔액을 초과할 수 없습니다.');
                return;
            }

            // UI 변경 (로딩 중)
            submitBtn.classList.add('hidden');
            amountInput.disabled = true;
            maxBtn.disabled = true;
            loadingDiv.classList.remove('hidden');
            playSound('tick');

            // 2.5초 후 먹튀 시나리오 발동
            setTimeout(() => {
                showScamAlert(amt);
            }, 2500);
        });

        function showScamAlert(amt) {
            playSound('lose');
            
            const scenarios = [
                {
                    type: "rolling",
                    title: "환전 거부: 롤링 미달",
                    msg: "보유머니 환전을 위해선 충전금 대비 300% 롤링을 충족하셔야 합니다.<br><br>현재 롤링이 <b>45% 부족</b>합니다. 배팅을 더 진행해 주세요."
                },
                {
                    type: "violation",
                    title: "시스템 알림: 규정 위반 적발",
                    msg: "회원님의 계정에서 <b>비정상적인 양방/시스템 배팅 내역</b>이 적발되었습니다.<br><br>고객센터(텔레그램)로 소명 자료를 제출하시기 전까지 환전 처리가 무기한 보류됩니다."
                },
                {
                    type: "delay",
                    title: "환전 지연 안내",
                    msg: "현재 가상계좌 발급 은행의 정기 점검 및 <b>금융감독원 모니터링</b>으로 인해 환전 처리가 지연되고 있습니다.<br><br>처리까지 최대 48시간이 소요될 수 있습니다."
                },
                {
                    type: "ban",
                    title: "계정 차단 안내",
                    msg: "관리자에 의해 <b>아이디가 영구 차단</b>되었습니다.<br>접근 권한이 없으며 모든 잔액은 몰수 처리됩니다."
                },
                {
                    type: "new_scam",
                    title: "고객센터: 추가 입금 요구",
                    msg: "안전한 대액 환전을 위해 회원님 명의의 <b>전용 가상계좌 개설</b>이 필요합니다.<br><br>계좌 활성화 보증금 명목으로 환전 신청 금액의 <b>10%(${Math.floor(amt * 0.1).toLocaleString()}원)</b>를 먼저 입금해 주셔야 즉시 환전이 승인됩니다."
                }
            ];

            const randomScam = scenarios[Math.floor(Math.random() * scenarios.length)];
            
            const modalHtml = `
                <div class="scam-alert-modal">
                    <h3 style="color: #ff3366; margin-top: 0;">🚨 ${randomScam.title}</h3>
                    <p style="line-height: 1.6; color: #eee;">${randomScam.msg}</p>
                    <div style="margin-top: 20px;">
                        ${randomScam.type === 'ban' 
                            ? `<button id="btn-scam-confirm" class="btn-full-pink">확인</button>` 
                            : `<button id="btn-scam-confirm" class="btn-full-pink">고객센터 문의하기</button>`
                        }
                    </div>
                </div>
            `;

            loadingDiv.innerHTML = modalHtml;

            document.getElementById('btn-scam-confirm').addEventListener('click', () => {
                if (randomScam.type === 'ban') {
                    // 통짜 먹튀: 초기화면으로 쫓아냄
                    window.userBalance = 0;
                    window.isAuthenticated = false;
                    document.getElementById('user-balance').innerText = '0';
                    document.getElementById('user-balance').classList.add('hidden');
                    document.querySelector('.auth-buttons').style.display = 'flex';
                    gameOverlay.classList.add('hidden');
                    overlayContent.innerHTML = '';
                    alert('세션이 만료되었습니다.');
                } else if (randomScam.type === 'new_scam') {
                    alert('입금 코드가 잘못 기재되었습니다.\n전산 오류 해결을 위해 동일한 금액을 재입금하셔야 합니다.\n(이러한 방식으로 피해액이 계속 늘어납니다.)');
                    closeOverlayBtn.click();
                } else {
                    alert('고객센터와 연결할 수 없습니다. (응답 없음)');
                    closeOverlayBtn.click();
                }
            });
        }
    }
});
