import { AnimatePresence, motion } from "motion/react";
import { useEffect, useState } from "react";

// meal plan loader
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

const STEP_TIMINGS = [0, 900, 2000, 3100];


// fitness plan loader
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

const FITNESS_STEP_TIMINGS = [0, 1000, 2200, 3400];

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
        <div
            className="relative flex flex-col items-center justify-center gap-6 rounded-2xl px-8 py-12 overflow-hidden"
            style={{ background: 'linear-gradient(160deg,#0f5c2e,#145c30,#0a3d1f)' }}
        >
            {/* Floating particles */}
            {[
                { left: '20%', delay: '0s', dx: '-15px' },
                { left: '50%', delay: '0.7s', dx: '20px' },
                { left: '75%', delay: '1.4s', dx: '-10px' },
                { left: '35%', delay: '0.4s', dx: '12px' },
            ].map((p, i) => (
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
            <div className="relative w-22 h-22" style={{ width: 88, height: 88 }}>
                {/* Outer pulse ring */}
                <div
                    className="absolute rounded-full border-2"
                    style={{
                        inset: -8,
                        borderColor: 'rgba(126,218,156,0.25)',
                        animation: 'mealPulseRing 2s ease-in-out infinite',
                    }}
                />
                {/* Static bg ring */}
                <div
                    className="absolute inset-0 rounded-full border-2"
                    style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                />
                {/* Spinning arc */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border-[3px] border-transparent"
                    style={{ borderTopColor: '#7eda9c', borderRightColor: '#4ec97a' }}
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
                        className="text-white font-semibold text-lg mb-2"
                    >
                        {headline}
                    </motion.p>
                </AnimatePresence>
                <div className="flex justify-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            animate={{ y: [0, -5, 0], opacity: [0.4, 1, 0.4] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }}
                            className="w-1.5 h-1.5 rounded-full bg-green-300 inline-block"
                        />
                    ))}
                </div>
            </div>

            {/* Progress bar */}
            <div
                className="rounded-full overflow-hidden"
                style={{ width: 200, height: 4, background: 'rgba(255,255,255,0.12)' }}
            >
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg,#4ec97a,#9ef5bb)' }}
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
                                backgroundColor:
                                    i < activeStep
                                        ? '#4ec97a'
                                        : i === activeStep
                                            ? '#9ef5bb'
                                            : 'rgba(255,255,255,0.2)',
                                scale: i === activeStep ? [1, 1.3, 1] : 1,
                            }}
                            transition={{ duration: 0.4 }}
                            className="w-2 h-2 rounded-full flex-shrink-0"
                        />
                        <span
                            className="text-sm transition-all duration-300"
                            style={{
                                color: i === activeStep ? '#fff' : 'rgba(255,255,255,0.5)',
                                fontWeight: i === activeStep ? 500 : 400,
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
        <div
            className="relative flex flex-col items-center justify-center gap-6 rounded-2xl px-8 py-12 overflow-hidden"
            style={{ background: 'linear-gradient(155deg,#0d1f3c,#122a50,#0a1a30)' }}
        >
            {/* Particles */}
            {[
                { left: '15%', delay: '0s', dx: '-18px', color: '#60a5fa' },
                { left: '55%', delay: '0.8s', dx: '16px', color: '#60a5fa' },
                { left: '80%', delay: '1.6s', dx: '-12px', color: '#60a5fa' },
                { left: '38%', delay: '0.4s', dx: '14px', color: '#93c5fd' },
                { left: '65%', delay: '1.1s', dx: '-8px', color: '#bfdbfe' },
            ].map((p, i) => (
                <span
                    key={i}
                    className="absolute bottom-1/3 w-1.5 h-1.5 rounded-full"
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
                        borderColor: 'rgba(96,165,250,0.22)',
                        animation: 'fitnessPulseRing 2.2s ease-in-out infinite',
                    }}
                />
                <div
                    className="absolute inset-0 rounded-full border-[3px]"
                    style={{ borderColor: 'rgba(255,255,255,0.08)' }}
                />
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.1, ease: 'linear' }}
                    className="absolute inset-0 rounded-full border-[3px] border-transparent"
                    style={{ borderTopColor: '#60a5fa', borderRightColor: '#3b82f6' }}
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
                        className="text-white font-semibold text-lg mb-2"
                    >
                        {headline}
                    </motion.p>
                </AnimatePresence>
                <div className="flex justify-center gap-1.5">
                    {[0, 1, 2].map((i) => (
                        <motion.span
                            key={i}
                            animate={{ y: [0, -5, 0], opacity: [0.35, 1, 0.35] }}
                            transition={{ repeat: Infinity, duration: 1.2, delay: i * 0.15 }}
                            className="w-1.5 h-1.5 rounded-full bg-blue-400 inline-block"
                        />
                    ))}
                </div>
            </div>

            {/* EQ bars */}
            <div className="flex items-end gap-1.5" style={{ height: 32 }}>
                {[
                    { h: [4, 22, 4], delay: 0 },
                    { h: [8, 18, 8], delay: 0.15 },
                    { h: [12, 26, 12], delay: 0.3 },
                    { h: [8, 18, 8], delay: 0.45 },
                    { h: [4, 22, 4], delay: 0.6 },
                ].map((b, i) => (
                    <motion.div
                        key={i}
                        animate={{ height: b.h, opacity: [0.4, 1, 0.4] }}
                        transition={{ repeat: Infinity, duration: 1.1, delay: b.delay, ease: 'easeInOut' }}
                        className="w-1.5 rounded-sm bg-blue-400"
                    />
                ))}
            </div>

            {/* Progress bar */}
            <div
                className="rounded-full overflow-hidden"
                style={{ width: 200, height: 4, background: 'rgba(255,255,255,0.1)' }}
            >
                <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg,#3b82f6,#93c5fd)' }}
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
                                    i < activeStep ? '#22c55e'
                                        : i === activeStep ? '#3b82f6'
                                            : 'rgba(255,255,255,0.1)',
                                scale: i === activeStep ? [1, 1.25, 1] : 1,
                            }}
                            transition={{ duration: 0.4 }}
                            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 text-white"
                            style={{ fontSize: 11, fontWeight: 600 }}
                        >
                            {i < activeStep ? '✓' : i + 1}
                        </motion.div>
                        <span
                            className="text-sm transition-all duration-300"
                            style={{
                                color: i === activeStep ? '#fff' : 'rgba(255,255,255,0.5)',
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