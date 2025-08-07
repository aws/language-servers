/*!
 * Copyright Amazon.com, Inc. or its affiliates.
 * All Rights Reserved. SPDX-License-Identifier: Apache-2.0
 */

import { expect } from 'chai'
import * as sinon from 'sinon'
import { ProfileStatusMonitor } from './profileStatusMonitor'
import * as AmazonQTokenServiceManagerModule from '../../../../shared/amazonQServiceManager/AmazonQTokenServiceManager'

describe('ProfileStatusMonitor', () => {
    let profileStatusMonitor: ProfileStatusMonitor
    let mockCredentialsProvider: any
    let mockWorkspace: any
    let mockLogging: any
    let mockSdkInitializator: any
    let mockOnMcpDisabled: sinon.SinonStub
    let mockOnMcpEnabled: sinon.SinonStub
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
        mockOnMcpEnabled = sinon.stub()

        profileStatusMonitor = new ProfileStatusMonitor(
            mockCredentialsProvider,
            mockWorkspace,
            mockLogging,
            mockSdkInitializator,
            mockOnMcpDisabled,
            mockOnMcpEnabled
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

    describe('checkInitialState', () => {
        it('should return true when no profile ARN is available', async () => {
            sinon.stub(AmazonQTokenServiceManagerModule.AmazonQTokenServiceManager, 'getInstance').returns({
                getActiveProfileArn: () => undefined,
            } as any)

            const result = await profileStatusMonitor.checkInitialState()
            expect(result).to.be.true
        })

        it('should return true and log debug message on error', async () => {
            // Stub the private checkMcpConfiguration method to throw an error
            sinon
                .stub(profileStatusMonitor as any, 'checkMcpConfiguration')
                .throws(new Error('Service manager not ready'))

            const result = await profileStatusMonitor.checkInitialState()
            expect(result).to.be.true
            expect(mockLogging.debug.calledWith(sinon.match('Initial MCP state check failed, defaulting to enabled')))
                .to.be.true
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
                mockOnMcpDisabled,
                mockOnMcpEnabled
            )

            const monitor2 = new ProfileStatusMonitor(
                mockCredentialsProvider,
                mockWorkspace,
                mockLogging,
                mockSdkInitializator,
                mockOnMcpDisabled,
                mockOnMcpEnabled
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
                mockOnMcpDisabled,
                mockOnMcpEnabled
            )

            const monitor2 = new ProfileStatusMonitor(
                mockCredentialsProvider,
                mockWorkspace,
                mockLogging,
                mockSdkInitializator,
                mockOnMcpDisabled,
                mockOnMcpEnabled
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
