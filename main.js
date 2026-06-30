document.addEventListener('DOMContentLoaded', () => {
    const popup = document.getElementById('fake-popup');
    let hasTriggered = false;

    // 팝업 트리거 함수
    const triggerPopup = () => {
        if (!hasTriggered) {
            hasTriggered = true;
            popup.classList.remove('hidden');
        }
    };

    // 1. 스크롤 시 트리거
    window.addEventListener('scroll', () => {
        if (window.scrollY > 100) {
            triggerPopup();
        }
    });

    // 2. 페이지 내 아무 곳이나 클릭 시 트리거 (팝업이 안 떴을 때만)
    document.body.addEventListener('click', (e) => {
        if (!hasTriggered) {
            triggerPopup();
            e.preventDefault(); // 기본 동작 막기
        }
    });

    // 3. 마우스가 창 밖으로 나갈 때 (이탈 의도) 트리거
    document.addEventListener('mouseleave', (e) => {
        if (e.clientY <= 0) {
            triggerPopup();
        }
    });

    // 팝업의 어떤 영역을 클릭하더라도 도박 사이트로 리다이렉트
    popup.addEventListener('click', () => {
        window.location.href = 'gambling.html';
    });
});
