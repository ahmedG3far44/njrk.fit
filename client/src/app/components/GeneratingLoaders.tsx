import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const MEAL_STEPS = [
    { label: 'Analyzing your goals' },
    { label: 'Selecting ingredients' },
    { label: 'Balancing macros' },
    { label: 'Building your schedule' },
];
const MEAL_HEADLINES = [
    'Crafting your meal plan',
    'Picking ingredients',
    'Balancing macros',
    'Building your schedule',
];
const MEAL_STEP_TIMINGS = [0, 2500, 5000, 8000];

const STREAM_MEALS = [
    { name: "Avocado & Egg Toast", icon: "🥑", calories: 380, protein: "18g", carbs: "28g", fats: "22g" },
    { name: "Glazed Salmon & Quinoa", icon: "🍣", calories: 540, protein: "42g", carbs: "45g", fats: "18g" },
    { name: "Berry Protein Oats", icon: "🥣", calories: 410, protein: "30g", carbs: "52g", fats: "8g" },
    { name: "Grilled Chicken & Rice", icon: "🍗", calories: 610, protein: "48g", carbs: "65g", fats: "12g" },
    { name: "Mediterranean Hummus Wrap", icon: "🌯", calories: 450, protein: "15g", carbs: "55g", fats: "14g" },
    { name: "Greek Yogurt Parfait", icon: "🍓", calories: 290, protein: "24g", carbs: "30g", fats: "6g" },
];

const NUTRITION_TIPS = [
    "Protein has a higher thermic effect than other macros, so your body burns more calories digesting it.",
    "Staying hydrated can significantly improve energy levels and fat burning throughout the day.",
    "Fiber slows digestion, keeping you fuller for longer and supporting gut health.",
    "A colorful plate ensures a wide spectrum of essential vitamins and minerals.",
    "Healthy fats from avocados, nuts, and olive oil are essential for hormone production.",
    "Spices like turmeric and ginger have natural anti-inflammatory properties."
];

const FITNESS_STEPS = [
    { label: 'Evaluating your fitness level' },
    { label: 'Mapping workout schedule' },
    { label: 'Selecting exercises' },
    { label: 'Optimizing for your goals' },
];
const FITNESS_HEADLINES = [
    'Building your fitness plan',
    'Mapping your schedule',
    'Selecting exercises',
    'Optimizing for results',
];
const FITNESS_STEP_TIMINGS = [0, 2500, 5000, 8000];

const STREAM_EXERCISES = [
    { name: "Dumbbell Bench Press", icon: "🏋️", target: "Chest", reps: "4 x 10", difficulty: "Medium" },
    { name: "Barbell Back Squat", icon: "🦵", target: "Quads", reps: "4 x 8", difficulty: "Hard" },
    { name: "Incline Treadmill Intervals", icon: "🏃", target: "Cardio", reps: "15 mins", difficulty: "Medium" },
    { name: "Hanging Leg Raises", icon: "🤸", target: "Abs", reps: "3 x 15", difficulty: "Easy" },
    { name: "Romanian Deadlift", icon: "💪", target: "Hamstrings", reps: "3 x 12", difficulty: "Medium" },
    { name: "Kettlebell Swings", icon: "🔥", target: "Full Body", reps: "3 x 45s", difficulty: "Hard" },
];

const FITNESS_TIPS = [
    "Rest and nutrition are where muscle rebuilding and growth actually happen, not during the workout itself.",
    "Progressive overload — gradually increasing weight or reps — is the key to continuous strength gains.",
    "Active recovery like light walking or yoga boosts circulation and speeds up muscle healing.",
    "Core strength is the foundation of all movement. A strong core improves posture and lifts.",
    "Consistency beats intensity. A moderate 30-minute daily workout outperforms a 2-hour session once a week.",
    "Sleeping 7-9 hours per night is the most powerful recovery tool available."
];

function LoadingDots() {
    return (
        <div className="flex justify-center gap-1">
            {[0, 1, 2].map((i) => (
                <motion.span
                    key={i}
                    animate={{ y: [0, -4, 0], opacity: [0.35, 1, 0.35] }}
                    transition={{ repeat: Infinity, duration: 1.1, delay: i * 0.12, ease: "easeInOut" }}
                    className="w-1.5 h-1.5 rounded-full bg-green-700 inline-block"
                />
            ))}
        </div>
    );
}

function StepChecklist({ steps, activeStep }: { steps: { label: string }[]; activeStep: number }) {
    return (
        <div className="flex flex-col gap-2.5 w-full border-t border-slate-200 pt-5">
            {steps.map((step, i) => (
                <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.08, ease: "easeOut" }}
                    className="flex items-center gap-3"
                >
                    <motion.div
                        animate={{
                            backgroundColor:
                                i < activeStep ? '#15803d'
                                    : i === activeStep ? '#22c55e'
                                        : 'rgba(21, 128, 61, 0.1)',
                            scale: i === activeStep ? [1, 1.12, 1] : 1,
                        }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-[10px] font-bold"
                        style={{ color: i <= activeStep ? '#ffffff' : '#15803d' }}
                    >
                        {i < activeStep ? '\u2713' : i + 1}
                    </motion.div>
                    <span
                        className="text-sm transition-all duration-300"
                        style={{
                            color: i === activeStep ? '#0f172a' : 'rgba(15, 23, 42, 0.4)',
                            fontWeight: i === activeStep ? 600 : 400,
                        }}
                    >
                        {step.label}
                    </span>
                </motion.div>
            ))}
        </div>
    );
}

export function MealPlanLoader() {
    const [activeStep, setActiveStep] = useState(0);
    const [headline, setHeadline] = useState(MEAL_HEADLINES[0]);
    const [currentMealIndex, setCurrentMealIndex] = useState(0);
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    useEffect(() => {
        const timers = MEAL_STEP_TIMINGS.map((delay, i) =>
            setTimeout(() => {
                setActiveStep(i);
                setHeadline(MEAL_HEADLINES[i]);
            }, delay)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        const mealInterval = setInterval(() => {
            setCurrentMealIndex((prev) => (prev + 1) % STREAM_MEALS.length);
        }, 3000);
        const tipInterval = setInterval(() => {
            setCurrentTipIndex((prev) => (prev + 1) % NUTRITION_TIPS.length);
        }, 4500);
        return () => {
            clearInterval(mealInterval);
            clearInterval(tipInterval);
        };
    }, []);

    const activeMeal = STREAM_MEALS[currentMealIndex];

    return (
        <div className="relative flex flex-col items-center gap-6 rounded-2xl px-6 py-8 mt-10 bg-white border border-slate-200 w-full">
            <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-2xl">
                    🥗
                </div>
                <div className="text-center">
                    <AnimatePresence mode="wait">
                        <motion.h3
                            key={headline}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="font-bold text-lg text-slate-900"
                        >
                            {headline}
                        </motion.h3>
                    </AnimatePresence>
                    <LoadingDots />
                </div>
            </div>

            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[130px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentMealIndex}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl flex-shrink-0">
                            {activeMeal.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                                Recipe
                            </span>
                            <h4 className="font-semibold text-slate-900 text-sm truncate mt-0.5">{activeMeal.name}</h4>
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                                <span>{activeMeal.calories} kcal</span>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Macro row */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`m-${currentMealIndex}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25, delay: 0.12, ease: "easeOut" }}
                        className="flex gap-2 text-xs font-semibold mt-3"
                    >
                        <span className="bg-red-50 text-red-700 px-2.5 py-1 rounded-lg flex-1 text-center">
                            Protein {activeMeal.protein}
                        </span>
                        <span className="bg-amber-50 text-amber-700 px-2.5 py-1 rounded-lg flex-1 text-center">
                            Carbs {activeMeal.carbs}
                        </span>
                        <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-lg flex-1 text-center">
                            Fats {activeMeal.fats}
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Tip */}
            <div className="w-full bg-green-50 rounded-xl p-3 border border-green-100 min-h-[56px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={currentTipIndex}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="text-xs text-slate-600 leading-relaxed text-center"
                    >
                        {NUTRITION_TIPS[currentTipIndex]}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full overflow-hidden" style={{ height: 4 }}>
                <motion.div
                    className="h-full rounded-full bg-green-700"
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 12, ease: [0.4, 0, 0.2, 1] }}
                />
            </div>

            <StepChecklist steps={MEAL_STEPS} activeStep={activeStep} />
        </div>
    );
}

export function FitnessPlanLoader() {
    const [activeStep, setActiveStep] = useState(0);
    const [headline, setHeadline] = useState(FITNESS_HEADLINES[0]);
    const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
    const [currentTipIndex, setCurrentTipIndex] = useState(0);

    useEffect(() => {
        const timers = FITNESS_STEP_TIMINGS.map((delay, i) =>
            setTimeout(() => {
                setActiveStep(i);
                setHeadline(FITNESS_HEADLINES[i]);
            }, delay)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    useEffect(() => {
        const exerciseInterval = setInterval(() => {
            setCurrentExerciseIndex((prev) => (prev + 1) % STREAM_EXERCISES.length);
        }, 3000);
        const tipInterval = setInterval(() => {
            setCurrentTipIndex((prev) => (prev + 1) % FITNESS_TIPS.length);
        }, 4500);
        return () => {
            clearInterval(exerciseInterval);
            clearInterval(tipInterval);
        };
    }, []);

    const activeExercise = STREAM_EXERCISES[currentExerciseIndex];

    return (
        <div className="relative flex flex-col items-center gap-6 rounded-2xl px-6 py-8 mt-10 bg-white border border-slate-200 w-full">
            <div className="flex flex-col items-center gap-3">
                <div className="w-16 h-16 rounded-full bg-green-50 border border-green-200 flex items-center justify-center text-2xl">
                    🏋️
                </div>
                <div className="text-center">
                    <AnimatePresence mode="wait">
                        <motion.h3
                            key={headline}
                            initial={{ opacity: 0, y: 6 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -6 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            className="font-bold text-lg text-slate-900"
                        >
                            {headline}
                        </motion.h3>
                    </AnimatePresence>
                    <LoadingDots />
                </div>
            </div>

            {/* Exercise stream card */}
            <div className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 min-h-[130px] flex flex-col justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={currentExerciseIndex}
                        initial={{ opacity: 0, x: 40 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -40 }}
                        transition={{ duration: 0.35, ease: "easeOut" }}
                        className="flex items-center gap-4"
                    >
                        <div className="w-12 h-12 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-2xl flex-shrink-0">
                            {activeExercise.icon}
                        </div>
                        <div className="flex-1 min-w-0">
                            <span className="text-xs font-semibold text-green-700 uppercase tracking-wider">
                                Exercise
                            </span>
                            <h4 className="font-semibold text-slate-900 text-sm truncate mt-0.5">{activeExercise.name}</h4>
                            <div className="flex items-center gap-1 mt-0.5 text-xs text-slate-500">
                                <span>Target: {activeExercise.target}</span>
                            </div>
                        </div>
                    </motion.div>
                </AnimatePresence>

                {/* Exercise detail badges */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`e-${currentExerciseIndex}`}
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.25, delay: 0.12, ease: "easeOut" }}
                        className="flex gap-2 text-xs font-semibold mt-3"
                    >
                        <span className="bg-slate-100 text-slate-700 px-2.5 py-1 rounded-lg flex-1 text-center">
                            Sets {activeExercise.reps}
                        </span>
                        <span className="bg-green-50 text-green-700 px-2.5 py-1 rounded-lg flex-1 text-center capitalize">
                            {activeExercise.difficulty}
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Tip */}
            <div className="w-full bg-green-50 rounded-xl p-3 border border-green-100 min-h-[56px] flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={currentTipIndex}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        className="text-xs text-slate-600 leading-relaxed text-center"
                    >
                        {FITNESS_TIPS[currentTipIndex]}
                    </motion.p>
                </AnimatePresence>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-slate-100 rounded-full overflow-hidden" style={{ height: 4 }}>
                <motion.div
                    className="h-full rounded-full bg-green-700"
                    initial={{ width: '5%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 12, ease: [0.4, 0, 0.2, 1] }}
                />
            </div>

            <StepChecklist steps={FITNESS_STEPS} activeStep={activeStep} />
        </div>
    );
}
