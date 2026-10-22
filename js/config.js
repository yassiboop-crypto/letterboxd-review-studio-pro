/**
 * ============================================================================
 * LUMIÈRE ATELIER — API KEYS & CONFIGURATION FILE (js/config.js)
 * ============================================================================
 * حط مفاتيح الـ API ديالك هنا بين علامات التنصيص ("") وسجّل الملف!
 */

const STUDIO_CONFIG = {
  API_KEYS: {
    // 1. Fanart.tv API Key (لجلب الخلفيات السينمائية 4K والـ ClearLogos الشفافة)
    // جيبو بالمجان من: https://fanart.tv/get-an-api-key/
    FANART_TV_API_KEY: "",

    // 2. TMDB API Key v3 (للبحث على الأفلام، البوسترات، والمخرجين)
    // جيبو بالمجان من: https://www.themoviedb.org/settings/api
    TMDB_API_KEY: "",

    // 3. OMDb API Key (اختياري — لمعلومات IMDb الإضافية)
    OMDB_API_KEY: "",

    // 4. Google Gemini API Key (اختياري — لتوليد المراجعات بالذكاء الاصطناعي وسط التطبيق)
    GEMINI_API_KEY: ""
  },

  DEFAULT_BACKDROP: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?q=80&w=1920&auto=format&fit=crop"
};
