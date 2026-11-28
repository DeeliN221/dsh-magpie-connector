import { type Card } from './view-model.js';
/** Bar colour: ≤70% normal (blue), above 70 and below 90 warn (orange), 90% and above high (red). */
export declare const usageLevel: (used: number) => "high" | "normal" | "warn";
export declare function UsageCard({ card, busy, onRefresh, disabled, resetBusy, resetStatus, onReset }: {
    card: Card;
    busy: boolean;
    onRefresh: () => void;
    disabled?: boolean;
    resetBusy?: boolean;
    resetStatus?: {
        text: string;
        tone: 'ok' | 'error' | 'warn';
    };
    onReset?: (card: Card) => void;
}): import("react").DetailedReactHTMLElement<{
    className: string;
    'data-card': string;
}, HTMLElement>;
