export interface ExtractedAiMenuParams {
  tableCount?: number;
  guestsPerTable?: number;
  totalGuests?: number;
  budgetAmount?: number;
  budgetType?: 'PER_TABLE' | 'TOTAL_ORDER';
  eventType?: string;
  preferences?: string;
  excludedIngredients?: string;
  detectedFields: {
    tableCount: boolean;
    guestsPerTable: boolean;
    budget: boolean;
    eventType: boolean;
    preferences: boolean;
    excludedIngredients: boolean;
  };
}

/**
 * Parses Vietnamese shorthand numbers like:
 * - "3 triệu", "3tr", "3.000.000", "3,000,000", "3000000" -> 3000000
 * - "1tr5", "1.5 triệu", "1,5tr" -> 1500000
 * - "1tr2", "1.2 triệu" -> 1200000
 * - "800k", "800 ngàn", "800 nghìn", "50k" -> 800000, 50000
 */
export function parseVietnameseNumber(rawNum: string, rawUnit?: string): number | null {
  if (!rawNum) return null;
  const numStr = rawNum.trim().toLowerCase();

  // Negative values are invalid
  if (numStr.startsWith('-') || numStr.includes(' -')) {
    return null;
  }

  const unitStr = (rawUnit || '').trim().toLowerCase();

  // Pattern: 1tr5, 2tr8, 1tr250
  const trShorthandMatch = numStr.match(/^(\d+)tr(\d+)$/);
  if (trShorthandMatch) {
    const whole = parseInt(trShorthandMatch[1], 10);
    const fractionPart = trShorthandMatch[2];
    const fraction = parseFloat(`0.${fractionPart}`);
    return Math.round((whole + fraction) * 1_000_000);
  }

  // Explicit unit passed or attached
  const combined = `${numStr} ${unitStr}`.trim();

  // Million
  if (combined.includes('triệu') || combined.includes('tr')) {
    const cleanNum = numStr.replace(/[^0-9\.,]/g, '').replace(',', '.');
    const val = parseFloat(cleanNum);
    if (!isNaN(val) && val > 0) {
      return Math.round(val * 1_000_000);
    }
  }

  // Thousand (k, nghìn, ngàn)
  if (combined.includes('k') || combined.includes('nghìn') || combined.includes('ngàn')) {
    const cleanNum = numStr.replace(/[^0-9\.,]/g, '').replace(',', '.');
    const val = parseFloat(cleanNum);
    if (!isNaN(val) && val > 0) {
      return Math.round(val * 1_000);
    }
  }

  // Full currency: e.g. 3.000.000, 3,000,000, 3000000, 50000
  const digitsOnly = numStr.replace(/[^0-9]/g, '');
  if (digitsOnly.length >= 4) {
    const parsed = parseInt(digitsOnly, 10);
    return isNaN(parsed) ? null : parsed;
  }

  return null;
}

/**
 * Intelligent Vietnamese NLP parameter extractor for BanquetHub AI Menu recommendations.
 * Accurately extracts table count, guests per table (or calculates from total guests / tables),
 * per-table vs total budget, event type, preferences, and dietary restrictions.
 */
export function extractAiMenuParameters(text: string): ExtractedAiMenuParams {
  const result: ExtractedAiMenuParams = {
    detectedFields: {
      tableCount: false,
      guestsPerTable: false,
      budget: false,
      eventType: false,
      preferences: false,
      excludedIngredients: false,
    },
  };

  if (!text || !text.trim()) {
    return result;
  }

  const raw = text.trim();
  const lower = raw.toLowerCase();

  // 1. EXTRACT BUDGET
  // Mode A: Explicit keyword ("ngân sách 3.000.000đ/bàn", "ngân sách tổng 25 triệu", "tổng ngân sách khoảng 25 triệu", "chi phí 25 triệu cho tiệc")
  const keywordBudgetRegex =
    /(?:tổng\s*)?(?:ngân\s*sách|chi\s*phí|tài\s*chính|giá(?:\s*tiền)?)\s*(?:tổng(?:\s*cộng)?)?\s*(?:dự\s*kiến\s*)?(?:khoảng|tầm|tầm\s*khoảng|là)?\s*(-?\d+tr\d+|-?[0-9\.,]+)\s*(triệu|tr|nghìn|ngàn|k|đ|vnd)?(?:\s*(?:\/|\s*mỗi\s*|\s*một\s*|\s*1\s*|\s*cho\s*(?:cả\s*)?)(bàn|mâm|tiệc|cả tiệc|người))?/i;

  // Mode B: Unit-based ("25 triệu/tiệc", "2tr5/bàn", "1.2 triệu một bàn", "3.000.000đ/bàn", "50k/bàn")
  const unitBudgetRegex =
    /(-?\d+tr\d+|-?[0-9\.,]+)\s*(triệu|tr|nghìn|ngàn|k|đ|vnd)?(?:\s*(?:\/|\s*mỗi\s*|\s*một\s*|\s*1\s*|\s*cho\s*(?:cả\s*)?)(bàn|mâm|tiệc|cả tiệc))/i;

  let budgetMatch = raw.match(keywordBudgetRegex);
  if (!budgetMatch) {
    budgetMatch = raw.match(unitBudgetRegex);
  }

  if (budgetMatch) {
    const rawNum = budgetMatch[1];
    const rawUnit = budgetMatch[2];

    // Ignore negative numbers explicitly
    if (!rawNum.startsWith('-')) {
      const parsedBudget = parseVietnameseNumber(rawNum, rawUnit);

      if (parsedBudget && parsedBudget >= 30_000) {
        result.budgetAmount = parsedBudget;
        result.detectedFields.budget = true;

        const matchedPortion = budgetMatch[0].toLowerCase();
        if (
          matchedPortion.includes('/tiệc') ||
          matchedPortion.includes('mỗi tiệc') ||
          matchedPortion.includes('cả tiệc') ||
          matchedPortion.includes('cho tiệc') ||
          matchedPortion.includes('cho cả tiệc') ||
          matchedPortion.includes('1 tiệc') ||
          matchedPortion.includes('một tiệc')
        ) {
          result.budgetType = 'TOTAL_ORDER';
        } else if (
          matchedPortion.includes('/bàn') ||
          matchedPortion.includes('mỗi bàn') ||
          matchedPortion.includes('1 bàn') ||
          matchedPortion.includes('một bàn') ||
          matchedPortion.includes('mâm')
        ) {
          result.budgetType = 'PER_TABLE';
        } else {
          const matchIndex = budgetMatch.index || 0;
          const contextStart = Math.max(0, matchIndex - 25);
          const contextEnd = Math.min(raw.length, matchIndex + budgetMatch[0].length + 25);
          const localSnippet = raw.substring(contextStart, contextEnd).toLowerCase();

          if (
            localSnippet.includes('cả tiệc') ||
            localSnippet.includes('toàn bộ tiệc') ||
            localSnippet.includes('trọn gói') ||
            localSnippet.includes('tổng ngân sách') ||
            localSnippet.includes('tổng chi phí') ||
            localSnippet.includes('ngân sách tổng') ||
            localSnippet.includes('tổng') ||
            localSnippet.includes('tổng cộng') ||
            localSnippet.includes('tổng tiệc')
          ) {
            result.budgetType = 'TOTAL_ORDER';
          } else {
            result.budgetType = 'PER_TABLE';
          }
        }
      }
    }
  }

  // 2. EXTRACT TABLE COUNT
  // Matches "10 bàn", "5 mâm", "chia thành 10 bàn", "khoảng 8 bàn tiệc"
  const tableRegex = /(?:khoảng|tầm|quy mô|tổng|chia thành|chia làm)?\s*(\d{1,3})\s*(?:bàn|mâm)\b/i;
  const tableMatch = raw.match(tableRegex);
  if (tableMatch) {
    const count = parseInt(tableMatch[1], 10);
    if (count >= 1 && count <= 500) {
      result.tableCount = count;
      result.detectedFields.tableCount = true;
    }
  }

  // 3. EXTRACT GUESTS PER TABLE & TOTAL GUESTS
  // Priority A: Explicit per-table guest count:
  // - "mỗi bàn 10 người", "mỗi bàn 8 khách", "1 bàn 6 người"
  // - "10 người/bàn", "8 khách mỗi bàn", "10 người một mâm"
  const explicitPerTableRegex1 = /(?:mỗi|1|một)\s*(?:bàn|mâm)\s*(\d{1,2})\s*(?:người|khách)/i;
  const explicitPerTableRegex2 = /(\d{1,2})\s*(?:người|khách)\s*(?:\/|\s*mỗi\s*|\s*một\s*|\s*1\s*)(?:bàn|mâm)/i;
  const explicitPerTableRegex3 = /(?:bàn|mâm)\s*(\d{1,2})\s*(?:người|khách)/i;

  const matchExplicit1 = raw.match(explicitPerTableRegex1);
  const matchExplicit2 = raw.match(explicitPerTableRegex2);
  const matchExplicit3 = raw.match(explicitPerTableRegex3);

  if (matchExplicit1) {
    const guests = parseInt(matchExplicit1[1], 10);
    if (guests >= 1 && guests <= 50) {
      result.guestsPerTable = guests;
      result.detectedFields.guestsPerTable = true;
    }
  } else if (matchExplicit2) {
    const guests = parseInt(matchExplicit2[1], 10);
    if (guests >= 1 && guests <= 50) {
      result.guestsPerTable = guests;
      result.detectedFields.guestsPerTable = true;
    }
  } else if (matchExplicit3) {
    const guests = parseInt(matchExplicit3[1], 10);
    if (guests >= 1 && guests <= 50) {
      result.guestsPerTable = guests;
      result.detectedFields.guestsPerTable = true;
    }
  }

  // Priority B: Total guests stated (e.g., "100 khách", "tiệc 30 người")
  // If guestsPerTable is not explicitly defined yet, compute guestsPerTable = totalGuests / tableCount
  const totalGuestsRegex = /(?:khoảng|tầm|tổng cộng|tổng|cho|tiệc)?\s*(\d{1,4})\s*(?:người|khách)\b/i;
  const matchTotal = raw.match(totalGuestsRegex);
  if (matchTotal) {
    const total = parseInt(matchTotal[1], 10);
    if (total > 0 && total <= 5000) {
      result.totalGuests = total;

      // If we don't have explicit guestsPerTable yet:
      if (!result.guestsPerTable) {
        if (result.tableCount && result.tableCount > 0) {
          // Standard banquet formula: guests per table = Math.round(total / tables)
          const computed = Math.round(total / result.tableCount);
          result.guestsPerTable = Math.max(1, Math.min(50, computed));
          result.detectedFields.guestsPerTable = true;
        } else if (total <= 20) {
          // Small party, could be 1 table of 'total' guests
          result.guestsPerTable = total;
          result.detectedFields.guestsPerTable = true;
        }
      }
    }
  }

  // 4. EXTRACT EVENT TYPE
  if (/cưới|đính hôn|vu quy|tân hôn|thành hôn/i.test(lower)) {
    result.eventType = 'Tiệc cưới / Đính hôn';
    result.detectedFields.eventType = true;
  } else if (/sinh nhật|thượng thọ|mừng thọ|bát tuần/i.test(lower)) {
    result.eventType = 'Tiệc sinh nhật';
    result.detectedFields.eventType = true;
  } else if (/công ty|liên hoan|tất niên|khai xuân|doanh nghiệp|tổng kết|gala|hội nghị/i.test(lower)) {
    result.eventType = 'Liên hoan công ty';
    result.detectedFields.eventType = true;
  } else if (/gia đình|ấm cúng|giỗ|họ hàng/i.test(lower)) {
    result.eventType = 'Tiệc gia đình';
    result.detectedFields.eventType = true;
  } else if (/thôi nôi|đầy tháng/i.test(lower)) {
    result.eventType = 'Thôi nôi / Đầy tháng';
    result.detectedFields.eventType = true;
  } else if (/hội thảo|sự kiện|tọa đàm/i.test(lower)) {
    result.eventType = 'Hội nghị / Sự kiện';
    result.detectedFields.eventType = true;
  }

  // 5. EXTRACT EXCLUDED INGREDIENTS / ALLERGIES (Extract first and strip from text to protect preferences)
  // Matches "Dị ứng tôm, cua và đậu phộng", "không ăn tôm và cua", "không thích tôm, tránh cua", "kiêng thịt bò, thịt chó"
  let sanitizedForPref = raw;
  const excludeMatches: string[] = [];

  const excludeGlobalRegex =
    /(?:không\s*(?:ăn|lấy|thích|dùng)?|tránh|dị\s*ứng(?:\s*với)?|kiêng)\s+([^.!?\n;]+)/gi;
  let exMatch: RegExpExecArray | null;
  while ((exMatch = excludeGlobalRegex.exec(raw)) !== null) {
    let rawPhrase = exMatch[1].trim();
    // Stop if next clause starts
    rawPhrase = rawPhrase.split(/(?:\bthích|\bưu tiên|\bmuốn|\bngân sách|\bchi phí|\btài chính)\b/i)[0];

    // Replace in copy so "thích" inside "không thích" never pollutes preferences
    sanitizedForPref = sanitizedForPref.replace(exMatch[0], ' ');

    // Normalize compound tokens ("tôm, cua và đậu phộng" -> ["tôm", "cua", "đậu phộng"])
    const tokens = rawPhrase
      .split(/[,;\n]+|\s+(?:và|hoặc|với)\s+/i)
      .map((t) => t.trim().replace(/^(?:không\s*(?:ăn|lấy|thích|dùng)?|tránh|dị\s*ứng(?:\s*với)?|kiêng)\s*/i, ''))
      .map((t) => t.trim())
      .filter((t) => t.length >= 2 && !/^(không|ăn|lấy|thích|tránh|dị ứng|kiêng)$/i.test(t));

    excludeMatches.push(...tokens);
  }

  if (excludeMatches.length > 0) {
    const uniqueExclusions = Array.from(new Set(excludeMatches));
    result.excludedIngredients = uniqueExclusions.join(', ');
    result.detectedFields.excludedIngredients = true;
  }

  // 6. EXTRACT PREFERENCES (from text with exclusions removed)
  // Matches "thích thực đơn sang trọng, kết hợp món Việt và món Á", "ưu tiên hải sản"
  const prefRegex = /(?:thích|ưu tiên|muốn có|mong muốn)\s*([^.,;\n]+(?:,[^.,;\n]+)*)/i;
  const matchPref = sanitizedForPref.match(prefRegex);
  if (matchPref) {
    const pref = matchPref[1].trim();
    if (pref.length > 3 && pref.length < 200) {
      result.preferences = pref;
      result.detectedFields.preferences = true;
    }
  }

  return result;
}
