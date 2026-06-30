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
            else if (title.includes('홀짝')) openLotusOddEven(title);
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
        overlayTitle.innerText = title;
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
            if (!gameOverlay.classList.contains('hidden') && overlayTitle.innerText === title) {
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
    // 홀짝 (로투스 - 확률 조작 동일 적용)
    // ==========================================
    function openLotusOddEven(title) {
        overlayTitle.innerText = title;
        gameOverlay.classList.remove('hidden');
        
        overlayContent.innerHTML = `
            <div class="game-container">
                <div class="dealer-area">
                    <h2 style="color:var(--accent-primary);">결과 추첨 대기중...</h2>
                </div>
                
                <div style="text-align: center; color: #fff; font-size: 0.9rem;">잔액: <b style="color:var(--accent-primary);">${window.userBalance.toLocaleString()}</b> 원</div>
                
                <div class="lotus-layout">
                    <div class="lotus-section">
                        <div class="lotus-row">
                            <div class="lotus-btn option-btn" data-type="odd"><span class="badge blue">홀</span>1.95</div>
                            <div class="lotus-btn option-btn" data-type="even"><span class="badge red">짝</span>1.95</div>
                        </div>
                        <div class="lotus-row">
                            <div class="lotus-btn option-btn" data-type="3line"><span class="badge blue">3줄</span>1.95</div>
                            <div class="lotus-btn option-btn" data-type="4line"><span class="badge red">4줄</span>1.95</div>
                        </div>
                    </div>
                    <button class="btn-full-pink" id="lotus-bet-btn" style="padding: 15px; font-size: 1.2rem;">배팅 확정 (10,000원)</button>
                </div>
            </div>
        `;
        
        let selectedOption = null;
        
        overlayContent.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                playSound('chip');
                overlayContent.querySelectorAll('.option-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                selectedOption = btn.getAttribute('data-type');
            });
        });
        
        document.getElementById('lotus-bet-btn').addEventListener('click', () => {
            if (!selectedOption) {
                playSound('lose');
                alert('배팅할 옵션을 선택해주세요.');
                return;
            }
            if (window.userBalance < 10000) {
                playSound('lose');
                alert('잔액이 부족합니다.');
                return;
            }
            
            playSound('chip');
            window.updateBalance(-10000);
            const btn = document.getElementById('lotus-bet-btn');
            btn.disabled = true;
            btn.innerText = '결과 확인 중...';
            btn.style.backgroundColor = '#555';
            
            setTimeout(() => {
                window.playCount++;
                
                // 확률 조작
                let winResult;
                if (window.playCount <= 4) {
                    winResult = selectedOption; // 무조건 승리
                } else {
                    // 무조건 패배
                    const results = ['odd', 'even', '3line', '4line'].filter(r => r !== selectedOption);
                    winResult = results[Math.floor(Math.random() * results.length)];
                }
                
                let winAmount = 0;
                if (selectedOption === winResult) {
                    winAmount = 19500;
                    window.updateBalance(winAmount);
                }
                
                overlayContent.querySelectorAll('.option-btn').forEach(b => {
                    if (b.getAttribute('data-type') === winResult) {
                        b.style.borderColor = 'var(--accent-primary)';
                        b.style.boxShadow = '0 0 20px var(--accent-primary)';
                        b.style.backgroundColor = 'rgba(255,215,0,0.5)';
                    } else {
                        b.style.opacity = '0.3';
                    }
                });
                
                if (winAmount > 0) {
                    showWinEffect();
                } else {
                    showLoseEffect();
                }
                
                setTimeout(() => {
                    openLotusOddEven(title); // 재시작
                }, 2500);
                
            }, 1500);
        });
    }

    // ==========================================
    // 충전 / 환전 화면
    // ==========================================
    function openDeposit(title) {
        overlayTitle.innerText = title;
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
