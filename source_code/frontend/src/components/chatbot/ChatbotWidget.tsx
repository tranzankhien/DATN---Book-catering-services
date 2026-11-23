import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  X,
  RotateCcw,
  ChefHat,
  ChevronRight,
  Loader2,
  ThumbsUp,
  ThumbsDown,
  Copy,
  Check,
  PhoneCall,
  User,
} from 'lucide-react';
import { chatbotService, SuggestedMenu } from '../../services/chatbotService';
import { useToast } from '../../hooks/useToast';

interface MessageItem {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  suggestedMenu?: SuggestedMenu | null;
  suggestedQuestions?: string[];
  feedback?: 'like' | 'dislike' | null;
}

const STORAGE_CHAT_KEY = 'banquethub_chat_history_v2';
const DRAFT_BUILDER_KEY = 'banquethub_builder_draft';

const INITIAL_WELCOME_MESSAGE: MessageItem = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Dạ xin chào Quý khách! Em là **Chuyên viên Tư vấn BanquetHub** 🌟\n\nEm luôn sẵn sàng hỗ trợ Quý khách:\n• Tư vấn & gợi ý set thực đơn tối ưu theo ngân sách (tiệc cưới, thôi nôi, sinh nhật, liên hoan...)\n• Nạp món gợi ý trực tiếp vào **Bàn Phối Món** để tùy chỉnh và đặt tiệc ngay\n• Giải đáp quy chuẩn bàn tiệc (1 bàn = 10 khách), cơ chế giữ kho 15 phút, quy trình thanh toán...\n\nQuý khách đang dự kiến tổ chức tiệc vào dịp nào hoặc cần em hỗ trợ thông tin gì ạ?',
  timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
  suggestedQuestions: [
    '💡 Gợi ý thực đơn cưới ~2 triệu/bàn',
    '🍖 Thực đơn thôi nôi 5 bàn ngon tiết kiệm',
    '📜 Có hoàn tiền khi hủy tiệc không?',
    '⏱️ Khóa giữ kho nguyên liệu 15 phút là gì?',
    '💳 Hướng dẫn thanh toán QR SePay',
    '📞 Hotline & Hợp đồng dịch vụ',
  ],
};

export const ChatbotWidget: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [isOpen, setIsOpen] = useState(false);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [messages, setMessages] = useState<MessageItem[]>(() => {
    try {
      const saved = sessionStorage.getItem(STORAGE_CHAT_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch {
      // ignore
    }
    return [INITIAL_WELCOME_MESSAGE];
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-save history
  useEffect(() => {
    try {
      sessionStorage.setItem(STORAGE_CHAT_KEY, JSON.stringify(messages));
    } catch {
      // ignore
    }
  }, [messages]);

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen, messages]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsg: MessageItem = {
      id: 'usr_' + Date.now(),
      role: 'user',
      content: text,
      timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const historyPayload = messages
        .filter((m) => m.id !== 'welcome')
        .slice(-6)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const res = await chatbotService.sendMessage(text, historyPayload);

      const botMsg: MessageItem = {
        id: 'bot_' + Date.now(),
        role: 'assistant',
        content: res.reply || 'Dạ xin lỗi Quý khách, em chưa hiểu rõ yêu cầu. Quý khách vui lòng diễn giải thêm nhé!',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestedMenu: res.suggestedMenu,
        suggestedQuestions: res.suggestedQuestions && res.suggestedQuestions.length > 0 ? res.suggestedQuestions : undefined,
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err: any) {
      console.error('Chatbot request error:', err);
      const fallbackMsg: MessageItem = {
        id: 'err_' + Date.now(),
        role: 'assistant',
        content:
          'Dạ xin lỗi Quý khách, hệ thống đang bận xử lý dữ liệu thực đơn. Quý khách có thể liên hệ trực tiếp chuyên viên qua hotline **1900 8899** (24/7) hoặc để lại câu hỏi để em giải đáp ạ!',
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
        suggestedQuestions: [
          '📞 Số hotline hỗ trợ trực tiếp 1900 8899',
          '📜 Có hoàn tiền khi hủy tiệc không?',
          '⏱️ Giữ kho nguyên liệu 15 phút là gì?',
        ],
      };
      setMessages((prev) => [...prev, fallbackMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        ...INITIAL_WELCOME_MESSAGE,
        timestamp: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    try {
      sessionStorage.removeItem(STORAGE_CHAT_KEY);
    } catch {
      // ignore
    }
    showToast('Đã làm mới cuộc trò chuyện.', 'info');
  };

  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    showToast('Đã sao chép nội dung tin nhắn.', 'info');
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleFeedback = (id: string, type: 'like' | 'dislike') => {
    setMessages((prev) =>
      prev.map((m) => (m.id === id ? { ...m, feedback: m.feedback === type ? null : type } : m))
    );
    showToast(type === 'like' ? 'Cảm ơn bạn đã phản hồi hài lòng!' : 'Cảm ơn bạn, em sẽ hoàn thiện câu trả lời hơn!', 'info');
  };

  const handleLoadMenuToBuilder = (menu: SuggestedMenu) => {
    try {
      const items = (menu.dishes || []).map((d) => ({
        dishId: (d.id || d.dishId) as number,
        quantityPerTable: d.quantityPerTable || 1,
      }));

      if (items.length === 0) {
        showToast('Không tìm thấy danh sách món cụ thể để nạp.', 'info');
        navigate('/menu-builder');
        return;
      }

      const draftData = {
        items,
        tableCount: 6,
        guestsPerTable: 10,
        guestCount: 60,
      };

      sessionStorage.setItem(DRAFT_BUILDER_KEY, JSON.stringify(draftData));
      showToast(
        `Đã nạp thực đơn "${menu.name}" (${items.length} món) vào Bàn Phối Món!`,
        'success'
      );
      setIsOpen(false);
      navigate('/menu-builder');
    } catch (e) {
      console.error('Error loading menu to builder:', e);
      navigate('/menu-builder');
    }
  };

  // Render markdown bold & lists
  const renderFormattedContent = (content: string) => {
    const lines = content.split('\n');
    return lines.map((line, idx) => {
      const isListItem = line.trim().startsWith('•') || line.trim().startsWith('-');
      const cleanLine = isListItem ? line.replace(/^[•\-]\s*/, '') : line;

      const parts = cleanLine.split(/(\*\*.*?\*\*)/g);
      const parsedSpans = parts.map((part, pIdx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return (
            <strong key={pIdx} className="font-semibold text-stone-900">
              {part.slice(2, -2)}
            </strong>
          );
        }
        return <span key={pIdx}>{part}</span>;
      });

      if (isListItem) {
        return (
          <div key={idx} className="flex items-start gap-1.5 pl-1 my-0.5">
            <span className="text-amber-700 font-bold shrink-0">•</span>
            <div className="flex-1">{parsedSpans}</div>
          </div>
        );
      }

      if (!line.trim()) {
        return <div key={idx} className="h-1.5" />;
      }

      return (
        <p key={idx} className="my-0.5 leading-relaxed">
          {parsedSpans}
        </p>
      );
    });
  };

  return (
    <>
      {/* Floating Action Button (FAB) */}
      <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
        {!isOpen && (
          <button
            type="button"
            onClick={() => setIsOpen(true)}
            className="hidden sm:flex items-center gap-2.5 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-full shadow-lg border border-amber-200/90 hover:border-amber-400 hover:shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-right-4 cursor-pointer group"
          >
            <span className="flex h-2.5 w-2.5 relative">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-600"></span>
            </span>
            <span className="text-xs font-medium text-stone-700 group-hover:text-stone-900">
              Tư vấn yến tiệc? <strong className="text-amber-800 font-semibold">Nhắn tin ngay</strong>
            </span>
          </button>
        )}

        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className={`relative flex items-center justify-center w-14 h-14 rounded-full shadow-xl transition-all duration-300 transform active:scale-95 cursor-pointer ${
            isOpen
              ? 'bg-stone-900 text-white hover:bg-stone-800 rotate-90'
              : 'bg-gradient-to-tr from-amber-800 via-amber-700 to-amber-600 text-white hover:shadow-amber-900/40 hover:scale-105'
          }`}
          title={isOpen ? 'Đóng cửa sổ chat' : 'Nhắn tin tư vấn tiệc BanquetHub'}
          aria-label="BanquetHub Tư vấn trực tuyến"
        >
          {isOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <>
              <ChefHat className="w-6 h-6" />
              <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-amber-500 border-2 border-white"></span>
              </span>
            </>
          )}
        </button>
      </div>

      {/* Modern Luxury Chat Dialog */}
      {isOpen && (
        <div className="fixed bottom-24 right-4 sm:right-6 w-[calc(100vw-2rem)] sm:w-[430px] max-h-[640px] h-[600px] bg-white rounded-3xl shadow-2xl border border-stone-200/90 flex flex-col overflow-hidden z-50 transition-all duration-300 animate-in fade-in slide-in-from-bottom-6">
          {/* Header */}
          <div className="px-5 py-3.5 bg-gradient-to-r from-stone-900 via-stone-800 to-amber-950 text-white flex items-center justify-between border-b border-white/10 shrink-0">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-600 to-amber-400 flex items-center justify-center shadow-md">
                  <ChefHat className="w-5 h-5 text-white" />
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-stone-900"></span>
              </div>
              <div>
                <h3 className="text-sm font-bold tracking-tight text-white">Chuyên viên Tư vấn BanquetHub</h3>
                <p className="text-[11px] text-stone-300 flex items-center gap-1">
                  <span>Trực tuyến 24/7 • Hỗ trợ thực đơn & đặt tiệc</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 text-stone-300">
              <button
                type="button"
                onClick={handleResetChat}
                className="p-1.5 rounded-xl hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
                title="Làm mới hội thoại"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl hover:bg-white/15 hover:text-white transition-colors cursor-pointer"
                title="Thu nhỏ"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4 bg-stone-50/70">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2.5 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {/* Assistant Avatar */}
                {msg.role === 'assistant' && (
                  <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300/80 flex items-center justify-center shrink-0 mt-0.5 text-amber-800 shadow-2xs">
                    <ChefHat className="w-4 h-4" />
                  </div>
                )}

                <div className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} max-w-[85%]`}>
                  {/* Bubble */}
                  <div
                    className={`rounded-2xl px-4 py-3 text-[13px] leading-relaxed shadow-xs ${
                      msg.role === 'user'
                        ? 'bg-amber-800 text-white rounded-tr-xs'
                        : 'bg-white text-stone-800 border border-stone-200/80 rounded-tl-xs'
                    }`}
                  >
                    {renderFormattedContent(msg.content)}

                    {/* Interactive Menu Recommendation Card */}
                    {msg.suggestedMenu && (
                      <div className="mt-3 pt-3 border-t border-amber-100 bg-amber-50/70 -mx-2 px-3 py-2.5 rounded-xl border border-amber-200/90 shadow-2xs">
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-amber-800">
                            <ChefHat className="w-3.5 h-3.5 text-amber-800" />
                            Set thực đơn đề xuất
                          </span>
                          <span className="text-xs font-extrabold text-amber-900">
                            {msg.suggestedMenu.pricePerTable?.toLocaleString('vi-VN')} ₫/bàn
                          </span>
                        </div>

                        <p className="text-xs font-bold text-stone-900 mb-2">
                          {msg.suggestedMenu.name}
                        </p>

                        <div className="space-y-1 mb-3">
                          {msg.suggestedMenu.dishes?.map((d, dIdx) => (
                            <div
                              key={dIdx}
                              className="flex items-center justify-between text-[11px] text-stone-700 bg-white/90 px-2 py-1 rounded-md border border-stone-200/60"
                            >
                              <span className="font-medium truncate mr-2">
                                {dIdx + 1}. {d.name || d.dishName}
                              </span>
                              <span className="text-stone-500 shrink-0 text-[10px]">
                                {d.price?.toLocaleString('vi-VN')} ₫
                              </span>
                            </div>
                          ))}
                        </div>

                        <button
                          type="button"
                          onClick={() => handleLoadMenuToBuilder(msg.suggestedMenu!)}
                          className="w-full inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-amber-700 hover:bg-amber-800 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer active:scale-98"
                        >
                          <ChefHat className="w-3.5 h-3.5" />
                          <span>Nạp vào Bàn Phối Món & Đặt ngay</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Message Footer Actions (Timestamp + Copy + Feedback) */}
                  <div className="flex items-center gap-2 mt-1 px-1 text-[11px] text-stone-400">
                    <span>{msg.timestamp}</span>

                    {msg.role === 'assistant' && (
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          type="button"
                          onClick={() => handleCopyMessage(msg.id, msg.content)}
                          className="p-0.5 rounded hover:text-stone-700 transition-colors"
                          title="Sao chép câu trả lời"
                        >
                          {copiedId === msg.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, 'like')}
                          className={`p-0.5 rounded transition-colors ${
                            msg.feedback === 'like' ? 'text-amber-700 font-bold' : 'hover:text-stone-700'
                          }`}
                          title="Hài lòng"
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleFeedback(msg.id, 'dislike')}
                          className={`p-0.5 rounded transition-colors ${
                            msg.feedback === 'dislike' ? 'text-rose-600 font-bold' : 'hover:text-stone-700'
                          }`}
                          title="Chưa hài lòng"
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Follow-up Question Chips */}
                  {msg.suggestedQuestions && msg.suggestedQuestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {msg.suggestedQuestions.map((q, qIdx) => (
                        <button
                          key={qIdx}
                          type="button"
                          onClick={() => handleSendMessage(q)}
                          disabled={isLoading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-white border border-amber-200/90 text-amber-900 hover:bg-amber-50 hover:border-amber-400 transition-all shadow-2xs cursor-pointer text-left disabled:opacity-50"
                        >
                          <span>{q}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* User Avatar */}
                {msg.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-stone-200 flex items-center justify-center shrink-0 mt-0.5 text-stone-600 shadow-2xs">
                    <User className="w-4 h-4" />
                  </div>
                )}
              </div>
            ))}

            {/* Typing Indicator */}
            {isLoading && (
              <div className="flex items-start gap-2.5">
                <div className="w-7 h-7 rounded-full bg-amber-100 border border-amber-300/80 flex items-center justify-center shrink-0 text-amber-800 shadow-2xs">
                  <ChefHat className="w-4 h-4" />
                </div>
                <div className="bg-white border border-stone-200/80 rounded-2xl rounded-tl-xs px-4 py-3 shadow-2xs flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-700 animate-bounce"></span>
                  </div>
                  <span className="text-xs text-stone-500 font-medium">Đang soạn câu trả lời...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Footer Input */}
          <div className="p-3 bg-white border-t border-stone-200/80 shrink-0">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-center gap-2"
            >
              <input
                ref={inputRef}
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Hỏi về món ăn, ngân sách, hợp đồng..."
                disabled={isLoading}
                className="flex-1 bg-stone-50 border border-stone-200/90 rounded-2xl px-4 py-2.5 text-xs text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-600 transition-all disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim() || isLoading}
                className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-amber-700 hover:bg-amber-800 disabled:bg-stone-200 text-white disabled:text-stone-400 transition-colors cursor-pointer disabled:cursor-not-allowed shadow-xs shrink-0"
                title="Gửi tin nhắn"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </form>
            <div className="mt-2 flex items-center justify-between text-[10px] text-stone-400 px-1">
              <span>BanquetHub • Bộ phận Chăm sóc & Tư vấn ẩm thực</span>
              <span className="flex items-center gap-1 text-amber-800 font-semibold cursor-pointer" onClick={() => window.open('tel:19008899')}>
                <PhoneCall className="w-2.5 h-2.5" /> 1900 8899
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
