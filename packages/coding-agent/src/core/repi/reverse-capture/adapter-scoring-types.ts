/** Adapter reverse capture score state. */
export type AdapterScoreState = {
	signals: string[];
	confidence: number;
	capture: string;
};

export type AdapterHasFn = (re: RegExp) => boolean;
