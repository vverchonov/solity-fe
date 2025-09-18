import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Web } from 'sip.js';
import axios from 'axios';
import { useWallet } from './WalletProvider';
import { useLogs } from './LogsProvider';
import { LAMPORTS_PER_SOL, Connection, PublicKey } from '@solana/web3.js';

const DISPLAY_NAME = 'solity';
const BACKEND_URL = 'https://api.sipcallers.com';

// Initialize Solana connection
const connection = new Connection(
    import.meta.env.VITE_RPC_URL || "https://eleonore-edy6fd-fast-mainnet.helius-rpc.com/",
    'confirmed'
);

const CallContext = createContext(undefined);

export const useCall = () => {
    const context = useContext(CallContext);
    if (context === undefined) {
        throw new Error('useCall must be used within a CallProvider');
    }
    return context;
};

export const CallProvider = ({ children }) => {
    const { walletAddress, connectWallet, disconnectWallet, isWalletConnected, walletProvider } = useWallet();
    const {
        logCallInitiation,
        logCallSipConnection,
        logCallStateChange,
        logCallDuration,
        logCallControl,
        logCallError,
        logError
    } = useLogs();

    const [callConfig, setCallConfig] = useState({
        username: '',
        password: '',
    });

    const [callState, setCallState] = useState({
        isConnected: false,
        isRegistered: false,
        currentCall: null,
        callStatus: 'idle', // 'idle' | 'connecting' | 'calling' | 'in-call' | 'incoming'
        remoteNumber: '',
        isMuted: false,
        isOnHold: false
    });

    const [logs, setLogs] = useState([]);
    const [walletBalance, setWalletBalance] = useState(0);
    const simpleUserRef = useRef(null);

    const addLog = (message) => {
        const timestamp = new Date().toLocaleTimeString();
        setLogs(prev => [...prev.slice(-9), `[${timestamp}] ${message}`]);
    };

    const getAudioElement = (id) => {
        const el = document.getElementById(id);
        if (!(el instanceof HTMLAudioElement)) {
            throw new Error(`Element "${id}" not found or not an audio element.`);
        }
        return el;
    };


    const disconnect = async () => {
        if (simpleUserRef.current) {
            try {
                await simpleUserRef.current.disconnect();
                addLog('Disconnected from server');
            } catch (error) {
                addLog(`Disconnect error: ${error}`);
            }
            simpleUserRef.current = null;
        }
    };

    // Helper function to clean up WebSocket connection and reset state
    const cleanupConnection = async () => {
        if (simpleUserRef.current) {
            try {
                await simpleUserRef.current.disconnect();
                addLog('WebSocket connection closed');
            } catch (error) {
                addLog(`WebSocket cleanup error: ${error}`);
            }
            simpleUserRef.current = null;
        }
    };

    const makeCall = async (targetNumber, callerID, credentials = null) => {
        if (!targetNumber || !callerID) {
            const errorMsg = 'Cannot make call: no target number or caller ID provided';
            addLog(errorMsg);
            logCallError(new Error(errorMsg), 'makeCall - validation');
            return;
        }

        // Log call initiation
        logCallInitiation(targetNumber, callerID);

        try {
            // If credentials are provided, create new SIP client with fresh credentials
            if (credentials) {
                addLog('Setting up SIP client with fresh credentials...');
                logCallSipConnection('connecting', { extension: credentials.extension, domain: credentials.domain });

                // Console log SIP credentials for debugging
                console.log('SIP Connection Credentials:');
                console.log('Username (extension):', credentials.extension);
                console.log('Password:', credentials.password);
                console.log('Domain:', credentials.domain);
                console.log('WSS URL:', credentials.wss);

                const options = {
                    aor: `sip:${credentials.extension}@${credentials.domain}`,
                    media: {
                        constraints: { audio: true, video: false },
                        remote: { audio: getAudioElement('remoteAudio') }
                    },
                    userAgentOptions: {
                        authorizationUsername: credentials.extension,
                        authorizationPassword: credentials.password,
                        displayName: DISPLAY_NAME
                    }
                };

                const simpleUser = new Web.SimpleUser(credentials.wss, options);
                simpleUserRef.current = simpleUser;

                // Set up event handlers
                simpleUser.delegate = {
                    onCallReceived: () => {
                        addLog('Incoming call received');
                        logCallStateChange('unknown', 'incoming', targetNumber);
                        setCallState(prev => ({ ...prev, callStatus: 'incoming' }));
                    },
                    onCallAnswered: () => {
                        addLog('Call answered');
                        logCallStateChange('ringing', 'in-call', targetNumber);
                        setCallState(prev => ({ ...prev, callStatus: 'in-call' }));
                    },
                    onCallHangup: () => {
                        addLog('Call ended');
                        logCallStateChange('in-call', 'idle', targetNumber);
                        setCallState(prev => ({
                            ...prev,
                            callStatus: 'idle',
                            currentCall: null,
                            isMuted: false,
                            isOnHold: false
                        }));
                        // Clean up WebSocket when call ends
                        cleanupConnection();
                    },
                    onCallHold: (held) => {
                        const action = held ? 'hold' : 'unhold';
                        addLog(held ? 'Call put on hold' : 'Call resumed from hold');
                        logCallControl(action, { phoneNumber: targetNumber });
                        setCallState(prev => ({ ...prev, isOnHold: held }));
                    },
                    onRegistered: () => {
                        addLog('SIP client registered');
                        logCallSipConnection('registered');
                        setCallState(prev => ({ ...prev, isRegistered: true }));
                    },
                    onUnregistered: () => {
                        addLog('SIP client unregistered');
                        logCallSipConnection('disconnected');
                        setCallState(prev => ({ ...prev, isRegistered: false }));
                    },
                    onServerConnect: () => {
                        addLog('Connected to SIP server');
                        logCallSipConnection('connected');
                        setCallState(prev => ({ ...prev, isConnected: true }));
                    },
                    onServerDisconnect: () => {
                        addLog('Disconnected from SIP server');
                        logCallSipConnection('disconnected');
                        setCallState(prev => ({
                            ...prev,
                            isConnected: false,
                            isRegistered: false,
                            callStatus: 'idle',
                            currentCall: null
                        }));
                    }
                };

                // Connect to SIP server but skip registration (already registered on server)
                await simpleUser.connect();
                addLog('SIP client connected (extension already registered)');
                setCallState(prev => ({
                    ...prev,
                    currentCall: simpleUser,
                    isConnected: true,
                    isRegistered: true // Mark as registered since extension is already registered
                }));
            }

            if (!simpleUserRef.current) {
                addLog('Cannot make call: SIP client not available');
                return;
            }

            addLog(`Calling ${targetNumber} with caller ID ${callerID}...`);
            logCallStateChange('connecting', 'calling', targetNumber);
            setCallState(prev => ({ ...prev, callStatus: 'calling', remoteNumber: targetNumber }));

            const target = `sip:${targetNumber}@${credentials?.domain || 'solityapp.net'}`;
            await simpleUserRef.current.call(target);

        } catch (error) {
            addLog(`Call failed: ${error}`);
            logCallError(error, 'makeCall - SIP call failure');
            logCallStateChange('calling', 'idle', targetNumber);
            setCallState(prev => ({ ...prev, callStatus: 'idle', remoteNumber: '' }));
            // Clean up WebSocket connection on call failure
            await cleanupConnection();
        }
    };

    const hangupCall = async () => {
        if (simpleUserRef.current) {
            try {
                await simpleUserRef.current.hangup();
                addLog('Call hung up');
                logCallControl('hangup', { phoneNumber: callState.remoteNumber });
            } catch (error) {
                addLog(`Hangup error: ${error}`);
                logCallError(error, 'hangupCall');
            }
            // Clean up WebSocket connection after hangup
            await cleanupConnection();
        }
    };

    const answerCall = async () => {
        if (simpleUserRef.current) {
            try {
                await simpleUserRef.current.answer();
                addLog('Call answered');
                logCallControl('answer', { phoneNumber: callState.remoteNumber });
            } catch (error) {
                addLog(`Answer error: ${error}`);
                logCallError(error, 'answerCall');
            }
        }
    };

    const toggleMute = async () => {
        if (simpleUserRef.current) {
            try {
                if (callState.isMuted) {
                    simpleUserRef.current.unmute();
                    addLog('Call unmuted');
                    logCallControl('unmute', { phoneNumber: callState.remoteNumber });
                } else {
                    simpleUserRef.current.mute();
                    addLog('Call muted');
                    logCallControl('mute', { phoneNumber: callState.remoteNumber });
                }
                setCallState(prev => ({ ...prev, isMuted: !prev.isMuted }));
            } catch (error) {
                addLog(`Mute toggle error: ${error}`);
                logCallError(error, 'toggleMute');
            }
        }
    };

    const toggleHold = async () => {
        if (simpleUserRef.current) {
            try {
                if (callState.isOnHold) {
                    await simpleUserRef.current.unhold();
                    addLog('Call resumed');
                    logCallControl('unhold', { phoneNumber: callState.remoteNumber });
                } else {
                    await simpleUserRef.current.hold();
                    addLog('Call put on hold');
                    logCallControl('hold', { phoneNumber: callState.remoteNumber });
                }
                setCallState(prev => ({ ...prev, isOnHold: !prev.isOnHold }));
            } catch (error) {
                addLog(`Hold toggle error: ${error}`);
                logCallError(error, 'toggleHold');
            }
        }
    };

    const sendDTMF = (digit) => {
        if (simpleUserRef.current && callState.callStatus === 'in-call') {
            try {
                simpleUserRef.current.sendDTMF(digit);
                addLog(`DTMF sent: ${digit}`);
                logCallControl('dtmf', { digit, phoneNumber: callState.remoteNumber });
            } catch (error) {
                addLog(`DTMF error: ${error}`);
                logCallError(error, 'sendDTMF');
            }
        }
    };

    // Wallet functions
    const handleConnectWallet = async () => {
        try {
            const result = await connectWallet();
            if (result.success) {
                addLog('Wallet connected');
            } else {
                addLog(`Wallet connection failed: ${result.error}`);
            }
        } catch (error) {
            addLog(`Wallet connection failed: ${error}`);
        }
    };

    const handleDisconnectWallet = async () => {
        try {
            await disconnectWallet();
            addLog('Wallet disconnected');
            setWalletBalance(0);
        } catch (error) {
            addLog(`Wallet disconnect failed: ${error}`);
        }
    };

    const refreshWalletBalance = useCallback(async () => {
        if (!walletAddress) return;

        try {
            const publicKey = new PublicKey(walletAddress);
            const balance = await connection.getBalance(publicKey);
            const solBalance = balance / LAMPORTS_PER_SOL;
            setWalletBalance(solBalance);
            addLog(`Wallet balance: ${solBalance.toFixed(4)} SOL`);
        } catch (error) {
            addLog(`Failed to fetch wallet balance: ${error}`);
        }
    }, [walletAddress]);

    // Update wallet balance when connected
    useEffect(() => {
        if (isWalletConnected && walletAddress) {
            refreshWalletBalance();
        } else {
            setWalletBalance(0);
        }
    }, [isWalletConnected, walletAddress, refreshWalletBalance]);

    useEffect(() => {
        return () => {
            if (simpleUserRef.current) {
                simpleUserRef.current.disconnect();
            }
        };
    }, []);

    const value = {
        callConfig,
        setCallConfig,
        callState,
        logs,
        disconnect,
        makeCall,
        hangupCall,
        answerCall,
        toggleMute,
        toggleHold,
        sendDTMF,
        addLog,
        // Wallet functionality
        walletAddress: walletAddress || null,
        walletBalance,
        isWalletConnected,
        connectWallet: handleConnectWallet,
        disconnectWallet: handleDisconnectWallet,
        refreshWalletBalance
    };

    return (
        <CallContext.Provider value={value}>
            {children}
            {/* Audio element for remote audio - required for sip.js */}
            <audio id="remoteAudio" autoPlay playsInline style={{ display: 'none' }} />
        </CallContext.Provider>
    );
};