/* 5GUYS - float-widgets.js: Trung tâm hỗ trợ + AI cấu hình (giống digital.html / physical.html) */
(function () {
        let isChatOpen = false;
        let isSupportOpen = false;
        
        let chatPanel, supportPanel, chatBtnIcon, supportBtnIcon, chatBtnNotif, chatInput, chatMessages;

        function toggleChat() {
            if (isSupportOpen) toggleSupport(); 
            isChatOpen = !isChatOpen;
            if (isChatOpen) {
                chatPanel.classList.add('panel-enter');
                chatBtnIcon.classList.replace('fa-microchip', 'fa-times');
                if(chatBtnNotif) chatBtnNotif.style.display = 'none';
                setTimeout(() => document.getElementById('chat-input').focus(), 300);
            } else {
                chatPanel.classList.remove('panel-enter');
                chatBtnIcon.classList.replace('fa-times', 'fa-microchip');
            }
        }

        function toggleSupport() {
            if (isChatOpen) toggleChat(); 
            isSupportOpen = !isSupportOpen;
            if (isSupportOpen) {
                supportPanel.classList.add('panel-enter');
                supportBtnIcon.classList.replace('fa-headset', 'fa-times');
            } else {
                supportPanel.classList.remove('panel-enter');
                supportBtnIcon.classList.replace('fa-times', 'fa-headset');
            }
        }

        function switchSupportTab(tabName) {
            ['faq', 'form'].forEach(name => {
                document.getElementById('tab-' + name).className = 'flex-1 py-2.5 text-sm font-semibold text-gray-400 hover:text-gray-200 rounded-lg transition-all hover:bg-dark-surface/50 border border-transparent';
                document.getElementById('content-' + name).classList.add('hidden');
            });
            document.getElementById('tab-' + tabName).className = 'flex-1 py-2.5 text-sm font-bold text-brand-light bg-dark-surface rounded-lg transition-all shadow-sm border border-brand/20';
            document.getElementById('content-' + tabName).classList.remove('hidden');
        }

        document.addEventListener('DOMContentLoaded', function () {
            chatPanel = document.getElementById('chat-panel');
            supportPanel = document.getElementById('support-panel');
            chatBtnIcon = document.querySelector('#chat-toggle-btn i');
            supportBtnIcon = document.querySelector('#support-toggle-btn i');
            chatBtnNotif = document.querySelector('#chat-toggle-btn span');
            chatInput = document.getElementById('chat-input');
            chatMessages = document.getElementById('chat-messages');
            if (chatInput) chatInput.addEventListener('keypress', function (e) { if (e.key === 'Enter') sendMessage(); });
        });

        function sendMessage() {
            const text = chatInput.value.trim();
            if (!text) return;
            appendMessage('user', text);
            chatInput.value = '';
            
            const typingId = 'typing-' + Date.now();
            appendTypingIndicator(typingId);
            
            const ask = window.G5 && G5.askAi ? G5.askAi(text) : Promise.reject();
            ask.catch(() => getAiResponse(text.toLowerCase())).then(reply => {
                const typingEl = document.getElementById(typingId);
                if (typingEl) typingEl.remove();
                appendMessage('bot', reply);
            });
        }

        function appendMessage(sender, text) {
            const div = document.createElement('div');
            div.className = sender === 'user' ? 'flex gap-3 justify-end' : 'flex gap-3';
            
            if (sender === 'user') {
                const bubble = document.createElement('div');
                bubble.className = 'bg-brand text-white p-3.5 rounded-2xl rounded-tr-sm max-w-[85%] text-[13px] shadow-[0_5px_15px_rgba(157,78,221,0.3)] font-medium';
                bubble.textContent = text;
                div.appendChild(bubble);
            } else {
                div.innerHTML = `
                    <div class="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_15px_rgba(157,78,221,0.5)] border border-brand-light/30">
                        <i class="fa-solid fa-robot text-white text-sm"></i>
                    </div>
                    <div class="bg-dark-surface border border-dark-border text-gray-200 p-4 rounded-2xl rounded-tl-sm max-w-[85%] text-[13px] shadow-md leading-relaxed font-medium">
                        ${text}
                    </div>`;
            }
            chatMessages.appendChild(div);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }
        
        function appendTypingIndicator(id) {
            const div = document.createElement('div');
            div.id = id;
            div.className = 'flex gap-3';
            div.innerHTML = `
                <div class="w-10 h-10 rounded-full bg-gradient-to-br from-brand to-brand-dark flex items-center justify-center flex-shrink-0 mt-1 shadow-[0_0_15px_rgba(157,78,221,0.5)] border border-brand-light/30">
                    <i class="fa-solid fa-robot text-white text-sm"></i>
                </div>
                <div class="bg-dark-surface border border-dark-border text-gray-200 p-4 rounded-2xl rounded-tl-sm shadow-md flex items-center gap-1">
                    <span class="w-2 h-2 bg-brand-light rounded-full animate-bounce"></span>
                    <span class="w-2 h-2 bg-brand-light rounded-full animate-bounce" style="animation-delay: 0.2s"></span>
                    <span class="w-2 h-2 bg-brand-light rounded-full animate-bounce" style="animation-delay: 0.4s"></span>
                </div>`;
            chatMessages.appendChild(div);
            chatMessages.scrollTop = chatMessages.scrollHeight;
        }

        function getAiResponse(input) {
            if (input.includes('i3') || input.includes('4gb') || input.includes('gtx 750')) {
                return "Hệ thống phân tích: Cấu hình Nhẹ 🟢<br><br>Khuyến nghị các siêu phẩm Indie rực rỡ trên 5GUYS: <b>Stardew Valley</b>, <b>Terraria</b> hoặc kiệt tác <b>Hollow Knight</b>. Trải nghiệm 60FPS mượt mà!";
            } else if (input.includes('i5') || input.includes('8gb') || input.includes('1650') || input.includes('1060')) {
                return "Hệ thống phân tích: Cấu hình Tầm Trung 🟡<br><br>Cỗ máy lý tưởng! Chiến tốt <b>GTA V</b> (High Settings), <b>The Witcher 3</b> hoặc đắm chìm vào đấu trường <b>Valorant</b>. Các tựa game này đang có sẵn thẻ Digital!";
            } else if (input.includes('rtx') || input.includes('i7') || input.includes('i9') || input.includes('16gb') || input.includes('32gb')) {
                return "Hệ thống phân tích: Cấu hình High-end / Khủng long 🔴🚀<br><br>Sức mạnh phần cứng tuyệt đối! Đừng lãng phí, hãy trải nghiệm đồ họa Ray-Tracing với <b>Cyberpunk 2077</b>, <b>Black Myth: Wukong</b> hoặc <b>Elden Ring</b> ngay hôm nay.";
            } else {
                return "AI chưa thu thập đủ dữ liệu. Xin hãy cung cấp rõ hơn thông số về <b>CPU, RAM, và Card màn hình (VGA)</b> để tôi đối chiếu với Database của 5GUYS nhé!";
            }
        }


  window.toggleChat = toggleChat; window.toggleSupport = toggleSupport; window.switchSupportTab = switchSupportTab; window.sendMessage = sendMessage;
})();
