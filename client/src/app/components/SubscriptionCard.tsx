import { motion } from "motion/react";
import { Button } from './ui/button';
import { Sparkles, Check, CheckCircle2, Loader2, ChevronRight } from "lucide-react";
import { ReactNode } from "react";
import { useTranslation } from 'react-i18next';

export interface SubscriptionFeature {
    icon?: ReactNode;
    text: string;
}

export interface SubscriptionPlan {
    id: string | number;
    name: string;
    price: number | string;
    period: string;
    isPopular?: boolean;
    isCurrent?: boolean;
    features: SubscriptionFeature[];
}

interface SubscriptionCardProps {
    plan: SubscriptionPlan;
    index: number;
    subscribing?: boolean;
    isFamilyPlan?: boolean;
    onSubscribe: (plan: SubscriptionPlan) => void;
}

export default function SubscriptionCard({
    plan,
    index,
    subscribing = false,
    isFamilyPlan = false,
    onSubscribe,
}: SubscriptionCardProps) {
    const { t } = useTranslation();
    return (
        <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={`relative rounded-xl border-2 transition-all bg-card flex flex-col h-full ${plan.isPopular
                    ? 'border-forest-canopy/60 shadow-[0_20px_60px_-30px_rgba(74,222,128,0.45)]'
                    : 'border-border hover:border-foreground/20'
                }`}
        >
            {/* Popular Badge */}
            {plan.isPopular && !plan.isCurrent && (
                <div className="absolute top-4 right-4 z-10 inline-flex items-center gap-2 rounded-full border border-green-500/20 bg-card px-3 py-1 text-[11px] font-bold text-green-400 shadow-sm backdrop-blur-sm">
                    <Sparkles className="w-3 h-3" />
                    {t('subscriptions.mostPopular')}
                </div>
            )}

            {/* Card Content - flex-1 ensures it pushes the button to the bottom */}
            <div className="p-6 flex flex-col flex-1">

                {/* Header */}
                <h3 className="text-base font-bold text-card-foreground">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mt-2">
                    <span className="text-3xl font-bold text-card-foreground">${plan.price}</span>
                    <span className="text-sm text-muted-foreground">/{plan.period}</span>
                </div>

                {/* Features List */}
                <ul className="mt-6 mb-8 space-y-3 flex-1">
                    {plan.features.map((feat, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-muted-foreground">
                            <div
                                className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${plan.isPopular
                                        ? 'bg-green-500/10 text-green-400'
                                        : 'bg-muted text-muted-foreground'
                                    }`}
                            >
                                {feat.icon || <Check className="w-3.5 h-3.5" />}
                            </div>
                            <span>{feat.text}</span>
                        </li>
                    ))}
                </ul>

                {/* Action Button */}
                <Button variant={plan.isCurrent ? 'secondary' : plan.isPopular ? 'primary' : 'outline'} size="default" className="w-full" disabled={plan.isCurrent || subscribing} onClick={() => onSubscribe(plan)}>
                    {plan.isCurrent ? (
                        <>
                            <CheckCircle2 className="w-4 h-4" /> {t('subscriptions.currentPlan')}
                        </>
                    ) : subscribing ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" /> {t('subscriptions.processing')}
                        </>
                    ) : (
                        <>
                            {isFamilyPlan ? t('subscriptions.upgradeToFamily') : t('subscriptions.subscribe')}
                            <ChevronRight className="w-4 h-4 rtl:rotate-180" />
                        </>
                    )}
                </Button>
            </div>
        </motion.div>
    );
}