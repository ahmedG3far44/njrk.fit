import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

const STEPS = [
    { label: 'Analyzing your goals' },
    { label: 'Selecting ingredients' },
    { label: 'Balancing macros' },
    { label: 'Building your weekly schedule' },
];
const HEADLINES = [
    'Crafting your meal plan',
    'Picking the freshest ingredients',
    'Balancing your macros',
    'Almost ready!',
];
const STEP_TIMINGS = [0, 2000, 4000, 7000];

const MEAL_PARTICLES = [
    { left: '20%', delay: '0s', dx: '-15px' },
    { left: '50%', delay: '0.7s', dx: '20px' },
    { left: '75%', delay: '1.4s', dx: '-10px' },
    { left: '35%', delay: '0.4s', dx: '12px' },
];

const FITNESS_STEPS = [
    { label: 'Evaluating your fitness level' },
    { label: 'Mapping workout schedule' },
    { label: 'Selecting exercises & sets' },
    { label: 'Optimizing for your goals' },
];
const FITNESS_HEADLINES = [
    'Building your fitness plan',
    'Mapping your weekly schedule',
    'Dialing in the exercises',
    'Almost there, keep it up!',
];
const FITNESS_STEP_TIMINGS = [0, 2000, 4000, 7000];

const FITNESS_PARTICLES = [
    { left: '15%', delay: '0s', dx: '-18px', color: '#86efac' },
    { left: '55%', delay: '0.8s', dx: '16px', color: '#4ade80' },
    { left: '80%', delay: '1.6s', dx: '-12px', color: '#22c55e' },
    { left: '38%', delay: '0.4s', dx: '14px', color: '#86efac' },
    { left: '65%', delay: '1.1s', dx: '-8px', color: '#bbf7d0' },
];

const EQ_BARS = [
    { h: [4, 22, 4], delay: 0 },
    { h: [8, 18, 8], delay: 0.15 },
    { h: [12, 26, 12], delay: 0.3 },
    { h: [8, 18, 8], delay: 0.45 },
    { h: [4, 22, 4], delay: 0.6 },
];

const DOTS = [0, 1, 2];

export function MealPlanLoader() {
    const [activeStep, setActiveStep] = useState(0);
    const [headline, setHeadline] = useState(HEADLINES[0]);

    useEffect(() => {
        const timers = STEP_TIMINGS.map((delay, i) =>
            setTimeout(() => {
                setActiveStep(i);
                setHeadline(HEADLINES[i]);
            }, delay)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <div className="relative flex flex-col items-center justify-center gap-6 rounded-2xl px-8 py-12 overflow-hidden mt-20 bg-white border border-green-200 text-green-900 shadow-sm">
            {MEAL_PARTICLES.map((p, i) => (
                <span
                    key={i}
                    className="absolute bottom-1/3 w-1.5 h-1.5 rounded-full bg-green-300 opacity-50"
                    style={{
                        left: p.left,
                        animation: `mealParticle 2s ease-out ${p.delay} infinite`,
                        '--dx': p.dx,
                    } as React.CSSProperties}
                />
            ))}

            {/* Spinner ring + icon */}
            <div className="relative" style={{ width: 88, height: 88 }}>
                {/* Outer pulse ring */}
                <div
                    className="absolute rounded-full border-2"
                    style={{
                        inset: -8,
                        borderColor: 'rgba(34, 197, 94, 0.25)', // green-500 with opacity
                        animation: 'mealPulseRing 2s ease-in-out infinite',
                    }}
                />
                {/* Static bg ring */}
                <div
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: 'rgba(34, 197, 94, 0.1)' }}
                />
                {/* Spinning arc */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border-[3px] border-transparent"
                    style={{ borderTopColor: '#4ade80', borderRightColor: '#16a34a' }}
                />
                {/* Center icon */}
                <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    className="absolute inset-0 flex items-center justify-center text-2xl"
                >
                    🥗
                </motion.div>
            </div>

            {/* Animated headline + dots */}
            <div className="text-center">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={headline}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35 }}
                        className="font-semibold text-lg mb-2"
                    >
                        {headline}
                    </motion.p>
                </AnimatePresence>
                <div className="flex justify-center gap-1.5">
                    {DOTS.map((i) => (
                        <motion.span
                            key={i}
                            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }}
                            className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"
                        />
                    ))}
                </div>
            </div>

            {/* Progress bar */}
            <div className="rounded-full overflow-hidden" style={{ width: 220, height: 4, background: 'rgba(34,197,94,0.1)' }}>
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #22c55e, #86efac)' }}
                    initial={{ width: '0%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 3.5, ease: [0.4, 0, 0.2, 1] }}
                />
            </div>

            {/* Step checklist */}
            <div className="flex flex-col gap-2.5" style={{ width: 220 }}>
                {STEPS.map((step, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-2.5"
                    >
                        <motion.span
                            animate={{
                                backgroundColor: i <= activeStep ? '#22c55e' : 'rgba(34,197,94,0.2)'
                            }}
                            transition={{ duration: 0.4 }}
                            className="w-2 h-2 rounded-full flex-shrink-0"
                        />
                        <span
                            className="text-sm transition-all duration-300"
                            style={{
                                color: i === activeStep ? '#14532d' : 'rgba(20, 83, 45, 0.5)',
                                fontWeight: i === activeStep ? 600 : 400
                            }}
                        >
                            {step.label}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}

export function FitnessPlanLoader() {
    const [activeStep, setActiveStep] = useState(0);
    const [headline, setHeadline] = useState(FITNESS_HEADLINES[0]);

    useEffect(() => {
        const timers = FITNESS_STEP_TIMINGS.map((delay, i) =>
            setTimeout(() => {
                setActiveStep(i);
                setHeadline(FITNESS_HEADLINES[i]);
            }, delay)
        );
        return () => timers.forEach(clearTimeout);
    }, []);

    return (
        <div className="relative flex flex-col items-center justify-center gap-6 rounded-2xl px-8 py-12 overflow-hidden bg-white border border-green-200 text-green-900 shadow-sm">
            {/* Particles */}
            {FITNESS_PARTICLES.map((p, i) => (
                <span
                    key={i}
                    className="absolute bottom-1/3 w-1.5 h-1.5 rounded-full opacity-60"
                    style={{
                        left: p.left,
                        background: p.color,
                        animation: `fitnessParticle 2.2s ease-out ${p.delay} infinite`,
                        '--dx': p.dx,
                    } as React.CSSProperties}
                />
            ))}

            {/* Spinner */}
            <div className="relative" style={{ width: 90, height: 90 }}>
                <div
                    className="absolute rounded-full border-2"
                    style={{
                        inset: -10,
                        borderColor: 'rgba(34, 197, 94, 0.22)',
                        animation: 'fitnessPulseRing 2.2s ease-in-out infinite',
                    }}
                />
                <div
                    className="absolute inset-0 rounded-full border-[3px]"
                    style={{ borderColor: 'rgba(34, 197, 94, 0.1)' }}
                />
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border-[3px] border-transparent"
                    style={{ borderTopColor: '#22c55e', borderRightColor: '#16a34a' }}
                />
                <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 2.8, ease: 'easeInOut' }}
                    className="absolute inset-0 flex items-center justify-center text-2xl"
                >
                    🏋️
                </motion.div>
            </div>

            {/* Headline + dots */}
            <div className="text-center">
                <AnimatePresence mode="wait">
                    <motion.p
                        key={headline}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.35 }}
                        className="font-semibold text-lg mb-2"
                    >
                        {headline}
                    </motion.p>
                </AnimatePresence>
                <div className="flex justify-center gap-1.5">
                    {DOTS.map((i) => (
                        <motion.span
                            key={i}
                            animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }}
                            className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"
                        />
                    ))}
                </div>
            </div>

            {/* EQ bars */}
            <div className="flex items-end gap-1.5" style={{ height: 32 }}>
                {EQ_BARS.map((b, i) => (
                    <motion.div
                        key={i}
                        animate={{ height: b.h, opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.1, delay: b.delay, ease: 'easeInOut' }}
                        className="w-1.5 rounded-sm bg-green-500"
                    />
                ))}
            </div>

            {/* Progress bar */}
            <div
                className="rounded-full overflow-hidden"
                style={{ width: 200, height: 4, background: 'rgba(34, 197, 94, 0.1)' }}
            >
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #16a34a, #4ade80)' }}
                    initial={{ width: '5%' }}
                    animate={{ width: '100%' }}
                    transition={{ duration: 4, ease: [0.4, 0, 0.2, 1] }}
                />
            </div>

            {/* Steps */}
            <div className="flex flex-col gap-2.5" style={{ width: 230 }}>
                {FITNESS_STEPS.map((step, i) => (
                    <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -6 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.08 }}
                        className="flex items-center gap-2.5"
                    >
                        <motion.div
                            animate={{
                                background:
                                    i < activeStep ? '#16a34a' // Darker green for completed
                                        : i === activeStep ? '#22c55e' // Vibrant green for active
                                            : 'rgba(34, 197, 94, 0.15)', // Faint green for upcoming
                                scale: i === activeStep ? [1, 1.15, 1] : 1,
                                color: i <= activeStep ? '#ffffff' : '#14532d'
                            }}
                            transition={{ duration: 0.4 }}
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                            style={{ fontSize: 11, fontWeight: 600 }}
                        >
                            {i < activeStep ? '✓' : i + 1}
                        </motion.div>
                        <span
                            className="text-sm transition-all duration-300"
                            style={{
                                color: i === activeStep ? '#14532d' : 'rgba(20, 83, 45, 0.5)',
                                fontWeight: i === activeStep ? 600 : 400,
                            }}
                        >
                            {step.label}
                        </span>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}