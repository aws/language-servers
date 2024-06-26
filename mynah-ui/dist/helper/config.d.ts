/*!
 * Copyright 2022 Amazon.com, Inc. or its affiliates. All Rights Reserved.
 * SPDX-License-Identifier: Apache-2.0
 */
import { ComponentOverrides, ConfigModel, ConfigOptions, ConfigTexts } from '../static';
interface ConfigFullModel extends ConfigOptions {
    texts: ConfigTexts;
    componentClasses: ComponentOverrides;
}
export declare class Config {
    private static instance;
    config: ConfigFullModel;
    private constructor();
    static getInstance(config?: Partial<ConfigModel>): Config;
}
export {};
