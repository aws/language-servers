// Copyright 2024 Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

package software.aws.toolkits.eclipse.amazonq.util;

import org.eclipse.core.runtime.Platform;
import org.eclipse.core.runtime.preferences.InstanceScope;
import org.eclipse.jface.text.BadLocationException;
import org.eclipse.jface.text.ITextViewer;
import org.eclipse.swt.SWT;
import org.eclipse.swt.custom.CaretListener;
import org.eclipse.swt.graphics.Font;
import org.eclipse.swt.widgets.Display;
import org.eclipse.ui.IWorkbench;
import org.eclipse.ui.IWorkbenchListener;
import org.eclipse.ui.PlatformUI;
import org.eclipse.ui.texteditor.ITextEditor;
import org.osgi.service.prefs.Preferences;

import software.aws.toolkits.eclipse.amazonq.lsp.model.InlineCompletionItem;
import software.aws.toolkits.eclipse.amazonq.lsp.model.InlineCompletionParams;
import software.aws.toolkits.eclipse.amazonq.lsp.model.InlineCompletionTriggerKind;
import software.aws.toolkits.eclipse.amazonq.providers.LspProvider;
import software.aws.toolkits.eclipse.amazonq.plugin.Activator;

import java.util.List;
import java.util.Stack;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.ExecutionException;
import java.util.concurrent.Future;
import java.util.stream.Collectors;
import java.util.function.Consumer;

import static software.aws.toolkits.eclipse.amazonq.util.QConstants.Q_INLINE_HINT_TEXT_STYLE;
import static software.aws.toolkits.eclipse.amazonq.util.QEclipseEditorUtils.getActiveTextViewer;
import static software.aws.toolkits.eclipse.amazonq.util.SuggestionTextUtil.replaceSpacesWithTabs;

public final class QInvocationSession extends QResource {

    // Static variable to hold the single instance
    private static QInvocationSession instance;

    private QInvocationSessionState state = QInvocationSessionState.INACTIVE;
    private CaretMovementReason caretMovementReason = CaretMovementReason.UNEXAMINED;
    private boolean suggestionAccepted = false;

    private QSuggestionsContext suggestionsContext = null;

    private ITextEditor editor = null;
    private ITextViewer viewer = null;
    private Font inlineTextFont = null;
    private int invocationOffset = -1;
    private int tabSize;
    private long invocationTimeInMs = -1L;
    private QInlineRendererListener paintListener = null;
    private CaretListener caretListener = null;
    private QInlineInputListener inputListener = null;
    private Stack<String> closingBrackets = new Stack<>();
    private int[] headOffsetAtLine = new int[500];
    private boolean hasBeenTypedahead = false;
    private boolean isTabOnly = false;
    private CodeReferenceAcceptanceCallback codeReferenceAcceptanceCallback = null;
    private Consumer<Integer> unsetVerticalIndent;
    private ConcurrentHashMap<UUID, Future<?>> unresolvedTasks = new ConcurrentHashMap<>();

    // Private constructor to prevent instantiation
    private QInvocationSession() {
        // Initialization code here
    }

    // Method to get the single instance
    public static synchronized QInvocationSession getInstance() {
        if (instance == null) {
            instance = new QInvocationSession();
            Preferences eclipseUIPrefs = Platform.getPreferencesService().getRootNode()
                    .node(InstanceScope.SCOPE)
                    .node("org.eclipse.jdt.ui");
            boolean isBracesSetToAutoClose = eclipseUIPrefs.getBoolean("closeBraces", true);
            boolean isBracketsSetToAutoClose = eclipseUIPrefs.getBoolean("closeBrackets", true);
            boolean isStringSetToAutoClose = eclipseUIPrefs.getBoolean("closeStrings", true);

            // We'll also need tab sizes since suggestions do not take that into account
            // and is only given in spaces
            Preferences eclipseCorePrefs = Platform.getPreferencesService().getRootNode()
                    .node(InstanceScope.SCOPE)
                    .node("org.eclipse.jdt.core");
            instance.tabSize = eclipseCorePrefs.getInt("org.eclipse.jdt.core.formatter.tabulation.size", 4);
            instance.isTabOnly = eclipseCorePrefs.getBoolean("use_tabs_only_for_leading_indentations", true);

            PlatformUI.getWorkbench().addWorkbenchListener(new IWorkbenchListener() {
                @Override
                public boolean preShutdown(final IWorkbench workbench, final boolean forced) {
                    eclipseUIPrefs.putBoolean("closeBraces", isBracesSetToAutoClose);
                    eclipseUIPrefs.putBoolean("closeBrackets", isBracketsSetToAutoClose);
                    eclipseUIPrefs.putBoolean("closeStrings", isStringSetToAutoClose);
                    return true;
                }

                @Override
                public void postShutdown(final IWorkbench workbench) {
                    return;
                }
            });
        }
        return instance;
    }

    // TODO: separation of concerns between session attributes, session management,
    // and remote invocation logic
    // Method to start the session
    public synchronized boolean start(final ITextEditor editor) throws ExecutionException {
        if (!isActive()) {
            try {
                if (!DefaultLoginService.getInstance().getLoginDetails().get().getIsLoggedIn()) {
                    this.end();
                    return false;
                } else {
                    DefaultLoginService.getInstance().updateToken();
                }
            } catch (InterruptedException e) {
                Activator.getLogger().info("Invocation start interrupted", e);
                return false;
            }
            System.out.println("Session starting");
            state = QInvocationSessionState.INVOKING;

            // Start session logic here
            this.editor = editor;
            viewer = getActiveTextViewer(editor);
            if (viewer == null) {
                // cannot continue the invocation
                throw new IllegalStateException("no viewer available");
            }

            var widget = viewer.getTextWidget();

            suggestionsContext = new QSuggestionsContext();
            inlineTextFont = QEclipseEditorUtils.getInlineTextFont(widget, Q_INLINE_HINT_TEXT_STYLE);
            invocationOffset = widget.getCaretOffset();
            invocationTimeInMs = System.currentTimeMillis();
            System.out.println("Session started.");

            return true;
        } else {
            System.out.println("Session is already active.");
            return false;
        }
    }

    private void attachListeners() {
        var widget = this.viewer.getTextWidget();
        var listeners = widget.getTypedListeners(SWT.Paint, QInlineRendererListener.class).collect(Collectors.toList());
        System.out.println("Current listeners for " + widget);
        listeners.forEach(System.out::println);
        if (listeners.isEmpty()) {
            paintListener = new QInlineRendererListener();
            widget.addPaintListener(paintListener);
        }

        inputListener = QEclipseEditorUtils.getInlineInputListener(widget);
        widget.addVerifyListener(inputListener);
        widget.addVerifyKeyListener(inputListener);
        widget.addMouseListener(inputListener);

        caretListener = new QInlineCaretListener(widget);
        widget.addCaretListener(caretListener);
    }

    public void invoke(final int invocationOffset) {
        var session = QInvocationSession.getInstance();

        try {
            var params = InlineCompletionUtils.cwParamsFromContext(session.getEditor(), session.getViewer(),
                    invocationOffset, InlineCompletionTriggerKind.Automatic);
            queryAsync(params, invocationOffset);
        } catch (BadLocationException e) {
            System.out.println("BadLocationException: " + e.getMessage());
            Activator.getLogger().error("Unable to compute inline completion request from document", e);
        }
    }

    public void invoke() {
        var session = QInvocationSession.getInstance();

        try {
            var params = InlineCompletionUtils.cwParamsFromContext(session.getEditor(), session.getViewer(),
                    session.getInvocationOffset(), InlineCompletionTriggerKind.Invoke);
            queryAsync(params, session.getInvocationOffset());
        } catch (BadLocationException e) {
            System.out.println("BadLocationException: " + e.getMessage());
            Activator.getLogger().error("Unable to compute inline completion request from document", e);
        }
    }

    private void queryAsync(final InlineCompletionParams params, final int invocationOffset) {
        var uuid = UUID.randomUUID();
        var future = ThreadingUtils.executeAsyncTaskAndReturnFuture(() -> {
            try {
                var session = QInvocationSession.getInstance();

                List<InlineCompletionItem> newSuggestions = LspProvider.getAmazonQServer().get()
                        .inlineCompletionWithReferences(params)
                        .thenApply(result -> result.getItems().parallelStream().map(item -> {
                            if (isTabOnly) {
                                String sanitizedText = replaceSpacesWithTabs(item.getInsertText(), tabSize);
                                System.out.println(
                                        "Sanitized text: " + sanitizedText.replace("\n", "\\n").replace("\t", "\\t"));
                                item.setInsertText(sanitizedText);
                            }
                            return item;
                        }).collect(Collectors.toList())).get();
                unresolvedTasks.remove(uuid);

                Display.getDefault().asyncExec(() -> {
                    if (newSuggestions == null || newSuggestions.isEmpty()) {
                        if (!session.isPreviewingSuggestions()) {
                            end();
                        }
                        System.out.println("Got emtpy result for from invocation offset of " + invocationOffset);
                        return;
                    }

                    // If the caret positions has moved on from the invocation offset, we need to
                    // see if there exists in the suggestions fetched
                    // one more suggestions that qualify for what has been typed since the
                    // invocation.
                    // Note that we should not remove the ones that have been disqualified by the
                    // content typed since the user might still want to explore them.
                    int currentIdxInSuggestion = 0;
                    boolean hasAMatch = false;
                    var widget = session.getViewer().getTextWidget();
                    int currentOffset = widget.getCaretOffset();
                    if (currentOffset < invocationOffset) {
                        end();
                        return;
                    } else if (currentOffset > invocationOffset) {
                        for (int i = 0; i < newSuggestions.size(); i++) {
                            String prefix = widget.getTextRange(invocationOffset, currentOffset - invocationOffset);
                            if (newSuggestions.get(i).getInsertText().startsWith(prefix)) {
                                currentIdxInSuggestion = i;
                                hasAMatch = true;
                                break;
                            }
                        }
                    }

                    if (invocationOffset != currentOffset && !hasAMatch) {
                        System.out.println(
                                "invocation offset: " + invocationOffset + "\ncurrent offset: " + currentOffset);
                        end();
                        return;
                    }

                    session.invocationOffset = invocationOffset;

                    suggestionsContext.getDetails()
                            .addAll(newSuggestions.stream().map(QSuggestionContext::new).collect(Collectors.toList()));

                    suggestionsContext.setCurrentIndex(currentIdxInSuggestion);

                    // TODO: remove print
                    // Update the UI with the results
                    System.out.println("Suggestions: " + newSuggestions.stream()
                            .map(suggestion -> suggestion.getInsertText()).collect(Collectors.toList()));
                    System.out.println("Total suggestion number: " + newSuggestions.size());
                    System.out.println("Invocation offset: " + invocationOffset);
                    System.out.println("========================");

                    session.transitionToPreviewingState();
                    attachListeners();
                    session.primeListeners();
                    session.getViewer().getTextWidget().redraw();
                });
            } catch (InterruptedException e) {
                System.out.println("Query InterruptedException: " + e.getMessage());
                Activator.getLogger().error("Inline completion interrupted", e);
            } catch (ExecutionException e) {
                System.out.println("Query ExecutionException: " + e.getMessage());
                Activator.getLogger().error("Error executing inline completion", e);
            }
        });
        unresolvedTasks.put(uuid, future);
    }

    // Method to end the session
    public void end() {
        if (isActive() && unresolvedTasks.isEmpty()) {
            // Get the current thread's stack trace
            StackTraceElement[] stackTraceElements = Thread.currentThread().getStackTrace();

            // Log the stack trace
            System.out.println("Stack trace:");
            for (StackTraceElement element : stackTraceElements) {
                System.out.println(element);
            }
            dispose();
            state = QInvocationSessionState.INACTIVE;
            // End session logic here
            System.out.println("Session ended.");
        } else if (!unresolvedTasks.isEmpty()) {
            System.out.println(
                    "Session cannot be ended because there are " + unresolvedTasks.size() + " requests in flight");
        }
    }

    public void endImmediately() {
        if (isActive()) {
            dispose();
            state = QInvocationSessionState.INACTIVE;
            System.out.println("Session terminated");
        }
    }

    // Method to check if session is active
    public boolean isActive() {
        return state != QInvocationSessionState.INACTIVE;
    }

    public boolean isPreviewingSuggestions() {
        return state == QInvocationSessionState.SUGGESTION_PREVIEWING;
    }

    public boolean isDecisionMade() {
        return state == QInvocationSessionState.DECISION_MADE;
    }

    public synchronized void transitionToPreviewingState() {
        assert state == QInvocationSessionState.INVOKING;
        state = QInvocationSessionState.SUGGESTION_PREVIEWING;
    }

    public void transitionToInvokingState() {
        assert state == QInvocationSessionState.INACTIVE;
        state = QInvocationSessionState.INVOKING;
    }

    public void transitionToInactiveState() {
        state = QInvocationSessionState.INACTIVE;
    }

    public void transitionToDecisionMade() {
        var widget = viewer.getTextWidget();
        var caretLine = widget.getLineAtOffset(widget.getCaretOffset());
        transitionToDecisionMade(caretLine + 1);
    }

    public void transitionToDecisionMade(final int line) {
        if (state != QInvocationSessionState.SUGGESTION_PREVIEWING) {
            return;
        }
        state = QInvocationSessionState.DECISION_MADE;
        unsetVerticalIndent(line);
    }

    public void setSuggestionAccepted(final boolean suggestionAccepted) {
        System.out.println("Suggestion accepted has been set to " + suggestionAccepted);
        this.suggestionAccepted = suggestionAccepted;
    }

    public boolean getSuggestionAccepted() {
        return suggestionAccepted;
    }

    public void setCaretMovementReason(final CaretMovementReason reason) {
        this.caretMovementReason = reason;
    }

    public void setHeadOffsetAtLine(final int lineNum, final int offSet) throws IllegalArgumentException {
        if (lineNum >= headOffsetAtLine.length || lineNum < 0) {
            throw new IllegalArgumentException("Problematic index given");
        }
        headOffsetAtLine[lineNum] = offSet;
    }

    public Font getInlineTextFont() {
        return inlineTextFont;
    }

    public int getInvocationOffset() {
        return invocationOffset;
    }

    public ITextEditor getEditor() {
        return editor;
    }

    public ITextViewer getViewer() {
        return viewer;
    }

    public synchronized QInvocationSessionState getState() {
        return state;
    }

    public CaretMovementReason getCaretMovementReason() {
        return caretMovementReason;
    }

    public Stack<String> getClosingBrackets() {
        return closingBrackets;
    }

    public int getHeadOffsetAtLine(final int lineNum) throws IllegalArgumentException {
        if (lineNum >= headOffsetAtLine.length || lineNum < 0) {
            throw new IllegalArgumentException("Problematic index given");
        }
        return headOffsetAtLine[lineNum];
    }

    public InlineCompletionItem getCurrentSuggestion() {
        if (suggestionsContext == null) {
            Activator.getLogger().warn("QSuggestion context is null");
            return null;
        }
        var details = suggestionsContext.getDetails();
        var index = suggestionsContext.getCurrentIndex();
        if (details.isEmpty() && index != -1 || !details.isEmpty() && (index < 0 || index >= details.size())) {
            Activator.getLogger().warn("QSuggestion context index is incorrect");
            return null;
        }
        var detail = details.get(index);
        if (detail.getState() == QSuggestionState.DISCARD) {
            throw new IllegalStateException("QSuggestion showing discarded suggestions");
        }

        return details.get(index).getInlineCompletionItem();
    }

    public void decrementCurrentSuggestionIndex() {
        if (suggestionsContext != null) {
            suggestionsContext.decrementIndex();
            primeListeners();
            getViewer().getTextWidget().redraw();
        }
    }

    public void incrementCurentSuggestionIndex() {
        if (suggestionsContext != null) {
            suggestionsContext.incrementIndex();
            primeListeners();
            getViewer().getTextWidget().redraw();
        }
    }

    public void setHasBeenTypedahead(final boolean hasBeenTypedahead) {
        this.hasBeenTypedahead = hasBeenTypedahead;
    }

    public boolean hasBeenTypedahead() {
        return hasBeenTypedahead;
    }

    public void registerCallbackForCodeReference(
            final CodeReferenceAcceptanceCallback codeReferenceAcceptanceCallback) {
        this.codeReferenceAcceptanceCallback = codeReferenceAcceptanceCallback;
    }

    public void executeCallbackForCodeReference() {
        if (codeReferenceAcceptanceCallback != null) {
            var selectedSuggestion = getCurrentSuggestion();
            var widget = viewer.getTextWidget();
            int startLine = widget.getLineAtOffset(invocationOffset);
            codeReferenceAcceptanceCallback.onCallback(selectedSuggestion, startLine);
        }
    }

    public void setVerticalIndent(final int line, final int height) {
        var widget = viewer.getTextWidget();
        widget.setLineVerticalIndent(line, height);
        unsetVerticalIndent = (caretLine) -> {
            widget.setLineVerticalIndent(caretLine, 0);
        };
    }

    public void unsetVerticalIndent(final int caretLine) {
        if (unsetVerticalIndent != null) {
            unsetVerticalIndent.accept(caretLine);
            unsetVerticalIndent = null;
        }
    }

    public List<IQInlineSuggestionSegment> getSegments() {
        return inputListener.getSegments();
    }

    public int getNumSuggestionLines() {
        return inputListener.getNumSuggestionLines();
    }

    public void primeListeners() {
        inputListener.onNewSuggestion();
    }

    public int getLastKnownLine() {
        return ((QInlineCaretListener) caretListener).getLastKnownLine();
    }

    public void awaitAllUnresolvedTasks() throws ExecutionException {
        List<Future<?>> tasks = unresolvedTasks.values().stream().toList();
        for (Future<?> future : tasks) {
            try {
                future.get();
            } catch (InterruptedException e) {
                Thread.currentThread().interrupt();
            } catch (ExecutionException e) {
                // Propagate the execution exception
                throw e;
            }
        }
    }

    // Additional methods for the session can be added here
    @Override
    public void dispose() {
        var widget = viewer.getTextWidget();

        suggestionsContext = null;
        inlineTextFont.dispose();
        inlineTextFont = null;
        closingBrackets = null;
        caretMovementReason = CaretMovementReason.UNEXAMINED;
        hasBeenTypedahead = false;
        unresolvedTasks.forEach((uuid, task) -> {
            boolean cancelled = task.cancel(true);
            if (cancelled) {
                System.out.println("Cancelled task with uuid " + uuid);
            } else {
                System.out.println("Failed to cancel task with uuid " + uuid);
            }
        });
        unresolvedTasks.clear();
        if (inputListener != null) {
            inputListener.beforeRemoval();
            widget.removeVerifyListener(inputListener);
            widget.removeVerifyKeyListener(inputListener);
            widget.removeMouseListener(inputListener);
        }
        QInvocationSession.getInstance().getViewer().getTextWidget().redraw();
        if (paintListener != null) {
            widget.removePaintListener(paintListener);
        }
        if (caretListener != null) {
            widget.removeCaretListener(caretListener);
        }
        paintListener = null;
        caretListener = null;
        inputListener = null;
        invocationOffset = -1;
        invocationTimeInMs = -1L;
        editor = null;
        viewer = null;
        suggestionAccepted = false;
    }
}