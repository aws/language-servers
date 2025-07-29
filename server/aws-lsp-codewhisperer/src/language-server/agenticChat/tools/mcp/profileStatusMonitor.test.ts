/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { expect } from 'chai'
import * as sinon from 'sinon'
import { ProfileStatusMonitor } from './profileStatusMonitor'

describe('ProfileStatusMonitor', () => {
    let profileStatusMonitor: ProfileStatusMonitor
    let mockCredentialsProvider: any
    let mockWorkspace: any
    let mockLogging: any
    let mockSdkInitializator: any
    let mockOnMcpDisabled: sinon.SinonStub
    let clock: sinon.SinonFakeTimers

    beforeEach(() => {
        clock = sinon.useFakeTimers()

        mockCredentialsProvider = {
            hasCredentials: sinon.stub().returns(true),
        }

        mockWorkspace = {}

        mockLogging = {
            info: sinon.stub(),
            debug: sinon.stub(),
        }

        mockSdkInitializator = {}
        mockOnMcpDisabled = sinon.stub()

        profileStatusMonitor = new ProfileStatusMonitor(
            mockCredentialsProvider,
            mockWorkspace,
            mockLogging,
            mockSdkInitializator,
            mockOnMcpDisabled
        )
    })

    afterEach(() => {
        clock.restore()
        sinon.restore()
        profileStatusMonitor.stop()
    })

    describe('start', () => {
        it('should start monitoring and log info message', () => {
            profileStatusMonitor.start()

            expect(
                mockLogging.info.calledWith('ProfileStatusMonitor started - checking MCP configuration every 24 hours')
            ).to.be.true
        })

        it('should not start multiple times', () => {
            profileStatusMonitor.start()
            profileStatusMonitor.start()

            expect(mockLogging.info.callCount).to.equal(1)
        })
    })

    describe('stop', () => {
        it('should stop monitoring and log info message', () => {
            profileStatusMonitor.start()
            profileStatusMonitor.stop()

            expect(mockLogging.info.calledWith('ProfileStatusMonitor stopped')).to.be.true
        })
    })

    describe('checkMcpConfiguration', () => {
        it('should return early if no bearer credentials', async () => {
            mockCredentialsProvider.hasCredentials.returns(false)
            profileStatusMonitor.start()

            await clock.tickAsync(0)

            expect(mockOnMcpDisabled.called).to.be.false
        })
    })

    describe('getMcpState', () => {
        beforeEach(() => {
            // Reset static state before each test
            ;(ProfileStatusMonitor as any).lastMcpState = undefined
        })

        it('should return undefined initially', () => {
            expect(ProfileStatusMonitor.getMcpState()).to.be.undefined
        })

        it('should return the last MCP state after it is set', () => {
            // Access the private static property through reflection for testing
            ;(ProfileStatusMonitor as any).lastMcpState = true
            expect(ProfileStatusMonitor.getMcpState()).to.be.true
            ;(ProfileStatusMonitor as any).lastMcpState = false
            expect(ProfileStatusMonitor.getMcpState()).to.be.false
        })

        it('should be accessible across different instances', () => {
            const monitor1 = new ProfileStatusMonitor(
                mockCredentialsProvider,
                mockWorkspace,
                mockLogging,
                mockSdkInitializator,
                mockOnMcpDisabled
            )

            const monitor2 = new ProfileStatusMonitor(
                mockCredentialsProvider,
                mockWorkspace,
                mockLogging,
                mockSdkInitializator,
                mockOnMcpDisabled
            )

            // Set state through static property
            ;(ProfileStatusMonitor as any).lastMcpState = true

            // Should be accessible from both instances
            expect(ProfileStatusMonitor.getMcpState()).to.be.true
        })
    })

    describe('static lastMcpState', () => {
        beforeEach(() => {
            // Reset static state before each test
            ;(ProfileStatusMonitor as any).lastMcpState = undefined
        })

        it('should maintain state across multiple instances', () => {
            const monitor1 = new ProfileStatusMonitor(
                mockCredentialsProvider,
                mockWorkspace,
                mockLogging,
                mockSdkInitializator,
                mockOnMcpDisabled
            )

            const monitor2 = new ProfileStatusMonitor(
                mockCredentialsProvider,
                mockWorkspace,
                mockLogging,
                mockSdkInitializator,
                mockOnMcpDisabled
            )

            // Initially undefined
            expect(ProfileStatusMonitor.getMcpState()).to.be.undefined

            // Set through internal mechanism (simulating state change)
            ;(ProfileStatusMonitor as any).lastMcpState = false

            // Both instances should see the same state
            expect(ProfileStatusMonitor.getMcpState()).to.be.false
        })
    })
})
