/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
export declare const getTimeDiff: (differenceInMs: number, show?: {
    years?: boolean;
    months?: boolean;
    weeks?: boolean;
    days?: boolean;
    hours?: boolean;
    minutes?: boolean;
} | 1 | 2 | 3 | 4 | 5 | 6, separator?: string) => string;
