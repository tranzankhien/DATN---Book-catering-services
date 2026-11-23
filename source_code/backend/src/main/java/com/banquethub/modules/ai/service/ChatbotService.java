package com.banquethub.modules.ai.service;

import com.banquethub.modules.ai.config.GeminiProperties;
import com.banquethub.modules.ai.dto.AiChatMessageDto;
import com.banquethub.modules.ai.dto.AiChatRequest;
import com.banquethub.modules.ai.dto.AiChatResponse;
import com.banquethub.modules.catalog.entity.Dish;
import com.banquethub.modules.catalog.entity.DishStatus;
import com.banquethub.modules.catalog.repository.DishRepository;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import java.math.BigDecimal;
import java.net.http.HttpClient;
import java.time.Duration;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
public class ChatbotService {

    private static final Logger log = LoggerFactory.getLogger(ChatbotService.class);
    private static final String GEMINI_API_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/models/";

    private final GeminiProperties properties;
    private final DishRepository dishRepository;
    private final ObjectMapper objectMapper;
    private final RestClient restClient;

    public ChatbotService(GeminiProperties properties, DishRepository dishRepository, ObjectMapper objectMapper) {
        this.properties = properties;
        this.dishRepository = dishRepository;
        this.objectMapper = objectMapper;
        this.restClient = RestClient.builder()
                .requestFactory(new org.springframework.http.client.JdkClientHttpRequestFactory(
                        HttpClient.newBuilder()
                                .connectTimeout(Duration.ofSeconds(10))
                                .build()
                ))
                .build();
    }

    public AiChatResponse chat(AiChatRequest request) {
        String userMessage = request.getMessage() != null ? request.getMessage().trim() : "";
        List<Dish> activeDishes = dishRepository.findByStatusOrderByCategoryDisplayOrderAscNameAsc(DishStatus.ACTIVE);

        if (properties.isEnabled() && properties.getApiKey() != null && !properties.getApiKey().isBlank()) {
            try {
                return callGeminiChat(userMessage, request.getHistory(), activeDishes);
            } catch (Exception e) {
                log.warn("Gemini chatbot error ({}: {}). Falling back to rule-based engine.",
                        e.getClass().getSimpleName(), e.getMessage());
            }
        }

        return fallbackChat(userMessage, activeDishes);
    }

    private AiChatResponse callGeminiChat(String userMessage, List<AiChatMessageDto> history, List<Dish> activeDishes) {
        String model = properties.getModel() != null && !properties.getModel().isBlank()
                ? properties.getModel()
                : "gemini-flash-lite-latest";

        String url = GEMINI_API_BASE_URL + model + ":generateContent";

        Map<String, Object> requestBody = buildGeminiPayload(userMessage, history, activeDishes);

        String responseBody = restClient.post()
                .uri(url)
                .header("Content-Type", MediaType.APPLICATION_JSON_VALUE)
                .header("X-goog-api-key", properties.getApiKey())
                .body(requestBody)
                .retrieve()
                .body(String.class);

        return parseGeminiChatResponse(responseBody, activeDishes);
    }

    private Map<String, Object> buildGeminiPayload(String userMessage, List<AiChatMessageDto> history, List<Dish> activeDishes) {
        StringBuilder dishCatalog = new StringBuilder();
        for (Dish d : activeDishes) {
            dishCatalog.append(String.format("- ID:%d | %s | Nhóm:%s | Giá:%,d đ\n",
                    d.getId(), d.getName(),
                    d.getCategory() != null ? d.getCategory().getName() : "Món",
                    d.getPrice().longValue()));
        }

        String systemPrompt = """
            Bạn là Chuyên viên Tư vấn Ẩm thực & Chăm sóc Khách hàng trực tuyến của BanquetHub (Nền tảng đặt tiệc lưu động & catering chuyên nghiệp tại Việt Nam).
            Phong thái và cách xưng hô:
            - Xưng "em" và gọi khách là "Quý khách" hoặc "anh/chị".
            - Tuyệt đối KHÔNG BAO GIỜ xưng mình là AI, trí tuệ nhân tạo, bot, trợ lý ảo hay mô hình ngôn ngữ. Hãy giao tiếp tự nhiên, chu đáo, tinh tế và chuyên nghiệp như một nhân viên tư vấn khách hàng thực tế của BanquetHub.
            Nhiệm vụ của bạn:
            1. Chào đón khách hàng bằng thái độ niềm nở, trang trọng, lịch sự và ấm áp.
            2. Trả lời chính xác mọi thắc mắc về dịch vụ và quy định của BanquetHub:
               - Quy chuẩn tiệc: 1 bàn = 10 khách.
               - Khóa giữ kho nguyên liệu 15 phút: Khi khách tạo đơn tiệc, hệ thống tự động khóa giữ nguyên liệu trong 15 phút để đảm bảo thực đơn sẵn sàng, tránh bị tranh chấp món. Khách cần thanh toán trước khi hết 15 phút.
               - Thanh toán: Hỗ trợ mã Napas QR / SePay tự động, chuyển khoản hoặc tiền mặt.
               - Chính sách hoàn tiền & Hủy tiệc: BanquetHub KHÔNG có chính sách tự động hoàn tiền trên website. Chính sách hoàn tiền và hủy tiệc sẽ được quy định chi tiết trong Hợp đồng dịch vụ giữa BanquetHub và khách hàng trước khi tiệc diễn ra. Quy định hoàn tiền chung sẽ phụ thuộc vào thời gian báo hủy trước tiệc và thỏa thuận cụ thể trong hợp đồng/đơn hàng (do nguyên vật liệu tươi sống đã được nhập kho và sơ chế chuẩn bị riêng cho bàn tiệc của quý khách). Khi khách hỏi về hoàn tiền/hủy tiệc, hãy trả lời nhã nhặn, chu đáo theo tinh thần sau: "Dạ chính sách hoàn tiền và hủy tiệc sẽ được quy định chi tiết trong Hợp đồng dịch vụ giữa BanquetHub và khách hàng trước khi tiệc diễn ra. Quy định hoàn tiền chung sẽ phụ thuộc vào thời gian báo hủy trước tiệc và thỏa thuận cụ thể với từng nhà cung ứng nguyên vật liệu tươi sống. Anh/chị cần chuyên viên BanquetHub hỗ trợ trực tiếp thì em kết nối chuyên viên qua Hotline 1900 8899 ngay nhé. Anh/chị dự kiến tổ chức tiệc vào dịp nào để em hỗ trợ tư vấn set menu phù hợp nhất ạ?"
               - Tự phối thực đơn: Khách có thể vào trang Tự Phối Thực Đơn (/menu-builder) để tự tay chọn từng món theo ý thích.
               - Hotline hỗ trợ: 1900 8899 (phục vụ 24/7). Email: cskh@banquethub.vn.
            3. Tư vấn & Gợi ý thực đơn khi khách yêu cầu:
               - Luôn chọn các món ăn CÓ THẬT trong danh sách thực đơn của BanquetHub dưới đây.
               - Một set menu tiêu chuẩn gồm 5-7 món: 1-2 Khai vị, 2-3 Món chính, 1 Lẩu hoặc Canh, 1 Tráng miệng.
               - Cân bằng dinh dưỡng, phối vị hài hòa, phù hợp ngân sách và phong cách tiệc (cưới hỏi, sinh nhật, liên hoan, chay...).
               - QUAN TRỌNG: Nếu bạn gợi ý 1 set menu cụ thể cho khách, ở CUỐI tin nhắn hãy đính kèm thẻ dữ liệu theo định dạng chính xác sau để hệ thống tạo nút bấm cho khách:
                 [MENU_ACTION: {"name": "Tên set menu gợi ý", "dishIds": [id1, id2, id3, id4, id5]}]
            
            Danh sách món ăn hiện có tại BanquetHub:
            """ + dishCatalog;

        List<Map<String, Object>> contents = new ArrayList<>();

        if (history != null) {
            int start = Math.max(0, history.size() - 6); // Keep last 6 messages
            for (int i = start; i < history.size(); i++) {
                AiChatMessageDto msg = history.get(i);
                String role = "user".equalsIgnoreCase(msg.getRole()) ? "user" : "model";
                contents.add(Map.of(
                        "role", role,
                        "parts", List.of(Map.of("text", GeminiClientService.sanitizeUserInput(msg.getContent())))
                ));
            }
        }

        contents.add(Map.of(
                "role", "user",
                "parts", List.of(Map.of("text", GeminiClientService.sanitizeUserInput(userMessage)))
        ));

        Map<String, Object> body = new HashMap<>();
        body.put("contents", contents);
        body.put("systemInstruction", Map.of(
                "parts", List.of(Map.of("text", systemPrompt))
        ));

        Map<String, Object> generationConfig = new HashMap<>();
        generationConfig.put("temperature", 0.7);
        generationConfig.put("maxOutputTokens", 1024);
        body.put("generationConfig", generationConfig);

        return body;
    }

    private AiChatResponse parseGeminiChatResponse(String responseJson, List<Dish> activeDishes) {
        try {
            JsonNode root = objectMapper.readTree(responseJson);
            JsonNode textNode = root.path("candidates").path(0).path("content").path("parts").path(0).path("text");
            if (textNode.isMissingNode() || textNode.asText().isBlank()) {
                throw new IllegalStateException("Phản hồi rỗng từ Gemini");
            }

            String fullText = textNode.asText().trim();
            return extractMenuActionAndBuildResponse(fullText, activeDishes);
        } catch (Exception e) {
            log.error("Failed to parse Gemini response: {}", e.getMessage());
            return fallbackChat("thực đơn", activeDishes);
        }
    }

    private AiChatResponse extractMenuActionAndBuildResponse(String text, List<Dish> activeDishes) {
        Pattern pattern = Pattern.compile("\\[MENU_ACTION:\\s*(\\{.*?\\})\\]", Pattern.DOTALL);
        Matcher matcher = pattern.matcher(text);

        AiChatResponse.SuggestedMenuDto suggestedMenu = null;
        String cleanReply = text;

        if (matcher.find()) {
            String jsonStr = matcher.group(1);
            try {
                JsonNode actionNode = objectMapper.readTree(jsonStr);
                String menuName = actionNode.path("name").asText("Thực đơn gợi ý BanquetHub");
                List<Long> dishIds = new ArrayList<>();
                if (actionNode.has("dishIds")) {
                    for (JsonNode idNode : actionNode.path("dishIds")) {
                        dishIds.add(idNode.asLong());
                    }
                }

                if (!dishIds.isEmpty()) {
                    Map<Long, Dish> dishMap = activeDishes.stream()
                            .collect(Collectors.toMap(Dish::getId, d -> d, (a, b) -> a));

                    List<AiChatResponse.SuggestedDishDto> suggestedDishes = new ArrayList<>();
                    BigDecimal total = BigDecimal.ZERO;

                    for (Long id : dishIds) {
                        Dish d = dishMap.get(id);
                        if (d != null) {
                            suggestedDishes.add(new AiChatResponse.SuggestedDishDto(
                                    d.getId(),
                                    d.getCode(),
                                    d.getName(),
                                    d.getCategory() != null ? d.getCategory().getName() : "Món",
                                    d.getPrice(),
                                    d.getImageUrl()
                            ));
                            total = total.add(d.getPrice());
                        }
                    }

                    if (!suggestedDishes.isEmpty()) {
                        suggestedMenu = new AiChatResponse.SuggestedMenuDto(menuName, total, suggestedDishes);
                    }
                }
            } catch (Exception e) {
                log.warn("Failed to parse MENU_ACTION json: {}", e.getMessage());
            }

            cleanReply = text.replace(matcher.group(0), "").trim();
        }

        List<String> suggestions = buildFollowUpQuestions(cleanReply);
        return new AiChatResponse(cleanReply, suggestions, suggestedMenu);
    }

    private List<String> buildFollowUpQuestions(String reply) {
        List<String> questions = new ArrayList<>();
        String lower = reply.toLowerCase();
        if (lower.contains("thực đơn") || lower.contains("món")) {
            questions.add("💡 Gợi ý thực đơn tiệc cưới cao cấp");
            questions.add("📋 Quy trình giữ kho nguyên liệu 15 phút là sao?");
            questions.add("🛠️ Hướng dẫn tự phối thực đơn theo ý muốn");
        } else if (lower.contains("kho") || lower.contains("giữ chỗ")) {
            questions.add("💳 Các hình thức thanh toán được hỗ trợ?");
            questions.add("❌ Quy định hủy đơn tiệc như thế nào?");
            questions.add("🍽️ Bàn tiệc tính theo tiêu chuẩn mấy khách?");
        } else {
            questions.add("💡 Gợi ý thực đơn bàn tiệc ~1.8 triệu");
            questions.add("⏱️ Thời gian giữ nguyên liệu 15 phút là gì?");
            questions.add("📞 Hotline liên hệ khẩn cấp");
        }
        return questions;
    }

    private AiChatResponse fallbackChat(String userMessage, List<Dish> activeDishes) {
        String msg = userMessage != null ? userMessage.toLowerCase() : "";

        if (msg.contains("15 phút") || msg.contains("giữ chỗ") || msg.contains("kho nguyên liệu")) {
            String reply = """
                **Chính sách khóa giữ nguyên liệu 15 phút tại BanquetHub:**
                - Khi bạn bấm xác nhận đặt tiệc, hệ thống tự động khóa giữ toàn bộ định mức nguyên liệu tươi sống trong kho trung tâm trong vòng **15 phút**.
                - Cơ chế này đảm bảo bữa tiệc của bạn không bao giờ bị trùng lặp hoặc thiếu nguyên liệu khi có nhiều khách cùng đặt tiệc một lúc.
                - Sau khi thanh toán thành công, nguyên liệu được chuyển trạng thái sang sẵn sàng để bộ phận bếp chuẩn bị trước sự kiện 24 giờ.
                """;
            return new AiChatResponse(reply, List.of("💳 Hướng dẫn thanh toán qua SePay", "💡 Gợi ý thực đơn tiệc mẫu", "📞 Số hotline hỗ trợ"), null);
        }

        if (msg.contains("tiêu chuẩn") || msg.contains("mấy người") || msg.contains("1 bàn") || msg.contains("quy mô")) {
            String reply = """
                **Quy chuẩn bàn tiệc tại BanquetHub:**
                - Mỗi bàn tiệc tại BanquetHub được tính theo tiêu chuẩn **10 khách/bàn**.
                - Các định lượng món ăn và đơn giá trên website đều đã được tính toán khẩu phần đủ đầy, cân đối và chuẩn vị cho 10 người dùng.
                - Nếu tiệc có số lượng khách lẻ, quý khách có thể liên hệ hotline để được phục vụ cấu hình số bàn phù hợp nhất!
                """;
            return new AiChatResponse(reply, List.of("💡 Gợi ý thực đơn 5 bàn tiệc", "🛠️ Tôi muốn tự phối thực đơn", "📞 Hotline tư vấn"), null);
        }

        if (msg.contains("thanh toán") || msg.contains("sepay") || msg.contains("napas") || msg.contains("chuyển khoản") || msg.contains("tiền")) {
            String reply = """
                **Hình thức thanh toán tại BanquetHub:**
                - Hệ thống tích hợp cổng thanh toán trực tuyến **SePay**, hỗ trợ quét mã **Napas 247 VietQR** qua ứng dụng ngân hàng cực kỳ tiện lợi và an toàn.
                - Hệ thống tự động xác nhận và đối soát giao dịch chỉ sau 1 vài giây.
                - Ngoài ra, quý khách có thể liên hệ quản trị viên để thanh toán trực tiếp hoặc xuất hóa đơn VAT điện tử cho doanh nghiệp.
                """;
            return new AiChatResponse(reply, List.of("⏱️ Giữ chỗ kho 15 phút là gì?", "❌ Chính sách hủy đơn tiệc", "💡 Gợi ý thực đơn tiệc"), null);
        }

        if (msg.contains("hủy") || msg.contains("hoàn tiền") || msg.contains("đổi ngày")) {
            String reply = """
                Dạ chính sách hoàn tiền và hủy tiệc sẽ được quy định chi tiết trong **Hợp đồng dịch vụ** giữa BanquetHub và khách hàng trước khi tiệc diễn ra ạ.

                Quy định hoàn tiền chung sẽ phụ thuộc vào thời gian báo hủy trước tiệc và thỏa thuận cụ thể trong hợp đồng (do nguyên vật liệu tươi sống đã được nhập kho và sơ chế chuẩn bị riêng cho bàn tiệc của quý khách).

                Nếu anh/chị cần chuyên viên BanquetHub hỗ trợ trực tiếp thì em kết nối chuyên viên qua **Hotline 1900 8899** ngay nhé! Anh/chị dự kiến tổ chức tiệc vào dịp nào để em hỗ trợ tư vấn loại hình phù hợp nhất ạ?
                """;
            return new AiChatResponse(reply, List.of("📞 Hotline hỗ trợ 1900 8899", "📋 Hợp đồng dịch vụ yến tiệc", "💡 Gợi ý thực đơn cưới ~2tr"), null);
        }

        if (msg.contains("hotline") || msg.contains("liên hệ") || msg.contains("số điện thoại") || msg.contains("tổng đài")) {
            String reply = """
                **Thông tin liên hệ BanquetHub:**
                - **Hotline phục vụ:** 1900 8899 (Hỗ trợ 24/7)
                - **Email CSKH:** cskh@banquethub.vn
                - **Thời gian tiếp nhận yêu cầu:** 08:00 – 21:00 hàng ngày
                - Đội ngũ quản lý tiệc và bếp trưởng luôn sẵn sàng tư vấn trực tiếp tận nơi cho quý khách!
                """;
            return new AiChatResponse(reply, List.of("💡 Gợi ý thực đơn tiệc", "🛠️ Tự phối thực đơn", "⏱️ Khóa giữ kho 15 phút"), null);
        }

        // Default or Menu Suggestion
        List<Dish> starters = activeDishes.stream()
                .filter(d -> d.getCategory() != null && d.getCategory().getName().toLowerCase().contains("khai vị"))
                .toList();
        List<Dish> mains = activeDishes.stream()
                .filter(d -> d.getCategory() != null && d.getCategory().getName().toLowerCase().contains("chính"))
                .toList();
        List<Dish> soups = activeDishes.stream()
                .filter(d -> d.getCategory() != null && (d.getCategory().getName().toLowerCase().contains("lẩu") || d.getCategory().getName().toLowerCase().contains("canh")))
                .toList();
        List<Dish> desserts = activeDishes.stream()
                .filter(d -> d.getCategory() != null && d.getCategory().getName().toLowerCase().contains("tráng miệng"))
                .toList();

        List<AiChatResponse.SuggestedDishDto> selected = new ArrayList<>();
        BigDecimal total = BigDecimal.ZERO;

        if (!starters.isEmpty()) {
            Dish d = starters.get(0);
            selected.add(new AiChatResponse.SuggestedDishDto(d.getId(), d.getCode(), d.getName(), d.getCategory().getName(), d.getPrice(), d.getImageUrl()));
            total = total.add(d.getPrice());
        }
        for (int i = 0; i < Math.min(2, mains.size()); i++) {
            Dish d = mains.get(i);
            selected.add(new AiChatResponse.SuggestedDishDto(d.getId(), d.getCode(), d.getName(), d.getCategory().getName(), d.getPrice(), d.getImageUrl()));
            total = total.add(d.getPrice());
        }
        if (!soups.isEmpty()) {
            Dish d = soups.get(0);
            selected.add(new AiChatResponse.SuggestedDishDto(d.getId(), d.getCode(), d.getName(), d.getCategory().getName(), d.getPrice(), d.getImageUrl()));
            total = total.add(d.getPrice());
        }
        if (!desserts.isEmpty()) {
            Dish d = desserts.get(0);
            selected.add(new AiChatResponse.SuggestedDishDto(d.getId(), d.getCode(), d.getName(), d.getCategory().getName(), d.getPrice(), d.getImageUrl()));
            total = total.add(d.getPrice());
        }

        AiChatResponse.SuggestedMenuDto menuDto = new AiChatResponse.SuggestedMenuDto(
                "Set Tiệc Gợi Ý Tinh Hoa BanquetHub",
                total,
                selected
        );

        String reply = """
            Dạ BanquetHub xin kính chào Quý khách! Em là Chuyên viên tư vấn tiệc của BanquetHub.
            
            Dựa trên nguồn nguyên vật liệu tươi mới hôm nay, em xin gợi ý đến anh/chị **Set Tiệc Tinh Hoa** (chuẩn bàn 10 khách) phối vị hài hòa từ khai vị, các món chính thượng hạng đến lẩu ấm cúng và tráng miệng thanh mát.
            
            Anh/chị có thể bấm nút **"Nạp vào Bàn Phối Món & Đặt ngay"** bên dưới để mở giao diện bàn tiệc và gia giảm món theo sở thích nhé!
            """;

        return new AiChatResponse(
                reply,
                List.of("💡 Gợi ý thực đơn tiệc cưới cao cấp", "⏱️ Khóa giữ kho nguyên liệu 15 phút là gì?", "💳 Quy trình thanh toán thế nào?"),
                menuDto
        );
    }
}
