/*!
 * Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Tracks acceptance streak across both completion and edit suggestion types.
 * Shared singleton to maintain consistent streak count between different code paths.
 */
export class StreakTracker {
    private static _instance?: StreakTracker
    private streakLength: number = 0

    private constructor() {}

    public static getInstance(): StreakTracker {
        if (!StreakTracker._instance) {
            StreakTracker._instance = new StreakTracker()
        }
        return StreakTracker._instance
    }

    public static reset() {
        StreakTracker._instance = undefined
    }

    /**
     * Updates and returns the current streak length based on acceptance status.
     * @param isAccepted Whether the suggestion was accepted
     * @returns Current streak length before update, or -1 if no change
     */
    public getAndUpdateStreakLength(isAccepted: boolean | undefined): number {
        if (!isAccepted && this.streakLength !== 0) {
            const currentStreakLength = this.streakLength
            this.streakLength = 0
            return currentStreakLength
        } else if (isAccepted) {
            this.streakLength += 1
        }
        return -1
    }
}
