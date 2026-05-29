import { env } from "../configs/env";

// 1. القاموس الذكي: حفظنا فيه أرقام أشهر التمارين. 
// كذا بنوفر 90% من استهلاك الـ API والنتيجة بتطلع في أجزاء من الثانية!
const exerciseCache: Record<string, string> = {
  "squat": "0024",
  "push-up": "0258",
  "push up": "0258",
  "lunge": "0054",
  "lunges": "0054",
  "deadlift": "0032",
  "calf raise": "0088",
  "glute bridge": "1409",
  "dumbbell row": "0292",
  "bent over row": "0027",
  "dumbbell press": "1293",
  "overhead press": "0091",
  "bicep curl": "0575",
  "triceps extension": "0018",
  "plank": "0464",
  "high knees": "3636",
  "mountain climber": "0630",
  "burpee": "0501",
  "dumbbell step-up": "0431",
  "jumping jack": "3220",
  "jumping jacks": "3220",
  "crunch": "0274",
  "sit up": "0735"
};

export const fetchExerciseDetails = async (exerciseName: string) => {
  try {
    let rawName = exerciseName.toLowerCase().trim();
    let cleanedName = rawName.replace(/s$/, ''); // نشيل حرف الـ s للجمع

    // 2. السحر هنا: هل التمرين موجود في القاموس حقنا؟
    // إذا إيه، نرجع النتيجة فوراً بدون ما نكلم RapidAPI أبداً!
    if (exerciseCache[rawName]) {
      return {
        exerciseId: exerciseCache[rawName],
        gifUrl: `${env.API_URL}/fitness/exercise-image/${exerciseCache[rawName]}`
      };
    }
    if (exerciseCache[cleanedName]) {
      return {
        exerciseId: exerciseCache[cleanedName],
        gifUrl: `${env.API_URL}/fitness/exercise-image/${exerciseCache[cleanedName]}`
      };
    }

    // 3. إذا التمرين غريب ومو بالقاموس، وقتها بس نكلم الـ API
    const fetchFromApi = async (query: string) => {
      const response = await fetch(
        `https://exercisedb.p.rapidapi.com/exercises/name/${encodeURIComponent(query)}?limit=10`,
        {
          method: "GET",
          headers: {
            "x-rapidapi-key": env.RAPIDAPI_KEY,
            "x-rapidapi-host": "exercisedb.p.rapidapi.com",
          },
        }
      );
      
      if (!response.ok) {
        console.log(`[API ERROR] Query: ${query}, Status: ${response.status}`);
      }
      return await response.json();
    };

    let data = await fetchFromApi(cleanedName);

    // خطة بديلة للبحث
    if (!data || data.length === 0) {
      const fallbackQuery = cleanedName.split(' ').slice(0, 2).join(' ');
      data = await fetchFromApi(fallbackQuery);
    }

    if (data && data.length > 0 && data[0].id) {
      return {
        exerciseId: data[0].id,
        gifUrl: `${env.API_URL}/fitness/exercise-image/${data[0].id}`,
      };
    }
    
    // 4. الصورة الافتراضية إذا التمرين ماله أي وجود نهائياً
    return {
      exerciseId: 'default',
      gifUrl: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png', 
    };

  } catch (error) {
    console.error(`Error fetching details for exercise ${exerciseName}:`, error);
    return {
      exerciseId: 'default',
      gifUrl: 'https://cdn-icons-png.flaticon.com/512/2964/2964514.png', 
    };
  }
};