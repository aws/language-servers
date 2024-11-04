// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.eclipse.amazonq.util;

import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

public final class ThreadingUtils {
    private static final int CORE_POOL_SIZE = Runtime.getRuntime().availableProcessors();
    private static final ExecutorService THREAD_POOL = Executors.newFixedThreadPool(CORE_POOL_SIZE);

    private ThreadingUtils() {
        // prevent instantiation
    }

    public static ExecutorService getWorkerPool() {
        return THREAD_POOL;
    }

    public static void executeAsyncTask(final Runnable task) {
        THREAD_POOL.execute(task);
    }

    public static Future<?> executeAsyncTaskAndReturnFuture(final Runnable task) {
        return THREAD_POOL.submit(task);
    }

    public static void shutdown() {
        THREAD_POOL.shutdown();
    }
}